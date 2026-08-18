---
title: Norna
description:
  An opinionated CLI for building small static websites from content,
  presentation and configuration kept as files.
navigation:
  label: Home
---

## Norna {#intro}

**An opinionated CLI for building small websites from plain files.**

Norna turns Markdown, images and a small set of configuration files into a
responsive static website.

You keep the site as ordinary files, but not as an arbitrary pile of files.
Norna gives them a defined structure: content files for text, image folders next
to the content they belong to, a theme file for visual choices, and a config
file for the few technical settings the site needs.

Markdown stays the main writing format, with a few small Norna blocks for common
site patterns such as image stacks, carousels and cards.

That structure removes a lot of small decisions. Keep images where Norna expects
them, and let the tool handle validation, image syncing, responsive image
output, static builds and publishing checks.

<!-- norna-image-provenance:
image: workflow.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to separate
the build step from publishing and show GitHub Pages as the publishing target
included today.
-->

```norna-image-stack
- image: workflow.svg
  alt: Norna turns site files into static website output in dist. GitHub Pages publishing is included today, while a dashed branch shows possible future integrations with other static hosts.
```

## Why Norna? {#why}

### Better browsing experience

Norna handles many of the small technical details that affect how the finished
site feels in the browser.

The site is responsive by default. Norna makes early images load first, and lets
later images wait until the first images have loaded.

### Easier maintenance

Because a Norna site is plain files, it fits naturally with Git. You can inspect
changes, review them, commit them, and go back to a safe version when something
goes wrong.

The file-based model also works well with AI-assisted editing. An assistant can
draft, rewrite, reorganise or explain the site by working with the same
Markdown, image folders, theme and configuration files that you review.

When content is reorganised, Norna helps keep related image files aligned with
the site structure, so file organisation does not become manual bookkeeping.
During local work, the dev server refreshes image output when content, images or
route folders change, so the preview stays in step with the files.

Image publishing stays efficient too. Norna creates image versions for different
screen sizes, but only for new or changed images. Unchanged images can be
reused, and changed images get fresh URLs so browsers do not keep showing old
versions.

### Less website implementation

Norna gives small sites a defined presentation model instead of asking every
site to assemble templates, layouts, components, image handling and publishing
checks from scratch.

The trade-off is deliberate: fewer layout decisions and less implementation
work, in exchange for staying inside Norna's site model.

## When is Norna a good fit? {#good-fit}

Norna is for small websites that should be easy to edit, review and publish as
part of an ordinary file-based workflow.

### Good fit

- project and product websites
- documentation and guides
- portfolios, artist websites and image-driven presentation sites
- personal websites
- small organisation and information sites

Norna is a good fit when you want a site that stays simple to change: content in
ordinary files, clear places for images and pages, and a ready-made presentation
model instead of a custom website implementation.

### Not a good fit

Norna is not intended for dynamic web applications, large publishing systems,
database-backed sites, visual CMS workflows, or projects that need complete
control over their rendering architecture.
