# BL-063: Sticky Row Labels In Wide Tables

## Outcome

When a data table must scroll horizontally, an identified row-header column can
remain visible so the reader does not lose the identity of the row being
compared. The sticky column releases at the table's inline end and never
changes naturally fitting tables.

This extends [`BL-055` Wide, readable tables with sticky headings](BL-055-wide-readable-tables.md)
and [`BL-060` Adaptive table width escalation](BL-060-adaptive-table-width.md).

## Decision Required

GFM tables identify column headings but provide no standard Markdown syntax for
body-row headers. Norna must not assume that every first column labels its row.
Before implementation, select one explicit authoring rule that produces
`<th scope="row">` cells and enables the sticky column.

The decision should prefer a small extension adjacent to the table over page
frontmatter, inferred wording, or a general table-configuration language. It
must also define diagnostics for missing, repeated, or empty row labels.

## Presentation Contract

- Enable the sticky column only for a table explicitly identified as having row
  headers and only while that table overflows horizontally.
- Keep the column-header intersection cell sticky on both axes without
  duplicating accessible content.
- Give sticky cells an opaque palette-derived background and a restrained
  inline separator so scrolled cells cannot show through.
- Bound the row-label column so it cannot consume most of a narrow viewport.
  Long labels may wrap; they must not be silently truncated.
- Keep keyboard focus, overflow cues, table semantics, text selection, and
  screen-reader header associations intact.
- Do not apply the behavior to tables inside callouts or other bounded
  containers until their available-space contract is demonstrated.

## Acceptance Criteria

- Valid source produces body `<th scope="row">` cells and a sticky first column
  only when horizontal scrolling is active.
- A table without the explicit row-header declaration retains current markup
  and presentation.
- The top-left cell remains legible where sticky row and column headings meet.
- The sticky column remains inside the table scroll region and creates no
  document-level overflow.
- Keyboard, screen-reader, 320 CSS-pixel, browser-zoom, Dark appearance, forced
  colors, and no-JavaScript tests pass.
- Invalid row-header declarations receive a source-file and line-aware
  diagnostic rather than being ignored.

## Complexity And Risk

Expected implementation complexity is medium after the syntax decision. The
CSS is bounded, but the authoring model, Markdown transformation, diagnostics,
and accessible table semantics all change. An automatic first-column rule would
be simpler to build but is rejected because it can assign false relationships
to arbitrary data.
