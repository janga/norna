---
page:
  description: >-
    An opinionated publishing system for building coherent websites from
    Markdown, images, and a small set of site files.
---

# Norna

## What is Norna? {#intro}

**Norna is an opinionated, open source publishing system for websites kept as
ordinary files.**{note-ref}

{note: This site is built by Norna.}

You write in Markdown, choose the images, and arrange pages in folders. Norna
turns those source files into a coherent website: it provides the presentation,
builds navigation from the page hierarchy, prepares responsive images, checks
the relationships between files, and produces static output ready to publish.

The authoring surface stays deliberately small. Ordinary Markdown handles the
prose, while a few built-in blocks cover image stacks, carousels, cards, and
notes. Presets coordinate typography, color, spacing, media, and navigation, so
each new site does not begin as a layout and component project.

Norna is pre-1.0 software. Pin its version in each site and keep the source in
Git so changes remain reviewable and reversible while the contracts mature.

## Why Norna? {#why}

Norna is designed to remove repetitive site implementation without hiding the
source that matters.

```norna-card-list
flow: grid
size: m
width: text
- title: Start with a page, grow into a hierarchy
  text: The same file model supports a focused one-page site, top-level pages, or deeply nested documentation with responsive navigation.
- title: Use a complete presentation
  text: Purpose-built presets coordinate typography, palettes, spacing, content width, image behavior, and reader controls.
- title: Reorganize with guardrails
  text: Norna checks links, headings, aliases, and assets, and helps move pages and images safely instead of leaving silent breakage.
- title: Publish a focused static site
  text: Pages require no client-side JavaScript unless an interaction needs it, while sitemap, canonical URLs, images, validation, and GitHub Pages publishing are handled together.
```

[Compare the built-in theme presets](/examples/themes-and-overrides/#presets)
using the same content and images.

The files remain useful outside Norna. You can inspect changes, review them in
Git, return to an earlier version, and work with an AI assistant that edits the
same Markdown, images, theme, and configuration you do.

The trade-off is deliberate. Norna offers less implementation freedom than a
general-purpose site generator. In return, the project does not need to own a
separate template system, component architecture, image pipeline, navigation
implementation, and collection of plugins just to publish a coherent site.

## When is Norna a good fit? {#good-fit}

Norna fits content-led websites whose authors want to spend more time on the
site and less time constructing the machinery around it.

### Good fit {#good-fit3}

- project and product websites
- documentation and guides
- portfolios, artist websites, and image-led presentations
- personal websites
- organisation and information sites

It works particularly well when the site should remain straightforward to
edit, review, reorganize, and publish as files while retaining a consistent
visual and navigational system.

### Not a good fit

Norna is not intended for dynamic web applications, database-backed
publishing, visual CMS workflows, or projects whose purpose requires complete
control over templates, components, and rendering logic.
