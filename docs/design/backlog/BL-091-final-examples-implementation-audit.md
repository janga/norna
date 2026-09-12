# BL-091: Final Examples Audit Against Implemented Behavior

Refreshed on 2026-09-12 for BL-049: Content Alternatives. The gallery now
contains 22 sections, including native tabs with an exact source comparison.
The capability table has eleven rows. All four gallery browser cases,
documentation and content checks, and the complete Pages build pass. Human
review remains pending; unchanged contracts reuse their existing evidence.

## Status And Dependencies

The affected audit entries were refreshed after the user's review corrections:
BL-092: Top navigation without a duplicate section row,
BL-093: Missing descriptions in child-page lists,
BL-094: Child-page descriptions that explain a choice, and
BL-095: Nested navigation for substantial documentation. Focused checks and
the documentation build passed; previous verification was reused for
unchanged examples. Final human gallery review is still pending.

Technical audit completed on 2026-09-11; awaiting human gallery review. All
20 examples were checked against current implementation, exact source,
reference, and rendered output. Focused browser checks, content and
documentation checks, and the complete Pages artifact build passed.

See the per-section evidence, corrections, and remaining review instructions
in [Examples content audit](../examples-content-audit.md). No human approval
has been inferred from the automated results.

This audit ran last in the correction sequence for
[BL-083: Result-first single-page examples](BL-083-result-first-single-page-examples.md).
The following implementation and verification prerequisites are complete:

1. [BL-084: Readable table columns without broken words](BL-084-readable-table-columns.md).
2. [BL-085: Adaptive width for long code examples](BL-085-adaptive-code-width.md).
3. [BL-086: One consistent navigation contract in documentation](BL-086-consistent-navigation-reference.md).
4. [BL-087: Direct section access from top navigation](BL-087-top-navigation-section-access.md).
5. [BL-088: Child-page lists that help readers choose](BL-088-useful-child-page-list-example.md).
6. [BL-089: Navigation illustrations generated from runnable examples](BL-089-runnable-navigation-illustrations.md).
7. [BL-090: Readable examples with exact source and clear syntax boundaries](BL-090-exact-readable-examples.md).

## Outcome

Every section of the public Examples page accurately demonstrates current
Norna behavior. A reader can reproduce its result with the shown source and
explicit prerequisites, follow its reference link, and distinguish shipped
features from experimental or unavailable behavior.

## Audit Method

- Inventory every H2 example in `site/pages/030-examples/content.md`, not just
  the table and navigation sections that triggered this work.
- Compare each claim with the relevant parser, schema, default, component or
  CLI behavior, focused tests, and canonical documentation. A passing content
  check alone does not establish source/result fidelity.
- Render or inspect the exact displayed source, including required files,
  image references, metadata, and surrounding configuration. For commands,
  use disposable site copies when validating a write operation.
- Check screenshot provenance, source paths, responsive state, captions, alt
  text, and continued relevance after the preceding navigation changes.
- Verify presets and overrides, palettes and Appearance, reader controls,
  search and language boundaries, managed images and page moves, site-wide
  elements, and accessibility claims as well as Markdown constructs.
- Check that linked complete sites still illustrate what the text promises
  and that every published example remains discoverable.
- Record a compact per-section result and source of evidence in
  `docs/design/examples-content-audit.md`. Fix remaining scoped discrepancies;
  record unresolved product decisions or defects explicitly with backlog links.

## Acceptance And Verification

- Every example has been checked against current implementation and has no
  unresolved misleading claim, unsupported syntax, or unexplained source/result
  mismatch. Planned behavior is never presented as implemented.
- Canonical links and source classifications are correct. Necessary context is
  concise, and the gallery remains result-first on one page.
- Inspect desktop, compact, mobile, Light, Dark, reading-width changes, and
  Focus reading, plus keyboard and no-JavaScript behavior where relevant.
- Reuse preceding focused test results when the implementation is unchanged.
  Add only meaningful missing coverage; do not rerun the full suite solely to
  close the backlog item.
- Run the final relevant content, documentation-link, build, and Pages artifact
  checks when their affected inputs have changed since the last verified run.
- Present the final visual review with registered local URLs. Do not mark a
  visual result approved on the user's behalf.
- Close this item and its parent only after corrections and verification are
  complete and applicable human review is recorded.
