# BL-053: Accessible Mathematics

## Purpose And Status

Let authors write LaTeX-style mathematical notation in Markdown and publish
accessible inline and display mathematics on a level comparable to established
documentation systems. This covers equations, not complete `.tex` documents.

**Status: Prioritized by the owner on 2026-10-03; needs implementation design.**
The decision to add mathematics support supersedes the earlier gate requiring
two maintained Norna sites before native rendering could be pursued.

## Evidence

[Docusaurus](https://docusaurus.io/docs/markdown-features/math-equations),
[VitePress](https://vitepress.dev/guide/markdown#math-equations), and
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/reference/math/)
support TeX-style inline and display mathematics through options or
extensions. Docusaurus also documents a fenced `math` form. Norna currently
has no native mathematics renderer; static conversion is the migration path.

## Scope And Preliminary Syntax

Prefer the established inline `$...$` and display `$$...$$` forms instead of
a Norna-specific block. Evaluate fenced `math` and backslash-delimited forms
as compatibility forms where they materially help migration; do not silently
accept several forms with different semantics. Define escaping, currency-like
text, code spans, code fences, malformed delimiters, and whether math is
permitted in headings, links, tables, tabs and callouts.

Keep the equation source in `content.md`. A valid expression must render in
local preview and published output. Preserve static conversion as a temporary
migration option; a picture of a formula without equivalent text is not an
acceptable result.

## Open Decisions

- Compare build-time KaTeX, MathJax and static output for supported commands,
  accessibility, package size, build time, font assets and Light/Dark themes.
- Choose a maintained TeX subset and a single normative authoring contract.
  Establish MathML or another useful screen-reader representation without
  requiring page-wide client JavaScript.
- Specify overflow, wrapping, zoom or scrolling for long equations on narrow
  screens; check print, copied text and search indexing.
- Define page-and-line diagnostics for malformed or unsupported expressions
  and a way to inspect source without exposing renderer stack traces.

## Ready For Implementation When

- A tested source grammar, renderer and asset model cover inline and display
  math, errors, accessibility and no-JavaScript output.
- Representative equations remain understandable in print, search, copied
  text, and assistive technology at narrow and wide widths.
- Examples and reference pages clearly identify LaTeX-style math as an
  extension, not standard Markdown or GFM.
