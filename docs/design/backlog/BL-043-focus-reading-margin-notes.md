# BL-043: Use Margin Notes When They Fit

## Outcome

Show numbered notes in the available right margin whenever the current desktop
layout has enough room for the selected reading width, note width, and note
gap, and no wide content block needs the same space. Keep notes in the normal
reading flow when that complete lane is unavailable.

## Observed Behavior

Pages with a page contents rail receive the `site-page-layout-contents` class.
The corresponding rule in `src/styles/content.css` deliberately overrides the
general margin-note rule so notes cannot collide with that rail.

That class-based decision is too coarse. Narrow and standard prose can leave
enough room for a note before the rail, while wide prose may not. Focus reading
also retains the layout class after hiding the rail, so the same override keeps
notes inline regardless of the available geometry. The general margin-note
container threshold of `55rem` does not account for the selected reading width
or preset note dimensions.

At a 1440px viewport, the measured geometry was approximately:

- content area: 858px
- prose: 641px
- note and gap: 212px
- total required width: 853px

A provisional CSS override placed the note in the margin without horizontal
overflow, including at the lowest desktop breakpoint. This establishes that
the missing behavior is an interaction between existing rules rather than a
need for a new layout model.

## Scope

- At `1101px` or wider, use the margin when the section body can hold the
  selected reading width plus the preset's note width and note gap.
- Apply the same fit rule with or without a visible page contents rail and with
  or without Focus reading.
- Count the reserved right track as available note space when no contents rail
  is rendered or when Focus reading hides that rail. Do not move or resize the
  reading column to reclaim it.
- Treat the note lane as a shared layout resource rather than special-casing
  tables or named media components. A block claims the lane whenever its
  resolved inline box extends beyond the reading width into that space.
- Prevent a margin note and a lane-claiming block from occupying the same
  vertical region. Render the affected note in normal flow instead of
  shrinking, shifting, or overlaying the block.
- Apply the same boundary to wide tables, managed images, carousels, card
  lists, diagrams, and future content blocks whenever their resolved layout
  claims the note lane. Blocks that remain within the reading width do not
  affect note placement.
- Keep the boundary local. A wide block must not force unrelated notes before
  or after its occupied region into normal flow.
- Keep notes in normal flow below that breakpoint.
- Reuse the established note width and gap variables; add no theme setting or
  author-facing Markdown option.
- Use CSS container queries generated from validated theme values. Do not add
  runtime measurement or layout JavaScript.
- Preserve source order, linked note references, keyboard behavior, and screen
  reader semantics.

## Acceptance Criteria

- On a tree-navigation page with a contents rail, narrow and standard reading
  widths place a numbered note in the margin when the complete note lane fits.
- A wide reading width keeps the same note in normal flow when its complete
  lane does not fit before a visible contents rail.
- Focus reading lets a wide note use the right track vacated by the hidden
  contents rail without moving the reading column.
- A shallow tree-navigation page without a contents rail lets the same wide
  note use its empty reserved right track.
- A note that would overlap any block claiming the note lane falls back to
  normal flow, while notes outside that occupied region can still use the
  margin.
- Adding a new lane-claiming block type does not require a component-specific
  note-placement rule.
- The note and its gap fit within the centered page layout without horizontal
  overflow or collision with the prose or contents rail.
- Below `1101px`, the note remains in normal flow regardless of Focus reading.
- A Playwright regression test covers fitting and non-fitting reading widths,
  the desktop breakpoint, and horizontal bounds. Existing note parsing,
  accessibility, and navigation tests continue to pass.
