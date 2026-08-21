# Theme

`site/theme.md` defines the site-wide visual theme for a `norna` site. It uses
YAML frontmatter and does not need a Markdown body. The root theme file is
required. The normal setup selects one complete theme preset and adds only
focused overrides when needed.

An optional `theme.md` inside a route directory replaces the root visual theme
for that route. Shared identity such as brand and logo remains site-wide and
belongs in `sitewide-content.md`.

## Theme Presets

Available complete theme presets are:

- `portfolio`: restrained typography and a broad image area for image-led
  presentation.
- `documentation`: reading-focused typography, a paper palette, and compact
  structural rhythm.
- `project`: compact layout and a light presentation for project and product
  sites.
- `statement`: airy spacing and stronger typography for short editorial
  content.

A normal `theme.md` can be only:

```yaml
---
preset: documentation
---
```

Each preset supplies coordinated values for:

- layout density, page width, and gutters
- managed image sizing
- font family, typography preset, and typography rhythm
- palette and section-surface behaviour

The nested `typography.preset` setting documented below is a lower-level
typography choice. A top-level theme `preset` selects the complete visual
system, including that typography choice.

## Overrides

Values written beside the top-level preset override only that part of the
preset. Other preset values remain active:

```yaml
---
preset: documentation
layout:
  pageWidth: 1320px
presentation:
  palette: dark
---
```

Nested objects are merged by key. Arrays such as
`presentation.sectionSurfaces.sequence` replace the preset array when they are
specified.

It is still valid to omit the top-level preset and define the visual settings
explicitly. Omitted explicit settings then use engine defaults. This is useful
for focused testing, but selecting a complete preset is the simpler normal
workflow.

## Export A Preset

Export the installed definition of a preset before choosing overrides:

```sh
norna theme:export documentation
```

In a generated site, the equivalent npm command is:

```sh
npm run norna:theme:export -- documentation
```

The command creates `site/orig-documentation-theme.md`, or the corresponding
path under the selected site directory. The file contains the preset values,
comments describing accepted alternatives, and an example of a fine-grained
typography override.

Norna never loads `orig-*-theme.md`; only `theme.md` is active. The export
command refuses to overwrite an existing reference file.

Site identity is not part of the visual theme. Define the optional navigation
brand and logo settings in `site/sitewide-content.md`; see [Sitewide Content](sitewide-content.md).

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

## Route Themes

Add `theme.md` to a route directory when that route should have a different
visual expression:

```text
site/routes/010-guide/theme.md
```

The route theme uses the same visual schema and complete presets as the root
theme. A route can therefore select a different expression without repeating a
large configuration:

```yaml
---
preset: statement
---
```

It completely replaces the root visual theme for that route. If the route
theme selects no top-level preset, omitted values use engine defaults rather
than values from the root theme. It cannot define navigation, brand, logo, or
technical configuration.

Section surfaces render as full-width horizontal bands while the section
content keeps the normal page and image widths. Links keep the palette's global
accent color.

## Common Questions

### Should every route select its own preset?

No. A route without its own `theme.md` inherits the root theme, which is the
normal choice when the site should keep one visual expression.

Add a route theme only when the route should intentionally look different. If
the route should keep the same preset but demonstrate a focused change, repeat
the root preset in the route theme and override only that setting. This is
necessary because a route theme replaces the root visual theme rather than
merging with it.

For example, a route demonstrating section surfaces may keep `preset: project`
and change only `presentation.sectionSurfaces`. A route demonstrating media or
content blocks should normally inherit the root preset so that the media or
content remains the only variable being compared.
