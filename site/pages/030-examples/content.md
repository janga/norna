---
page:
  description: Compare theme presets and explore complete Norna sites and focused feature demonstrations.
---

# Examples

## Compare theme presets {#theme-presets}

A theme preset is a complete visual starting point. It coordinates typography,
spacing, colors, corners, image sizing, section backgrounds, and the reader
choices available in the Display panel.

The comparison renders the same text, images, notes, code, carousel, and cards
with every built-in preset. Use the selector to change only the preset while
keeping the content and your place on the page unchanged.

[Compare the four theme presets](https://janga.github.io/norna/examples/theme-presets/)

The [theme preset reference](https://github.com/janga/norna/blob/main/docs/theme.md#theme-presets)
explains intended uses, complete default values, overrides, and interactions
with navigation.

## Complete sites {#complete-sites}

These small sites show how content, images, pages, navigation, and a preset work
together as one project.

```norna-card-list
flow: grid
size: m
width: normal

- title: Dog shelter: single page
  text: A complete one-page site with heading-based navigation and page-local images.
  link: https://janga.github.io/norna/examples/complete-sites/dog-shelter-single-page/
  badge-text: Complete site
- title: Dog shelter: multiple pages
  text: The same subject expanded with ordered pages, page-local content, and top navigation.
  link: https://janga.github.io/norna/examples/complete-sites/dog-shelter-multi-page/
  badge-text: Complete site
```

## Feature demonstrations {#feature-demonstrations}

Use these focused sites when you need to inspect one group of Norna features
rather than a complete editorial example.

```norna-card-list
flow: grid
size: m
width: normal

- title: Media and surfaces
  text: Inspect image stacks, portrait and landscape carousels, cards, notes, palettes, and section surfaces.
  link: https://janga.github.io/norna/examples/feature-demos/media-and-surfaces/
  badge-text: Feature demo
- title: Site-wide content
  text: Inspect conventional logo files, navigation, dismissible banner stacks, and footer content shared across pages.
  link: https://janga.github.io/norna/examples/feature-demos/sitewide-content/
  badge-text: Feature demo
```

## Source files {#source-files}

Every rendered example is built from files in the repository:

- Theme presets: [`portfolio`](https://github.com/janga/norna/tree/main/examples/feature-demos/theme-preset-portfolio), [`documentation`](https://github.com/janga/norna/tree/main/examples/feature-demos/theme-preset-documentation), [`project`](https://github.com/janga/norna/tree/main/examples/feature-demos/theme-preset-project), and [`statement`](https://github.com/janga/norna/tree/main/examples/feature-demos/theme-preset-statement).
- Complete sites: [single-page dog shelter](https://github.com/janga/norna/tree/main/examples/complete-sites/dog-shelter-single-page) and [multi-page dog shelter](https://github.com/janga/norna/tree/main/examples/complete-sites/dog-shelter-multi-page).
- Feature demonstrations: [media and surfaces](https://github.com/janga/norna/tree/main/examples/feature-demos/media-and-surfaces) and [site-wide content](https://github.com/janga/norna/tree/main/examples/feature-demos/sitewide-content).

All example sites are built by the automated test suite and published with this
documentation.
