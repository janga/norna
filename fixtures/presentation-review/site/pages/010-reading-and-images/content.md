---
page:
  description: Manual checks for sidenotes, detailed images, and persistent captions.
---

# Reading and Images

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a
ante venenatis dapibus posuere velit aliquet. This paragraph provides a quiet
baseline before the visual checks begin.{note-ref}

{note: The reference and note should remain linked, numbered, and readable at every width.}

## Sidenotes {#sidenotes}

Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed
odio dui. On a wide desktop, this explanatory note should sit beside the prose
when its lane is free.{note-ref}

{note: Switch between Narrow, Standard, and Wide to check that placement follows available space rather than a fixed page width.}

Maecenas faucibus mollis interdum. Nullam quis risus eget urna mollis ornare vel
eu leo. On a narrow viewport, the same semantic note should return to the normal
reading flow without covering adjacent content.{note-ref}

{note: At mobile widths, this text belongs directly after its source paragraph.}

Vestibulum id ligula porta felis euismod semper. Cras mattis consectetur purus
sit amet fermentum. Turn Focus reading on and off and verify that the reference
number, note number, and paragraph position remain stable.{note-ref}

{note: Focus reading may release a navigation lane for this note, but it must not alter the note's meaning or reading order.}

## Adaptive Table With One Rail {#adaptive-table}

This page has the ordinary left page rail without a separate Page contents
rail. Resize the viewport gradually and switch between Narrow, Standard, and
Wide. The table should use vacant space toward the right before it adds an
internal horizontal scroller. It must never overlap the left navigation or
widen the complete document.

| Check | Viewport | Reading width | Navigation state | Note placement | Table lane | Overflow cue | Keyboard access | Expected result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | 1600 x 1000 | Narrow | Left rail visible | Margin when it fits | Smallest sufficient lane | Hidden if complete | No local scroll needed | Stable |
| S02 | 1440 x 900 | Standard | Left rail visible | Margin when it fits | Prose then right | Shown only if clipped | Tab reaches overflow only | Stable |
| S03 | 1280 x 800 | Wide | Left rail visible | Inline if needed | Available canvas | Directional when clipped | Arrow keys move columns | Stable |
| S04 | 1100 x 800 | Standard | Left rail visible | Inline | Available canvas | Directional when clipped | Focus remains visible | Stable |
| S05 | 960 x 800 | Standard | Compact navigation | Inline | Content width | Directional when clipped | Last column reachable | Stable |
| S06 | 768 x 900 | Narrow | Compact navigation | Inline | Content width | Directional when clipped | Last column reachable | Stable |
| S07 | 390 x 844 | Wide | Compact navigation | Inline | Mobile content width | Directional when clipped | Swipe or keyboard | Stable |
| S08 | 320 x 800 | Narrow | Compact navigation | Inline | Mobile content width | Directional when clipped | No document overflow | Stable |

## Tall Explanatory Image {#tall-explanatory-image}

At a wide desktop viewport, scroll slowly through the first image. Its caption
should remain visible beside the image while there is enough unoccupied space,
then release when the image ends. On a narrow screen, the caption should remain
below the image.

```image-stack
- image: tall-process.svg
  alt: A tall generic process diagram with five numbered stages connected vertically.
  caption: Five-stage process. The caption should stay associated with this tall figure while the reader scrolls through it.
- image: compact-reference.svg
  alt: A compact generic diagram with three columns connected by arrows.
  caption: Compact reference image. Its caption should remain below the image because persistent placement is unnecessary.
```

## Detailed Image Inspection {#detailed-image-inspection}

The next image contains deliberately small labels. At ordinary reading size it
should offer a clear inspection control. Open it with pointer and keyboard,
switch between fit and actual size, then close it with both the close button and
Escape. Focus should return to the image link.

```image-stack
- image: detail-grid.svg
  alt: A generic systems map with four grouped areas and many labelled connections.
  caption: Generic systems map. Open the inspection view to read the smaller labels without changing the page layout.
```
