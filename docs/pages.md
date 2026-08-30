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

Home is always listed. With `navigation.mode: automatic`, Norna chooses from
the listed page and heading hierarchy:

| Site structure | Selected mode |
| --- | --- |
| Home is the only listed page | `sections` |
| Several listed pages, with no combined page/H2/H3 path deeper than two levels | `top` |
| Several listed pages, with a nested page that has headings or a top-level page that has H3 headings | `tree` |

The depth includes both page directories and navigable headings. A top-level
page is level one, its H2 headings are level two, and its H3 headings are level
three. A child page is level two, so adding H2 headings to that page also
requires tree navigation. Unlisted pages do not influence automatic selection.

The modes present the same source hierarchy differently:

- `sections` keeps the one page's H1 destination and H2 sections in sticky
  page navigation.
- `top` keeps Home and top-level pages in the global row. Child pages use page
  submenus, and the current page's H2 sections use local navigation when there
  is more than one.
- `tree` keeps top-level areas in the global row and shows the active area's
  page hierarchy plus current-page H2 and H3 headings in a desktop sidebar.

Navigation also sets the boundary for section backgrounds. `sections` and
`top` navigation may use full-viewport `alternating` or `accented` H2 section
bands. `tree` navigation always uses one `uniform` reading surface beside its
persistent navigation region. See
[Section Backgrounds](theme.md#section-backgrounds).

On a small screen, page and heading destinations are collected in one
expandable menu. Expanding a branch reveals its children without navigating;
following its page link is a separate action. Real page and anchor links remain
usable without JavaScript. See [Client-Side JavaScript](client-javascript.md)
for the enhancement boundary.

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
root. Sync shows its complete plan before writing and never guesses when a
filename has multiple possible sources. If a filesystem error interrupts
several moves, run sync again after fixing the reported problem; completed
moves are retained.

## Page Themes

The root `site/theme.yaml` owns the site's visual identity: preset, palette,
corners, typography, page frame, and navigation presentation.

An optional page-local `theme.yaml` may adjust only:

- `layout.textWidth`
- `layout.contentSpacing`
- managed-image sizing under `images`
- `sections.backgroundPattern` when navigation does not resolve to `tree`

These values are inherited by descendant pages and merged with more local page
settings. Page themes cannot select presets or change site colors, fonts,
corners, page width, gutters, or navigation. Tree navigation requires a uniform
section background, so an explicit `alternating` or `accented` override is
invalid. See [Theme](theme.md#page-themes).

Page directories also cannot contain `config.yaml` or
`sitewide-content.yaml`; technical configuration and shared editorial content
remain at the selected site's top level.
