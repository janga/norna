# BL-048: Code Titles And Line Emphasis

## Outcome

Technical examples can identify their source file and emphasize relevant lines
without surrounding prose having to recreate code-block presentation.

## Evidence

Docusaurus, VitePress, Material for MkDocs, and Starlight all document code
titles and richer code emphasis. The source reviewed by the completed `BL-046`
migration inventory uses rich code metadata widely, while Norna currently
preserves only the fence language and code text.

## Syntax Status: Bounded Review Required

Keep this extension on ordinary fenced code blocks. Docusaurus, VitePress, and
Material for MkDocs all add metadata to a fence, but their line-selection
grammars differ. The Docusaurus-style quoted title is a useful candidate
because it is explicit and remains adjacent to the code it describes:

````md
```js title="src/config.js" {2}
export const mode = 'safe';
```
````

Reuse `title="..."` unless parser tests reveal an ambiguity. Choose the line
selector only after comparing the documented
[Docusaurus](https://docusaurus.io/docs/markdown-features/code-blocks),
[VitePress](https://vitepress.dev/guide/markdown#syntax-highlighting-in-code-blocks),
and [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/reference/code-blocks/)
forms. Do not combine several dialects or introduce a `norna-code` block.

## Dependency

Implement after `BL-009` so the two Markdown grammar additions are introduced
and tested in sequence rather than changing the parser contract concurrently.

## First Scope

- Extend ordinary fenced code blocks rather than adding a `norna-code` block.
- Accept an optional quoted `title="..."` after the language.
- Accept one documented line-range notation for visual emphasis.
- Preserve ordinary fences with only a language exactly as they work today.
- Reject unknown or malformed metadata with the source file and line number;
  never discard an intended title or emphasis silently.
- Render the title and emphasized lines without client-side JavaScript.
- Keep the existing copy control, and copy only the code text.
- Defer line numbers, inserted/deleted line semantics, code annotations,
  execution, and live playgrounds.

## Acceptance Criteria

- Titles, single lines, comma-separated lines, and ranges have deterministic
  syntax and output.
- Highlighting uses a non-color cue and meets contrast requirements in every
  preset and appearance.
- Screen readers encounter the title before the code and do not hear
  presentation-only line markers.
- Invalid metadata receives an actionable `content:check` diagnostic.
- Long titles and narrow screens do not overlap the copy control or code.
- Migration examples cover the equivalent Docusaurus, VitePress, Material,
  and Starlight forms.
