# BL-055: Wide, Readable Tables With Sticky Headings

## Outcome

Markdown tables use a reading-oriented data layout instead of being confined
to the prose measure. A wide table can use otherwise vacant auxiliary space,
including space released by Focus reading, while preserving the prose axis and
the reader's selected text width.

Long tables keep their column headings visible while the reader moves through
their rows when sticky positioning is compatible with the table's responsive
presentation. Narrow layouts retain an accessible horizontal-scrolling
fallback.

## Evidence

The `Ranked Candidates` table in the private marketing site needs about 1088px
for its nine columns at a 1440px viewport but receives about 786px from the
selected prose width. Approximately 1096px is available from the prose edge to
the right edge of the page layout when the vacant auxiliary track is included.
The table therefore becomes substantially more readable without widening the
surrounding prose or crossing the persistent left navigation rail.

The U.S. Web Design System recommends sticky headings for long tables and a
focusable horizontal-scrolling container for wide tables. It also treats its
sticky and horizontally scrollable variants as incompatible. Carbon recommends
giving dense data tables as much useful page width as possible. Norna must
therefore choose a responsive presentation deliberately rather than adding
`position: sticky` to its current scrolling table element.

## Layout Contract

- Treat an ordinary Markdown table as a data block. Authors do not select a
  width mode or add Norna-specific table syntax.
- Keep the table's inline start aligned with the prose edge.
- Let a wide table extend toward the end of the central content canvas when
  that space is not occupied by persistent navigation or page contents.
- In Focus reading, let the table use the auxiliary track released by hidden
  navigation while keeping prose, headings, and the selected reading width
  unchanged.
- Do not stretch a naturally narrow table merely to fill the available data
  width.
- Keep a table nested in a callout or another bounded Markdown container inside
  that container. It retains local horizontal overflow feedback but does not
  claim the page data lane or use sticky headings.
- Make a table that extends into the note lane a lane-claiming block under
  `BL-043`. A sidenote must never overlay the table or cause its columns to
  shrink unpredictably.
- Keep horizontal scrolling as the fallback whenever the table still exceeds
  its available canvas. Do not introduce horizontal scrolling for the whole
  page.
- Show a directional edge cue whenever columns continue beyond the visible
  scroll region. Update the cue as the reader scrolls so a table never appears
  to end merely because its remaining columns are clipped.
- Preserve table captions, header-cell relationships, source order, text
  selection, and screen-reader table semantics.

## Sticky Heading Contract

- Keep the heading row directly below the sticky site header while a long,
  page-scrolling table is passing through the viewport.
- Stop the sticky state at the bottom edge of the table.
- Give the sticky row an opaque palette-derived background, a restrained lower
  boundary, and sufficient stacking order to remain legible over table rows.
- Keep all headings horizontally synchronized with their columns.
- Do not clone the heading row into a second accessible table.
- Prefer the horizontal-scrolling fallback over sticky behavior when both
  cannot be provided robustly in the same layout.
- Add no reader or theme setting in the first implementation. Short tables do
  not need a separate author-controlled mode.

## Architecture

Generate a semantic wrapper around Markdown tables instead of making the
`table` element itself responsible for every layout behavior. The wrapper can
own the data-block width, overflow affordance, focus behavior, and responsive
variant while the table retains native semantics.

Resolve the available data width from the existing page-layout tracks. Reuse
the lane-occupancy contract from `BL-043`; do not add component-name checks to
the sidenote implementation. Focus reading may change the table's available
maximum width but must not change the prose measure.

## Acceptance Criteria

- The `Ranked Candidates` table uses the vacant right-side layout space on a
  representative laptop and desktop viewport.
- Its left edge remains aligned with the prose before and after Focus reading
  is changed.
- Focus reading increases the table's available width without increasing the
  selected prose width or moving the prose axis.
- A table never overlaps a sidenote, contents rail, navigation rail, sticky site
  header, or viewport edge.
- A long table that fits its desktop data canvas keeps its heading row visible
  below the site header and releases it at the table bottom.
- A table requiring horizontal overflow remains keyboard reachable, exposes a
  visible directional scrolling affordance, updates that affordance at both
  ends, and keeps its non-sticky heading row associated with the scrolled
  columns.
- Small tables retain natural width and do not acquire unnecessary visual
  weight.
- Light, Dark, forced-colors, tree navigation, top navigation, Focus reading,
  narrow screens, browser zoom, keyboard navigation, and no-JavaScript output
  remain usable.
- Static markup tests cover the wrapper and semantics. Browser tests measure
  table bounds, prose alignment, sticky top and bottom boundaries, horizontal
  overflow, and interaction with sidenotes.

## References

- [U.S. Web Design System: Table](https://designsystem.digital.gov/components/table/)
- [Carbon Design System: Data table usage](https://carbondesignsystem.com/components/data-table/usage/)

## Documentation Gate

This changes visible table layout. Update the canonical Markdown-table
reference and a representative rendered example after human review confirms
the desktop, laptop, and narrow-screen behavior.
