# BL-170: Subscript Superscript And Highlighted Text

## Purpose

Support small text distinctions such as H₂O, m² and a highlighted passage with
predictable presentation in Norna content.

**Status: Needs decision.** The owner requested one combined brief for these
three closely related forms on 2026-10-04.

## Scope And Boundaries

Evaluate `<sub>`, `<sup>` and `<mark>`, which passed through the earlier HTML
build probe. Establish supported contexts and presentation. Full mathematical
notation belongs to BL-053; ordinary bold, italic and code already exist.

## Decisions Made

Keep these three forms together as a small authoring topic. Their inclusion in
the backlog does not select a new shorthand or arbitrary text-color controls.

## Preliminary Proposals

Start with the existing semantic elements and consider established Markdown
shorthand only where it materially improves writing. Use Examples to show
chemical notation, a unit and a highlighted phrase.

## Open Questions

1. Which source forms should Norna document and support?
2. How should subscript and superscript affect line spacing in paragraphs,
   headings and table cells?
3. How should highlighted text remain clear across appearances, printing and
   selection, and what meaning should authors attach to it?

## Dependencies

Use the [BL-161 audit](../common-html-authoring-audit.md). Coordinate syntax
with [BL-053 Accessible Mathematics](BL-053-accessible-mathematics.md) without
making these simple text forms depend on a mathematics renderer.

## Ready For Implementation When

The source forms, supported contexts and visual rules are agreed, with source
and result examples for each form.
