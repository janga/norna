# Full Test Audit — 2026-10-11

## Scope And Source State

Audited all maintained automated test entry points at release `27d0fb6`
(Norna 0.7.30), then corrected the test failures listed below. Production code,
source format and presentation are unchanged. Local environment: macOS arm64,
Node 26.7.0, npm 11.19.0. Core checks ran in a physical source copy prepared as
0.7.31 with regenerated schemas, matching the CI preparation procedure. Browser
checks used a separate physical copy; native editor tests used isolated profiles.

The inventory includes both package manifests, all four CI workflows, registered
review suites, standalone engine/editor test files and all 25 Playwright specs.
The normal `npm test` chain does not include the complete browser/native-editor
inventory. Its `&&` chains also stop at the first failure. This audit expanded
the core chain into 82 ordered commands and continued independent groups after
failures, preserving a log and exit code for each command.

## Results

- **Passed:** all 82 core commands, including generated schemas, unit/contracts,
  editor language/package checks, preview, builds, examples, documentation,
  lockfile normalization and installed-package verification.
- **Passed after focused corrections:** all 25 Playwright specifications,
  comprising 279 cases. The built-inline navigation-state case received a fresh
  built page through `NORNA_NAVIGATION_STATE_PAGE`; no conditional case was
  silently skipped. Earlier passing cases were retained on unchanged inputs.
- **Passed:** Pages and example assembly; standalone note layout/footnote
  browser test; attachment, page-address and move-confirmation form browser
  tests; candidate image preparation, clean installation, two builds and cache
  reuse; extension runtime audit (zero reported vulnerabilities).
- **Passed after isolation fix:** concurrent registered navigation/preset suites
  and review captures. Each browser process now owns its artifact directory.
- **Passed:** complete packaged editor suites with VS Code 1.96.0, stable
  1.141.0, and stable with Prettier 12.4.0. Subsequent focused runs reproduced
  intermittent Site Tree timing failures; the final synchronization changes
  passed all 16 workflows on minimum, stable and stable with Prettier.
- **Reused CI evidence for the same production state:** the
  [engine run](https://github.com/janga/norna/actions/runs/38165282492),
  [Pages deployment](https://github.com/janga/norna/actions/runs/38165282584), and
  [image installation matrix](https://github.com/janga/norna/actions/runs/38165282503)
  passed. The matrix covers Ubuntu, macOS and Windows with Node 24.18.0, plus
  Ubuntu with minimum Node 22.12.0.
- **Required, not yet run:** Linux CI for the final native-editor corrections.
  The previous [Editor extension run](https://github.com/janga/norna/actions/runs/38165282474)
  remains failed; track the blocker in
  [BL-182 Restore CI Integration Checks](backlog/BL-182-restore-ci-integration-checks.md).

## Findings And Corrections

Seven browser cases initially failed. Their causes were selectors that included
Astro's development toolbar, old numbered source paths, retired category/link
expectations, and measuring reading width before the UI update. Assertions now
target the actual article, current page ownership and parent URLs; geometry
checks wait for the same required width change rather than weakening it.

The concurrent review test additionally exposed shared `test-results/` cleanup:
one Playwright process deleted another's traces, producing `ENOENT` on context
close. The runner now assigns unique output paths unless explicitly overridden.
Its corrected full concurrent run passed, including light/dark captures.

The native Site Tree test was also intermittent locally. It needs to filter the
virtualized site picker, distinguish complete labels from highlighted substrings,
click page labels separately from disclosure controls, wait for rendered editor
focus and completed form disposal, and confirm the selected palette command
before pressing Enter. These remain real UI interactions.

One focused documentation rerun passed its assertion but received `EPERM` while
stopping its temporary server process group. A subsequent isolated rerun passed
including cleanup; the core process-group cleanup tests also passed. Do not
count the intermediate command itself as successful.

The five static-preview cases passed without changing production navigation.
The older [BL-119 Direct-hash positioning in static previews](backlog/BL-119-static-preview-hash-positioning.md)
failure was not reproduced; this pass alone does not explain its earlier cause.

## Browser Inventory

Run these through `node scripts/test-navigation.mjs --site-dir <site> <specs>`
unless a different command is listed. All spec names below are under `tests/`
and end in `.spec.ts`.

| Site or command | Specifications |
| --- | --- |
| `site` | `area-navigation`, `navigation-continuity`, `navigation-state`, `navigation-history-lifecycle`, `search-navigation`, `examples-gallery` |
| `fixtures/nested-pages/site` | `navigation-tree`, `area-navigation-parent`, `page-contents-placement`, `navigation-following` |
| `fixtures/top-navigation/site` | `navigation`, `top-page-menu`, `navigation-stress`, `table-width-top`, `code-width` |
| `fixtures/preset-baseline/site` | `presentation-contract`, `named-notes` |
| `fixtures/presentation-review/site` | `table-responsive-context` |
| `fixtures/category-destinations/site` | `category-destinations` |
| `fixtures/navigation-examples/documentation/site` | `navigation-documentation-example` |
| `fixtures/content-model-v2/site` | `navigation-surfaces-top` |
| `fixtures/markdown-images/site` | `markdown-images` |
| `fixtures/content-tabs/site` | `content-tabs` |
| `fixtures/table-sorting/site` (already in `npm test`) | `table-sorting` |
| `NORNA_SITE_DIR=fixtures/top-navigation/site npm run test:navigation:preview` | `navigation-preview` against built output |

The `navigation-state` built-output case additionally needs
`NORNA_NAVIGATION_STATE_PAGE` pointing to a freshly built
`dist/reference/site/pages/index.html`. Run `build:pages` separately from live
maintained review state. `scripts/test-named-notes-browser.mjs`, the three editor
form browser commands and `test:review-environments:browser` are additional
browser checks outside this Playwright file list.

Native commands are `test:editor-integration:minimum`, `test:editor-integration`
and `npm --prefix editors/vscode run test:integration -- --with-prettier`.
Image installation requires both `test:image-installation -- prepare <bundle>`
and `test:image-installation -- check <bundle>`; use a new bundle directory.

Local plans, per-command exit codes, logs and failure traces are retained under
`.local/full-test-audit-20261011/`. `core-plan.json`, `browser-plan.json`, their
corresponding `*-results.json`, and `run.mjs` describe the audit execution.
Initial failures remain in those files; focused correction logs record their
resolution. They are local evidence, not a portable replacement for maintained
test commands or the cross-platform CI jobs.

The final documentation check and whitespace check passed. Changes are test
repairs and contributor documentation only. They have not been pushed or
released as part of this audit.
