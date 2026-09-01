# BL-008: Long Navigation Tree Controls

## Outcome

Readers can efficiently explore a large local navigation tree and return to
their current page without losing spatial orientation.

## Dependency

Implement after `BL-006` so active-page and traversal behavior is stable.

## First Scope

- Show controls only when tree size makes them useful.
- Provide explicit `Expand all`, `Collapse all`, and `Locate current page`
  commands.
- Preserve manual branch state when following links where feasible.
- Keep normal links and disclosures usable without JavaScript.

## Acceptance Criteria

- Keyboard focus remains predictable after every command.
- State changes are announced to screen readers.
- Commands do not unexpectedly collapse unrelated branches or shift the page.
- Desktop, mobile, short-page, and long-page behavior have separate tests.
