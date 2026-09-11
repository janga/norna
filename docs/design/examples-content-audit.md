# Examples Content Audit

This maintainer audit records the source comparison and teaching decisions
behind the public Examples page. It includes the original
[BL-042: Examples audit and teaching structure](backlog/BL-042-examples-audit.md)
and the final implementation audit for
[BL-091: Final examples audit against implemented behavior](backlog/BL-091-final-examples-implementation-audit.md).

## Current Review Status

Technical audit completed on 2026-09-11 after the seven ordered corrections,
then refreshed for the four follow-up items: BL-092: Top navigation without a
duplicate section row, BL-093: Missing descriptions in child-page lists,
BL-094: Child-page descriptions that explain a choice, and BL-095: Nested
navigation for substantial documentation.
Human approval of the revised gallery remains pending.
Do not close
[BL-083: Result-first single-page examples](backlog/BL-083-result-first-single-page-examples.md)
or its final audit on the strength of automated tests alone.

All 20 H2 examples were compared with current sources and canonical reference.
The checks below distinguish source fidelity and tested behavior from visual
judgment. No planned feature is presented as shipped; the translation review
and carousel JavaScript boundaries remain explicit.

## Final Section Audit

The page source is `site/pages/030-examples/content.md`. Paths in the evidence
column are repository-relative. "Exact source" means that the documentation
test compares the displayed code with the live Markdown or maintained fixture,
not merely that its syntax parses.

| Section | Result and boundaries checked | Implementation evidence |
| --- | --- | --- |
| Write with standard Markdown | Live H3, prose, emphasis, list, and quote match the displayed source. No Norna syntax is required. | Exact-source assertion; `scripts/lib/page-markdown.mjs`; `docs/content.md` |
| Add a single image | The one-entry stack shows all three supported fields. Local managed images, public assets, external URLs, and author-owned alternative text are distinguished. | Exact source; `scripts/lib/norna-markdown-blocks.mjs`; `src/components/ImageStack.astro`; `docs/images-and-metadata.md` |
| Image stacks | Both entries and their captions match the source. The optional AI suggestion retains human responsibility for alt text. | Exact source; `ImageStack.astro`; gallery image-loading check |
| Image carousels | Three entries match the source; controls initialize. The text does not promise slide switching without JavaScript. | Exact source; `src/components/ImageCarousel.astro`; browser checks with and without JavaScript |
| Card lists | Three live cards match the displayed list and its grid settings. Block options are identified as an extension. | Exact source; `scripts/lib/norna-markdown-blocks.mjs`; `docs/content.md#card-list` |
| Semantic callouts | TIP and WARNING match the source and the closed meaning set. GitHub-style alerts are not mislabelled as formal GFM; DANGER is identified as Norna's addition. | Exact source; `scripts/lib/semantic-callouts.mjs`; two rendered callouts |
| Sidenotes | The note pair matches its source. Margin placement is conditional on available space; reference footnotes are a different mechanism. | Exact source; shared Markdown model; `docs/content.md#side-notes`; responsive content styles |
| Code blocks | Language, title, and line emphasis reproduce the live block. Copy and measured width need JavaScript; syntax rendering and title positioning do not. | Exact source; `src/components/CodeBlockCopyScript.astro`; `docs/content.md#code-blocks`; code-width browser checks |
| Get readable tables from standard Markdown | Six columns and ten concise rows match the code. GFM table syntax and Norna's optional row-header annotation are distinguished. Labels do not require mid-word wrapping. The carousel fallback cell was corrected from "Image links" to "Static images". | Exact source; table-row-header and shared-width browser checks; `docs/content.md#tables` |
| List child pages automatically | Help a dog explains the different commitments of adoption, fostering, and sponsorship. Each child's description adds decision-making context to its H1. Missing descriptions trigger a non-blocking content warning. | Exact parent and three child excerpts; `fixtures/child-page-list/site`; real sidebar/list capture; warning selection and build tests |
| Automatic responsive navigation | Three shelter scenarios use `project`; a fourth handbook excerpt uses `documentation`. All use automatic navigation. Top-mode H2s stay in page disclosures, not a duplicate row. The deeper handbook shows separate page and heading navigation and explains why related topics form branches. | Four exact-source checks, including nested code fences; `fixtures/navigation-examples`; top-menu and base-path tests; handbook responsive tests with and without JavaScript; `docs/pages.md#navigation` |
| Move pages without breaking links | The two commands show preview followed by `--write`; they describe a hypothetical source and destination, not a move inside the documentation site. Subtree moves, link rewrites, aliases, and validation boundaries match the CLI contract. | `scripts/lib/page-move-plan.mjs`; existing `scripts/test-page-move.mjs` coverage inspected, not rerun; `docs/pages.md#move-or-reconcile-a-page` |
| Add static search | `search: true` matches the documentation site's configuration. The generated route and static index are built; no hosted search or content translation is promised. | `site/config.yaml`; Pages build; `docs/configuration.md#search`; `docs/client-javascript.md` |
| Set the site language | Swedish interface labels match the locale pack. Language does not translate page content; AI-generated packs still require fluent review. | `scripts/lib/locales/sv.mjs`; `scripts/lib/locale-registry.mjs`; `docs/configuration.md#language` |
| Brand your site | The logo is a maintained asset from the shared-content demo. Logo, favicon, and social-image roles use accepted public filenames, not configurable image paths. | Demo `site/public/`; `docs/public-files.md`; gallery image-loading check |
| Add site-wide notices and a footer | The complete YAML now matches the linked demo, including both notices, logo height, and footer. The required logo file is stated. | Exact-file comparison with `examples/feature-demos/sitewide-content/site/sitewide-content.yaml`; public example build |
| Get coherent defaults from a preset | The four purposes match preset metadata. Root `preset` and `layout.textWidth` illustrate defaults and one accepted override, not arbitrary per-page identity changes. | `scripts/lib/theme-presets.mjs`; `docs/theme.md#theme-presets`; existing preset-reference assertions and four example builds |
| Choose a coordinated color palette | `clay-rose` matches this site's palette. The snippet explicitly combines that palette with `documentation`, without claiming that this entire page uses that preset. | `site/theme.yaml`; palette metadata; Theme explorer build; `docs/theme.md#palette-and-appearance` |
| Let readers adapt the display | Reading width is universal; optional Appearance and Focus reading settings are valid. Focus reading removes persistent rails while keeping Menu. Browser storage is not presented as an account preference. | Reader preference components; gallery Focus reading and Wide checks; `docs/theme.md#reader-display-controls` |
| Complete sites | Both public shelters remain independent projects. Fresh desktop captures show current navigation; links include rendered sites, maintained source, and the navigation reference. Their deliberately small scope is stated. | `scripts/capture-navigation-examples.mjs`; both complete-site builds; documentation link coverage |

## Corrections From The Final Audit

- Review follow-ups replaced the OS list with a shelter commitment comparison,
  removed duplicate top-navigation rows, and added a deep handbook capture.
  Child descriptions and all four navigation sources are compared with real
  files. Source matching now reads Markdown syntax trees, so a displayed page
  can itself contain code fences without truncating the comparison.
- Capture regeneration refreshed only changed image bytes: the top navigation
  images changed after row removal, while the single-page and shallow-tree
  images remained identical. The new handbook image shows a genuine right
  outline, not a drawn approximation of one.
- Displayed Markdown is now compared structurally with each of the nine live
  examples. Additional checks compare the child-page parent, shared YAML, and
  four navigation snippets with their maintained files.
- The six-column table no longer promises origin links for carousels without
  JavaScript. Carousel images remain in the HTML, but they are not stack-style
  image links.
- The JavaScript reference now includes measured code-width expansion; it no
  longer says that copying is the only code enhancement.
- Real captures were refreshed for the complete shelters as well as the three
  minimal navigation scenarios. One script updates Features, Examples, and
  the affected mobile captures in Getting Started.
- The review wrapper waits for network settling, fonts, images, and anchor
  layout before capture. The navigation test runner now uses the configured
  base path instead of assuming `/`, and cleans up a server that fails during
  readiness checks.
- Reduced-motion CSS exposed a measurement bug: its short transition duration
  could animate width probes between candidate layouts. Measured code and
  table frames now disable transitions explicitly. This is covered with
  reduced-motion browser contexts rather than a screenshot delay.

## Verification Record

These focused checks were run during the ordered correction work. Earlier
results were reused where the underlying contract was unchanged.

| Check | Result |
| --- | --- |
| `tests/table-responsive-context.spec.ts` with the presentation fixture | 5 passed: row labels, responsive table context, and bounded layout |
| `tests/code-width.spec.ts` and `tests/table-width-top.spec.ts` with the top-navigation fixture | 6 passed, including the final reduced-motion run |
| `tests/top-page-menu.spec.ts` and `tests/navigation.spec.ts` with the top-navigation fixture | 23 passed: direct H2 links, native disclosures, keyboard dismissal, compact navigation, and no-JavaScript fallback |
| `tests/navigation-documentation-example.spec.ts` with the handbook fixture | 2 passed: page and heading destinations persist across 1440/1120/390 widths, with and without JavaScript |
| `npm run test:content-check` | Passed, including missing and whitespace-only descriptions, no-list pages, excluded nodes, repeated lists, Home, and preserved invalid-value errors |
| `node --test --test-name-pattern=page-list scripts/test-markdown-constructs.mjs` | 2 passed: existing malformed/empty list errors and a static build that succeeds with a description warning |
| Focused cases from `tests/navigation-tree.spec.ts` and `tests/page-contents-placement.spec.ts` | 6 passed: Home, outlines, current branch, nested destinations, and reading-position behavior |
| `node scripts/test-top-navigation-contract.mjs` | Passed: explicit `top` with nested children, separate child and H2 groups, and `/docs/` base-prefixed links |
| `npm run test:examples:browser` | 3 passed: 20 sections, complete image loading, 1440/1024/390 widths, Light/Dark, reduced motion, Focus reading with Wide, and no-JavaScript access |
| `node scripts/test-review-environments.mjs` | Passed: capture arguments and registered environment contract |
| `npm run content:check` | Passed |
| `npm run test:documentation` | Passed: canonical links, public examples, displayed-source comparisons, preset descriptions, and generated discovery references |
| `npm run build` | Passed after the review follow-ups: 17 generated routes, updated image variants, and a 15-page static search index |
| `npm run build:pages` | Passed in the initial audit: documentation, Theme explorer, and all eight public example sites; not repeated for the follow-ups because published example sources and deployment paths are unchanged |

Full `npm test`, package installation, release, and deployment verification
were not run: this correction sequence does not change packaging or publishing
credentials, and focused tests cover the changed contracts.

## Human Review Still Required

- At `/norna/examples/#tables`, compare the rendered table with its code at a
  wide viewport, then narrow the browser. Judge row-label readability, source
  size, overflow cues, and Focus reading without changing the page content.
- At `/norna/examples/#page-list`, judge whether the shelter commitment context
  and descriptions justify a generated list beside navigation.
- At `/norna/examples/#automatic-navigation`, compare the four source trees
  with the captured wide and compact states. Read the shown source, not just
  the screenshots; all illustrated pages are runnable fixtures.
- For live interaction, use the minimal top-navigation fixture left on
  registered scratch port 4399 at `/dogs/`. Click a page name to navigate; use
  its chevron to reveal H2 links without visiting the page first. Try keyboard
  and a narrow viewport. The complete public multi-page shelter has no H2s,
  so it correctly has no section-disclosure buttons.
- The deeper documentation fixture can replace the scratch copy using the
  commands in `fixtures/navigation-examples/README.md`. Inspect
  `/guides/installation/linux/` with two rails, one rail, and the compact menu.

Desktop Light and mobile Dark captures were inspected by the agent. Automated
bounds and source comparisons do not replace the user's judgment of the
gallery's pacing, visual hierarchy, and the added top-menu affordance.

## Earlier Audit Sources

The review covered the complete documentation-site Examples subtree, every
tracked file below `examples/`, example material embedded elsewhere in the
documentation site, both starters, the root and documentation READMEs, all
canonical Markdown reference pages, and the tests that build and publish the
examples. The private product-research site was also reviewed as analysis
material; because it is absent from a fresh clone, no public example depends on
it.

## Maintained Example Map

| Example | Role and reader question | Source | Rendered result | Canonical reference | Automated coverage |
| --- | --- | --- | --- | --- | --- |
| Dog shelter, single page | Complete site: how do sections form a coherent one-page site? | `examples/complete-sites/dog-shelter-single-page/` | `/examples/complete-sites/dog-shelter-single-page/` | `docs/content.md`, `docs/pages.md` | Example build suite |
| Dog shelter, multiple pages | Complete site: how do several top-level pages and page-local images fit together? | `examples/complete-sites/dog-shelter-multi-page/` | `/examples/complete-sites/dog-shelter-multi-page/` | `docs/pages.md`, `docs/images-and-metadata.md` | Example build suite |
| Norna documentation | Complete site: how does a deeper hierarchy use categories and navigation rails? | `site/` | Documentation root | `docs/pages.md` | Documentation build and navigation suites |
| Portfolio preset | Focused comparison: how does the image-led preset treat representative content? | `examples/feature-demos/theme-preset-portfolio/` | `/examples/feature-demos/theme-preset-portfolio/` | `docs/theme.md` | Example and preset suites |
| Documentation preset | Focused comparison: how does the reading-oriented preset treat the same content? | `examples/feature-demos/theme-preset-documentation/` | `/examples/feature-demos/theme-preset-documentation/` | `docs/theme.md` | Example and preset suites |
| Project preset | Focused comparison: how does the balanced project preset treat the same content? | `examples/feature-demos/theme-preset-project/` | `/examples/feature-demos/theme-preset-project/` | `docs/theme.md` | Example and preset suites |
| Statement preset | Focused comparison: how does the spacious editorial preset treat the same content? | `examples/feature-demos/theme-preset-statement/` | `/examples/feature-demos/theme-preset-statement/` | `docs/theme.md` | Example and preset suites |
| Theme explorer | Generated comparison: what changes when preset, palette, Appearance, or reading width changes? | Four preset sites plus `scripts/build-pages.mjs` | `/examples/theme-presets/` | `docs/theme.md` | Documentation publishing build |
| Media and surfaces | Feature demo: how do image stacks, carousels, cards, notes, and section surfaces render? | `examples/feature-demos/media-and-surfaces/` | `/examples/feature-demos/media-and-surfaces/` | `docs/content.md`, `docs/theme.md` | Example, presentation, and navigation suites |
| Site-wide content | Feature demo: which logo, banner, and footer elements remain shared between pages? | `examples/feature-demos/sitewide-content/` | `/examples/feature-demos/sitewide-content/` | `docs/sitewide-content.md`, `docs/public-files.md` | Example and banner suites |

Published paths above are relative to `https://janga.github.io/norna/`.

## Teaching Decisions

- Keep one result-first documentation Examples page. Its H2 sections expose
  focused demonstrations directly in the page outline instead of making the
  reader choose an example area before seeing a result.
- Put the rendered result before the smallest exact source, identify whether
  the source is standard Markdown or a Norna extension, and link to canonical
  reference instead of repeating complete option tables.
- Keep both dog-shelter sites because their direct comparison teaches the
  boundary between sections and pages with one familiar subject.
- Keep the documentation site as the complete nested-page example. Use the
  minimal, runnable shelter hierarchy to isolate the navigation rules without
  introducing unrelated documentation content. Add the compact handbook
  excerpt when explaining why guides and reference topics form deeper branches;
  do not claim nesting requires a particular page count.
- Keep one source site per preset because identical content is the controlled
  variable that makes the comparison meaningful.
- Keep Theme explorer as generated comparison output, not a fifth configurable
  source site.
- Keep media and site-wide demonstrations as independently built source sites,
  but introduce their useful results on the single Examples page. The external
  builds remain available when a reader needs to inspect a complete site state.
- Keep exact syntax and constraints in Markdown reference pages. Example pages
  explain intent, show a representative result, and link to those definitions.
- Do not publish the feature-landscape analysis as a maintained product
  example unless it is deliberately added to version control and the example
  build suite.

## Findings Applied

- The root README repeated the complete example table already maintained in
  `examples/README.md`; it now offers two representative outcomes and one
  comparison tool before linking to the source index.
- The former Examples landing page described how to choose examples before it
  demonstrated anything. `BL-083` replaces that hierarchy with one direct
  gallery of live results, exact source, short use boundaries, and canonical
  reference links.
- Complete sites remain separately built and published because their value is
  the interaction between files, navigation, presentation, and publishing, not
  one isolated block.
- The gallery states the accessibility boundary beside managed images and at
  the complete-site conclusion: Norna owns generated semantics and controls;
  authors own meaningful editorial content and alternative text.

## Boundaries

The gallery may use a faithful fixture capture when a result depends on a page
hierarchy or global site state that cannot coexist with the current page. It
does not reproduce full reference tables, migration history, test plans, or
internal implementation details. A new demonstration is warranted only when
its rendered result answers a distinct reader question.
