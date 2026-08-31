# Typography

Typography is a site-wide part of the root `site/theme.yaml`. A normal site
selects a complete theme preset, which already supplies a coordinated font
stack, typography profile, and spacing rhythm:

```yaml
preset: documentation
```

Add `typography` only when those choices need to differ from the selected
preset. Page and category themes cannot change the font, profile, rhythm, or
text-role overrides. They may change the body-text width through
`layout.textWidth`; see [Page Text Width](#page-text-width).

## Typography Profiles

A typography profile supplies alignment, size, weight, and line height for
page titles (`h1`), section headings (`h2`), body subheadings (`h3` and `h4`),
body text, and image captions. It also supplies a baseline text width that a
theme or page-level `layout.textWidth` may replace.

| Profile | Intended effect | Used by preset |
| --- | --- | --- |
| `restrained` | Lighter headings, normal-width prose, and centered captions for image-led pages. | `portfolio` |
| `dense` | Tighter line heights and a wider prose measure for compact, scannable information. | None by default |
| `reading` | More generous body line height, a narrow prose measure, and left-aligned captions for sustained reading. | `documentation`, `project` |
| `statement` | Stronger headings and tighter body text for short, declarative pages. | `statement` |

Every built-in profile uses the size name `medium` for every text role. The
rendered scales remain different by role, so the visual hierarchy is always
`H1 > H2 > H3 > H4`.

When neither a preset nor `typography.profile` supplies a profile, Norna uses
`restrained`.

### Typography Rhythm

`typography.rhythm` controls text-near vertical spacing independently of the
profile. It supplies spacing before and after headings, between paragraphs,
and before captions.

| Rhythm | Effect |
| --- | --- |
| `compact` | Reduces text-near spacing for dense pages and reference material. |
| `normal` | Uses the engine's balanced text spacing. |
| `airy` | Adds more separation for short or statement-led pages. |

Built-in rhythm values use `em`, so their spacing follows the rendered text
size. When neither a preset nor `typography.rhythm` supplies a rhythm, Norna
uses `normal`.

Inspect the exact values shipped by the installed engine with:

```sh
npm run norna:typography:profiles
```

Inspect the resolved typography for the selected site with:

```sh
npm run norna:typography:show
```

The second command reports the root theme and repeats the effective values for
every page and section. Each value identifies the profile, rhythm, or root
override that supplied it.

## Configuration Shape

Write typography settings only in the root `site/theme.yaml`:

```yaml
typography:
  fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif"
  profile: restrained
  rhythm: normal
  overrides:
    headings:
      h2:
        size: medium
        weight: 600
        spacingAfter: 0.55em
      h3:
        spacingBefore: 1.5em
        spacingAfter: 0.5em
    body:
      lineHeight: 1.55
      paragraphSpacing: 0.8em
    caption:
      spacingBefore: 0.5em
```

| Field | Purpose | When omitted |
| --- | --- | --- |
| `fontFamily` | CSS font-family fallback stack used by the whole site. | Use the selected preset; without a preset, use `Arial, 'Helvetica Neue', Helvetica, sans-serif`. |
| `profile` | Coordinated text-role sizes, weights, alignment, and line heights. | Use the selected preset; without a preset, use `restrained`. |
| `rhythm` | Coordinated heading, paragraph, and caption spacing. | Use the selected preset; without a preset, use `normal`. |
| `overrides` | Focused changes applied after the profile and rhythm. | Keep all resolved profile and rhythm values. |

`fontFamily` accepts a non-empty CSS font-family stack without semicolons,
braces, or line breaks. Norna does not load custom font files. Include suitable
fallbacks, and use only font names that the visitor's browser can access.

The override roles correspond directly to Markdown and rendered content:

| Role | Content |
| --- | --- |
| `headings.h1` | The page's single Markdown `#` title. |
| `headings.h2` | Markdown `##` section headings. |
| `headings.h3` | Markdown `###` subheadings inside a section. |
| `headings.h4` | Markdown `####` subheadings inside a section. |
| `body` | Paragraphs, lists, and other body text. |
| `caption` | Captions rendered with managed images. |

### Override Values

`align` must contain `desktop`, `mobile`, or both. Each accepts `left`,
`center`, or `right`:

```yaml
typography:
  overrides:
    headings:
      h2:
        align:
          desktop: left
          mobile: center
```

`size` accepts `small`, `medium`, `large`, or `xlarge`. The same name resolves
to a different scale for each heading level, body text, and captions. Use
`medium` for the normal size of a role.

`weight` applies only to headings and accepts `400`, `500`, `600`, or `700`.

`lineHeight` is unitless. Heading line height may range from `1` through `3`,
body line height from `1.4` through `3`, and caption line height from `1.25`
through `3`.

`spacingBefore`, `spacingAfter`, and `paragraphSpacing` accept `0` or a CSS
length using `px`, `rem`, `em`, `ch`, or `lh`. Use `em` when spacing should
track the current text size.

Supported fields are:

- `headings.h1.align`, `headings.h1.size`, `headings.h1.weight`,
  `headings.h1.lineHeight`, `headings.h1.spacingBefore`,
  `headings.h1.spacingAfter`
- `headings.h2.align`, `headings.h2.size`, `headings.h2.weight`,
  `headings.h2.lineHeight`, `headings.h2.spacingBefore`,
  `headings.h2.spacingAfter`
- `headings.h3.align`, `headings.h3.size`, `headings.h3.weight`,
  `headings.h3.lineHeight`, `headings.h3.spacingBefore`,
  `headings.h3.spacingAfter`
- `headings.h4.align`, `headings.h4.size`, `headings.h4.weight`,
  `headings.h4.lineHeight`, `headings.h4.spacingBefore`,
  `headings.h4.spacingAfter`
- `body.align`, `body.size`, `body.lineHeight`, `body.paragraphSpacing`
- `caption.align`, `caption.size`, `caption.lineHeight`,
  `caption.spacingBefore`

## Page Text Width

Text width is a layout choice, not a typography override. Set
`layout.textWidth` in the root theme when it should apply throughout the site:

```yaml
layout:
  textWidth: narrow
```

An optional page or category `theme.yaml` may set the same field for its page
subtree:

```yaml
# site/pages/010-introduction/theme.yaml
layout:
  textWidth: narrow
```

Accepted values are `narrow`, `normal`, and `wide`. The root or page setting
takes priority over the baseline width supplied by the typography profile.
Descendant pages inherit a page-local value until a more local page or category
theme replaces it.

Every visitor may temporarily choose another bounded reading width in the
Display panel. This engine-level reader choice cannot be disabled and does not
change the source theme. See [Layout](theme.md#layout), [Page
Themes](theme.md#page-themes), and [Reader Display
Controls](theme.md#reader-display-controls) for the complete scope and
interaction rules.
