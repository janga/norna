# BL-074: Discoverable Horizontal Navigation For Long Tables

## Outcome

A reader can tell immediately when a table contains columns outside the visible
area and can reach them while reading any part of a tall table. The interaction
does not depend on an operating system choosing to display its horizontal
scrollbar.

## User Problem

Norna keeps a wide table in a local horizontal scroll region. This preserves
the page layout, but the native scrollbar is located at the table's bottom and
may be below the viewport for most of a long table. macOS and iOS can also hide
native scrollbars until scrolling has already begun. A reader can therefore
mistake a clipped table for a complete one.

The existing edge gradients track horizontal position but are too restrained
to carry the complete discoverability burden. The table needs a visible cue and
controls that remain available during vertical page scrolling.

## Interaction Contract

- Keep the page as the only vertical scroll region. Do not impose a fixed
  height or nested vertical scrolling on ordinary Markdown tables.
- Keep the semantic table in its existing native horizontal scroll region.
- When columns overflow, show a clearly perceptible edge shadow and restrained
  directional marker on every side that contains hidden columns.
- Update the edge treatment at the horizontal start, middle, and end so it also
  communicates the current position.
- Add one compact control row above the column headings only for horizontally
  overflowing tables.
- Keep that row below the sticky site header while the table intersects the
  reading viewport, and release it at the table's lower boundary.
- Provide ordinary previous and next icon buttons. Disable the button for a
  direction whose boundary has been reached.
- Move by approximately 80 percent of the visible table width per activation,
  preserving enough overlap for spatial orientation. Retain touch, trackpad,
  mouse, and native keyboard scrolling.
- Keep the native scrollbar when the browser presents it. Do not replace it
  with a custom draggable scrollbar.
- Add no Markdown or theme option. This is an automatic behavior for an
  overflowing table.

The control row and synchronized sticky column headings from `BL-066` must form
one stable sticky stack. Neither may cover table content or cause a vertical
layout jump when it activates.

## Accessibility

- Use native buttons with localized accessible names for horizontal movement.
- Keep the real scroll region in sequential keyboard navigation whenever it
  overflows.
- Associate a concise description of the horizontal overflow with that region
  without repeatedly announcing it during scrolling.
- Preserve the original table, heading cells, source order, text selection,
  and screen-reader relationships as the only accessible table representation.
- Do not require pointer gestures, hover, or precise dragging.
- Use a non-color cue in forced-colors mode and keep disabled and focus states
  distinguishable.

## Acceptance Criteria

- An overflowing table has a perceptible initial indication that more columns
  exist even when all operating-system scrollbars are hidden.
- The visible edge markers correctly represent hidden content at the start,
  middle, and end of horizontal scrolling.
- Previous and next controls remain reachable while the middle of a table is in
  the viewport and disappear or release when the table leaves it.
- Button activation moves the existing native scroll region without skipping
  content or changing vertical page position.
- Controls are absent when the table fits its selected layout lane.
- The solution works with synchronized sticky headings, Focus reading, Light
  and Dark appearance, forced colors, right-to-left direction, browser zoom,
  touch, keyboard, and reduced motion.
- Without JavaScript, the semantic focusable scroll region and native
  scrollbar remain the complete fallback.
- No document-level horizontal overflow or second vertical scroll region is
  introduced.

## Verification

- Add browser tests for hidden operating-system scrollbars, initial overflow
  discovery, both horizontal boundaries, button scrolling, and sticky release
  at the table bottom.
- Test a table whose bottom is initially below the viewport.
- Retain the existing synchronized-heading and adaptive-width regression tests.
- Visually review the control row with representative short and long tables at
  desktop, laptop, mobile, and zoomed widths before documenting it publicly.

## Dependencies

Build on [`BL-055` Wide, readable tables with sticky headings](BL-055-wide-readable-tables.md),
[`BL-060` Adaptive table width escalation](BL-060-adaptive-table-width.md), and
[`BL-066` Sticky headings in horizontally scrolling tables](BL-066-sticky-headings-in-scrolling-tables.md).
Do not couple this work to the unresolved row-header model in `BL-063`.

## References

- [Apple Human Interface Guidelines: Scroll views](https://developer.apple.com/design/human-interface-guidelines/scroll-views)
- [Ontario Design System: Tables](https://designsystem.ontario.ca/components/detail/tables.html)
- [CMS Design System: Table](https://design.cms.gov/v/3.6.0/components/table/)
- [W3C ACT Rule: Scrollable content can be reached with sequential focus navigation](https://www.w3.org/WAI/standards-guidelines/act/rules/0ssw9k/)
