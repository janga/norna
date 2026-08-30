---
page:
  description: >-
    An opinionated CLI for building websites from content, presentation and
    configuration kept as files.
---

# Norna

## What is Norna? {#intro}

**Norna is an opinionated, open source CLI for building websites from very
simple markdown files.**{note-ref}

{note: This site is built by Norna.}

You write the text, choose the images and place them in the content. Norna takes
care of the repetitive website work: local preview, page structure, navigation,
responsive layout, image processing, validation and the finished static build.

The working syntax stays small: mostly ordinary Markdown plus a few built-in
blocks for image stacks, carousels, cards and notes. Optional VS Code
IntelliSense helps you discover configuration, block syntax and image filenames.
The source remains ordinary files that you can inspect, edit and version with
the rest of your work.

## Why Norna? {#why}

Norna is designed to make a site coherent before you start polishing individual
pages.

```norna-card-list
flow: grid
size: m
width: normal
- title: Fewer decisions, useful defaults
  text: Presets, palettes and ready-made content patterns establish a coherent site without assembling a custom presentation system.
- title: Responsive images without the routine
  text: Work with source images while Norna prepares responsive output and sensible loading behaviour for the finished site.
- title: Files that stay manageable
  text: Plain files work naturally with Git and AI-assisted editing, while Norna helps keep content and images organised.
```

[Compare the built-in theme presets](/examples/#theme-presets) using the same
content and images.

The browsing benefits are part of the normal workflow. Norna creates image
versions for different screen sizes, gives early images priority and lets later
images load lazily. Only new or changed images need to be processed, and changed
images get fresh URLs so browsers do not keep showing old versions.

Maintenance stays close to the source. You can inspect changes, review them in
Git and return to a safe version when something goes wrong. An AI assistant can
work with the same Markdown, image folders, theme and configuration files that
you review.

These benefits come from Norna owning more of the presentation layer. The
trade-off is deliberate: fewer layout decisions and less implementation work, in
exchange for staying inside Norna's site model.

## When is Norna a good fit? {#good-fit}

Norna is for websites that should be easy to edit, review and publish as part of
an ordinary file-based workflow.

### Good fit {#good-fit3}

- project and product websites
- documentation and guides
- portfolios, artist websites and image-driven presentation sites
- personal websites
- organisation and information sites

Norna is a good fit when you want a site that stays simple to change: content in
ordinary files, clear places for images and pages, and a ready-made presentation
model instead of a custom website implementation.

### Not a good fit

Norna is not intended for dynamic web applications, database-backed sites,
visual CMS workflows, or projects that need complete control over their
rendering architecture.
