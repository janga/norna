---
page:
  description: See rendered Norna results beside the exact Markdown, configuration, files, and commands that produce them.
---

# Examples

## Write with standard Markdown {#standard-markdown}

### Before publishing

Run the **source checks**, then:

1. preview the site;
2. review the changed pages;
3. publish when the result is ready.

> A useful page keeps its source understandable before any presentation is
> applied.

````md
### Before publishing

Run the **source checks**, then:

1. preview the site;
2. review the changed pages;
3. publish when the result is ready.

> A useful page keeps its source understandable before any presentation is
> applied.
````

**Source:** Standard Markdown. Norna supplies the typography and responsive
layout without replacing headings, prose, emphasis, links, lists, quotations,
or ordinary code fences. Read the
[Markdown text reference](https://github.com/janga/norna/blob/main/docs/content.md#markdown-text).

## Add a single image {#single-image}

```image-stack
- image: stack-one.svg
  alt: A pale panel with one large circle and two horizontal lines.
  caption: One image with an attached caption.
```

````md
```image-stack
- image: stack-one.svg
  alt: A pale panel with one large circle and two horizontal lines.
  caption: One image with an attached caption.
```
````

**Source:** Norna Markdown extension. `image` names a file in the current
page's `images/` directory, `alt` describes its purpose for readers who cannot
see it, and `caption` adds visible context. All three supported fields are shown
above; only `image` is required.

Use a Norna image block rather than ordinary Markdown image syntax for local
editorial images. Norna can then validate the file, generate responsive output,
and keep it with the page when `page:move` moves that page. Ordinary Markdown
images remain suitable for external URLs and static files in `site/public/`.

Norna supplies semantic image markup and responsive presentation. The author
still owns the image's meaning. An AI tool may draft alternative text, but the
author must review it in the context where the image appears and decide whether
the image needs descriptive or empty alternative text. Read the
[managed-image reference](https://github.com/janga/norna/blob/main/docs/images-and-metadata.md#managed-source-images)
and [W3C image decision guidance](https://www.w3.org/WAI/tutorials/images/).

## Image stacks {#image-stacks}

```image-stack
- image: stack-one.svg
  alt: A pale panel with one large circle and two horizontal lines.
  caption: The first image introduces one visual idea.
- image: stack-two.svg
  alt: A dark panel with three aligned rectangular forms.
  caption: The related image remains visible next in reading order.
```

````md
```image-stack
- image: stack-one.svg
  alt: A pale panel with one large circle and two horizontal lines.
  caption: The first image introduces one visual idea.
- image: stack-two.svg
  alt: A dark panel with three aligned rectangular forms.
  caption: The related image remains visible next in reading order.
```
````

**Source:** Norna Markdown extension. Use a stack when every image should stay
visible in sequence. See the
[image-stack reference](https://github.com/janga/norna/blob/main/docs/content.md#image-stack).

## Image carousels {#image-carousels}

```image-carousel
- image: carousel-one.svg
  alt: A green panel with a broad diagonal line.
  caption: First frame: a broad direction.
- image: carousel-two.svg
  alt: A blue panel with two overlapping circles.
  caption: Second frame: a closer relationship.
- image: carousel-three.svg
  alt: A red panel with a compact grid.
  caption: Third frame: a denser detail.
```

````md
```image-carousel
- image: carousel-one.svg
  alt: A green panel with a broad diagonal line.
  caption: First frame: a broad direction.
- image: carousel-two.svg
  alt: A blue panel with two overlapping circles.
  caption: Second frame: a closer relationship.
- image: carousel-three.svg
  alt: A red panel with a compact grid.
  caption: Third frame: a denser detail.
```
````

**Source:** Norna Markdown extension. Use a carousel when related images should
share one visual position. Norna adds fitted controls, keyboard operation,
touch dragging, slide status, and a readable no-JavaScript fallback. See the
[image-carousel reference](https://github.com/janga/norna/blob/main/docs/content.md#image-carousel).

## Card lists {#card-lists}

```card-list
layout: image-top
flow: grid
size: m

- title: Prepare source files
  text: Keep related content and images together before building the site.
  image: card-stack.svg
- title: Review presentation
  text: Check the result at wide and narrow browser widths.
  image: card-carousel.svg
- title: Publish the result
  text: Build validated static output when the site is ready.
  image: card-surfaces.svg
```

````md
```card-list
layout: image-top
flow: grid
size: m

- title: Prepare source files
  text: Keep related content and images together before building the site.
  image: card-stack.svg
- title: Review presentation
  text: Check the result at wide and narrow browser widths.
  image: card-carousel.svg
- title: Publish the result
  text: Build validated static output when the site is ready.
  image: card-surfaces.svg
```
````

**Source:** Norna Markdown extension. Cards are for a short collection of
comparable choices, resources, or steps. Each card can include an image and
link to a page or an external resource. Read the
[card-list reference](https://github.com/janga/norna/blob/main/docs/content.md#card-list).

[Open the complete media and surfaces site](https://janga.github.io/norna/examples/feature-demos/media-and-surfaces/)
to inspect these blocks together across several pages, or
[browse its maintained source](https://github.com/janga/norna/tree/main/examples/feature-demos/media-and-surfaces).

## Semantic callouts {#semantic-callouts}

> [!TIP]
> Preview the site before publishing it.

> [!WARNING]
> Commit source files before a structural change that you may want to undo.

```md
> [!TIP]
> Preview the site before publishing it.

> [!WARNING]
> Commit source files before a structural change that you may want to undo.
```

**Source:** GitHub-style alerts, supported by Norna as semantic callouts.
Alerts are not part of the formal GFM specification. Norna supports `NOTE`, `TIP`, `IMPORTANT`,
`WARNING`, `CAUTION`, and `DANGER`; the meaning is expressed by structure and a
localized label rather than color alone. `DANGER` is an additional Norna type.
Read the
[semantic-callout reference](https://github.com/janga/norna/blob/main/docs/content.md#semantic-callouts).

## Sidenotes {#sidenotes}

A short qualification can remain next to the sentence that needs it when the
layout has a free margin.{note-ref}

{note: This linked note returns to the normal reading flow when the available margin cannot hold it safely.}

```md
A short qualification can remain next to the sentence that needs it when the
layout has a free margin.{note-ref}

{note: This linked note returns to the normal reading flow when the available margin cannot hold it safely.}
```

**Source:** Norna inline note extension. Use a reference
footnote instead when supporting material belongs at the end of the page. Read
the [side-note reference](https://github.com/janga/norna/blob/main/docs/content.md#side-notes)
and [reference-footnote alternative](https://github.com/janga/norna/blob/main/docs/content.md#reference-footnotes).

## Code blocks {#code-blocks}

```yaml title="site/config.yaml" {2}
url: https://example.com/
search: true
language: en
```

````md
```yaml title="site/config.yaml" {2}
url: https://example.com/
search: true
language: en
```
````

**Source:** Standard fenced Markdown with optional Norna metadata. The title
identifies the file, `{2}` emphasizes the relevant line, and the title stays in
view while a long example scrolls. JavaScript adds a copy control without
changing the readable fallback. Read the
[code-block reference](https://github.com/janga/norna/blob/main/docs/content.md#code-blocks).

## Get readable tables from standard Markdown {#tables}

| Capability {row-header} | Source | Wide screen | Small screen | With JS | Without JS |
| --- | --- | --- | --- | --- | --- |
| Links | Markdown | Inline | Wrap | No change | Links |
| Images | `image-stack` | Preset width | Fit | Inspector | Image link |
| Carousels | `image-carousel` | Fit | Swipe | Slides | Static images |
| Cards | `card-list` | Grid | Reflow | No change | Full list |
| Callouts | Alert quote | In prose | Reflow | No change | Labels |
| Sidenotes | Note pair | Free margin | Inline | No change | Linked notes |
| Code | Code fence | Expand | Scroll | Copy | Select text |
| Tables | Markdown | Expand | Scroll | Column controls | Scroll |
| Search | `config.yaml` | Search page | Same page | Pagefind | Navigation |
| Appearance | `theme.yaml` | Light or Dark | Same choice | Reader choice | Default |

````md title="Table source (Markdown)"
| Capability {row-header} | Source | Wide screen | Small screen | With JS | Without JS |
| --- | --- | --- | --- | --- | --- |
| Links | Markdown | Inline | Wrap | No change | Links |
| Images | `image-stack` | Preset width | Fit | Inspector | Image link |
| Carousels | `image-carousel` | Fit | Swipe | Slides | Static images |
| Cards | `card-list` | Grid | Reflow | No change | Full list |
| Callouts | Alert quote | In prose | Reflow | No change | Labels |
| Sidenotes | Note pair | Free margin | Inline | No change | Linked notes |
| Code | Code fence | Expand | Scroll | Copy | Select text |
| Tables | Markdown | Expand | Scroll | Column controls | Scroll |
| Search | `config.yaml` | Search page | Same page | Pagefind | Navigation |
| Appearance | `theme.yaml` | Light or Dark | Same choice | Reader choice | Default |
````

**Source:** GitHub Flavored Markdown table syntax. The `{row-header}` marker
is a Norna extension: it makes the first column's cells row headings.
Omit that marker for an ordinary table.

The table uses available space before scrolling horizontally. Its column
headings stay visible while you scroll its rows. The code block above contains
every cell of this table, unchanged. Read the
[table reference](https://github.com/janga/norna/blob/main/docs/content.md#tables).

## List child pages automatically {#page-list}

<!-- norna-image-provenance:
image: child-page-list.png
source: local-browser-capture
Captured from fixtures/child-page-list/site at /help-a-dog/ using the
registered scratch review environment at 1200 by 800 pixels. Reproduction
commands are in fixtures/child-page-list/README.md.
-->

```image-stack
- image: child-page-list.png
  alt: Adoption, Fostering, and Sponsorship appear in both navigation and the page list. The list explains permanent care, temporary care, and financial support.
  caption: The descriptions explain the commitment behind each choice.
```

The navigation names the options; the descriptions help a reader decide.
The empty block collects direct child pages in directory order. You write the
guidance in each child's `page.description`, not in the list.

````md title="pages/010-help-a-dog/content.md"
# Help a dog

## Find the right commitment

A permanent home is only one way to help. Consider how much time, space, and
ongoing responsibility you can offer. If you cannot take a dog home, you can
still support its care.

```page-list
```
````

```text
010-help-a-dog/
|-- content.md
`-- pages/
    |-- 010-adoption/content.md
    |-- 020-fostering/content.md
    `-- 030-sponsorship/content.md
```

Each child's opening supplies its title and description:

```md title="pages/010-help-a-dog/pages/010-adoption/content.md (opening)"
---
page:
  description: Give a dog a permanent home. Learn about matching, visits and the adoption process.
---

# Adoption
```

```md title="pages/010-help-a-dog/pages/020-fostering/content.md (opening)"
---
page:
  description: Offer a temporary home while a dog waits for adoption. We explain the support and equipment provided.
---

# Fostering
```

```md title="pages/010-help-a-dog/pages/030-sponsorship/content.md (opening)"
---
page:
  description: Help cover food and veterinary care when you cannot take a dog home.
---

# Sponsorship
```

Adding, moving, or removing a child updates the list; descriptions stay with
their pages. Norna warns if an included page has no description.

**Source:** Norna Markdown extension with no options. Use a list when its
context helps readers choose. If it only repeats navigation, use a category
instead of creating a parent page. Read the
[child-page-list reference](https://github.com/janga/norna/blob/main/docs/content.md#child-page-list).

## Automatic responsive navigation {#automatic-navigation}

### One page: sections

A single page needs only its title and section links. These screenshots use
the complete Markdown shown below, with the `project` preset.

```image-stack
- image: navigation-single-desktop.png
  alt: Dog Shelter on a wide screen, with its title and two section links in sticky navigation.
  caption: In a sufficiently large browser.
```

```image-carousel
- image: navigation-single-mobile.png
  alt: The same page on a small screen, showing What we do and its text below a closed Menu trigger.
  caption: On a small screen, with Menu closed.
- image: navigation-single-menu.png
  alt: The open compact menu contains Dog Shelter, What we do, and You can help.
  caption: On a small screen, with Menu open.
```

```text
pages/
`-- 000-home/
    `-- content.md
```

<!-- navigation-source: fixtures/navigation-examples/single/site/pages/000-home/content.md -->

```md title="pages/000-home/content.md"
# Dog Shelter

## What we do

We rescue and rehome dogs.

## You can help

Adopt. Foster. Donate.
```

### Top-level pages: top navigation

Adding Dogs and Adopt gives each page its own URL. Select a page name to open
it, or its chevron to choose a section directly.

```image-carousel
- image: navigation-top-desktop.png
  alt: Dogs on a wide screen, with Dog Shelter, Dogs, and Adopt in top navigation and the current page sections below.
  caption: In a sufficiently large browser.
- image: navigation-top-sections.png
  alt: The Dogs disclosure shows Meet the dogs and Before you adopt as direct section links.
  caption: Each page's chevron reveals its H2 destinations.
```

```image-carousel
- image: navigation-top-mobile.png
  alt: Dogs with Menu closed on a small screen.
  caption: The page with Menu closed.
- image: navigation-top-menu.png
  alt: The compact menu groups the Dogs sections beneath Dogs, alongside the other pages.
  caption: Menu groups sections under their pages.
```

```text
pages/
|-- 000-home/content.md
|-- 010-dogs/content.md
`-- 020-adopt/content.md
```

<!-- navigation-source: fixtures/navigation-examples/top/site/pages/010-dogs/content.md -->

```md title="pages/010-dogs/content.md"
# Dogs

## Meet the dogs

Each dog needs a home that suits its personality and daily routine.

## Before you adopt

Talk to our volunteers about exercise, company, and veterinary care.
```

### Nested pages: a page tree

As documentation grows, group related guides and reference pages into
branches. Readers can explore one topic at a time.

Put Adult dogs and Senior dogs beneath Dogs to keep related pages together.
The left tree contains the Dogs branch; Adopt remains a global destination.

```image-stack
- image: navigation-nested-desktop.png
  alt: Adult dogs with Dogs and its child pages in a left tree, plus the current page's sections.
  caption: In a sufficiently large browser.
```

```image-carousel
- image: navigation-nested-mobile.png
  alt: Adult dogs on a small screen, without persistent navigation rails.
  caption: The same page with Menu closed.
- image: navigation-nested-menu.png
  alt: The open compact menu preserves Dogs, its child pages, and their sections.
  caption: Menu preserves the hierarchy.
```

```text
pages/
|-- 000-home/content.md
|-- 010-dogs/
|   |-- content.md
|   `-- pages/
|       |-- 010-adult-dogs/content.md
|       `-- 020-senior-dogs/content.md
`-- 020-adopt/content.md
```

<!-- navigation-source: fixtures/navigation-examples/nested/site/pages/010-dogs/pages/010-adult-dogs/content.md -->

```md title="pages/010-dogs/pages/010-adult-dogs/content.md"
# Adult dogs

## Daily routines

Adult dogs benefit from regular walks, company, and a quiet place to rest.

## A good match

Tell us about your household so we can help you find a suitable companion.
```

The same structure can hold a larger handbook. Here, platform guides belong
under Installation, and publishing guides form a separate branch. The left
tree selects a page; the right outline follows headings within that page.
This excerpt uses the `documentation` preset.

```image-stack
- image: navigation-documentation-desktop.png
  alt: A handbook with Guides, Installation, and Linux selected in the left tree. Requirements, Check Node.js, and Local preview appear in the right outline beside the Linux page.
  caption: A deeper documentation branch, with pages on the left and the current page's outline on the right.
```

```text title="Documentation example"
pages/
|-- 000-home/content.md
|-- 010-guides/
|   |-- category.yaml
|   `-- pages/
|       |-- 010-installation/
|       |   |-- content.md
|       |   `-- pages/
|       |       |-- 010-macos/content.md
|       |       |-- 020-windows/content.md
|       |       `-- 030-linux/content.md
|       `-- 020-publishing/
|           |-- content.md
|           `-- pages/
|               `-- 010-github-pages/content.md
`-- 020-reference/content.md
```

<!-- navigation-source: fixtures/navigation-examples/documentation/site/pages/010-guides/pages/010-installation/pages/030-linux/content.md -->

````md title="pages/010-guides/pages/010-installation/pages/030-linux/content.md"
# Linux

## Requirements

Install Node.js 22.12 or later. Install ImageMagick too if your site uses
raster images.

### Check Node.js

```sh
node --version
```

## Local preview

From an installed site project's directory, start Norna:

```sh
npm run norna:dev
```

Open the address printed in the terminal. Keep the terminal running while
you edit your site.
````

This is a small excerpt, not a reason to add levels unnecessarily. Large
documentation sites such as
[Kubernetes](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/setup-ha-etcd-with-kubeadm/)
and [Grafana](https://grafana.com/docs/grafana/latest/alerting/configure-notifications/)
use branches to organize installation methods and configuration topics.

**Source:** The page directories and Markdown headings determine navigation.
`navigation.mode` defaults to `automatic`. H2s appear in section and top
navigation; tree outlines also include H3s. A deeper branch can use a separate
right-hand outline. As space runs out, Norna moves that outline into the left
tree, then uses the compact menu. Home stays an uncluttered entry page.

<!-- Screenshots: scripts/capture-navigation-examples.mjs. All four runnable
sources are in fixtures/navigation-examples; no illustrated UI is hand-drawn. -->

Read the
[navigation reference](https://github.com/janga/norna/blob/main/docs/pages.md#navigation)
for mode selection, depth, exceptions, and responsive fallbacks.

## Move pages without breaking links {#page-move}

The preview reports the directory move, affected internal links, and old URLs
without writing files. The write step moves the complete page subtree and its
images, updates links, and records redirect aliases.

```sh
# Preview the complete operation without changing files
norna page:move /guides/install/ /reference/install/

# Apply the reviewed move
norna page:move /guides/install/ /reference/install/ --write
```

**Source:** Norna command. Conflicts, ambiguous links, invalid destinations,
and failed post-write validation stop the operation rather than leaving a
partially accepted structure. Read the
[page-move reference](https://github.com/janga/norna/blob/main/docs/pages.md#move-or-reconcile-a-page).

## Add static search {#search}

[Open the generated search page for this documentation site](/search/). It
searches rendered page titles, sections, prose, captions, notes, and structured
content without a hosted search service.

```yaml title="site/config.yaml"
search: true
```

**Source:** Site configuration. The search engine and its index load only on the
search page. Use **Back to Examples** above the search heading to return to
your reading position. Read the
[search reference](https://github.com/janga/norna/blob/main/docs/configuration.md#search).

## Set the site language {#language}

| Source choice | Example generated interface labels |
| --- | --- |
| `language: sv` | Sidor, Sidinnehåll, Sök, Visning, Fokuserad läsning |

```yaml title="site/config.yaml"
language: sv
```

**Source:** Site configuration. The value identifies the HTML language and
selects one complete built-in interface pack. It does not translate Markdown,
captions, banners, or other editorial content. Most non-English interface packs
were AI-generated and must be reviewed by a fluent speaker before publication.
Read the [language reference](https://github.com/janga/norna/blob/main/docs/configuration.md#language).

## Brand your site {#branding}

<!-- norna-image-provenance:
image: navigation-logo.svg
source: maintained repository asset
Copied from the public files of the site-wide content demonstration.
-->

```image-stack
- image: navigation-logo.svg
  alt: The Shared Frame example logo, made from overlapping outlined squares and a wordmark.
  caption: A conventionally named logo is discovered without a path setting.
```

```text
site/public/
|-- logo.svg          # Navigation logo
|-- favicon.svg       # Browser tab and bookmark icon
`-- social-image.jpg  # Default social sharing image
```

**Source:** Convention-based public files. Each role has an exact set of
accepted filenames and uniqueness rules; no image path belongs in YAML. Read
the [public-files reference](https://github.com/janga/norna/blob/main/docs/public-files.md).

## Add site-wide notices and a footer {#site-wide-elements}

[Open the complete site-wide elements demonstration](https://janga.github.io/norna/examples/feature-demos/sitewide-content/)
to see the same logo, dismissible notices, and footer across several pages.

```yaml title="site/sitewide-content.yaml"
logo:
  height: 2.8rem
banners:
  - id: preview-environment
    tone: warning
    title: Preview environment
    text: This sitewide notice appears on every page in the demo.
  - id: content-review
    tone: warning
    title: Content review
    text: Dismiss each notice independently with its close button.
footer:
  copyrightMessage: Shared Frame sitewide-content example.
  buildInfo: true
```

**Source:** The linked demonstration's complete shared configuration. It also
has a conventional `site/public/logo.svg` file. Page prose stays in each
`content.md`; repeated banners, footer content, and an optional logo-height
override belong here. Browse the
[maintained demonstration source](https://github.com/janga/norna/tree/main/examples/feature-demos/sitewide-content)
or read the
[site-wide content reference](https://github.com/janga/norna/blob/main/docs/sitewide-content.md).

## Get coherent defaults from a preset {#presets}

```card-list
flow: grid
size: s

- title: Portfolio
  text: Image-led work and visual collections.
  link: https://janga.github.io/norna/examples/feature-demos/theme-preset-portfolio/
- title: Documentation
  text: Guides, reference material, and sustained reading.
  link: https://janga.github.io/norna/examples/feature-demos/theme-preset-documentation/
- title: Project
  text: Product or project sites combining prose, code, cards, and images.
  link: https://janga.github.io/norna/examples/feature-demos/theme-preset-project/
- title: Statement
  text: Concise editorial sites with spacious rhythm and prominent media.
  link: https://janga.github.io/norna/examples/feature-demos/theme-preset-statement/
```

```yaml title="site/theme.yaml"
preset: documentation
```

**Source:** Root theme configuration. A preset supplies coordinated defaults
for a typical scenario: typography, spacing, page width, media placement,
colors, corners, navigation, and structured blocks. It avoids asking the author
to design every relationship independently.

Override only a deliberate exception; all other values still come from the
preset:

```yaml title="site/theme.yaml"
preset: documentation
layout:
  textWidth: normal
```

[Open the Theme explorer](https://janga.github.io/norna/examples/theme-presets/)
to switch presets while keeping its comparison content unchanged. Read the
[preset reference](https://github.com/janga/norna/blob/main/docs/theme.md#theme-presets).

## Choose a coordinated color palette {#palettes}

This documentation site uses one palette across navigation, prose, controls,
semantic states, Light appearance, and Dark appearance. A palette changes that
coordinated color system without replacing the preset's typography or spacing.
This example selects the same palette with the `documentation` preset:

```yaml title="site/theme.yaml"
preset: documentation
palette: clay-rose
```

**Source:** Root theme configuration. Use the
[Theme explorer](https://janga.github.io/norna/examples/theme-presets/) to
combine the built-in presets and palettes, then inspect the generated
`theme.yaml`. Read the
[palette and Appearance reference](https://github.com/janga/norna/blob/main/docs/theme.md#palette-and-appearance).

## Let readers adapt the display {#reader-display}

Open **Display** in this site's header. Reading width is always available;
Narrow, Standard, and Wide alter the reading measure without changing the
source. Appearance can follow the reader's system or use Light or Dark. Focus
reading removes persistent navigation, breadcrumbs, and the footer while
preserving access to the site through a compact menu.

```yaml title="site/theme.yaml"
appearance:
  default: system
readerControls:
  appearance: true
  focusReading: true
```

**Source:** Root theme configuration plus reader-owned choices. The theme sets
the initial presentation and which optional controls are offered; the reader's
selection is stored only in that browser. Read the
[reader Display reference](https://github.com/janga/norna/blob/main/docs/theme.md#reader-display-controls)
and [client-side JavaScript contract](https://github.com/janga/norna/blob/main/docs/client-javascript.md).

## Complete sites {#complete-sites}

The dog-shelter sites are complete Norna projects rather than isolated feature
fragments. They are intentionally small enough that desktop navigation barely
needs more than a top row. This documentation site demonstrates the contrasting
hierarchical case with page and contents rails.

```image-stack
- image: single-page-dog-shelter.png
  alt: The complete single-page dog shelter example shown in a desktop browser.
  caption: One page whose H2 sections become its navigation destinations.
- image: multi-page-dog-shelter.png
  alt: The complete multi-page dog shelter example shown in a desktop browser.
  caption: Several top-level pages sharing one responsive top navigation.
```

[Open the single-page site](https://janga.github.io/norna/examples/complete-sites/dog-shelter-single-page/)
or [browse its source](https://github.com/janga/norna/tree/main/examples/complete-sites/dog-shelter-single-page).
[Open the multi-page site](https://janga.github.io/norna/examples/complete-sites/dog-shelter-multi-page/)
or [browse its source](https://github.com/janga/norna/tree/main/examples/complete-sites/dog-shelter-multi-page).
The [documentation-site source](https://github.com/janga/norna/tree/main/site)
shows the deeper hierarchy used by the page you are reading.
Read the [page structure and navigation reference](https://github.com/janga/norna/blob/main/docs/pages.md#navigation)
for the rules behind these layouts.

Norna generates semantic HTML, responsive layout, keyboard behavior, focus
handling, and accessible labels for its own controls. Authors remain
responsible for meaningful headings, links, captions, language, and alternative
text. The engine can preserve those decisions across screen sizes; it cannot
make inaccessible editorial content accessible automatically.
