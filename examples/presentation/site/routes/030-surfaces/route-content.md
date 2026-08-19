---
title: Surfaces
description: See how palette defaults and section surfaces work together.
navigation:
  label: Surfaces
sections:
  palette-options:
    presentation:
      surface: base
  emphasis-surface:
    presentation:
      surface: emphasis
  practical-rule:
    presentation:
      surface: soft
---

## Palette options {#palette-options}

Norna currently provides a small set of named palettes. The theme chooses one
for the whole site:

```yaml
presentation:
  palette: dark
```

The available choices are `dark`, `light` and `paper`. A palette defines the
page, navigation, frame and section colours together, so these parts stay in
balance.

## Emphasis surface {#emphasis-surface}

Sections can use the palette's emphasis surface when a visual pause or change
of rhythm helps the reader. This is not a free-form colour override:

```yaml
presentation:
  sectionSurfaces:
    mode: cycle
    sequence: [base, soft, emphasis]
```

The site theme can cycle through the selected surfaces automatically, while an
individual section can explicitly select `base`, `soft` or `emphasis` in its
content metadata.

## A practical rule {#practical-rule}

Use the site palette for the overall tone. Use soft and emphasis surfaces for a
small number of meaningful transitions, not to make every section look
unrelated.

Typography presets and media blocks can vary the content inside that system;
surfaces provide the page-level rhythm around it.
