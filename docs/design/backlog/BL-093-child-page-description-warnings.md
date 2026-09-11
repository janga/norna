# BL-093: Missing Descriptions In Child-Page Lists

## Status And Dependencies

Ready. Uses the existing page tree, `page-list` block, and `page.description`;
no new public syntax or configuration is needed.

## Outcome

Help authors make child-page lists useful beyond the navigation tree. When a
page uses `page-list`, content validation warns about each displayed child
whose `page.description` is missing or blank. The warning identifies the
parent list and the child's source file, and explains where to add a short
description that helps readers choose.

## Acceptance And Verification

- Reuse the same listed direct-child selection as rendering. Do not warn for
  excluded children, navigation categories, or deeper descendants that are
  not displayed by the list.
- Keep the warning non-blocking: valid content still checks and builds. Do
  not require descriptions on pages that are not included in a `page-list`.
- Cover missing, blank, and present descriptions; a parent without a list;
  excluded children; categories; indirect descendants; and repeated list
  blocks without duplicate warnings for the same parent/child relationship.
- Document the warning and the purpose of descriptions in the canonical
  child-page-list reference. Preserve the existing error for an empty list.
- Run focused content validation tests; no visual approval is needed for
  this CLI diagnostic and its deterministic selection contract.
