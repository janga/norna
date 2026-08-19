---
title: Visual Model
description: A visual test bench for Norna's established and new presentation features.
navigation:
  label: Home
---

## Norna's visual model {#intro}

This site is a small test bench for Norna's graphical possibilities. It shows
the features that have been part of the site model for some time, together with
the newer palette and section-surface controls.

The examples are deliberately ordinary Norna files: a theme chooses the site's
visual defaults, routes can use their own complete themes, and Markdown blocks
place managed media in the content flow.

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

## Established features {#established}

Typography presets, managed image stacks, carousels and card lists remain the
main building blocks for shaping a small site. They are shown in detail on the
routes in this example.

The important distinction is that these controls are named and bounded. They
provide useful visual variation without turning every page into a new template
or CSS project.

## Explore the examples {#next}

Read [Presets](/presets/) to compare the four typography presets.

Read [Media blocks](/media/) to compare image stacks, carousels and card lists.

Read [Surfaces](/surfaces/) for the relationship between palette defaults and
theme-level surface choices.
