---
page:
  description: Write GFM tables and understand automatic width, sticky headings, row headings and locale-aware sorting.
---

# Tables

Use ordinary GFM tables for comparisons and structured data. Norna adds width
management, sticky column headings and sorting without extra settings.

## Source and result

```md title="content.md: an ordinary table"
| Task | Minutes | Checked |
| --- | ---: | --- |
| Review text | 12 | 2026-09-14 |
| Check links | 3 | 2026-09-15 |
| Preview images | 8 | 2026-09-13 |
```

| Task | Minutes | Checked |
| --- | ---: | --- |
| Review text | 12 | 2026-09-14 |
| Check links | 3 | 2026-09-15 |
| Preview images | 8 | 2026-09-13 |

## Width and sticky context

A top-level table first tries the prose width, then free space toward the
inline end (right for LTR), then the full vacant content canvas. If it still
does not fit, it scrolls horizontally inside its frame. It never covers a
visible rail, sidenote or another wide block, or makes the document scroll
sideways. Focus reading can free navigation space without moving prose.

Column headings remain below the sticky site header until the table ends.
JavaScript synchronizes headings when the body also scrolls horizontally.
The original table remains the semantic table for assistive technology.

Overflowing tables get matching top and bottom scrollbar controls. The upper
one stays below sticky headings, so it is available before reaching the last
row. Drag a handle or click its track. Keyboard controls are Left/Right Arrow,
Page Up/Down and Home/End. Handles show the visible fraction and position.
Controls disappear when the table fits; focus transfers to the scroll region
if necessary. Native touch, trackpad and keyboard scrolling remain usable.

Tables inside callouts or other bounded containers stay within those containers
and do not claim page-level space or sticky-column behavior. Without JavaScript,
native tables and horizontal scrolling remain; custom scrollbars, sorting and
synchronized overflow headings are absent. The browser controls native
scrollbar visibility.

## Row headings

When the first column uniquely identifies every row, add `{row-header}` to
the end of its heading:

```md title="content.md: a row-heading column" {1}
| Task {row-header} | Minutes | Checked |
| --- | ---: | --- |
| Review text | 12 | 2026-09-14 |
| Check links | 3 | 2026-09-15 |
```

This Norna extension emits body labels as `<th scope="row">` and keeps that
first column visible during horizontal scrolling. Use the marker exactly once
in the first heading. Every row needs a nonempty, unique first cell.

Ordinary words wrap at word boundaries; exceptionally long identifiers may
wrap within the bounded label column so other columns remain accessible.
Callout tables retain row-heading semantics without a page-level sticky column.

## Sorting

Activate a column heading to cycle **ascending, descending, original source
order**. A different column starts ascending. Empty cells stay last; equal
values retain original relative order. Type detection examines nonempty cells:

| Entire column | Comparison |
| --- | --- |
| Numbers such as `10`, `-3`, `1.5` | Numeric |
| ISO dates or supported ISO date-times | Chronological |
| Text, mixed types or ambiguous values | Text using the site's `language` |

Numbers use digits and an optional decimal point, without units/grouping.
`1,5`, `1,000`, `10 kg` and `1e3` are text. Dates use `YYYY-MM-DD`; date-times
add `T` and hours/minutes, optionally seconds, fractional seconds and a `Z`
or numeric offset. Without an offset, the browser's local timezone applies.
Ambiguous dates such as `01/02/2026` remain text.

The full configured language tag controls text comparison, not numeric/date
type detection. Sorting needs one header row, one body section, at least one
body row and equal cell counts. Spanning cells or interactive headings prevent
enhancement; the authored order remains.

The indicator describes current order; the tooltip describes the next action.
It appears after 500 ms on hover or immediately on keyboard focus. Escape
dismisses it. Enter/Space sorts, including through sticky headings. Without
JavaScript there are no sorting controls and source order is preserved.
