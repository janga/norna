# BL-057: Automatic Carousel Viewport Fitting

## Outcome

An image carousel presents each slide as one composition that can be understood
without scrolling through the image itself. Norna therefore limits carousel
height automatically, independently of whether the selected preset aligns
managed images with the prose or centers them in the media area.

Tall images that must remain large enough to read progressively belong in an
`image-stack` or on a dedicated page. This item must not impose the carousel
contract on image stacks.

## User Need

A portrait image can otherwise make a width-driven carousel considerably
taller than the screen. The reader loses the image controls and caption while
looking at the slide, and a small raster source may be enlarged unnecessarily.
Authors should not need to retake an image or add a page-specific theme merely
to make a normal carousel fit the browser.

## Presentation Contract

- Constrain every carousel stage by both available width and an engine-owned
  share of the small viewport height.
- Preserve the selected horizontal presentation: `prose-aligned` carousels
  retain the prose edge and `centered-fit` carousels remain centered.
- Preserve intrinsic proportions and show the complete image without cropping.
- Keep previous/next controls inside the bounded stage and keep the visible
  caption directly below it.
- Leave enough of the viewport outside the stage for sticky navigation,
  controls, caption, and normal content spacing.
- Use the existing centered-fit height setting when one is resolved. Otherwise
  use Norna's established desktop and mobile image-height defaults.
- Do not add block-local dimensions, alignment fields, or layout JavaScript.
- Do not change `image-stack` sizing or its ability to present a tall image that
  readers inspect while scrolling.

## Architecture

The carousel already knows the most restrictive intrinsic aspect ratio among
its slides. Use that ratio and the resolved viewport-height percentage to
derive a maximum inline size in static markup. CSS then combines that value
with the existing content-canvas width and retains the presentation method's
horizontal alignment.

This remains a static layout contract. Embla continues to provide only slide
interaction and must not be required to calculate image size.

## Acceptance Criteria

- A portrait carousel using `prose-aligned` presentation is no taller than 74
  percent of the small viewport height on desktop or 68 percent on mobile.
- A `centered-fit` carousel continues to honor its resolved configurable height
  percentage.
- Landscape, square, and portrait slides preserve their aspect ratios and are
  not cropped.
- Controls stay over the image stage and captions stay attached below it.
- Horizontal alignment remains prose-aligned or centered according to the
  selected image presentation.
- Image stacks retain their current width-driven and centered-fit behavior.
- The no-JavaScript carousel fallback receives the same bounded geometry.
- Static-HTML and browser geometry tests cover prose-aligned and centered-fit
  carousels on desktop and narrow screens.

## Documentation Gate

This changes visible media layout. Update the image-sizing reference and the
rendered media explanation after human review confirms the portrait carousel
at the documentation site's `Add top-level pages` example.
