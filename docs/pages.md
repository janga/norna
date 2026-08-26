# Pages

Every Norna page is a directory under `site/pages/` with its own `content.md`.
The same model is used for the homepage, top-level areas, and nested pages.

```text
site/pages/
|-- 000-home/
|   `-- content.md
|-- 010-guides/
|   |-- content.md
|   `-- pages/
|       `-- 010-installation/
|           `-- content.md
`-- 020-reference/
    `-- content.md
```

Pages use the same Markdown H1, optional metadata, sections, Norna blocks, and
managed-image model. See [Content](content.md) for what belongs inside
`content.md`.

## Homepage And Top-Level Pages

The homepage is required at:

```text
site/pages/000-home/content.md
```

It builds to `/`. The `000` prefix is reserved for `000-home`, and Home cannot
contain a nested `pages/` directory. Home is the site's front door, not the
parent of every page.

Other directories directly under `site/pages/` are top-level navigation roots.
For example, `site/pages/010-guides/content.md` builds to `/guides/`. Place
further pages under the nearest meaningful non-home page.

## Nested Pages

A page may contain a `pages/` directory:

```text
site/pages/010-guides/
|-- content.md
`-- pages/
    `-- 020-workflows/
        |-- content.md
        `-- pages/
            `-- 010-local/
                `-- content.md
```

This produces:

```text
/guides/
/guides/workflows/
/guides/workflows/local/
```

Each directory in the chain is a real page and therefore needs its own
`content.md`. Empty grouping directories are not part of the page model.

## Directory Names, Order, And URLs

Page directories use:

```text
NNN-page-id
```

`NNN` is a three-digit sibling presentation order. `page-id` becomes that
page's URL segment. Valid ordinary page names include:

```text
010-getting-started
020-concepts
120-api-reference
```

Invalid names include:

```text
10-about
000-about
010_About
010-About
010-about-
010-about--team
```

The page id may contain only lowercase `a-z`, numbers, and single hyphens
between alphanumeric groups. The numeric prefix is not part of the URL.
Renaming `030-contact/` to `015-contact/` changes its order among siblings but
keeps the URL segment `contact`.

Sibling page ids and numeric orders must be unique. Reusing the same id below a
different parent is valid because the complete URL remains different.

## Page Content

A minimal page is ordinary Markdown:

```md
---
page:
  description: Installation instructions.
---

# Installation

Introductory text.

## Requirements {#requirements}

Text...
```

The H1 supplies the visible page title, document title, and navigation label.
`page.description` is optional metadata and is not rendered. H2 and H3 headings
provide page-local navigation according to the selected navigation model.

## Navigation

Home and listed top-level pages appear in global navigation. Child pages appear
in the local hierarchy for their top-level area. Breadcrumbs show actual parent
pages; Home is not added as an artificial ancestor.

The numeric prefix controls order among siblings. Set `navigation.listed` to
`false` in a non-home page's frontmatter when the page should remain public but
not appear in generated navigation:

```yaml
navigation:
  listed: false
```

Home is always listed. By default, Norna chooses navigation from the site
structure:

- one listed page uses section navigation;
- a shallow hierarchy uses top navigation;
- deeper page or heading hierarchies use tree navigation.

The site-wide `navigation.mode` in `config.yaml` can explicitly select
`automatic`, `sections`, `top`, or `tree`. See
[Configuration](configuration.md#navigation).

## Page Images

Managed images belong directly to the page that references them:

```text
site/pages/010-guides/pages/020-workflows/images/diagram.svg
```

The Markdown block still uses only the filename:

````md
```norna-image-stack
- image: diagram.svg
  alt: The local workflow.
```
````

Run `norna content:check` to find missing or misplaced images and
`norna content:sync` to move unambiguous files into the expected page image
root. Cross-page writes require a clean Git working tree and never guess when a
filename has multiple possible sources.

## Page Themes

The root `site/theme.yaml` owns the site's visual identity: preset, palette,
shape, typography, page frame, and navigation presentation.

An optional page-local `theme.yaml` may adjust only:

- `layout.textWidth`
- `layout.contentSpacing`
- managed-image sizing under `images`
- `sections.backgroundPattern`

These values are inherited by descendant pages and merged with more local page
settings. Page themes cannot select presets or change site colors, fonts,
shape, page width, gutters, or navigation. See [Theme](theme.md#page-themes).

Page directories also cannot contain `config.yaml` or
`sitewide-content.yaml`; technical configuration and shared editorial content
remain at the selected site's top level.
