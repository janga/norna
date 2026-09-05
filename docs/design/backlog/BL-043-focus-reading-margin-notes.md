# BL-043: Restore Margin Notes In Focus Reading

## Outcome

Show numbered notes in the available right margin when Focus reading hides the
page contents rail on a sufficiently wide desktop layout. Keep notes in the
normal reading flow whenever the contents rail is visible or the viewport is
too narrow.

## Observed Behavior

Pages with a page contents rail receive the `site-page-layout-contents` class.
The corresponding rule in `src/styles/content.css` deliberately overrides the
general margin-note rule so notes cannot collide with that rail.

Focus reading hides the rail but retains the layout class. The override
therefore continues to keep the note in the paragraph flow even though the
right margin has become available. The general margin-note container threshold
of `55rem` is also slightly wider than the effective content area in the
observed layout.

At a 1440px viewport, the measured geometry was approximately:

- content area: 858px
- prose: 641px
- note and gap: 212px
- total required width: 853px

A provisional CSS override placed the note in the margin without horizontal
overflow, including at the lowest desktop breakpoint. This establishes that
the missing behavior is an interaction between existing rules rather than a
need for a new layout model.

## First Scope

- Preserve normal-flow notes while the page contents rail is visible.
- When Focus reading is active at `1101px` or wider, restore the existing
  right-floating margin-note presentation.
- Keep notes in normal flow below that breakpoint.
- Reuse the established note width and gap variables; add no theme setting or
  author-facing Markdown option.
- Preserve source order, linked note references, keyboard behavior, and screen
  reader semantics.

## Acceptance Criteria

- On a tree-navigation page with a contents rail, a numbered note has
  `float: none` while Focus reading is off.
- On the same page at a viewport of at least `1101px`, enabling Focus reading
  gives the note `float: right` and places it beside its prose.
- The note and its gap fit within the centered page layout without horizontal
  overflow or collision with the prose.
- Below `1101px`, the note remains in normal flow regardless of Focus reading.
- Toggling Focus reading preserves the current reading position according to
  the existing reader-preference contract.
- A Playwright regression test covers the normal layout, Focus reading, and
  desktop fit assertions. Existing note parsing, accessibility, and navigation
  tests continue to pass.
