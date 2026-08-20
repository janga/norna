# Typography

`norna` typography is configured in `site/theme.md` through a site-wide font,
presets, text rhythm, and optional overrides.

The normal place to choose a site-wide typography preset and rhythm is the
top-level `typography` block in `site/theme.md`.
Page and section files may override the theme when a focused exception is
needed, but the normal workflow is to keep typography in `theme.md`.

## Presets

Available presets:

- `quiet-gallery`: the default for image-led sites. Text is restrained and
  supports the images without dominating the page.
- `compact-gallery`: tighter typography for many sections, many images, or
  short information blocks.
- `text-forward`: more generous body text for pages where longer text carries
  more of the experience.
- `statement`: tighter, more declarative line-height for short programmatic
  statements. Use it sparingly, usually as a page or section exception.

If theme typography is omitted, `quiet-gallery` is used.

Presets define alignment, size, weight, and line height for `headings.h1`
through `headings.h4`, `body`, and `caption`. They also choose a readable body
text width. Built-in presets use `medium` as the default size for every text
role. Visual heading hierarchy comes from the Markdown heading level, so `h1`
is larger than `h2`, `h2` is larger than `h3`, and so on.

The presets use these controls deliberately:

- `quiet-gallery` uses restrained heading weights and a normal reading width.
- `compact-gallery` uses stronger headings and a wider text column for short,
  scannable content.
- `text-forward` uses a narrower reading width and more generous body line
  height.
- `statement` uses the strongest heading weights and a narrow text column for
  short, declarative content.

`rhythm` defines text-near spacing for headings, paragraphs, and captions.
Available rhythms are `compact`, `normal`, and `airy`. Built-in rhythm values
use `em` so spacing follows the rendered text size.

Use this command to inspect the exact preset and rhythm values shipped with
the installed engine:

```sh
norna typography presets
```

Use this command to inspect the effective values for the selected site after
presets, rhythms, and overrides have been applied:

```sh
norna typography show
```

The output includes the site theme, every page route, and every section. Each
resolved value shows its `source`; values inherited by a page or section are
also marked with `inherited: true`.

## Configuration Shape

```yaml
typography:
  fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif"
  preset: quiet-gallery
  rhythm: normal
  overrides:
    headings:
      h2:
        size: medium
        weight: 600
        spacingAfter: 0.55em
      h3:
        size: medium
        spacingBefore: 1.5em
        spacingAfter: 0.5em
    body:
      width: narrow
      paragraphSpacing: 0.8em
    caption:
      spacingBefore: 0.5em
```

The typographic roles are:

- `headings.h1`: reserved for page-level Markdown `#` headings if the content
  model starts supporting them.
- `headings.h2`: Markdown `##` section headings.
- `headings.h3`: Markdown `###` subheadings inside section body text.
- `headings.h4`: Markdown `####` subheadings inside section body text.
- `body`: Markdown body text inside sections.
- `caption`: image captions.

Allowed alignment values are `left`, `center`, and `right`. Alignment can be
responsive:

```yaml
align:
  desktop: left
  mobile: center
```

Allowed size values are `small`, `medium`, `large`, and `xlarge`. `medium` is
the normal reading size. Use `small` for quieter supporting text, and use
`large` or `xlarge` only when a page or section needs stronger emphasis.
Each heading level uses its own scale, but follows the same principle:
`medium` is the normal size for that level. Norna may render the first section
heading as an HTML `h1` for document structure, but its visual typography still
follows the Markdown level the user wrote: `##` uses `headings.h2`.

`lineHeight` is a unitless number from `1` through `3`. `spacingBefore`,
`spacingAfter`, and `paragraphSpacing` are CSS lengths such as `0`, `0.8em`,
`1rem`, or `12px`. Use `em` for spacing that should track the text size.

`weight` is a controlled heading weight. Allowed values are `400`, `500`,
`600`, and `700`. `body.width` is the readable text width and accepts
`narrow`, `normal`, or `wide`. It controls the prose column, not the page's
maximum width or the width of image blocks.

Supported override fields:

- `headings.h1.align`, `headings.h1.size`, `headings.h1.weight`,
  `headings.h1.lineHeight`,
  `headings.h1.spacingBefore`, `headings.h1.spacingAfter`
- `headings.h2.align`, `headings.h2.size`, `headings.h2.weight`,
  `headings.h2.lineHeight`,
  `headings.h2.spacingBefore`, `headings.h2.spacingAfter`
- `headings.h3.align`, `headings.h3.size`, `headings.h3.weight`,
  `headings.h3.lineHeight`,
  `headings.h3.spacingBefore`, `headings.h3.spacingAfter`
- `headings.h4.align`, `headings.h4.size`, `headings.h4.weight`,
  `headings.h4.lineHeight`,
  `headings.h4.spacingBefore`, `headings.h4.spacingAfter`
- `body.align`, `body.size`, `body.width`, `body.lineHeight`,
  `body.paragraphSpacing`
- `caption.align`, `caption.size`, `caption.lineHeight`,
  `caption.spacingBefore`

## Route Themes

Theme typography is the site-wide base:

```yaml
# site/theme.md
typography:
  fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif"
  preset: quiet-gallery
  rhythm: normal
```

A route-local `theme.md` can give that route a different typographic character.
The route theme replaces the root visual theme rather than inheriting from it,
so repeat any non-default `fontFamily`, `rhythm`, or `overrides` that the route
still needs.

Example route theme:

```yaml
# site/routes/010-introduction/theme.md
typography:
  preset: statement
  rhythm: normal
```

The `body.width` value controls the prose column independently of the page and
image widths. Captions are normally centered, but `text-forward` uses
left-aligned captions to support longer explanatory text.
