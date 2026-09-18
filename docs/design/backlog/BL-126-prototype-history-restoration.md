# BL-126 Resolve prototype history restoration discrepancy

Completed on 2026-09-18. The user approved the local history correction after
the focused automated checks passed.

## Problem and evidence

The opt-in prototype's maintained WebKit case did not restore the reading
position after returning to a page originally entered through a fragment.
At reference commit `ff1701f`, the final position assertion in
`tests/navigation-prototype.spec.ts` is an explicit expected failure.

The recorded sequence is:

1. Open `/norna/reference/site/pages/#names-and-order` at 1440×1000.
2. After arrival settles, scroll 220px further and record the document position.
3. Follow the menu link to `/norna/reference/site/urls/`.
4. Go Back and compare the restored document position with the recorded value.

Prior probes saw the saved position at `pagereveal`, then movement to the fragment
by `load` without an intervening script scroll call. Installed Safari passed its
tested cached-history sequence. This difference does not establish a browser
bug, a Norna bug, or a runner bug by itself.

See [BL-120 Smooth documentation navigation prototype](BL-120-smooth-documentation-navigation-prototype.md#2026-09-17-history-limit-and-verification-boundary)
and [BL-123 Navigation JavaScript refactoring assessment](BL-123-navigation-javascript-refactoring-assessment.md#4-resolve-the-history-discrepancy-before-changing-arrival-ownership).
This is distinct from [BL-119 Direct-hash positioning in static previews](BL-119-static-preview-hash-positioning.md),
which concerns initial arrival in the ordinary top-navigation fixture.

## Bounded investigation and correction

Reproduce only this sequence first, comparing development and built output.
Record `pagereveal`, `load`, `pageshow.persisted`, navigation type, fonts,
hash and scroll writes. Distinguish cached-page restoration from a new document.
Use installed Safari as a separate comparison rather than substituting its
result for WebKit. Inspect first-load errors as well: the Vite import warning
in the prototype logs must not be assumed to cause the history discrepancy.

Change only the identified cause. If the runner is responsible, prove it with a
minimal case and correct the runner. If Norna is responsible, keep native history
and ordinary anchors unless evidence requires a narrower intervention. Do not
relax the one-pixel position assertion, swallow errors or introduce a blanket
user-agent workaround to get a passing run.

## Completion criteria

- The maintained reproducer passes without an expected-failure marker; the
  diagnosis explains the earlier Safari/WebKit difference or states the exact
  remaining environmental boundary.
- Direct fragments, Back/Forward, interrupted initial arrival, same-page anchors,
  search return and reduced motion retain their intended reading positions.
- Visible corrections receive local human review and focused verification.
  Promote the prototype to supported behavior only after this limit is resolved.
- Record the evidence and commit the correction separately from refactoring.

Ready for diagnosis after the completed assessment. Resolve before
[BL-127 Align early and deferred navigation state interpretation](BL-127-align-navigation-state-interpretation.md),
so restoration changes have a passing history comparison.

## Diagnosis on 2026-09-18

The failure occurs during a new-document history traversal. WebKit first
restores the saved position at `pagereveal` while the document is still
`interactive`. After deferred modules finish, native fragment scrolling moves
the document back to its original anchor before `load`. Instrumented
`scrollTo`, `scrollBy` and `scrollIntoView` calls contain no intervening Norna
scroll write.

An isolated HTTP server reproduced the same sequence without Norna. Its first
page has a fixed Next link, a 1000px header, a 3000px `main` with `id="target"`,
and an external module whose response is delayed by 180ms. Open `#target`,
scroll 220px further, follow Next and go Back. The module merely assigns a
boolean; there is no navigation or scrolling script in the page.

| Comparison | Saved position | Final position | Result |
| --- | ---: | ---: | --- |
| Minimal HTML without a deferred module | 1220px | 1220px | Preserved |
| Minimal HTML with a delayed module | 1220px | 1000px | Returned to anchor |
| Built Norna prototype | 1161px | 942px | Returned to anchor |
| Development Norna prototype | 1161px | 942px | Returned to anchor |
| Minimal page with the bounded guard below | 1220px | 1220px | Preserved |
| Built Norna with the same guard | 1161px | 1161px | Preserved |

The problem reproduced in Playwright 1.61.1 / WebKit 26.5 with both headless and
visible test windows, and in an isolated Playwright 1.63.0 / WebKit 26.6
installation. No project dependency was upgraded. Changing only the render-ready
marker or marking a module as render-blocking did not reliably resolve the
minimal case, so those experiments were discarded.

This establishes behavior outside Norna's own scripts; it does not distinguish
upstream WebKit from Playwright's browser patches. The built run had no page
errors and still failed. The development-only module-import warning is therefore
not a prerequisite for this failure. Its independent cause remains unassigned.

The earlier installed Safari 26.6.2 result used a cached document and restored
the saved position. A new Safari comparison opened an automation session but
timed out before yielding a usable measurement. The new-document Safari case
remains unverified; the old cached result must not be presented as proof of it.

## Bounded correction

An early inline guard in `NavigationPrototype.astro` acts only when all four
conditions hold at the initial `pagereveal`: the URL has a fragment, navigation
is `back_forward`, loading has not completed, and scroll restoration is `auto`.
The browser has already restored the position at that event. The guard changes
restoration to `manual` only until `load` or `pagehide`, preventing the subsequent
native fragment scroll. Both release paths restore `auto` and remove their
listeners. The guard runs once per document.

This preserves native history entries and positions. It neither stores reading
positions nor performs a scroll, and it has no user-agent branch. Initial
fragments, reloads, completed/cached documents, fragment-free URLs and an existing
manual owner remain untouched. The prototype opt-in boundary is unchanged.

## Verification checkpoint

- The original maintained Back reproducer passed after removing its expected
  failure marker, with the existing one-pixel assertion unchanged. That first
  command subsequently failed while cleaning up its server (`kill EPERM`);
  the test passed, but the command is not recorded as a successful full run.
  No listener remained on its test port afterwards.
- `npm exec -- playwright test tests/navigation-history-lifecycle.spec.ts`:
  7 cases passed. These run the actual inline script against event/history
  stubs, checking release on load and aborted departure, listener cleanup and
  the unaffected entry types. They supplement browser geometry checks.
- `NORNA_NAVIGATION_PROTOTYPE=1 node scripts/test-navigation.mjs --site-dir site tests/navigation-prototype.spec.ts`:
  all 18 cases passed, with successful server cleanup. This includes two
  Back/Forward cycles with ordinary and reduced motion, interrupted initial
  arrival, direct and same-page fragments, and return from search.
- `NORNA_NAVIGATION_PROTOTYPE=1 NORNA_INTERNAL_STATE_DIR="$PWD/.local/navigation-prototype/history-fixed-build/.norna" npm run build`:
  passed; 78 pages and 68 indexed pages.
- The same instrumented history sequence against the actual corrected build,
  served without HTML transformations, preserved 1161px through `pagereveal`,
  `DOMContentLoaded`, `load` and `pageshow`. It was a new document, and no page
  errors were reported.
- Registered scratch captures at desktop/dark and mobile/light were inspected;
  the layout is unchanged. The user approved local history review at
  `/norna/reference/site/pages/#names-and-order` on port 4399 on 2026-09-18.
- `npm run test:documentation` and `git diff --check`: passed.

The ordinary navigation suite passed all 63 cases for the preceding category
refactoring. It was not repeated for this prototype-only guard. The full release
chain, native Safari cold-history verification and prototype promotion are not
claimed. The approved correction is committed separately before the
state-interpretation refactoring.
