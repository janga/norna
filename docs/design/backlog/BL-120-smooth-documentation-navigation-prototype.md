# BL-120 Smooth documentation navigation prototype

## Purpose

Evaluate whether Norna can make moving between documentation pages feel
continuous: a stable navigation frame, short and coherent menu motions, quick
page changes, and accurate scrolling. The user selected the whole experience,
including page changes, menus and scrolling, and requested a prototype on
2026-09-17.

## Scope and boundaries

Build a review-only prototype against a physical copy of the documentation
site in `.local/test-sites/scratch/site/`. Use the registered `scratch` review
target and keep the ordinary `docs` target available for comparison. Include
Getting Started, Reference and FAQ, so the sample covers category destinations,
long outlines, nested branches and links between global areas.

Enable the prototype explicitly for its review server. Do not add a supported
configuration key, change released defaults, or publish it as a finished
feature. Its source must be reviewable and reproducible from the repository;
the copied site and captures remain disposable local output.

## Decisions made

- Start with browser-native cross-document View Transitions and ordinary HTML
  links. Keep normal browser history, opening links in new tabs, direct URLs
  and navigation without JavaScript.
- Preserve the existing page hierarchy and reading layout during this trial.
- Keep Appearance consistent during page changes, including category and alias
  destinations. Motion must respect the reader's reduced-motion preference.
- Request only an intentionally targeted next page for prefetching, using
  Astro's existing support; never preload the entire navigation tree.
- Implement the prototype after this brief is committed. Human inspection
  precedes broad browser regression work and committing the visual result.
- Keep the investigation record in this brief: document comparisons before
  running them, then record results and resulting decisions separately from
  user observations and unverified hypotheses.

## Expansion position requirement

When the reader expands a category, page-child branch or heading outline in
the left menu, the activated heading must keep its vertical position within
the visible menu area, throughout the expansion and after it settles. This
applies at every nesting level and every menu scroll position. Content below
the heading may move.

Verify the heading's position before activation, during the animation and
afterward, with mouse and keyboard activation near the top and bottom of a
long menu. Include reduced motion. Checking only the final position is not
sufficient. This expansion requirement was accepted by the user on 2026-09-17;
the collapse trial below defines the separate rule when content is removed.

## Collapse position trial

For the trial selected by the user on 2026-09-17, keep the activated heading
at the same vertical position during collapse whenever the remaining menu
content permits it. If removing content makes the previous scroll position
exceed the new scroll limit, allow only the adjustment needed to reach that
limit. The heading must remain visible, and keyboard activation must retain
focus on it.

Let this necessary movement follow the existing collapse animation. Use no
animation when reduced motion is requested. Do not add trailing empty space
or a second repositioning after the animation solely to preserve the old
position. This follows the behavior observed in Linear; it is a prototype
choice awaiting visual review, not an accessibility-standard requirement.

The current prototype already uses height/opacity animation and native scroll
limits. The completed browser comparison recorded stable menu positions when
opening branches and when
closing near the top. Closing the last branch produced only adjustment to
the shrinking scroll limit in Chrome, Brave, Firefox and Safari. Selecting
this trial therefore required no further runtime change. The separate Safari
page-click flash has a [snapshot correction](#6-safari-scroll-container-snapshot-correction)
awaiting visual review; position measurements alone did not reveal that fault.

## Preliminary proposals

- Keep the surrounding frame visually still and use a short fade for the
  article. Starting durations are trial values, not a general design rule.
- Animate navigation disclosure height and opacity over approximately
  180 milliseconds, with a slightly faster chevron rotation. Rapid repeated
  activation must reverse cleanly and leave the correct expanded state.
- Carry existing open branches and navigation scroll positions across pages
  without showing the tree reset first.
- Animate the active outline marker without moving the labels or taking
  keyboard focus away from the reader.
- Use native smooth scrolling for same-page links, while initial hash loads
  and history restoration reach their correct positions without a long sweep.

Reference observations and the reason they fit reading-oriented pages are
recorded in the [preset design guide](../preset-design-guide.md#navigation-continuity-prototype).

## Dependencies and related work

- `BL-054` Optional instant navigation remains a separate, deferred product
  decision. This prototype provides evidence before adopting a client router.
- [BL-119 Direct-hash positioning in static previews](BL-119-static-preview-hash-positioning.md)
  records an existing baseline failure. Check initial hashes explicitly in the
  prototype and report remaining differences; do not weaken its assertions.
  Resolve any remaining anchor defect before promoting this trial to released
  behavior.
- The prototype does not establish a public configuration contract, so public
  reference documentation follows a later decision to ship it. Its local
  review procedure belongs in this brief.
- [BL-123 Navigation JavaScript refactoring assessment](BL-123-navigation-javascript-refactoring-assessment.md)
  is the high-priority follow-up after this prototype, using its recorded
  behavior and findings to assess whether focused restructuring is warranted.

## Review and acceptance

1. Open the baseline and prototype at the same documentation page. Compare
   adjacent page links, category links, global navigation and browser Back.
   Include the [blink investigation sequence](#blink-investigation-plan-and-results);
   testing only repeated clicks inside an already stable area is not sufficient.
2. Check desktop and mobile, light and dark Appearance, including stored reader
   preferences. Inspect screenshots before handing the prototype to the user.
3. Open and close nested categories, page-child branches and heading outlines,
   using mouse and keyboard and reversing a motion before it finishes.
   Verify the [expansion position requirement](#expansion-position-requirement)
   in the left menu throughout each expansion.
   For the [collapse position trial](#collapse-position-trial), also close a
   branch after scrolling to the menu's end. Check the heading's visibility,
   keyboard focus and movement throughout the collapse, including the frame
   after the animation finishes.
4. Check same-page anchors, direct links with hashes, reload, Back/Forward and
   retained menu positions. Verify that category redirects keep their correct
   destination and Appearance.
5. Check reduced motion, disabled JavaScript and unsupported transition APIs.
   Content and ordinary navigation must remain available.
6. Verify that prefetching targets only eligible same-site pages after reader
   intent and does not download the whole tree on page load.
7. Run a quick build/config check if needed to establish a runnable prototype.
   After visual approval, run focused navigation and presentation checks and
   commit the implementation as its own logical change.

The prototype is ready for a product decision when the user can compare the
complete flow locally and the observed benefits, limits and regression results
are recorded. Completing the prototype does not automatically approve a new
public setting or a client-side router.

## Local prototype

The implementation is available for local visual review. The brief was
committed separately as `fbc3561`. The current trial combines constant menu
font weights, stable headings during expansion, the selected collapse
behavior based on Linear, and the Safari snapshot correction described below.
Visual approval, maintained regression checks and the implementation commit
remain pending.

Prepare a disposable copy and start the two registered review environments
from the repository root:

```sh
npm run review:scratch -- prepare --from site
NORNA_NAVIGATION_PROTOTYPE=1 npm run review:start -- scratch
npm run review:start -- docs
```

Preparation refuses to overwrite an existing scratch copy. Use `--replace`
only when its contents can be discarded. The copy that existed before this
trial was preserved under `.local/navigation-prototype/previous-scratch/`.
The environment variable activates an internal experiment for that process;
it is not a supported site configuration option.

Open the same page in each environment:

- Prototype: <http://127.0.0.1:4399/norna/reference/site/pages/>
- Baseline: <http://127.0.0.1:4321/norna/reference/site/pages/>

Use adjacent page links to compare the article fade. Expand and collapse
Configuration and Content syntax, try the Page contents links, then return
with the browser's Back button. Also try Getting Started and FAQ from the
global navigation. On a narrow window, repeat the menu interactions through
Menu. Use the existing display settings to compare Appearance modes.

Only the prototype receives the transition stylesheet, early menu-state
restoration, motion script and Astro prefetch support. Existing real links
and native details remain the underlying controls. Category redirect pages
retain their normal redirect behavior and Appearance; the article fade applies
between complete content pages. No new public setting or client router is
introduced.

## Inspection record

Initial inspection on 2026-09-17 covered Chromium, 1440×1000 and 390×844:

- Inspected desktop and mobile captures in light and dark Appearance, including
  the open mobile menu and the narrow Getting Started reading view.
- Observed the article's incoming and outgoing animations during a real page
  navigation. The header and navigation have no transition animation.
- Checked that no page was prefetched on arrival and that hovering a page link
  requested only that page.
- Checked disclosure reversal, Enter, Space and Collapse all during a motion.
- Checked the direct `#names-and-order` arrival within one CSS pixel of the
  header offset at both widths. Back restored the later reading position
  exactly instead of returning to the hash target.
- Observed intermediate positions during smooth anchor scrolling and checked
  that a desktop sidebar at scroll position 240 retained that position before
  the incoming transition snapshot.
- Checked Getting Started and FAQ destinations with stored dark Appearance,
  reduced-motion behavior, and ordinary navigation with JavaScript disabled.
- Ran `npm run content:check` and `npm run build` for both the baseline and the
  prototype using separate internal state directories. The baseline artifact
  contains neither the prototype stylesheet nor its motion bundle.
- Ran `npm run test:documentation` for the design documentation and
  `git diff --check` for the changes.

The installed Playwright launch defaults disable Chromium's `RenderDocument`.
That caused even a minimal two-page CSS-only View Transition to stall before
the incoming page's first frame. Restoring Chromium's normal `RenderDocument`
setting in the disposable inspection launcher resolved that reproduction and
the prototype's page transitions. Future motion regression checks must retain
that browser setting. No workaround was added to Norna's runtime for this
test-tool behavior.

The exploratory scripts and logs are under `.local/navigation-prototype/`;
captures are under `.local/review-captures/scratch/`. These are disposable
inspection output, not the maintained regression suite.

The browser follow-up below records subsequent human feedback and inspection.
Maintained navigation/presentation regression checks remain pending. The
complete `npm test` release chain has intentionally not been run for this
visual prototype. The baseline issue in
[BL-119 Direct-hash positioning in static previews](BL-119-static-preview-hash-positioning.md)
remains separate; this inspection does not close that item.

## User review feedback

### 1. Font-size increase and layout jump

On 2026-09-17, the user reported that `BL-121` Font-size increase and layout
jump after page navigation is also relevant to this prototype, identifying
these pages:

- <http://127.0.0.1:4399/norna/reference/site/requirements/>
- <http://127.0.0.1:4399/norna/reference/site/public-files/>

The item was initially recorded without analysis at the user's request. After
the user requested corrections, frame measurements reproduced a delayed table
width change on Public files and output and Page metadata. The initial table
frame used the wider available lane; the enhancement then chose the narrower
prose lane. This added line breaks and moved following content by about 85 and
43 CSS pixels respectively at 1440×1000. The measured title and paragraph font
sizes remained constant throughout these arrivals.

Tables now start in the prose lane, which is also the enhancement's first
candidate. Wider lanes and horizontal scrolling remain available when needed.
This shared correction also applies to the baseline site. The user approved
the table correction for its own implementation commit on 2026-09-17. That
approval covers the table's initial width; the navigation prototype retains
its separate review and verification requirements.

After approval, `npm run review:test -- presets` passed all 38 checks and
`npm run test:table-layout:top` passed all four checks in Chromium, with the
navigation prototype disabled. `npm run build` also passed, using
`NORNA_INTERNAL_STATE_DIR=.local/table-layout-commit/build-state` to keep
generated output separate from the running review sites.

The top-navigation suite initially failed because its hidden-control assertion
expected one element while the existing table has top and bottom controls.
The assertion now checks that no table navigation control is visible when the
table fits. The table runtime required no additional change for that test.

### 2. Intermittent flash when changing pages

The user reports a visible flash when following links in either direction
between these prototype pages:

- <http://127.0.0.1:4399/norna/reference/site/metadata/>
- <http://127.0.0.1:4399/norna/reference/site/images/>

The flash may be especially noticeable in the images. Its severity varies;
some transitions feel better than others.

The original transition faded the old article out in 90ms and the new article
in over 180ms, using normal alpha compositing. Both articles were therefore
partly transparent during the change, producing a visible dip. The prototype
now uses complementary 160ms fades with additive blending in an isolated
article pair, following the browser's
[cross-fade compositing model](https://developer.chrome.com/docs/web-platform/view-transitions/same-document).
The duration remains a trial value for human evaluation.

### 3. Brief disclosure markers under Configuration

When navigating between entries under Site model, the user reports that
entries under Configuration appear to redraw. A `>` marker briefly appears
to the left of their headings, making them look expandable.

Frame measurements reproduced disclosure arrows rotating from their closed
angle after a saved open branch had already been restored. That made an open
Configuration branch briefly display a sideways arrow on every page change.
The prototype now disables arrow transitions during arrival and enables them
once initialization has settled. Reader-initiated opening and closing still
animate.

### 4. Remaining jumps in Firefox and Brave

The user approved the Safari and Chrome experience but still observed jumps
in Firefox and Brave. Inspection reproduced two arrival-timing problems:

- Installed Firefox 156 did not provide the `pagereveal` event used by the
  prototype to restore menu state before displaying the page. The later
  navigation module therefore expanded saved branches after the first frame.
- Installed Brave 1.95.101 invoked that event before the streamed HTML had
  supplied the menu. The event handler found no tree to restore, and the
  transition could start with incomplete incoming content. Configuration
  changed from about 31 to 468 CSS pixels high after the first frame; at
  1200px, restored page outlines also moved subsequent navigation entries.

The prototype now restores saved branches while the HTML parser adds them to
each menu. It no longer depends on `pagereveal` for initial restoration. An
optional event handler still refreshes the state for transition snapshots and
cached history entries. The incoming document also uses the browser's
[render-blocking HTML marker](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document)
so a native transition waits for the page body to be present. The marker is
static HTML; navigation without JavaScript remains available. Both changes
are limited to the opt-in prototype.

### 5. Constant menu weight trial in Safari

The user clarified that these two further observations concern Safari:

1. Clicking a page title makes its menu label heavier, which may wrap the
   label and move subsequent entries.
2. Open `/reference/configuration/site/`, scroll down inside the left menu,
   then click the link to that same page. A flash is visible.

The user proposed keeping font weight unchanged on menu clicks to isolate
whether these observations have a common cause. The prototype now uses the
same label weight for inactive and current pages and categories, retaining
the existing fixed hierarchy weights and current-page underline/background.
The change is limited to prototype CSS. Its effect on the reported Safari
flash was a hypothesis for visual review. The following inspection identified
a separate rendering cause; the constant label weight remains part of the
trial.

### 6. Safari scroll-container snapshot correction

Inspection in installed Safari 26.6.2 reproduced the missing-menu frame on
2026-09-17. At a menu scroll position of 1329 CSS pixels, the menu disappeared
during the page transition even though its scroll position, bounds and
computed opacity stayed unchanged. The same transition at scroll position
zero displayed the menu correctly. This explains why the earlier position
measurements did not expose the flash.

The left menu had its own named View Transition snapshot. Capturing that
scroll container separately produced an empty region in Safari. An A/B
comparison kept the menu inside the unanimated root snapshot instead; it
remained visible at the same scroll position. The prototype now uses that
capture arrangement and removes the unused menu-specific transition rules.
The article keeps its 160ms fade.

The diagnostic lengthened only the article fade to eight seconds through a
temporary loopback proxy so Safari's WebDriver could capture the transition
itself. It did not alter the maintained site or the prototype's normal
duration. Inspecting only the settled page would miss this defect.

Follow-up inspection covered six Safari page clicks: top and bottom in a
1440×1000 dark view and a 1200×1000 light view, plus same-page clicks at both
positions in the dark view. Transition captures retain the menu, including
at scroll position 7105 in the narrower tree with integrated outlines.
Four focused page-click cases each in Chrome, Brave and Firefox retained menu
positions without reported script errors. Desktop and open mobile-menu
captures were inspected in light and dark Appearance. Disposable evidence is
under `.local/navigation-prototype/safari-paint/` and
`.local/navigation-prototype/safari-paint-verification/`.

The correction is ready for human review at the existing scratch URL. Full
navigation/presentation regression checks and a fresh build remain deferred
until visual approval; the separate WebKit Back-to-hash defect remains open.

### 7. Sticky-header navigation and the first left-menu clicks

In the first part of a new feedback round, the user reported two observations:

- Clicking a heading in the sticky navigation row at the top produces a
  pronounced flash.
- After that navigation, the left menu jumps during the first few clicks,
  then stabilizes.

The [investigation plan](#blink-investigation-plan-and-results) below covers
this complete sequence. These observations remain user reports; their cause
has not yet been reproduced or established in the new diagnostic comparisons.

### Correction checks

The corrected local prototype is ready for another visual review. The
following focused inspection was performed on 2026-09-17:

- Twelve page arrivals across the baseline and prototype, covering Public
  files and output, Requirements and limits, Page metadata and Managed images,
  produced no recorded layout shifts at 1440×1000. No page-script errors were
  reported. Intermediate article frames had complementary opacity throughout
  the fade.
- Fourteen prototype arrivals at 1440×1000 and 1200×1000 kept the restored
  Configuration arrow at its open angle from `pagereveal` through the settled
  page. Its previous repeated rotation was absent.
- Inspected desktop and mobile captures in light and dark Appearance for the
  affected reading pages.

After the Firefox/Brave follow-up:

- Ten arrivals each in installed Firefox 156, Brave 1.95.101 and Chrome 152,
  at 1440×1000 and 1200×1000, kept Configuration open at a constant height
  from the first measured frame. No incomplete article/menu frames or page
  errors were observed. Chromium's layout-shift observer recorded no shifts
  in Brave or Chrome.
- Exploratory checks in Brave and Playwright Firefox 151 passed direct hashes,
  Back restoration, disclosure reversal, Enter, Space, Collapse all, category
  redirects with stored dark Appearance, reduced motion and navigation
  without JavaScript. The interaction checks covered desktop and mobile.
- Inspected new compact/dark and mobile/light captures through
  `npm run review:capture -- scratch`, including the open mobile menu.
- Built both variants again with `npm run build` and separate internal state
  directories. Only the prototype artifact contains the early restoration
  scripts, transition stylesheet and HTML readiness marker.

A separate exploratory check in Playwright WebKit 26.5 did not pass: after
opening `/reference/site/pages/#names-and-order`, scrolling 220px further,
visiting `/reference/site/urls/` and going Back, the reading position changes
from about 1161px to the hash target at 942px. This occurs with the dev server
and the built prototype, and with the new readiness marker removed. It does
not occur in the JavaScript-disabled check. The cause remains unresolved;
the WebKit interaction suite is therefore not claimed as passing, and this
case must be resolved before promoting the prototype. It is distinct from
[BL-119 Direct-hash positioning in static previews](BL-119-static-preview-hash-positioning.md).

The measurements and captures supplement the user's review. The earlier
positive Safari report is qualified by the subsequent menu feedback above;
the constant-weight trial and Firefox/Brave correction need visual review.
Maintained navigation and presentation suites and the implementation commit
remain deferred until that review, as required by the project's visual design
workflow. The separate `BL-122` Reconsider the right-hand menu remains an
uninvestigated backlog note.

## Blink investigation plan and results

**Status: plan recorded before execution.** The six comparisons below have
not been run. This record distinguishes reported symptoms, verified evidence,
hypotheses, results and implementation decisions. Update it after each
comparison; keep `BACKLOG.md` as the short status index.

### Starting evidence

- **Reported:** [sticky-header navigation and the first left-menu clicks](#7-sticky-header-navigation-and-the-first-left-menu-clicks)
  produce flashing followed by jumps that settle after further clicks.
- **Verified in an earlier case:** [Safari's separate menu snapshot](#6-safari-scroll-container-snapshot-correction)
  could be blank while menu geometry and scroll position stayed correct.
  Keeping the menu in the root snapshot corrected that captured case. This
  does not establish the cause of the newly reported sequence.
- **Read in Norna's source:** category and alias destinations can use
  `PageAliasRedirect.astro`, an HTML document with a refresh redirect. The
  prototype's transitions are installed by `BaseLayout.astro`. This makes
  the actual redirect chain worth checking; it does not prove a visible flash.

### Staged execution and time estimate

Run the investigation in stages, using each result to choose the next
comparison:

1. Reproduce the complete reported sequence in Safari and start with the
   redirect-route and cache/menu-state comparisons. Use the smallest case
   that preserves the flash or jump.
2. Record the evidence and remaining uncertainty. Select further comparisons
   from the table below only where they can distinguish the remaining causes.
   If a cause is isolated, make a focused correction and repeat the failing
   sequence at normal timing.
3. Check the candidate correction in Chrome, Firefox and Brave, then expand
   coverage for affected navigation contracts and visual review. Record any
   planned comparisons that became unnecessary as not run, with the reason.

The first focused Safari investigation has a rough planning estimate of
20–40 minutes, depending on reproducibility and available instrumentation.
Individual runs usually take seconds or minutes; controlled starting states,
frame inspection and interpretation account for much of the investigation.
Exercising all comparisons across all browsers could take several hours.
These estimates are not measured durations, deadlines or limits on necessary
work. Do not exhaust the full combination matrix before attempting a
correction when narrower evidence already identifies the cause.

At each stage, report what was learned, which question remains and which
comparison will address it. Broaden testing when a failure, a new change or
an unresolved concern justifies it.

### Common sequence and evidence

Start from a recorded documentation URL and follow a global link in the
sticky header. Record every intermediate URL and the final destination.
Then record the first five left-menu page clicks individually, including the
first arrival. Cover each global destination that has a left menu and record
destinations without one separately. Include leaving an area and returning
through the header. Exercise the sequence with the menu near its top and
deeply scrolled; record the document's own scroll position independently.

Capture the header, background and menu throughout the transition, together
with menu bounds, visible label positions, open branches and scroll position.
The navigation must remain visible, and the incoming menu must have its
correct state from the first visible frame. A menu that becomes correct only
after later clicks has not passed. Do not discard initial clicks as warm-up.
Distinguish the intended article fade from a blank frame or disappearing
navigation. A settled screenshot or stable coordinates alone cannot pass
the visual check.

Start with actual Safari for the reported sequence, then repeat the matching
sequence in Chrome, Firefox and Brave. Identify Playwright WebKit separately
from Safari. Keep viewport, Appearance, reduced-motion preference, source
revision and click order fixed within each comparison. Begin at the viewport
that reproduces the fault; expand coverage when evidence justifies it.

### Hypotheses and planned comparisons

All rows are **planned, not run**. Begin with the route and cache/state
comparisons. Change one condition at a time on a reproducible sequence.

| Check | Unverified hypothesis | Comparison and evidence sought |
| --- | --- | --- |
| Redirect route | An intermediate category/alias document interrupts visual continuity. | From the same starting page, compare the actual header link with an equivalent link directly to its final destination. Record the redirect chain and transition participation on each leg. Use links in both cases; address-bar navigation would change the transition conditions too. |
| Cache and saved menu state | Initial resource loading or menu restoration explains why later clicks settle. | Cross empty/filled resource cache with fresh/saved menu state, giving four conditions. Keep Appearance fixed and prefetch disabled in this comparison. Verify cache/request status and record the reset method; a reload alone does not establish an empty cache. |
| Page transitions | View Transition capture or display contributes to the flash. | Compare the same sequence with page transitions enabled and disabled, retaining the same menu state and disclosure behavior. Capture visible frames in both variants. |
| Resource readiness | A resource becomes available after an incomplete state has already been painted. | Delay the HTML response, stylesheet, font and script resources separately while keeping the rest of the sequence fixed. Correlate the first incorrect frame with resource completion and initialization events. |
| Click timing | The next navigation races with arrival or restoration work. | Compare the earliest actionable click with a click after the destination has settled. Record readiness milestones and elapsed time; count the first click in both cases. |
| Prefetch | Preparing a destination changes the observed first-click behavior. | Compare an immediate click with a click after hover or focus has triggered prefetch. Verify whether the request started and completed, then repeat with prefetch disabled to separate elapsed time from prefetch itself. |

Use isolated browser state and disposable diagnostic variants. Record any
instrumentation, proxy or extended animation duration: it can make a frame
inspectable while changing timing. After isolating a cause, confirm the
candidate at its normal duration and URL. If a browser cannot support a
particular measurement or controlled condition, record that limitation.

### Linear comparison

**Code inspected on 2026-09-17:** Linear's publicly delivered
[navigation bundle](https://static.linear.app/web/_next/static/chunks/index-BcA8-OLo.js)
contains client routing and prefetch support. Its
[documentation layout stylesheet](https://static.linear.app/web/_next/static/css/DocsLayout.CNer6T52.css)
defines a fixed sidebar, and its
[menu stylesheet](https://static.linear.app/web/_next/static/css/Item.Cx9IGCq5.css)
keeps the label weight unchanged when the current page changes.

**Behavior observed:** in Chrome, opening Getting started and following Start
Guide kept that group expanded. The active and adjacent menu links both had
computed weight 510. This observation does not establish whether the same
menu DOM nodes survived the navigation.

**Proposed comparison:** determine whether menu elements persist or are
recreated, how their scroll position is preserved, and when the destination
content replaces the current content. Inspect prefetch and readiness alongside
visible behavior. Record each conclusion as observed behavior, inspected code
or an inference, with its source and limits. Norna currently navigates between
HTML documents; any proposal to adopt client routing remains a separate
architecture decision. Existing motion observations are in the
[preset design guide](../preset-design-guide.md#navigation-continuity-prototype).

### Result and decision record

No results from the six new comparisons are recorded yet. For each completed
comparison, append a dated entry with:

- **Run and conditions:** check name, browser/version and OS, source revision
  including local changes, URL, viewport, Appearance, motion preference,
  cache/menu state, resource delays, transition/prefetch settings and tool.
- **Reproduction:** exact starting state, link labels/URLs and click order,
  timing, repetitions and reset procedure.
- **Observed result:** affected region, first failing click/frame, flash or
  movement, measurements and frequency across runs; include unchanged or
  contradictory results.
- **Evidence:** capture/log paths and the command or procedure that produced
  them, including diagnostic alterations and measurement limits. Summarize
  the finding here so it remains understandable without disposable files.
- **Conclusion:** which hypothesis the comparison supports or weakens, what
  it does not establish, and the next comparison needed.
- **Decision:** the correction or follow-up justified by the evidence, its
  verification status and any remaining human review or regression checks.

An unexecuted check stays planned; absence of a flash in a limited run is
reported with its conditions and repetition count. Promote a hypothesis to a
verified finding only when the recorded comparison supplies evidence for it.
