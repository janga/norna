---
title: Concepts
description:
  Understand Norna's opinionated file model and how it differs from a
  traditional static site generator.
navigation:
  label: Concepts
---

## Norna's site model {#site-model}

## Single-page site {#single-page-site}

A Norna site can start as a single page. The homepage content lives in
`content.md`, visual defaults live in `theme.md`, and local images live in
section folders under `images/`.

The section id in Markdown connects a section to its image folder.

<!-- norna-image-provenance:
image: single-page-site.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to explain
how content.md, theme.md and section image folders map to a simple single-page
website.
-->

```norna-image-stack
- image: single-page-site.svg
  alt: A three-column diagram showing Norna files, Markdown file content and the resulting single-page Dog Shelter website. Section ids connect Markdown sections to image folders.
```

## Multi-page site {#multi-page-site}

A Norna site can grow by adding _routes_ (pages, if you prefer). Each route adds
more content to the site model: it gets its own URL and normally inherits the
site's visual presentation.

Route directories contain route content and may contain route-local
presentation, but they cannot contain technical site configuration. Technical configuration
stays at the top level in `config.mjs`.

Route folder prefixes control route presentation order on the site, while the
route id becomes the URL slug. For example, the route from `010-dogs/` is
shown before the route from `020-adopt/` on the site. It becomes a URL that
ends with `/dogs/`.

<!-- norna-image-provenance:
image: multi-page-site.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to explain
how route folders map to route content, hierarchical navigation, managed images
and URL slugs.
-->

```norna-image-stack
- image: multi-page-site.svg
  alt: A three-column diagram showing route folders, route content and the resulting website navigation. Numeric prefixes control navigation order, route ids become URL slugs, and the Dogs route shows two managed images.
```
