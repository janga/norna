# Routes

`site/content.md` is the homepage and builds to `/`. Optional route pages live
under `site/routes/<NNN-route-id>/route-content.md` and build to first-level
URLs.

Routes use the same page frontmatter, optional section metadata, Norna image
blocks, and Markdown section model as the homepage. See [Content](content.md)
for the page and section model.

## Route Directory Format

Route directories must use:

```text
NNN-route-id
```

`NNN` is a three-digit presentation order from `001` through `999`.
`route-id` becomes the route identity and URL segment.

Valid examples:

```text
010-getting-started
020-concepts
120-api-reference
```

Invalid examples:

```text
10-about
000-home
010_About
010-About
010-about-
010-about--team
```

The route id may contain only lowercase `a-z`, numbers, and single hyphens
between alphanumeric groups. The numeric prefix is not part of the route id or
URL.

Renaming `030-contact/` to `015-contact/` changes navigation order but keeps
the route id `contact` and URL `/contact/`.

## Route File

Add a first-level route by creating:

```text
site/routes/010-about/route-content.md
```

Minimal route page:

```md
---
title: About
description: About this site.
navigation:
  label: About
---

## Intro {#intro}

Text...
```

The example above builds to `/about/`.

## Navigation

`navigation` may contain:

- `include`: optional boolean. Defaults to `true`.
- `label`: optional string. Defaults to `title`.

Route order comes from the directory prefix. The homepage is always first.

Current route navigation is intended for small sites. This guidance may change
as route support matures, but the present model is:

- A single-page site should normally use only page navigation between sections.
- A small multi-page site may use site navigation between routes plus page
  navigation between sections on the current page.
- If a site needs many routes, deeply nested routes, or several navigation
  levels, it has probably outgrown the current sticky-navigation model and may
  need a different site structure or navigation system.

## Route Images

Route images live under the physical route directory:

```text
site/routes/010-about/images/intro/image.jpg
```

Image references in route content still use only the filename:

````md
```norna-image-stack
- image: image.jpg
  alt: Intro image.
```
````

The image directory segment after `images/` should match the section id.
