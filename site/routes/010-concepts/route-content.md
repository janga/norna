---
title: Concepts
description:
  Understand Norna's opinionated file model and how it differs from a
  traditional static site generator.
navigation:
  label: Concepts
---

## The site model {#site-model}

<!-- norna-image-provenance:
image: site-model.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to summarise
how source files pass through Norna's opinionated site model and become a
website.
-->

```norna-image-stack
- image: site-model.svg
  alt: Site files describing content, presentation, configuration, routes and assets flow through Norna and become a responsive website.
```

## Single-page site {#single-page-site}

Even a one-page site contains two kinds of content.

`content.md` contains the page itself: its sections, text and managed media.
`sitewide-content.md` contains content shared by the whole site, such as its
identity, notices and footer.{note-ref} The reasoning is that more pages may be
added to a site that begins as a single page.

{note: If routes are added later, sitewide content already has the right scope
and can appear across every page without being duplicated.}

This separation is part of Norna being opinionated. You do not decide where
these elements should live or wire them into a page layout. Norna gives each
kind of content a defined place.

`theme.md` controls the visual presentation, while `config.mjs` contains the few
technical settings the site needs.

Within `content.md`, level-two headings define the page sections. Each section
id connects the section to its corresponding folder under `images/`.

<!-- norna-image-provenance:
image: single-page-site.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to explain
how a single-page file tree, content.md and section image folders map to a
simple single-page website.
-->

```norna-image-stack
- image: single-page-site.svg
  alt: A three-column diagram showing a single-page Norna file tree, a folded content.md document with section ids and image references, and the resulting browser page.
```

## Multi-page site {#multi-page-site}

A Norna site can grow by adding _routes_ (pages, if you prefer). Each route adds
more content to the site model: it gets its own URL and normally inherits the
site's visual presentation.

Route directories contain route content and may contain route-local
presentation, but they cannot contain technical site configuration. Technical
configuration stays at the top level in `config.mjs`.

Route folder prefixes control route presentation order on the site, while the
route id becomes the URL slug. For example, the route from `010-dogs/` is shown
before the route from `020-adopt/` on the site. It becomes a URL that ends with
`/dogs/`.

<!-- norna-image-provenance:
image: multi-page-site.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to explain
how route folders map to route content, hierarchical navigation, managed images
and URL slugs. The diagram uses a file tree, folded route-content.md documents
and a pair of cartoon dogs to make the route relationship concrete.
-->

```norna-image-stack
- image: multi-page-site.svg
  alt: A three-column diagram showing route folders as a file tree, route-content.md documents, ordered navigation, URL slugs and two cartoon dogs on the Dogs page.
```
