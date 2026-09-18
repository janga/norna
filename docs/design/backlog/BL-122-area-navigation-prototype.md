# BL-122 Area navigation and integrated H2 prototype

## Purpose

Give documentation readers more room for the article and its sidenotes by
choosing an area from the sticky navigation and showing that area's pages and
H2 headings in one left menu. Evaluate the complete reading experience before
changing Norna's supported navigation model.

**High priority; ready after BL-129 Regression tests for the navigation latency
correction; queued under `Next`.** This develops the existing **BL-122
Reconsider the right-hand menu**, originally recorded without analysis because
the right contents rail competed with sidenotes. It is the same product
outcome, not a second backlog item.

The user approved the revised static prototype on 2026-09-19. That approval
establishes the visual direction below; it does not establish that a working
implementation, responsive behavior or browser interaction has been tested.

## Scope and boundaries

Build an explicitly enabled, local prototype on a physical copy of the
documentation site under `.local/test-sites/scratch/site/`, using the registered
`scratch` review target. Keep the ordinary documentation site available as a
baseline. Begin with Reference, whose six sibling areas supply the approved
example; also exercise Getting Started, FAQ and Examples when moving between
global destinations.

Keep page URLs, content ownership and the existing page/category hierarchy.
An area is a navigation scope, not a new authored page type. Existing category
destinations continue to work; do not add editorial landing pages merely to
populate a menu. Include a fixture with a content-bearing parent page, its own
H2 headings and child pages, plus a deeper nested branch.

This item delivers a reviewable prototype, evidence and a recommendation about
adoption. Keep it opt-in and independently comparable with the existing
navigation-continuity prototype. Do not enable it by default, release it, add
a supported configuration contract or change all sites' navigation modes in
this item. A later adoption decision must settle the public contract and its
reference documentation.

## Decisions made

### Sticky navigation and area choice

- Keep the sticky row as the entry to the site's main destinations. A title
  follows its page/category destination; a separate disclosure control opens
  the area menu when there are area choices. Retain direct links where a menu
  is unnecessary.
- Use the approved Linear-inspired three-column area menu on wide screens.
  All six Reference areas have equal visual status: the same title treatment,
  description space and interaction. Do not make the last two secondary links.
  Use the existing node titles: Site model, Configuration, Content syntax,
  Commands, Reader experience and Working on a site. The sketch's shorter
  `Content` and `Reader controls` labels do not authorize renaming content.
- Choosing an area scopes the left menu to that branch. Keep all other areas
  reachable through the sticky menu. A direct URL, prose link or history
  navigation must resolve the same area as arrival through the menu.
- Preserve the area's own destination and any useful parent content. Opening
  a disclosure must not follow its link, and following a link must not toggle
  the disclosure instead.

### Left menu

- Show the selected area's pages and categories rather than repeating the
  complete Reference tree. Preserve hierarchy inside the selected area.
- Show H2 links beneath their owning page. H3 headings remain in the document
  with their existing anchors but do not add another menu level in this trial.
- Keep the current implementation's order for a page with both an outline and
  children: its H2 links first, then its child pages, under the same parent
  disclosure. Use restrained indentation, spacing and a thin vertical line
  to convey belonging. Add no visible `On this page` or `Child pages` labels.
- Other pages' H2 links can be disclosed without first loading those pages.
  Preserve independent branch choices; opening one branch does not close
  another. Keep the existing session-state and current-branch behavior.
- Page text is a real page link; an H2 entry is a real fragment link; the
  separate chevron opens or closes a branch. Navigation without JavaScript,
  opening links in a new tab, deep links and normal browser history remain
  available.
- Keep navigation label size and weight constant when current-page and
  current-heading state changes. Current-page and reading-position markers
  must not change line wrapping or move following rows.

### Reading surface and sidenotes

- Remove the persistent right contents rail from the prototype's reading
  layout and reclaim its column and gap. Keep the article's prose measure
  readable; use the additional room for the content canvas and sidenotes.
- Keep sidenotes beside the paragraphs they explain, using Norna's small
  reference letters and restrained margin treatment. They are not a separate
  fixed panel or another navigation column.
- Preserve the existing flow fallback when a note lane does not fit, reader
  Display choices and Focus reading. At narrow widths, retain the compact
  navigation and access to every page and H2 destination represented by the
  prototype, without horizontal page overflow.

## Approved visual reference

![Approved area-navigation prototype with integrated H2 links and a parent-page detail](assets/BL-122-area-navigation-prototype.svg)

This is the revised SVG approved on 2026-09-19, authored as a vector concept
during the design discussion. It is not a capture of implemented UI. The main
view uses Site files; Pages and categories is also expanded to demonstrate
access to another page's H2 links. The parent-page detail uses Installation
from `fixtures/nested-pages/site`, matching the order observed in the current
implementation. Article excerpts and notes illustrate the layout.

The reference menu borrows the broad structure observed in
[Linear's Resources menu](https://linear.app/), with equal treatment of all six
Norna areas as the user's explicit adaptation. Linear's inspected
[documentation page](https://linear.app/docs/update-cycles) keeps its article
outline on the right; integrating H2 on the left is a Norna design choice.
The separate link/disclosure behavior follows the
[W3C WAI navigation example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/).
These references support the pattern, not a claim that every dimension or
interaction in the SVG is an established standard.

## Existing-code findings and implementation baseline

On 2026-09-19 the user requested examination of the existing code rather than
deciding between automatic and author-selected areas as a new product choice.
That inspection establishes the following foundation:

- [The shared tree builder](../../../scripts/lib/site-navigation-tree.mjs)
  builds parent/child relationships from `parentPagePath`, retains source
  ordering, filters unlisted subtrees and omits empty categories.
- [SiteNavigation](../../../src/components/SiteNavigation.astro) uses that
  tree's roots for the sticky destinations.
  [SiteTreeNavigation](../../../src/components/SiteTreeNavigation.astro)
  selects the root containing the current page and renders its whole branch.
  Thus Reference is today's local root, with Site model and Configuration
  already represented as its immediate children.
- [TopPageMenu](../../../src/components/TopPageMenu.astro) already separates
  the title link from a disclosure and can receive a node's children. The
  present tree-mode page does not enable that top child menu; showing area
  choices there and selecting a deeper local root are new prototype behavior.
- [NavigationPageTree](../../../src/components/NavigationPageTree.astro)
  already places a parent's heading outline before its children and permits
  disclosure of other pages' headings. Reuse that ordering and link semantics.
- [The schemas](../../../scripts/lib/schema-definitions.mjs) provide
  `navigation.mode` and page listing metadata, but no author-selected area
  boundaries. A category has only `label`; unlike a content page, it has no
  description field.

Use the existing tree as the automatic source for this opt-in trial. Area
choices are the listed immediate children of a sticky destination. A choice
with descendants establishes that branch as the local root; a child without
descendants remains a direct page destination. For a direct child page, retain
the containing root's local context rather than reducing the menu to one page.
This keeps a flat FAQ or Getting Started collection usable. A deeper arrival
selects the same immediate child branch from ancestry, not from a remembered
click. At the sticky destination's own page, retain its own outline and access
to its children. Home keeps its existing exception.

These rules are an implementation baseline derived from the existing model
and the approved Reference sketch, not a claim that the new scoped behavior
already exists. Do not add author-maintained area metadata, hardcode the six
Reference labels into engine logic, change URLs or reparent content. Derive
state keys and selected-area markers from stable node identity; preserve the
shared category-destination resolver and filtering rules.

For the six category descriptions in the visual trial, use explicitly scoped
preview copy outside the public category schema. Page descriptions may come
from existing metadata. Include missing-description cases, keep equal area
status, and do not silently infer descriptions or introduce a new public
field. The descriptions' permanent source belongs to the adoption decision.

## Preliminary proposals

Keep responsive arrangement, submenu placement and exact spacing as prototype
work. The three-column drawing establishes the desktop direction, not fixed
pixel dimensions for every viewport. Reuse the existing compact menu and
disclosure semantics wherever they cover the contract.

## Open questions

None blocks the bounded prototype. The existing code supplies its tree and
area-selection baseline; the approved SVG supplies its visual direction.
Default rollout, whether author overrides are justified, the permanent source
of category descriptions and changes outside this trial belong to the later
adoption decision. Do not treat a preselected question option as user approval.

## Dependencies

- Complete and commit
  [BL-129 Regression tests for the navigation latency correction](BL-129-navigation-latency-regression-tests.md)
  before changing the navigation again. Use that result as the regression
  baseline instead of rerunning the same unchanged checks for this brief.
- Preserve the approved behavior and fixes recorded in
  [BL-120 Smooth documentation navigation prototype](BL-120-smooth-documentation-navigation-prototype.md)
  and the subsequent [navigation latency investigation](../navigation-latency-investigation.md).
  In particular, retain stable menu typography, restored scroll state and the
  Safari correction that avoids a separate article snapshot.
- Keep the completed
  [BL-123 Navigation JavaScript refactoring assessment](BL-123-navigation-javascript-refactoring-assessment.md)
  and its focused refactorings as the starting point. This item is not a new
  general JavaScript cleanup project.
- [BL-119 Direct-hash positioning in static previews](BL-119-static-preview-hash-positioning.md)
  is a separately tracked baseline issue. Record its effect on this trial
  explicitly; do not weaken fragment-position assertions or imply it is fixed.

## Ready for implementation when

The scope is ready and queued under `Next`; begin after
**BL-129 Regression tests for the navigation latency correction** has completed
and been committed. The code-derived baseline, approved SVG and decisions
above are durable inputs; repeating the sketch approval is unnecessary.

## Prototype review and acceptance

Implement a coherent local trial, inspect its rendered desktop, intermediate
and mobile states in light and dark Appearance, and then give the user the
registered review URL. Human review of the working behavior precedes broad
browser regression work. Static sketch approval does not replace this review.

Use the following cases to assess the change and record observations separately
from hypotheses:

| Case | Required result |
| --- | --- |
| Select each Reference area; open its page directly or through a prose link. | The same area is selected and all its pages remain reachable; other areas remain available from the sticky menu. |
| A flat collection, a direct child page beside a child branch, the global destination itself and an unlisted subtree. | Automatic scoping retains useful sibling context, parent content remains reachable and filtering does not reintroduce excluded nodes. |
| Parent page with its own H2 and child pages; deep descendants; a category with no authored page. | H2 precedes child pages, each link has the right destination, and the presentation requires no invented parent content. |
| Disclose another page's outline while reading the current page. | Both can remain open; the other page's fragment links navigate correctly. |
| Open and close branches near the top and bottom of a scrolled left menu. | Expansion preserves the activated row's position; collapse permits only the existing adjustment at the scroll limit; the last item has visible breathing room. |
| Switch sticky destinations, then make the first few left-menu clicks; include Examples to Reference. | No initial menu jump, font-weight reflow, appearance flash or renewed page-transition delay. |
| Scroll the article and menu independently, especially Site files and Convert legacy sources in Safari fullscreen. | Scrolling remains responsive, the menu reaches its end and rows stay below its sticky filter controls. |
| Follow current-page H2, another page's H2, existing H3 deep links, category/overview links, prose links and Back/Forward. | Correct destination, anchor offset and history reading-position restoration; ordinary external-link behavior remains intact. |
| Keyboard, touch, no JavaScript, reduced motion, narrow layout and Focus reading. | Links and disclosures retain distinct actions, focus stays usable, supported destinations remain reachable and notes reflow without overlap. |

Check the visual and scroll cases in installed Safari, Chrome, Firefox and
Brave. A Playwright WebKit result does not substitute for installed Safari
evidence. Capture a small representative set through `npm run review:capture`;
record the page, viewport, Appearance and relevant browser when reporting a
result. Reuse existing diagnostic sequences rather than restarting an
unbounded blink investigation.

After the user approves the working result, add or update the focused area
selection and browser regression coverage. Run
`npm run review:test -- navigation` for changed tree/outline/scroll contracts
and `npm run test:navigation` for the separate sticky-navigation contract. Cover the new
opt-in path explicitly so passing baseline checks cannot mask a skipped
prototype. Reuse the existing prototype regressions where applicable; do not
run an aggregate and its covered child commands on unchanged code.

Follow the repository's build and documentation checks for the actual files
changed. Record exact commands, results and intentional verification gaps.
The full release test chain is not required merely to finish this prototype.

Complete the item with a reproducible opt-in trial, approved interaction and
layout evidence, passing focused checks, and a concise recommendation to
adopt, revise or reject the design. Commit this item's implementation as its
own logical change before starting another backlog item. Promotion to the
default product remains a separate decision.
