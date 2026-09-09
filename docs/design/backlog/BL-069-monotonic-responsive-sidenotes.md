# BL-069: Monotonic Responsive Sidenote Placement

## Outcome

Keep sidenote placement predictable while a deep-navigation page becomes
narrower.

## Problem

A wide deep-navigation page can show a page tree, a sidenote, and a Page
contents rail at the same time. As the viewport narrows, the sidenote stops
fitting and moves into the reading flow. At the next navigation breakpoint,
the Page contents rail disappears and its section links move into the page
tree. That releases horizontal space and currently makes the sidenote return to
the margin before it moves inline a second time at a still narrower width.

The sequence `margin -> inline -> margin -> inline` is technically responsive
to available space but visually unstable. Moving the Page contents breakpoint
earlier would instead make the page tree taller over a larger width range.

## Decided Model

Automatic responsive changes use a one-way simplification:

1. Use the margin while the sidenote fits beside the reading measure in the
   full three-column layout.
2. Move the sidenote inline when it no longer fits.
3. Keep it inline when the Page contents rail disappears and its links move
   into the page tree.
4. Replace the page tree with compact navigation at the existing breakpoint.

Focus reading may restore margin placement because the reader explicitly asks
Norna to remove the persistent navigation rails. A shallow page without a Page
contents rail may continue to use its available margin whenever the note fits.

## Scope

- Change only automatic sidenote placement for deep pages whose Page contents
  rail moves into the page tree.
- Preserve the existing Page contents and compact-navigation breakpoints.
- Preserve fit-based margin notes on shallow pages and in Focus reading.
- Do not add configuration or client-side JavaScript.

## Acceptance Criteria

- A deep page never follows `margin -> inline -> margin` as its viewport becomes
  narrower.
- At `1281px`, where Page contents remains visible, the test sidenote is inline.
- At `1280px`, where Page contents moves into the page tree, the same sidenote
  remains inline.
- At a sufficiently wide viewport, the sidenote still uses the margin.
- Focus reading can use the freed margin when the sidenote fits.
- A shallow page without a Page contents rail retains fit-based margin
  placement.
- The behavior works without JavaScript and introduces no horizontal overflow.

## Verification

Use the nested-navigation fixture and resize this page across the Page contents
breakpoint:

`/guides/installation/macos/#prerequisites`

Cover the boundary and the documented exceptions with browser regression
tests.
