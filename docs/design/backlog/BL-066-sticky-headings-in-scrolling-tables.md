# BL-066: Sticky Headings In Horizontally Scrolling Tables

## Outcome

A long table can keep its column headings below the sticky site header while
the page scrolls even when the table also needs its own horizontal scrollbar.
The visible headings remain synchronized with the columns as the reader scrolls
the table sideways.

This extends [`BL-055` Wide, Readable Tables With Sticky Headings](BL-055-wide-readable-tables.md)
and [`BL-060` Adaptive Table Width Escalation](BL-060-adaptive-table-width.md).
It replaces their conservative rule that disables sticky headings whenever an
internal horizontal scroller is required.

## User Problem

Wide tables often contain enough columns to require horizontal scrolling and
enough rows to extend beyond one viewport. These are precisely the tables for
which readers most need persistent column context. The existing fallback keeps
the table semantic and scrollable but lets its heading row leave the viewport.

CSS cannot directly make one element follow the table's horizontal scroll
container while following the page's separate vertical scroll container. A
robust implementation therefore needs a progressive presentation layer rather
than an unconditional `position: sticky` declaration.

## Implementation Constraints

- Keep the original semantic `table`, `thead`, header relationships, and source
  order as the only accessible table representation.
- Retain native internal horizontal scrolling. Do not turn a long table into a
  bounded, nested vertical scroll region.
- Evaluate a visually synchronized, `aria-hidden` heading layer before changing
  semantic table structure. Its column widths and horizontal offset must follow
  the original table exactly.
- Activate the enhancement only while the table overflows horizontally and its
  rows intersect the usable viewport below the sticky site header.
- Recompute after viewport resize, browser zoom, font loading, appearance or
  reading-width changes, Focus reading, and table layout escalation.
- Use logical directions and verify right-to-left horizontal scrolling.
- Keep the ordinary non-sticky, horizontally scrollable table when JavaScript
  is unavailable or synchronization cannot be established safely.
- Preserve the independent directional overflow cue required by `BL-055`.

## Acceptance Criteria

- An overflowing long table keeps one visible column-heading layer below the
  sticky site header from the table's upper boundary until its lower boundary.
- Every visible heading remains aligned with its column at the start, middle,
  and end of horizontal scrolling.
- The enhancement introduces no second table or duplicated heading content in
  the accessibility tree.
- Keyboard scrolling, pointer scrolling, touch panning, text selection, and the
  original table's header associations continue to work.
- Resize, zoom, font loading, reader preferences, and Focus reading do not leave
  stale widths or offsets.
- The heading layer uses an opaque palette-derived surface and remains usable
  in Light, Dark, forced-colors, and right-to-left presentations.
- Without JavaScript, the table remains a semantic, focusable horizontal
  scroller with a visible directional overflow cue.
- Browser tests cover vertical stick and release boundaries, all horizontal
  scroll positions, geometry changes, keyboard access, and the no-JavaScript
  fallback.

## Complexity And Risk

Expected complexity is medium to high. The difficult part is maintaining one
visual coordinate system across two independent scroll directions without
duplicating accessible content. Primary risks are column drift, stale geometry,
duplicate screen-reader output, overlays that intercept interaction, and sticky
content that fails to release at the table boundary.
