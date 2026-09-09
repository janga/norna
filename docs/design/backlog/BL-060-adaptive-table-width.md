# BL-060: Adaptive Table Width Escalation

## Outcome

Each top-level Markdown table uses the smallest available reading lane that
can present it comfortably. Norna first keeps the table within the prose
measure, then expands it toward the logical inline end, then uses the complete
vacant reading canvas, and only then falls back to internal horizontal
scrolling.

This refines `BL-055`. It gives small tables a stronger relationship with the
surrounding prose while allowing unusually wide data to reclaim space hidden
by Focus reading rather than scrolling prematurely.

## Evidence

Carbon recommends placing data tables in the main content area, avoiding
cramped containers, and giving dense tables as much useful page width as
possible. USWDS provides a focusable horizontal-scrolling container when table
columns still exceed the available width. Together these support progressive
use of genuinely available page space before introducing internal scrolling.

The layout must distinguish empty-looking space from vacant space. A visible
navigation tree, page-contents rail, or sidenote owns its lane. Focus reading
makes the persistent navigation lanes available to wide data blocks, but it
does not change the prose measure.

## Layout Contract

For every top-level Markdown table, in order:

1. Use the prose lane when the table's preferred rendered width fits.
2. Preserve the prose inline-start edge and expand toward the inline end when
   the additional end-side canvas is vacant.
3. If that is insufficient, use the complete vacant reading canvas. Shift the
   table toward the inline start only by the width needed beyond the end-side
   canvas.
4. If the table still does not fit, retain the complete available canvas and
   use an internal, keyboard-reachable horizontal scroller.

The complete reading canvas may include both former navigation lanes only
when they are absent or hidden. A table must never overlap visible persistent
navigation. Top navigation has no side rail to reserve. In tree navigation,
the start-side rail remains unavailable in the ordinary reading mode and
becomes available when Focus reading hides it.

Keep a minimum outer page gutter at every viewport size. Use logical inline
directions so the contract remains valid for right-to-left layouts. On narrow
screens, the prose and reading canvases converge; the internal scroller is the
normal final fallback.

Tables nested in callouts or other bounded Markdown containers remain within
their parent. They do not claim page layout lanes.

## Measurement Contract

- Apply the browser's ordinary table layout in each candidate lane and stop at
  the first lane that does not overflow. Do not infer a larger preferred width
  from how far text could unwrap in a wider lane.
- Do not stretch the table itself when it is naturally narrower than its
  selected lane.
- Re-evaluate after viewport, font, reader-width, Focus reading, or relevant
  page-layout changes.
- Keep the prose position and width unchanged while table lanes change.
- Avoid resize-observer feedback loops and preserve horizontal scroll state
  when only overflow indicators need updating.
- Retain a usable no-JavaScript fallback that aligns the table with the prose
  edge, uses available end-side space, and scrolls internally when required.

## Accessibility And Overflow

- Never introduce horizontal scrolling for the document as a whole.
- Keep the existing directional overflow cue and update it at both scroll
  boundaries.
- Make only an overflowing table region keyboard focusable.
- Preserve native table, caption, heading, and cell semantics.
- Keep headings visible for long tables, including the synchronized progressive
  enhancement defined by `BL-066` when horizontal scrolling is required.
- A table that occupies an auxiliary lane retains the shared lane-collision
  contract from `BL-043`; it must not overlap a sidenote.

## Acceptance Criteria

- A narrow top-level table stays within the prose measure.
- A medium table keeps its prose-aligned inline-start edge and uses only the
  vacant end-side lane.
- A wider table uses the complete page canvas when no side navigation is
  present.
- With tree navigation visible, no table enters the start-side navigation
  lane.
- In Focus reading, a table that needs the space can use both released side
  lanes while prose geometry remains unchanged.
- A table wider than the complete canvas scrolls inside its frame, displays
  directional overflow feedback, and never widens the document.
- Changing reader width or Focus reading causes the lane to be measured again.
- Nested tables remain bounded by their callout or other parent container.
- Browser tests cover every escalation level, top and tree navigation, Focus
  reading, narrow screens, and document overflow.

## References

- [Carbon Design System: Data table usage](https://carbondesignsystem.com/components/data-table/usage/)
- [U.S. Web Design System: Table](https://designsystem.digital.gov/components/table/)

## Verification

Implemented, visually approved, regression-tested, and documented. Browser
coverage verifies every width level, Focus reading, persistent navigation,
bounded tables, horizontal overflow, text resizing, and document containment.
