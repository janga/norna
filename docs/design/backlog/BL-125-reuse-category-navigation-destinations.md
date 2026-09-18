# BL-125 Reuse category destinations in navigation rendering

Completed on 2026-09-18. All prototype link renderers reuse the site model.

## Purpose and evidence

Make prototype header links, tree category links and generated child lists use
one resolved category destination rule. At `ff1701f`, `SiteNavigation.astro` and
`SitePage.astro` use `createCategoryDestinationModel`, while
`NavigationPageTree.astro` independently selects the first listed direct child.
The reviewed routes agree today, but the earlier prototype exposed a visible
intermediate redirect when different renderers did not choose the same target.

See [BL-123 Navigation JavaScript refactoring assessment](BL-123-navigation-javascript-refactoring-assessment.md#2-use-the-category-destination-model-in-all-prototype-link-renderers).
This is a server-rendering refactoring, not a new category-routing policy.

## Bounded change

Pass or reuse the existing category destination model in navigation rendering.
Use a small shared selector for the target node/path where necessary, then apply
the existing base-path helper. Remove the independent first-child selection from
the tree renderer. Keep the prototype opt-in condition at the rendering boundary.

Preserve these distinctions:

- With the prototype disabled, global category links target the category URL.
- With the prototype enabled, a first listed direct page is linked directly.
- A first listed direct category keeps the generated category-list destination;
  a later sibling page or deeper descendant must not replace it.
- Ordinary page destinations, listed/excluded ancestry, deployment base paths,
  label text and the separate category arrow remain unchanged.

Do not add client-side destination resolution, change prose links or aliases,
enable the prototype by default, or change the public reference contract.

## Verification and completion

Check the destination table once, then assert rendered hrefs in header, tree and
generated-list locations with the prototype on/off. Include page-first,
category-first, excluded-first-child and base-path cases. Use the existing
category-title/arrow, generated-overview and no-JavaScript browser cases for
the interactive contract; verify the build after template changes.

Risk is low to medium: changing which category child is selected can change both
URLs and whether a page transition passes through a redirect. Compare against
`ff1701f` and the canonical category destination model. No new architecture or
visual design decision is required. Commit this item separately.

## Completion and verification

`SitePage.astro` and `SearchPage.astro` now pass the existing category map to
their navigation components when the prototype is enabled. Header, recursive
desktop/mobile trees, submenus and generated child lists use
`getNavigationDestination` from `siteNavigation.ts`. The tree no longer infers
destinations independently, and the header no longer builds a second model.
Labels, disclosure controls, base paths and the prototype gate are preserved.

The category fixture includes an unlisted first page and enables the generated
search page. Its browser checks assert actual hrefs for page-first and
category-first collections, nested categories, ordinary pages and generated
lists, with JavaScript enabled and disabled. Search navigation must load a
successful response with the Search heading, preventing a fallback page from
accidentally satisfying its menu assertions.

- `npm run test:site-links`: passed, including the category destination model.
- `node scripts/test-navigation.mjs --site-dir fixtures/category-destinations/site tests/category-destinations.spec.ts --grep 'category destinations with'`:
  8 cases passed in Chromium with the prototype disabled.
- The same command with `NORNA_NAVIGATION_PROTOTYPE=1`: 8 cases passed in WebKit.
- `NORNA_NAVIGATION_PROTOTYPE=1 node scripts/test-navigation.mjs --site-dir site tests/navigation-prototype.spec.ts --grep 'category destinations|separates category|category-overview'`:
  4 cases passed, including native no-JavaScript links, separate category text
  and arrow activation at desktop/mobile widths, and single-document arrivals.
- `npm run review:test -- navigation`: all 63 cases passed.
- `NORNA_NAVIGATION_PROTOTYPE=1 NORNA_INTERNAL_STATE_DIR="$PWD/.local/navigation-prototype/refactor-category-build/.norna" npm run build`:
  passed; 78 pages and 68 indexed pages.
- `npm run test:documentation` and `git diff --check`: passed.

The full release suite and unchanged redirect-appearance cases were not rerun.
No CSS or interaction design changed; the existing visual approval applies.
