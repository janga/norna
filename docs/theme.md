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
  palette: dark  # Alternatives: light, paper
  sectionSurfaces:
    mode: cycle
    sequence: [base, soft, emphasis]
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
- `logo`: optional settings for a fixed logo file in `site/public`. Name the
  file `logo.svg`, `logo.png`, `logo.jpg`, or `logo.jpeg`; only one is allowed.
  `alt` sets the accessible name and `height` sets the rendered height. The
  width is derived from the file's intrinsic aspect ratio.

If `navigation.brand` is omitted, Norna uses the homepage `title` from
`site/content.md`. Use `navigation.brand` when the homepage title is editorial
or route-specific, but the navigation should keep a stable site name.

Example:

```yaml
navigation:
  brand: Norna
```

Example with a logo:

```yaml
navigation:
  logo:
    alt: Norna
    height: 2.6rem
```

If no logo file is present, `config:check` warns and the navigation uses
`navigation.brand` or the homepage title instead. If both a logo and
`navigation.brand` are present, the logo is used and the brand remains a text
fallback.

## Layout

`layout` is optional. It controls the outer page geometry:

- `pageWidth`: maximum width of the main page content area.
- `gutter`: side margin removed from the viewport before available content
  width is calculated. Use either one CSS length for all viewports or
  `desktop` / `mobile` values.
- `density`: default structural spacing profile. Allowed values are `compact`,
  `normal`, and `airy`.
- `spacing`: optional spacing overrides for sections and content blocks. Every
  spacing value accepts either one CSS length for all viewports or `desktop` /
  `mobile` values.

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
    headingToBlock:
      desktop: 0.75em
      mobile: 0.7em
    blockGap:
      desktop: 1.5em
      mobile: 1.25em
```

If omitted, Norna uses `1180px` for `pageWidth`, desktop
`clamp(1.25rem, 4vw, 3rem)` for `gutter`, mobile `1rem`, and `normal` layout
density.

Spacing keys:

- `firstSectionTop`: space above the first section heading.
- `sectionGap`: space above each following section.
- `finalSectionBottom`: space below the final section.
- `headingToBlock`: space between a section heading and its first visual content
  block, such as an image stack, carousel, or card list.
- `blockGap`: space between content blocks in a section. It applies between
  Markdown, image, carousel, and card-list blocks, but not after the final block.
- `imageGap`: space between stacked images or carousel blocks.

The default `compact`, `normal`, and `airy` density profiles provide values for
these spacing keys. The `em` values for `headingToBlock` and `blockGap` are
relative to the relevant text size, so the rhythm follows typography changes.
Use `sectionGap` and the other structural keys when the distance should describe
the page layout rather than the size of nearby text.

Text-near spacing inside Markdown, such as spacing after headings, spacing
before Markdown subheadings, paragraph spacing, and caption spacing, belongs to
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
  preset: text-forward
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
      lineHeight: 1.55
```

Use `norna typography presets` to inspect built-in preset and rhythm values,
and `norna typography show` to inspect the resolved typography for the
selected site. See [Typography](typography.md).

## Presentation

`presentation` is optional. It selects a small built-in visual palette for the
page frame and defines how section surfaces are assigned:

- `palette`: `dark`, `light`, or `paper`. The palette controls the page,
  navigation, footer, and section colors.
- `sectionSurfaces.mode`: `none` or `cycle`.
- `sectionSurfaces.sequence`: optional sequence of `base`, `soft`, and
  `emphasis`. Each surface may occur at most once.

Example:

```yaml
presentation:
  palette: paper  # Alternatives: dark, light
  sectionSurfaces:
    mode: cycle
    sequence: [base, soft, emphasis]
```

## Page And Section Overrides

Site-wide presentation belongs in `site/theme.md`. Page-level presentation in a
page file is always an override on top of the theme:

```yaml
presentation:
  typography:
    preset: statement
```

Detailed typography overrides belong in the top-level `typography.overrides`
block in `site/theme.md`.

Section-specific presentation belongs under
`sections.<section-id>.presentation`. Use it when one section genuinely needs
different presentation; do not use `sections` to define section order or normal
Markdown structure.

```yaml
sections:
  intro:
    presentation:
      surface: emphasis
      typography:
        preset: statement
```

If a page omits `presentation`, it uses the theme presentation unchanged. If a
section omits `presentation`, it uses the resolved page presentation.

Section surfaces render as full-width horizontal bands while the section
content keeps the normal page and image widths. Links keep the palette's global
accent color.
