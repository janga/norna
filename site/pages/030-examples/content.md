---
page:
  description: See rendered Norna results beside the exact Markdown, configuration, files, and commands that produce them.
---

# Examples

See what Norna renders, then inspect the smallest source that produces it.
Each example links to the canonical reference for complete syntax, defaults,
and constraints.

## Write with standard Markdown {#standard-markdown}

### Before publishing {#before-publishing}

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
  caption: One managed image with visible context below it.
```

````md
```image-stack
- image: stack-one.svg
  alt: A pale panel with one large circle and two horizontal lines.
  caption: One managed image with visible context below it.
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
comparable choices, resources, or steps. Read the
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

**Source:** The GitHub Flavored Markdown (GFM) alert convention, interpreted by
Norna as semantic callouts. The closed set is `NOTE`, `TIP`, `IMPORTANT`,
`WARNING`, `CAUTION`, and `DANGER`; the meaning is expressed by structure and a
localized label rather than color alone. Read the
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

**Source:** Norna inline note extension. Use a standard Markdown reference
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
identifies the file, `{2}` emphasizes the relevant line, long titles remain in
view while their code scrolls, and JavaScript adds a copy control without
changing the readable fallback. Read the
[code-block reference](https://github.com/janga/norna/blob/main/docs/content.md#code-blocks).

## Get readable tables from standard Markdown {#tables}

| Capability {row-header} | Source | Generated structure | Wide-screen behavior | Narrow-screen behavior | JavaScript enhancement | Static fallback |
| --- | --- | --- | --- | --- | --- | --- |
| Internal links | Markdown links | Ordinary anchors | Checked against pages and headings | Wrap within prose | None required | Links remain links |
| Managed images | `image-stack` | Responsive image markup | Uses the preset's image area | Fits the viewport | Optional inspector | Original image link |
| Carousels | `image-carousel` | Figure and controls | Bounded by width and height | Touch-sized controls | Slide switching | Images remain available |
| Card lists | `card-list` | Semantic list | Grid or stack | Reflows to fewer columns | None required | Complete list remains |
| Callouts | GFM alert blockquote | Labelled aside | Preset-owned surface | Stays within content | None required | Meaningful blockquote source |
| Sidenotes | Note pair | Linked reference and note | Uses a free margin when safe | Returns to reading flow | None required | Linked text remains |
| Code blocks | Fenced Markdown | Figure and code | Sticky title for long examples | Scrolls when necessary | Copy control | Selectable code |
| Tables | GFM table | Native table semantics | Claims free page lanes progressively | Uses bounded horizontal overflow | Cues and column controls | Focusable native scroller |
| Search | Site setting | Generated search route and index | Header entry opens search | Same compact entry | Static Pagefind search | Page navigation remains |
| Appearance | Theme and reader choice | Coordinated color tokens | System, Light, or Dark | Same choices | Persists the selection | Configured default remains |

````md
| Capability {row-header} | Source | Generated structure | Wide-screen behavior | Narrow-screen behavior | JavaScript enhancement | Static fallback |
| --- | --- | --- | --- | --- | --- | --- |
| Internal links | Markdown links | Ordinary anchors | Checked against pages and headings | Wrap within prose | None required | Links remain links |
| Managed images | `image-stack` | Responsive image markup | Uses the preset's image area | Fits the viewport | Optional inspector | Original image link |
| Carousels | `image-carousel` | Figure and controls | Bounded by width and height | Touch-sized controls | Slide switching | Images remain available |
| Card lists | `card-list` | Semantic list | Grid or stack | Reflows to fewer columns | None required | Complete list remains |
| Callouts | GFM alert blockquote | Labelled aside | Preset-owned surface | Stays within content | None required | Meaningful blockquote source |
| Sidenotes | Note pair | Linked reference and note | Uses a free margin when safe | Returns to reading flow | None required | Linked text remains |
| Code blocks | Fenced Markdown | Figure and code | Sticky title for long examples | Scrolls when necessary | Copy control | Selectable code |
| Tables | GFM table | Native table semantics | Claims free page lanes progressively | Uses bounded horizontal overflow | Cues and column controls | Focusable native scroller |
| Search | Site setting | Generated search route and index | Header entry opens search | Same compact entry | Static Pagefind search | Page navigation remains |
| Appearance | Theme and reader choice | Coordinated color tokens | System, Light, or Dark | Same choices | Persists the selection | Configured default remains |
````

**Source:** Standard GitHub Flavored Markdown table syntax with one optional
Norna row-heading marker. This live table is deliberately wide and long: resize
the browser to see it use free page space before exposing horizontal overflow,
and scroll its rows to see the column headings remain in context. Read the
[table reference](https://github.com/janga/norna/blob/main/docs/content.md#tables).

## List child pages automatically {#page-list}

<!-- norna-image-provenance:
image: child-page-list.png
source: local-browser-capture
Captured from fixtures/nested-pages/site at /guides/installation/ using the
registered navigation review environment at 1200 by 800 pixels.
-->

```image-stack
- image: child-page-list.png
  alt: A Norna Installation page with macOS, Linux, and Windows listed as linked child pages below its introduction.
  caption: The parent page renders its direct children from the same page graph used by navigation.
```

Adding, moving, or removing a direct child updates the rendered list without
maintaining those links separately in Markdown.

````md
```page-list
```
````

**Source:** Norna Markdown extension with no options. It is useful on a real
parent page whose introduction adds value; a navigation-only category should
not create a duplicate page merely to show the list. Read the
[child-page-list reference](https://github.com/janga/norna/blob/main/docs/content.md#child-page-list).

## Automatic responsive navigation {#automatic-navigation}

<!-- norna-image-provenance:
image: navigation-one-page.svg
source: hand-authored
Copied from the maintained What Norna Does navigation illustration so the
result-first Examples page can show the same current engine contract.
-->

<!-- norna-image-provenance:
image: navigation-top-level.svg
source: hand-authored
Copied from the maintained What Norna Does navigation illustration so the
result-first Examples page can show the same current engine contract.
-->

<!-- norna-image-provenance:
image: navigation-hierarchy.svg
source: hand-authored
Copied from the maintained What Norna Does navigation illustration so the
result-first Examples page can show the same current engine contract.
-->

```image-carousel
- image: navigation-one-page.svg
  alt: A one-page file tree mapped to section navigation on wide and small screens.
  caption: One listed page uses its H1 and H2 headings as section navigation.
- image: navigation-top-level.svg
  alt: Three top-level pages mapped to horizontal wide-screen navigation and a compact small-screen menu.
  caption: Several top-level pages use top navigation on wide screens and one compact menu on small screens.
- image: navigation-hierarchy.svg
  alt: Nested pages mapped to a wide-screen page tree and the same hierarchy in a compact small-screen menu.
  caption: A listed child page or category gives the site a page tree on wide screens and a compact hierarchy on small screens.
```

```yaml title="site/config.yaml"
navigation:
  mode: automatic
```

**Source:** Site configuration plus the page directory and Markdown heading
hierarchy. `automatic` is also the default when `navigation` is omitted. Norna
uses section navigation for one page, top navigation for flat top-level pages,
and a page tree for nested pages or categories. The compact menu represents the
same destinations on smaller screens. Read the
[navigation-mode reference](https://github.com/janga/norna/blob/main/docs/configuration.md#navigationmode).

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

**Source:** Site configuration. Ordinary content pages do not load the search
JavaScript; the generated search route loads its static Pagefind index only
when opened. Read the
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
banners:
  - id: preview-environment
    tone: warning
    title: Preview environment
    text: This notice appears on every page.

footer:
  copyrightMessage: Shared Frame example.
  buildInfo: true
```

**Source:** Shared editorial configuration. Page prose stays in each
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

Norna generates semantic HTML, responsive layout, keyboard behavior, focus
handling, and accessible labels for its own controls. Authors remain
responsible for meaningful headings, links, captions, language, and alternative
text. The engine can preserve those decisions across screen sizes; it cannot
make inaccessible editorial content accessible automatically.
