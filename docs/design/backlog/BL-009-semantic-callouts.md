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

## Syntax Contract

Use the GitHub alert blockquote form so the source remains understandable when
viewed as plain Markdown:

```md
> [!WARNING]
> Back up the current site before replacing its configuration.
```

The first release accepts `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`, and
`DANGER`. Type names use uppercase ASCII letters. Labels are built in and
localized; custom titles, arbitrary colors, and nested callouts are invalid.

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
- GitHub's alert blockquote form has a readable blockquote fallback and is
  already accepted by VitePress. Norna adopts this form rather than inventing
  another fenced block.

Similar-looking competitor types must map to a supported meaning or produce a
migration warning; they must not silently map to arbitrary colors.

## First Scope

- Parse the GitHub alert blockquote convention with the closed semantic type
  set above.
- Provide built-in localized labels, accessible structure, and preset-owned
  presentation.
- Do not permit arbitrary colors or nested callouts initially.

## Acceptance Criteria

- Syntax remains readable and diagnosable in plain Markdown.
- Meaning does not depend on color or icon alone.
- Callout text participates predictably in search and copy operations.
- All presets provide sufficient contrast in Light and Dark appearances.
