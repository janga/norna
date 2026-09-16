---
page:
  description: Write page headings and ordinary Markdown, and distinguish standard syntax from Norna extensions.
---

# Markdown and headings

Write a page in its `content.md`. Ordinary Markdown supplies paragraphs,
emphasis, links, lists, quotations and fenced code. Norna uses the headings
to structure the page and its navigation.

## Page title and sections

```md title="content.md: the page structure"
# Installation

Install the tools before starting a project.

## Requirements

Check the supported Node.js version.

### Verify Node.js

Run `node --version`.
```

Every page has exactly one H1 (`#`), which must be the first heading. It
supplies the visible title, document title and page navigation label. Do not
give it an explicit ID; its anchor is always `page-title`.

Text between H1 and the first H2 is the introduction. Each H2 (`##`) starts
a section extending to the next H2. H3 and deeper headings subdivide that
section. H2/H3 participate in tree outlines; top navigation uses H2. Headings
inside literal code examples do not become navigation entries.

H2/H3 IDs are derived by lowercasing, removing accents, transliterating common
letters, removing apostrophes and replacing other character runs with hyphens.
For example, `Crème brûlée & tools` becomes `creme-brulee-tools`.

Use an explicit ID if the title produces no ASCII ID or the anchor must remain
stable after editing: `## Before you install {#requirements}`. IDs use lowercase
letters or digits separated by single hyphens. H2/H3 IDs must be unique;
`page-title` is reserved. [URLs and links](/reference/site/urls/#heading-anchors)
explains how to link to them.

## Standard syntax and extensions

```md title="content.md: ordinary inline formatting"
Use **bold** for emphasis, *italics* for a distinction and `code` for literals.
```

Use **bold** for emphasis, *italics* for a distinction and `code` for literals.

GitHub Flavored Markdown (GFM) adds tables, strikethrough and task lists to
common Markdown. Task lists are published checklists, not stored interactive
tasks. Footnotes and GitHub-style alerts are further extensions, not all part
of the GFM specification. Norna adds managed image/card blocks, tabs, named
sidenotes and selected presentation metadata.

Use the [GFM specification](https://github.github.com/gfm/) for general syntax;
this reference defines Norna's additional contracts. Norna does not support
arbitrary inline color or style classes.

## Markdown images

```md title="content.md: images outside the managed pipeline"
![External diagram](https://example.com/diagram.png)
![Public icon](/favicon.svg)
```

These images stay outside [managed image processing](/reference/site/images/).
A relative local Markdown image pointing to `portrait.jpg` produces
a warning; use an [image block](/reference/content/images/) for page-local
images that Norna should validate, resize and move.

## Metadata and embedded examples

Optional [page metadata](/reference/site/metadata/) appears before H1 between
`---` delimiters. It configures descriptions, aliases and navigation visibility,
not visual presentation.

To show a fenced Norna block as source, wrap it in a longer Markdown fence:

`````md title="A literal example, not a rendered image block"
````md
```image-stack
items:
  - image: diagram.svg
```
````
`````

Keep navigation headings outside tabs and collapsible details. Literal
heading examples inside code remain allowed. Run `content:check` to catch
heading collisions and invalid Norna constructions.
