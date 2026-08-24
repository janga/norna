# Typography

Norna typography is configured in `site/theme.yaml` through a site-wide font,
profile, text rhythm, and optional overrides.

The normal workflow is to select a complete top-level theme preset. It already
chooses a coordinated font, typography profile, and rhythm:

```yaml
preset: documentation
```

Use the nested `typography` block only when those typographic choices need to
differ from the selected theme preset. Typography is configured at root-theme
or page-theme level, not in page or section content.

## Typography Profiles

Available profiles:

- `restrained`: the default for image-led sites. Text is restrained and
  supports the images without dominating the page.
- `dense`: tighter typography for many sections, many images, or
  short information blocks.
- `reading`: more generous body text for pages where longer text carries
  more of the experience.
- `statement`: tighter, more declarative line-height for short programmatic
  statements. Use it sparingly, usually as a page-level exception.

If a complete top-level theme preset is selected, that preset supplies the
typography choice. If both the top-level preset and nested typography are
omitted, the engine default is `restrained`.

Profiles define alignment, size, weight, and line height for `headings.h1`
through `headings.h4`, `body`, and `caption`. They also choose a readable body
text width. Built-in presets use `medium` as the default size for every text
role. Visual heading hierarchy comes from the Markdown heading level, so `h1`
is larger than `h2`, `h2` is larger than `h3`, and so on.

The profiles use these controls deliberately:

- `restrained` uses restrained heading weights and a normal reading width.
- `dense` uses stronger headings and a wider text column for short,
  scannable content.
- `reading` uses a narrower reading width and more generous body line
  height.
- `statement` uses the strongest heading weights and a narrow text column for
  short, declarative content.

`rhythm` defines text-near spacing for headings, paragraphs, and captions.
Available rhythms are `compact`, `normal`, and `airy`. Built-in rhythm values
use `em` so spacing follows the rendered text size.

Use this command to inspect the exact profile and rhythm values shipped with
the installed engine:

```sh
norna typography profiles
```

Use this command to inspect the effective values for the selected site after
profiles, rhythms, and overrides have been applied:

```sh
norna typography show
```

The output includes the site theme, every page, and every section. Each
resolved value shows its `source`; values inherited by a page or section are
also marked with `inherited: true`.

## Configuration Shape

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
Each heading level uses its own scale but follows the same principle:
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

## Page Themes

The simplest page-specific typography change is to select a complete theme
preset:

```yaml
# site/pages/010-introduction/theme.yaml
preset: statement
```

A page-local `theme.yaml` replaces the root visual theme rather than inheriting
from it. The complete preset supplies a coherent page theme without repeating
the root values.

Use a nested typography choice when only the typographic character needs to be
specified explicitly:

```yaml
# site/pages/010-introduction/theme.yaml
typography:
  profile: statement
  rhythm: normal
```

Without a top-level theme preset, other omitted page-theme values use engine
defaults rather than values from the root theme.

The `body.width` value controls the prose column independently of the page and
image widths. Captions are normally centered, but `reading` uses
left-aligned captions to support longer explanatory text.
