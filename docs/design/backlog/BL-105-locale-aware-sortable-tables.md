# BL-105: Locale-Aware Sortable Tables

Status: Local prototype; sticky-heading integration must be corrected before
the implementation is committed. Human visual review and documentation remain.

## Verification Checkpoint: 2026-09-14

`npm run test:table-sorting` passed all three existing browser tests: Swedish
text ordering, numeric/date/mixed columns, empty cells, ties, keyboard use,
source-order reset, and no-JavaScript fallback. `npm run test:client-javascript`
also passed against an isolated export containing the proposed table changes.

Code review found an uncovered interaction: horizontally overflowing tables
use a cloned sticky heading marked `inert` and `aria-hidden`. Sorting controls
are copied into that visual heading without their event listeners. They look
interactive but cannot sort the table. The existing short-table fixture does
not exercise this state.

Before committing the implementation, make the visible sticky sorting control
usable without introducing duplicate keyboard stops or duplicate accessible
headers. Add a long, horizontally overflowing table test that sorts while the
sticky heading is visible and verifies the direction indicator and row order.
Exercise resizing and keyboard operation as part of that regression.

## Problem

Norna presents Markdown tables as readable, responsive tables, but readers
cannot reorder a long comparison table. They must scan the author's original
row order even when a different ordering would make comparison easier.

## Decision

Every rectangular Markdown table with a header row gets progressive sorting
controls on its column headings. The static HTML remains in source order when
JavaScript is unavailable.

`config.language` is the site's primary content language and the locale for
Norna's interface. The same configured BCP 47 tag is used for locale-aware
text comparison through `Intl.Collator`. Norna does not infer a different
locale from individual cells.

## Sort contract

- The first click on a column sorts ascending.
- The second click sorts descending.
- The third click restores the original source order.
- Empty cells are always placed after non-empty cells.
- Equal values retain their original relative order.
- A column containing only unambiguous numeric values (apart from empty
  cells) sorts numerically.
- A column containing only valid ISO dates (`YYYY-MM-DD` or an ISO date-time)
  sorts chronologically.
- Mixed, unknown, or ambiguous values sort lexically using the configured
  locale.
- Initial page order is unchanged until a reader activates a control.

Numeric parsing is deliberately conservative. Localized or ambiguous formats
such as `1,5` and `01/02/2026` are not interpreted automatically in this
version.

## Interaction and fallback

Column headings expose real keyboard-operable buttons. The table header
reports `aria-sort` for the active column and the visual indicator shows the
current direction. Sorting is a client-side enhancement; the native table,
header relationships, horizontal scrolling, and source order remain usable
without JavaScript.

Tables with irregular spans or no usable header row remain unchanged rather
than receiving a partial or misleading sort model.

## Acceptance criteria

- A standard Markdown table receives one sort control per column heading.
- Text sorting follows the configured BCP 47 locale, including Swedish
  ordering when `language: sv` is configured.
- Numeric-only, ISO-date-only, mixed, and empty-cell columns follow the sort
  contract above.
- The three-click cycle is ascending, descending, original order.
- Sorting preserves complete table rows and stable order for ties.
- `aria-sort`, keyboard activation, and visible direction indicators reflect
  the active state.
- No-JavaScript output contains no interactive sort controls and retains the
  original native table.
- Existing responsive width, sticky heading, row-header, overflow, and
  reduced-motion behavior remains intact.
- Focused browser tests cover locale, type detection, empty cells, stable
  sorting, reset, keyboard use, and the no-JavaScript fallback.

## Documentation follow-up

After human review of the visible control, document sortable tables in the
canonical content reference and the relevant HTML examples page.
