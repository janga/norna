# BL-011: Edit Source Links

## Outcome

Readers of open-source documentation can open the Markdown source for the
current page in its repository.

## Dependency

Implement after the canonical page and URL work. It is otherwise independent
of search and new Markdown constructs.

## First Scope

- Derive the source path from the authoritative page model.
- Define repository, branch, repository-subdirectory, and local-build behavior.
- Show links only when a complete valid source URL can be produced.
- Defer Git-derived last-updated dates to a separate item.

## Acceptance Criteria

- Root repositories, project subdirectories, and nested pages produce correct
  source URLs.
- Local or incomplete configuration omits the link without a broken target.
- Link text is localized and understandable out of context.
- Shallow clones and non-default branches have documented behavior.
