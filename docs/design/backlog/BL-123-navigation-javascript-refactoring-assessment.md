# BL-123 Navigation JavaScript refactoring assessment

## Purpose

Determine whether the JavaScript supporting smooth navigation needs focused
refactoring after the prototype. Produce concrete findings that help a
maintainer reduce complexity and regression risk while preserving the
verified reading and navigation behavior.

## Scope and boundaries

This is a high-priority analysis item immediately after
[BL-120 Smooth documentation navigation prototype](BL-120-smooth-documentation-navigation-prototype.md).
Review the resulting code and its interaction with existing navigation
scripts, using the prototype's recorded findings and reference revision.
Do not implement refactorings as part of this assessment.

Trace state restoration, disclosure motion, section tracking, scroll and
focus handling, history, prefetch and the page lifecycle. Include inline
scripts and their relationship to CSS and render readiness; module size or
duplication alone does not establish a problem. Limit adjacent-code review
to dependencies that can affect those behaviors.

This item does not decide a new navigation architecture, introduce a client
router, redesign the menus or change public configuration. `BL-054` Optional
instant navigation remains a separate, deferred product decision.

## Decisions made

- Give the assessment high priority after the navigation prototype.
- Separate analysis from any resulting implementation items.
- Judge proposed changes against the recorded behavior, browser differences
  and failure cases from the prototype.

## Preliminary proposals

Investigate these areas without presuming they require changes:

- **State ownership:** whether early restoration and later menu setup have
  clear responsibilities, especially saved scroll positions, open branches
  and synchronization between desktop and mobile menus.
- **Initialization and history:** ordering around parsing, first paint,
  transition snapshots and cached history entries; listener/observer
  lifetimes, cancellation and repeated setup where applicable.
- **Scroll and focus:** interactions between menu scrolling, document anchors,
  section following, disclosure animations and keyboard focus.
- **Prefetch and interruption:** request eligibility, timers, cancellation,
  rapid repeated navigation and failure behavior.
- **Browser accommodations:** which exceptions remain necessary, what
  evidence supports them and whether their purpose is clear at the call site.
- **Testability:** whether the first visible frames and first clicks are
  covered, and which proposed changes lack dependable regression checks.

Starting points in the current prototype are `navigationPrototype.ts`,
`NavigationPrototypeState.astro`, `TreeNavigationScript.astro` and
`SectionNavigationScript.astro`. Refresh this list against the completed
prototype rather than treating its current file boundaries as the intended
design.

## Risk and implementation approach

The assessment has low runtime risk because it produces findings and
recommendations. Any diagnostic experiment should use a disposable variant
and record its effect on timing.

A later refactoring can affect behavior even when the code looks equivalent.
For example, extracting an early inline restoration script into a deferred
module could move restoration past the first paint. Shared abstractions can
also obscure differences between initial arrival and history restoration.
The review must distinguish necessary timing from accidental complexity.

Recommend small changes with explicit preserved behavior, focused checks and
independently revertible commits. This follows the established meaning of
[refactoring](https://refactoring.com/): restructuring through small steps
that retain observable behavior. A required behavior change belongs in a
separate correction or design item. Performance benefits require measurement;
shorter code alone is not evidence of smoother navigation.

## Open questions

- Which responsibilities overlap enough to create a concrete maintenance or
  regression risk, and which apparently repeated logic serves different
  lifecycle requirements?
- Which browser-specific measures remain necessary after the prototype fixes?
- Which small changes would have enough benefit to justify their cost and
  regression risk? Retaining the current structure is a valid conclusion.

## Dependencies

Begin after [BL-120 Smooth documentation navigation prototype](BL-120-smooth-documentation-navigation-prototype.md)
is completed and committed as a reference revision with its findings,
verification results, visual review and remaining limitations recorded.
Reuse that evidence; do not rerun a broad browser matrix solely to begin
the code assessment.

## Analysis complete when

The report maps the relevant responsibilities and lifecycle ordering, then
prioritizes concrete findings. Each finding identifies the code involved,
supporting evidence, practical consequence, expected benefit, regression risk,
smallest proposed change and necessary verification. Keep uncertain concerns
separate from demonstrated defects.

Conclude with a recommendation to retain, simplify or defer each reviewed
area. Create separate, bounded implementation items only for changes supported
by the findings; the analysis is complete even if no refactoring is warranted.

## Ready for implementation when

A resulting implementation item has a concrete benefit, bounded change,
explicit behavior to preserve and suitable regression coverage. Include
human local inspection for visible behavior according to the project workflow.
Do not schedule a broad rewrite based solely on this assessment's existence.
