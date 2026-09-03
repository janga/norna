# BL-008: Long Navigation Tree Controls And Filtering

## Outcome

Readers can efficiently explore a large local navigation tree and return to
their current page without losing spatial orientation. They can narrow a long
tree by page or category title without confusing that operation with full-site
content search.

## Dependency

Implement after `BL-006` and `BL-036` so active-page traversal and the scope of
the local tree are stable.

## First Scope

- Show controls only when tree size makes them useful.
- Provide explicit `Expand all`, `Collapse all`, and `Locate current page`
  commands.
- Provide one clearly labelled filter for page and category titles. Filtering
  narrows the existing tree; it does not search page contents and does not
  replace `BL-005` static search.
- Reveal matching nodes with their ancestors so every result retains its place
  in the hierarchy.
- Clearing the filter restores the reader's previous expansion state and
  current-page context.
- Preserve manual branch state when following links where feasible.
- Keep normal links and disclosures usable without JavaScript.

## Acceptance Criteria

- Keyboard focus remains predictable after every command.
- State changes are announced to screen readers.
- The filter has an accessible name, reports the number of matching pages, and
  presents a clear empty state without removing access to the current page.
- Commands do not unexpectedly collapse unrelated branches or shift the page.
- With JavaScript unavailable, the complete navigable tree remains available
  and only the enhancement controls are absent.
- Desktop, mobile, short-page, and long-page behavior have separate tests.

## Reference

Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/top-shelf)
place a compact `Filter` control immediately above the independently scrollable
local navigation tree. Norna should adopt the discoverability and proximity of
that pattern without copying Apple's virtualized implementation or requiring
filtering for short trees.
