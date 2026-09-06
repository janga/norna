# BL-053: Accessible Mathematics

## Outcome

Decide whether Norna should render mathematical notation from source or retain
static conversion as the migration path for scientific and mathematical
documentation.

## Evidence

[Docusaurus](https://docusaurus.io/docs/markdown-features/math-equations),
[VitePress](https://vitepress.dev/guide/markdown#math-equations), and
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/reference/math/)
support TeX-style mathematics through built-in options or extensions. The
completed `BL-046` review found the capability relevant to a narrower audience
than callouts, code metadata, or content alternatives.

## Syntax Status: Evidence And Review Required

If native support is justified, prefer the established inline `$...$` and
display `$$...$$` forms instead of a Norna-specific block. Before accepting
them, define escaping, currency-like text, code spans, code fences, malformed
delimiters, and whether inline mathematics is permitted in headings or links.

Until then, migration should retain the formula source and use accessible
static HTML or SVG output. A picture of a formula without an equivalent text
description is not an acceptable conversion.

## Evidence Required

- Identify at least two maintained Norna sites or representative migrations
  where ordinary Unicode and prose cannot express the required notation.
- Compare build-time KaTeX, MathJax output, and pre-rendered static output for
  accessibility, package size, build time, fonts, and Light/Dark appearances.
- Verify whether the selected renderer can produce useful MathML or another
  screen-reader representation without page-wide client JavaScript.
- Establish the minimum TeX subset that Norna can validate and support.

## Acceptance Criteria For Decision

- The decision states which user need cannot be met by static conversion.
- Any native proposal uses one established source grammar and one maintained
  build-time renderer.
- Mathematical content remains understandable in print, search, copied text,
  and assistive technology.
- Invalid source reports the page and line without exposing a renderer stack
  trace.
- If evidence remains weak, document static conversion and close this item
  without adding product code.
