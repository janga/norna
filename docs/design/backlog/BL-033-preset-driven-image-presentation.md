# BL-033: Preset-Driven Managed Image Presentation

## Outcome

Norna chooses an appropriate presentation method for managed images as part of
the selected theme preset. Authors should not have to classify every image or
repair the layout with arbitrary widths and alignment values.

The initial model has two image-presentation methods:

- `reading` treats images as supporting material in a reading flow;
- `showcase` treats images as prominent visual content.

The resolved theme applies one method consistently to the page. A page can
override its preset when its role genuinely differs from the rest of the site.
Individual sections and images do not select presentation methods in the first
implementation.

## Evidence

`BL-032` provides the first concrete case. Its portrait file-tree diagram is
rendered inside a media frame that starts at the prose edge and is wider than
the prose column. The existing viewport-height limit makes the image narrower
than that frame, after which the normal centering rule makes it appear shifted
to the right.

Changing the SVG to a landscape format would conceal the product-level issue.
The relationship being explained naturally benefits from a taller diagram. Its
presentation should follow the purpose of the selected site design rather than
an accidental property such as file format or aspect ratio.

## Design Rationale

The preset already expresses the intended kind of site. It is therefore the
most predictable place to choose the normal relationship between prose and
images:

- documentation and project sites primarily support reading and explanation;
- portfolio and statement sites give visual material a more prominent role.

This keeps image placement consistent, reduces author decisions, and lets Norna
choose tested geometry for desktop, mobile, tree navigation, reader widths, and
captions. Image format cannot provide the same information: SVG, PNG, and JPEG
can each contain either explanatory material or artwork.

Accessibility semantics remain separate from visual presentation. Alternative
text describes the image in its current context; it must not be inferred from
or replaced by `reading` or `showcase`.

## Preset Defaults

| Preset | Image presentation | Reason |
| --- | --- | --- |
| `documentation` | `reading` | Diagrams and screenshots normally support sequential prose and benefit from a stable reading edge. |
| `project` | `reading` | Explanations, code, screenshots, and product images should remain part of one balanced content flow. |
| `portfolio` | `showcase` | Artwork and project imagery are normally primary content and should receive a broad, centered media area. |
| `statement` | `showcase` | A small number of expressive images should carry visual weight in a spacious presentation. |

The paired presets share a presentation method, not a complete layout.
Typography, rhythm, text width, image width, and spacing continue to distinguish
`documentation` from `project` and `portfolio` from `statement`.

When no preset or explicit image presentation is present, the engine default is
`reading`.

## Presentation Contract

### Reading

- Align the image, caption, and surrounding content to a stable reading axis.
- Let the image start at the prose edge and extend to the right into the
  available media area when additional width is useful.
- Determine inline size from available width and the resolved image-width
  settings. A viewport-height limit must not make a portrait image drift toward
  the horizontal center.
- Preserve intrinsic proportions and never crop by default.
- Use the available content width on narrow screens.

### Showcase

- Center the image in the resolved media area.
- Allow the preset's broader image width to take visual priority over the prose
  column.
- Preserve intrinsic proportions and constrain both available width and
  viewport height so large artwork remains inspectable without dominating the
  viewport accidentally.
- Never crop by default.
- Use the available content width on narrow screens.

Both methods must keep captions attached to their image and must behave
predictably for portrait, landscape, square, SVG, and raster sources.

## Configuration Contract

Presets provide the normal value. An explicit override belongs under `images`
in the root or page theme:

```yaml
preset: documentation
images:
  presentation: showcase
```

The public values are:

```text
reading
showcase
```

A page-theme override applies to all standalone managed-image blocks on that
page. The first implementation must not add:

- section-level image presentation;
- per-image purpose or presentation fields;
- arbitrary alignment controls;
- arbitrary block-local widths;
- inference from file format, filename, dimensions, or aspect ratio.

If real sites later demonstrate a frequent need to mix the two methods on one
page, evaluate one named block-level exception. Do not introduce section
metadata merely to control image geometry.

## Component Scope

The first implementation applies to:

- `norna-image-stack`;
- `norna-image-carousel`.

Each component interprets the same page-level method through its own layout,
while retaining its established caption and control behavior. Card-list images
are excluded because the selected card layout already owns their relationship
to card text.

## Existing Size Settings

The existing image-width settings remain useful as bounded overrides inside the
chosen method. Implementation and documentation must make their interaction
explicit:

- `images.width` limits the intended media width for both methods;
- `images.maxAvailableWidthPercent` limits available horizontal space for both
  methods;
- `images.maxAvailableHeightPercent` constrains `showcase` media and must not
  silently shrink or recenter `reading` media.

Reading-oriented built-in profiles should not depend on a viewport-height value
for their normal geometry. Validation should reject combinations that have no
effect rather than accepting misleading configuration.

## Architecture Impact

Implementation is expected to affect:

- theme schemas and generated editor schemas;
- preset and media-profile definitions;
- root and page-theme merge rules;
- resolved visual-theme types and CSS custom properties;
- image-stack and carousel markup or semantic CSS classes;
- image and theme reference documentation;
- preset reference generation;
- browser and configuration tests.

It should not require changes to Markdown image entries, raster generation,
cache busting, image sync, or SVG copying. Those systems operate on source
assets; this feature changes the resolved layout of their output.

## Acceptance Criteria

- Every built-in preset supplies an explicit image-presentation method.
- Sites without a preset resolve deterministically to `reading`.
- A root or page theme can override the preset with `images.presentation`.
- No new field is added to individual image entries or section metadata.
- Documentation and project pages use a stable reading edge for managed images.
- Portfolio and statement pages retain broad, centered visual presentation.
- A portrait explanatory image is not right-shifted because a viewport-height
  limit reduced its inline size inside a centered frame.
- Stack and carousel layouts both honor the resolved method.
- Card-list image geometry remains unchanged.
- Images preserve intrinsic proportions and remain within the viewport at 320
  CSS pixels and at 200 percent text zoom.
- Tree, top, section, and no-navigation layouts produce predictable geometry.
- Reader-width and focus-reading changes preserve the visible reading position.
- Light, Dark, forced-colors, keyboard-only, and no-JavaScript behavior remain
  usable.
- Existing alt-text and caption behavior remains intact.
- `BL-032` can use the resulting contract without aspect-ratio padding or a
  one-off CSS selector.

## Test Plan

Create representative pages for both methods containing:

- a portrait explanatory SVG;
- a landscape raster screenshot;
- a portrait photograph;
- a landscape artwork image;
- an image stack and a carousel;
- captions and surrounding prose;
- tree navigation and reader Display controls.

Verify resolved preset and override values in unit tests. In browser tests,
verify computed inline origins, widths, height constraints, aspect ratios, and
reading-position stability rather than relying only on screenshots. Capture
desktop and mobile reference images for human review and retain no-JavaScript
rendering assertions.
