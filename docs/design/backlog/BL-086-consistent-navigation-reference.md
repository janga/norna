# BL-086: One Consistent Navigation Contract In Documentation

## Status

Ready; third in the correction sequence for
[BL-083: Result-first single-page examples](BL-083-result-first-single-page-examples.md).
Establish the current behavior before
[BL-087: Direct section access from top navigation](BL-087-top-navigation-section-access.md).

## Problem

`docs/pages.md` says Home participates in the persistent left navigation rail,
while `SitePage.astro` explicitly excludes Home and `docs/configuration.md`
describes ordinary non-home pages. The local site confirms the code behavior.
Descriptions also need to distinguish page selection, section selection,
heading-count thresholds, and viewport fallback.

## Outcome And Scope

Reconcile the current code, tests, and canonical navigation references. Keep
one authoritative explanation of each rule and concise linked summaries in
introductory material. Follow the documentation style guide.

- Record automatic selection for one listed page, flat top-level pages, and
  listed children or categories; distinguish page depth from heading depth.
- Resolve the contradictory Home descriptions explicitly against current
  behavior and its recorded rationale. Do not silently change runtime behavior
  merely to match an older description.
- Explain H1 destinations, H2 section links, H3 outlines, and behavior with
  zero, one, or several H2 headings.
- Describe the global row, current-branch left tree, deep right contents rail,
  compact menu, and Focus reading. Include resize and no-JavaScript behavior.
- State that current top-navigation page links navigate directly; H2 links
  currently occupy a separate row when there is more than one.
- Distinguish automatic mode from explicit overrides and invalid category
  combinations. Do not describe the planned top-menu enhancement as shipped.

## Acceptance And Verification

- `docs/configuration.md`, `docs/pages.md`, and affected introductory summaries
  agree on current behavior, including Home and one-H2 cases.
- Statements are grounded in `scripts/lib/navigation-model.mjs`, navigation
  components, and focused test evidence rather than illustrations.
- Existing contradictory tests or unexplained behavior are recorded explicitly
  instead of being hidden by wording changes.
- Run documentation checks and only the focused behavior probes needed to
  resolve uncertainty; no runtime change belongs to this item.
- Link to precise canonical sections rather than duplicating complete rules.

## Related Work

This is a bounded follow-up to
[BL-081: Clear configuration reference](BL-081-clear-configuration-reference.md).
The next navigation implementation must update the newly aligned references
when it changes the behavior.
