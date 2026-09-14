# BL-111: Persistent Horizontal Scrollbar For Wide Tables

## Status

Completed. The user approved the revised appearance on 2026-09-14.
The scrollbar sits below the heading, without arrow buttons, decorative
framing, or changing edge shadows. Reference documentation and the public
table example have been updated. Regression testing also caught and corrected
focus loss when the scrollbar disappears after the table becomes wide enough.

## Problem

The native scrollbar sits at the bottom of a long table and may be hidden by
the operating system. Sticky arrow buttons allow horizontal movement, but do
not show the visible fraction or position within the complete table width.

## Scope

Replace the existing sticky arrow controls with a persistent, draggable
scrollbar. Preserve the native scroll container. Keep the heading and scrollbar
in one sticky surface so they remain adjacent and leave the viewport together
at the table's end.
This supersedes the no-custom-scrollbar boundary in BL-074: Discoverable Table
Horizontal Navigation; it does not replace the native no-JavaScript fallback.
BL-105: Locale-Aware Sortable Tables remains a separate sorting contract.

## Acceptance Criteria

- Show a thin control directly below the sticky heading whenever horizontal overflow
  exists, without waiting for hover, scrolling, or the table's final row.
- Remove the arrow buttons. Track clicks provide a pointer alternative to
  dragging; keyboard support remains available separately.
- Do not add a decorative box around the scrollbar or an outer table frame.
  Remove the changing edge shadows: the persistent scrollbar communicates
  overflow and position without obscuring edge text. Preserve keyboard focus
  indicators and the separator after an explicitly pinned row-header column.
- Keep it with the sticky table heading, within the table's vertical bounds.
- Thumb size represents the visible fraction of the table, with a minimum
  usable target size; thumb position represents horizontal scroll position.
- Support dragging, track clicks, arrow keys, Page Up/Down, and Home/End.
- Preserve touch and trackpad scrolling, sorting, sticky row labels, and focus.
- Expose a named horizontal scrollbar, range value, and associated scroll
  region to assistive technology; avoid live announcements on every scroll.
- Synchronize after native scrolling, track interaction, resizing, reading-width
  changes, and Focus reading. Support both LTR and RTL geometry.
- Hide when the table fits; move keyboard focus to the table if the focused
  control disappears.
- Use palette-derived colors, a visible focus indicator, and forced-color
  support. The visible track is quiet, with a larger pointer target.
- Without JavaScript, retain the readable source table and native scrolling.

## Review And Verification

Review `http://127.0.0.1:4399/long-table/#comparison` using the maintained
`fixtures/table-sorting/site` copied to the registered scratch workspace.
Try dragging while halfway down the table, narrow and wide reading widths,
Focus reading, and a narrow browser window.

Verified across focused runs, with failed cases rerun after corrections:

- `npm run test:table-sorting`: all 10 cases passed across the initial run and
  the focused rerun of `persistent scrollbar adapts` after fixing focus loss.
- `npm run test:table-context:browser`: all 5 cases passed across the initial
  run and the focused rerun of `overflow controls seal` after updating the
  geometry sample for the new full-width scrollbar.
- `npm run test:presentation:browser -- --grep 'wide Markdown tables'` and
  `npm run test:presentation:browser -- --grep 'an overflowing long table'`:
  both passed. The latter's old noninteractive-header assertion was updated
  to reflect the existing sticky sorting buttons.
- `node scripts/test-presentation-contract.mjs`,
  `npm run test:client-javascript`, and `npm run test:documentation`: passed.

These cover geometry, drag and track interaction, keyboard operation, native
scroll synchronization, overflow and focus transitions, responsive navigation,
RTL, forced colors, and progressive enhancement. Captures were inspected at
1024px in Light appearance and 390px in Dark appearance. The full release suite
was not run for this scoped change. Actual screen-reader and touch-device
evaluation remain distinct from browser DOM assertions and were not performed.

## Reference

- [Ant Design: Fixed header and scroll bar with the page](https://ant.design/components/table/#components-table-demo-sticky)
  provides a working reference for persistent table scrolling. Placing Norna's
  control directly below the heading is our adaptation, not a placement rule
  prescribed by that reference.
- [WCAG: Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
  explains non-dragging pointer alternatives, including clicking a slider's
  track. Keyboard support alone is not the pointer alternative.
- [WAI-ARIA scrollbar role](https://www.w3.org/TR/wai-aria-1.2/#scrollbar).
