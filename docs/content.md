# Content

`site/content.md` is the homepage page file for a `norna` site. It defines the
page metadata, section order, section ids, image rows, and Markdown text for
the homepage.

Route pages use the same page and section model in
`site/routes/<route-folder>/route-content.md`. See [Routes](routes.md) for the
route-specific rules.

Site-wide visual defaults belong in [Theme](theme.md). Typography presets and
overrides are described in [Typography](typography.md). Technical site settings
belong in [Configuration](configuration.md).

## Page Frontmatter

The Astro content schema validates these top-level fields in page files:

- `title`: required string. Rendered as the document title.
- `description`: required string. Rendered as the meta description.
- `slug`: optional route URL slug. It is ignored on the homepage. If omitted on
  a route page, the route folder name is used.
- `navigation`: optional page navigation metadata. See [Routes](routes.md).
- `presentation`: optional page-level presentation overrides. See
  [Theme](theme.md) and [Typography](typography.md).
- `frame`: optional page-level frame color source. See [Theme](theme.md).
- `sections`: required non-empty array. Defines section order, ids,
  presentation overrides, and image rows.

Minimal homepage:

```md
---
title: My Site
description: A small Norna site.
sections:
  - id: intro
---

## Intro {#intro}

Text...
```

## Sections

Each `sections[]` item has:

- `id`: required string matching `^[a-z0-9-]+$`. Used for anchors, navigation,
  image directories, and Markdown heading ids.
- `visible`: optional date window that controls whether the section is rendered.
- `presentation`: optional section-level visual overrides.
- `gallery`: optional array, defaulting to `[]`.

Example:

```yaml
sections:
  - id: work
    gallery:
      - image: work.jpg
        alt: "A woven artwork on a white wall."
        caption: "Work in progress."
```

Every frontmatter section must have a matching level 2 Markdown heading with an
explicit id:

```md
## Work {#work}

Introductory text.
```

Keep these values aligned:

- the frontmatter `sections[].id`
- the Markdown heading id
- the source image directory `site/images/<section-id>/`

The visible section navigation label comes from the Markdown heading text, not
from the frontmatter id.

## Image Rows

Each image row can contain a single image:

```yaml
gallery:
  - image: work.jpg
    alt: "A woven artwork on a white wall."
    caption: "Work in progress."
```

Image rows support:

- `image`: required filename matching `^[a-z0-9][a-z0-9.-]*\.(jpe?g|png)$`.
  It must be a filename, not a path.
- `alt`: required string.
- `caption`: optional string.

Source image filenames must be unique across the selected page's image tree.
The homepage reads images from `site/images/<section-id>/`. Route pages read
images from `site/routes/<route-folder>/images/<section-id>/`.

## Carousels

An image row can contain a carousel instead of a single image:

```yaml
gallery:
  - carousel:
      - image: first.jpg
        alt: "First image."
        caption: "First caption."
      - image: second.jpg
        alt: "Second image."
        caption: "Second caption."
```

Each carousel item has the same `image`, `alt`, and `caption` fields as a
single image row.

`content:check` warns when carousel images have different aspect ratios. Exact
matching proportions are recommended because mixed proportions can make the
layout move while the user changes slides.

## Temporary Sections

Use `sections[].visible` for sections that should be rendered only during a
date window:

```yaml
sections:
  - id: exhibition
    visible:
      from: "2026-08-01"
      until: "2026-09-16"
    gallery: []
```

`from` is inclusive. `until` is exclusive. With the example above, the section
is visible from 2026-08-01 through 2026-09-15 and hidden again on 2026-09-16.

Both `from` and `until` use `YYYY-MM-DD`. Either value may be omitted, but a
`visible` object must contain at least one of them.

Hidden sections are omitted from the rendered HTML and sticky navigation. They
remain in the page file, and `content:check` still validates their matching
Markdown headings and image references.

The current date is evaluated at dev/build time. Set `NORNA_TODAY` to preview
or test a specific date:

```sh
NORNA_TODAY=2026-08-15 npm run norna:build
```

## Markdown Text

Section Markdown starts at the matching level 2 heading and continues until the
next level 2 heading.

```md
## Intro {#intro}

Paragraph text.

Another paragraph.
```

Inline styles use this Markdown form:

```md
This sentence contains [highlighted text]{.highlight}.
```

Inline style definitions live in `site/theme.md`. See
[Theme](theme.md#inline-styles).

## Validation And Sync

Run:

```sh
npm run norna:content:check
```

This checks section order and heading ids, duplicate image names, missing image
files, misplaced referenced images, duplicate image references, invalid image
references, unreferenced images, undefined inline styles, and common
frontmatter indentation and structure mistakes.

Frontmatter uses YAML indentation. Use ordinary spaces, not tabs or
non-breaking spaces. `content:check` reports a focused error when indentation is
invalid, when a key is indented under a line that already has a value, or when a
known nested key such as `gallery` or section-specific `typography` appears at
the top level:

```yaml
presentation:
  typography:
    preset: quiet-gallery
    overrides:
      body:
        paragraphSpacing: 0.8em
```

Top-level page frontmatter may contain only `title`, `description`, `slug`,
`navigation`, `presentation`, `frame`, and `sections`. A `gallery` key belongs
under one `sections[]` item:

```yaml
sections:
  - id: work
    gallery: []
```

Run:

```sh
npm run norna:sync
```

This rewrites Markdown sections into frontmatter order and moves referenced
image files into the directory matching their section. It prompts before
writing unless `--yes` is passed.
