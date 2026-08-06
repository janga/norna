# Typography

`norna` typography is configured through presets with optional overrides. The
site font family itself is a technical setting in
[`typography.fontFamily`](configuration.md#typographyfontfamily).

The normal place to choose a site-wide typography preset is `site/theme.md`.
Page and section files may override the theme when a page or section needs a
different presentation.

## Presets

Available presets:

- `quiet-gallery`: the default for image-led art and portfolio sites. Text is
  restrained and supports the images without dominating the page.
- `compact-gallery`: tighter typography for many sections, many images, or
  short information blocks.
- `text-forward`: more generous body text for pages where longer text carries
  more of the experience.
- `statement`: stronger type for introductions, first sections, and short
  programmatic statements. Use it sparingly, usually as a section override.

If theme typography is omitted, `quiet-gallery` is used.

Presets normally keep `heading.size` and `body.size` at `medium`. They differ
primarily through alignment, line height, paragraph spacing, caption treatment,
and intended use. Choose larger or smaller type with focused overrides when a
specific page or section needs it.

Use this command to inspect the exact preset values shipped with the installed
engine:

```sh
npm run norna:typography:presets
```

Use this command to inspect the effective values for the selected site after
presets and overrides have been applied:

```sh
npm run norna:typography:show
```

The output includes the site theme, every page route, and every section. Each
resolved value shows its `source`; values inherited by a page or section are
also marked with `inherited: true`.

## Configuration Shape

```yaml
presentation:
  typography:
    preset: quiet-gallery
    overrides:
      body:
        paragraphSpacing: 0.8em
```

The typographic roles are:

- `heading`: section headings.
- `body`: Markdown body text inside sections.
- `caption`: gallery captions.

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
Headings use their own scale, but follow the same principle: `medium` is the
normal section heading size, not a hero size.

`lineHeight` is a unitless number from `1` through `3`. `spacing` and
`paragraphSpacing` are CSS lengths such as `0`, `0.8em`, `1rem`, or `12px`.

Supported override fields:

- `heading.align`, `heading.size`, `heading.lineHeight`, `heading.spacing`
- `body.align`, `body.size`, `body.lineHeight`, `body.paragraphSpacing`
- `caption.align`, `caption.size`, `caption.lineHeight`, `caption.spacing`

## Inheritance

Theme typography is the site-wide base:

```yaml
# site/theme.md
presentation:
  typography:
    preset: quiet-gallery
```

A page-level `presentation.typography.preset` changes the typographic base for
that page. A section-level `sections[].presentation.typography.preset` changes
the typographic base for that section.

If a section sets `typography.preset`, that section starts from that preset. If
a section only sets `typography.overrides`, it keeps the resolved page preset
and changes only the specified values.

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
text use the calculated gallery layout width so text edges line up with gallery
images after layout gutters and gallery limits are applied. Gallery captions
are normally centered.
