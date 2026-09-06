# BL-047: Standard Reference Footnotes

## Outcome

Authors can use standard GFM reference footnotes for citations and
supplemental material that does not belong in Norna's one-note-per-paragraph
side-note model.

## Evidence

Norna's Satteri renderer already parses `[^id]` references and definitions.
The behavior is not documented as a Norna contract and lacks focused page,
localization, style, and regression coverage. Reference footnotes occur in 31
of the 96 Material for MkDocs source files reviewed in the
[migration compatibility inventory](../migration-compatibility.md), and are
also documented by VitePress.

## First Scope

- Keep the interoperable `[^id]` reference and `[^id]: definition` syntax.
- Do not adopt VitePress's nonstandard `^[inline note]` extension.
- Keep reference footnotes distinct from `{note-ref}` side notes and explain
  when each model is appropriate.
- Supply localized footnote labels and return-link labels through the existing
  Norna locale model.
- Style the generated endnotes for every preset without requiring JavaScript.
- Add parser and built-output coverage for repeated references, multiline
  definitions, links, and footnotes declared in a different page section from
  their reference.

## Acceptance Criteria

- `content:check` and the build agree on accepted reference-footnote syntax.
- Every reference and return link has an accessible name and a unique target.
- English and Swedish sites receive localized generated labels.
- Reference footnotes remain readable when CSS or client JavaScript is absent.
- Existing Norna side notes keep their current authoring and placement rules.
- Canonical content documentation describes both note models without implying
  that one is a visual alias for the other.

