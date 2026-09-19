# Area navigation prototype

[BL-122 Area navigation and integrated H2 prototype](backlog/BL-122-area-navigation-prototype.md)
is complete as an opt-in implementation on 2026-09-19. It combines an area's
pages and H2 links in the left menu, returns the right outline column to the
reading canvas, and uses a shared area menu on Home and beside the sticky
breadcrumb. The user reviewed the working design before this final regression
pass. Native tooltip timing and Locate current page retain their existing behavior.

The recommendation is to adopt this navigation direction. Default activation,
the permanent source of category descriptions and the supported reference
contract still require the separate adoption step specified in the brief.
The prototype remains off by default and has not been released. The public
reference continues to describe the supported model.

## Reproduce the implementation

From the engine repository root:

```sh
npm run review:stop -- scratch
npm run review:scratch -- prepare --from site --replace
NORNA_AREA_NAVIGATION_PROTOTYPE=1 npm run review:start -- scratch
```

Preparing with `--replace` replaces the disposable physical copy, not the
documentation source. Open
[Site files](http://127.0.0.1:4399/norna/reference/site/files/), then the menu
button beside its breadcrumb. Home retains the global hover menus. Inspect
[Sidenotes](http://127.0.0.1:4399/norna/reference/content/sidenotes/) for the
recovered margin and narrow-screen fallback.

The internal switch also enables the existing navigation-continuity trial.
It adds no supported site configuration or category field. To compare with
that earlier trial, stop scratch and start it with
`NORNA_AREA_NAVIGATION_PROTOTYPE=0 NORNA_NAVIGATION_PROTOTYPE=1`.
Ordinary docs remain available through `npm run review:start -- docs` with
both flags unset. Restart the server when changing flags.

For authored parents and deeper descendants:

```sh
npm run review:stop -- navigation
NORNA_AREA_NAVIGATION_PROTOTYPE=1 npm run review:start -- navigation
```

[Installation](http://127.0.0.1:4323/guides/installation/) keeps its own H2
before macOS, Linux and Windows. Guides has 22 immediate choices, so its global
title links directly to its destination and its pages retain the full tree.
The macOS H3 Prerequisites anchor remains usable without another outline level.
Restart this target without the flag to restore its ordinary view.

## Navigation contract

The listed page tree determines scope; click history, titles and descriptions
do not. Unlisted subtrees and empty categories remain excluded by the shared
tree builder. The existing category-destination resolver supplies links, which
can open the first child directly without an intermediate category page.

- A flat collection keeps all its sibling pages and H2 together. This applies
  to categories such as Getting Started and FAQ and authored parents such as
  Resources, without a minimum page or heading count.
- In a collection with subgroups, an immediate child with descendants supplies
  the local area. A direct leaf beside those groups has only its own H2, as
  does a standalone global page. A page with no H2 omits that outline.
- An authored parent's own page retains its tree. H2 links precede child pages
  under the same disclosure. H3 remains in the document with its existing anchors.
- More than twelve visible menu choices, counting an authored root's own
  choice, changes the global title to a direct link and retains the full
  collection tree. Twelve is the delegated trial choice, not a public setting.
- Page names navigate; separate chevrons disclose. A new page choice opens the
  arriving branch and outline before display. Clicking the current page name
  returns to its beginning and opens its outline. Other branches stay independent.
- Back/Forward restores that entry's disclosures, menu position and article
  reading position, including deliberately closed current branches. Arrival
  tracking does not shift the selected row. Direct arrival in a short window
  reveals an off-screen current title when no saved position takes precedence.

Desktop tree pages use one sticky row: Home, Search and Display above the left
rail, with the icon menu and breadcrumb above the article. A distinct area
title such as Site model is plain text above the filter. Getting Started does
not repeat its collection name there. The frame follows navigation mode,
independently of H2 count; Search retains it without an outline. Search keeps
its full-site content scope, while the tree filter matches navigation labels.

Home uses global navigation. Mobile and Focus reading retain compact controls,
including Display. Mobile breadcrumbs stay in the article; desktop pages hide
that duplicate trail. Measured header height supplies the anchor offset and
the rail's upper edge.

One panel component supplies both global and reading-page menus. It groups
parent destinations with descriptions separately from direct pages, balancing
flat collections into columns. Reading-page menus add Home and other global
destinations in a separate footer. The English footer label is Home.

Global menu titles open after 120ms of hover. The title, intervening header
padding and panel form a continuous pointer region; leaving it starts a
180ms closing delay. Escape closes the panel without requiring focus inside.
Click, keyboard, touch and native no-script disclosure remain available.
A subtle frame and background mark hover, focus and open state without changing
label geometry. Disclosure titles have no link underline; actual links retain
their link feedback. Menu fitting is supplied by CSS before JavaScript runs.

This follows the approved adaptation of
[Linear's Resources menu](https://linear.app/) and the separate link/disclosure
pattern in the [WAI hybrid navigation example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/).
Left-side H2 integration, the overflow threshold and exact dimensions are Norna
design decisions, not claims about Linear or general standards.

Removing the right column also removes its extra-width allowance for code,
tables and note calculations. Notes use the remaining canvas beside their
paragraph and fall into the text flow when a complete note lane will not fit.
Typography stays constant when selection changes. The implementation retains
the prior intent prefetch and does not reintroduce an article snapshot.

The six English category descriptions remain explicitly temporary copy in
`src/lib/areaNavigationPreview.ts`. Page descriptions use existing metadata;
missing descriptions leave title links intact. Adoption should replace the
temporary mapping with author-owned, localizable content before general use.

## Final verification, 2026-09-19

The maintained browser tests now exercise the reviewed breadcrumb/menu frame.
They cover global hover alignment and crossing, keyboard, touch and no-script
links, flat and mixed collections, parent pages, overflow, H2/H3 destinations,
first page clicks, disclosure stability, filters, history, Focus reading, search
controls, prose and category-list links, native external links, and note geometry.

| Check | Result |
| --- | --- |
| Area documentation suite | 25 of 26 passed initially. Its history failure was repaired; all five affected arrival/history/filter cases then passed. The additional Search-frame case passed separately, giving passing results for all 27 cases. |
| Area parent/deep-tree suite | 3 passed in 5.4s. |
| Ordinary registered navigation suite | 63 passed in 45.4s, with the area flag unset. |
| Ordinary top-navigation suite | 23 passed in 21.6s, with the area flag unset. |
| State interpretation and lifecycle | 27 passed; the initially skipped built-artifact case then passed against the fresh output, covering all 28 cases. |
| Review capture wrapper | Passed, including area/Display panels and the scoped Focus reading cookie. |
| Content check and isolated opt-in build | Passed; 78 routes built and 68 pages indexed. |

The first area run exposed a WebKit history race. During traversal,
`history.state` could already describe the destination when the departing
document saved its menu at `pagehide`. The old code assigned a new identity to
that destination, so Back reopened branches instead of restoring their saved
state. Saving now uses the active document's remembered entry. Explicit entry
reads on traversal and URL changes select the next identity. Deterministic
tests also cover a destination with the same URL and preservation of another
history owner's data.

The ordinary model and dead-code checks passed for the preceding checkpoint;
the area resolver and import/export graph were unchanged in this completion.
The full release chain was intentionally not run. No packaging, deployment,
public schema or supported configuration contract changed.

Reproducible commands for the distinct maintained checks:

```sh
NORNA_AREA_NAVIGATION_PROTOTYPE=1 node scripts/test-navigation.mjs --site-dir site tests/area-navigation-prototype.spec.ts
NORNA_AREA_NAVIGATION_PROTOTYPE=1 node scripts/test-navigation.mjs --site-dir fixtures/nested-pages/site tests/area-navigation-parent.spec.ts
npm run review:test -- navigation
npm run test:navigation
npm exec -- playwright test tests/navigation-state.spec.ts
npm run test:review-environments
npm run content:check
NORNA_AREA_NAVIGATION_PROTOTYPE=1 NORNA_INTERNAL_STATE_DIR=.local/area-navigation/final-build npm run build
NORNA_NAVIGATION_STATE_PAGE=.local/area-navigation/final-build/dist/reference/site/pages/index.html npm exec -- playwright test tests/navigation-state.spec.ts --grep 'built inline'
npm run test:documentation
git diff --check
```

After the history repair, the focused documentation-suite rerun used
`--grep 'history restores|restores history|page choice reopens|shares compact'`;
the added case used `--grep 'keeps site search'`. Unaffected cases were not
rerun solely to prepare the commit.

## Installed browsers and visual review

The final arrival measurements used Chrome 153.0.8010.48, Brave 153.0.8010.53,
Firefox 156.0 and installed Safari 26.6.2. Chrome, Brave and Firefox used
1440×920; Safari's actual desktop/fullscreen dimensions were recorded by the
native driver. These are installed-browser measurements, separate from the
maintained Playwright WebKit suite.

All four measured 0px movement of the selected row for high and low page clicks
and reopening the current page. Sampled complete arrival frames also showed
0px variation. Back/Forward restored exact menu positions, article positions
and disclosure sets. Same-document fragment history settled correctly too;
Firefox's article was still 21px from its settled position at the 300ms sample
and matched at the later sample. No page-script errors were recorded.

Native wheel checks cover Site files and Working on a site article scrolling,
plus the left menus on those pages, Convert legacy sources and Page metadata.
The probes also inspect filter masking, page-link hit targets and links from
the generated Reference overview. Every menu reached its end; no wheel event
was canceled, no link appeared through the filter mask and the inspected page
links had unobstructed hit targets. Safari received all wheel inputs while
visible and focused. Firefox handed subsequent wheel input to the article
after its menu reached the scroll limit; that native boundary behavior differs
from the other measured browsers. Ignored evidence is under
`.local/area-navigation/arrival-inspections/completed/` and
`.local/navigation-prototype/scroll-review/area-completed/`.
Native wheel input is not a physical trackpad or a proof that no perceptual
blink can occur on every system.

Registered captures were inspected at 1440×1000 light with the Site files area
menu open, 1024×900 dark at Page folders with the menu open, 390×844 light with
the Getting Started compact menu open, and 1440×1000 dark on Sidenotes. The
panel fits, the sticky breadcrumb clears anchors, mobile controls remain
reachable, and notes occupy the recovered margin. Captures are ignored local
review artifacts; the approved SVG remains a concept, not implementation evidence.

## Adoption boundary

Adopt the reviewed navigation structure after settling the category-description
source and updating the supported reference in the same implementation step.
Do not add author-selected area metadata merely to reproduce this trial:
existing hierarchy already determines scope. Keep the baseline available until
that change deliberately replaces the internal flags.

[BL-119 Direct-hash positioning in static previews](backlog/BL-119-static-preview-hash-positioning.md)
remains a separate baseline issue. These development-server fragment tests and
the build do not claim to resolve its production-preview failure. No release,
default promotion or publication is implied by this completed prototype.
