---
page:
  description: Choose coordinated light and dark colors without changing layout or typography.
---

# Palettes

A palette supplies coordinated colors for the page, text, links, navigation
and controls. Every palette has light and dark variants. It does not choose
which variant the reader sees; [Appearance](/reference/configuration/appearance/)
does that.

```yaml title="site/theme.yaml" {1}
palette: forest-moss
```

## Choices

| Value | Color character |
| --- | --- |
| `near-monochrome` | Off-white and neutral gray, with almost no hue |
| `warm-paper` | Warm paper and ink tones |
| `retro-earth` | Earthy ochre, olive and warm neutrals |
| `clay-rose` | Muted clay, rose and wine |
| `forest-moss` | Botanical greens and lichen neutrals |
| `mineral-teal` | Mineral green, muted teal and pale aqua-gray |
| `arctic-blue` | Cool blue-gray with restrained blue accents |
| `soft-lavender` | Lavender and subdued mauve |
| `vivid-night` | Indigo with brighter cyan and blue accents |

Omit `palette` to keep the preset's choice. Without a preset the default is
`near-monochrome`. Only the root theme selects a palette; page themes cannot
change it and arbitrary RGB values are not accepted.

The [Theme explorer](https://janga.github.io/norna/examples/theme-presets/) demonstrates these choices on
identical content. A palette change does not alter spacing, font or image size.

## Semantic colors

Callouts and status messages need consistent meanings. Their neutral,
informational, warning and danger colors are engine-owned across palettes,
with light/dark variants. They are not individually configurable palette hues.
See [Semantic callouts](/reference/content/callouts/#types).

[Section backgrounds](/reference/configuration/sections/) use coordinated
palette surfaces, not callout colors. Text, links and focus indicators retain
the engine's [presentation limits](/reference/reader/accessibility/).
