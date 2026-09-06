# BL-009: Semantic Callouts

## Outcome

Procedures and reference pages can distinguish notes, tips, warnings, and
hazards from ordinary prose without using arbitrary colors or cards.

## Dependency

Implement after the first page-output sequence is stable. This feature changes
Markdown parsing, presentation, localization, and search semantics together.

## Evidence

Callouts are the most prevalent unsupported content construct in the primary
sources reviewed by the
[migration compatibility inventory](../migration-compatibility.md). They occur
in 76 of 94 reviewed Docusaurus documentation files, 44 of 96 Material for
MkDocs files, 15 of 36 VitePress files, and 10 of 37 English Starlight files.
All four systems attach meaning such as note, tip, warning, or danger rather
than exposing an arbitrary background color.

## First Scope

- Evaluate the readable GitHub alert blockquote convention before adding a
  Norna-specific block. VitePress already supports that form alongside its
  custom containers.
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
