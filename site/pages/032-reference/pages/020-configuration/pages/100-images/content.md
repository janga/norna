---
page:
  description: Align standalone images with prose or center them, and control width and viewport-height fitting.
---

# Image presentation

`images` in a root or page theme controls standalone image stacks and carousels.
Card images follow their card layout instead. The preset supplies defaults;
you can override them for a page branch, but not for an individual image.

```yaml title="theme.yaml: prose-aligned images" {2}
images:
  presentation: prose-aligned
  width: 900px
```

## Presentation methods

| `presentation` | Result |
| --- | --- |
| `prose-aligned` | Image and caption start at the prose edge; stacks size from available width |
| `centered-fit` | Image and caption share a centered axis and fit both width and viewport height |

Both use the content space **after excluding navigation rails**, not the whole
browser viewport. Neither crops images by default. `documentation` and `project`
use `prose-aligned`; `portfolio` and `statement` use `centered-fit`. Without a
preset the method is `prose-aligned`.

## Size limits

| Field under `images` | Meaning |
| --- | --- |
| `width` | Maximum intended media-area width; accepts a layout CSS length |
| `maxAvailableWidthPercent` | Maximum share of available content width |
| `maxAvailableHeightPercent` | Maximum viewport-height share for `centered-fit` |

Percentages are numbers greater than 0 and at most 100, either one number or
an object containing both `desktop` and `mobile`. For example:

```yaml title="theme.yaml: centered images with height limits" {2,5,6,7}
images:
  presentation: centered-fit
  width: 1080px
  maxAvailableWidthPercent: 100
  maxAvailableHeightPercent:
    desktop: 80
    mobile: 70
```

`maxAvailableHeightPercent` is invalid with `prose-aligned`. Width-driven
stacks may intentionally exceed one viewport. Prose-aligned **carousels**
always get an engine-owned height limit of 74% desktop and 68% mobile, keeping
one slide and its controls usable together.

Without a preset or override, width is `900px` and the width share is 100%.
Selecting `centered-fit` without an explicit height limit uses 74% desktop and
68% mobile.

Preset-specific limits are in [Preset values](/reference/configuration/presets/).
On narrow screens all media remains within available content space.

## Tall captions and inspection

A tall stack image may place its caption beside it when a sufficiently wide,
vacant margin exists. The caption stays below the sticky header and stops at
the image boundary. Occupied margins, narrower layouts, print and no-JavaScript
rendering keep it below the image. Automatically removing a right rail while
narrowing does not move a caption back out; Focus reading may free space
because it is an explicit reader choice.

Stack images link to their published originals. With JavaScript, images that
can be shown materially larger get an inspection dialog. **Show actual size**
appears only for sufficiently large raster images, not SVGs or already-fitting
rasters. Escape/Close returns focus to the image link. Enlarging an image does
not widen the document. This is automatic, not a theme option, and does not
apply to carousel slides or card images.
