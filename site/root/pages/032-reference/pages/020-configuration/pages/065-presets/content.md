---
page:
  description: Look up the public values supplied by each built-in preset and export the installed definition.
---

# Preset values

A preset supplies defaults, not restrictions on permitted root overrides.
These are the public settings of the built-in presets. The [theme model](/reference/configuration/theme/)
explains how overrides and inherited page themes combine with them.

For the exact definition in your installed release, run
`npm exec -- norna theme:export documentation`. The exported reference file
is not loaded as a theme and never overwrites an existing file.

## documentation

| Setting | Preset value |
| --- | --- |
| `palette` | `warm-paper` |
| `appearance.default` | `system` |
| `typography.fontFamily` | `Georgia, 'Times New Roman', serif` |
| `typography.profile` | `reading` |
| `typography.rhythm` | `compact` |
| `layout.textWidth` | `narrow` |
| `layout.contentSpacing` | `compact` |
| `layout.pageWidth` | `1240px` |
| `layout.gutter` | Desktop `clamp(1.25rem, 4vw, 3rem)`; mobile `1rem` |
| `images.presentation` | `prose-aligned` |
| `images.width` | `920px` |
| `images.maxAvailableWidthPercent` | Desktop and mobile `100` |
| `blocks.cardList.width` | `text` |
| `corners` | `rounded` |
| `sections.backgroundPattern` | `alternating`; resolves to `uniform` with tree navigation |
| Reader Display | Reading width and Appearance always available; Focus reading when navigation resolves to tree |

[Rendered documentation example](https://janga.github.io/norna/examples/feature-demos/theme-preset-documentation/).

## project

| Setting | Preset value |
| --- | --- |
| `palette` | `near-monochrome` |
| `appearance.default` | `system` |
| `typography.fontFamily` | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| `typography.profile` | `reading` |
| `typography.rhythm` | `compact` |
| `layout.textWidth` | `normal` |
| `layout.contentSpacing` | `compact` |
| `layout.pageWidth` | `1120px` |
| `layout.gutter` | Desktop `clamp(1.25rem, 4vw, 3rem)`; mobile `1rem` |
| `images.presentation` | `prose-aligned` |
| `images.width` | `840px` |
| `images.maxAvailableWidthPercent` | Desktop and mobile `100` |
| `blocks.cardList.width` | `normal` |
| `corners` | `rounded` |
| `sections.backgroundPattern` | `alternating`; resolves to `uniform` with tree navigation |
| Reader Display | Reading width and Appearance always available; Focus reading when navigation resolves to tree |

[Rendered project example](https://janga.github.io/norna/examples/feature-demos/theme-preset-project/).

## portfolio

| Setting | Preset value |
| --- | --- |
| `palette` | `near-monochrome` |
| `appearance.default` | `system` |
| `typography.fontFamily` | `'Helvetica Neue', Arial, sans-serif` |
| `typography.profile` | `restrained` |
| `typography.rhythm` | `normal` |
| `layout.textWidth` | `wide` |
| `layout.contentSpacing` | `normal` |
| `layout.pageWidth` | `1240px` |
| `layout.gutter` | Desktop `clamp(1.25rem, 4vw, 3rem)`; mobile `1rem` |
| `images.presentation` | `centered-fit` |
| `images.width` | `1000px` |
| `images.maxAvailableWidthPercent` | Desktop and mobile `100` |
| `images.maxAvailableHeightPercent` | Desktop `78`; mobile `68` |
| `blocks.cardList.width` | `wide` |
| `corners` | `square` |
| `sections.backgroundPattern` | `uniform` |
| Reader Display | Reading width and Appearance always available; Focus reading when navigation resolves to tree |

[Rendered portfolio example](https://janga.github.io/norna/examples/feature-demos/theme-preset-portfolio/).

## statement

| Setting | Preset value |
| --- | --- |
| `palette` | `warm-paper` |
| `appearance.default` | `system` |
| `typography.fontFamily` | `'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif` |
| `typography.profile` | `statement` |
| `typography.rhythm` | `airy` |
| `layout.textWidth` | `normal` |
| `layout.contentSpacing` | `spacious` |
| `layout.pageWidth` | `1280px` |
| `layout.gutter` | Desktop `clamp(1.5rem, 5vw, 4rem)`; mobile `1rem` |
| `images.presentation` | `centered-fit` |
| `images.width` | `1080px` |
| `images.maxAvailableWidthPercent` | Desktop and mobile `100` |
| `images.maxAvailableHeightPercent` | Desktop `80`; mobile `70` |
| `blocks.cardList.width` | `wide` |
| `corners` | `square` |
| `sections.backgroundPattern` | `accented`; resolves to `uniform` with tree navigation |
| Reader Display | Reading width and Appearance always available; Focus reading when navigation resolves to tree |

[Rendered statement example](https://janga.github.io/norna/examples/feature-demos/theme-preset-statement/).

## Interpreting the values

`normal` text width is called Standard in Display. Readers may change their
width and Appearance; Focus reading appears with tree navigation. A preset
never disables these choices.

Background patterns marked as resolving to `uniform` change automatically
with tree navigation. Explicit conflicting overrides are rejected instead.
[Image presentation](/reference/configuration/images/) explains why height
limits belong to centered-fit media while prose-aligned stacks may be taller
than the viewport.

Internal navigation/profile tokens are not public override fields. Use
[Layout and spacing](/reference/configuration/layout/),
[Typography](/reference/configuration/typography/) and
[Card width](/reference/content/cards/#width) for the accepted syntax.
