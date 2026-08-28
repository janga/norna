# Theme

`site/theme.yaml` defines the visual identity and default presentation for the
whole Norna site. It is a required plain YAML file. The normal setup selects one
complete preset and adds only focused overrides when they are needed:

```yaml
preset: documentation
```

The root theme owns site-wide colors, shapes, typography, page frame, and
navigation presentation. An optional page-local `theme.yaml` has a deliberately
smaller role described under [Page Themes](#page-themes).

## Theme Presets

Available complete presets are:

- `portfolio`: restrained typography and a broad image area for image-led
  presentation.
- `documentation`: reading-focused typography, a paper palette, and compact
  structural rhythm.
- `project`: compact layout and a light presentation for project and product
  sites.
- `statement`: airy spacing and stronger typography for short editorial
  content.

Each preset coordinates:

- light and dark colors, shape, and typography
- page width, gutters, text width, and content spacing
- navigation spacing and visual treatment
- managed-image sizing
- section background sequence

These coordinated values keep the site's identity consistent. Page themes
cannot select another preset.

## Overrides

Values beside the root preset override only that part of the preset. Other
preset values remain active:

```yaml
preset: documentation
layout:
  pageWidth: 1320px
palette: dark
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

## Color Modes

Every preset includes coordinated light and dark variants for its palette.
`colorMode.default` selects the initial appearance:

- `system`: follow the visitor's operating-system preference.
- `light`: start with the preset's light colors.
- `dark`: start with the preset's dark colors.

Current preset defaults are:

| Preset | Initial mode | Visitor selector |
| --- | --- | --- |
| `portfolio` | `dark` | Enabled |
| `documentation` | `system` | Enabled |
| `project` | `system` | Enabled |
| `statement` | `system` | Enabled |

Set `allowSelection` to `true` to show a site-wide selector for System, Light,
and Dark in the navigation:

```yaml
preset: documentation
colorMode:
  default: system
  allowSelection: true
```

When a visitor selects System, Light, or Dark, Norna stores the value in a
first-party cookie named `norna-color-mode`. The cookie is limited to the site's
base path, uses `SameSite=Lax`, and expires after one year. This keeps the choice
for later visits without sharing it with another Norna site under a different
path on the same domain. System stores the choice `system`; the actual colors
continue to follow the visitor's operating-system preference.

When the cookie is absent or invalid, Norna uses `colorMode.default`. Set
`allowSelection: false` to hide the control; no color-mode preference script or
cookie is then needed. The preset's initial mode still applies. A root theme
without a preset also defaults selection to disabled unless it explicitly
enables it.

Color mode belongs to the root theme because navigation, page frame, section
surfaces, controls, and text must change together. Page-local themes cannot
override it. Select a palette for the site's color character, then use color
mode to choose whether its coordinated light or dark variant is active. Norna
does not expose arbitrary per-mode colors.

The runnable [Media and surfaces example](../examples/feature-demos/media-and-surfaces/)
lets you change mode while inspecting prose, section surfaces, managed images,
cards, and carousel controls.

## Palette And Section Surfaces

These root settings are site-wide:

- `palette`: `dark`, `light`, or `paper`.
- `shape`: `square` or `soft`.
- `sections.backgroundPattern`: `uniform`, `alternating`, or `cycling`.

Example:

```yaml
preset: project
palette: paper
shape: soft
sections:
  backgroundPattern: cycling
```

The background pattern uses coordinated surfaces from the active palette. It
does not let individual sections select arbitrary colors.

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
- `sections.backgroundPattern`

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
shape, typography, page width, gutters, and navigation remain constant.

Page themes cannot define `preset`, `palette`, `shape`, `typography`,
`navigation`, `config.yaml`, or site-wide content. This boundary keeps one
recognisable site while still allowing a guide, gallery, or reference area to
use an appropriate reading width and media presentation.
