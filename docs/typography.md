# Typography

`norna` typography is configured in `site/theme.md` through a site-wide font,
presets, text rhythm, and optional overrides.

The normal place to choose a site-wide typography preset and rhythm is the
top-level `typography` block in `site/theme.md`.
Page and section files may override the theme when a page or section needs a
different presentation.

## Presets

Available presets:

- `quiet-gallery`: the default for image-led sites. Text is restrained and
  supports the images without dominating the page.
- `compact-gallery`: tighter typography for many sections, many images, or
  short information blocks.
- `text-forward`: more generous body text for pages where longer text carries
  more of the experience.
- `statement`: tighter, more declarative line-height for introductions, first
  sections, and short programmatic statements. Use it sparingly, usually as a
  section override.

If theme typography is omitted, `quiet-gallery` is used.

Presets define alignment, size, and line height for `headings.h1` through
`headings.h4`, `body`, and `caption`. Built-in presets use `medium` as the
default size for every text role. Visual heading hierarchy comes from the
Markdown heading level, so `h1` is larger than `h2`, `h2` is larger than `h3`,
and so on.

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
        spacingAfter: 0.55em
      h3:
        size: medium
        spacingBefore: 1.5em
        spacingAfter: 0.5em
    body:
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

Supported override fields:

- `headings.h1.align`, `headings.h1.size`, `headings.h1.lineHeight`,
  `headings.h1.spacingBefore`, `headings.h1.spacingAfter`
- `headings.h2.align`, `headings.h2.size`, `headings.h2.lineHeight`,
  `headings.h2.spacingBefore`, `headings.h2.spacingAfter`
- `headings.h3.align`, `headings.h3.size`, `headings.h3.lineHeight`,
  `headings.h3.spacingBefore`, `headings.h3.spacingAfter`
- `headings.h4.align`, `headings.h4.size`, `headings.h4.lineHeight`,
  `headings.h4.spacingBefore`, `headings.h4.spacingAfter`
- `body.align`, `body.size`, `body.lineHeight`, `body.paragraphSpacing`
- `caption.align`, `caption.size`, `caption.lineHeight`,
  `caption.spacingBefore`

## Inheritance

Theme typography is the site-wide base:

```yaml
# site/theme.md
typography:
  fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif"
  preset: quiet-gallery
  rhythm: normal
```

A page-level `presentation.typography.preset` changes the typographic character
for that page. A section-level `sections[].presentation.typography.preset`
changes the typographic character for that section. `rhythm` is inherited
separately, so changing preset does not change spacing unless `rhythm` is also
set.

If a section sets `typography.rhythm`, that section changes text-near spacing.
If a section only sets `typography.overrides`, it keeps the resolved page
preset and rhythm and changes only the specified values.

Example section override:

```yaml
sections:
  - id: intro
    presentation:
      typography:
        preset: statement
        overrides:
          body:
            paragraphSpacing: 0.7em
```

Centered text uses narrower text widths. Left- or right-aligned heading and body
text use the calculated image layout width so text edges line up with images
after layout gutters and image limits are applied. Captions are normally
centered.
