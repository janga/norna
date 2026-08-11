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

Norna turns Markdown, images and a small set of site files into a responsive
static website.

You write the content, choose a preset, and keep images in section folders for
each page. Norna handles the repetitive work: validation, responsive image
output, static builds and required checks before publishing.

Norna handles the repetitive website work and keeps layout decisions
deliberately few, so you can focus on the site itself.

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

When image files or route folders move, Norna helps the generated site follow.
During local work, the dev server refreshes image output when content, images or
route folders change, so the preview stays in step with the files.

Image publishing stays efficient too. Norna creates image versions for different
screen sizes, but only for new or changed images. Unchanged images do not need
to be processed or uploaded again, while changed images are published under
fresh URLs so stale browser caches are avoided.

### Less website implementation

Norna gives small sites a defined presentation model instead of asking every
site to assemble templates, layouts, components, image handling and publishing
checks from scratch.

The trade-off is deliberate: fewer layout decisions and less implementation
work, in exchange for staying inside Norna's site model.

## When is Norna a good fit? {#good-fit}

Norna is intended for relatively small, mostly static websites where a
file-driven and versioned workflow is useful.

### Good fit

- project and product websites
- documentation and guides
- portfolios, artist websites and image-driven presentation sites
- personal websites
- small organisation and information sites

Norna is a good fit when you want to edit the site as files and let a tool
handle the website structure and presentation.

### Not a good fit

Norna is not intended for dynamic web applications, large publishing systems,
database-backed sites, visual CMS workflows, or projects that need complete
control over their rendering architecture.
