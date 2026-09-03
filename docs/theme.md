# Theme

`site/theme.yaml` defines the visual identity and default presentation for the
whole Norna site. It is a required plain YAML file. The normal setup selects one
complete preset and adds only focused overrides when they are needed:

```yaml
preset: documentation
```

The root theme owns site-wide colors, corners, typography, page frame,
navigation presentation, and defaults for structured content blocks. An
optional limited `theme.yaml` in a page or navigation-category directory has
the smaller role described under [Page Themes](#page-themes).

## Theme Presets

A theme preset is a complete, coordinated starting point for a site's visual
presentation. Select one with `preset` in the root `site/theme.yaml`:

```yaml
preset: project
```

Each preset coordinates:

- light and dark colors, corners, and typography
- page width, gutters, text width, and content spacing
- navigation spacing and visual treatment
- how managed images align with prose or a centered media area, and how much
  space they may use
- the default width of card lists
- how coordinated backgrounds repeat between H2 sections
- the reader choices available in the [Display panel](#reader-display-controls)

The preset does not create content, choose the page hierarchy, or select the
navigation mode. Those decisions come from the page files and `config.yaml`.
The root preset applies throughout the site; page themes cannot select another
preset.

Omit `preset` only when the root theme should define its settings explicitly.
Any omitted setting then uses the engine default described in the corresponding
section of this reference.

### Choose A Preset

| Preset | Intended use | Default direction |
| --- | --- | --- |
| `portfolio` | Portfolios and image-led presentation | Restrained sans-serif typography, broad text and image areas, a dark near-monochrome default, and square corners. |
| `documentation` | Guides and reference material | Serif reading typography, narrow prose, compact spacing, warm paper colors, and rounded corners. |
| `project` | Project and product sites that combine explanation, code, cards, and images | System sans-serif typography, normal-width prose, compact spacing, near-monochrome colors, and rounded corners. |
| `statement` | Short editorial, campaign, or statement-led sites | Expressive sans-serif typography, spacious rhythm, prominent media, warm paper colors, and square corners. |

Choose according to the site's main reading task, not according to one color or
font in isolation. Start without overrides and review the result with real
content before changing individual values.

[Explore all presets and palettes with identical content](https://janga.github.io/norna/examples/theme-presets/).

The following sections list the complete public settings supplied by each
preset. Internal profile names and derived component tokens are implementation
details and are deliberately excluded.

### `portfolio`

Use `portfolio` when images should carry much of the presentation and prose
should remain visually restrained. Its broad text, card-list, and media areas
suit portfolios, collections, and image-led introductions. A dense technical
reference will normally be better served by `documentation`.

```yaml
preset: portfolio
```

| Setting | Preset value |
| --- | --- |
| `palette` | `near-monochrome` |
| `appearance.default` | `dark` |
| `typography.fontFamily` | `'Helvetica Neue', Arial, sans-serif` |
| `typography.profile` | `restrained` |
| `typography.rhythm` | `normal` |
| `layout.textWidth` | `wide` |
| `layout.contentSpacing` | `normal` |
| `layout.pageWidth` | `1240px` |
| `layout.gutter` | Desktop `clamp(1.25rem, 4vw, 3rem)`; mobile `1rem` |
| `images.presentation` | `centered-fit` |
| `images.width` | `1000px` |
| `images.maxAvailableWidthPercent` | Desktop and mobile `100` |
| `images.maxAvailableHeightPercent` | Desktop `78`; mobile `68` |
| `blocks.cardList.width` | `wide` |
| `corners` | `square` |
| `sections.backgroundPattern` | `uniform` |
| Reader Display | Reading width always available; Appearance enabled; Focus reading disabled |

[Open the rendered `portfolio` example](https://janga.github.io/norna/examples/feature-demos/theme-preset-portfolio/).

### `documentation`

Use `documentation` for sustained reading, technical explanation, guides, and
reference material. It keeps prose and card lists in the reading column while
allowing diagrams and other managed media to extend beyond it. The serif
reading treatment is less suitable when images should dominate the site's
identity.

```yaml
preset: documentation
```

| Setting | Preset value |
| --- | --- |
| `palette` | `warm-paper` |
| `appearance.default` | `system` |
| `typography.fontFamily` | `Georgia, 'Times New Roman', serif` |
| `typography.profile` | `reading` |
| `typography.rhythm` | `compact` |
| `layout.textWidth` | `narrow` |
| `layout.contentSpacing` | `compact` |
| `layout.pageWidth` | `1240px` |
| `layout.gutter` | Desktop `clamp(1.25rem, 4vw, 3rem)`; mobile `1rem` |
| `images.presentation` | `prose-aligned` |
| `images.width` | `920px` |
| `images.maxAvailableWidthPercent` | Desktop and mobile `100` |
| `blocks.cardList.width` | `text` |
| `corners` | `rounded` |
| `sections.backgroundPattern` | `alternating`; resolves to `uniform` with tree navigation |
| Reader Display | Reading width always available; Appearance and Focus reading enabled |

[Open the rendered `documentation` example](https://janga.github.io/norna/examples/feature-demos/theme-preset-documentation/).

### `project`

Use `project` for project and product sites that need to balance concise prose,
code, cards, and supporting images. Its system typography and balanced text and
card-list widths make it a neutral working default. Sites centered on prolonged
reference reading or immersive images will normally benefit from a more
specialized preset.

```yaml
preset: project
```

| Setting | Preset value |
| --- | --- |
| `palette` | `near-monochrome` |
| `appearance.default` | `system` |
| `typography.fontFamily` | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| `typography.profile` | `reading` |
| `typography.rhythm` | `compact` |
| `layout.textWidth` | `normal` |
| `layout.contentSpacing` | `compact` |
| `layout.pageWidth` | `1120px` |
| `layout.gutter` | Desktop `clamp(1.25rem, 4vw, 3rem)`; mobile `1rem` |
| `images.presentation` | `prose-aligned` |
| `images.width` | `840px` |
| `images.maxAvailableWidthPercent` | Desktop and mobile `100` |
| `blocks.cardList.width` | `normal` |
| `corners` | `rounded` |
| `sections.backgroundPattern` | `alternating`; resolves to `uniform` with tree navigation |
| Reader Display | Reading width always available; Appearance and Focus reading enabled |

[Open the rendered `project` example](https://janga.github.io/norna/examples/feature-demos/theme-preset-project/).

### `statement`

Use `statement` for short sites that benefit from stronger headings, generous
spacing, prominent media, and wide card lists. It suits focused editorial
presentations, campaigns, and concise public statements. Its spacious rhythm
is not intended for dense documentation or a large reference hierarchy.

```yaml
preset: statement
```

| Setting | Preset value |
| --- | --- |
| `palette` | `warm-paper` |
| `appearance.default` | `system` |
| `typography.fontFamily` | `'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif` |
| `typography.profile` | `statement` |
| `typography.rhythm` | `airy` |
| `layout.textWidth` | `normal` |
| `layout.contentSpacing` | `spacious` |
| `layout.pageWidth` | `1280px` |
| `layout.gutter` | Desktop `clamp(1.5rem, 5vw, 4rem)`; mobile `1rem` |
| `images.presentation` | `centered-fit` |
| `images.width` | `1080px` |
| `images.maxAvailableWidthPercent` | Desktop and mobile `100` |
| `images.maxAvailableHeightPercent` | Desktop `80`; mobile `70` |
| `blocks.cardList.width` | `wide` |
| `corners` | `square` |
| `sections.backgroundPattern` | `accented`; resolves to `uniform` with tree navigation |
| Reader Display | Reading width always available; Appearance enabled; Focus reading disabled |

[Open the rendered `statement` example](https://janga.github.io/norna/examples/feature-demos/theme-preset-statement/).

The setting names and values above are defined in [Layout](#layout),
[Image Sizing](#image-sizing),
[Content Block Defaults](#content-block-defaults), [Typography](#typography),
[Palette And Appearance](#palette-and-appearance), [Corners](#corners),
[Section Backgrounds](#section-backgrounds), and [Reader Display
Controls](#reader-display-controls). See
[Navigation](pages.md#navigation) for when automatic navigation resolves to a
tree.

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

`images` controls how standalone `norna-image-stack` and
`norna-image-carousel` blocks relate to the body text and how much space they
may use. Card-list images follow their card layout instead.

The body text and media area sit inside the page's content canvas. The content
canvas is the horizontal space available to the current page after any
persistent navigation rail and its gap have been excluded. The body text may
use a narrower reading width inside it; the media area may be broader.

`images.presentation` accepts two methods:

| Value | Placement and sizing |
| --- | --- |
| `prose-aligned` | Start the image and its caption at the body-text edge. The image may extend to the right into the media area and is sized from available horizontal space without a viewport-height limit. |
| `centered-fit` | Center the media frame, rendered image and caption on the same horizontal axis. Fit the image within both the available width and a configured share of the viewport height. |

The selected preset supplies the normal method. `documentation` and `project`
use `prose-aligned`; `portfolio` and `statement` use `centered-fit`. Without a
preset or explicit value, Norna uses `prose-aligned`.

Navigation does not select another image-presentation method. With tree
navigation, Norna removes the persistent rail and its gap from the available
content canvas before positioning media. `prose-aligned` retains the body-text
edge, while `centered-fit` remains centered in the space that is left. Norna
never centers either method against the complete browser viewport.

If viewport-height fitting makes a portrait `centered-fit` image narrower than
its frame, the image and visible caption remain centered on the frame's axis.
Neither method crops an image or changes its intrinsic proportions by default.
Both return to the available content width on narrow screens.

A root or page theme can override the method for all standalone image stacks
and carousels in its scope:

```yaml
images:
  presentation: prose-aligned
  width: 900px
  maxAvailableWidthPercent:
    desktop: 100
    mobile: 100
```

The size settings mean:

- `width`: maximum intended width of the image area for either method.
- `maxAvailableWidthPercent`: maximum share of available horizontal space for
  either method.
- `maxAvailableHeightPercent`: maximum share of viewport height for
  `centered-fit` only.

For a centered presentation with an explicit height limit:

```yaml
images:
  presentation: centered-fit
  width: 1080px
  maxAvailableWidthPercent: 100
  maxAvailableHeightPercent:
    desktop: 80
    mobile: 70
```

Each responsive percentage may also be one number. Norna rejects
`maxAvailableHeightPercent` with `prose-aligned` because the setting would have
no effect. Image presentation cannot be selected for an individual section,
block, or image.

## Content Block Defaults

`blocks` sets site-wide presentation defaults for structured Norna blocks when
their Markdown does not specify the same option. It does not add blocks to a
page or replace options written directly in Markdown.

The currently configurable block default is the maximum width of a complete
card list:

```yaml
preset: documentation
blocks:
  cardList:
    width: text
```

`blocks.cardList.width` accepts:

| Value | Effect |
| --- | --- |
| `text` | Match the active body-text width and follow the reader's current Display-panel width. |
| `narrow` | Limit the complete card list to at most `48rem`. |
| `normal` | Limit the complete card list to at most `56rem`. |
| `wide` | Allow the complete card list to use the available page-layout width. |

The width limits the complete list, not an individual card. Card layout,
responsive columns, and image placement remain controlled by the
`norna-card-list` options in the page content.

When `blocks.cardList.width` is omitted, the selected preset supplies it:

| Preset | Card-list width |
| --- | --- |
| `portfolio` | `wide` |
| `documentation` | `text` |
| `project` | `normal` |
| `statement` | `wide` |

Without a preset or an explicit root setting, Norna uses `normal`. A `width`
written inside one `norna-card-list` block overrides the root default for that
list only. Page and category themes cannot change `blocks`; this keeps the
site's normal treatment of structured blocks consistent while allowing a
specific list to be an intentional exception.

The setting does not affect image stacks or carousels. Their placement and
available width come from [Image Sizing](#image-sizing). See [Card
List](content.md#card-list) for Markdown syntax and per-list options.

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

Use `npm run norna:typography:profiles` to inspect built-in values and
`npm run norna:typography:show` to inspect the resolved site typography. See
[Typography](typography.md) for every override field.

## Palette And Appearance

Norna separates two related choices. A `palette` selects the coordinated colors
used for page backgrounds, section surfaces, text, links, navigation, controls,
code, status messages, and focus indicators. `appearance` selects whether the
palette starts with its light variant, its dark variant, or the variant preferred
by the visitor's operating system. Changing either choice does not change
typography, spacing, corners, or media sizing.

### Palette

Set `palette` in the root `site/theme.yaml`:

```yaml
preset: documentation
palette: forest-moss
```

Every built-in palette provides coordinated light and dark variants. The
default appearance in the table applies only when neither a preset nor an
explicit `appearance.default` supplies another default.

| Value | Color character | Palette default appearance |
| --- | --- | --- |
| `near-monochrome` | Neutral grays and off-whites with almost no visible hue. | Dark |
| `warm-paper` | Warm off-whites and browns resembling paper and ink. | Light |
| `retro-earth` | Earthy ochres, olives, and warm neutrals with a subdued retro character. | Light |
| `clay-rose` | Muted clay, rose, and wine tones with a warm editorial character. | Light |
| `forest-moss` | Botanical greens, mossy surfaces, and warm lichen neutrals. | Light |
| `mineral-teal` | Cool mineral greens with muted teal accents and pale aqua-gray surfaces. | Light |
| `arctic-blue` | Cool blue-gray surfaces with clear, restrained blue accents. | Light |
| `soft-lavender` | Quiet lavender surfaces with low-key mauve accents. | Light |
| `vivid-night` | Indigo surfaces with a brighter cyan accent and a dark-first character. | Dark |

Omit `palette` to use the selected preset's palette. Without a preset, Norna
uses `near-monochrome`. The palette is site-wide so navigation, page content,
controls, and status surfaces retain one visual identity. Page and category
themes cannot select another palette.

[Open the Theme explorer](https://janga.github.io/norna/examples/theme-presets/)
to apply every palette to the same representative content and combine it with
each built-in preset.

### Appearance

`appearance.default` selects what a visitor sees when the browser has no stored
choice for this site:

```yaml
appearance:
  default: system
```

| Value | Effect |
| --- | --- |
| `system` | Follow the visitor's operating-system light or dark preference. |
| `light` | Use the palette's light variant. |
| `dark` | Use the palette's dark variant. |

Omit `appearance` to use the selected preset's default. Without a preset, Norna
uses the palette default shown above. Overriding a preset's palette does not
replace the preset's appearance default.

Current preset defaults are:

| Preset | Palette | Default appearance | Appearance choice in Display |
| --- | --- | --- | --- |
| `portfolio` | `near-monochrome` | `dark` | Enabled |
| `documentation` | `warm-paper` | `system` | Enabled |
| `project` | `near-monochrome` | `system` | Enabled |
| `statement` | `warm-paper` | `system` | Enabled |

A preset supplies both a palette and a default appearance. Overriding only
`palette` keeps the preset's default appearance; set both when both choices
should change.

Appearance belongs to the root theme because navigation, page frame, section
backgrounds, controls, and text must change together. Page-local themes cannot
override it. Norna does not expose arbitrary colors for individual appearance
variants.

## Reader Display Controls

Every Norna site lets readers choose Narrow, Standard, or Wide in the
site-wide Display panel. This bounded reading-width choice is part of the
engine and cannot be disabled by a theme. The preset or `layout.textWidth`
selects the initial width; the reader may temporarily choose another one.

`readerControls` adds the optional Appearance and Focus reading choices. Reader
choices adapt the resolved theme; they do not edit `theme.yaml`, replace the
preset, or change the content order.

Configure the controls in the root `site/theme.yaml`:

```yaml
preset: documentation
readerControls:
  appearance: true
  focusReading: true
```

The Display panel then contains:

| Choice | Availability | Configured default |
| --- | --- | --- |
| Reading width | Always | Derived from `layout.textWidth`: `narrow`, `normal`, or `wide` |
| Appearance | When `readerControls.appearance` is `true` | `appearance.default`, or the preset default |
| Focus reading | When `readerControls.focusReading` is `true`, or navigation resolves to `tree` | Off |

Narrow, Standard, and Wide limit prose to approximately `60ch`, `72ch`, and
`80ch` respectively. Media keeps its separately configured width. Focus reading
hides navigation, breadcrumbs, and the footer while leaving the Display control
available so the reader can return to the normal view. Norna preserves the
visible reading position when reading width or focus reading changes, except
when the reader is already at the top of the page.

Built-in presets choose these starting widths and optional controls:

| Preset | Initial reading width | Appearance | Focus reading |
| --- | --- | --- | --- |
| `portfolio` | Wide | Enabled | Disabled |
| `documentation` | Narrow | Enabled | Enabled |
| `project` | Standard | Enabled | Enabled |
| `statement` | Standard | Enabled | Disabled |

Omit `readerControls` to use the selected preset's optional controls. Set
`appearance` or `focusReading` to `false` to disable that preset control on sites
without tree navigation. Tree navigation always offers Focus reading so readers
can temporarily remove the persistent tree and other secondary page chrome. A
root theme without a preset still provides reading width, but does not add an
Appearance or Focus reading control unless explicitly enabled or required by
tree navigation.
Page-local themes cannot change `readerControls`.

Reader choices are stored in first-party cookies:

| Choice | Cookie | Stored values |
| --- | --- | --- |
| Appearance | `norna-appearance` | `system`, `light`, `dark` |
| Reading width | `norna-reading-width` | `narrow`, `standard`, `wide` |
| Focus reading | `norna-focus-reading` | `off`, `on` |

Each cookie is limited to the site's configured base path, uses `SameSite=Lax`,
and expires after one year. HTTPS sites also mark it `Secure`. This keeps a
choice for later visits without sharing it with another Norna site under a
different path on the same domain. Reset removes all three cookies and restores
the configured defaults.

Without JavaScript, the configured Appearance and initial reading width still
apply. The reader cannot change or persist Display choices, and focus reading
remains off. Norna includes the reader-preference script on every page so the
universal reading-width choice can work and persist. See
[Client-Side JavaScript](client-javascript.md) for the complete progressive-
enhancement boundary and
[Presentation Guarantees](presentation-guarantees.md) for the engine limits
that presets and reader choices cannot weaken.

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
when readers enable focus reading.

Omit `sections.backgroundPattern` to use the selected preset. Without a preset,
Norna uses `uniform`. Built-in presets resolve to `uniform` automatically when
navigation resolves to `tree`. A local setting overrides the root pattern for
pages below its page or category directory. An explicit root or local override
requesting `alternating` or `accented` with tree navigation is invalid; remove
the override or select `uniform`. Cards, code blocks, banners, and callouts may
still use their own coordinated backgrounds.

## Page Themes

Add `theme.yaml` to a non-home page or navigation-category directory only when
that part of the hierarchy needs a narrower presentation adjustment:

```text
site/pages/010-guide/theme.yaml
```

For a category, the same file applies to its descendant pages even though the
category has no rendered page of its own:

```text
site/pages/010-guides/category.yaml
site/pages/010-guides/theme.yaml
site/pages/010-guides/pages/010-installation/content.md
```

A page theme may set only:

- `layout.textWidth`
- `layout.contentSpacing`
- managed-image presentation and sizing under `images`
- `sections.backgroundPattern` when the site does not use tree navigation

For example:

```yaml
layout:
  textWidth: narrow
  contentSpacing: compact
images:
  presentation: prose-aligned
  width: 760px
sections:
  backgroundPattern: uniform
```

Local settings are merged with the root theme and inherited by descendant
pages. A more local page or category theme may override the same limited
fields. Site colors, corners, typography, page width, gutters, root content
block defaults, and navigation remain constant.

If `navigation.mode` is `automatic`, adding enough page or heading depth can
make the site resolve to tree navigation. A non-uniform page override must then
be removed or changed to `uniform`.

Page and category themes cannot define `preset`, `palette`, `corners`,
`typography`, `blocks`, `navigation`, `config.yaml`, or site-wide content. This
boundary keeps one recognisable site while still allowing a guide, gallery, or
reference area to use an appropriate reading width and media presentation.
