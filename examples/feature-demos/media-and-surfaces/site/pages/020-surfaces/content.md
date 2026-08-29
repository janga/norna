---
page:
  description: See how palette defaults and section surfaces work together.
---

# Surfaces


## Light and dark modes {#color-modes}

The site preset provides coordinated light and dark colors. Use the color-mode
selector in the navigation to compare this page in System, Light, and Dark
mode. The choice applies to the complete site, including navigation, prose,
section surfaces, cards, captions, and carousel controls.

The root theme enables the selector with:

```yaml
colorMode:
  default: system
readerControls:
  appearance: true
```


## Palette options {#palette-options}

Norna provides a small set of named palettes. The theme chooses one
for the whole site:

```yaml
palette: dark
```

The available choices are `dark`, `light` and `paper`. A palette defines the
page, navigation, frame and section colours together, so these parts stay in
balance.

## Emphasis surface {#emphasis-surface}

The page theme uses a palette and a surface sequence when a visual pause or
change of rhythm helps the reader. This is not a free-form colour override:

```yaml
sections:
  backgroundPattern: cycling
```

The theme can cycle through the selected surfaces automatically. Individual
sections do not select their own colours.

## A practical rule {#practical-rule}

Use the site palette for the overall tone. Use soft and emphasis surfaces for a
small number of meaningful transitions, not to make every section look
unrelated.

Typography profiles and Norna blocks can vary the content inside that system;
surfaces provide the page-level rhythm around it.
