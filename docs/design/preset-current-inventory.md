# Current Preset Inventory

This document records the theme and preset system before the profile-based
redesign described in the [Preset Design Guide](preset-design-guide.md) and
[Preset Development Plan](preset-development-plan.md).

The corresponding desktop, mobile, light, and dark screenshots are in
[Preset Visual Baselines](../../tests/preset-baselines/README.md).

It is a Phase 0 inventory, not a specification of future behavior. The values
below were read from Norna `0.7.18` at Git commit `5e84890`. No visual or
functional change is proposed by recording them.

## Summary

Norna currently has four public presets:

- `portfolio`
- `documentation`
- `project`
- `statement`

Each preset is a complete nested object containing color mode, shape, layout,
image, typography, palette, and section-surface values. The current model works,
but the inventory exposes five structural issues:

1. complete preset objects repeat many identical values;
2. reusable profiles exist for some categories but not for geometry or media;
3. theme resolution is split between two resolver paths;
4. public raw overrides expose lower-level values than the intended preset
   model requires;
5. several visible component decisions live directly in CSS and therefore are
   neither semantic engine tokens nor deliberate preset choices.

The presets are distinct, but some distinctions are incidental rather than
recorded design intent. In particular, every preset uses `medium` for every
text level. Their typographic differences currently come from font stacks,
weights, line heights, and spacing, while the actual responsive size scale is
hard-coded in the renderer.

Current public metadata is:

| Name | Title | CLI and schema description |
| --- | --- | --- |
| `portfolio` | Portfolio | For portfolios and image-led sites, with restrained typography and generous space for images. |
| `documentation` | Documentation | For guides and reference material, with reading-focused typography and compact spacing. |
| `project` | Project | For project and product sites that balance explanation, code, cards, and images. |
| `statement` | Statement | For short, expressive sites, with larger typography, airy spacing, and stronger section emphasis. |

## Resolution Pipeline

The current pipeline is:

```text
theme.yaml
    -> strict root-theme schema validation
    -> deep merge with a complete preset object
    -> two separate resolver paths
       -> visual resolver: geometry, media, font family, shape
       -> presentation resolver: palette, color mode, surfaces, typography
    -> optional inherited page-theme merge
    -> CSS variables and component properties
```

Important implementation locations:

| Responsibility | Current implementation |
| --- | --- |
| Public preset recipes and root merge | `scripts/lib/theme-presets.mjs` |
| Typography profiles and rhythm | `scripts/lib/typography.mjs` |
| Color systems, surfaces, and text-width mapping | `scripts/lib/presentation.mjs` |
| Layout, media, font, and shape resolution | `scripts/lib/project-config.mjs` |
| Root and page theme schemas | `scripts/lib/schema-definitions.mjs` |
| Page-theme inheritance | `src/lib/pageThemes.ts` |
| Root plus page-theme consumption | `src/components/SitePage.astro` |
| Responsive type-size lookup and section tokens | `src/components/SiteSection.astro` |
| Document-level CSS variables and color-mode behavior | `src/layouts/BaseLayout.astro` |
| Component styling and remaining hard-coded values | `src/styles/global.css` |

`resolveThemeConfig()` deep-merges a root theme over its selected preset.
Page themes use a separate allowlist and may override only selected layout,
image, and section fields. Page-theme values are collected from every ancestor
page directory and inherited by descendants.

## Complete Preset Matrix

The following table contains every leaf value stored directly in the four
preset recipes.

| Field | `portfolio` | `documentation` | `project` | `statement` |
| --- | --- | --- | --- | --- |
| `colorMode.default` | `dark` | `system` | `system` | `system` |
| `readerControls.appearance` | `true` | `true` | `true` | `true` |
| `readerControls.readingWidth` | `false` | `true` | `true` | `false` |
| `readerControls.focusReading` | `false` | `true` | `true` | `false` |
| `shape` | `square` | `soft` | `soft` | `square` |
| `layout.contentSpacing` | `normal` | `compact` | `compact` | `spacious` |
| `layout.textWidth` | `wide` | `narrow` | `normal` | `normal` |
| `layout.pageWidth` | `1240px` | `1240px` | `1120px` | `1280px` |
| `layout.localNavigationGap` | `clamp(1rem, 2vw, 1.75rem)` | `clamp(1rem, 2vw, 1.5rem)` | `clamp(1rem, 2vw, 1.5rem)` | `clamp(1rem, 2vw, 1.75rem)` |
| `layout.noteWidth` | `13rem` | `12rem` | `12rem` | `13rem` |
| `layout.noteGap` | `1.5rem` | `1.25rem` | `1.25rem` | `1.75rem` |
| `layout.gutter.desktop` | `clamp(1.25rem, 4vw, 3rem)` | same | same | `clamp(1.5rem, 5vw, 4rem)` |
| `layout.gutter.mobile` | `1rem` | `1rem` | `1rem` | `1rem` |
| `images.width` | `1000px` | `920px` | `840px` | `1080px` |
| `images.maxAvailableWidthPercent.desktop` | `100` | `100` | `100` | `100` |
| `images.maxAvailableWidthPercent.mobile` | `100` | `100` | `100` | `100` |
| `images.maxAvailableHeightPercent.desktop` | `78` | `74` | `70` | `80` |
| `images.maxAvailableHeightPercent.mobile` | `68` | `68` | `62` | `70` |
| `typography.fontFamily` | `'Helvetica Neue', Arial, sans-serif` | `Georgia, 'Times New Roman', serif` | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | `'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif` |
| `typography.profile` | `restrained` | `reading` | `reading` | `statement` |
| `typography.rhythm` | `normal` | `compact` | `compact` | `airy` |
| `palette` | `dark` | `paper` | `light` | `paper` |
| `sections.backgroundPattern` | `uniform` | `alternating` | `alternating` | `cycling` |

### Repetition And Clustering

The preset source contains 21 leaf fields. Repetition is concentrated as
follows:

- all four presets set `readerControls.appearance: true`;
- `documentation` and `project` also enable reading-width and focus-reading controls;
- all four set managed-image maximum width to `100%` on desktop and mobile;
- all four set the mobile gutter to `1rem`;
- `portfolio`, `documentation`, and `project` share the same desktop gutter;
- `documentation` and `project` share shape, structural spacing, typography
  profile, typography rhythm, navigation gap, note width, note gap, and section
  pattern;
- `portfolio` and `statement` share square geometry and the wider navigation and
  note-column cluster;
- every preset selects a unique font stack and image width even when it shares
  the surrounding profile.

The four image widths and viewport-height limits form an ordered scale, but are
stored as unrelated raw values. The geometry values form recognizable clusters,
but no geometry profile currently represents those clusters.

## No-Preset Fallback

A root `theme.yaml` can omit `preset`. The resolver then supplies this separate
fallback configuration:

| Category | Fallback |
| --- | --- |
| Color system | `dark`, dark mode, no reader selector |
| Shape | `soft` (`2px`, `6px`, `8px`) |
| Content spacing | `normal` |
| Text width | `normal` |
| Page width | `1180px` |
| Local navigation gap | `clamp(1.5rem, 3vw, 3rem)` |
| Note width and gap | `12rem`, `1.25rem` |
| Gutter | `clamp(1.25rem, 4vw, 3rem)` desktop, `1rem` mobile |
| Managed image | `900px`, `100%` width, `74svh` desktop, `68svh` mobile |
| Font | `Arial, 'Helvetica Neue', Helvetica, sans-serif` |
| Typography | `restrained` plus `normal` rhythm |
| Section surfaces | `uniform` |

This is effectively a fifth visual recipe, but it has no public name, metadata,
example, or explicit test identity.

## Existing Internal Profiles

### Structural Content Spacing

`layout.contentSpacing` expands to six responsive values.

| Profile | Token | Desktop | Mobile |
| --- | --- | --- | --- |
| `compact` | block gap | `1.25em` | `1.1em` |
| `compact` | first-section top | `clamp(1rem, 2vw, 1.75rem)` | `1rem` |
| `compact` | heading to structured block | `0.65em` | `0.6em` |
| `compact` | image-stack gap | `clamp(1rem, 2vw, 1.5rem)` | `1.25rem` |
| `compact` | section gap | `clamp(1.2rem, 2.4vw, 2.25rem)` | `1.25rem` |
| `compact` | final-section bottom | `clamp(1.2rem, 2.4vw, 2.25rem)` | `1.25rem` |
| `normal` | block gap | `1.5em` | `1.25em` |
| `normal` | first-section top | `clamp(1.25rem, 3vw, 2.5rem)` | `1.25rem` |
| `normal` | heading to structured block | `0.75em` | `0.7em` |
| `normal` | image-stack gap | `clamp(1.25rem, 2.8vw, 2rem)` | `1.5rem` |
| `normal` | section gap | `clamp(1.4rem, 3vw, 2.75rem)` | `1.5rem` |
| `normal` | final-section bottom | `clamp(1.4rem, 3vw, 2.75rem)` | `1.5rem` |
| `spacious` | block gap | `1.75em` | `1.5em` |
| `spacious` | first-section top | `clamp(2rem, 5vw, 4rem)` | `1.5rem` |
| `spacious` | heading to structured block | `0.9em` | `0.8em` |
| `spacious` | image-stack gap | `clamp(1.5rem, 3.5vw, 2.75rem)` | `2rem` |
| `spacious` | section gap | `clamp(2.25rem, 5vw, 4.5rem)` | `2rem` |
| `spacious` | final-section bottom | `clamp(2.25rem, 5vw, 4.5rem)` | `2rem` |

The CSS file contains different fallback values for several of these variables.
Normal rendering always receives resolver output from `BaseLayout.astro`, so the
CSS values are safety fallbacks rather than a second active profile. Their drift
is nevertheless a maintenance risk.

### Typography Profiles

All headings and body text are left-aligned in every current profile. Every
heading, body, and caption size is `medium`. The table therefore records the
remaining profile differences as `weight / line-height`; body also records its
profile width and captions their alignment.

| Profile | H1 | H2 | H3 | H4 | Body | Caption |
| --- | --- | --- | --- | --- | --- | --- |
| `restrained` | `400 / 1.04` | `400 / 1.08` | `500 / 1.35` | `400 / 1.5` | `normal / 1.5` | `center / 1.35` |
| `dense` | `500 / 1.04` | `500 / 1.08` | `600 / 1.3` | `500 / 1.42` | `wide / 1.42` | `center / 1.25` |
| `reading` | `500 / 1.06` | `500 / 1.12` | `500 / 1.35` | `400 / 1.55` | `narrow / 1.62` | `left / 1.4` |
| `statement` | `600 / 1.02` | `600 / 1.04` | `600 / 1.18` | `500 / 1.42` | `narrow / 1.42` | `center / 1.3` |

`dense` is available through public configuration and the typography CLI, but
no built-in preset uses it.

`layout.textWidth` overwrites the body width from the typography profile. This
means the `reading` profile resolves to `narrow` in `documentation` but to
`normal` in `project`. Every built-in preset sets `layout.textWidth`, so the
body-width value embedded in its typography profile is not authoritative.

### Typography Rhythm

| Rhythm | H1 after | H2 after | H3 before / after | H4 before / after | Paragraph | Caption before |
| --- | --- | --- | --- | --- | --- | --- |
| `compact` | `0.4em` | `0.45em` | `1.2em / 0.4em` | `0.9em / 0.35em` | `0.65em` | `0.35em` |
| `normal` | `0.5em` | `0.55em` | `1.5em / 0.5em` | `1.1em / 0.4em` | `0.85em` | `0.5em` |
| `airy` | `0.65em` | `0.7em` | `1.9em / 0.6em` | `1.35em / 0.5em` | `1em` | `0.65em` |

H1 and H2 spacing before is `0` in every rhythm. Structural spacing and
typography rhythm are two independent public systems with overlapping concepts:
`compact/normal/spacious` and `compact/normal/airy`. Built-in presets always pair
matching directions, but arbitrary public combinations are accepted.

### Responsive Type Sizes

The renderer maps `small`, `medium`, `large`, and `xlarge` to level-specific
responsive sizes. Since every preset uses `medium`, these are the effective
preset sizes:

| Text role | Desktop | Mobile |
| --- | --- | --- |
| H1 | `clamp(1.65rem, 1.35rem + 1.1vw, 2.4rem)` | `clamp(1.5rem, 1.22rem + 1.4vw, 2rem)` |
| H2 | `clamp(1.35rem, 1.1rem + 0.9vw, 2rem)` | `clamp(1.3rem, 1.05rem + 1.35vw, 1.75rem)` |
| H3 | `clamp(1.05rem, 0.98rem + 0.28vw, 1.22rem)` | `clamp(1.04rem, 0.98rem + 0.45vw, 1.18rem)` |
| H4 | `clamp(0.96rem, 0.94rem + 0.08vw, 1rem)` | same |
| Body | `clamp(0.96rem, 0.94rem + 0.08vw, 1rem)` | same |
| Caption | `clamp(0.86rem, 0.84rem + 0.08vw, 0.92rem)` | same |

The size scale is an engine table inside `SiteSection.astro`, not part of a
typography profile. H1 and H2 are always uppercased by CSS; H3 is uppercased and
receives a top rule. Those treatments are also global rather than profile
choices.

The public `statement` description promises "larger typography", but its size
tokens are the same `medium` values as every other preset. Its current
difference is stronger weight, tighter heading line height, a different font
stack, and airier spacing rather than larger type.

### Text Width

| Named value | Effective CSS width |
| --- | --- |
| `narrow` | `min(60ch, var(--text-width))` |
| `normal` | `min(72ch, var(--text-width))` |
| `wide` | `min(72ch, var(--image-layout-width))` |

`--text-width` defaults to `680px`. Even `wide` remains capped at `72ch`; its
difference is that it may use the managed-image area rather than the fixed text
width.

### Shape

| Shape | Small radius | Medium radius | Large radius |
| --- | --- | --- | --- |
| `square` | `0` | `0` | `0` |
| `soft` | `2px` | `6px` | `8px` |

The shape tokens currently affect the color-mode menu, navigation disclosure
surfaces, code blocks, and cards. Deliberately pill-shaped controls and badges
continue to use `999px` under both profiles.

### Section Surfaces

| Pattern | Sequence |
| --- | --- |
| `uniform` | `base` |
| `alternating` | `base`, `soft` |
| `cycling` | `base`, `soft`, `emphasis` |

The page-title H1 always uses `base`. H2 sections then cycle through the active
sequence independently of the H1.

## Color Systems

Every color system contains coordinated light and dark modes. Consequently,
the current names `dark` and `light` describe palette character and default
mode imperfectly: `dark` still has a light variant and `light` still has a dark
variant.

Surface text is the same primary text color on `base`, `soft`, and `emphasis`.
`base` has the same background as the page.

| Palette / mode | Page and base | Soft surface | Emphasis surface | Primary text | Muted | Accent |
| --- | --- | --- | --- | --- | --- | --- |
| `dark` / light | `#f7f7f5` | `#ececea` | `#dadad6` | `#171717` | `#666660` | `#4b4b46` |
| `dark` / dark | `#000000` | `#171717` | `#252525` | `#f2eee6` | `#aaa49a` | `#d8d2c8` |
| `light` / light | `#ffffff` | `#f1f4f2` | `#dde7e1` | `#17201d` | `#5e655f` | `#38645a` |
| `light` / dark | `#0f1512` | `#17211c` | `#223129` | `#edf4ef` | `#aab8b0` | `#a9d2c4` |
| `paper` / light | `#f8f5ee` | `#ebe5d9` | `#ded4c5` | `#272522` | `#746e63` | `#685a43` |
| `paper` / dark | `#1b1916` | `#25211c` | `#342d25` | `#f3ede2` | `#b9ad9c` | `#d5bea0` |

| Palette / mode | UI surface | UI soft | Border | Navigation background | Navigation separator |
| --- | --- | --- | --- | --- | --- |
| `dark` / light | `#eeeeeb` | `#d8d8d3` | `rgb(23 23 23 / 16%)` | `rgb(247 247 245 / 92%)` | `rgb(23 23 23 / 24%)` |
| `dark` / dark | `#101010` | `#302f2c` | `rgb(255 255 255 / 14%)` | `rgb(0 0 0 / 90%)` | `rgb(255 255 255 / 28%)` |
| `light` / light | `#f7f8f7` | `#d9dfda` | `rgb(0 0 0 / 14%)` | `rgb(255 255 255 / 92%)` | `rgb(0 0 0 / 20%)` |
| `light` / dark | `#151d19` | `#2c3b33` | `rgb(237 244 239 / 15%)` | `rgb(15 21 18 / 92%)` | `rgb(237 244 239 / 26%)` |
| `paper` / light | `#f0ebe1` | `#d8d0c4` | `rgb(39 37 34 / 18%)` | `rgb(248 245 238 / 92%)` | `rgb(39 37 34 / 24%)` |
| `paper` / dark | `#211e1a` | `#3b342b` | `rgb(243 237 226 / 16%)` | `rgb(27 25 22 / 92%)` | `rgb(243 237 226 / 26%)` |

Frame colors currently repeat page colors in every palette and mode.

### Contrast Snapshot

The following ratios use each opaque foreground against the least favorable of
page, base, soft, and emphasis backgrounds.

| Palette / mode | Primary minimum | Accent minimum | Muted minimum |
| --- | --- | --- | --- |
| `dark` / light | `12.79` | `6.26` | `4.12` |
| `dark` / dark | `13.25` | `10.20` | `6.19` |
| `light` / light | `13.16` | `5.29` | `4.74` |
| `light` / dark | `12.20` | `8.25` | `6.62` |
| `paper` / light | `10.43` | `4.58` | `3.45` |
| `paper` / dark | `11.64` | `7.56` | `6.15` |

Current automated tests check only each surface's primary text pair at `4.5:1`.
They do not test all semantic foreground roles on every surface. The muted role
therefore has untested combinations below `4.5:1`, notably on light paper
surfaces. Current component usage does not place every muted role on every
surface, but the token system does not prevent it.

## Resolved Preset Character

The effective combination for each preset is:

| Preset | Intended use | Main visual signals |
| --- | --- | --- |
| `portfolio` | Image-led portfolios | dark-first neutral palette, restrained Helvetica/Arial typography, wide text/media relationship, square shape, uniform surfaces |
| `documentation` | Guides and reference | paper palette, Georgia body and interface text, narrow reading measure, compact rhythm, soft shape, alternating surfaces |
| `project` | Project and product sites | green-neutral light palette, system font, normal reading measure, compact rhythm, smallest media area, soft shape, alternating surfaces |
| `statement` | Short expressive sites | paper palette, Trebuchet/Helvetica typography, spacious and airy rhythm, largest media area, square shape, three-surface cycling |

The typography profiles use one font family for prose, headings, navigation,
captions, and interface controls. The existing `--font-serif` fallback token is
not consumed. Font rendering also varies by operating system because all four
presets use installed system fonts rather than bundled web fonts.

## Consumer Map

| Source value | Expansion or resolver | Main consumer |
| --- | --- | --- |
| `preset` | Deep merge in `resolveThemeConfig()` | Both resolver paths |
| `colorMode.*` | `resolveThemePresentation()` | `BaseLayout.astro` mode attributes, selector, cookie, and CSS mode variables |
| `shape` | `resolveThemeVisualConfig()` to three radii | Menus, navigation disclosures, code blocks, cards |
| `layout.contentSpacing` | Six-value profile in `project-config.mjs` | Section, block, image, and final-page spacing CSS variables |
| `layout.textWidth` | Named CSS expression in `presentation.mjs` | Page prose width, section headings, body text, and caption bounds |
| `layout.pageWidth` | CSS length validation | Sticky navigation, page frame, footer, cards, media bounds, and tree-layout minimum |
| `layout.localNavigationGap` | CSS length validation | Gap between tree navigation and page content |
| `layout.noteWidth`, `layout.noteGap` | CSS length validation | Desktop margin-note column |
| `layout.gutter` | Responsive CSS length validation | Site frame and mobile navigation padding |
| `layout.spacing.*` | Responsive CSS length validation | Fine-grained structural spacing variables |
| `images.width` | CSS length validation | Image stack and carousel layout width |
| `images.maxAvailableWidthPercent` | Responsive percentage validation | Image stack and carousel horizontal cap |
| `images.maxAvailableHeightPercent` | Responsive percentage validation | Managed image and carousel viewport-height cap |
| `typography.fontFamily` | Font-family validation | One global font token used by body, headings, navigation, captions, and controls |
| `typography.profile` | Deep merge of a typography profile | Heading/body/caption weight, alignment, line height, and named size |
| `typography.rhythm` | Deep merge of rhythm values | Heading, paragraph, and caption spacing |
| `typography.overrides` | Deep merge after profile and rhythm | Fine-grained section CSS variables |
| `palette` | Light/dark semantic palette selection | Page, frame, sections, links, borders, and navigation CSS variables |
| `sections.backgroundPattern` | Surface-name sequence | H2 section backgrounds |

The split between visual and presentation resolvers means one conceptual theme
is parsed twice. Both paths call `resolveThemeConfig()` independently. This is
currently deterministic, but it makes a future profile recipe harder to reason
about and test as one resolved object.

## Root And Page Theme Scope

The strict root schema currently exposes:

- preset selection;
- color-mode default and selector availability;
- shape;
- named and raw layout values;
- named and raw managed-image values;
- font family, typography profile, rhythm, and fine-grained overrides;
- palette;
- section background pattern.

Three values present inside preset objects are intentionally not accepted as
root YAML fields: `layout.localNavigationGap`, `layout.noteWidth`, and
`layout.noteGap`. They are also omitted from `theme:export`. They already behave
like internal geometry-profile values even though the preset representation is
still a complete raw object.

Page-local `theme.yaml` files may currently set only:

- `layout.contentSpacing`;
- `layout.textWidth`;
- `images.width`;
- `images.maxAvailableWidthPercent`;
- `images.maxAvailableHeightPercent`;
- `sections.backgroundPattern`.

Page values inherit through all ancestor page directories. Palette, font,
typography profile, shape, color-mode behavior, page frame, and navigation
remain site-wide.

## Engine Values Outside Presets

Several visible choices are fixed in CSS or component code and therefore do
not belong to any current profile:

| Area | Current fixed behavior |
| --- | --- |
| Heading treatment | H1 and H2 are uppercase; H3 is uppercase with a top rule |
| Type scale | Complete responsive `small` through `xlarge` tables live in `SiteSection.astro` |
| Code blocks | `#0d1117` background, fixed padding, `0.92em` text, `1.45` line height |
| Warning banner | Yellow `#ffd84d` mixed into border and surface |
| Carousel chrome | Black translucent controls with white icons, fixed control sizes and shadows |
| Cards | Fixed size tables, `16 / 10` media frames, component-specific gaps and scaling |
| Notes | Fixed `1101px` margin-note breakpoint and `0.88em` text treatment |
| Navigation | Fixed blur, padding, transitions, menu geometry, and responsive breakpoints |
| Focus | Component-specific outlines and browser defaults rather than one semantic focus token |
| Shadows | Independent black-alpha values for menus, mobile panels, and carousel controls |

These are not necessarily defects. They identify values that Phase 1 must
classify as engine invariants, semantic tokens, or deliberate preset-derived
effects before preset recipes become smaller.

## Current Public Surface: Phase 0 Disposition

This is an audit recommendation for the next design phase, not an approved
schema change.

| Current field | Initial disposition | Reason |
| --- | --- | --- |
| `preset` | Retain | It is the intended one-line path. |
| `colorMode.default` | Retain as a named site-owner choice | It expresses a clear site default. |
| `readerControls` | Retain as bounded reader choices | Appearance, reading width, and focus reading belong together rather than inside visual identity. |
| `shape` | Retain as a named root choice | It is understandable and can remain accessibility-safe. |
| `palette` | Retain concept; review names | Named color systems are useful, but `dark` and `light` each contain both modes. |
| `layout.contentSpacing` | Retain concept as named rhythm | It is useful, but overlaps with typography rhythm and should resolve through one coordinated model. |
| `layout.textWidth` | Retain as a named root and page choice | It maps directly to a reading need. |
| `sections.backgroundPattern` | Retain as a named root and page choice | It is understandable and bounded. |
| `images.width` | Replace normally with media emphasis; retain only as a justified escape hatch | Raw length is too low-level for the common path. |
| Image width/height percentages | Internalize behind media profiles | Four presets currently encode a simple ordered scale as raw values. |
| `layout.pageWidth` | Internalize behind geometry; review need for an escape hatch | It affects navigation, page frame, media, and tree layouts together. |
| `layout.gutter` and `layout.spacing.*` | Internalize | These are implementation values that require coordinated testing. |
| `typography.fontFamily` | Internalize for built-ins; defer custom-font design | A raw stack does not provide a complete, portable typography system. |
| `typography.profile` and `typography.rhythm` | Make internal recipe categories | Site owners should normally choose a purpose preset or a simpler reading direction. |
| `typography.overrides` | Remove from the normal path or sharply restrict | Arbitrary alignment, size, line height, weight, and spacing undermine profile guarantees. |
| Hidden navigation/note geometry | Keep internal | They are already inaccessible to root YAML and belong in geometry profiles. |

Page-local variation should retain its current conceptual boundary: reading
width, content rhythm, media emphasis, and surface pattern. The raw image values
should become named media choices if the profile model is adopted.

## Candidate Profile Extraction

The current data supports these initial profile categories without changing
rendered output:

| Category | Current candidates | Inventory conclusion |
| --- | --- | --- |
| Color system | `dark`, `light`, `paper` | Already reusable; semantic roles and naming need hardening. |
| Typography | portfolio restrained sans, documentation reading serif, project reading system, statement expressive sans | Current `reading` profile is incomplete because font and width live elsewhere. Complete profiles would need to split documentation and project. |
| Rhythm | compact, normal, airy | Structural and typography rhythm should be coordinated rather than selected independently. |
| Geometry | one current cluster per preset | Values cluster, but there is not yet enough reuse to name stable geometry profiles without normalization. |
| Media | `840/70/62`, `920/74/68`, `1000/78/68`, `1080/80/70` | These can be ordered from text-led to increasingly image-led; whether four levels are useful requires visual review. |
| Shape | square, soft | Already a complete reusable profile. |
| Surfaces | uniform, alternating, cycling | Already a complete reusable profile. |

The least risky extraction order is therefore:

1. preserve color, shape, and surface definitions as profiles;
2. combine the two current rhythm systems while preserving output;
3. turn image dimensions into named media profiles;
4. create complete typography profiles that include font and scale;
5. normalize geometry only after representative desktop and mobile comparison.

## Test Coverage At The Baseline

`scripts/test-theme-presets.mjs` currently verifies:

- every preset resolves a complete set of expected fields;
- preset metadata and schema values agree;
- root overrides deep-merge over a preset;
- limited page themes inherit without replacing site identity;
- representative resolved values reach built HTML;
- `theme:presets`, `theme:export`, and typography inspection work;
- primary text on each section surface reaches `4.5:1` contrast.

Current gaps relevant to the redesign are:

- no complete semantic color-role contrast matrix;
- no test of focus visibility on every surface;
- no assertion that type relationships remain ordered;
- no explicit safe line-length invariant;
- visual baselines are references rather than pixel-perfect cross-platform
  assertions because presets use operating-system font stacks;
- no automated zoom, text-spacing, forced-color, or reflow checks per preset;
- no reader-width or focus-reading controls yet;
- no single test that resolves one unified semantic theme object;
- no explicit test that CSS safety fallbacks match resolver defaults.

The shared mobile stress fixture also records an existing reflow gap: a long
unbroken inline-code token widens a `390px` viewport to approximately `564px`.
Phase 1 should define and test the engine behavior for long words and code
without changing this Phase 0 baseline.

Example coverage exists for each public preset, but the examples do not all use
identical stress content. That limits direct visual comparison between presets.

## Phase 0 Conclusions

The current presets are usable complete configurations, but they are not yet
small recipes over a stable engine contract. The strongest existing reusable
units are palettes, shape, section surfaces, typography rhythm, and structural
spacing. Geometry and media are repeated raw clusters, while typography is
distributed across font stacks, profile data, layout width, renderer size
tables, and global CSS treatment.

No value should be tuned during the profile extraction itself. The first
implementation pass should preserve these resolved values, unify resolution,
and strengthen tests. Deliberate visual changes should begin only with the
separate documentation-preset proof of concept.
