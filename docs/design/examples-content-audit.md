# Examples Content Audit

This audit records the source comparison and teaching decisions behind
[`BL-042` Examples Audit And Teaching Structure](backlog/BL-042-examples-audit.md).
It is not a catalogue intended for end users.

## Current Review Status

The first implementation of
[BL-083: Result-first single-page examples](backlog/BL-083-result-first-single-page-examples.md)
needs corrections after human review on 2026-09-11. The findings below are
earlier source and teaching decisions, not evidence that the revised gallery
is accurate in its final form.

The ordered correction work is recorded in that item's backlog file.
[BL-091: Final examples audit against implemented behavior](backlog/BL-091-final-examples-implementation-audit.md)
must run last, after the seven preceding corrections. Record its per-section
evidence and any remaining issues here before closing the gallery work.

## Sources Reviewed

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
- Treat the documentation site as the maintained nested-page example instead
  of creating another fictional hierarchy.
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
