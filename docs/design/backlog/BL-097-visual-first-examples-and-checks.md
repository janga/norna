# BL-097: Visual-First Examples With Practical Source Checks

## Status And Dependencies

Implemented on 2026-09-11 as a focused editorial correction to
[BL-083: Result-first single-page examples](BL-083-result-first-single-page-examples.md).
Use existing Markdown rendering and check commands; no engine changes or new
configuration are needed. The brief was committed before implementation.
The broader gallery review under BL-083 remains pending; this correction does
not record human approval of the entire gallery.

## Problem And Outcome

Examples currently opens with "Write with standard Markdown" and a "Before
publishing" checklist. This delays the visual examples and tells readers to
run unspecified checks without showing their syntax or concrete benefit.

Open with the single-image example. Keep ordinary Markdown available much
later, and show source checking as a separate, practical authoring task near
the end of the page.

## Acceptance Criteria

- Start the page with "Add a single image", followed by the existing image
  stacks, carousels, and other visual demonstrations. Do not add introductory
  guidance about how to read the gallery.
- Move "Write with standard Markdown" after the preset, palette, and reader
  Display examples. Replace its generic publishing checklist with a short
  ordinary-content example; keep the rendered content identical to its shown
  Markdown source.
- Add "Check before publishing" beside that late Markdown example, before
  the closing complete-sites section. Show `norna check`, `norna config:check`,
  and `norna content:check`, with brief comments explaining their scope.
- Explain the starter's `npm run norna:check` equivalent. Avoid presenting
  the optional global launcher as a prerequisite for checks.
- Show concrete source mistakes the commands detect, such as an invalid
  setting value, missing image file, broken internal page link, and duplicate
  heading id. Pair each with a useful correction and distinguish source
  validation from visual or editorial judgment.
- Link to the canonical command, configuration, image, and content references
  where relevant. Do not invent terminal output or introduce broken live
  links just to demonstrate errors.
- Keep the change scoped to Examples and its maintenance records and tests.
  Do not change the product-tour page or the validation commands themselves.

## Verification

- Update the documented gallery order and its regression assertions.
- Check result/source equality for ordinary Markdown and verify the check
  descriptions against the current command implementation and references.
- Run `npm run test:documentation`, `npm run content:check`, and
  `npm run build`. Use the registered docs preview for a focused visual check
  of the opening and the late checking section; no full release suite is
  needed for this editorial change.
- Update the parent gallery record without treating this scoped correction
  as approval of all outstanding gallery presentation.
- Commit the implementation separately from this brief.

## Implementation And Verification Record

The gallery now starts with the single-image demonstration. Standard Markdown
appears after reader Display controls, using an appointment example instead
of generic publishing advice. A separate checking section follows it, with
three commands, their npm equivalent, and four source mistakes with remedies.

The first mobile capture exposed cramped text in an error-comparison table
and long code comments. The final version uses a four-item list and short
comments so the explanation does not depend on horizontal scrolling.

Verification:

- `npm run test:documentation`: passed; covers gallery order, exact rendered
  Markdown/source matching, three check commands, four mistakes, and links.
- `npm run content:check` and `npm run build`: passed; the documentation site
  and its 15-page search index are rebuilt.
- `npm run test:examples:browser -- --grep "visible examples render"`: passed;
  the gallery has 21 H2 sections, starts with an image, and has no broken image
  references. This ran before the final comment and list-format refinement;
  unchanged media behavior was not tested again.
- Registered docs captures cover the opening and the checking section at
  desktop and mobile widths. No full release suite was run.

Review the reordered page at `/norna/examples/`, the standard Markdown example
at `#standard-markdown`, and the command examples at `#source-checks`.
