# BL-120 Smooth documentation navigation prototype

Completed as an opt-in prototype on 2026-09-18. The user approved the visual
result, and the focused checks below are complete. This is not approval to
enable the experiment by default or promote it to supported behavior. The
[final verification record](#final-approval-and-verification) supersedes the
earlier pending-review notes in this investigation history.

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

The implementation remains available for local comparison. The brief was
committed separately as `fbc3561`. The current trial combines constant menu
font weights, stable headings during expansion, the selected collapse
behavior based on Linear, and the Safari snapshot correction described below.
The final trial was visually approved on 2026-09-18; verification and remaining
limits are recorded at the end of this brief.

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

**Status: further adjustment required after visual review.** The user did not
approve the candidate on 2026-09-18. The route, state and placement
corrections have been checked in four installed browsers. This record
distinguishes reported symptoms, verified evidence,
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

The rows define the planned comparisons; execution and limits are recorded
below. Begin with the route and cache/state comparisons. Change one condition
at a time on a reproducible sequence.

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

**Behavior measured on 2026-09-17:** in installed Chrome 153.0.8010.48 at
1200×1000, five alternating link clicks between
[Update cycles](https://linear.app/docs/update-cycles) and
[Cycle graph](https://linear.app/docs/cycle-graph) retained the same window,
navigation element, watched link and scroll container. The article element
was replaced on each arrival. The menu's scroll position stayed at 64px, the
watched link stayed at viewport y=455px, and its font weight stayed at 510.
There was still only one document-navigation timing entry after all five
clicks. These DOM identity checks establish persistence in this flow, beyond
the earlier observation that the group merely looked unchanged.

The network record showed React Server Component requests and image requests,
rather than new HTML document navigations. A request for Cycle graph started
before the explicit hover, so this run does not establish hover as the prefetch
trigger. Destination articles were inspected after arrival; the exact readiness
threshold for replacing them was not isolated with delayed resources.
Evidence is in `.local/navigation-prototype/linear-comparison/results.json`;
the adjacent capture was inspected. This is one flow in Chrome, not a claim
about every Linear page or browser.

**Consequence for this trial:** Linear preserves the menu by retaining it in
the document. Norna currently creates a new HTML document, so it must establish
matching menu state before the new frame is displayed. Keeping disclosure
state, label weight and outline placement stable addresses the measured
differences without changing the trial's architecture. Client routing remains
a separate product decision. Existing motion observations are in the
[preset design guide](../preset-design-guide.md#navigation-continuity-prototype).

### Result and decision record

For each completed comparison, append a dated entry with:

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

### 2026-09-17: Header routes and the first five page clicks

The starting revision is `b8855a1` plus the uncommitted opt-in prototype.
Installed Safari 26.6.2 was measured at 1200×1000 with dark Appearance. A
loopback proxy injected frame and lifecycle measurements into the streamed
HTML; the ordinary 160ms article duration was retained. Evidence and the
disposable runner are under `.local/navigation-prototype/header-investigation/`
and `.local/navigation-prototype/header-investigation.mjs`.

Following Getting Started and FAQ from the sticky header loaded their category
redirect document before the destination page. Each redirect produced two
animation-frame samples with its fallback heading and without the site header
or left menu. Neither that document nor the final arrival had a View
Transition. An A/B variant changed the links to their already-known final
destinations; both final arrivals then had a View Transition and no intermediate
document. This identifies a concrete interruption in the page frame. Frame
geometry does not by itself establish the appearance of every painted pixel.

The first five page links in Getting Started also exposed automatic disclosure
changes. Visiting Grow Your Site, Choose A Theme and Prepare Your Site opened
their heading outlines, moving subsequent page labels by approximately 162,
97 and 145 CSS pixels. Revisiting pages whose outlines were already open did
not add this movement. The shift follows disclosure state, even when the menu
scroll position stays zero; it is not a font-size change.

The original runner's reset cleared storage before leaving a page, allowing
the departure handler to write it again. Its later cases are therefore not
claimed as fresh-state comparisons. The A/B runner was corrected to reset at
the next document's start, after the departure. Cache state has not yet been
isolated by these route comparisons, and remains a separate controlled check.

The candidate now uses the existing category-destination model for prototype
header links and retains explicitly saved outline/disclosure states on page
clicks. Direct arrivals still reveal the path to the current page, and
disclosure controls remain available. Both changes stay behind the prototype
switch and require visual review.

### 2026-09-17: Controlled cache and saved-state comparison

Installed Safari 26.6.2, 1200×1000, dark Appearance and the normal 160ms article
transition were retained. Each condition used a new automation session and
proxy origin. Storage was cleared at the next document's start, after the old
page's departure handlers. The saved-state variant then explicitly opened
Getting Started and Grow Your Site's outline. Prefetch event handling was
suppressed by the diagnostic script in all four conditions.

The cold variant served resources with `Cache-Control: no-store`. The warm
variant first visited the destination, then served non-HTML resources with
`max-age=3600`; HTML remained uncached. Each condition followed Getting Started
in the header and the same five page links listed above.

| Resource cache | Menu state | Cached resources on header arrival | Largest label movement across five clicks |
| --- | --- | --- | --- |
| Disabled | Fresh | 0 of 33 | 0px |
| Disabled | Saved | 0 of 33 | 0px |
| Warm | Fresh | 33 of 33 | 0px |
| Warm | Saved | 33 of 33 | 0px |

Cache status was checked through resource transfer sizes and proxy requests;
no HTML prefetch requests occurred. Menu scroll position stayed zero and no
script errors were recorded. Results are under
`.local/navigation-prototype/header-investigation/candidate-matrix-*/`.
This comparison supports the state correction under both loading conditions;
it does not prove the absence of every possible painted flash.

### 2026-09-17: Wide-layout placement and final browser comparisons

At 1440px, the first Reference page click still moved later labels upward by
about 143px in Chrome, Firefox and Brave despite unchanged disclosure state.
The cause was the existing responsive rule: a page with a right-hand contents
rail hid every left-tree outline, while the Reference category destination
had no contents rail and displayed those outlines. At 1200px the left-tree
outlines remained available on both pages and this difference did not occur.

The prototype now consistently hides left-tree outlines above 1280px, including
category destinations. At narrower widths they remain in the tree. This keeps
the established wide-page placement constant; it does not decide the separate
`BL-122` Reconsider the right-hand menu.

With this correction, all five Reference page clicks at 1440×1000 showed 0px
label displacement in installed Chrome 153.0.8010.48, Brave's Chromium
153.0.8010.48 and Firefox 156.0. Earlier candidate checks covered Getting
Started, FAQ and Reference at both 1200px and 1440px; only the wide Reference
case failed before the placement correction. Installed Safari 26.6.2 then
passed all three header destinations and five subsequent clicks per area at
1440×1000, with 0px label displacement and no recorded script errors.

A final focused menu comparison ran at 1200×1000 in all four installed
browsers: same-page click, different-page click, opening and closing, each near
the top and near the bottom, once per combination (32 cases). Page clicks and
opening retained scroll position from the first measured frame. Closing near
the top was stationary; closing near the bottom followed the shrinking native
scroll limit with no extra repositioning. Geometry and lifecycle measurements
remain distinct from proof about individual painted pixels.

Evidence and runners are under `.local/navigation-prototype/`:
`header-other-browsers/`, `header-final-browsers/`,
`header-investigation/candidate-final-1440/` and `blink-final-matrix/`.
Chrome/Brave used isolated Playwright sessions with the documented
`RenderDocument` launch correction; Firefox used its native BiDi endpoint and
a disposable profile; Safari used WebDriver and the streaming loopback probe.
No delayed resources or extended animation durations were used in these final
comparisons. Prototype runtime changes remain opt-in.

### 2026-09-17: History limit and verification boundary

The previously recorded Playwright WebKit 26.5 Back-to-hash discrepancy still
reproduces. Instrumentation found restoration to the saved reading position
at `pagereveal`, followed by native movement to the hash target by `load`, with
no intervening JavaScript `scrollTo` or `scrollIntoView` call. Suppressing the
late header-offset update did not resolve it. This narrows the observation but
does not establish a browser defect or justify a history workaround.

The equivalent programmatic-scroll sequence in installed Safari 26.6.2 at
1440×1000 restored exactly 1159px after Back, using its cached history entry.
The additional wheel/keyboard probes did not move the document before leaving
and therefore supply no evidence about restoring a changed reading position.
Safari passing does not close the distinct WebKit failure. The maintained
prototype suite includes its reproducer with an explicit expected failure at
the final position assertion; setup or navigation errors are not expected.
Resolve this discrepancy before promoting the prototype to supported behavior.

The controlled route/state comparisons and the wide-layout reproduction
identified concrete causes, so a full matrix of artificial CSS/font/script
delays, earliest-click timings and prefetch timings was not run. It remains
available if human review identifies residual flashing. The earlier Safari
snapshot A/B comparison remains the evidence for keeping the left menu in the
root snapshot. Linear's exact article-readiness threshold also remains
unmeasured; persistent menu DOM was established independently.

The candidate's desktop light/dark, mobile dark and open mobile-menu light
captures were inspected using `npm run review:capture -- scratch`. User review
has been requested at the normal prototype URL. Maintained checks and the
implementation commit remain pending that review; diagnostic success is not
substituted for the user's assessment of motion.

The focused suite is `tests/navigation-prototype.spec.ts`, run against a fresh
documentation-site server with:

```sh
NORNA_NAVIGATION_PROTOTYPE=1 node scripts/test-navigation.mjs --site-dir site tests/navigation-prototype.spec.ts
```

It uses Playwright WebKit for repeatable frame/state assertions and explicitly
records the history limit above. The installed-browser comparisons provide
separate evidence; this suite is not a claim that Safari and WebKit are
interchangeable. Normal navigation/presentation checks verify the unchanged
released behavior after approval. The complete release test chain is not
needed for this opt-in prototype.

Before visual approval, the candidate also passed `npm run test:documentation`
and `git diff --check`. A production build with `NORNA_NAVIGATION_PROTOTYPE=1`
and an isolated `NORNA_INTERNAL_STATE_DIR` passed `npm run build`, including
its content/configuration checks, and generated 78 pages. This checks the new
server-rendered category destination integration and conditional bundle, not
the user's assessment of motion. Playwright successfully listed the nine new
prototype cases; executing them and the normal navigation/presentation suites
remains pending. No release, push or implementation commit has been made.

### 2026-09-18: Fullscreen scroll and link review

The user rejected the candidate and supplied these Safari fullscreen cases:

| Reported interaction | Reported result | Control case |
| --- | --- | --- |
| Two-finger article scroll on Site files | Sluggish | VS Code editor support scrolls normally |
| Scroll the left menu on Legacy source integration | Cannot scroll downward | Page metadata scrolls normally |
| Click Site model or Configuration text in the left menu | Expands instead of opening the destination | Page-title links should open the page top |
| Scroll the menu upward on Site files at `#page-folders` | Rows appear above the sticky filter | The filter area should mask passing rows |
| Follow a generated child link on Reference | Strong flash | Direct page links preserve the navigation frame |

The user requested renewed checks in Safari, Chrome, Firefox and Brave,
including internal links in prose and relevant external links. The scroll
reports remain observations from the user; geometry-only page-click tests
from the previous round do not cover physical trackpad behavior.

#### Reproduction and corrections

The generated Reference overview linked to `/reference/site/` and
`/reference/configuration/`. All four browsers visited a category redirect
without the navigation frame before reaching the content page. Safari's
measured intermediate document lasted about 125ms. The prototype now resolves
these overview links through the existing category-destination model and
links directly to the final page. This is the same concrete interruption
previously corrected in header links; it does not establish that every painted
flash has been eliminated.

Site model and Configuration were category disclosure summaries, so clicking
their text deliberately toggled them in the baseline. The trial now makes
category text an ordinary link to the category destination; the adjacent
chevron still opens and closes the branch. This is a prototype behavior
change in response to the user's expectation, not a correction to a misplaced
page-link hit area. It also applies to the compact menu and remains gated by
`NORNA_NAVIGATION_PROTOTYPE=1`.

The left scrollport has 20px of top padding. Its sticky controls did not cover
that band when rows scrolled behind them. Hit tests in all four browsers found
a page link in the exposed band, and native Safari inspection showed the text
above the filter. A prototype-only background extension now covers that band.
Corrected hit tests in Chrome, Brave and Firefox reach the controls, not an
underlying menu link.

#### Renewed browser evidence

Chrome and Brave (Chromium 153.0.8010.48) and Firefox 156.0 passed the corrected
category checks: both category titles open the intended page at its top;
chevrons open and close without navigating. Both generated overview links
now reach the final content document directly. Chrome and Brave record a
native View Transition on arrival. Firefox uses ordinary document navigation.
The measurements establish destinations, lifecycle and geometry, not a
complete visual judgment of the transition.

Actual prose links from Site files were followed to Pages and categories,
and to the Page themes fragment on Theme configuration. All three browsers
reached the correct destination; the fragment settled within 1px of the
sticky-header offset. The real external contributor link from VS Code editor
support opened its GitHub README and retained the fragment in all three.
An initial runner attempted a same-page link that was only text inside a code
example; that attempt is excluded. Corrected click probes verify the visible
hit area before activation, including wrapped inline links.

The scroll comparison used five 160px wheel inputs for the article on Site
files and VS Code editor support, plus the menu on those pages, Legacy source
integration and Page metadata. Chrome and Brave scrolled each article 800px
and each menu to its expected limit without moving the document. Firefox
also reached those limits but moved the document by 160px in the menu cases;
that separate overscroll observation remains to be isolated. No script scroll
writes or cancelled wheel events were recorded in these cases.

Safari's initial wheel attempt delivered one event without moving the page;
later inputs did not arrive. A focused retry reported the automation document
as hidden and unfocused even after the user brought Safari forward. A native
UI attempt worked in a normal window earlier, but fullscreen input and later
window lookup failed in the automation tool. These are invalid scroll
measurements, not evidence that the user's scroll fault is fixed or caused by
Safari itself. The failed session also left Safari reporting an existing
WebDriver pairing after its driver had exited. Do not repeat the same input
loop or mark Safari gesture coverage complete. No runtime wheel interception
or speculative scroll workaround was added.

Diagnostic artifacts are under `.local/navigation-prototype/scroll-review/`,
with separate logs for `link-external-*` and `safari-wheel-*`. Earlier link
attempts that missed their target are superseded by `corrected-hit` results.
The follow-up below supersedes the initial Safari input limitation. Physical
trackpad inertia and the user's subjective scroll assessment remain distinct
from injected wheel input.

#### Follow-up: Safari input, reachable menu end and regression checks

After the user made Safari available again, a fresh session reported a visible,
focused document. A fullscreen sanity check at 1470×923 delivered a trusted
160px wheel event and moved the article 160px. Reusing the original wheel
sequence still delivered only the first event. A runner using a separate
wheel source for each action and zero-duration inputs delivered all five
inputs on every reported page. Both articles moved 800px; all four menu cases
moved the remaining 600px to their scroll limit without moving the article,
cancelling an event, or recording a JavaScript scroll write. This verifies
those injected inputs, not physical two-finger inertia or a diagnosis of the
original sluggishness.

Safari also passed the category, generated-overview, prose-link, fragment and
real external-link checks. Chevron checks use an actual pointer position:
WebDriver's element-click operation on a whole summary can click its nested
text link instead of the arrow. The pointer test verifies opening and closing
both Site model and Configuration without navigation. Both category text
links open the correct destination at its top. Generated overview and prose
page arrivals participate in native transitions; the fragment aligns within
1px of the header. The filter's top band now masks rows in Safari as well.

The bottom-of-menu check found an additional concrete layout defect. At a
920px viewport height with the notice visible, the tree started at about
146.6px but extended to 955.6px. At maximum scroll, the last row ended at
929.5px and remained partly below the window. Reaching `scrollTop`'s limit
was therefore insufficient to prove that all menu content was accessible.
This could contribute to the reported stuck-menu impression, but is not
established as the cause of every reported scroll symptom.

The prototype now reserves the space above the tree when calculating its
maximum height. It establishes that limit before restoring a saved position,
and updates it when the header, notices or viewport change. Article scrolling
does not resize the tree. After correction, Chrome, Brave and Firefox place
the tree's bottom at about 899.6px and the final row at about 874px in a 920px
viewport. Safari's final scroll run also leaves the final row fully visible,
with all five wheel inputs delivered in each case. A regression case checks
the end of the menu before and after article scrolling and banner dismissal.

Firefox's extra document movement at a menu scroll boundary also occurs in
a minimal static HTML fixture without Norna scripts: `contain`, `none` and
`auto` all moved the document by 160px through the tested BiDi input path.
This isolates the observation from Norna's navigation JavaScript; it does not
establish whether native Firefox trackpad input behaves the same way. No
wheel-cancellation workaround was added to the site. Evidence is in
`firefox-containment.log` and its disposable runner.

The focused prototype suite now has 15 cases: 14 passed normally and the
known Playwright WebKit Back-to-hash case failed as expected at its final
assertion. The final full-file run completed successfully in 38.7 seconds.
Initial failures exposed test clicks in link padding occupied by the separate
arrow, and clicks while native transition snapshots still owned hit testing.
The runner now targets the actual text and waits for it to receive pointer
input. This run therefore does not claim coverage of input during an active
transition snapshot.

Registered captures were inspected for desktop light/dark and the open compact
menu in light/dark. Final desktop captures cover Legacy source integration
after the scrollport-height correction. Public reference changes remain
deferred because this is still an opt-in prototype, not supported behavior.

The final opt-in `npm run build` passed content and configuration checks and
built 78 pages, with 68 pages in the static search index, using isolated
`.local/navigation-prototype/final-review-build/.norna` state. The normal
`review:test -- navigation` and `review:test -- presets` suites are deliberately
reserved for the approved visual result. No full release test chain, commit,
push or release was performed in this review round.

Visual approval and the implementation commit remain pending. Do not begin
[BL-123 Navigation JavaScript refactoring assessment](BL-123-navigation-javascript-refactoring-assessment.md)
before this prototype is completed and committed.

#### Follow-up: a visible ending to the navigation tree

The next review of VS Code editor support found that all menu content was
visible, but the space below Convert legacy site sources was too small to
make the end of the tree clear. The prototype now uses `3rem` of bottom
padding instead of `1.25rem`. This is a spacing trial for visual review;
it does not add temporary filler to preserve a collapsing heading's position.

Chrome inspection at maximum menu scroll shows about 54px below the final
page link at 1470×923. At 1200×800, where expanded page sections also appear
in the tree, about 61px remains below the final section link. Screenshots
were inspected for both layouts and for desktop light/dark appearance.
The existing browser and build results above precede this spacing change.
Navigation regression checks and a new build remain deferred until visual
approval, following the project's human-first review rule.

## Final approval and verification

On 2026-09-18 the user reported "Ser bra ut nu" and approved the visual result,
including the added space below the navigation tree. The user then authorized
completion of this item followed by
[BL-123 Navigation JavaScript refactoring assessment](BL-123-navigation-javascript-refactoring-assessment.md).
That assessment starts from this implementation's commit, with no runtime
refactoring included in the assessment itself.

Checks after approval:

- `npm run review:test -- navigation`: 62 cases passed; one exposed an obsolete
  header-link assertion from before
  [BL-112 Category destinations](BL-112-category-destinations.md).
  Commit `1d99572` deliberately changed global category links to the category
  URL, as that item's Navigation And Integration contract specifies. The test
  now checks `/guides/` and follows the link to `/guides/installation/`, checking
  the destination heading as well. The corrected case passed via
  `node scripts/test-navigation.mjs --site-dir fixtures/nested-pages/site tests/navigation-tree.spec.ts --grep 'keeps local category labels unlinked'`.
  The other 62 cases were not repeated after this test-only correction.
- `npm run review:test -- presets`: all 38 cases passed.
- `NORNA_NAVIGATION_PROTOTYPE=1 node scripts/test-navigation.mjs --site-dir site tests/navigation-prototype.spec.ts --grep 'last menu row|activated heading|deeply scrolled tree'`:
  all three cases passed after the bottom-spacing change. This covers reachable
  menu content, stable expansion/collapse and retained deep menu position.
- `NORNA_NAVIGATION_PROTOTYPE=1 NORNA_INTERNAL_STATE_DIR="$PWD/.local/navigation-prototype/approved-build/.norna" npm run build`:
  passed, including content/configuration checks; 78 pages and 68 indexed pages.
- `npm run test:documentation` and `git diff --check`: passed for the final
  completion record.

The earlier full prototype suite passed 14 cases normally and recorded the
known WebKit Back-to-hash case as an expected failure. It was not repeated in
full for the final spacing-only change. The WebKit discrepancy still needs
resolution before promotion. The user's approval concerns the reviewed reading
and navigation experience. Automated scroll evidence remains the injected-input
measurements described above, not a measurement of physical gesture inertia.

Both WebKit suite logs contain an initial Vite development-server message,
`Importing a module script failed`, followed by a second request for the same
first page and successful ready-state checks. Its cause was not isolated; the
results do not establish an error-free development startup. The production
build passed. The complete release test chain and a new four-browser matrix
were deliberately not run for the spacing-only change. No push or release was
performed. Public reference remains unchanged because the experiment is not a
supported feature.
