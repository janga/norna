# Reference coverage inventory

Coverage and maintenance map for [BL-117: Canonical web reference](backlog/BL-117-canonical-web-reference.md).
This records the original area-level assessment and the completed reference
cutover. The matrix preserves the findings that guided the work; the
implementation audit below records their disposition and maintenance paths.
It is not a claim that every public field has an individual documentation test.

## Original baseline and publication

Inspected on 2026-09-15 against engine commit `828f70f` (Release v0.7.26).
The working tree was clean before this documentation work. `package.json`
declares 0.7.26, but `npm view @janga/norna version` returned **0.7.25** on that
date. The pilots therefore explicitly describe the local 0.7.26 implementation,
not the package readers currently get from `@latest`.

The difference is substantial: the Git diff from `v0.7.25` includes content
syntax, navigation, reader controls and tables. Do not assume the old npm
release supports the pilots. Recheck publication before public cutover; a local
release commit or Git tag is not evidence of registry availability.

## Original assessment method and status

Start from CLI dispatch, schema roots, file conventions, Markdown parsers and
rendered reader controls. Match those areas to existing Markdown and HTML
coverage. Inspect code and existing test assertions for sampled contracts.
The test files below are evidence locations, not claims that they were all
rerun during this inventory.

Statuses: **sampled** means the checked claim agrees; **partial** means useful
coverage exists but a material detail or clear home is missing; **conflict**
means competing descriptions need correction; **missing** means no user
reference entry was found; **pending** means detailed verification is deferred.
No feature is certified complete merely because a heading exists.

## Coverage and maintenance matrix

Paths below are repository-relative. Each proposed destination is developed in
the [information structure](reference-information-structure.md).

| Public area | Implementation and test evidence | Existing reference / website | Finding and reader consequence | Current reference area |
| --- | --- | --- | --- | --- |
| Installation and requirements | `package.json`, `scripts/init-site.mjs`, `scripts/test-cli-discovery.mjs` | `requirements.md`, `upgrading.md`; Getting Started / Install Norna | Pending detailed platform verification. Separate prerequisites from historical migration advice. | Requirements; installation stays in Getting Started |
| Project and site discovery | `bin/norna.mjs`, `scripts/lib/site-paths.mjs`, `scripts/test-engine-commands.mjs` | `site-files.md`, `commands.md`, `configuration.md`; FAQ / Norna project setup | Partial: users must reconcile project-local executable selection, cwd discovery and explicit site selection across files. | Site files; CLI invocation |
| Page and category structure | `scripts/lib/site-structure.mjs`, `scripts/lib/category-destinations.mjs`, `scripts/test-site-node-commands.mjs`, `scripts/test-nested-pages.mjs` | `pages.md`, `site-files.md`; Grow Your Site | Conflict in generated help: category schema calls categories non-routable, although they have generated URL destinations. Preserve the useful no-editorial-content distinction. | Pages and categories |
| Order, slugs and anchors | `scripts/lib/site-page-urls.mjs`, `scripts/lib/heading-ids.mjs`, `scripts/test-heading-ids.mjs` | `pages.md`, `content.md`; Grow Your Site | Partial organization: directory URL rules and heading IDs need adjacent but distinct definitions; they are not one slug algorithm. | URLs and links; headings |
| Frontmatter and listing | `scripts/lib/schema-definitions.mjs`, `scripts/lib/site-link-graph.mjs`, `src/components/SitePage.astro` | `content.md`, `pages.md`; Prepare Your Site | Conflict: generated help says description is not visible, but page lists render child descriptions. Unlisted is not private. | Page metadata |
| Internal links and aliases | `scripts/lib/site-link-graph.mjs`, `scripts/lib/page-aliases.mjs`, `scripts/test-site-link-graph.mjs`, `scripts/test-page-aliases.mjs` | `content.md`, `pages.md`; Examples / page move | Sampled: category links and aliases covered. Need one account of accepted targets and limits rather than repeated summaries. | URLs and links |
| Public files and generated metadata | `scripts/sync-site-public.mjs`, `scripts/lib/sitemap.mjs`, `scripts/test-site-public.mjs`, `scripts/test-not-found-page.mjs` | `public-files.md`; Prepare Your Site | Pending per-convention and collision audit. Keep copied files separate from generated sitemap, 404 and social metadata. | Public assets and generated output |
| Technical configuration | `scripts/lib/schema-definitions.mjs`, `scripts/lib/project-config.mjs`, `scripts/test-project-config.mjs` | `configuration.md`; Prepare Your Site / Build And Publish | Sampled roots: url, language, editLink, navigation, search, scrollBehavior. Long language enumeration obscures unrelated settings. | Site configuration; language; navigation; search |
| Navigation selection and fallback | `scripts/lib/navigation-model.mjs`, `src/components/SitePage.astro`, `tests/page-contents-placement.spec.ts` | `configuration.md`, `pages.md`; Examples / automatic navigation | Sampled: site-wide automatic selection and branch-depth-based contents placement differ. Explain both, then responsive fallback; do not use screenshots as the specification. | Navigation |
| Language and collation | `scripts/lib/locale-registry.mjs`, `scripts/lib/locales/`, `scripts/test-locales.mjs` | `configuration.md`; Examples / language | Pending complete locale audit. Preserve the AI-generated/unreviewed translation warning and distinguish UI localization from translation of authored text. | Language |
| Search | `scripts/generate-search-index.mjs`, `src/components/SearchPage.astro`, `scripts/test-static-search.mjs` | `configuration.md`, `client-javascript.md`; Examples / search | Sampled configuration: false by default, generated index. Build/preview freshness and JavaScript requirements need local context. | Search; refresh preview how-to |
| Presets and root overrides | `scripts/lib/theme-presets.mjs`, `scripts/lib/theme-config.mjs`, `scripts/test-theme-presets.mjs` | `theme.md`, `typography.md`; Choose A Theme / Theme explorer | Partial: field tables exist, but no compact map of all setting owners and precedence. Root and local schemas differ. | Theme model; layout; typography; media |
| Palettes and appearance | `scripts/lib/presentation.mjs`, `scripts/lib/presentation-contract.mjs`, `src/lib/readerPreferencesScript.mjs`, `scripts/test-presentation-contract.mjs` | `theme.md`; Examples / palettes and reader display | Conflict: theme intro suggests palette controls status messages; semantic callout colors are engine-owned per appearance. Appearance precedence is correct but far from configuration's first example. | Palettes; appearance pilot |
| Reader controls and persistence | `src/components/DisplaySettings.astro`, `src/lib/readerPreferencesScript.mjs`, `tests/presentation-contract.spec.ts` | `theme.md`, `pages.md`, `client-javascript.md` | Sampled: all sites have Appearance and width; tree adds Focus reading. Partial cookie explanation: base-path scoping is not universal isolation for overlapping root/subpath cookies. Avoid privacy guarantees. | Reader display |
| Section backgrounds and inheritance | `scripts/lib/presentation.mjs`, `scripts/lib/theme-presets.mjs`, `scripts/test-presentation-contract.mjs` | `theme.md`; Choose A Theme | Sampled: automatic preset adaptation differs from rejected explicit non-uniform tree overrides. Needs a clearly located interaction rule. | Theme model; section backgrounds |
| Markdown and structured blocks | `scripts/lib/page-markdown.mjs`, `scripts/lib/norna-markdown-blocks.mjs`, `scripts/lib/structured-blocks.mjs`, `scripts/test-structured-blocks.mjs` | `content.md`; Examples | Partial organization: one long page contains many independent syntax contracts. Distinguish standard Markdown, GFM and Norna extensions. | Content syntax category |
| Image stack and carousel | `schemas/image-stack.schema.json`, `schemas/image-carousel.schema.json`, `scripts/generate-images.mjs`, `scripts/test-managed-media.mjs` | `content.md`, `images-and-metadata.md`, `theme.md`; Examples | Pending field-by-field audit. Syntax, responsive layout and file processing are different needs; keep exact field definitions in one place. | Image blocks; managed images |
| Cards and child lists | `schemas/card-list.schema.json`, `scripts/lib/norna-markdown-blocks.mjs`, `src/components/ContentBlocks.astro`, `scripts/test-markdown-constructs.mjs` | `content.md`; Examples | Sampled descriptions/links; pending complete defaults and nesting audit. A page list is authored content, not a replacement navigation mode. | Card lists; page lists |
| Callouts and details | `scripts/lib/semantic-callouts.mjs`, `scripts/lib/details-headings.mjs`, `scripts/test-markdown-constructs.mjs` | `content.md`; Examples / semantic callouts | Conflict: prose calls callout presentation preset-owned. Details also needs its own discoverable restrictions, including headings in HTML summary. | Callouts; details |
| Tabs | `scripts/lib/content-tabs.mjs`, `scripts/test-content-tabs.mjs`, `tests/content-tabs.spec.ts` | `content.md`; Examples / tabs | Pending all interaction and grammar checks. No nested groups or headings; do not imply synchronized alternatives or translated content. | Tabs |
| Tables and code | `scripts/lib/table-render-plugin.mjs`, `src/components/TableOverflowScript.astro`, `scripts/lib/code-fence-metadata.mjs`, `tests/table-sorting.spec.ts` | `content.md`; Examples / tables and code | Sampled: extensive existing contracts. Separate author syntax from automatic reader behavior, retain limits inside containers. | Tables; code blocks |
| Sidenotes and footnotes | `scripts/lib/markdown-notes.mjs`, `scripts/lib/markdown-notes-render-plugin.mjs`, `scripts/test-named-notes.mjs`, `tests/named-notes.spec.ts` | `content.md`; Examples / sidenotes | Sampled detailed pilot. Existing restrictions largely agree. The revised pilot introduces names through exact source/result pairs, then states placement and content restrictions without an error matrix. | Sidenotes; footnotes |
| Page creation and move | `scripts/add-site-node.mjs`, `scripts/move-site-page.mjs`, `scripts/lib/page-move-plan.mjs`, `scripts/test-page-move.mjs` | `commands.md`, `pages.md`; Examples / page move | Partial: move reference omits refusal to add aliases to flow-style page metadata. Two commands have opposite write defaults: add writes unless dry-run; move previews unless write. | Page creation; page:move pilot |
| Content checks, sync and images | `scripts/sync-content-sections.mjs`, `scripts/lib/content-sync-plan.mjs`, `scripts/generate-images.mjs`, `scripts/test-content-sync.mjs` | `commands.md`, `content.md`, `images-and-metadata.md`; Examples / checks | Pending detailed inventory of warnings versus errors and changed files. Do not describe checks and sync as interchangeable. | Validation and image commands |
| Local development, build and deploy | `scripts/dev-local.mjs`, `scripts/build-site.mjs`, `scripts/deploy-site.mjs`, `scripts/watch-pages-deploy.mjs`, `scripts/test-dev-local.mjs` | `commands.md`, `local-development.md`, `publishing.md`; Build And Publish | Pending platform/flags audit. Distinguish dev, static preview, CI and deploy monitoring; retain useful recovery procedures outside reference tables. | Development commands; build/deploy; publishing guides |
| Editor support | `scripts/lib/editor-language-service.mjs`, `editors/vscode/package.json`, `scripts/test-editor-language-service.mjs` | `editor-support.md`; FAQ / content and images | Pending full parity audit. Experimental VSIX, schema help, suggestions and third-party formatter ownership need distinct treatment. | Editor guide; editor recognition reference |
| Migration audit command | `bin/norna-cli.mjs`, `scripts/migrate-check.mjs`, `scripts/test-migration-check.mjs` | Absent from `docs/commands.md`; archived design material | Missing public entry although top-level help exposes it. Product decision: document experimental limits or separately retire exposure; do not revive the archived project here. | CLI inventory with explicit unresolved status |
| Accessibility and JavaScript limits | `scripts/lib/presentation-contract.mjs`, `docs/client-javascript.md`, `tests/` | `presentation-guarantees.md`, `client-javascript.md`; Examples | Pending claim-by-claim audit. Tests/contrast constants do not certify an authored site's overall WCAG conformance. | Reader behavior and author responsibilities |

## Priority corrections, not product changes

1. **Publication boundary:** current Markdown already describes post-0.7.25
   syntax. Establish the target release before making the new site authoritative.
2. **Incorrect ownership language:** replace preset-owned semantic colors with
   engine-owned colors per appearance. Inspect all palette-related descriptions,
   not just one paragraph.
3. **Metadata and category wording:** revise schema/editor summaries alongside
   reference. `page.description` is visible in generated child lists;
   categories have generated destinations without authored page bodies.
4. **Move failures:** explain block-style alias metadata, unchanged relative
   links, refusal cases and the limits of rollback. Never claim a multi-file
   update is one atomic transaction.
5. **Exposed migration command:** describe the existing scanner as experimental,
   with report side effects and heuristic limits. Do not revive the archived
   initiative or present its report as an automated migration plan.

No demonstrated unsupported-feature claim was identified in the sampled
reference passages beyond misleading ownership/visibility wording. This is
not proof that no such claims remain elsewhere. Detailed audits continue after
the structure review.

## Reproduced engine defect, not a documentation rule

Building a valid page directory named `010-page-move` fails with "Page entry
... has no valid page directory", although source validation accepts it.
`src/lib/sitePages.ts` locates the last `-page-` in an entry ID; the same
substring inside the encoded directory name is then mistaken for the prefix
boundary. This reproduces with both relative and absolute site selection.

The pilot uses `010-move` instead, keeping the title `page:move`. Do not add a
public rule forbidding valid slugs containing `-page-`. A separate engine fix
needs to distinguish the generated prefix from the encoded directory, with
regression cases for `page-move` and ancestor directories containing that
substring. No engine fix is included in this documentation stage.

## Existing documents and disposition

The table below records disposition at the approved cutover. Legacy section
destinations are mapped individually in `scripts/lib/documentation-routes.json`.
The matrix above retains the original findings and their evidence locations;
these were the audit inputs, not unresolved claims about the finished pages.

| Former file | Final disposition |
| --- | --- |
| `README.md` | Replace the user reference index with web links; retain contributor entry |
| `requirements.md` | Requirements page; link from Getting Started |
| `site-files.md` | Site files reference; internal layout section to Engine Development |
| `pages.md` | Pages/categories, URLs, metadata, navigation and page command references; authoring advice to a bounded explanation |
| `configuration.md` | Site configuration, language, navigation, search and source links |
| `theme.md` | Theme model, palettes, Appearance, layout, images, backgrounds and reader display |
| `typography.md` | Typography reference; commands linked, not duplicated |
| `sitewide-content.md` | Shared logo, banners and footer reference |
| `content.md` | Individually addressable content-construct references |
| `images-and-metadata.md` | Managed images and image presentation; cache internals to contributor material |
| `public-files.md` | Public assets and generated output |
| `commands.md` | CLI invocation plus coherent command-family pages |
| `local-development.md` | Development command reference and preview/recovery how-to |
| `publishing.md` | Build/deploy reference and GitHub Pages/embedded publishing how-to |
| `upgrading.md` | Upgrade how-to; quarantine obsolete pre-1.0 syntax advice, do not mix it into current syntax |
| `editor-support.md` | Editor recognition reference, experimental VSIX installation and formatter troubleshooting |
| `client-javascript.md` | Reader behavior reference; internal verification instructions retained separately |
| `presentation-guarantees.md` | Reader behavior / accessibility boundary explanation; avoid certification claims |
| `engine-development.md` | Keep internal: testing, package/release, VSIX publishing and rendering internals |

Also keep internal: `AGENTS.md`, `BACKLOG.md`, `docs/design/`, editor workflow
test plans, fixture READMEs and private `marketing/` material. Site-owner use of
the VSIX belongs in user docs; publishing that extension does not.

## Cutover and maintenance

`scripts/lib/documentation-links.mjs` uses the route registry for current web
links and release-specific source links. Generated schemas take their links
from this helper; do not edit them by hand. Root README, `docs/README.md`,
`site/public/llms.txt`, website text and starter/editor links were updated in
the same cutover. The approved pages now live in the canonical reference tree;
the duplicate pilot fixture was removed.

`scripts/test-documentation.mjs` checks the registry, page tree, legacy anchor
destinations, configuration examples and source/result agreement. The coverage
matrix's evidence columns remain the maintenance map: changing an area
requires reviewing its documentation home.

## Implementation audit: 2026-09-16

Resumed from commit `f19a48a`, package 0.7.26. A fresh
`npm view @janga/norna version --registry=https://registry.npmjs.org/`
returned 0.7.25 on 2026-09-16. The new requirements entry explicitly records
this difference. No package release or website publication is part of this
work.

The new tree has 53 pages in six categories. The route registry maps every
page to its one source and records legacy section destinations. It is the
machine-checked disposition map used by schema/editor links; the information
structure is the human-facing reader-task map. Changing a contract in the
matrix's evidence column requires reviewing the associated page.

Audited configuration fields against schema-definitions, project-config,
theme profiles/presets, locale registry, navigation model and source-link
construction. Corrected source-width image variant handling: every source width
is represented, not only images wider than the normal variant set. Added the
non-preset image width/percentage/height defaults from project-config.
Content pages retain shared YAML constraints and separate each construction's
syntax from processing and reader behavior. Commands were checked against
CLI dispatch and their argument parsers, including the experimental audit.
Reader cookies were checked against readerPreferencesScript, preserving the
base-path overlap limitation.

Resolved the misleading non-routable category schema and hidden-description
help. Semantic colors remain engine-owned. No public terminology or product
behavior was renamed to accommodate prose. Public Markdown links now lead to
the website; generated schema/editor help also retains the installed release's
source reference. Tags through 0.7.26 keep their old docs/ paths.

Unique internal content from Site Files is already covered by Engine
Development's Main Areas. Client-side script test instructions remain in the
contributor verification workflow. Historical conversion advice is explicitly
labelled under Legacy source conversion; its obsolete frontmatter claim was
corrected to include aliases. The redundant Resources reference index and the
temporary pilot fixture are retired after moving approved content into the
canonical tree. Example sites and contributor/design material remain.

The page-ID decoding defect recorded above is tracked separately as
[BL-118: Page ID decoding for valid slugs](backlog/BL-118-page-id-decoding.md).
It is not described as a public slug restriction. Automated check
results and visual/search evidence are recorded separately in
[the verification record](reference-pilot-verification.md).
