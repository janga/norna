# BL-009: Semantic Callouts

## Outcome

Procedures and reference pages can distinguish notes, tips, warnings, and
hazards from ordinary prose without using arbitrary colors or cards.

## Dependency

Implement after the first page-output sequence is stable. This feature changes
Markdown parsing, presentation, localization, and search semantics together.

## First Scope

- Evaluate an interoperable Markdown convention before adding a Norna block.
- If a Norna block is required, expose one construct with a closed semantic
  tone set.
- Provide built-in localized labels, accessible structure, and preset-owned
  presentation.
- Do not permit arbitrary colors or nested callouts initially.

## Acceptance Criteria

- Syntax remains readable and diagnosable in plain Markdown.
- Meaning does not depend on color or icon alone.
- Callout text participates predictably in search and copy operations.
- All presets provide sufficient contrast in Light and Dark appearances.
