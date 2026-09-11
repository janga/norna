# BL-007: Explicit Child Page List

## Outcome

An overview page can place an automatically maintained list of its direct child
pages in normal Markdown flow.

## Dependency

Implement after `BL-006` so both features share traversal and page-inclusion
rules.

## First Scope

- Add an explicit `page-list` block with no manually repeated membership.
- Derive order, titles, URLs, and optional descriptions from the page graph.
- Keep placement under editorial control; never inject a list automatically.
- Define how direct navigation-only categories and missing descriptions render
  before implementation.

## Acceptance Criteria

- Moving, adding, or removing child pages updates the list deterministically.
- The block cannot list unrelated branches or create a second page hierarchy.
- Empty lists and unsupported placement receive clear diagnostics.
- Output is useful without client-side JavaScript.

## Example Follow-Up

The existing list is demonstrated too redundantly beside the navigation tree.
[BL-088: Child-page lists that help readers choose](BL-088-useful-child-page-list-example.md)
will show a meaningful choice using child-page descriptions, without extending
the implemented `page-list` syntax or inclusion rules.
