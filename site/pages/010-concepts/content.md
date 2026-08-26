---
page:
  description: >-
    Understand Norna's opinionated file model and how it differs from a traditional static site
    generator.
---

# Concepts


## Single-page site {#single-page-site}

A single-page Norna site is small without being a special case. Home uses the
same page model as every page the site may gain later.

Home lives in `pages/000-home/`. Its `content.md` contains the page title,
sections, text, and Norna image or card blocks. Managed images live in the
neighbouring `images/` directory.

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

Within `content.md`, the single level-one heading names Home. Level-two headings
define its sections. On a single-page site, the navigation links to the page
title and those sections, without introducing a separate list of pages.

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

## Top-level pages {#top-level-pages}

Adding a page directory beside `000-home` turns the site into a multi-page site.
Home and the other top-level pages are siblings under `site/pages/`; Home is not
the parent of the rest of the site.

Each top-level page gets its own URL and a place in global navigation. It also
gets its own `content.md`, optional `images/`, and optional limited page
presentation. The site's colors, typography, shape, and navigation remain
shared.

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

## Nested pages {#nested-pages}

When a top-level area needs more structure, add a `pages/` directory inside
that page:

```text
site/pages/
├── 000-home/
│   └── content.md
└── 010-guides/
    ├── content.md
    └── pages/
        └── 010-installation/
            ├── content.md
            └── pages/
                └── 020-macos/
                    └── content.md
```

This creates `/guides/`, `/guides/installation/`, and
`/guides/installation/macos/`. Every directory in the hierarchy is a real page
with its own title, content, and URL; Norna does not use empty grouping
directories.

Numeric prefixes order pages among their siblings. Child pages appear in the
local hierarchy for their top-level area rather than becoming additional
global navigation roots.

Nested pages inherit the site's visual identity and any permitted page
presentation set by their ancestors. A more local `theme.yaml` may adjust text
width, content spacing, managed-image sizing, and section background pattern,
but not colors, typography, shape, or navigation.

Home is the one exception: `000-home` is the site's front door and cannot own
child pages. Start each navigable hierarchy with another top-level page beside
it.
