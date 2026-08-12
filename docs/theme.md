# Theme

`site/theme.md` defines optional site-wide visual defaults for a `norna` site.
It uses YAML frontmatter and does not need a Markdown body. If the file is
missing, built-in engine defaults are used.

Page-level presentation in `site/content.md` and route page files is always an
override on top of `site/theme.md`. Section-level presentation is an override
on top of the resolved page presentation. Use those overrides for focused
exceptions; the normal place for shared visual choices is `site/theme.md`.

## Minimal Theme

```yaml
---
navigation:
  brand: Example Site
layout:
  density: normal
  pageWidth: 1180px
  gutter:
    desktop: clamp(1.25rem, 4vw, 3rem)
    mobile: 1rem
gallery:
  width: 900px
  maxAvailableWidthPercent:
    desktop: 100
    mobile: 100
  maxAvailableHeightPercent:
    desktop: 74
    mobile: 68
typography:
  fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif"
  preset: quiet-gallery
  rhythm: normal
presentation:
  backgroundColor: "#000000"
  textColor: "#f7f4ee"
frame:
  colors: presentation
---
```

Starter sites include a marked comment block such as
`norna:start theme-help` / `norna:end theme-help`. The block is only
explorable help text; YAML comments do not affect rendering. The active
configuration is the uncommented YAML below it.

## Navigation

`navigation` is optional. It currently supports:

- `brand`: optional site-wide brand or home-link text shown in the site
  navigation.

If `navigation.brand` is omitted, Norna uses the homepage `title` from
`site/content.md`. Use `navigation.brand` when the homepage title is editorial
or route-specific, but the navigation should keep a stable site name.

Example:

```yaml
navigation:
  brand: Norna
```

## Layout

`layout` is optional. It controls the outer page geometry:

- `pageWidth`: maximum width of the main page content area.
- `gutter`: side margin removed from the viewport before available content
  width is calculated. Use either one CSS length for all viewports or
  `desktop` / `mobile` values.
- `density`: default structural spacing profile. Allowed values are `compact`,
  `normal`, and `airy`.
- `spacing`: optional structural spacing overrides for sections and Norna
  managed media blocks. Every spacing value accepts either one CSS length for all
  viewports or `desktop` / `mobile` values.

Example:

```yaml
layout:
  density: normal
  pageWidth: 1180px
  gutter:
    desktop: clamp(1.25rem, 4vw, 3rem)
    mobile: 1rem
  spacing:
    firstSectionTop:
      desktop: clamp(1.875rem, 3vw, 2.75rem)
      mobile: 1.375rem
    sectionGap:
      desktop: clamp(1.4rem, 3vw, 2.75rem)
      mobile: 1.5rem
```

If omitted, Norna uses `1180px` for `pageWidth`, desktop
`clamp(1.25rem, 4vw, 3rem)` for `gutter`, mobile `1rem`, and `normal` layout
density.

Spacing keys:

- `firstSectionTop`: space above the first section heading.
- `sectionGap`: space above each following section.
- `finalSectionBottom`: space below the final section.
- `bodyToImages`: space from section body text to Norna managed media blocks.
- `imageGap`: space between stacked images or carousel blocks.

Text-near spacing, such as spacing after headings, spacing before Markdown
subheadings, paragraph spacing, and caption spacing, belongs to
`typography.rhythm` and typography overrides.

## Image Sizing

`gallery` is optional. It controls image sizing:

- `width`: hard maximum rendered image area width for images, captions, and
  aligned text.
- `maxAvailableWidthPercent`: maximum share of available width after gutters.
- `maxAvailableHeightPercent`: maximum share of viewport height used by
  images.

Example:

```yaml
gallery:
  width: 900px
  maxAvailableWidthPercent:
    desktop: 100
    mobile: 100
  maxAvailableHeightPercent:
    desktop: 74
    mobile: 68
```

If omitted, Norna uses `900px`, full available width, and image height limits of
desktop `74` / mobile `68`.

## Typography

Top-level `typography` is the site-wide typographic base. It supports:

- `fontFamily`: global CSS font-family stack.
- `preset`: built-in typography preset.
- `rhythm`: text-near spacing profile. Allowed values are `compact`,
  `normal`, and `airy`.
- `overrides`: focused changes to preset values.

Example:

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
      lineHeight: 1.55
```

Use `norna typography presets` to inspect built-in preset and rhythm values,
and `norna typography show` to inspect the resolved typography for the
selected site. See [Typography](typography.md).

## Presentation

`presentation` is optional. It can contain:

- `backgroundColor`: optional quoted hex color in `#rgb`, `#rrggbb`, or
  `#rrggbbaa` form.
- `textColor`: optional quoted hex color in `#rgb`, `#rrggbb`, or
  `#rrggbbaa` form.
- `inlineStyles`: optional named inline text styles.

Example:

```yaml
presentation:
  backgroundColor: "#101418"
  textColor: "#f4f1ea"
```

## Page And Section Overrides

Site-wide presentation belongs in `site/theme.md`. Page-level presentation in a
page file is always an override on top of the theme:

```yaml
presentation:
  typography:
    overrides:
      headings:
        h2:
          size: large
          spacingAfter: 0.6em
      body:
        paragraphSpacing: 1em
```

Section-specific presentation belongs under
`sections.<section-id>.presentation`. Use it when one section genuinely needs
different presentation; do not use `sections` to define section order or normal
Markdown structure.

```yaml
sections:
  intro:
    presentation:
      backgroundColor: "#161616"
      textColor: "#ffffff"
      typography:
        preset: statement
```

If a page omits `presentation`, it uses the theme presentation unchanged. If a
section omits `presentation`, it uses the resolved page presentation.

Configured section backgrounds render as full-width horizontal bands while the
section content keeps the normal page and image widths. The top spacing
before the first heading, the spacing between sections, and the spacing after
the final section are part of the section background.

Configured section text colors apply to section headings, Markdown text,
Markdown subheadings, and image captions. Links keep the global accent color.

## Frame Colors

`frame.colors` controls the sticky navigation and footer colors.

Allowed values:

- `presentation`: use the resolved presentation colors for this level.
- `theme`: use the site theme frame colors. This is useful in page-level
  frontmatter.
- explicit colors:

```yaml
frame:
  colors:
    backgroundColor: "#111111"
    textColor: "#eeeeee"
```

The sticky section navigation row and footer use the resolved frame colors, not
section-specific presentation.

## Inline Styles

`presentation.inlineStyles` defines named inline text styles that can be used
from Markdown:

```yaml
presentation:
  inlineStyles:
    highlight:
      color: "#ffd84d"
```

Inline style names must match `^[a-z][a-z0-9-]*$`. Each style currently
supports a required `color` field using the same quoted hex color format as
`textColor`.

Apply an inline style in Markdown with `[text]{.style-name}`:

```md
This sentence contains [highlighted text]{.highlight}.
```

`content:check` fails if Markdown uses an inline style that is not defined in
`site/theme.md` `presentation.inlineStyles`.
