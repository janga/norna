# Theme

`site/theme.yaml` defines the site-wide visual theme for a Norna site. It is a
required plain YAML file. The normal setup selects one complete theme preset
and adds only focused overrides when needed.

An optional `theme.yaml` inside a page directory replaces the root visual
theme for that page. Navigation-logo display settings remain site-wide and
belong in `sitewide-content.yaml`.

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

A normal `theme.yaml` can be only:

```yaml
preset: documentation
```

Each preset supplies coordinated values for:

- layout density, page width, and gutters
- managed image sizing
- font family, typography profile, and typography rhythm
- palette and section-surface behaviour

The nested `typography.profile` setting documented below is a lower-level
typography choice. A top-level theme `preset` selects the complete visual
system, including that typography choice.

## Overrides

Values written beside the top-level preset override only that part of the
preset. Other preset values remain active:

```yaml
preset: documentation
layout:
  pageWidth: 1320px
palette: dark
```

Nested objects are merged by key. `sectionSurfaces` replaces the preset array
when it is specified.

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

The command creates `site/orig-documentation-theme.yaml`, or the corresponding
path under the selected site directory. The file contains the preset values,
comments describing accepted alternatives, and an example of a fine-grained
typography override.

Norna never loads `orig-*-theme.yaml`; only `theme.yaml` is active. The export
command refuses to overwrite an existing reference file.

Page titles and site navigation are not part of the visual theme. Define
optional logo display settings in `site/sitewide-content.yaml`; see
[Sitewide Content](sitewide-content.md).

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

`images` is optional. It controls managed image sizing:

- `width`: hard maximum rendered image area width for images, captions, and
  aligned text.
- `maxAvailableWidthPercent`: maximum share of available width after gutters.
- `maxAvailableHeightPercent`: maximum share of viewport height used by
  images.

Example:

```yaml
images:
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
- `profile`: built-in typography profile.
- `rhythm`: text-near spacing profile. Allowed values are `compact`,
  `normal`, and `airy`.
- `overrides`: focused changes to preset values.

Example:

```yaml
typography:
  fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif"
  profile: reading
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

Use `norna typography profiles` to inspect built-in profile and rhythm values,
and `norna typography show` to inspect the resolved typography for the
selected site. See [Typography](typography.md).

## Palette And Section Surfaces

`palette` and `sectionSurfaces` are optional top-level theme settings:

- `palette`: `dark`, `light`, or `paper`. It coordinates page, navigation,
  footer, and section colors.
- `sectionSurfaces`: one to three unique values chosen from `base`, `soft`, and
  `emphasis`. One value gives every section the same surface. Multiple values
  cycle in the listed order.

Example:

```yaml
palette: paper  # Alternatives: dark, light
sectionSurfaces: [base, soft, emphasis]
```

## Page Themes

Add `theme.yaml` to a page directory when that page should have a different
visual expression:

```text
site/pages/010-guide/theme.yaml
```

The page theme uses the same visual schema and complete presets as the root
theme. A page can therefore select a different expression without repeating a
large configuration:

```yaml
preset: statement
```

It completely replaces the root visual theme for that page. If the page
theme selects no top-level preset, omitted values use engine defaults rather
than values from the root theme. It cannot define navigation-logo settings or
technical configuration.

Section surfaces render as full-width horizontal bands while the section
content keeps the normal page and image widths. Links keep the palette's global
accent color.

## Common Questions

### Should every page select its own preset?

No. A page without its own `theme.yaml` inherits the root theme, which is the
normal choice when the site should keep one visual expression.

Add a page theme only when the page should intentionally look different. If
the page should keep the same preset but demonstrate a focused change, repeat
the root preset in the page theme and override only that setting. This is
necessary because a page theme replaces the root visual theme rather than
merging with it.

For example, a page demonstrating section surfaces may keep `preset: project`
and change only `sectionSurfaces`. A page demonstrating image or content
blocks should normally inherit the root preset so that the blocks remain the
only variable being compared.
