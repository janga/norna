---
page:
  description:
    See rendered Norna results beside the exact Markdown, configuration, files,
    and commands that produce them.
---

# Examples

Start with everyday Markdown, then add the features your content needs.
Each example pairs its result with the source that produces it. Images and
files need one further choice: whether they belong to a page, are shared by
the site, or live elsewhere.

## Everyday Markdown {#standard-markdown}

Use ordinary Markdown for the main text of a page. These examples need no
Norna-specific syntax.

### Headings and paragraphs {#headings-and-paragraphs}

#### Arrange a visit

We welcome visitors by appointment.

Tell us when you would like to come.

````md
#### Arrange a visit

We welcome visitors by appointment.

Tell us when you would like to come.
````

**Source:** Standard Markdown. A page starts with one H1 (`#`); H2 (`##`)
introduces its main sections and H3 (`###`) subdivides them. The heading above
uses H4 because it is an example inside this subsection. H4 is not recommended
for ordinary pages: keep the hierarchy shallow and aim for H1–H3. If a topic
needs more levels, simplify its structure or give it a separate page. Read the
[heading reference](/reference/content/markdown/#page-title-and-sections).

### Emphasis, lists and quotations {#emphasis-lists-and-quotations}

Tell us **who lives at home** and _when you can visit_.

1. Read about the dogs.
2. Send us your questions.

> Visits are by appointment.

````md
Tell us **who lives at home** and _when you can visit_.

1. Read about the dogs.
2. Send us your questions.

> Visits are by appointment.
````

**Source:** Standard Markdown. Use emphasis, lists and quotations to make the
relationships in your text clear.

### Links {#links}

Read [Getting started](/getting-started/) or jump to the
[complete sites](#complete-sites).

````md
Read [Getting started](/getting-started/) or jump to the
[complete sites](#complete-sites).
````

**Source:** Standard Markdown. Use meaningful link text. Norna resolves local
page URLs for the site's deployment path; do not add `/norna/` to source links.
See [URLs and links](/reference/site/urls/).

### Code blocks {#plain-code-blocks}

```sh
npm run norna:dev
```

````md
```sh
npm run norna:dev
```
````

**Source:** Standard fenced Markdown. The language name enables syntax
highlighting. Norna supplies the presentation and a copy control when
JavaScript is available. [Titles and highlighted lines](#code-blocks) use
additional Norna syntax.

## External images and files {#unmanaged-files}

Ordinary Markdown can refer to images and files hosted elsewhere or kept in
`site/public/`. These have useful roles, but they do not receive the same
processing and page ownership as files in a page's `images/` or `downloads/`.

### External images and files

```md
![A diagram hosted elsewhere](https://example.com/diagram.png)
[Download an external report](https://example.com/report.pdf)
```

These are illustrative URLs. The external host controls whether the files
remain available. Norna does not import or resize the image, move these files
with a page, or check the external site's availability.

### Shared files in public/

[Open this site's robots.txt](/robots.txt).

```md
[Open this site's robots.txt](/robots.txt).
```

The file lives in `site/public/robots.txt`. Public files keep a site-wide
address and suit logos, icons, crawler instructions and other shared files.
Ordinary Markdown images can also refer to public image files; those images
stay outside managed image processing. See [public files](/reference/site/public-files/).

### Why page-owned images and attachments are preferred

For an image that belongs to an article, put its source in the page's
`images/` directory and use a [Norna image block](#image-stacks). Norna can
validate it, generate responsive output and move it with the page.

For a downloadable file that belongs to a page, use its `downloads/` directory
and an [ordinary attachment link](#page-attachments). Norna publishes the file
unchanged and keeps it with its page. This relative Markdown image bypasses
the managed image pipeline and produces a warning:

```md
![Portrait](portrait.jpg)
```

Use an image block for this local image instead.

## Common Markdown extensions {#common-markdown-extensions}

These conventions are supported by other Markdown tools as well as Norna.
Tables, task lists and strikethrough belong to GitHub Flavored Markdown (GFM).
Footnotes and GitHub-style alerts are additional conventions, so support can
vary between tools.

### Tables {#tables}

| Capability | Source | Wide screen | Small screen | With JS | Without JS |
| --- | --- | --- | --- | --- | --- |
| Links | Markdown | Inline | Wrap | No change | Links |
| Images | `image-stack` | Preset width | Fit | Inspector | Image link |
| Carousels | `image-carousel` | Fit | Swipe | Slides | Static images |
| Cards | `card-list` | Grid | Reflow | No change | Full list |
| Callouts | Alert quote | In prose | Reflow | No change | Labels |
| Tabs | Tab fences | Alternatives | Wrap labels | Select | All options |
| Sidenotes | Named note | Free margin | Inline | No change | Linked notes |
| Code | Code fence | Expand | Scroll | Copy | Select text |
| Tables | Markdown | Expand | Scroll | Column controls | Scroll |
| Search | `site-config/settings.yaml` | Search page | Same page | Pagefind | Navigation |
| Appearance | `root/tree-theme.yaml` | Light or Dark | Same choice | Reader choice | Default |

```md title="Table source (Markdown)"
| Capability | Source | Wide screen | Small screen | With JS | Without JS |
| --- | --- | --- | --- | --- | --- |
| Links | Markdown | Inline | Wrap | No change | Links |
| Images | `image-stack` | Preset width | Fit | Inspector | Image link |
| Carousels | `image-carousel` | Fit | Swipe | Slides | Static images |
| Cards | `card-list` | Grid | Reflow | No change | Full list |
| Callouts | Alert quote | In prose | Reflow | No change | Labels |
| Tabs | Tab fences | Alternatives | Wrap labels | Select | All options |
| Sidenotes | Named note | Free margin | Inline | No change | Linked notes |
| Code | Code fence | Expand | Scroll | Copy | Select text |
| Tables | Markdown | Expand | Scroll | Column controls | Scroll |
| Search | `site-config/settings.yaml` | Search page | Same page | Pagefind | Navigation |
| Appearance | `root/tree-theme.yaml` | Light or Dark | Same choice | Reader choice | Default |
```

**Source:** GitHub Flavored Markdown table syntax. Norna supplies the width,
scrolling and sorting behavior described below. [Table row headings](#table-row-headings)
use an additional Norna marker.

Click a column heading to sort ascending, click again for descending, and a
third time to restore the order above. Hover over a heading, or focus it with
the keyboard, to see what the next activation does. Text comparison follows
the site's language; numeric and ISO-date columns sort by value.

The table uses available space before scrolling horizontally. Its column
headings stay visible while you scroll its rows. When columns extend beyond
the visible area, matching scrollbars below the headings and at the table's
bottom show the same horizontal position. Drag either handle or click its
track to reach more columns. Without JavaScript, the rows keep their original
order and the browser provides horizontal scrolling.

The code block above contains every cell of this table, unchanged. Read the
[table reference](/reference/content/tables/).

### Task lists and strikethrough {#task-lists-and-strikethrough}

- [x] Read about the dogs.
- [ ] Arrange a visit.

~~Drop in at any time.~~ Book a visit first.

````md
- [x] Read about the dogs.
- [ ] Arrange a visit.

~~Drop in at any time.~~ Book a visit first.
````

**Source:** GFM task lists and strikethrough. Checkmarks are published content;
they do not store readers' progress. Edit the Markdown to change them.

### Footnotes {#footnotes}

Keep supporting details in a numbered note.[^visit]

[^visit]: Tell us about accessibility needs when booking your visit.

````md
Keep supporting details in a numbered note.[^visit]

[^visit]: Tell us about accessibility needs when booking your visit.
````

**Source:** Reference-footnote syntax. The note appears at the end of the page,
with a link back to its reference. A definition can be reused. See
[footnotes](/reference/content/footnotes/).

### GitHub-style alerts {#semantic-callouts}

> [!NOTE]
>
> Norna builds a static site from your source files.

> [!TIP]
>
> Preview the site before publishing it.

> [!IMPORTANT]
>
> Keep a copy of the source files so you can rebuild the site.

> [!WARNING]
>
> Commit source files before a structural change that you may want to undo.

> [!CAUTION]
>
> Check the destination before replacing an existing file.

> [!DANGER]
>
> Never publish passwords or private API keys. Visitors can read published files.

```md
> [!NOTE]
>
> Norna builds a static site from your source files.

> [!TIP]
>
> Preview the site before publishing it.

> [!IMPORTANT]
>
> Keep a copy of the source files so you can rebuild the site.

> [!WARNING]
>
> Commit source files before a structural change that you may want to undo.

> [!CAUTION]
>
> Check the destination before replacing an existing file.

> [!DANGER]
>
> Never publish passwords or private API keys. Visitors can read published files.
```

**Source:** GitHub-style alerts, supported by Norna as semantic callouts. Alerts
are not part of the formal GFM specification. Norna supports `NOTE`, `TIP`,
`IMPORTANT`, `WARNING`, `CAUTION`, and `DANGER`; the meaning is expressed by
structure and a localized label rather than color alone. Other tools may call
similar blocks custom containers or admonitions. Norna's set of styled semantic
meanings is closed: an unknown uppercase type remains readable as a neutral
blockquote and produces a warning. `DANGER` is an additional Norna type. Read
the
[semantic-callout reference](/reference/content/callouts/).

## Norna extensions {#norna-extensions}

Use these additions for managed media and structured content. Each example
links to its reference for the complete options and constraints.

### Single images and image stacks {#image-stacks}

#### A single image

```image-stack
items:
  - image: stack-one.svg
    alt: A pale panel with one large circle and two horizontal lines.
    caption: One image with an attached caption.
```

````md
```image-stack
items:
  - image: stack-one.svg
    alt: A pale panel with one large circle and two horizontal lines.
    caption: One image with an attached caption.
```
````

**Source:** Norna fenced block containing YAML. Entries go under `items`.
`image` names a file in the current page's
`images/` directory, `alt` describes its purpose for readers who cannot see it,
and `caption` adds visible context. All three supported fields are shown above;
only `image` is required.

Use a Norna image block rather than ordinary Markdown image syntax for local
editorial images. Norna can then validate the file, generate responsive output,
and keep it with the page when `page:move` moves that page. Ordinary Markdown
images remain suitable for external URLs and static files in `site/public/`.

Norna supplies semantic image markup and responsive presentation. The author
still owns the image's meaning. An AI tool may draft alternative text, but the
author must review it in the context where the image appears and decide whether
the image needs descriptive or empty alternative text. Read the
[managed-image reference](/reference/site/images/#source-files)
and [W3C image decision guidance](https://www.w3.org/WAI/tutorials/images/).

#### Several images

```image-stack
items:
  - image: stack-one.svg
    alt: A pale panel with one large circle and two horizontal lines.
    caption: The first image introduces one visual idea.
  - image: stack-two.svg
    alt: A dark panel with three aligned rectangular forms.
    caption: The related image remains visible next in reading order.
```

````md
```image-stack
items:
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
[image-stack reference](/reference/content/images/#image-stack).

### Image carousels {#image-carousels}

```image-carousel
items:
  - image: carousel-one.svg
    alt: A green panel with a broad diagonal line.
    caption: 'First frame: a broad direction.'
  - image: carousel-two.svg
    alt: A blue panel with two overlapping circles.
    caption: 'Second frame: a closer relationship.'
  - image: carousel-three.svg
    alt: A red panel with a compact grid.
    caption: 'Third frame: a denser detail.'
```

````md
```image-carousel
items:
  - image: carousel-one.svg
    alt: A green panel with a broad diagonal line.
    caption: 'First frame: a broad direction.'
  - image: carousel-two.svg
    alt: A blue panel with two overlapping circles.
    caption: 'Second frame: a closer relationship.'
  - image: carousel-three.svg
    alt: A red panel with a compact grid.
    caption: 'Third frame: a denser detail.'
```
````

**Source:** Norna Markdown extension. Use a carousel when related images should
share one visual position. Norna adds fitted controls, keyboard operation, touch
dragging, slide status, and a readable no-JavaScript fallback. See the
[image-carousel reference](/reference/content/images/#image-carousel).

### Card lists {#card-lists}

```card-list
layout: image-top
flow: grid
size: m
items:
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
items:
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
comparable choices, resources, or steps. Each card can include an image and link
to a page or an external resource. Read the
[card-list reference](/reference/content/cards/).

[Open the complete media and surfaces site](https://janga.github.io/norna/examples/feature-demos/media-and-surfaces/)
to inspect these blocks together across several pages, or
[browse its maintained source](https://github.com/janga/norna/tree/main/examples/feature-demos/media-and-surfaces).

### Sidenotes {#sidenotes}

A short qualification can remain next to the sentence that needs it when the
layout has a free margin.[^margin:available-space]

[^margin:available-space]:
    This linked note returns to the normal reading flow when the available
    margin cannot hold it safely.

```md
A short qualification can remain next to the sentence that needs it when the
layout has a free margin.[^margin:available-space]

[^margin:available-space]:
    This linked note returns to the normal reading flow when the available
    margin cannot hold it safely.
```

**Source:** Named reference-footnote syntax with Norna's `margin:` convention.
Each sidenote is referenced once in an ordinary body paragraph; its matching
definition belongs at the page's top level. Hover over the letter or reach it
with keyboard focus to highlight the note. Several sidenotes can belong to the
same paragraph; they stack in reference order and may increase the space before
the next paragraph. Use a normal reference footnote
inside a tab or callout, for a reusable note, or when supporting material
belongs at the end of the page. Read the
[side-note reference](/reference/content/sidenotes/)
and
[reference-footnote alternative](/reference/content/footnotes/).

### Tabs {#tabs}

:::: tabs

::: tab "macOS"

> [!TIP]
>
> Use Homebrew if it is already installed on your computer.

```sh title="Install ImageMagick with Homebrew"
brew install imagemagick
```

:::

::: tab "Windows"

Open PowerShell and install ImageMagick with WinGet:

```powershell title="Install ImageMagick with WinGet"
winget install ImageMagick.ImageMagick
```

:::

::::

````md title="content.md: installation alternatives"
:::: tabs

::: tab "macOS"

> [!TIP]
>
> Use Homebrew if it is already installed on your computer.

```sh title="Install ImageMagick with Homebrew"
brew install imagemagick
```

:::

::: tab "Windows"

Open PowerShell and install ImageMagick with WinGet:

```powershell title="Install ImageMagick with WinGet"
winget install ImageMagick.ImageMagick
```

:::

::::
````

**Source:** Norna Markdown extension. Tabs keep short alternatives together;
headings stay outside them so the page outline does not change. Each group
starts with its first option. Without JavaScript, or when printing, every
alternative appears with its label. Read the
[tabs reference](/reference/content/tabs/).

### Code titles and highlighted lines {#code-blocks}

```yaml title="site/site-config/settings.yaml" {2}
url: https://example.com/
search: true
language: en
```

````md
```yaml title="site/site-config/settings.yaml" {2}
url: https://example.com/
search: true
language: en
```
````

**Source:** Standard fenced Markdown with optional Norna metadata. The title
identifies the file, `{2}` emphasizes the relevant line, and the title stays in
view while a long example scrolls. JavaScript adds a copy control without
changing the readable fallback. Read the
[code-block reference](/reference/content/code/).

### Table row headings {#table-row-headings}

| Task {row-header} | Minutes |
| --- | ---: |
| Review text | 12 |
| Check links | 3 |

````md
| Task {row-header} | Minutes |
| --- | ---: |
| Review text | 12 |
| Check links | 3 |
````

**Source:** GFM table syntax with Norna's `{row-header}` marker. The first
column identifies each row and remains visible during horizontal scrolling.
Use unique, nonempty row labels. See [row headings](/reference/content/tables/#row-headings).

### Explicit heading IDs {#explicit-heading-ids}

[Open the complete-site examples](#complete-sites).

```md
[Open the complete-site examples](#complete-sites).

## Complete sites {#complete-sites}
```

**Source:** Markdown links with Norna's explicit heading-ID syntax. The H2
at the end of this page uses the shown ID. Keeping it when the heading text
changes preserves links to that section. Explicit IDs are available on H2
and H3. See [heading anchors](/reference/site/urls/#heading-anchors).

### Child-page lists {#page-list}

<!-- norna-image-provenance:
image: child-page-list.png
source: local-browser-capture
Captured from fixtures/child-page-list/site at /help-a-dog/ using the
registered scratch review environment at 1200 by 800 pixels. Reproduction
commands are in fixtures/child-page-list/README.md.
-->

```image-stack
items:
  - image: child-page-list.png
    alt: Adoption, Fostering, and Sponsorship appear in both navigation and the page list. The list explains permanent care, temporary care, and financial support.
    caption: The descriptions explain the commitment behind each choice.
```

The navigation names the options; the descriptions help a reader decide. The
empty block collects direct child pages in directory order. You write the
guidance in each child's `page.description`, not in the list.

````md title="root/pages/010-help-a-dog/content.md"
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

```md title="root/pages/010-help-a-dog/pages/010-adoption/content.md (opening)"
---
page:
  description: Give a dog a permanent home. Learn about matching, visits and the adoption process.
---

# Adoption
```

```md title="root/pages/010-help-a-dog/pages/020-fostering/content.md (opening)"
---
page:
  description: Offer a temporary home while a dog waits for adoption. We explain the support and equipment provided.
---

# Fostering
```

```md title="root/pages/010-help-a-dog/pages/030-sponsorship/content.md (opening)"
---
page:
  description: Help cover food and veterinary care when you cannot take a dog home.
---

# Sponsorship
```

Adding, moving, or removing a child updates the list; descriptions stay with
their pages. Norna warns if an included page has no description.

**Source:** Norna Markdown extension with no options. Use a list when its
context helps readers choose. If a parent needs only a list of children, use `page.listChildren: true`
in its page metadata. Read the
[child-page-list reference](/reference/content/child-lists/).

## Building a site with Norna {#building-a-site}

These examples combine page files, configuration and commands. They control
how the site is organized, presented and published.

### Page attachments {#page-attachments}

[Download the visit checklist](visit-checklist.txt).

````md
[Download the visit checklist](visit-checklist.txt).
````

**Source:** An ordinary Markdown link to a file in this page's `downloads/`
directory. The file is published unchanged.

```text
030-examples/
|-- content.md
`-- downloads/
    `-- visit-checklist.txt
```

Norna moves the directory with its page and updates known internal links.
Old external attachment URLs are not redirected. See
[page attachments](/reference/site/attachments/).

### Automatic navigation {#automatic-navigation}

#### One page: sections

A single page needs only its title and section links. These screenshots use the
complete Markdown shown below, with the `project` preset.

```image-stack
items:
  - image: navigation-single-desktop.png
    alt: Dog Shelter on a wide screen, with its title and two section links in sticky navigation.
    caption: In a sufficiently large browser.
```

```image-carousel
items:
  - image: navigation-single-mobile.png
    alt: The same page on a small screen, showing What we do and its text below a closed Menu trigger.
    caption: On a small screen, with Menu closed.
  - image: navigation-single-menu.png
    alt: The open compact menu contains Dog Shelter, What we do, and You can help.
    caption: On a small screen, with Menu open.
```

```text
site/root/
`-- content.md
```

<!-- navigation-source: fixtures/navigation-examples/single/site/root/content.md -->

```md title="content.md"
# Dog Shelter

## What we do

We rescue and rehome dogs.

## You can help

Adopt. Foster. Donate.
```

#### Top-level pages: top navigation

Adding Dogs and Adopt gives each page its own URL. Select a page name to open
it, or its chevron to choose a section directly.

```image-carousel
items:
  - image: navigation-top-desktop.png
    alt: Dogs on a wide screen, with Dog Shelter, Dogs, and Adopt in top navigation. Page chevrons open their section menus.
    caption: In a sufficiently large browser.
  - image: navigation-top-sections.png
    alt: The Dogs disclosure shows Meet the dogs and Before you adopt as direct section links.
    caption: Each page's chevron reveals its H2 destinations.
```

```image-carousel
items:
  - image: navigation-top-mobile.png
    alt: Dogs with Menu closed on a small screen.
    caption: The page with Menu closed.
  - image: navigation-top-menu.png
    alt: The compact menu groups the Dogs sections beneath Dogs, alongside the other pages.
    caption: Menu groups sections under their pages.
```

```text
site/root/
|-- content.md
`-- pages/
    |-- 010-dogs/content.md
    `-- 020-adopt/content.md
```

<!-- navigation-source: fixtures/navigation-examples/top/site/root/pages/010-dogs/content.md -->

```md title="root/pages/010-dogs/content.md"
# Dogs

## Meet the dogs

Each dog needs a home that suits its personality and daily routine.

## Before you adopt

Talk to our volunteers about exercise, company, and veterinary care.
```

#### Nested pages: a page tree

As documentation grows, group related guides and reference pages into branches.
Readers can explore one topic at a time.

Put Adult dogs and Senior dogs beneath Dogs to keep related pages together. The
left tree contains the Dogs branch; Adopt remains a global destination.

```image-stack
items:
  - image: navigation-nested-desktop.png
    alt: Adult dogs with Dogs and its child pages in a left tree, plus the current page's sections.
    caption: In a sufficiently large browser.
```

```image-carousel
items:
  - image: navigation-nested-mobile.png
    alt: Adult dogs on a small screen, without persistent navigation rails.
    caption: The same page with Menu closed.
  - image: navigation-nested-menu.png
    alt: The open compact menu preserves Dogs, its child pages, and their sections.
    caption: Menu preserves the hierarchy.
```

```text
site/root/
|-- content.md
`-- pages/
    |-- 010-dogs/
    |   |-- content.md
    |   `-- pages/
    |       |-- 010-adult-dogs/content.md
    |       `-- 020-senior-dogs/content.md
    `-- 020-adopt/content.md
```

<!-- navigation-source: fixtures/navigation-examples/nested/site/root/pages/010-dogs/pages/010-adult-dogs/content.md -->

```md title="root/pages/010-dogs/pages/010-adult-dogs/content.md"
# Adult dogs

## Daily routines

Adult dogs benefit from regular walks, company, and a quiet place to rest.

## A good match

Tell us about your household so we can help you find a suitable companion.
```

The same structure can hold a larger handbook. Here, platform guides belong
under Installation, and publishing guides form a separate branch. Choosing
Installation gives the left tree that branch and its H2 links. This excerpt
uses the `documentation` preset.

```image-stack
items:
  - image: navigation-documentation-desktop.png
    alt: A handbook with Installation and its platform pages in the left tree. Linux is selected, with Requirements and Local preview beneath it.
    caption: Pages and H2 links share one left tree, leaving room beside the article.
```

```text title="Documentation example"
site/root/
|-- content.md
`-- pages/
    |-- 010-guides/
    |   |-- content.md
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

<!-- navigation-source: fixtures/navigation-examples/documentation/site/root/pages/010-guides/pages/010-installation/pages/030-linux/content.md -->

````md title="root/pages/010-guides/pages/010-installation/pages/030-linux/content.md"
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
and
[Grafana](https://grafana.com/docs/grafana/latest/alerting/configure-notifications/)
use branches to organize installation methods and configuration topics.

**Source:** The page directories and Markdown headings determine navigation.
`navigation.mode` defaults to `automatic`. H2 links appear in section and top
navigation, or beneath pages in a local tree. H3 remains in the article with
its anchor. As space runs out, the same navigation moves into Menu. Home
stays an uncluttered entry page.

<!-- Screenshots: scripts/capture-navigation-examples.mjs. All four runnable
sources are in fixtures/navigation-examples; no illustrated UI is hand-drawn. -->

Read the
[navigation reference](/reference/configuration/navigation/)
for mode selection, depth, exceptions, and responsive fallbacks.

### Moving pages and preserving links {#page-move}

The preview reports the directory move, affected internal links, and old URLs
without writing files. The write step moves the complete page subtree and its
images, updates links, and records redirect aliases.

```sh
# Preview the complete operation without changing files
norna page:move /guides/install/ /reference/install/

# Apply the reviewed move
norna page:move /guides/install/ /reference/install/ --write
```

**Source:** Norna command. Conflicts, ambiguous links, invalid destinations, and
failed post-write validation stop the operation rather than leaving a partially
accepted structure. Read the
[page-move reference](/reference/commands/move/).

### Search and language {#search}

Norna allows searching page titles, sections, prose, captions, notes, and
structured content without a hosted search service.

```yaml title="site/site-config/settings.yaml"
search: true
```

**Source:** Site configuration. The search engine and its index load only on the
search page. Use **Back to Examples** above the search heading to return to your
reading position. Read the
[search reference](/reference/configuration/search/).

#### Site language

| Source choice  | Example generated interface labels                  |
| -------------- | --------------------------------------------------- |
| `language: sv` | Sidor, Sidinnehåll, Sök, Visning, Fokuserad läsning |

```yaml title="site/site-config/settings.yaml"
language: sv
```

**Source:** Site configuration. The value identifies the HTML language and
selects one complete built-in interface pack. It does not translate Markdown,
captions, banners, or other editorial content. Most non-English interface packs
were AI-generated and must be reviewed by a fluent speaker before publication.
Read the
[language reference](/reference/configuration/language/).

### Branding, notices and footer {#branding}

<!-- norna-image-provenance:
image: navigation-logo.svg
source: maintained repository asset
Copied from the public files of the site-wide content demonstration.
-->

```image-stack
items:
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
accepted filenames and uniqueness rules; no image path belongs in YAML. Read the
[public-files reference](/reference/site/public-files/).

#### Notices and footer

[Open the complete site-wide elements demonstration](https://janga.github.io/norna/examples/feature-demos/sitewide-content/)
to see the same logo, dismissible notices, and footer across several pages.

```yaml title="site/site-config/shared-content.yaml"
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
[site-wide content reference](/reference/configuration/shared-content/).

### Presets and palettes {#presets}

```card-list
flow: grid
size: s
items:
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

```yaml title="site/root/tree-theme.yaml"
preset: documentation
```

**Source:** Shared theme configuration. A preset supplies coordinated defaults for
a typical scenario: typography, spacing, page width, media placement, colors,
corners, navigation, and structured blocks. It avoids asking the author to
design every relationship independently.

Override only a deliberate exception; all other values still come from the
preset:

```yaml title="site/root/tree-theme.yaml"
preset: documentation
layout:
  textWidth: normal
```

[Open the Theme explorer](https://janga.github.io/norna/examples/theme-presets/)
to switch presets while keeping its comparison content unchanged. Read the
[preset reference](/reference/configuration/presets/).

#### Color palettes

This documentation site uses one palette across navigation, prose, controls,
semantic states, Light appearance, and Dark appearance. A palette changes that
coordinated color system without replacing the preset's typography or spacing.
This example selects the same palette with the `documentation` preset:

```yaml title="site/root/tree-theme.yaml"
preset: documentation
palette: clay-rose
```

**Source:** Shared theme configuration. Use the
[Theme explorer](https://janga.github.io/norna/examples/theme-presets/) to
combine the built-in presets and palettes, then inspect the generated
`root/tree-theme.yaml`. Read the
[palette and Appearance reference](/reference/configuration/palettes/).

### Reader display choices {#reader-display}

Open **Display** in this site's header. Reading width is always available;
Narrow, Standard, and Wide alter the reading measure without changing the
source. Appearance can follow the reader's system or use Light or Dark. Focus
reading removes persistent navigation, breadcrumbs, and the footer while
preserving access to the site through a compact menu.

```yaml title="site/root/tree-theme.yaml"
appearance:
  default: system
```

**Source:** Shared theme configuration plus reader-owned choices. The theme sets
the initial presentation. Appearance and reading width are always available;
tree navigation also provides Focus reading. The reader's selection is stored
only in that browser. Read the
[reader Display reference](/reference/reader/display/)
and
[client-side JavaScript contract](/reference/reader/accessibility/).

### Checks before publishing {#source-checks}

```sh title="Check the site's source files"
# Check configuration, then content
# Source files stay unchanged
norna check
```

In a generated site project, `npm run norna:check` runs the same checks without
the optional global launcher. To check only one part:

```sh title="Run a focused check"
# Check settings and themes
norna config:check

# Check Markdown, links, and images
norna content:check
```

- **Invalid setting:** `search: yes` in `site-config/settings.yaml` supplies text where Norna
  requires a boolean. Use `search: true` or `search: false`.
- **Missing image:** `image: portrait.svg` refers to a file that does not exist.
  Put the image in the page's `images/` directory or correct the filename.
- **Broken link:** `[Adopt](/adotp/)` points to a URL with no page. Correct it
  to `/adopt/` if that is the page's address.
- **Duplicate heading id:** two `## Contact` headings on one page both produce
  `contact`. Give them distinct headings or an explicit id, such as
  `## Contact {#press-contact}`.

Fix the reported source and run the check again. These checks do not visit
external websites or judge whether an image's alternative text is useful; review
those separately.

**Source:** Norna commands. Read the
[command reference](/reference/commands/invocation/#command-map)
for the complete check scope, the
[configuration reference](/reference/configuration/site/)
for accepted settings, the
[image reference](/reference/site/images/#source-files)
for file placement, and the
[content reference](/reference/commands/validate/)
for content errors and image synchronization.

## Complete sites {#complete-sites}

These complete Norna projects show how content, files and configuration work
together. The small shelter sites illustrate sections and top-level pages;
this documentation site demonstrates a deeper hierarchy.

### Single-page site

```image-stack
items:
  - image: single-page-dog-shelter.png
    alt: The complete single-page dog shelter example shown in a desktop browser.
    caption: One page whose H2 sections become its navigation destinations.
```

[Open the single-page site](https://janga.github.io/norna/examples/complete-sites/dog-shelter-single-page/)
or [browse its source](https://github.com/janga/norna/tree/main/examples/complete-sites/dog-shelter-single-page).

### Multi-page site

```image-stack
items:
  - image: multi-page-dog-shelter.png
    alt: The complete multi-page dog shelter example shown in a desktop browser.
    caption: Several top-level pages sharing one responsive top navigation.
```

[Open the multi-page site](https://janga.github.io/norna/examples/complete-sites/dog-shelter-multi-page/)
or [browse its source](https://github.com/janga/norna/tree/main/examples/complete-sites/dog-shelter-multi-page).

### Documentation site

The site you are reading demonstrates nested pages, area menus and section
links in a local tree. [Browse its source](https://github.com/janga/norna/tree/main/site)
and compare it with the [navigation examples](#automatic-navigation).
The [navigation reference](/reference/configuration/navigation/) explains
the rules behind these layouts.

Norna generates semantic HTML, responsive layout, keyboard behavior, focus
handling, and accessible labels for its own controls. Authors remain responsible
for meaningful headings, links, captions, language, and alternative text. The
engine can preserve those decisions across screen sizes; it cannot make
inaccessible editorial content accessible automatically.
