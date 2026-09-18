# Navigation latency investigation

The opt-in navigation prototype now keeps the article in the viewport's root
snapshot instead of capturing it as a separate View Transition image. In
installed Safari 26.6.2, this reduced the measured time from clicking Examples
to the first contentful paint of Reference from 221–226ms to 51–57ms in a local
production build. **The user approved the visual result on 2026-09-18.**
The maintained regression run passed on 2026-09-19 under
[BL-129 Regression tests for the navigation latency correction](backlog/BL-129-navigation-latency-regression-tests.md):
22 passed, no failures or skips.

The trade-off is explicit: the article changes without its previous 160ms
crossfade. The header and outline remain separate, unanimated snapshots. The
left menu remains in the root snapshot, as required by the earlier Safari
blank-menu finding. Disclosure motion, constant label weights, early menu
restoration, render readiness and history handling are unchanged.

This is a follow-up to
[BL-120 Smooth documentation navigation prototype](backlog/BL-120-smooth-documentation-navigation-prototype.md).
It does not enable the experiment by default or introduce a public setting.

## Report and measurement

On 2026-09-18 the user reported a slow change from `/norna/examples/` to
`/norna/reference/`, particularly in Safari. The initial Chrome and Playwright
WebKit measurements did not establish Safari's performance. Subsequent runs
used the installed Safari through SafariDriver, with its test window visible
and focused at a 1440×1048 content viewport.

Click timestamps were recorded in the source document, then compared with
Navigation Timing and Paint Timing entries in the destination. These are
browser measurements, not the time taken by a WebDriver command to return.
First contentful paint is not proof that an article crossfade has finished.
The isolated comparisons therefore also recorded `pagereveal`, transition
readiness and transition completion.

The following measurements use four actual link clicks per case. The built
pages were served locally with cache headers; these are not measurements of
GitHub Pages or a remote network.

| Safari case | Before | Approved correction |
| --- | --- | --- |
| Development server on port 4399 | 355–528ms | 160–179ms |
| Local production build | 221–226ms | 51–57ms |

The original build was made from the approved prototype before this CSS
change. The correction was rebuilt from source with isolated engine state.
The final measurements used the actual pages without diagnostic HTML or CSS
transformations.

## Isolating the cause

A temporary local server inserted diagnostic styles and event recording into
the original built pages. It disabled HTML caching between variants while
retaining asset caching. This kept the source files and live review server
unchanged. The complete comparison changed one condition at a time.

| Diagnostic variant | First contentful paint | Observation |
| --- | --- | --- |
| Original article transition | 230–317ms | Three clicks; the first was slowest. |
| Article animation duration set to 0ms | 223–236ms | Three clicks; the wait remained. A separate check confirmed that both animation durations were actually zero. |
| Cross-document transitions disabled | 41ms | Three clicks; the wait disappeared. |
| Article snapshot disabled, other snapshots retained | 42–47ms | Two clicks; the wait disappeared while the transition mechanism remained enabled. |
| Only the article snapshot retained | 228–248ms | Two clicks; the wait remained. |
| Article blend mode changed to normal | 221–224ms | Two clicks; the wait remained. |
| HTML render-readiness link removed | 235–272ms | Two clicks; the wait remained. |

In the normal and zero-duration comparisons, the transition could report
ready around 50ms after the click while the first contentful paint occurred
around 230ms. Transition readiness alone therefore cannot pass a latency
check for this case.

Clipping or limiting the article's height also brought the first paint down
to 41–48ms, but transition completion then took about 1.7 seconds. Those
variants additionally cut off article content, so they were rejected. They
are diagnostic evidence, not acceptable rendering strategies.

The interventions isolate the extra wait to the separately captured article
in this Safari flow. They do not establish the exact internal WebKit
allocation, rasterization or compositing cost. Reducing the fade duration or
removing the render-readiness guard would not address the measured cause.

## Correction and verification

The correction removes the article's `view-transition-name` and its unused
crossfade rules from `src/styles/navigation-prototype.css`. It applies the
same snapshot arrangement across browsers, without Safari detection. The
existing viewport snapshot carries the article together with the left menu.
The real page links and navigation lifecycle remain intact.

The isolated opt-in `npm run build` passed, building 78 pages and indexing
68 pages. Registered local captures were made for desktop light/dark and
mobile light/dark, including the compact menu. The final Safari timing runs
confirmed `view-transition-name: none` on the article, visible/focused test
windows and successful arrival initialization.

Focused interaction checks passed in installed Safari 26.6.2, Chrome
153.0.8010.48, Firefox 156.0 and Brave using Chromium 153.0.8010.48. Each run
covered Examples to Reference, the first five left-menu page clicks, opening
and closing a deep group, direct fragment arrival, Back/Forward restoration
past an original fragment, and a generated category-overview link. Existing
labels retained their position and weight across the five page clicks.
Deep collapse allowed the necessary scroll-limit adjustment; expansion and
history checks retained their expected positions.

The first Safari interaction run stopped at deep collapse because the test
adapter replaced the clicked chevron with its enclosing summary, whose center
can hit the category link. Targeting the actual element under the pointer
corrected the test, and the complete Safari sequence passed. No application
change was made in response to that test failure. Safari used a temporary
local proxy only to record page events; the final timing comparison above
used the ordinary URL directly.

The exploratory interaction command was
`node .local/navigation-prototype/latency-interactions.mjs <browser> <label>`.
The final build command was
`NORNA_NAVIGATION_PROTOTYPE=1 NORNA_INTERNAL_STATE_DIR="$PWD/.local/navigation-prototype/latency-fix-build/.norna" npm run build`.
The captures were inspected through `npm run review:capture -- scratch` for
`reference/` (desktop dark and mobile light with the compact menu),
`examples/` (desktop light), and `reference/site/pages/` (mobile dark).

These checks establish navigation behavior and settled layout; they do not
replace human inspection for a fleeting visual flash. The user completed that
visual review on 2026-09-18 and approved the result. The user then requested
that the remaining maintained regression tests become a separate prioritized
backlog item. The result of that run is recorded below. The full release test
chain has not been run.

Disposable timing probes and JSON results are in
`.local/navigation-prototype/`, with names starting `safari-route-timing-` and
`route-timing-`. Interaction records use `latency-interactions/`. These
artifacts include rejected diagnostic variants and must not be treated as
the approved implementation.

## Maintained regression result, 2026-09-19

Tested clean commit `a81a8cb`, including the approved correction from
`7fb98da`, with this exact command:

```sh
NORNA_NAVIGATION_PROTOTYPE=1 node scripts/test-navigation.mjs --site-dir site tests/navigation-prototype.spec.ts
```

Playwright WebKit ran all 22 tests with one worker: **22 passed, 0 failed,
0 skipped in 45.0 seconds**, approximately one minute including isolated
server startup and cleanup. The opt-in flag was enabled; the prototype's
readiness assertions and the suite's nonzero executed count confirm that the
tests were not bypassed. No application or test repair was needed.

Coverage includes early state restoration, the first five menu clicks after
header navigation at two widths, deep menu position, disclosure motion and
keyboard behavior, filtering and compact-menu state, intent prefetch,
navigation without JavaScript, category destinations, fragment alignment,
menu clipping and end reachability, prose/external links, search return, and
Back/Forward reading position with and without reduced motion.

The first launch was blocked before server startup by sandbox `listen EPERM`
on localhost. The same command then ran with local-server permission; this
was an infrastructure retry, not a failed behavior assertion. The development
server also reported absent built Pagefind assets on the search page. The
search-return check passed; it does not test the generated search index.

This result adds maintained functional coverage to the earlier installed
browser and human visual evidence. It supplies neither a new Safari latency
measurement nor proof that every transient flash is absent. The unchanged
implementation did not warrant repeating the fixture/preset suites, build,
installed-browser measurements or full release chain. Documentation and
whitespace checks accompany this result's commit.
