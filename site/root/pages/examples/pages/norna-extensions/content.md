---
page:
  description: Add managed images, cards, sidenotes, tabs and other Norna content features.
navigation:
  order: 4000
---

# Norna extensions

Use these additions for managed media and structured content. Each example
links to its reference for the complete options and constraints.

## Single images and image stacks {#image-stacks}

### A single image

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

Use an image block for visible captions or several images in a stack.
[Ordinary Markdown images](/examples/standard-markdown/#images-and-tables)
receive the same file validation, responsive variants and page-move support
when they refer to files in the page's `images/` directory.

Open the image above to inspect it more closely. Narrow the browser window to
see how the image and caption fit the available space.

Norna supplies semantic image markup and responsive presentation. The author
still owns the image's meaning. An AI tool may draft alternative text, but the
author must review it in the context where the image appears and decide whether
the image needs descriptive or empty alternative text. Read the
[managed-image reference](/reference/site/images/#source-files)
and [W3C image decision guidance](https://www.w3.org/WAI/tutorials/images/).

### Several images

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

## Image carousels {#image-carousels}

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

## Card lists {#card-lists}

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

## Sidenotes {#sidenotes}

A short qualification can remain next to the sentence that needs it when the
layout has a free margin.[^margin:available-space]

[^margin:available-space]:
    This linked note returns to the normal reading flow when the available
    margin cannot hold it safely.

Narrow the browser window to see the note return to the reading flow beside
its reference. Widen it again to make room in the margin.

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

## Tabs {#tabs}

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

## Details {#details}

Use Details for optional explanations that readers can open when they need
them. Keep essential instructions visible.

<details>
<summary>Why arrange a visit first?</summary>

A visit lets you meet the dog and discuss its routines with our volunteers.

</details>

```md title="content.md: optional explanation"
<details>
<summary>Why arrange a visit first?</summary>

A visit lets you meet the dog and discuss its routines with our volunteers.

</details>
```

**Source:** Use `<details>` for the block and `<summary>` for its visible label.
Write the body in Markdown, with a blank line before and after it. Keep
headings and sidenotes outside the block. Read the
[Details reference](/reference/content/details/) for the complete rules.

## Code titles and highlighted lines {#code-blocks}

```yaml title="site/site-config/settings.yaml" {3}
sourceFormat: 2
url: https://example.com/
search: true
language: en
```

````md
```yaml title="site/site-config/settings.yaml" {3}
sourceFormat: 2
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

## Table row headings {#table-row-headings}

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

## Explicit heading IDs {#explicit-heading-ids}

[Open the child-page-list example](#page-list).

```md
[Open the child-page-list example](#page-list).

## Child-page lists {#page-list}
```

**Source:** Markdown links with Norna's explicit heading-ID syntax. The next
H2 uses the shown ID. Keeping it when the heading text changes preserves links
to that section. Explicit IDs are available on H2 and H3. See
[heading anchors](/reference/site/urls/#heading-anchors).

## Child-page lists {#page-list}

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

````md title="root/pages/help-a-dog/content.md"
---
navigation:
  order: 1000
---

# Help a dog

## Find the right commitment

A permanent home is only one way to help. Consider how much time, space, and
ongoing responsibility you can offer. If you cannot take a dog home, you can
still support its care.

```page-list
```
````

```text
help-a-dog/
|-- content.md
`-- pages/
    |-- adoption/content.md
    |-- fostering/content.md
    `-- sponsorship/content.md
```

Each child's opening supplies its title and description:

```md title="root/pages/help-a-dog/pages/adoption/content.md (opening)"
---
page:
  description: Give a dog a permanent home. Learn about matching, visits and the adoption process.
navigation:
  order: 1000
---

# Adoption
```

```md title="root/pages/help-a-dog/pages/fostering/content.md (opening)"
---
page:
  description: Offer a temporary home while a dog waits for adoption. We explain the support and equipment provided.
navigation:
  order: 2000
---

# Fostering
```

```md title="root/pages/help-a-dog/pages/sponsorship/content.md (opening)"
---
page:
  description: Help cover food and veterinary care when you cannot take a dog home.
navigation:
  order: 3000
---

# Sponsorship
```

Adding, moving, or removing a child updates the list; descriptions stay with
their pages. Norna warns if an included page has no description.

**Source:** Norna Markdown extension with no options. Use a list when its
context helps readers choose. If a parent needs only a list of children, use `page.listChildren: true`
in its page metadata. Read the
[child-page-list reference](/reference/content/child-lists/).
