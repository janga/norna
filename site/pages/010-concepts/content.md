---
page:
  description: >-
    Understand Norna's opinionated file model and how it differs from a traditional static site
    generator.
---

# Concepts


## Single-page site {#single-page-site}

Even a one-page site contains two kinds of content.

`content.md` contains the page itself: its sections, text and Norna image or
card blocks.
`sitewide-content.yaml` contains content shared by the whole site, such as
notices and the footer, plus optional display settings for a conventional
navigation logo.{note-ref} The reasoning is that more pages may be added to a
site that begins as a single page.

{note: If additional pages are added later, sitewide content already has the right scope
and can appear across every page without being duplicated.}

This separation is part of Norna being opinionated. You do not decide where
these elements should live or wire them into a page layout. Norna gives each
kind of content a defined place.

`theme.yaml` controls the visual presentation, while `config.yaml` contains the few
technical settings the site needs.

Within `content.md`, the single level-one heading names the page. Level-two
headings define sections and their navigation anchors. Managed images for the
page share one `images/` directory next to its content file, so moving an image
block between sections does not require reorganising image folders.

<!-- norna-image-provenance:
image: single-page-site.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to explain
how a single-page file tree, content.md and page-local images map to a
simple single-page website.
-->

```norna-image-stack
- image: single-page-site.svg
  alt: A three-column diagram showing a single-page Norna file tree, a folded content.md document with section ids and image references, and the resulting browser page.
```

## Multi-page site {#multi-page-site}

A Norna site can grow by adding pages. Each page adds
more content to the site model: it gets its own URL and normally inherits the
site's visual presentation.

Page directories contain page content and may contain page-local
presentation, but they cannot contain technical site configuration. Technical
configuration stays at the top level in `config.yaml`.

Page folder prefixes control navigation order, while the page id becomes the
URL segment. For example, `010-dogs/` is shown before `020-adopt/` in site
navigation. The Dogs page gets a URL that ends with `/dogs/`.

<!-- norna-image-provenance:
image: multi-page-site.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to explain
how page folders map to page content, hierarchical navigation, managed images
and URL segments. The diagram uses a file tree, folded content.md documents
and a pair of cartoon dogs to make the page relationship concrete.
-->

```norna-image-stack
- image: multi-page-site.svg
  alt: A three-column diagram showing page folders and a conventional logo as a file tree, content.md documents, ordered navigation, a page URL and two cartoon dogs on the Dogs page.
```
