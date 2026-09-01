# BL-006: Previous And Next Page Navigation

## Outcome

Tutorial and guide readers can move through a deliberate page sequence without
reopening the complete navigation tree.

## Dependency

Implement after `BL-001`; traversal must use the same listed-page graph as
navigation and validation.

## First Scope

- Derive links without new page metadata.
- Traverse listed routable pages depth-first within the active top-level area.
- Do not cross to another global navigation root in the first version.
- Exclude unlisted pages and skip navigation-only categories as destinations.

## Acceptance Criteria

- First and last pages render only the available direction.
- Labels, focus treatment, and reading order work on desktop, mobile, keyboard,
  and screen readers.
- Links work without client-side JavaScript.
- Category and nested-page traversal is covered by page-model tests.
