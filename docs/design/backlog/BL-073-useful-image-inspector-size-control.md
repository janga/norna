# BL-073: Show Image-inspector Size Controls Only When Useful

## Outcome

The image inspector shows its size control only when switching from the fitted
view to the image's actual size provides a materially different inspection
view. A control that does nothing is not presented.

## User Problem

Opening an inspectable image currently always exposes `Show actual size`. For
an SVG, the fitted and actual-size views can be identical because the image is
scalable and has no useful fixed pixel scale. Some raster images also fit at
their intrinsic dimensions already. In both cases, activating the control
appears to have failed and makes the inspector harder to understand.

This is separate from whether opening the inspector is useful. A small inline
image may still become much larger in the fitted inspector even when a second
size mode adds nothing.

## Interaction Contract

- Continue to open eligible `image-stack` images in fit-to-viewport mode.
- After the inspected image has loaded and the dialog has its final geometry,
  compare its fitted dimensions with its intrinsic raster dimensions.
- Show `Show actual size` only when actual size is materially larger than the
  fitted presentation and therefore exposes additional detail through local
  scrolling.
- Hide the size toggle when both modes would be effectively identical, or when
  actual size would only make the image smaller.
- Do not offer actual-size mode for SVG in this correction. Keep SVG inspection
  fitted to the available viewport; treat interactive SVG zoom as a separate
  feature if evidence supports it later.
- Keep the Close control, `Escape`, focus containment, focus restoration, and
  the ordinary original-image link unchanged.
- Do not add Markdown or theme configuration.

Use one engine-owned material-difference threshold rather than exact pixel
equality so rounding and device scale do not make the control appear
unpredictably.

## Acceptance Criteria

- A raster image whose intrinsic dimensions materially exceed its fitted
  dimensions shows the size toggle and becomes locally scrollable at actual
  size.
- A raster image already shown at or above its intrinsic dimensions does not
  show the size toggle.
- An SVG can still open in the fitted inspector but does not show the
  actual-size toggle.
- Resizing the viewport and opening another image recomputes availability from
  that image and the current dialog dimensions.
- Hiding the size toggle does not leave an inaccessible, focusable, or visually
  empty control.
- Desktop, mobile, keyboard, and no-JavaScript behavior from `BL-061` remains
  intact.

## Verification

- Add browser coverage for a high-resolution raster image where fitted and
  actual-size dimensions differ.
- Add browser coverage for a raster image that already fits.
- Add browser coverage proving that an SVG retains inspection but omits the
  ineffective size toggle.
- Retain checks for dialog-bounded overflow, close behavior, and restored
  keyboard focus.

## Dependencies

This is a bounded correction to [`BL-061` Image inspection for detailed
media](BL-061-image-inspection.md). It does not depend on a new image block,
theme option, or zoom model.
