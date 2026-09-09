# BL-064: Persistent Captions For Tall Explanatory Images

## Outcome

When a tall explanatory image passes through a wide desktop viewport, its
caption can remain visible in an unused end-side lane. The caption releases at
the image boundary. When no suitable lane exists, it remains in its ordinary
place below the image.

Implement after [`BL-061` Image inspection for detailed media](BL-061-image-inspection.md)
so both changes can share stable figure markup and avoid revising the image
component twice.

## User Problem

A portrait diagram or long screenshot can occupy more than one viewport. Its
caption does not become visible until the reader reaches the bottom, so the
reader may inspect details without the explanation that establishes their
context. An overlay would solve visibility by covering the image itself.

## Presentation Contract

- Keep one semantic `figcaption` associated with one image. Do not duplicate
  caption text for visual placement.
- Use persistent side placement only for a tall `image-stack` figure when the
  resolved layout has a genuinely vacant end-side lane wide enough for a
  readable caption.
- Keep the caption below the image when a Page contents rail, sidenote, another
  lane-claiming block, a narrow viewport, or the selected reading width leaves
  insufficient room.
- Align the persistent caption with the upper useful portion of the image,
  keep it below the sticky site header, and release it at the figure's bottom.
- Never overlay the image or change the image's selected presentation method,
  dimensions, caption source order, or alternative text.
- Apply no persistent behavior to short images, card media, or carousel slides
  in the first implementation.
- Require no new Markdown or theme option; the result follows available layout
  geometry and the existing caption.

## Acceptance Criteria

- A tall captioned image uses the end-side lane only while that lane is vacant
  and the caption fits at a readable measure.
- The caption remains visible while the central portion of the image passes and
  stops at the figure boundary.
- Occupied or insufficient lanes deterministically retain the existing caption
  below the image.
- Focus reading and reader-width changes recompute placement without moving the
  reader's visible content position.
- Multiple figures and nearby sidenotes never overlap or reorder their
  captions.
- Desktop, intermediate, mobile, browser-zoom, keyboard, screen-reader,
  no-JavaScript, Dark appearance, and forced-colors checks pass.

## Approved Refinement

The first review exposed two different causes behind an apparently detached or
misaligned caption:

- A persistent caption beside a portrait image was anchored to the image's
  broad layout field rather than to the edge of the image actually rendered
  inside that field. The resulting empty space made the caption look unrelated
  to the image.
- The test SVG included broad outer margins filled with almost the same color
  as the page. The image element and caption were geometrically aligned, but
  the invisible canvas made the visible illustration appear indented.

The implementation has been refined as follows:

- A side caption is anchored to the rendered image edge rather than to its
  layout field.
- The side gap is an engine-owned `0.75rem` value, separate from the wider gap
  used for sidenotes.
- A caption below an image uses only `caption.spacingBefore`; the figure no
  longer adds a second gap.
- The test illustrations are cropped to their visible composition or have an
  intentional visible canvas boundary.
- `AGENTS.md` now requires technical illustrations to use an SVG `viewBox` or
  bitmap canvas that represents the visible composition. Norna owns the outer
  spacing between image, caption, and surrounding content.

This remains an engine layout rule rather than another theme setting. The
refined visual result was approved after reviewing both the persistent side
placement and the below-image fallback.

## Verification

The presentation browser suite covers side placement, the rendered-image
anchor, sticky release, occupied and narrow-lane fallback, Focus reading,
below-image spacing, document overflow, and JavaScript-free output. The
canonical image reference and rendered media example describe the behavior.

## Complexity And Risk

Expected complexity is medium. Norna already models note-lane ownership and
image boundaries, but the feature must combine those rules without creating a
second caption or an overlay. The main risks are vertical collisions, captions
that appear detached from their images, and geometry changes when Focus reading
or reading width changes.
