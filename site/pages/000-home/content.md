---
page:
  description: >-
    Build coherent, responsive websites from Markdown, images, and a small set
    of ordinary files.
---

# Norna

## Write the content. Norna builds the site. {#intro}

**Norna is an opinionated, open source publishing system for documentation,
project sites, portfolios, and other content-led websites.**

You write in Markdown, choose the images, and arrange pages in folders. Norna
turns those files into a responsive website with coordinated presentation,
navigation that follows the page hierarchy, checked links and assets, and
static output ready to publish.

**[Install Norna and create a site](/getting-started/install-norna/)**

To evaluate the result first, [explore complete sites, themes, media, and
writing examples](/examples/).

## What Norna handles {#why}

The authoring surface stays deliberately small. Ordinary Markdown handles
prose, while a few built-in blocks cover image stacks, carousels, cards, and
notes. Norna supplies the site behavior around them.

```card-list
flow: grid
size: m
width: text
- title: Start from a complete design
  text: Purpose-built presets coordinate typography, color, spacing, content width, images, navigation, and reader choices.
- title: Grow without changing the model
  text: The same page files support one-page sites, top-level pages, and deep hierarchies. Norna derives suitable desktop and mobile navigation.
- title: Reorganize with guardrails
  text: Checks catch broken links, headings, and assets. Page and image tools carry out unambiguous moves and preserve old page URLs when needed.
- title: Publish with the essentials in place
  text: Responsive images, canonical and social metadata, a sitemap, a useful 404 page, static output, and a GitHub Pages workflow are provided together.
```

[See how one page grows into a nested site](/getting-started/grow-your-site/),
or [compare the built-in themes](/examples/themes-and-overrides/#presets) using
the same content and images.

This documentation site is itself built with Norna. Its source remains
ordinary files: changes can be inspected and reversed with Git, and an AI
assistant can work with the same Markdown, images, theme, and configuration as
the author.

## Where Norna fits {#fit}

Norna works best when writing, images, and clear navigation are the substance
of the website. It is designed for project and product sites, documentation
and guides, portfolios and artist sites, and organisation, information, and
personal websites.

The trade-off is deliberate: Norna makes the recurring layout, component,
image, navigation, validation, and build decisions. In return, the site does
not need to maintain its own web architecture or assemble a plugin collection
to cover common publishing needs.

Choose a more flexible platform when the project is a dynamic application,
needs database-backed or visual-CMS publishing, or depends on complete control
over templates, components, and rendering logic.
