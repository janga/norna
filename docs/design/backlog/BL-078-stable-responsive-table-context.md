# BL-078: Stable Table Headings And Controls Across Responsive Layouts

## Outcome

A page-level Markdown table keeps its column headings visible while its rows
pass through the viewport, regardless of whether the table currently fits or
scrolls horizontally and regardless of which navigation rails are visible.

When a wide table gains horizontal controls, the controls and sticky headings
form one visually closed table header. Rows and cells never show through that
header as the right contents rail or left navigation rail disappears.

This is a corrective integration of the table behavior introduced by
[`BL-055` Wide, readable tables with sticky headings](BL-055-wide-readable-tables.md),
[`BL-060` Adaptive table width escalation](BL-060-adaptive-table-width.md),
[`BL-066` Sticky headings in horizontally scrolling tables](BL-066-sticky-headings-in-scrolling-tables.md),
[`BL-074` Discoverable horizontal navigation for long tables](BL-074-discoverable-table-horizontal-navigation.md),
and [`BL-076` Subtle table overflow controls](BL-076-subtle-table-overflow-controls.md).
It adds no author-facing syntax or theme setting.

## Reproduced Problems

### Sticky headings depend on a layout breakpoint

On the public Writing and Notes example, a table heading is sticky while the
left navigation rail remains visible but stops being sticky after the viewport
becomes narrower. The table still has the same reading need; only the page
layout has changed.

The implementation currently has two presentation paths:

- a fitting table uses native sticky header cells only above a fixed viewport
  breakpoint;
- a horizontally overflowing table uses the synchronized visual heading layer.

That leaves a fitting table below the breakpoint without either sticky path.
Navigation mode, rail visibility, and a fixed viewport width must not decide
whether a page-level table heading stays visible.

### Table cells show through the sticky control area

On the deep-navigation data-and-code example, reduce the viewport first until
the right Page contents rail disappears and the table gains horizontal
scrolling, then continue until the left navigation rail is replaced by compact
navigation. In both transitions, table content can be seen to the inline start
of the previous and next buttons while the controls are sticky.

The compact button group has an opaque background, but its full-width sticky
carrier is transparent. Rows can therefore pass visibly behind the unused part
of the carrier. Changes to table width, horizontal-overflow state, sticky
heading geometry, and navigation rails can also be committed in separate
rendering steps, exposing stale geometry during a responsive transition.

## Product Rule

- Every page-level Markdown table with column headings has sticky column
  context while its rows pass below the sticky site header.
- This rule is independent of tree, top, sections, or compact navigation;
  Page contents visibility; Focus reading; selected reading width; viewport
  width; and whether the table overflows horizontally.
- The sticky context ends at the table's bottom edge. It must not cover the
  following content.
- Horizontal controls appear only when columns overflow. Sticky headings do
  not depend on those controls being present.
- Tables inside callouts or other bounded blocks remain within their owning
  block. This correction must not let them claim a wider page lane.
- No Markdown option or theme override is introduced. This is an engine-owned
  readability and layout rule.

## Responsive Table Header Contract

Treat the controls and column headings as one ordered sticky stack directly
below the site header:

1. When horizontal controls are needed, their carrier is the first row.
2. The visible column-heading row follows immediately below it.
3. Table rows pass below the complete stack.
4. The complete stack releases at the table's lower boundary.

The stack must obey these layout rules:

- Its inline bounds always equal the table's current visible scroll viewport,
  not a previous data lane and not the full browser viewport.
- The control carrier uses the exact opaque background of the owning section
  across its full width. It must visually merge with the page rather than look
  like a filled toolbar, but no table text or borders may show through it.
- The compact button group remains aligned to the logical inline end. The
  carrier's unused area remains visually quiet and does not intercept pointer
  input intended for the page.
- The heading layer is opaque, clipped to the visible table viewport, and
  horizontally synchronized with the semantic table at the start, middle, and
  end of horizontal scrolling.
- The site header, control carrier, heading layer, table cells, and edge cues
  use an explicit and documented stacking order. Cells and edge cues never
  paint above the control carrier or heading layer.
- No negative margin or transparent overlay may leave table rows occupying a
  visible part of the sticky header stack. If overlap is retained internally,
  clipping and opaque surfaces must make the result equivalent to explicitly
  reserved rows.
- Inline bounds and offsets use logical directions and remain correct in
  right-to-left documents.

## State And Implementation Contract

Use one table-layout update to resolve the data lane, overflow state, control
height, sticky-heading mode, clipping bounds, and synchronized column geometry.
Expose the new state only after its geometry is ready, so responsive changes do
not briefly display an old heading or a transparent control area.

- A fitting table may retain native sticky header cells, but native sticky
  behavior must apply at every viewport width where the table does not
  overflow. Remove the unrelated desktop-only breakpoint from this decision.
- A horizontally overflowing table retains the synchronized, visually cloned
  heading because its horizontal and page-scroll coordinate systems differ.
- Switching between these paths must preserve the same visual position and
  release boundary. The distinction is an implementation detail, not a change
  in reader behavior.
- Recalculate after viewport resize, navigation-rail transitions, browser
  zoom, font loading, appearance changes, reading-width changes, Focus reading,
  direction changes, and table-lane escalation.
- Resize-driven updates must be scheduled and committed atomically. Repeated
  observer callbacks must not leave contradictory `overflow`, layout, or
  sticky-heading state on the frame.

## Accessibility And Progressive Enhancement

- The original semantic `table` and `thead` remain the only table and heading
  representation in the accessibility tree.
- Any synchronized visual heading remains `aria-hidden`, inert, free of copied
  element IDs, and unable to receive pointer or keyboard interaction.
- Horizontal navigation retains native buttons, accessible names, visible
  focus, disabled boundary states, keyboard scrolling, touch panning, and the
  focusable native scroll region.
- The opaque carrier must remain distinguishable in forced-colors mode without
  becoming a visually dominant toolbar.
- Without JavaScript, the semantic table, native headings, and horizontal
  scrolling remain usable. Native sticky headings should remain where CSS can
  provide them safely; synchronized cross-axis headings and custom controls are
  progressive enhancements.

## Acceptance Criteria

- A fitting page-level table keeps its headings sticky before and after the
  left navigation rail disappears.
- A horizontally overflowing table keeps the same sticky heading behavior when
  the right Page contents rail disappears and again when the left navigation
  rail disappears.
- At every responsive state, no cell text, row background, table border, or
  edge cue is visible anywhere inside the sticky control carrier or above the
  sticky heading row.
- The control carrier and sticky heading stay aligned with the visible table
  viewport through prose, end-lane, and canvas-width escalation.
- Adding or removing either navigation rail does not leave stale widths,
  horizontal offsets, control heights, or column positions after the next
  rendered frame.
- Previous and next controls remain absent for fitting tables and available for
  overflowing tables without moving the page vertically when they appear.
- Sticky headings release at the table bottom in every responsive state and do
  not cover subsequent content.
- The correction introduces no document-level horizontal overflow and does not
  change the selected prose width.
- Light, Dark, forced-colors, right-to-left direction, Focus reading, browser
  zoom, touch, pointer, keyboard, and no-JavaScript output remain usable.

## Verification

Use the presentation-review fixture and cover both a naturally fitting table
and a table that still overflows after claiming every available data lane.

- Resize one deep-navigation page through all three states: both auxiliary
  rails visible, Page contents hidden, and persistent left navigation replaced
  by compact navigation.
- Repeat with a shallower tree page and with top navigation so the implementation
  cannot accidentally depend on deep-navigation classes.
- At each state, verify sticky start and release boundaries and column
  alignment at horizontal start, middle, and end.
- Assert geometrically that a table cell passes behind the control carrier
  while the carrier covers the complete visible table width, has a fully
  opaque matching background, and remains above the cell and sticky heading.
  Retain manual Light and Dark captures for the visual integration check.
- Change Focus reading, reading width, appearance, direction, and zoom while
  the table is in its sticky interval and verify the state again after the
  responsive update settles.
- Disable JavaScript and verify the semantic, focusable horizontal-scroll
  fallback and native sticky behavior where supported.

The implementation now has static presentation-contract coverage, fitting-table
browser coverage below the former desktop breakpoint in tree and top
navigation, and a registered presentation-review browser suite that crosses
both responsive rail transitions. Automated checks and human visual review
pass. The remaining public documentation work is tracked by
[`BL-055` Wide, readable tables with sticky headings](BL-055-wide-readable-tables.md).

## Documentation Gate

This corrects visible behavior already intended by the table documentation.
The implementation has passed automated regression tests and human review
across the responsive transitions. Update screenshots and public descriptions
as part of `BL-055`.
