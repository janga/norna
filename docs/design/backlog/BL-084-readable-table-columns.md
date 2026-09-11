# BL-084: Readable Table Columns Without Broken Words

## Status

Implemented and verified with five focused table browser tests on 2026-09-11.
Visual review is included in the final Examples audit. First in the correction sequence for
[BL-083: Result-first single-page examples](BL-083-result-first-single-page-examples.md).

## Problem

The Examples comparison table can reduce its row-label column to approximately
57 CSS pixels including padding. `overflow-wrap: anywhere` then breaks normal
words in labels such as "Internal links". A table can technically fit while
its labels are needlessly difficult to read.

The relevant rules are in `src/styles/content.css`; available-width selection
is in `src/components/TableOverflowScript.astro`.

## Outcome And Scope

Keep ordinary words intact and give row labels enough width to identify each
row. Apply the correction to tables generally, not to an Examples selector,
particular label, language, or preset.

- Account for natural word widths and cell padding before deciding a table
  fits its current layout.
- Wrap multiword labels at normal word boundaries. Retain bounded emergency
  wrapping for exceptionally long identifiers and URLs.
- Reuse the existing prose, available end margin, full safe canvas, and
  horizontal-scroll progression; do not overlap visible navigation or notes.
- Keep the sticky label column bounded on narrow screens so other columns
  remain reachable. Preserve header associations and synchronized sticky
  column headings.
- Add no new author setting or table syntax for this correction.

## Acceptance And Verification

- Ordinary labels remain readable without splitting their words at desktop,
  compact, and mobile widths; no content is clipped or silently truncated.
- Long unbroken strings remain accessible without document-level overflow.
- Explicit row headers, ordinary tables, and tables inside callouts retain
  their respective semantics and containment rules.
- Resize, Focus reading, and reading-width changes produce a stable layout
  with usable sticky headings and overflow controls.
- Extend the existing focused table tests with short labels, multiword labels,
  and a long token. Include no-JavaScript access and human visual review.
- Update the table reference only where the corrected behavior needs an
  explanation. The example rewrite belongs to
  [BL-090: Readable examples with exact source and clear syntax boundaries](BL-090-exact-readable-examples.md).

## Related Work

This follows the implemented
[BL-063: Sticky row labels in wide tables](BL-063-sticky-table-row-labels.md)
and reuses
[BL-060: Adaptive table width escalation](BL-060-adaptive-table-width.md).
