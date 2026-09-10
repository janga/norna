# BL-072: First-Row Alignment For Wrapped Page Contents

## Outcome

The visible Page contents label remains aligned with the first row of section
links when a horizontal section menu wraps. It no longer appears vertically
between the first and second rows.

## Reproducer

Use a top-navigation page with enough H2 links to wrap near the compact-menu
breakpoint. The presentation scratch page currently reproduces the problem with
the final `Responsive notes and table` link on a second row at approximately a
1024-pixel viewport.

The current `.page-nav-inner` flex container vertically centers the label
against the complete, two-row link list. That geometrical centering gives the
label the wrong semantic alignment: it labels the list but appears to belong to
the gap between its rows.

## Decided Contract

- Align the Page contents label with the first link row, preferably by first
  baseline rather than a fixed pixel offset.
- Continue to let the link list wrap naturally.
- Keep the navigation landmark's accessible name unchanged.
- Use CSS only; wrapping must not require JavaScript measurement.
- Do not add a theme or content setting.

Whether a section menu that requires more than two rows should switch to compact
navigation is a separate responsive-navigation decision. This item must not
introduce a new breakpoint without a representative reproducer.

## Acceptance Criteria

- At a one-row width, the label and links retain their existing visual
  alignment.
- At a two-row width, the label aligns with the first row rather than the gap
  between rows.
- Long section names, localized labels, browser text enlargement, and 200%
  page zoom do not cause overlap or clipping.
- The section links retain their target size, wrapping, focus indication,
  current-location indication, and source order.
- Compact and tree-navigation presentations are unchanged.
- A focused browser regression verifies both one-row and wrapped states using
  captures produced through `BL-071`.

## Complexity And Risk

Expected complexity is low. The likely implementation changes the flex
cross-axis alignment to first-baseline alignment. The main risks are shifting
the one-row layout or relying on browser-specific baseline behavior; the
fallback should therefore be a first-row start alignment rather than vertical
centering.
