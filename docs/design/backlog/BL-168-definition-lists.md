# BL-168: Definition Lists

## Purpose

Let authors pair terms, parameters or settings with explanations without
forcing longer descriptions into a table.

**Status: Needs decision.** Separate design item requested on 2026-10-04.

## Scope And Boundaries

Cover a term followed by one or more descriptions, including descriptions
containing paragraphs, links or short lists. Compare HTML `<dl>/<dt>/<dd>`
with established Markdown definition-list syntax. Automatic lookup of terms
belongs to BL-169.

## Decisions Made

The owner approved a separate brief. The source syntax and supported content
inside descriptions have not been selected.

## Preliminary Proposals

Prefer an established authoring form with a clear term–description relationship.
Evaluate a glossary excerpt and a command-parameter reference. Keep the reading
sequence clear when explanations become long or the viewport becomes narrow.

## Open Questions

1. Should Norna support HTML syntax, Markdown definition lists, or both?
2. Which content is useful inside a description, and should several terms
   be able to share one description?
3. Should terms support links or anchors, and how should the list interact
   with the page outline?

## Dependencies

Build on [BL-161](BL-161-norna-shaped-alternatives-to-common-html.md).
Coordinate terminology with
[BL-169 Abbreviations And Glossaries](BL-169-abbreviations-and-glossaries.md);
a definition list can be delivered independently of shared term lookup.

## Ready For Implementation When

The syntax, permitted description content and layout are agreed, with a
copyable Examples entry showing both short and multi-paragraph definitions.
