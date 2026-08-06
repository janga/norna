---
title: Concepts
description: "The core Norna model: config, theme, content, routes, images, and generated output."
navigation:
  label: Concepts
  order: 20
sections:
  - id: files
    presentation:
      typography:
        preset: statement
  - id: presentation
  - id: routes-sections
---

## Files are the interface {#files}

Norna sites are edited through ordinary files. There is no database and no
admin UI.

![Diagram showing config, theme, content, routes, images, and public files as the source of a Norna site.](/site-files.svg)

The important split is:

- technical settings in `config.mjs`;
- site-wide presentation defaults in `theme.md`;
- page content and section-specific overrides in `content.md` and
  `route-content.md`;
- source media in `images/`;
- static files in `public/`.

## Presentation is layered {#presentation}

Norna resolves presentation in layers:

![Diagram showing engine defaults, theme, page frontmatter, and section overrides.](/presentation-layers.svg)

The normal path is:

```text
engine defaults
-> site/theme.md
-> page frontmatter
-> section overrides
```

Use `theme.md` for site-wide choices. Use page or section frontmatter only for
focused differences.

## Routes and sections are different {#routes-sections}

Routes are pages. Sections are anchors inside a page.

![Diagram showing home and route pages, each with their own section anchors.](/routes-and-sections.svg)

Use a route when content deserves a separate URL. Use sections when content
belongs on the same page and should be reachable through in-page navigation.

Reference:
[theme](https://github.com/janga/norna/blob/main/docs/theme.md),
[typography](https://github.com/janga/norna/blob/main/docs/typography.md),
and [routes](https://github.com/janga/norna/blob/main/docs/routes.md).
