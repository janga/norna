# BL-094: Child-Page Descriptions That Explain A Choice

## Status And Dependencies

Implemented after
[BL-093: Missing descriptions in child-page lists](BL-093-child-page-description-warnings.md).
The maintained shelter fixture passes content validation; the documentation
check compares its parent source and all three child metadata excerpts with
the published example. The 1200x800 scratch capture was inspected and replaces
the OS-list screenshot. Final human gallery review remains pending under
[BL-083: Result-first single-page examples](BL-083-result-first-single-page-examples.md).
Revises the example delivered by
[BL-088: Child-page lists that help readers choose](BL-088-useful-child-page-list-example.md).

## Problem And Outcome

Operating-system names already tell most readers which installation guide to
choose. They do not convincingly demonstrate the value of child descriptions
beside an existing navigation tree.

Use the dog-shelter domain to compare Adoption, Fostering, and Sponsorship.
The parent explains the different commitments; each child's H1 and
`page.description` provide a concrete outcome and next step. The list follows
the real child membership and order automatically, but the author supplies
the useful guidance.

## Acceptance And Verification

- Replace the maintained child-page-list fixture, not just screenshot text.
- Show the result with the left navigation visible. Descriptions must explain
  permanent care, temporary care, and financial support respectively.
- Keep parent source, child metadata, directory tree, screenshot, and caption
  identical in meaning and labels. Link to the canonical list reference.
- Explain briefly that a list needs to help a choice or sequence; omit it
  when it only repeats the navigation. Do not invent a need for a parent URL.
- Validate the fixture and compare the displayed source with the real files.
  Capture the runnable site using the stable scratch review environment and
  provide the public example for human review.

## Design Evidence

[Docusaurus Guides](https://docusaurus.io/docs/category/guides) demonstrates
generated cards alongside a navigation sidebar.
[Kubernetes Workload Management](https://kubernetes.io/docs/concepts/workloads/controllers/)
shows how explanations make unfamiliar destination names useful choices;
its explanatory prose is not evidence of automatic list generation.
