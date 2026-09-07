---
page:
  description: Scan the capabilities Norna currently provides for authoring, organizing, presenting, checking, and publishing a website.
---

# Capabilities

Use this page to decide whether Norna covers the needs of a site. It groups
current capabilities by what they let an author or reader accomplish, rather
than by source file or internal subsystem.

Everything below is implemented in the current Norna repository unless a
limitation is stated explicitly. Use **Reference documentation** in this area
when you need exact syntax, accepted values, defaults, or error behavior.

## Write and structure content {#content}

- **Markdown-first pages.** Prose, headings, links, lists, quotations, and code
  stay in ordinary `content.md` files.
- **A predictable heading model.** Each page has one H1 title. H2 headings form
  its navigable sections, while H3 and H4 headings structure longer sections.
- **Purpose-built content blocks.** Fenced Markdown blocks place image stacks,
  image carousels, and card lists at a precise point in the text.
- **Notes and code examples.** Numbered side notes use a margin when the active
  layout reserves one and remain in the reading flow otherwise. Fenced code
  gets syntax highlighting and a copy control while remaining readable without
  JavaScript.
- **Page metadata.** Optional frontmatter supplies a page description and old
  URL aliases without becoming visible prose.

Exact behavior: [Content](https://github.com/janga/norna/blob/main/docs/content.md).

## Organize pages and navigation {#pages}

- **One page or a deep hierarchy.** The same ordered directory model supports
  a one-page site, independent top-level pages, and nested page trees.
- **Pages and navigation categories.** A directory can produce a real page or
  group descendants under a label that has no page of its own.
- **Navigation derived from structure.** Norna selects section, top, or tree
  navigation from the page hierarchy and presents the same destinations in a
  consolidated mobile menu.
- **Reading context on larger sites.** Tree navigation supplies breadcrumbs, a
  persistent page rail, and an H2/H3 contents rail with the current reading
  position marked as the reader scrolls.
- **Optional static search.** A single setting adds a localized search page
  backed by the finished rendered content, with section-level results and no
  search server.
- **Stable, checked destinations.** Deterministic page URLs and heading ids,
  collision checks, and static aliases keep links predictable.

Exact behavior:
[Pages And Categories](https://github.com/janga/norna/blob/main/docs/pages.md)
and [Configuration](https://github.com/janga/norna/blob/main/docs/configuration.md#navigation).

## Present images and shared elements {#media}

- **Page-owned images.** JPEG, PNG, and SVG source files live beside the page
  that uses them and are referenced by filename from Norna blocks.
- **Responsive raster output.** Norna creates suitable WebP variants, emits
  responsive browser markup, prioritizes early images, lazily loads later
  images, and gives changed sources fresh published URLs.
- **Coherent image presentation.** Presets choose prose-aligned or centered,
  viewport-fitted media while preserving intrinsic proportions and captions.
- **Structured image compositions.** Stacks show one or more images in reading
  order, carousels present a sequence interactively, and cards combine images,
  text, badges, and links.
- **Shared site elements.** Conventionally named logo, browser-icon, and social
  image files work with optional site-wide banners and footer content.

Exact behavior:
[Images And Metadata](https://github.com/janga/norna/blob/main/docs/images-and-metadata.md),
[Public Files](https://github.com/janga/norna/blob/main/docs/public-files.md),
and [Site-Wide Content](https://github.com/janga/norna/blob/main/docs/sitewide-content.md).

## Start from a coordinated visual system {#presentation}

- **Complete presets.** Portfolio, Documentation, Project, and Statement each
  coordinate typography, spacing, content width, media, navigation, corners,
  section surfaces, and reader choices.
- **Built-in palettes and Appearance.** Every palette provides checked Light
  and Dark variants, with System as the normal initial Appearance.
- **Focused overrides.** A site can replace supported preset values while
  retaining the rest of the coordinated default. Page subtrees receive a
  deliberately smaller set of presentation overrides.
- **Reader-controlled display.** Readers can adjust text width. A theme may
  also offer Appearance, while tree navigation provides Focus reading.
- **Engine-owned readability.** Presets and overrides remain inside shared
  contrast, focus, heading hierarchy, text-width, reflow, and control-size
  guarantees.

Exact behavior: [Theme](https://github.com/janga/norna/blob/main/docs/theme.md),
[Typography](https://github.com/janga/norna/blob/main/docs/typography.md), and
[Presentation Guarantees](https://github.com/janga/norna/blob/main/docs/presentation-guarantees.md).

## Check and reorganize the source {#maintenance}

- **Aggregated checks.** Configuration and content checks report schema,
  hierarchy, heading, block, note, image, and link problems without stopping at
  the first issue.
- **Checked internal links.** Pages, H2/H3 anchors, aliases, cards, and public
  files share one link graph, including sites published below a base path.
- **Safe page creation and movement.** Commands create ordered pages and
  categories. Page moves begin with a dry run, move complete subtrees, update
  internal references, and preserve old URLs by default.
- **Read-only structure review.** A command summarizes hierarchy depth, sibling
  groups, page outlines, internal page links, and effective navigation before
  an author decides whether to reorganize the site.
- **Conservative image synchronization.** `content:sync` moves a referenced
  image only when its source and intended destination are unambiguous.
- **Version-aware project commands.** Project scripts use the locally installed
  Norna version, while update and diagnostic commands expose the resolved
  engine and site paths.

Repository-built VS Code support can also provide project-aware configuration,
Markdown, image-name, and diagnostic help. It is not yet available from the
Visual Studio Marketplace and is therefore an evaluation feature rather than a
normal installation step.

Exact behavior: [Commands](https://github.com/janga/norna/blob/main/docs/commands.md)
and [VS Code Editor Support](https://github.com/janga/norna/blob/main/docs/editor-support.md).

## Build and publish static output {#publishing}

- **Static pages first.** Norna writes the finished site to `dist/`. Ordinary
  content needs no client-side JavaScript; scripts are added only for features
  that need interaction or progressive enhancement.
- **Public-web essentials.** Builds include canonical and social metadata, a
  sitemap, a useful `404.html`, and static pages for old URL aliases.
- **Efficient image builds.** Unchanged generated image variants can be reused
  instead of being recreated, while content-hashed URLs prevent stale browser
  and deployment caches after a source changes.
- **Integrated GitHub Pages publishing.** The starter includes a checked GitHub
  Actions workflow, and Norna can monitor the resulting deployment.
- **Portable static output.** Other static hosts can serve `dist/`, although
  GitHub Pages is currently the only provider with a Norna-owned integration.

Exact behavior:
[Publishing](https://github.com/janga/norna/blob/main/docs/publishing.md),
[Public Files](https://github.com/janga/norna/blob/main/docs/public-files.md),
and [Client-Side JavaScript](https://github.com/janga/norna/blob/main/docs/client-javascript.md).

## Know the current boundaries {#boundaries}

Norna provides its own page model and presentation layer. It does not provide
project-defined templates, arbitrary components, or a general plugin API. A
dynamic application, database-backed site, or visual CMS needs a different
platform.

Multilingual page trees, collections, taxonomies, pagination, feeds, and
versioned documentation are not currently part of Norna. These larger models
are considered separately rather than being added as isolated settings.

Norna is pre-1.0, and its file and command contracts can still change between
releases. See
[Requirements And Limitations](https://github.com/janga/norna/blob/main/docs/requirements.md)
for the supported environment and current product boundary.
