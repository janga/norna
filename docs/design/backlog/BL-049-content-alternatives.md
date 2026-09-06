# BL-049: Content Alternatives

## Outcome

Norna has a deliberate answer for equivalent operating-system, package-manager,
programming-language, and API variants currently represented by tabs in other
documentation systems.

## Evidence

Tabs occur in all four primary documentation systems reviewed in the
[migration compatibility inventory](../migration-compatibility.md). They occur
in 38 of 96 reviewed Material for MkDocs files, 16 of 94 Docusaurus files, and
8 of 37 English Starlight files. The construct is common enough to require a
migration rule, but frequency alone does not settle a suitable Norna syntax.

## Decisions Required

- Decide whether the first native scope is code groups only or arbitrary
  Markdown alternatives.
- Choose syntax that remains understandable in plain source and can contain
  fenced code without fragile nesting.
- Define the no-JavaScript and print result. Every alternative must remain
  available in document order.
- Decide whether a choice can synchronize across groups or pages and, if so,
  how persistence and privacy work.
- Define deep links, browser history, search indexing, copy behavior, keyboard
  operation, and screen-reader relationships.
- Decide how tab labels relate to H2/H3 navigation. The first implementation
  should not hide complete H2 page sections.

## Acceptance Criteria For Design

- A corpus includes representative Docusaurus, VitePress, Material, and
  Starlight source with code-only and mixed-content tabs.
- The proposed syntax has an explicit loss-minimizing heading fallback.
- The design works in ordinary Markdown editing tools without requiring MDX.
- A prototype demonstrates pointer, keyboard, screen-reader, print,
  no-JavaScript, narrow-screen, and search behavior before implementation is
  scheduled.
- The design explains why content alternatives add enough value beyond visible
  consecutive headings.

