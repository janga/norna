# BL-123 Navigation JavaScript refactoring assessment

Completed on 2026-09-18 against `ff1701f`, the approved prototype's implementation
commit. **Recommend two small shared helpers, then resolve history behavior
before consolidating early state restoration. Retain the current document
navigation architecture and separate lifecycle phases.**

The [assessment](#assessment-results) below records the evidence, risks and
bounded follow-ups. No runtime code was changed during this assessment. The
scope and questions below are the original assessment brief.

## Purpose

Determine whether the JavaScript supporting smooth navigation needs focused
refactoring after the prototype. Produce concrete findings that help a
maintainer reduce complexity and regression risk while preserving the
verified reading and navigation behavior.

## Scope and boundaries

This is a high-priority analysis item immediately after
[BL-120 Smooth documentation navigation prototype](BL-120-smooth-documentation-navigation-prototype.md).
Review the resulting code and its interaction with existing navigation
scripts, using the prototype's recorded findings and reference revision.
Do not implement refactorings as part of this assessment.

Trace state restoration, disclosure motion, section tracking, scroll and
focus handling, history, prefetch and the page lifecycle. Include inline
scripts and their relationship to CSS and render readiness; module size or
duplication alone does not establish a problem. Limit adjacent-code review
to dependencies that can affect those behaviors.

This item does not decide a new navigation architecture, introduce a client
router, redesign the menus or change public configuration. `BL-054` Optional
instant navigation remains a separate, deferred product decision.

## Decisions made

- Give the assessment high priority after the navigation prototype.
- Separate analysis from any resulting implementation items.
- Judge proposed changes against the recorded behavior, browser differences
  and failure cases from the prototype.

## Preliminary proposals

Investigate these areas without presuming they require changes:

- **State ownership:** whether early restoration and later menu setup have
  clear responsibilities, especially saved scroll positions, open branches
  and synchronization between desktop and mobile menus.
- **Initialization and history:** ordering around parsing, first paint,
  transition snapshots and cached history entries; listener/observer
  lifetimes, cancellation and repeated setup where applicable.
- **Scroll and focus:** interactions between menu scrolling, document anchors,
  section following, disclosure animations and keyboard focus.
- **Prefetch and interruption:** request eligibility, timers, cancellation,
  rapid repeated navigation and failure behavior.
- **Browser accommodations:** which exceptions remain necessary, what
  evidence supports them and whether their purpose is clear at the call site.
- **Testability:** whether the first visible frames and first clicks are
  covered, and which proposed changes lack dependable regression checks.

Starting points in the current prototype are `navigationPrototype.ts`,
`NavigationPrototypeState.astro`, `TreeNavigationScript.astro` and
`SectionNavigationScript.astro`. Refresh this list against the completed
prototype rather than treating its current file boundaries as the intended
design.

## Risk and implementation approach

The assessment has low runtime risk because it produces findings and
recommendations. Any diagnostic experiment should use a disposable variant
and record its effect on timing.

A later refactoring can affect behavior even when the code looks equivalent.
For example, extracting an early inline restoration script into a deferred
module could move restoration past the first paint. Shared abstractions can
also obscure differences between initial arrival and history restoration.
The review must distinguish necessary timing from accidental complexity.

Recommend small changes with explicit preserved behavior, focused checks and
independently revertible commits. This follows the established meaning of
[refactoring](https://refactoring.com/): restructuring through small steps
that retain observable behavior. A required behavior change belongs in a
separate correction or design item. Performance benefits require measurement;
shorter code alone is not evidence of smoother navigation.

## Open questions

- Which responsibilities overlap enough to create a concrete maintenance or
  regression risk, and which apparently repeated logic serves different
  lifecycle requirements?
- Which browser-specific measures remain necessary after the prototype fixes?
- Which small changes would have enough benefit to justify their cost and
  regression risk? Retaining the current structure is a valid conclusion.

## Dependencies

Begin after [BL-120 Smooth documentation navigation prototype](BL-120-smooth-documentation-navigation-prototype.md)
is completed and committed as a reference revision with its findings,
verification results, visual review and remaining limitations recorded.
Reuse that evidence; do not rerun a broad browser matrix solely to begin
the code assessment.

## Analysis complete when

The report maps the relevant responsibilities and lifecycle ordering, then
prioritizes concrete findings. Each finding identifies the code involved,
supporting evidence, practical consequence, expected benefit, regression risk,
smallest proposed change and necessary verification. Keep uncertain concerns
separate from demonstrated defects.

Conclude with a recommendation to retain, simplify or defer each reviewed
area. Create separate, bounded implementation items only for changes supported
by the findings; the analysis is complete even if no refactoring is warranted.

## Ready for implementation when

A resulting implementation item has a concrete benefit, bounded change,
explicit behavior to preserve and suitable regression coverage. Include
human local inspection for visible behavior according to the project workflow.
Do not schedule a broad rewrite based solely on this assessment's existence.

## Assessment results

This assessment helps an engine maintainer choose which navigation code to
simplify while preserving the approved reading experience. It covers the
prototype and directly interacting navigation, search-return and reader-setting
code. It does not infer a performance gain from fewer lines or files.

### Reference revision and evidence

- Reference: `ff1701f` on `main`, after the user's visual approval and the final
  checks in [BL-120 Smooth documentation navigation prototype](BL-120-smooth-documentation-navigation-prototype.md#final-approval-and-verification).
- Read the early inline script, runtime navigation modules, their Astro callers,
  transition stylesheet and maintained tests. Read the installed Astro prefetch
  implementation in `node_modules/astro/dist/prefetch/index.js` for the locked
  dependency; no dependency update or external architecture assumption is needed.
- Compared the two visibility functions after removing comments/whitespace:
  their implementations are identical.
- Executed the actual early inline source and TypeScript-stripped tree runtime
  in disposable Node VM contexts with minimal DOM/storage stubs. Five stored
  input cases establish the decoder differences below. These are source-level
  probes, not browser, paint or performance measurements. The runtime files
  were not modified or instrumented in the live prototype.

The disposable runner and results are in
`.local/navigation-prototype/refactoring-assessment/`. The results are summarized
here so this assessment does not depend on retaining ignored artifacts. Existing
browser evidence is reused; no broad browser matrix was rerun for this analysis.

### Responsibilities and ordering

Line references in this assessment refer to `ff1701f`.

| Phase or responsibility | Owner | Ordering that must survive extraction |
| --- | --- | --- |
| Build opt-in and page markup | `astro.config.mjs:166`, `BaseLayout.astro:229`, `NavigationPrototype.astro` | Only the opt-in artifact receives transition CSS, the render expectation and prototype setup. Real anchors and native disclosures remain in HTML. |
| Appearance before content | `readerPreferencesScript.mjs`, emitted in the head | Stored appearance and reading preferences apply before the page is shown. Keep this independent from deferred navigation enhancement. |
| Tree restoration while parsing | `NavigationPrototypeState.astro:20` | Establish the menu height before assigning saved scroll. Apply newly parsed branches, disconnect the child-list observer at DOMContentLoaded, and refresh at `pagereveal`. |
| Persistent state and tree controls | `TreeNavigationScript.astro:14` | Normalize/restore state, then enable listeners and controls. Share branch state across desktop/mobile, but keep scroll positions scoped. Filtering has a temporary snapshot and suppresses persistence. |
| Disclosure motion | `navigationPrototype.ts:33` | Keep details open while animating, then commit the intended state. Finish motion in capture listeners before tree controls or page departure save state. Preserve inertness and focus. |
| Active heading and menu following | `SectionNavigationScript.astro:95`, `navigationFollowing.ts:51` | Section tracking writes `aria-current`; following reveals the appropriate rail entry without changing document position, focus or URL. User menu interaction pauses following. |
| Animated marker | `navigationPrototype.ts:97` | Observe the heading marker chosen above; do not become a second authority for which heading is current. Batch geometry work with requestAnimationFrame. |
| Article arrival and history | `navigationPrototype.ts:134`, `SectionNavigationScript.astro:68` | Prototype suppresses baseline initial-hash alignment, waits for load/fonts/two frames, and skips hash alignment on history restoration or interrupted arrival. Same-page links retain native anchors. |
| Search return and display changes | `searchNavigation.ts:92`, `readerPreferencesScript.mjs` | Search restores a saved reading position after font/anchor layout; display changes preserve the current content position. These are separate reasons for document scroll writes. |
| Intent prefetch | `navigationPrototype.ts:173` and Astro's `prefetch` | Norna selects eligible intent and owns the 100ms timer; Astro handles URL deduplication, connection checks and transport. |

The prototype setup has one injected call per document. History handlers refresh
existing state; they do not call setup again. The inspected code contains no
client router or `astro:after-swap`/`astro:page-load` initialization path. There is
no demonstrated need for a generic mount/unmount manager. Removing document
listeners on every `pagehide` would need a matching cached-page resume policy.

Do not combine all scroll writes into one function merely because they write
coordinates. Menu restoration, following, direct hashes, search return and
preserving a reading position after a layout change have different contracts.

### Findings and proposed changes

#### 1. Share the existing visibility predicate

**Evidence:** `visible` in
[`navigationPrototype.ts`](../../../src/lib/navigationPrototype.ts) lines 3–10
and `isDisplayed` in
[`navigationFollowing.ts`](../../../src/lib/navigationFollowing.ts) lines 1–9
have identical implementations. Both check layout rectangles, CSS visibility
and closed ancestor disclosures. This is not a check for being inside the
viewport or for receiving pointer input.

**Consequence and benefit:** fixing a closed-disclosure edge case in one copy
could leave animated markers and automatic following with different ideas of
what is displayed. One clearly named helper removes that maintenance risk.

**Smallest change:** share this exact predicate between its existing runtime
callers. Keep their scheduling and callers intact. Do not expand the change to
all visibility or focus checks across the application; those can have different
requirements, especially during inert closing animations.

**Risk and verification:** low, provided the helper remains synchronously
available to both modules and its semantics are unchanged. Verify closed
ancestors, the visible summary, CSS-hidden entries and entries outside the
viewport. Run the relevant navigation-following and prototype disclosure cases.
Proposed item: [BL-124 Share navigation visibility semantics](BL-124-share-navigation-visibility-semantics.md).

#### 2. Use the category destination model in all prototype link renderers

**Evidence:** `SiteNavigation.astro:93` builds and uses the category destination
model, and `SitePage.astro:109` uses the model already present on the page.
`NavigationPageTree.astro:18` independently reimplements the first-listed-child
rule. The three paths currently agree for the reviewed data. The earlier
prototype investigation demonstrated the consequence of inconsistent link
destinations: a bare category redirect document could appear between two
complete reading pages.

**Consequence and benefit:** another change to category resolution could reach
header links, tree links and generated listings at different times. One model
lookup prevents that drift without changing navigation timing.

**Smallest change:** make tree/category link rendering consume the existing
resolved destination model, using one small destination selector where needed.
Keep category URLs for listings whose first listed child is another category;
do not recursively choose a descendant page. Preserve the prototype gate and
the baseline category URLs. Passing the existing model is preferable to
introducing another client-side resolver.

**Risk and verification:** low to medium, on the server-rendered link contract.
Check page-first and category-first collections, excluded entries, base paths,
ordinary pages and all three link locations. Retain the category-title/arrow,
generated-list and disabled-JavaScript browser checks. Proposed item:
[BL-125 Reuse category destinations in navigation rendering](BL-125-reuse-category-navigation-destinations.md).

#### 3. Early and deferred state decoding already differ

**Evidence:** `NavigationPrototypeState.astro:28–58` parses both storage records
inside one try/catch, falls back from a JSON-null shared value to scoped state,
and accepts only numeric `scrollTop`. `TreeNavigationScript.astro:42–56` catches
each decode separately, coerces numeric scroll values and treats an existing
JSON-null shared record as empty state.

The source-derived probes used one initially closed, non-current branch and
the actual source bodies:

| Stored input | Early result | Deferred result |
| --- | --- | --- |
| Valid scoped/shared records: open branch, scroll 240 | Open, 240 | Open, 240 |
| Malformed scoped JSON, valid shared open branch | Closed, 0 | Open, 0 |
| Valid scoped record, shared JSON `null` | Open, 240 | Closed, 240 |
| Scoped scroll value `"240"`, no shared record | Closed, 0 | Closed, 240 |
| Neither record exists | Closed, 0 | Closed, 0 |

**Consequence and benefit:** these paths can disagree about the state to apply
before and after paint. This is a demonstrated interpretation difference for
abnormal stored input, not a reproduced flash or evidence that normal Norna
writes create these values. One decoder and explicit restoration policy would
make the two phases easier to keep consistent.

**Smallest change:** first characterize the current deferred decoder as the
reference contract, including absent, invalid and blocked storage. Share its
normalization, key construction and disclosure decisions without moving the
early application into a deferred module. Generate or embed the early code
from shared source while retaining the parser-time call, child-list observer
and `pagereveal` refresh. This changes abnormal early-state handling and must
be described as a consistency correction, not only cosmetic extraction.

The duplicated scrollport calculation (`NavigationPrototypeState.astro:24`
and `navigationPrototype.ts:21`) has the same formula but different execution
times. Keep both calls: early restoration needs a usable scroll limit; the
later observer handles changing notices and viewport size. Sharing the formula
is optional and must not turn into one late measurement or an article-scroll
listener.

**Risk and verification:** medium to high because a small timing shift can
restore the old first-frame flash. Resolve the history discrepancy below
before changing this area. Verify parity between the actual emitted early code
and runtime decoder, first-frame tree geometry, current ancestors versus an
explicitly closed current outline, desktop/mobile synchronization, filtering,
blocked storage, reduced motion and history. Proposed item:
[BL-127 Align early and deferred navigation state interpretation](BL-127-align-navigation-state-interpretation.md).

#### 4. Resolve the history discrepancy before changing arrival ownership

**Evidence:** `navigation-prototype.spec.ts:338` records a known WebKit failure:
arrive at `reference/site/pages/#names-and-order`, scroll 220px further, follow
URLs and links, then go Back. Earlier instrumentation saw the saved position at
`pagereveal`, then movement to the fragment by `load` without an intervening
script scroll call. Installed Safari restored the saved position in its tested
cached-history sequence. These are distinct browser/input conditions.

**Consequence and benefit:** history currently lacks a passing maintained
prototype assertion. Moving arrival logic between scripts would make a new
regression harder to distinguish from this known limitation. Diagnosis gives
that future change a reliable comparison.

**Smallest change:** compare the same case in built output and development,
with cached and new documents where observable. Record the lifecycle events,
font readiness, native versus script movement and original/changed hashes.
Correct the identified cause or, if it is in the runner, demonstrate that with
a minimal case and correct the runner. Do not relax the position assertion or
add a broad user-agent workaround.

**Risk and verification:** investigation is low risk; an arrival correction can
affect direct hashes, Back/Forward, interrupted arrival and search return.
Keep these checks together with ordinary/native-link fallbacks and reduced
motion. This is a correctness follow-up, separate from refactoring:
[BL-126 Resolve prototype history restoration discrepancy](BL-126-prototype-history-restoration.md).

### Areas to retain or defer

| Area | Decision and reason | Boundary for a later change |
| --- | --- | --- |
| Disclosure animation | Retain. Destination state, reversal, inertness, keyboard focus and settlement before controls/departure are already localized in one function. | Add interruption checks before changing this function: leave during motion, filter/Collapse all during motion, and reduced-motion change during motion. Preserve capture-listener ordering. |
| Section tracking, following and marker rendering | Retain separate owners. Tracking chooses the heading; following scrolls only a menu; the prototype marker is a visual consumer. | Share the visibility predicate, but do not replace these responsibilities with a global navigation controller. |
| Prefetch | Retain. No `data-astro-prefetch` attributes or prefetch-all are enabled by Norna; the custom intent logic controls its requests. Astro already supplies transport and deduplication. | The current cancel function cancels pending intent, not an already-started fetch. Changing request cancellation or Astro strategy would be behavior work. Check rapid retargeting, focus departure, external/download/new-tab/query links before such work. |
| Listener and observer lifetime | Retain document ownership. Setup is injected once and pageshow/pagereveal refresh existing handlers. The parser observer explicitly disconnects. | No leak or repeated-setup fault was demonstrated. Revisit teardown only with a concrete retained-document or client-router lifecycle requirement. |
| Scrollport sizing | Retain the early calculation and later resize/font/pageshow updates. Their timing addresses the measured clipped menu end and preserves height while reading. | Do not add document-scroll resizing. If sharing the formula, keep both call sites and their guards. |
| Storage writes and whole-body marker observation | Defer optimization. Saving all disclosure state during menu scrolling and scanning outlines after relevant attribute changes are possible costs, not measured bottlenecks. | Profile a representative long tree before throttling persistence or narrowing observation. A final pagehide save must remain reliable if batching is ever introduced. |
| File structure and naming | Keep the existing five setup functions in the 215-line prototype module. Use precise shared-helper names and explain each lifecycle boundary where it is wired. | File size alone does not justify splitting this into a framework or moving early inline code into modules. Avoid repository-wide renaming and formatting churn. |

Keep the browser accommodations supported by the prototype evidence:

- Safari's left tree stays in the root transition snapshot; the recorded A/B
  inspection found that a separate scroll-container snapshot could blank.
- Constant label weight and stable outline placement address measured layout
  changes. They are presentation contracts, not JavaScript duplication to remove.
- Unsupported transition behavior retains ordinary document navigation.
  Reduced motion retains immediate movement and native controls.
- The Playwright Chromium `RenderDocument` launch adjustment belongs to the
  diagnostic harness. Do not copy it into Norna runtime logic or equate the
  Playwright WebKit engine with installed Safari.

The [recorded Linear comparison](BL-120-smooth-documentation-navigation-prototype.md#linear-comparison)
still informs the decision: in the measured flow, Linear retained its menu DOM
and replaced the article. Norna creates a new document and restores an equivalent
menu before it is displayed. The shared visible outcomes are stable labels,
positions and controlled movement. Copying Linear's client routing is a separate
architecture decision under `BL-054` Optional instant navigation, not code cleanup.

### Verification gaps and sequence

The maintained prototype tests sample early geometry and exercise the first five
menu clicks after header navigation. Their click helper waits until actual link
text receives pointer input after transition snapshots. They do not establish
behavior for a click during an active snapshot, and geometry does not establish
that every painted frame is free of flashing. Existing native-browser inspection
and the user's visual approval remain part of the evidence.

The initial Vite module-import message recorded in the final prototype checks
also remains unexplained. A successful later ready-state check cannot establish
an error-free first document. If modifying arrival setup, capture page errors and
failed requests from the first load and compare built output before attributing
the message to Norna or changing production code. No production defect from this
message has been demonstrated.

Recommended implementation order, with a separate commit for each:

1. [BL-124 Share navigation visibility semantics](BL-124-share-navigation-visibility-semantics.md).
2. [BL-125 Reuse category destinations in navigation rendering](BL-125-reuse-category-navigation-destinations.md).
3. [BL-126 Resolve prototype history restoration discrepancy](BL-126-prototype-history-restoration.md).
4. [BL-127 Align early and deferred navigation state interpretation](BL-127-align-navigation-state-interpretation.md),
   after the history behavior is understood and its regression assertion passes.

The first two are narrow refactorings. The third is diagnosis/correction; the
fourth includes a correction to abnormal stored-state handling. Do not hide those
behavioral changes in a formatting commit. No new public configuration, menu
redesign, client router or removal of browser fallbacks is part of this sequence.

Assessment verification consists of the source-derived probe above,
`npm run test:documentation` and `git diff --check`. Runtime checks from the
reference commit were reused; no build or browser matrix was repeated for this
documentation-only assessment. Runtime implementation remains separate.
