# BL-076: Subtle Table Overflow Controls

## Outcome

An overflowing table keeps the discoverability and accessible navigation added
by `BL-074`, but its controls read as part of the table rather than as a
separate, visually dominant toolbar.

## User Problem

The current full-width control row uses two horizontal rules, a visible `Table
columns` label, and two filled buttons. It makes hidden columns discoverable,
but gives a supporting table interaction too much visual weight.

The correction must not return to relying on a hidden operating-system
scrollbar, hover, color, or pointer gestures. The controls still need to remain
available while a tall table passes through the viewport.

## Interaction And Visual Contract

- Keep the sticky previous and next controls introduced by `BL-074`.
- Place one compact control group at the inline end immediately above the
  column headings.
- Remove the full-width toolbar treatment, its upper rule, and its separate
  filled background.
- Hide the visible `Table columns` label while retaining it as the accessible
  name for the button group.
- Use restrained icon buttons whose visible chrome is smaller and lighter than
  the current controls.
- Preserve a comfortable pointer target around each icon. The interactive area
  must remain at least `44 x 44` CSS pixels even when the visible icon and
  boundary are smaller.
- Keep a clear keyboard focus indicator, perceptible hover and active states,
  and distinguishable disabled states.
- Keep both directions present while the table overflows. Disable rather than
  remove the control for a reached boundary so the layout remains stable.
- Keep the directional edge treatment as the first visual indication that
  columns continue outside the visible area.
- Add no Markdown or theme setting. The treatment is an engine-owned part of
  overflowing tables.

## Acceptance Criteria

- The controls no longer appear as a full-width toolbar or compete with the
  table heading row for attention.
- A reader can still discover hidden columns before interacting with the table.
- Previous and next controls remain available through the useful vertical
  extent of a tall table and release at its lower boundary.
- Pointer targets remain at least `44 x 44` CSS pixels at desktop, mobile, and
  zoomed widths.
- Accessible names, keyboard operation, focus visibility, disabled states,
  right-to-left direction, reduced motion, and forced-colors behavior remain
  intact.
- The control group does not cover headings, cells, edge cues, or a native
  scrollbar and does not cause page-level horizontal overflow.
- A table that fits still renders no overflow controls.

## Verification

- Retain all `BL-074` browser tests for overflow discovery, movement,
  boundaries, sticky release, right-to-left direction, and the no-JavaScript
  fallback.
- Add geometry assertions for the minimum interactive target and the stable
  relationship between the controls and sticky heading row.
- Visually compare a fitting and overflowing table in Light, Dark, mobile,
  desktop, keyboard-focus, and forced-colors states before completion.

## Dependencies

This is a visual refinement of
[`BL-074` Discoverable Horizontal Navigation For Long Tables](BL-074-discoverable-table-horizontal-navigation.md).
It must not change that item's semantic table, native scrolling, or progressive
enhancement contracts.
