# Theme

`site/theme.yaml` defines the visual identity and default presentation for the
whole Norna site. It is a required plain YAML file. The normal setup selects one
complete preset and adds only focused overrides when they are needed:

```yaml
preset: documentation
```

The root theme owns site-wide colors, corners, typography, page frame, and
navigation presentation. An optional page-local `theme.yaml` has a deliberately
smaller role described under [Page Themes](#page-themes).

## Theme Presets

Available complete presets are:

- `portfolio`: restrained typography and a broad image area for image-led
  presentation.
- `documentation`: reading-focused typography, a warm-paper palette, and compact
  structural rhythm.
- `project`: compact layout and a cool-green presentation for project and product
  sites.
- `statement`: airy spacing and stronger typography for short editorial
  content.

Each preset coordinates:

- light and dark colors, corners, and typography
- page width, gutters, text width, and content spacing
- navigation spacing and visual treatment
- managed-image sizing
- section background pattern

These coordinated values keep the site's identity consistent. Page themes
cannot select another preset.

## Overrides

Values beside the root preset override only that part of the preset. Other
preset values remain active:

```yaml
preset: documentation
layout:
  pageWidth: 1320px
palette: near-monochrome
```

Nested objects are merged by key. It is valid to omit `preset` and define root
settings explicitly, but a complete preset is the simpler normal workflow.

## Export A Preset

Export the installed definition before choosing overrides:

```sh
norna theme:export documentation
```

In a generated site, use:

```sh
npm run norna:theme:export -- documentation
```

The command creates `site/orig-documentation-theme.yaml`. The file contains the
preset values, accepted alternatives, and example overrides. Norna never loads
`orig-*-theme.yaml`; only `theme.yaml` is active. The command refuses to
overwrite an existing reference file.

Page titles and site-wide editorial content are not part of the visual theme.
Optional logo display settings, banners, and the footer belong in
[`sitewide-content.yaml`](sitewide-content.md).

## Layout

Root `layout` settings control the site frame and default content geometry:

- `pageWidth`: maximum width of the full site layout, including local tree
  navigation where present.
- `gutter`: horizontal viewport gutter, either one CSS length or separate
  `desktop` and `mobile` values.
- `textWidth`: body-text line length: `narrow`, `normal`, or `wide`.
- `contentSpacing`: vertical spacing between sections and structured blocks:
  `compact`, `normal`, or `spacious`.
- `spacing`: fine-grained structural spacing overrides.

Example:

```yaml
preset: documentation
layout:
  pageWidth: 1320px
  gutter:
    desktop: clamp(1.25rem, 4vw, 3rem)
    mobile: 1rem
  textWidth: narrow
  contentSpacing: compact
  spacing:
    firstSectionTop: 1.5rem
    sectionGap:
      desktop: 2.5rem
      mobile: 1.5rem
    headingToBlock: 0.75em
    blockGap: 1.5em
```

Spacing keys are:

- `firstSectionTop`: space above the first section heading.
- `sectionGap`: space above each following section.
- `finalSectionBottom`: space below the final section.
- `headingToBlock`: space between a section heading and its first structured
  block, such as an image stack, carousel, or card list.
- `blockGap`: space between structured content blocks.
- `imageGap`: space between images in an image stack.

The `contentSpacing` profiles supply coordinated defaults for these values.
Text-near spacing inside Markdown, including paragraph and subheading spacing,
belongs to typography rhythm.

The horizontal gap between tree navigation and page content is coordinated by
the selected preset. It is intentionally not a separate public override.

## Image Sizing

`images` controls managed image sizing:

- `width`: maximum rendered image-area width.
- `maxAvailableWidthPercent`: maximum share of available horizontal space.
- `maxAvailableHeightPercent`: maximum share of viewport height.

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

Each responsive percentage may also be a single number.

## Typography

Root `typography` is site-wide. It supports:

- `fontFamily`: global CSS font-family stack.
- `profile`: `restrained`, `dense`, `reading`, or `statement`.
- `rhythm`: `compact`, `normal`, or `airy`.
- `overrides`: focused changes to headings, body text, and captions.

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
    body:
      size: medium
      lineHeight: 1.55
```

Use `norna typography profiles` to inspect built-in values and
`norna typography show` to inspect the resolved site typography. See
[Typography](typography.md) for every override field.

## Palette And Color Mode

Norna separates a site's color character from whether it is shown in light or
dark mode. A `palette` selects a coordinated family of colors, with both a light
and a dark variant. `colorMode` selects the light variant, the dark variant, or
the variant preferred by the visitor's operating system. It does not select
another palette.

### Palette

`palette` is a site-wide root-theme setting:

| Value | Color character |
| --- | --- |
| `near-monochrome` | Neutral grays and off-whites with almost no visible hue. |
| `cool-green` | A restrained range of cool greens, from light page surfaces to darker accents. |
| `warm-paper` | Warm off-whites and browns resembling paper and ink. |

Omit `palette` to use the selected preset's palette. Without a preset, Norna
uses `near-monochrome`. A page-local theme cannot select another palette.

### Color Mode

`colorMode.default` selects the mode used when the reader has no stored choice:

| Value | Effect |
| --- | --- |
| `system` | Follow the visitor's operating-system light or dark preference. |
| `light` | Use the palette's light variant. |
| `dark` | Use the palette's dark variant. |

Omit `colorMode` to use the selected preset's default. Without a preset, Norna
uses the palette's default: `dark` for `near-monochrome`, and `light` for
`cool-green` and `warm-paper`.

Current preset defaults are:

| Preset | Palette | Default color mode | Reader control |
| --- | --- | --- | --- |
| `portfolio` | `near-monochrome` | `dark` | Enabled |
| `documentation` | `warm-paper` | `system` | Enabled |
| `project` | `cool-green` | `system` | Enabled |
| `statement` | `warm-paper` | `system` | Enabled |

Set `readerControls.colorMode` to `true` to let readers choose System, Light,
or Dark from the site-wide Display panel:

```yaml
preset: documentation
colorMode:
  default: system
readerControls:
  colorMode: true
```

A preset supplies both a palette and a default color mode. Overriding only
`palette` keeps the preset's default color mode; set both when both choices
should change.

When a visitor selects System, Light, or Dark, Norna stores the value in a
first-party cookie named `norna-color-mode`. The cookie is limited to the site's
base path, uses `SameSite=Lax`, and expires after one year. This keeps the choice
for later visits without sharing it with another Norna site under a different
path on the same domain. System stores the choice `system`; the actual mode
continues to follow the visitor's operating-system preference.

When the cookie is absent or invalid, Norna uses `colorMode.default`. Set
`readerControls.colorMode: false` to hide the control; no color-mode preference
script or cookie is then needed. The configured default still applies. A root
theme without a preset does not show the reader control unless it explicitly
enables it.

Color mode belongs to the root theme because navigation, page frame, section
backgrounds, controls, and text must change together. Page-local themes cannot
override it. Norna does not expose arbitrary colors for individual modes.

## Corners

`corners` controls the site-wide corner treatment for navigation, cards, code
blocks, and other framed content:

| Value | Effect |
| --- | --- |
| `square` | Use square corners without a corner radius. |
| `rounded` | Use restrained corner radii coordinated for small, medium, and large elements. |

Omit `corners` to use the selected preset. Without a preset, Norna uses
`rounded`, with `2px`, `6px`, and `8px` radii for small, medium, and large
elements. Page-local themes cannot change the corner treatment.

```yaml
preset: project
corners: rounded
```

## Section Backgrounds

A section background pattern controls how coordinated backgrounds are assigned
to the H2 sections on a page. It does not set arbitrary colors for individual
sections. The backgrounds come from the active palette.

Set the pattern under `sections.backgroundPattern`:

```yaml
preset: project
sections:
  backgroundPattern: accented
```

| Value | Result | Navigation support |
| --- | --- | --- |
| `uniform` | Every H2 section uses the normal page background. | `sections`, `top`, and `tree` |
| `alternating` | Normal and subtly contrasting backgrounds repeat in turn. | `sections` and `top` |
| `accented` | Base, soft, emphasis, and soft backgrounds repeat in that order: `1 → 2 → 3 → 2 → 1`. | `sections` and `top` |

The page introduction and first H2 section use the normal background. H3 and
deeper headings remain within their H2 section and do not start another
background. The sequence starts again on each page.

With `alternating` or `accented`, the changing backgrounds span the complete
viewport width. Headings, prose, images, and cards remain constrained by the
normal page and content widths.

A changing background creates a strong visual grouping. It works as a section
cue with `sections` or `top` navigation. Tree navigation already creates a
persistent navigation region beside the document, so it requires one continuous
`uniform` reading background. This rule stays the same on small screens and
when readers collapse the tree or enable focus reading.

Omit `sections.backgroundPattern` to use the selected preset. Without a preset,
Norna uses `uniform`. Built-in presets resolve to `uniform` automatically when
navigation resolves to `tree`. A page-local setting overrides the root pattern
for that page and is inherited by its descendant pages. An explicit root or
page-theme override requesting `alternating` or `accented` with tree navigation
is invalid; remove the override or select `uniform`. Cards, code blocks,
banners, and callouts may still use their own coordinated backgrounds.

## Page Themes

Add `theme.yaml` to a non-home page directory only when that page or one of its
descendants needs a narrower presentation adjustment:

```text
site/pages/010-guide/theme.yaml
```

A page theme may set only:

- `layout.textWidth`
- `layout.contentSpacing`
- managed-image sizing under `images`
- `sections.backgroundPattern` when the site does not use tree navigation

For example:

```yaml
layout:
  textWidth: narrow
  contentSpacing: compact
images:
  width: 760px
sections:
  backgroundPattern: uniform
```

Page settings are merged with the root theme and inherited by descendant pages.
A more local page theme may override the same limited fields. Site colors,
corners, typography, page width, gutters, and navigation remain constant.

If `navigation.mode` is `automatic`, adding enough page or heading depth can
make the site resolve to tree navigation. A non-uniform page override must then
be removed or changed to `uniform`.

Page themes cannot define `preset`, `palette`, `corners`, `typography`,
`navigation`, `config.yaml`, or site-wide content. This boundary keeps one
recognisable site while still allowing a guide, gallery, or reference area to
use an appropriate reading width and media presentation.
