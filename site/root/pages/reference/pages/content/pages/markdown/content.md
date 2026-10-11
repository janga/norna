---
page:
  description: Write page headings and ordinary Markdown, and distinguish standard syntax from Norna extensions.
navigation:
  order: 1000
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

CommonMark's underlined heading form also works: `=` underlines an H1 and `-`
underlines an H2. Use hash signs when you want the level to be obvious in the
source. H3 and deeper headings use hash signs.

Heading text can begin with a number, for example `# 1. Introduction` or
`## 2. Installation`. The number is part of the title. Bold text, code and
Markdown links also work inside headings.

Text between H1 and the first H2 is the introduction. Each H2 (`##`) starts
a section extending to the next H2. H3 and deeper headings subdivide that
section. Navigation uses H2 links; H3 retains its anchor without adding
another outline level. Headings inside literal code examples do not become
navigation entries. A heading inside a quotation or list renders within that
container but is not part of the page navigation; put page-structure headings
at the document's top level.

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

GitHub Flavored Markdown (GFM) adds tables, strikethrough, task lists and
automatic links for plain web and email addresses to common Markdown. Task
lists are published checklists, not stored interactive
tasks. Footnotes and GitHub-style alerts are further extensions, not all part
of the GFM specification. Norna adds managed image/card blocks, tabs, named
sidenotes and selected presentation metadata.

Use the [GFM specification](https://github.github.com/gfm/) for general syntax;
this reference defines Norna's additional contracts. Norna does not support
arbitrary inline color or style classes.

## HTML in Markdown {#html-in-markdown}

CommonMark permits author-written HTML in `content.md`, and Norna does not ban
it. Norna documents specific uses such as native
[`<details>` disclosures](/reference/content/details/). For images, notices,
tables and other supported content, use the documented Markdown or Norna
construct when you want its managed files, responsive layout or site styling.
HTML markup does not automatically receive those features. Check custom HTML
in the built page, including on narrow screens and without JavaScript; Norna
does not define a support contract for arbitrary elements, classes or scripts.
A build can publish scripts written in `content.md`, so review contributed
HTML before publishing it.

## Local file links

Use an ordinary Markdown link to a file in the page's `downloads/` directory:

```md
[Open the checklist](downloads/checklist.pdf "Before publishing")
```

Inline and reference-style links receive the same file management. Norna
also accepts `./downloads/checklist.pdf` and the `checklist.pdf` shorthand.
The browser decides whether the file opens or downloads; the link's text and
optional title do not force downloading. See the
[working example](/examples/standard-markdown/#local-files) and
[attachment reference](/reference/site/attachments/) for ownership and sharing.

## Markdown images

```md title="content.md: an image owned by this page"
![A dog resting on a blanket](images/dog.jpg "Optional extra information")
```

Store the source directly in the page's `images/` directory. Norna validates
and processes it through the same [managed-image pipeline](/reference/site/images/)
as an image block. Prefer the explicit relative path: VS Code's built-in
Markdown preview can resolve it without Norna-specific support.
`./images/dog.jpg` and the shorthand `dog.jpg` are also accepted and identify
the same page-owned file.

Inline and reference-style image syntax both work. Definitions apply throughout
the page, including across sections:

```md title="content.md: a reference-style image"
![A dog resting on a blanket][resting-dog]

[resting-dog]: images/dog.jpg "Optional extra information"
```

Collapsed (`![resting-dog][]`) and shortcut (`![resting-dog]`) references are
also supported when the matching definition exists.

A single image in its own paragraph follows the theme's image placement and
size limits. It keeps its proportions, without cropping or enlargement above
its natural size. An unlinked standalone image offers closer inspection;
inside a list or quotation it stays within that container. Images mixed with
text remain inline, and several images in one paragraph retain that structure.
An authored image link keeps its destination:

```md
[![A dog resting on a blanket](images/dog.jpg)](/contact/)
```

The bracketed text becomes the image's **alt text**, its text alternative.
It belongs to each occurrence, so the same image can have different alternatives
in different contexts. An empty alternative is allowed for decorative images.
The optional **title** is additional information preserved in the image's
`title` attribute. Neither field becomes a visible caption. Use an
[image stack](/reference/content/images/#image-stack) for a visible caption.

External URLs and published paths to named site images keep their ordinary
behavior and stay outside managed processing:

```md title="content.md: external and public images"
![External diagram](https://example.com/diagram.png)
![Site icon](/_norna/shared/favicon.svg)
```

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
