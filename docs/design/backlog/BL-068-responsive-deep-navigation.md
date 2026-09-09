# BL-068: Responsive Fallback For Deep Navigation

## Outcome

Keep the same page and section hierarchy understandable and available while a
deeply nested site moves from a wide three-column layout to a compact menu.

## Problem

Deep navigation currently keeps both the page-tree rail and the page-contents
rail until the viewport reaches `1100px`. The remaining document column can
become too narrow before the page-contents rail disappears. The page tree then
remains visible until `700px`, which leaves another range where the document is
unnecessarily constrained.

Simply hiding a rail would remove navigation information. In deep navigation,
the left rail contains pages while the right rail contains headings from the
current page.

## Decided Model

Use one hierarchy with three responsive placements:

1. A wide layout presents the page hierarchy in the left rail and the current
   page's section hierarchy in the right rail.
2. A medium layout removes the right rail and presents page sections beneath
   expanded pages in the left tree.
3. A compact layout removes the persistent left rail and presents the same
   combined hierarchy in the existing menu drawer.

Navigation placement depends on the available layout width, not on whether the
current page contains a wide table, image, or other exceptional block. Focus
reading continues to expose the same hierarchy through its compact navigation.

## Scope

- Introduce separate breakpoints for the page-contents rail and persistent page
  tree.
- Render section links in the page tree so CSS can reveal them when the right
  rail is unavailable.
- Remove the current inline duplicate of the right page-contents rail at
  intermediate widths.
- Preserve expanded branches, current-page state, current-section state,
  filtering, and keyboard navigation across full-page navigation.
- Keep the mobile drawer as the compact presentation instead of introducing a
  second compact navigation component.
- Reconcile table, media, and sidenote layout assumptions with the new rail
  breakpoints without making those content blocks control navigation.

## Acceptance Criteria

- At a wide desktop viewport, a deep branch shows a persistent page tree on the
  left and the current page outline on the right.
- At an intermediate viewport, the right rail is absent and expanded page
  branches expose their H2 and H3 links in the persistent left tree.
- At a compact viewport, neither persistent rail occupies document width and
  the menu drawer exposes the complete page-and-section hierarchy.
- No page-contents navigation is duplicated visually at any viewport.
- A user can reach every page and section link with a keyboard in every
  presentation.
- The current page, active section, and persisted disclosure state remain
  distinguishable after navigation and viewport changes.
- Main prose does not overflow the page at 320 CSS pixels. Wide tables retain
  their own internal horizontal scroller.
- The behavior remains useful without JavaScript: native links and disclosure
  elements still expose the hierarchy.
- Browser regression tests cover both breakpoint boundaries, JavaScript and
  no-JavaScript output, menu focus handling, and a deep page containing an
  overflowing table.

## Review

Use the maintained navigation and presentation review environments. Compare
the same deep page immediately above and below each breakpoint, then repeat at
browser zoom levels that produce equivalent CSS viewport widths.

The disposable design mockup is stored locally at
`.local/mockups/deep-navigation-fallback.svg` and is intentionally excluded
from Git.
