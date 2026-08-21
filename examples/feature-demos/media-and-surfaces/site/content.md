---
title: Media and Surfaces
description: A visual test bench for Norna's managed media and presentation surfaces.
navigation:
  label: Home
---

## Media and surfaces {#intro}

This site is a focused test bench for Norna's managed media blocks, sidenotes,
palettes and section-surface controls.

The examples are ordinary Norna files: a theme chooses the site's visual
defaults, routes can use their own complete themes, and Markdown blocks place
managed media in the content flow.

## New: palettes and surfaces {#palette}

The palette is a small, named choice rather than a collection of unrelated
colours. The site theme selects one of the built-in palettes:

```yaml
presentation:
  palette: paper
```

The palette supplies the page, navigation and frame colours. A site can also
cycle through base, soft and emphasis section surfaces:

```yaml
presentation:
  sectionSurfaces:
    mode: cycle
    sequence: [base, soft, emphasis]
```

This keeps the visual rhythm consistent without asking each section to invent
its own colours.

## New: explicit section surfaces {#surfaces}

This page uses the theme's surface sequence. `palette` is the visual family;
`sectionSurfaces` chooses a bounded sequence of base, soft and emphasis
treatments for the page.

The result is a restrained change in background and text treatment, while the
same typography and content model remain in place.

## Managed content blocks {#blocks}

Managed image stacks, carousels, card lists and sidenotes provide bounded ways
to place common visual structures in Markdown. They are shown together on the
Media blocks route.

The important distinction is that these controls are named and bounded. They
provide useful visual variation without turning every page into a new template
or CSS project.

## Explore the examples {#next}

Read [Media blocks](/media/) to compare image stacks, carousels and card lists.

Read [Surfaces](/surfaces/) for the relationship between palette defaults and
theme-level surface choices.
