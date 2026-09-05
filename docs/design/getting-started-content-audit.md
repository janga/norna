# Getting Started Content Audit

This audit records the source comparison and editorial decisions behind
[`BL-041` Beginner-First Getting Started Audit](backlog/BL-041-getting-started-audit.md).
It is an implementation record, not another user-facing introduction.

## Sources Reviewed

The review covered these source groups:

- `site/pages/000-home/` and the complete
  `site/pages/020-getting-started/` documentation-site subtree;
- the Examples, FAQ, and Resources pages where they overlap with onboarding;
- `README.md`, `docs/README.md`, and every canonical reference linked from that
  index;
- `starters/basic/`, `starters/project/`, their generated site files, and the
  command set produced by `scripts/init-site.mjs`;
- every tracked complete site, feature demo, and README under `examples/`;
- the locally excluded `examples/complete-sites/norna-feature-landscape/`
  analysis site available during this audit;
- schemas, command help, implementation, and tests used to verify current file
  names, defaults, and command behavior.

The feature-landscape analysis is useful positioning input, but it is not
available in a fresh clone and is therefore not an instructional dependency.

## Content Decisions

| Reader question | Introductory owner | Canonical detail | Decision |
| --- | --- | --- | --- |
| What is Norna and who is it for? | Homepage | Root `README.md` and `docs/requirements.md` | Keep the promise on the homepage; repeat only one sentence in installation context. |
| What must be installed? | Install Norna | `docs/requirements.md` | State Node and conditional ImageMagick requirements, then link exact platform detail. |
| How do I create and run a site? | Install Norna | `docs/commands.md` and `docs/local-development.md` | Keep one normal standalone command path and introduce the optional launcher only after npm scripts. |
| What should I edit first? | Install Norna | `docs/content.md` | Make one Markdown edit and explain H1, H2, and H3 only as far as that edit requires. |
| How do I choose presentation? | Choose A Theme | `docs/theme.md` | Choose one complete preset first; remove the second complete content example and defer exhaustive overrides. |
| Where do files and images belong? | Grow Your Site | `docs/site-files.md` and `docs/images-and-metadata.md` | Use the illustrated page progression; retain one concise managed-image synchronization example. |
| When should content become another page? | Grow Your Site | `docs/pages.md` | Introduce sections, pages, and categories in that order; defer inheritance and edge cases. |
| How does navigation grow? | Grow Your Site | `docs/pages.md` | Show one-page, top-level, and nested outcomes; defer Focus reading and tracking mechanics. |
| How do pages link to each other? | Grow Your Site | `docs/content.md` | Show site-relative Markdown links after creating top-level pages; defer every accepted link form and error case. |
| Where do language, page descriptions, site identity, banners, and footer belong? | Prepare Your Site | `docs/configuration.md`, `docs/content.md`, `docs/public-files.md`, and `docs/sitewide-content.md` | Introduce ownership with one minimal example for each source; keep exact filenames, metadata rules, and optional fields in reference. |
| How do I check the site? | Install Norna, then Build And Publish | `docs/commands.md` | Run the full check after the first edit and repeat it as the pre-build gate. |
| How do I publish? | Build And Publish | `docs/publishing.md` | Keep the GitHub Pages happy path; summarize generated metadata, sitemap, and 404 output in one place. |
| How do I move pages safely? | FAQ | `docs/pages.md` | Remove the operational detail from Getting Started. |
| How do reader controls work? | Examples | `docs/theme.md` and `docs/client-javascript.md` | Demonstrate them outside the beginner path. |
| How do I embed Norna in another project? | FAQ | `docs/commands.md` and `docs/publishing.md` | Keep it outside the normal standalone path. |
| How does editor assistance work? | Reference | `docs/editor-support.md` | Do not present experimental editor distribution as a prerequisite. |

## Findings Applied

- The generated basic starter used long Lorem Ipsum sections and explained old
  navigation behavior. It now presents a small, realistic first-edit surface.
- Both starter READMEs suggested the unchanged start command when the default
  port was occupied. That duplicate instruction was removed.
- Choose A Theme repeated a complete homepage already introduced elsewhere.
  The page now focuses on choosing a preset and making one override.
- Grow Your Site mixed the beginner page model with Focus reading, automatic
  contents tracking, theme inheritance, and page-move recovery. Those details
  remain in reference and FAQ material.
- Prepare Your Site now closes the gap between page content and publication by
  introducing site language, page descriptions, convention-discovered identity
  files, banners, and footer without reproducing their complete reference.
- Build And Publish gave sitemap, social image, and 404 output separate tutorial
  weight. They now appear as one build outcome with a reference link.

## Verification Boundary

The generated starter, documentation site, examples, and package-install path
remain the executable checks for this material. Human review should concentrate
on whether the rendered progression is concise and whether the existing
illustrations remain legible, rather than re-validating command semantics by
inspection.
