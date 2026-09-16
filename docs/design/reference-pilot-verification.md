# Reference verification record

Verification for [BL-117: Canonical web reference](backlog/BL-117-canonical-web-reference.md).
The completed reference is recorded first; the later historical sections apply
only to the retired pilot fixture.

## Full reference: 2026-09-16

The work resumed from `f19a48a`, package 0.7.26. The canonical tree contains
53 pages in six categories. Legacy source destinations are checked against
the migration registry so schema checks also work in shallow CI checkouts
without historical Git tags. A fresh npm query still returned 0.7.25; no npm
release or website publication was performed. Current web links and installed
release source links are identified separately.

| Check | Result and scope |
| --- | --- |
| `npm run content:check` | Passed for the documentation source, including the new tree and internal links. |
| `npm run test:documentation` | Passed: route/source registry, all 163 legacy destination mappings and anchors, single H1s, positive configuration examples, language and preset tables, displayed/live examples, local links and llms.txt. |
| `npm run test:schemas` | Passed current-web and release-source help links plus existing metadata assertions. |
| `npm run schemas:check` | Passed: all nine generated schemas match their sources. |
| `npm run test:editor-language` | Passed the engine language-service checks and VS Code bundle, Markdown and package contracts. |
| `npm run test:editor-integration` | Passed on VS Code 1.138.0 with Norna VSIX 0.1.1 and Red Hat YAML 1.24.0. Includes completion relevance, actual widget acceptance and dirty edit/save/close/reopen cycles with exact LF/CRLF bytes. |
| `npm run test:editor-integration:minimum` | Passed the same complete editor workflows on the minimum supported VS Code 1.96.0, including the ESM help loader. |
| `npm run package:check` | Passed installed-package initialization, discovery, commands, static builds and development-server requests. |
| `npm run build:pages` | Passed the complete documentation artifact and eight rendered examples; the main site produced 78 routes and indexed 68 pages. |
| `git diff --check` | Passed. |

The widget results record 86 passed construction, image-usage and priority
cases on each tested VS Code version. Bundle SHA-256:
`b434ec7ef26736050d1010a7e1761dc5e5f2a06b31befb7e84b4a97e073f1721`.
Tabs, code titles and line emphasis remain three explicitly unimplemented
completion cases. Not every standalone schema property/value was individually
selected through the widget; schema/link assertions cover the wider help set.
Blank lines, backtick/tilde fences, partial names, callout prefixes, named notes,
complete-file templates and image-list insertion contexts were exercised.

The first package run exposed a CommonJS helper that worked in Node but failed
in Astro development rendering. The final shared helper is native ESM, loaded
asynchronously by the editor; installed-package build and dev checks passed
with it. VS Code tests also exposed assumptions about accepting a still-loading
widget and its remembered selection. The tests now wait for visible, focused
suggestions and explicitly select the intended item through the widget.
They do not bypass insertion with provider results or `insertSnippet`.

## Full-reference visual inspection

Started/reused `npm run review:start -- docs` at
`http://127.0.0.1:4321/norna/`. All screenshots below were captured with
`npm run review:capture -- docs <path> --viewport <profile> --appearance <mode>`
and inspected directly. Files remain under ignored `.local/review-captures/docs/`.

| Reference path and section | Viewport / appearance | Observation |
| --- | --- | --- |
| `reference/site/urls/` | Desktop / light | Folder-to-URL source, prose, tree navigation and page contents align without overlap. |
| `reference/configuration/appearance/` | Mobile / dark | Definition and highlighted YAML remain readable within the narrow page. |
| `reference/content/sidenotes/#several-notes-in-one-paragraph` | Desktop / light; mobile / dark | Both live notes match the displayed source, sit beside the desktop paragraph and below it on mobile; subsequent prose clears them. Long source lines scroll inside the code block. |
| `reference/commands/move/` and `#addresses-and-options` | Mobile / light | Preview/write distinction is visible; command source scrolls locally and option descriptions wrap inside the page. |
| `reference/configuration/presets/` | Desktop / dark | Dense preset values remain readable beside the long navigation tree. |
| `reference/content/tables/` | Mobile / dark | Displayed Markdown and its rendered table agree and fit the content area. |

These are representative visual checks, not a new exhaustive presentation,
accessibility, keyboard or no-JavaScript regression run. No CSS or rendered
component behavior changed. The earlier code-typography trial remains a
separate documentation follow-up.

## Full-reference search and navigation

An isolated Chromium check used the registered docs URL and the actual built
Pagefind index. It typed each query into the real search field, opened the
result, checked its page title, then independently selected the same page
from Reference's category tree. All eight tasks passed:

| Query | Destination and answer |
| --- | --- |
| `page:move` | page:move: preview default, alias options and recovery limits. |
| `appearance` | Appearance: reader choice, site default and Reset. |
| `sidenotes` | Sidenotes: several notes per paragraph and allowed locations. |
| `category URL` | Pages and categories: the first listed direct child's effect. |
| `content:sync` | Validation and image sync: writes and lack of automatic rollback. |
| `search index` | Search: rebuilding a stale local index. |
| `formatting` | VS Code editor support: recognized sources, providers and formatting ownership. |
| `unlisted` | Pages and categories: navigation visibility versus output, search and sitemap. |

The initial probe expected the unlisted answer on Page metadata; the search
correctly surfaced the fuller answer on Pages and categories. The broader
query `category destination` did not surface the intended page among the first
results; `category URL`, matching the documented concept, did. This is a set
of concrete lookup checks, not a guarantee for every natural-language query.
The disposable runner and detailed result list are saved in
`.local/reference-work/search-review.mjs` and `search-results.json`.

## Remaining verification boundaries

The complete `npm test` release chain, Prettier coexistence run and separate
navigation/preset browser suites were
intentionally not repeated. The change does not alter formatting, presentation
or navigation behavior. Installed-package and current/minimum-editor tests cover
the new shared help-loading path. Existing gaps in editor feature coverage remain
explicit above; no claim of every-property widget coverage is made.

The valid-slug build defect is tracked as
[BL-118: Page ID decoding for valid slugs](backlog/BL-118-page-id-decoding.md).
It is not a documented naming restriction and was not fixed in this task.

## Historical pilot baseline

Checked on 2026-09-15 against engine commit `828f70f`, package version 0.7.26.

## Historical pilot automated checks

| Check | Result and scope |
| --- | --- |
| `node bin/norna.mjs --site-dir fixtures/reference-documentation/site check` | Passed configuration and content validation. |
| `npm run test:documentation` | Passed, including new pilot checks: five pages, single H1s, valid positive YAML and Markdown examples, and agreement between displayed sources and three rendered note definitions. |
| `node scripts/test-page-move.mjs` | Passed the existing move regression suite. This supports the command pilot, not a claim that every sentence has an individual test. |
| `node bin/norna.mjs --site-dir /Users/jangarefelt/Projects/webbhack/norna/.local/test-sites/scratch/site build` | Passed after the pilot-directory correction described below. Generated ten routes and a search index covering five pages. |

The complete release suite was not run: no engine behavior was changed.
Generating the search index does not verify the search dialog or the
findability of a larger reference.

## Visual inspection of the earlier draft

The original three texts were subsequently rewritten using the
[reader-understanding plan](reference-pilot-editorial-plan.md). The captures
below describe the earlier draft, not the rewritten pages.

Captured with `npm run review:capture -- scratch <path> --viewport <size>
--appearance <mode>` and inspected as screenshots:

| Pilot and section | Viewport and appearance | Observation |
| --- | --- | --- |
| Appearance, `#precedence` | Desktop, light | Diagram, caption and precedence table are readable and do not overlap the navigation. |
| Appearance, `#precedence` | Mobile, dark | Diagram fits and exposes image inspection. The table uses horizontal scrolling; diagram text benefits from enlargement. |
| Sidenotes, `#several-notes` | Desktop, light | Both notes appear beside their paragraph; the next paragraph starts below them. |
| Sidenotes, `#several-notes` | Mobile, light | Both notes move below their paragraph. The source example requires horizontal scrolling. |
| page:move, `#options` | Mobile, light | The options table fits through wrapping; some option names wrap. No page-level overlap was visible. |

Captures are ignored local artifacts under `.local/review-captures/scratch/`.
These are visual spot checks, not exhaustive browser regression tests.
Focus reading, search interaction, keyboard navigation and no-JavaScript
behavior were not newly exercised in a browser for this documentation draft.

## Historical pilot findings and boundaries

The rewritten Appearance page was subsequently captured at desktop/light and
the rewritten Sidenotes page at mobile/dark during the code-typography trial.
Both screenshots were inspected. Browser measurements on Appearance at 1440
and 390 pixels confirmed code at 14px with 20.02px line height, using the same
explicit monospace family as its title. Body text remains 16px and 15.36px
respectively. Code-block regression tests await visual approval of this trial.
The rewritten page:move visual check remains outstanding.

- npm reported 0.7.25 as latest, whereas the inspected local code is 0.7.26.
  The pilots identify that difference and must not be advertised as a complete
  description of the current npm release.
- A valid pilot directory named `010-page-move` passed content validation but
  failed the Astro build. Page-ID decoding takes the last `-page-` marker and
  misreads that substring inside the slug. Renaming the pilot to `010-move`
  allowed the final build to pass. The engine defect remains recorded in the
  [inventory](reference-inventory.md); it was not fixed as a documentation edit.
- At that checkpoint the existing user reference files remained canonical.
  The later approved cutover replaces them with the reference page tree.

## Pilot approval

The owner approved the sample writing and authorized BL-117: Canonical web
reference implementation on
2026-09-16. The fourth pilot, URLs and links, adds the requested connection
between manual aliases and page moves. Content and documentation checks passed
after that addition. The full-reference verification is recorded above.

The approved grouping developed into the
[final information structure](reference-information-structure.md#lookup-and-visual-review).
The full site's navigation and search are verified against that complete set,
without repeating the approved pilot-writing gate.
