# BL-028: Automatic Page Move And Reconciliation

## Outcome

A user can move a page through Norna, or reconcile a page already moved by
hand, while updating every unambiguous internal reference and optionally
preserving old public URLs.

## Dependencies

Build on the canonical link graph from `BL-001` and the alias/output collision
model from `BL-010`.

## First Scope

- Accept explicit old and new logical page URLs.
- When the old page exists and the new page does not, plan the physical page
  directory move.
- When the old page is absent and the new page exists, treat the operation as
  reconciliation after a manual move.
- Map unchanged descendants by replacing the explicit old URL prefix with the
  new URL prefix and verify every resulting page and anchor.
- Update direct Markdown links, reference definitions, and Norna card links by
  their exact source ranges.
- Plan aliases for the moved page subtree unless the user explicitly opts out.
- Print a complete dry-run plan before changing files.

## Safety Rules

- If both old and new pages exist, or neither exists, stop with a focused
  diagnostic.
- Never select among multiple possible destinations or infer a move from a
  similar title alone.
- Build and validate the complete edit plan before moving a directory or
  writing Markdown.
- Apply edits from the end of each file toward the beginning so source ranges
  remain stable.
- Run the shared link and URL-collision checks after applying the plan.

## Acceptance Criteria

- A normal move and an already-completed manual move produce the same final
  page tree, links, and aliases.
- Query strings and fragments are preserved while page pathnames are updated.
- Shared reference definitions are edited once even when used several times.
- A failed preflight changes no file.
