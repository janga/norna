---
page:
  description: Control the site frame, prose width, gutters and spacing without confusing them with reader choices.
---

# Layout and spacing

The **page frame** contains the content and any persistent navigation rails.
The **reading width** limits prose inside the remaining content space.
Increasing the frame does not automatically make paragraphs wider.

```yaml title="site/theme.yaml: widen the frame, retain narrow prose" {2,3}
layout:
  pageWidth: 1320px
  textWidth: narrow
```

## Layout fields

| Field under `layout` | Effect | Without preset or override |
| --- | --- | --- |
| `pageWidth` | Maximum site frame width, including rails | `1180px` |
| `gutter` | Horizontal outer padding | Desktop `clamp(1.25rem, 4vw, 3rem)`, mobile `1rem` |
| `textWidth` | `narrow`, `normal` or `wide` prose | Typography baseline |
| `contentSpacing` | `compact`, `normal` or `spacious` structural gaps | `normal` |
| `spacing` | Individual structural-gap overrides | Active spacing profile |

Only `textWidth` and `contentSpacing` can also appear in page/category themes.
Readers may choose Narrow, Standard or Wide in Display regardless of these
defaults; these correspond to roughly 60ch, 72ch and 80ch. Media retains its
own width. No setting disables reader width choice.

## Structural gaps

```yaml title="site/theme.yaml: selected spacing overrides"
layout:
  spacing:
    firstSectionTop: 1.5rem
    sectionGap:
      desktop: 2.5rem
      mobile: 1.5rem
    headingToBlock: 0.75em
    blockGap: 1.5em
```

| Key under `spacing` | Space controlled |
| --- | --- |
| `firstSectionTop` | Above the first section |
| `sectionGap` | Above later sections |
| `finalSectionBottom` | Below the final section |
| `headingToBlock` | Section heading to its first structured block |
| `blockGap` | Between structured content blocks |
| `imageGap` | Between images in a stack |

Paragraph and body-subheading gaps belong to [typography rhythm](/reference/configuration/typography/).
Navigation-rail gaps are coordinated by presets, not exposed as separate fields.

## Length syntax

`pageWidth`, `gutter`, spacing and image widths accept `0` or a nonnegative
CSS length in `px`, `rem`, `em`, `vw`, `vh`, `vmin`, `vmax`, `ch` or `%`.
They also accept `clamp(min, preferred, max)` with three unit-bearing lengths, for
example `clamp(1rem, 4vw, 3rem)`. `calc()` and negative values are not accepted.

`gutter` and each spacing field accept either one length or an object with
both `desktop` and `mobile` lengths. Typography spacing uses a different,
smaller unit set documented with its fields.
