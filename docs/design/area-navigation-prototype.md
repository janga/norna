# Area navigation prototype

The local trial for
[BL-122 Area navigation and integrated H2 prototype](backlog/BL-122-area-navigation-prototype.md)
puts area choices in a shared menu panel and each area's page/H2 links
in the left menu. The right outline column is returned to the reading canvas,
while prose measure and paragraph-aligned sidenotes retain Norna's existing
presentation. It is opt-in; adoption and a public configuration contract remain
separate decisions.

**Status on 2026-09-19: work-in-progress prototype checkpoint.** The user
requested that the current implementation and interactive review decisions be
committed before further implementation. The saved trial includes the scoped
page/H2 tree, global hover menus, sticky breadcrumb with its menu button,
reader controls and the latest label refinements. The backlog item remains
in progress; the switch is still off by default.

Continue with implementation cleanup and adapt the maintained browser tests
before running them against the latest layout. The area and parent suites
still contain selectors for global menu titles on reading pages; those pages
now use the breadcrumb's menu button. Their earlier Home-to-reading-header
equality case must follow the accepted distinction between the two frames.
The newer capture options for area/Display panels and Focus reading also need
maintained coverage. Final browser/scroll verification, the completion commit
and any adoption as ordinary product behavior remain pending.

Leave native tooltip timing and Locate current page as they are, following
the user's final review instruction. Earlier verification below identifies
the revision it covers; it does not certify this checkpoint's latest layout.

Checkpoint checks on 2026-09-19 passed: `npm run test:documentation`,
`npm run test:dead-code`, `npm run test:navigation-model` and `git diff --check`.
The maintained browser suites, a fresh build of the latest layout and the
complete release chain were intentionally deferred for this work-in-progress
commit. Prior build and browser results below retain their original scope.

## Reproduce the trial

From the engine repository root, use the maintained review commands. Preparing
with `--replace` replaces the disposable scratch copy, not the source site:

```sh
npm run review:stop -- scratch
npm run review:scratch -- prepare --from site --replace
NORNA_AREA_NAVIGATION_PROTOTYPE=1 npm run review:start -- scratch
```

Open [Site files](http://127.0.0.1:4399/norna/reference/site/files/) and the
menu button beside the sticky breadcrumb by clicking it. Home retains its global
hover menus. All six immediate Reference areas have equal title and
description treatment. Choosing one changes the scope of the left tree.
Disclose Pages and categories while Site files remains open, then follow one
of that other page's H2 links. Inspect
[Sidenotes](http://127.0.0.1:4399/norna/reference/content/sidenotes/) for the
recovered note lane and its narrow-screen fallback.

The internal environment switch includes the existing continuity prototype.
It adds no public `config.yaml` or category field. To compare with the earlier
continuity trial, stop scratch and restart it with
`NORNA_AREA_NAVIGATION_PROTOTYPE=0 NORNA_NAVIGATION_PROTOTYPE=1` before the same
`npm run review:start -- scratch` command. Ordinary docs remain available
through `npm run review:start -- docs` with both flags unset. Restart a running
server before changing flags; an existing process retains its environment.

For a content-bearing parent and deeper descendants, use the maintained fixture:

```sh
npm run review:stop -- navigation
NORNA_AREA_NAVIGATION_PROTOTYPE=1 npm run review:start -- navigation
```

Inspect [Installation](http://127.0.0.1:4323/guides/installation/): the same
disclosure contains its own H2 links before macOS, Linux and Windows. The
parent page remains a link. Guides has 22 immediate choices, so its sticky
title is a direct destination and its full tree remains visible. A direct
macOS arrival selects the same collection; its
H3 Prerequisites anchor remains valid without entering the navigation outline.
Stop and restart without the flag to restore the fixture's ordinary view.

## Model and design decisions

The listed tree supplies all area boundaries. A collection whose direct
children have no child pages stays together in one left tree. FAQ's four pages
and Getting Started's five pages therefore appear with their siblings and each
page's H2. This applies to both categories and authored parents, including
Resources. A new page choice opens its branch and H2 even when a prior visit
left it closed. Other pages' H2 can be disclosed independently and retain their
saved choices. Back/Forward restores the earlier entry's state instead of
applying this new-page opening rule.

When a collection has subgroups, an immediate child with descendants becomes
a local area. Direct leaves beside those subgroups have only their own H2
outline, as do standalone global pages. If such a page has no H2, it has no
outline, but retains the reading frame and its navigation controls. A parent's own page retains its tree, and deeper leaves inside an
area retain the area tree. Home retains its existing exception. Unlisted
subtrees and empty categories stay excluded by the shared tree builder. The
flat-collection rule uses page hierarchy, not a minimum number of pages or
headings; it supersedes the earlier own-outline-only trial on 2026-09-19.

Area selection depends on ancestry and stable page paths, never on a previous
menu click, node title or description. Sticky menus still offer direct page
choices for flat collections; those destinations retain their siblings as
context on the left. The shared category-destination resolver
supplies links, avoiding an extra category redirect. A separate state namespace
keeps the area's scroll position from inheriting that of the larger baseline
tree, while desktop and compact views still share disclosure choices within
the trial. Other areas' saved choices remain intact.

The arrival rule is shared by the early parser-time restoration and the later
tree runtime. The departing tree is left in place; the arriving current branch
opens before it is shown. Same-page name links open the current branch and
retain their normal page-top destination; H2 links retain their fragments.
Chevrons still toggle independently. Per-entry disclosure/scroll snapshots
live in session storage; `history.state` carries only an entry identity and
preserves other owners' data. Scrolling does not repeatedly call
`history.replaceState`, and native article-history restoration stays in charge.

The three-column title/description presentation follows the approved adaptation
of [Linear's Resources menu](https://linear.app/). Following the user's
2026-09-19 refinements, a sticky title with children opens on hover without an
arrow; its text aligns with ordinary links. Parent destinations are described
entries in one group; direct pages occupy a separate group. When all choices
are direct pages, they form a horizontal panel with balanced columns. A compact
list is used only beside a parent group. Panels align with their trigger where
space permits and stay within the navigation row and viewport after resizing.
A useful authored root page is the first parent choice, identified by its existing
title. Destinations without children stay direct links. The left tree
retains separate links and disclosures, as in the
[WAI hybrid navigation example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/).
Norna uses native `details`, list and navigation semantics instead of an
application menu role. Conditional area trees and left H2 outlines are Norna's
adaptation; they are not a claim about Linear's article layout. The exact
geometry is a local design proposal, not a general standard.

The latest desktop reading frame uses one sticky row. Home, site Search and
Display align above the left tree; an icon menu button and breadcrumbs align
above the article. Moving the collection button beside the breadcrumb removes
the second row above the tree. Breadcrumb links retain their existing
destinations and do not open the menu. The button's accessible name identifies
the collection, such as Reference. Site model remains ordinary text above its
local tree; Getting Started does not repeat its collection name there.
The same area-panel component renders the Reference choices here and on Home,
with the same descriptions and grid. The reading-page panel adds a separated
footer for Home and other global destinations.
Keep Home as an explicit destination in that menu, alongside the brand's home
shortcut in the header. The English return-home label is shortened to Home.

Home retains its global row. Tree-mode pages and search retain the reading
frame independently of H2 count. Mobile and Focus reading retain the compact
control row, including Display. On compact pages the breadcrumb stays in the
article; the desktop trail is hidden. Header-height measurement supplies the
anchor offset and the fixed tree's upper edge.

This revision follows the user's 2026-09-19 request to try a sticky breadcrumb
with its menu button instead of the taller left-header trial. Review is limited
to registered visual captures, including opening the menu and loading an H2
fragment. No build, automated regression suite or commit was run for this
revision. Earlier results below describe earlier revisions; maintained tests
still need adaptation to the new controls before a later regression pass.

The sticky-breadcrumb revision was inspected at 1440×1000 light (Site files,
menu closed/open), 1024×900 dark (Install Norna, and Site files at Page folders
with its menu open), and 390×844 light (Site files). The intermediate-width
capture exposed a clipped first menu frame before JavaScript repositioned it.
The panel now fits beneath the shared row through CSS, before that event and
without requiring JavaScript. A bounded Chrome position inspection then found
no horizontal overflow or page errors: the panel ended at 983px in a 1024px
viewport, and the Page folders heading began at 75.125px below the 75px header.
`git diff --check` passed. Cross-browser regression runs and Focus reading
interaction checks remain deferred to the later approved verification pass.

The hover trial waits 120ms before opening. The navigation row and its panel
form a continuous pointer region, so pausing in the padding between title and
panel keeps it open. Leaving that region starts a 180ms closing delay;
keyboard-focused content remains open.
Global menu titles have a subtle frame and background on hover or keyboard
focus, retained while the panel is open. The frame paints outside the label's
box without changing navigation geometry. These disclosure controls have no
link underline. Ordinary destination links remain clickable and retain their
link feedback, including while another menu is open.
This trigger treatment was visually inspected on Home with Reference open at
1440×1000 light and 1024×900 dark using `review:capture`. `git diff --check`
passed; no build or regression suite was run for this CSS refinement.
Escape closes a hover-opened menu even with focus in the article. Enter, Space
and touch retain native activation; Arrow Down opens and focuses the first
choice. Without JavaScript, native click/keyboard disclosure still works.

When a menu would have more than twelve visible choices, its sticky title is
a direct link and the collection keeps its full tree on every page. The count
includes an authored root's own choice and excludes unlisted nodes. This is a
bounded proposal chosen under the user's delegation, not a Linear rule or a
new public setting. The existing category destination may open its first child;
the prototype does not invent a landing page. Long copy below the limit still
uses a viewport-bounded scrollable panel.

The six English category descriptions live only in
`src/lib/areaNavigationPreview.ts`. They are preview copy, not an inferred
category schema. Page descriptions use existing metadata; missing descriptions
leave title links intact. A permanent description source and localization
belong to an adoption decision.

H2 links and child pages reuse the existing recursive tree in its existing
order. H3 remains in article content. Link/disclosure semantics, current-state
markers, reduced motion, intent prefetch and browser history reuse the prior
implementation. Typography stays constant when selection changes. No article
snapshot or crossfade is reintroduced.

Removing the right column also removes its old extra-width allowance for code,
tables and margin-note calculations. Notes use the actual remaining canvas,
falling below their paragraph when a full note lane does not fit. Compact Menu
keeps the complete page hierarchy and H2 destinations, including other areas;
Focus reading and Display remain available.

## Review evidence and remaining checks

Initial Chromium captures were made with `npm run review:capture` and inspected
at 1440×1000, 1024×900 and 390×844. They cover desktop light/dark, intermediate
light/dark and mobile light/dark, including Reference's open area menu and the
compact menu. The capture paths are under the ignored `.local/review-captures/`.

| Page / target | View and Appearance | Observation |
| --- | --- | --- |
| `reference/site/files/`, scratch | Desktop dark, area menu open/closed | Three equal columns, scoped Site model tree and recovered right canvas. Initial inherited first-level boldness was corrected; final labels use weight 400. |
| `reference/content/sidenotes/`, scratch | Desktop light | Notes align beside their paragraph without an outline column. |
| `reference/site/files/`, scratch | Compact light, area menu open | Area choices fit the viewport below the complete sticky row, including its wrapped links. |
| `reference/content/sidenotes/`, scratch | Compact dark | Notes use the paragraph flow; the left tree remains usable. |
| `reference/content/sidenotes/`, scratch | Mobile light; mobile dark with Menu | Flow notes, bounded content and reachable H2 links in the compact tree. |
| `guides/installation/`, navigation | Desktop dark | Parent H2 precedes child pages in the same disclosure. |

The following captures describe earlier revisions; their own-H2-only result
for flat collections is superseded by the shared-tree rule above.
Before the hover/grouping refinement, the maintained capture command was used
again for the changed views. These captures were inspected at 1440×1000,
1024×900 and 390×844:

| Page / target | View and Appearance | Observation |
| --- | --- | --- |
| `reference/site/files/`, scratch | Desktop dark and compact light, Reference open | Full-title trigger, six equal choices and the retained Site model tree. |
| `faq/installation/`, scratch | Desktop light, FAQ open | Own H2 only; four choices fit two columns without an empty third column. |
| `getting-started/install-norna/`, scratch | Compact dark, Getting Started open | Five page choices and own H2, with no sibling tree controls. |
| `resources/`, scratch | Desktop dark, Resources open | The authored Resources page is first, followed by Capabilities. |
| `faq/installation/`, scratch | Mobile light | Content fits the viewport with the existing compact navigation. |
| `getting-started/install-norna/`, scratch | Mobile dark, Menu open | The full compact hierarchy and current-page H2 remain reachable. |
| `reference/`, navigation | Desktop light, Reference open | The authored root is first; its single H2 remains on the left. |

A short installed-Chrome inspection of the refined result confirmed that
clicking the FAQ, Getting Started and Resources title text opens a menu without
changing the URL. Their page choices navigate correctly and have only their
own H2, without sibling trees or tree controls. The area/H2 checks below also
passed in this inspection, with no page errors, and the ordinary docs target
still rendered its baseline right outline. This is a bounded local inspection,
not the pending cross-browser regression pass. The root-page outline result
in that earlier inspection is superseded by the parent-tree rule above.

The hover/grouping round used registered captures for Reference (desktop dark),
Resources (desktop light), FAQ (compact light), and the large Guides collection
(desktop dark). The title and direct-link text align; Resources and Capabilities
occupy distinct groups. Guides has no top panel and retains all its pages in
the left tree. A short installed-Chrome inspection measured the same text top
at 33.3125 CSS pixels for all seven sticky labels at both 1440px and 1024px.
It confirmed hover opening without moving focus, Escape dismissal, persistence
while pointing inside the panel, closing after pointer exit, keyboard opening
with focus return on Escape, and touch opening. Parent Resources uses its tree;
direct Capabilities uses its own H2. No page errors occurred in that sequence.
These observations do not replace the pending maintained and native-browser
regression runs. The final compact dark Reference panel, mobile light Resources
and mobile dark FAQ with Menu open were also captured and inspected; content
and compact navigation remained within their viewports.

The user's next review exposed a gap missed by the quick hover check. An
installed-Chrome reproduction paused for 700ms in the 17.1875px space below the
title: Reference and Getting Started both closed at 1440px and 1024px. Getting
Started's narrow panel also began about 319px to the right of its trigger's
center at 1440px. The correction makes the row and panel one hover region,
anchors panels to their titles within available space, and presents flat
collections in columns. Getting Started uses three columns; FAQ uses two.
Touch pointer exit no longer starts a mouse-hover closing timer.

Registered captures of Getting Started at desktop dark and compact light,
and FAQ at desktop light, were inspected after the correction. The flat panels
fit their viewports and sit beneath their sticky-title area. The slow crossing
check passed all four reproduced cases. Maintained regressions now include
the pause, diagonal entry, resizing and sustained touch opening; these prepared
tests still await the working-result review.

The subsequent Home-to-What-Norna-Does report exposed a separate width change.
At a 1440px viewport, Home used an 1180px row while Features used 1344px, moving
every global label 82px to the right. Home now uses the same outer navigation
frame in this trial. Installed Chrome and Playwright WebKit measured zero label
movement at 1440px, 1200px and 1024px after the correction; WebKit is not native
Safari evidence. Registered captures of both pages at desktop dark and mobile
light were inspected with matching header geometry. The prepared regression
covers both directions and mobile controls as well.

After the flat-collection rule changed, registered captures were inspected for
FAQ at desktop light, intermediate dark and mobile dark; Getting Started at
desktop dark and mobile light with Menu open; and Capabilities at desktop
light. FAQ shows all four sibling pages, Getting Started all five, and the
authored Resources parent remains in the Capabilities tree. The current
outline is open on a fresh session. These views fit their viewports and retain
the existing compact navigation.

A bounded installed-Chrome inspection confirmed the same collection on direct
arrival, a sticky page choice and reload. FAQ and Getting Started also retained
their siblings when following another page's H2 link. Reference still selected
the Site model area. There were no page errors or horizontal overflow in that
1440px inspection. At this checkpoint saved closed outlines still overrode
new page choices. The subsequent page-choice rule below supersedes that
behavior. The updated maintained model and browser tests remain pending
working-result review.

A short installed-Chrome interaction inspection confirmed another page's H2
link, fragment offset within one pixel, two independently open outlines,
Configuration selected by its area link, no right outline, no nested H3 list,
weight 400 across the seven Site model pages and no page errors in that flow.
A later comparison-page evaluation was interrupted by a document reload. A
separate registered capture of the ordinary docs page confirmed its original
full Reference tree and right outline; it does not establish a timing comparison.

### Page choices and history, 2026-09-19

The next review requested opening the selected page's branch/H2 from both
sticky and left navigation while preserving row position. The implementation
shares arrival policy between early and deferred state restoration. New
arrivals open the selected branch; history entries restore their own saved
disclosures and scroll positions. Same-page links open the current branch,
and a name click settles any interrupted disclosure animation first.

Installed-browser inspections used 1440×920 and covered reopening Install
Norna from Getting Started after closing it, a high sibling-page click,
reopening through the current page name, and a low Configuration entry with
other outlines expanded. The chosen row moved zero CSS pixels and had no
position variation in sampled complete-document arrival frames in all four
browsers. No closed-current-outline frame was recorded for these new page
arrivals, and no page errors occurred.

| Browser | Version | Back/Forward after a low menu click |
| --- | --- | --- |
| Chrome | 153.0.8010.48 | Exact disclosure, menu and article positions; cached return observed. |
| Safari | 26.6.2 | Exact disclosure, menu and article positions; cached return observed. |
| Firefox | 156.0 | Exact disclosure, menu and article positions after the correction below; uncached return observed. |
| Brave | 153.0.8010.53 | Exact disclosure, menu and article positions; cached return observed. |

Firefox initially restored the menu correctly, then heading following moved
it by 983px. The area trial now pauses following on arrival/history until the
reader interacts outside navigation. Native scroll-restoration events alone
do not resume it. The repeated Firefox sequence restored an explicitly closed
current outline and the exact earlier position. Article interaction followed
by wheel scrolling resumed following in all four browsers; navigation retains
its existing protection while a menu control owns keyboard focus.

Additional inspections covered an internal same-document H2 link, history
across that fragment, and a page-name click during a closing animation.
They retained the expected open/closed states. Firefox was still smoothly
returning the article at the first 300ms sample; the settled position matched
at 1s. This is a distinction between an intermediate scroll sample and the
restored reading position, not a claim of instantaneous native scrolling.

Pausing following exposed a short-window case: a direct Shared site content
arrival at 1440×650 could leave its selected row below the fold. Early
restoration now reveals an off-screen current title when no scrolled or
history position needs preserving. In all four browsers the row was visible
with its branch open and had zero position variation in sampled arrival
frames. Already visible rows retain their position.

Registered captures were inspected for Build and publish (desktop light),
Shared site content (desktop dark and short desktop light), Choose a theme
(intermediate light), and FAQ project setup (mobile dark with Menu open).
This is bounded geometry/interaction evidence, not a substitute for the user's
blink review, Safari fullscreen/two-finger scroll review or the maintained
browser regression pass. The ignored measurements are under
`.local/area-navigation/arrival-inspections/` (`final`, `restored`, `follow`
and `short`).

The state tests cover the new arrival/history distinction, preserved history
metadata, storage fallback, and avoidance of repeated `replaceState` calls
during scrolling. The emitted inline script is also checked against the
fresh isolated prototype build. Commands for this checkpoint:

```sh
NORNA_AREA_NAVIGATION_PROTOTYPE=1 NORNA_INTERNAL_STATE_DIR=.local/area-navigation/arrival-build npm run build
NORNA_NAVIGATION_STATE_PAGE=.local/area-navigation/arrival-build/dist/reference/site/pages/index.html npm exec -- playwright test tests/navigation-state.spec.ts
```

The final build produced 78 routes and indexed 68 pages. All 26 state cases
passed in 0.8s, including the emitted-script cases, with no skips. These focused
state/serialization checks ran early because an invalid embedded restoration
script would break the trial before visual review. The maintained browser
suites remain pending that review.

The first emitted-script check accidentally pointed at ordinary `dist/`,
which had no prototype scripts. Selecting the isolated prototype artifact
corrected the check input. It did not require a renderer change.

On the subsequent Install Norna review, the sticky filter's background
overlapped the bottom 4px of the Getting Started area title, even at menu
scroll position zero. The background extends 1.25rem above the controls;
the title previously left only 1rem. Titles followed by controls now leave
1.5rem, keeping the text and its underline clear while retaining the mask
for scrolled rows. Chrome and Safari both measured 4px of clearance after
the change. Registered desktop light and intermediate dark captures were
inspected on Install Norna. This is a CSS spacing correction; the arrival
and history code is unchanged.

`npm run test:documentation`, `git diff --check` and `npm run test:dead-code`
passed for the initial prepared implementation. Knip ran early to check the extracted
build-time switches and their import graph, a failure boundary identified by
[BL-128 Investigate recurring release failures](backlog/BL-128-recurring-release-failures.md).
`npm run test:documentation` also passed after the hover/grouping refinement;
`git diff --check` passed. Maintained browser tests have been prepared for
alignment, slow hover crossing, dismissal/persistence, panel placement,
parent/direct groups, touch activation
and overflow, but have not yet run against this revision.
The broader browser/scroll and maintained behavior checks are pending human review.
Prepared coverage includes area resolution, shared state, first page clicks,
history, filter clipping, note geometry, no-script links, touch, keyboard,
Focus reading, prose/external links, parent pages and H3 deep links. Planned
commands, each covering a distinct contract, are:

```sh
npm run test:navigation-model
NORNA_AREA_NAVIGATION_PROTOTYPE=1 node scripts/test-navigation.mjs --site-dir site tests/area-navigation-prototype.spec.ts
NORNA_AREA_NAVIGATION_PROTOTYPE=1 node scripts/test-navigation.mjs --site-dir fixtures/nested-pages/site tests/area-navigation-parent.spec.ts
npm run review:test -- navigation
npm run test:navigation
npm run test:documentation
git diff --check
```

The isolated prototype build above precedes the title-spacing correction.
Rebuild it after local approval of that visual change.

The baseline fixture/sticky suites must run without the area flag. The new
suites must run with it and must not merely skip. Record counts, duration,
tested revision and any repairs after execution. The installed-browser arrival
checks above do not complete the wider scoped visual/scroll sequences;
Playwright WebKit is not Safari. No full release test chain, publication or
default promotion is implied.

[BL-119 Direct-hash positioning in static previews](backlog/BL-119-static-preview-hash-positioning.md)
remains a separate baseline issue. Development-server fragment checks do not
prove its production-preview case fixed. Public reference still describes the
supported model; this trial must be assessed before proposing its promotion.
