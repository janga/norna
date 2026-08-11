---
title: Examples
description: See the kinds of small static websites Norna's opinionated site model is designed to build.
navigation:
  label: Examples
---

## What can you build with Norna? {#overview}

Norna is not tied to one particular type of website.

The common factor is that the site is relatively small, mostly static and fits
well within a defined model of content, presentation, configuration, routes and
assets.

## Common site types {#site-types}

### Project website

A project website can use:

- `content.md` for the overview
- routes for Getting Started, Concepts or other topics
- `theme.md` for a consistent presentation
- `public/` for project-specific static assets

The Norna website itself is an example.

### Portfolio or artist website

A portfolio can use:

- sections for bodies of work
- image stacks, carousels and captions
- routes for exhibitions, biography or contact information
- `theme.md` for visual presentation

Image-heavy presentation is one use of Norna, not the definition of the
product.

### Documentation or guide

A small guide can use the homepage as an introduction and routes for
individual topics.

Because the documentation is stored as files, it can live in the same
repository as the project it describes.

### Personal or organisation website

A small information site can combine:

- an introductory homepage
- a few additional routes
- Markdown content
- images
- static public assets
- a shared theme

No CMS or database is required.

### Image-driven site

Norna includes image processing and gallery-oriented presentation features for
sites where images matter.

Those features can be combined with ordinary text sections and routes.

A Norna site does not have to be a gallery.

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
