# BL-009: Semantic Callouts

## Outcome

Procedures and reference pages can distinguish notes, tips, warnings, and
hazards from ordinary prose without using arbitrary colors or cards.

## Dependency

Implement after the first page-output sequence is stable. This feature changes
Markdown parsing, presentation, localization, and search semantics together.

## Evidence

Callouts were the most prevalent unsupported content construct in the primary
sources reviewed by the completed `BL-046` migration inventory. They occur in
76 of 94 reviewed Docusaurus documentation files, 44 of 96 Material for
MkDocs files, 15 of 36 VitePress files, and 10 of 37 English Starlight files.
All four systems attach meaning such as note, tip, warning, or danger rather
than exposing an arbitrary background color.

## Syntax Status: Review Required

Do not implement this item until the public syntax and tone mapping are
approved. The syntax must remain understandable when viewed as plain Markdown.

- [Docusaurus admonitions](https://docusaurus.io/docs/markdown-features/admonitions)
  and [VitePress custom containers](https://vitepress.dev/guide/markdown#custom-containers)
  use fenced directives. They are concise, but require a matching closing
  marker and differ in title syntax.
- [Material for MkDocs admonitions](https://squidfunk.github.io/mkdocs-material/reference/admonitions/)
  use an indented `!!! type` form. Copying it would make indentation part of a
  new Norna block grammar.
- [Starlight asides](https://starlight.astro.build/components/asides/) use MDX
  components as well as a Markdown-specific alternative. The component form
  does not fit Norna's plain-file content model.
- GitHub's alert blockquote form, such as `> [!WARNING]`, has a readable
  blockquote fallback and is already accepted by VitePress. Evaluate it as the
  preferred starting point before inventing Norna syntax.

Whichever form is selected, Norna still needs one closed list of meanings and
one rule for optional titles. Similar-looking competitor types must map to a
supported meaning or produce a migration warning; they must not silently map
to arbitrary colors.

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
