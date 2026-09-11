# BL-092: Top Navigation Without A Duplicate Section Row

## Status And Decision

Ready. The user approved removing the separate current-page H2 row from
multi-page top navigation after reviewing
[BL-087: Direct section access from top navigation](BL-087-top-navigation-section-access.md).
This supersedes that item's decision to retain the row at two or more H2s.

## Outcome

Top navigation exposes each page's H2 destinations through its disclosure,
without repeating the current page's destinations in a second sticky row.
Keep the page name as a real link and the chevron as a separate disclosure.

## Acceptance And Verification

- Remove the duplicate row for resolved `top` navigation, including explicit
  top mode with child-page menus; do not introduce another setting.
- Preserve the primary title and H2 navigation for a single listed page,
  including pages with zero or one H2. Leave tree placement unchanged.
- Preserve page and section destinations, accessible disclosure labels,
  keyboard dismissal, native no-JavaScript access, and compact navigation.
- Adjust focused render and browser tests, especially anchor offsets after
  reducing sticky header height. Do not run the complete release suite.
- Update canonical navigation rules and affected source/capture assertions.
  Refresh screenshots as part of
  [BL-095: Nested navigation for substantial documentation](BL-095-nested-documentation-demonstration.md).
- Provide a local top-navigation example for human inspection. Record
  technical verification separately from human visual approval.
