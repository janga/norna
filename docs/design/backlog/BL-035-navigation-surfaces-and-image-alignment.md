# BL-035: Navigation Surfaces And Managed-Image Alignment

## Outcome

Norna uses one predictable content canvas for text, navigation, and managed
images. Desktop navigation remains visually quiet instead of becoming a
contrasting panel, while `prose-aligned` and `centered-fit` images retain clear,
preset-owned roles in every navigation mode.

This item refines and verifies the integration introduced by `BL-033`. It must
not add arbitrary alignment controls or require authors to classify individual
images.

## Design Contract

### Shared Rules

- Derive navigation and the reading surface from the same palette background.
- Position managed images relative to the page's content canvas, never the
  browser viewport.
- Define the content canvas as the horizontal space left after persistent
  navigation rails and their gaps have been excluded. Adding or removing a
  rail may resize that canvas, but must not reinterpret the selected image
  presentation method.
- Keep each caption attached to and aligned with its image.
- Preserve intrinsic proportions and never crop by default.
- Let the preset choose the normal image presentation. Retain only the bounded
  root- or page-theme override established by `BL-033`.

### Top Navigation

- Give the sticky top bar the same opaque base background as the page.
- Separate the bar from scrolling content with a subtle bottom border and clear
  active-link styling, not a contrasting color field.
- Center the content canvas within the resolved page width.
- Let `prose-aligned` images begin at the prose edge and extend right only within the
  content canvas.
- Center `centered-fit` images within the content canvas.
- Continue to allow the preset's supported uniform, alternating, or accented
  section backgrounds below the stable top bar.

### Tree Navigation

- Give the permanent navigation rail the same base background as the reading
  surface.
- Distinguish the rail through stable spacing, hierarchy, active states, and at
  most one low-contrast vertical separator.
- Keep tree-navigation pages on one uniform section surface.
- Exclude the navigation rail and its gap when calculating image placement.
- Let `prose-aligned` images begin at the prose edge and use only the remaining media
  area to the right.
- Permit `centered-fit` as an explicit page exception, centered inside the content
  canvas after the navigation rail has been excluded.
- Do not make `centered-fit` the tree-navigation default. If centered-fit presentation
  is common across a site, its preset and navigation model should normally be
  reconsidered in favor of an image-oriented top-navigation layout.

### Narrow Screens

- Use the available content width for managed images.
- Treat an opened navigation menu as an overlay with its own opaque surface and
  scrim because it covers, rather than sits beside, the page.
- Keep the closed menu from reserving image or text width.

## Image Sizing

- In `prose-aligned`, keep a stable prose edge and size from available width. Do not
  use a viewport-height limit that makes portrait explanatory material shrink
  and drift toward the center.
- Do not enlarge small or portrait images merely to fill the full media width.
- Allow a tall explanatory image to require vertical scrolling when that
  preserves legibility.
- In `centered-fit`, constrain both available width and viewport height so prominent
  imagery remains inspectable without dominating the page accidentally.
- When a viewport-height constraint makes a portrait image narrower than its
  frame, keep the rendered image centered on the frame's horizontal axis.
- Center a `centered-fit` caption on the rendered image's horizontal axis, not
  on the prose column or an unrelated page region. The implementation need not
  force the caption box to equal the image width when the same visual axis can
  be preserved more robustly.
- Do not infer `prose-aligned` or `centered-fit` from file format, filename, dimensions,
  or aspect ratio. Intrinsic dimensions may still constrain safe rendering
  inside the already selected presentation method.

## Scope And Restraints

Implementation may adjust preset/profile values, palette-derived frame tokens,
layout CSS, managed-image geometry, and relevant assertions. Prefer codifying
existing correct behavior over introducing visible churn.

Do not add:

- a separate navigation palette;
- section- or image-level presentation fields;
- arbitrary left, center, or right alignment controls;
- image-specific CSS hooks in editorial Markdown;
- JavaScript solely for layout calculations that CSS can express.

## Acceptance Criteria

- Desktop top navigation and the page share one base background in every
  built-in palette and appearance.
- The sticky top bar remains readable over scrolling content and has a subtle
  visible boundary.
- Desktop tree navigation and its reading surface share one base background;
  the rail remains distinguishable without a contrasting panel.
- `prose-aligned` stacks and carousels share the prose edge in top and tree layouts.
- `centered-fit` stacks and carousels are centered in the content canvas, excluding
  any persistent navigation rail.
- A portrait `centered-fit` image, its media frame, and its visible caption
  share one horizontal center even when viewport-height fitting makes the
  rendered image substantially narrower than the frame.
- A page may use `centered-fit` with tree navigation, but no built-in tree-oriented
  default selects that combination.
- Portrait, landscape, square, SVG, and raster sources retain their proportions
  and remain within the viewport at 320 CSS pixels and 200 percent text zoom.
- Mobile navigation overlays do not alter the closed-state content geometry.
- Captions, keyboard controls, forced colors, no-JavaScript rendering, reader
  widths, and Focus reading remain usable.
- No new public configuration is introduced.

## Verification And Execution Order

Keep approval-requiring work as late and as consolidated as reasonably
possible:

1. Inspect the existing resolved preset, palette, layout, and component
   contracts using repository files only.
2. Add or update deterministic unit, schema, static-HTML, and CSS-contract
   tests before changing presentation code.
3. Make the smallest required implementation changes and run all relevant
   non-browser tests inside the repository.
4. Run browser geometry tests only after the non-browser suite passes. Group
   commands that need browser sandbox access or local-server permissions into
   one late verification pass where practical.
5. Capture desktop, mobile, Light, Dark, top-navigation, and tree-navigation
   snapshots last. Do not use network access or external services unless a
   remaining acceptance criterion cannot be verified locally.
6. Present the visual result for human review. Because this item can affect
   rendered appearance, update public documentation and examples only after
   that review is approved.

Browser assertions should measure content-canvas boundaries, image origins,
widths, heights, and caption alignment. Snapshots supplement those assertions;
they must not be the only regression protection.
