# BL-105: Locale-Aware Sortable Tables

Status: Completed and human-approved on 2026-09-14, including sticky-heading
sorting and 500 ms tooltips. The content and configuration references,
client-side JavaScript contract, and HTML example document the behavior.

## Next-Action Labels: 2026-09-14

The original and sticky sort buttons now name the next action in the site's
language: sort ascending, sort descending, or restore original order. Hover
help uses a custom tooltip; the accessible name includes the column
name followed by that action. Indicators and `aria-sort` still describe the
current order, not the next action. Changing columns resets the former
column's action to ascending.

This changes help text, not the three-click cycle or heading styling. The
maintainer approved the hover help on the long-table example.

Focused verification passed: `npm run test:locales` and the two browser cases
for source-header sorting and sticky-header sorting. These check next-action
titles, accessible names, column switching, and synchronization through the
three-state cycle. The sticky test checks stored labels on the hidden source
buttons separately from the accessible names of exposed controls. No full
browser suite or manual screen-reader test was run for this change.

The follow-up replaces native `title` help with a controlled tooltip: 500 ms
on pointer hover, immediate on keyboard focus, immediate text updates after
sorting, and Escape dismissal without losing focus. The tooltip remains
available when the pointer moves over it and is constrained to the viewport.
Do not retain a native title that could display a second delayed popup.
The visual result is approved and public documentation is updated.

The focused tooltip browser test passed with a controlled clock at 499/500 ms,
immediate updates after sorting, hover persistence, keyboard focus, Escape,
and a 390px Dark viewport. It caught and corrected premature dismissal when
keyboard focus scrolls a clipped column into view. Light desktop and Dark
mobile screenshots were inspected and the maintainer approved the result.

Final regression checks covered all 12 table-sorting cases across focused
runs, including the nine remaining cases after visual approval. The five
responsive table-context cases also passed. Locale-label and static
presentation checks passed during implementation. Documentation checks passed
after the reference and HTML updates. No full `npm test` run or manual
screen-reader evaluation was performed.

The two targeted presentation-baseline table cases also passed, covering page
overflow and synchronized sticky headings. `npm run build` passed, including
configuration/content validation and the documentation site's search index.

## Verification Checkpoint: 2026-09-14

The original three tests missed an interaction with horizontal overflow: the
sticky heading was an inert visual copy, so its sort buttons did nothing.

The corrected sticky heading has functional buttons that invoke the same
sorting action as the original buttons. Both direction indicators stay in
sync. Only the currently displayed set is exposed to keyboard and assistive
technology. The original table retains named column headers and `aria-sort`;
the sticky controls are a group, not a second accessible table header.

Sticky button elements survive geometry updates. When overflow starts or ends,
focus transfers to the equivalent button without scrolling the page. Keyboard
focus on a clipped column scrolls that column into view.

Verification:

- `npm run test:table-sorting`: seven browser tests passed, covering Swedish
  ordering, numeric/date/mixed columns, empty cells, ties, keyboard use, reset,
  and no-JavaScript fallback. Long-table cases cover sticky sorting, indicator
  synchronization, unique accessible headers/buttons, focus retention at
  390-1200px, overflow transitions, horizontal keyboard navigation, and real
  Display-panel changes to Focus reading and reading width.
- `npm run test:table-context:browser`: five existing responsive-table tests
  passed, including rail transitions, pinned row headers, RTL geometry,
  no-JavaScript output, Dark appearance, and forced colors.
- Browser accessibility assertions verify the DOM contract, not actual
  screen-reader announcements. No manual screen-reader test was performed.

Review the maintained source at `fixtures/table-sorting/site`. Prepare it with
`npm run review:scratch -- prepare --from fixtures/table-sorting/site --replace`
and start `npm run review:start -- scratch`. The long table is then available at
`http://127.0.0.1:4399/long-table/#comparison`. Scroll down, sort Count, change
reading width or Focus reading, and narrow the browser to exercise overflow.

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

Tables with irregular spans, multiple header rows, interactive content in the
headings, or no usable header row remain unchanged rather than receiving a
partial or misleading sort model.

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

## Documentation

Completed in `docs/content.md` (Sorting and Width And Scrolling),
`docs/configuration.md` (language), `docs/client-javascript.md`, and the
documentation site's Examples table section.
