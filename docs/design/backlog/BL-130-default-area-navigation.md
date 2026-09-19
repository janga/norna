# BL-130 Make area navigation the default

**Completed 2026-09-19.** The user approved the rendered result and authorized
completion, documentation and commit. Ordinary development and built sites
now use the reviewed navigation without an environment switch.

## Purpose

Adopt [BL-122 Area navigation and integrated H2 prototype](BL-122-area-navigation-prototype.md)
as Norna's supported tree navigation, preserving the existing URLs and simple
site modes. Its [prototype record](../area-navigation-prototype.md) retains
the earlier interactive review and installed-browser measurements.

## Implementation

- Keep `automatic`, `sections`, `top` and `tree`. Tree mode uses area menus,
  the reading frame, sticky breadcrumbs and H2 links in the local page tree.
  Home keeps global navigation; compact navigation, Search and Display remain
  available. The separate right contents rail is removed.
- Keep scope derived from the listed hierarchy, including flat collections,
  authored parents, mixed branches and the twelve-choice menu limit. New page
  choices open their outline; history and reload restore saved entry state.
- Promote navigation continuity to the normal rendering path, rename its
  modules and remove prototype flags, conditional legacy paths and temporary
  category descriptions. Preserve the reviewed state namespace for existing
  sessions. Same-page movement respects `scrollBehavior` and reduced motion.
- Add optional, non-empty `description` to `category.yaml`, with schema help,
  real editor completion coverage and authored documentation-site values.
  Menus and generated category lists use it. No area-selection metadata is
  introduced.
- Preserve the dark-menu surface/border correction. Keep tooltip timing and
  Locate current page unchanged. Correct outline following after a real wheel
  gesture at the article's end, and keep header height stable when Focus
  reading is enabled with a large logo.
- Update canonical navigation, category, heading, image and reader reference;
  introductory examples, screenshots, contributor instructions and schema
  guidance. The five replaced image sources and their generated manifest
  describe the current default.

## Verification

The focused checks below cover the changed contracts. No complete `npm test`
release chain was run. Browser suites ran sequentially after two overlapping
runs collided in Playwright's shared output directory.

| Check | Result |
| --- | --- |
| `npm run review:test -- navigation` | 64 passed: parent pages, tree controls, H2, responsive placement, following and no-script navigation. |
| `npm run review:test -- docs` | 60 passed and four transient failures in the final aggregate; all four passed in the isolated rerun below. The build-dependent state case was then run separately and passed. An earlier adoption run also passed all 64 ordinary cases. |
| `npm run review:test -- presets` | Passing results for all 37 cases after the focused repairs below: 35 passed initially; the copy-control resize assertion and Focus reading geometry then passed. |
| `npm run review:test -- presentation` | 5 passed: sticky table context, horizontal scrolling, row headers, narrow/dark/forced-colors and no-script behavior. |
| `npm run test:navigation` | 23 passed for the separate top/section navigation contract. |
| `node scripts/test-navigation.mjs --site-dir fixtures/category-destinations/site tests/category-destinations.spec.ts` | 22 passed, including no-script destinations and redirect appearance. |
| `node scripts/test-navigation.mjs --site-dir fixtures/navigation-examples/documentation/site tests/navigation-documentation-example.spec.ts` | 2 passed, with and without JavaScript. |
| `node scripts/test-navigation.mjs --site-dir site tests/search-navigation.spec.ts` | 15 passed initially; the remaining prose-link case passed after replacing its dependency on removed editorial copy with a real link fixture. |
| `npm --prefix editors/vscode run test:integration -- --suite metadata` | 4 passed in the actual VS Code suggestion widget: category `description` from a blank line and `desc`, and `tree` from an empty mode value and `tr`. Inserted and saved bytes checked. |
| `npm run test:editor-language` | Passed language-service and editor package checks. |
| `npm run test:navigation-model` | Passed. |
| `npm run test:schemas` and `npm run schemas:check` | Passed; nine schemas generated consistently. |
| `npm run test:project-config` | Passed, including the updated section-tracking diagnostic. |
| `npm run test:review-environments` | Passed for the maintained default suites. |
| `npm run test:presentation-contract` | Passed source-level presentation contracts. |
| `npm run test:client-javascript` | Passed: universal navigation infrastructure remains separate from conditional feature scripts. |
| `node scripts/test-nested-pages.mjs` and `node scripts/test-top-navigation-contract.mjs` | Passed the distinct build contracts, including category descriptions and the absence of the right rail. |
| `npm run test:not-found-page` | 3 passed for localized 404 pages and Home links. |
| `npm run test:dead-code` | Passed with the generated navigation import recorded as a Knip entry. |
| `npm run test:ci-lockfile` | Passed with network access for its temporary npm installation. |
| `npm run test:examples` | All eight public example sites built. |
| `npm run package:check` | Passed installation, CLI, development and build checks from the packed package; explicitly asserts default area navigation. |
| `npm run content:check` and `npm run build` | Passed; 78 routes built and 68 pages indexed. |
| `npm run test:documentation` and `git diff --check` | Passed. |

Exact focused reruns, in addition to the commands above:

```sh
node scripts/test-navigation.mjs --site-dir fixtures/nested-pages/site tests/navigation-following.spec.ts
node scripts/test-navigation.mjs --site-dir fixtures/preset-baseline/site tests/presentation-contract.spec.ts --grep 'code blocks expose an accessible|focus reading preserves'
node scripts/test-navigation.mjs --site-dir fixtures/preset-baseline/site tests/presentation-contract.spec.ts --grep 'focus reading preserves'
node scripts/test-navigation.mjs --site-dir site tests/area-navigation.spec.ts tests/navigation-continuity.spec.ts --grep 'reading frame stable|page choice reopens|resolves prose|prefetches only' --workers 1
node scripts/test-navigation.mjs --site-dir site tests/search-navigation.spec.ts --grep 'search links in page content'
NORNA_NAVIGATION_STATE_PAGE=dist/reference/site/pages/index.html npm exec -- playwright test tests/navigation-state.spec.ts --grep 'built inline'
```

The first presentation rerun exposed a remaining subpixel header-height
change; the final Focus reading rerun passed both geometry and table-width
cases after that correction. The copy-control check now waits for the normal
responsive measurement to settle. Old Home-text and brand-markup assertions
were updated to match the already approved interface. Editor test selection
accounts for the YAML provider's value icon instead of assuming an enum icon.

### Browser tooling and limits

Playwright 1.61.1's Chromium 149.0.7827.55 reproducibly stalled native
cross-document view transitions on the nested fixture: the new document
loaded, but `pagereveal` and animation frames did not advance. The same flow
worked in installed Chrome 153.0.8010.48. Playwright was updated to 1.63.0;
its Chromium 153.0.8010.12 passed that flow and all 64 navigation cases. No
browser-specific workaround was added to production navigation. This does
not claim to repair the older Chromium engine.

A later local Vite module timeout interrupted captures and four docs cases.
Restarting the affected server and running those cases alone produced passing
results. The complete new docs and category coverage uses Playwright WebKit;
it is not a fresh measurement of installed Safari or a physical trackpad.
The previously approved Safari/Chrome/Firefox/Brave review is retained in the
prototype record rather than repeated for default activation.

The full editor construction matrix, minimum-VS-Code and formatter coexistence
runs were not repeated: completion values and save behavior are unchanged,
and the four changed metadata contexts were exercised in the widget.
[BL-119 Direct-hash positioning in static previews](BL-119-static-preview-hash-positioning.md)
remains separate; development and build checks do not claim to close it.

### Visual and documentation review

Inspected registered captures of the ordinary docs server at 1440×1000 light
with the Reference menu, 1024×900 dark with the Getting Started menu, and
1440×1000 light with Focus reading. Inspected the regenerated nested example
at 1200×650 and 390×600 with Menu closed/open, and the handbook at 1440×850.
The menu boundary remains clear in dark appearance and the article retains
its reading axis when the tree is hidden.

Captures used `npm run review:capture` and physical scratch copies; maintained
fixture sources were not edited. The documentation copy was restored on port
4399; the normal docs server remains on port 4321. No package publication or
push was performed.
