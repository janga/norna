# BL-075: Align Persistent Captions With The Rendered Image Bottom

## Outcome

A persistent caption beside a tall image releases at the rendered image's
lower edge. Space retained to prevent page reflow does not extend the caption's
sticky boundary below the image.

## User Problem

Norna moves an eligible caption from below a tall image into an adjacent free
lane. It preserves the caption's former in-flow height as bottom padding on the
figure so later content does not jump upward when the enhancement activates.

The caption's absolute containing block currently includes that preserved
padding. At the end of the figure, the sticky caption therefore releases at
the padded figure bottom rather than at the image bottom. In the presentation
fixture, this makes the caption finish about `45.94px` below the image even
though the SVG itself has only the minimal canvas allowance required by its
outer stroke.

This is an engine layout defect. Cropping transparent pixels or changing the
asset must not be used to disguise it.

## Layout Contract

- Keep the original caption flow reserve so progressive enhancement does not
  move subsequent content vertically.
- Treat the rendered image rectangle as the independent vertical containing
  block for the persistent caption.
- Measure the image's block-start and block-end relative to the figure after
  restoring the ordinary below-image layout.
- Apply those measured offsets to the absolute caption lane. Do not derive its
  sticky release boundary from the figure's preserved bottom padding.
- Anchor both horizontal and vertical persistent-caption geometry to the
  rendered image rather than assuming that the media frame and image always
  have identical bounds.
- Continue to place the caption below the image when the caption is taller than
  the image, the side lane is unavailable, or any existing collision rule
  rejects persistent placement.
- Add no Markdown or theme configuration.

The asset contract remains complementary: technical illustrations must use a
canvas that matches their visible composition, and an asset-owned rectangular
frame or full-canvas background must reach the canvas edges. The layout engine
must nevertheless operate on element geometry rather than inspect image
pixels.

## Acceptance Criteria

- At the lower sticky boundary, the persistent caption and rendered image
  bottoms differ by no more than one CSS pixel.
- The caption remains sticky below the site header through the useful middle
  portion of a tall image.
- Activating or removing persistent placement does not move the following
  content vertically.
- A media frame whose bounds differ from the rendered image does not change the
  caption's visual start or release boundary.
- Resizing, browser zoom, font loading, reading-width changes, Focus reading,
  and appearance changes recompute stable image-relative geometry.
- Below-image fallback, multiple-image stacks, sidenote collision handling,
  no-JavaScript output, and right-to-left layout remain unchanged.

## Verification

- Extend the persistent-caption browser test to measure caption and image
  bottoms at sticky release.
- Add a fixture case where the media frame is taller than or vertically offset
  from the rendered image so the test does not depend on equal frame bounds.
- Retain tests for initial placement, sticky movement, fallback, layout shift,
  nearby lane claims, and document overflow.
- Visually review the tall explanatory image at its start, middle, and bottom
  before closing the item.

## Dependencies

This is a bounded correction to
[`BL-064` Persistent captions for tall explanatory images](BL-064-persistent-image-captions.md).
It uses the rendered-image measurements already collected by the existing
enhancement and requires no content-model or preset change.
