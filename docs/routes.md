# Routes

`site/content.md` is the homepage and builds to `/`. Optional route pages live
under `site/routes/<route-folder>/route-content.md` and build to first-level
URLs.

Routes use the same page frontmatter, section frontmatter, gallery rows, and
Markdown section model as the homepage. See [Content](content.md) for the page
and section model.

## Route File

Add a first-level route by creating:

```text
site/routes/about/route-content.md
```

Minimal route page:

```md
---
title: About
description: About this gallery.
navigation:
  label: About
  order: 20
sections:
  - id: intro
---

## Intro {#intro}

Text...
```

The example above builds to `/about/`.

## Slug

If `slug` is omitted, the route folder name is used. If `slug` is set, it must
use lowercase letters, numbers, and hyphens.

```yaml
slug: about-the-work
```

Keep the route folder and `slug` aligned unless you intentionally need a
different URL.

The homepage ignores `slug`.

## Navigation

`navigation` may contain:

- `include`: optional boolean. Defaults to `true`.
- `label`: optional string. Defaults to `title`.
- `order`: optional integer. Defaults to `0` for the homepage and `100` for
  route pages.

Current route navigation is intended for small sites. This guidance may change
as route support matures, but the present model is:

- A single-page site should normally use only page navigation between sections.
- A small multi-page site may use site navigation between routes plus page
  navigation between sections on the current page.
- If a site needs many routes, deeply nested routes, or several navigation
  levels, it has probably outgrown the current sticky-navigation model and may
  need a different site structure or navigation system.

## Route Images

Route images live under the route:

```text
site/routes/about/images/intro/image.jpg
```

Image references in route frontmatter still use only the filename:

```yaml
sections:
  - id: intro
    gallery:
      - image: image.jpg
        alt: "Intro image."
```

The image directory segment after `images/` should match the section id.
