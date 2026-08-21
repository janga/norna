---
title: Examples
description: See the kinds of websites Norna's opinionated site model is designed to build.
navigation:
  label: Examples
---

## What can you build with Norna? {#overview}

Norna is not tied to one particular type of website.

The common factor is that the site is content-driven and fits well within a
defined model of content, presentation, configuration, routes and assets.

## Rendered examples {#rendered-examples}

These sites are built from the example files in the Norna repository and
published together with this documentation:

```norna-card-list
flow: grid
size: m
width: normal

- title: Dog shelter: single page
  text: A complete site with two homepage sections and no routes.
  link: https://janga.github.io/norna/examples/complete-sites/dog-shelter-single-page/
  badge-text: Complete site
- title: Dog shelter: multi-page
  text: A complete site with a homepage and ordered routes for dogs and adoption.
  link: https://janga.github.io/norna/examples/complete-sites/dog-shelter-multi-page/
  badge-text: Complete site
- title: Theme presets
  text: Compare portfolio, documentation, project and statement without overrides.
  link: https://janga.github.io/norna/examples/feature-demos/theme-presets/
  badge-text: Feature demo
- title: Media and surfaces
  text: Inspect image stacks, carousels, cards, notes, palettes and section surfaces.
  link: https://janga.github.io/norna/examples/feature-demos/media-and-surfaces/
  badge-text: Feature demo
```

## Common site types {#site-types}

```norna-card-list
flow: grid
size: m
width: normal

- title: Project website
  text: Present an open source project, CLI tool or library with an overview, guide and useful links.
- title: Portfolio or artist website
  text: Combine written presentation with image stacks, carousels and captions.
- title: Documentation or guide
  text: Introduce a project and organise additional topics as routes.
- title: Personal or organisation website
  text: Publish a compact information site with ordinary files and a shared visual presentation.
- title: Image-driven site
  text: Combine ordinary text sections with managed image stacks, carousels and captions when images are central to the presentation.
```

## The common pattern {#pattern}

All examples use the same underlying model:

```text
content
presentation
configuration
routes
assets
    ↓
  Norna
    ↓
static website
```

The important part is not the type of website.

The important part is that Norna provides the website implementation while the
project supplies the site description through a defined set of files.
