# BL-065: Restore The Page Contents Reading Marker

## Outcome

A deeply nested page with a right Page contents rail again gives visible,
palette-derived feedback for the H2 or H3 at the current reading position.
This restores the orientation contract established by
[`BL-034` Automatic Contents-Rail Section Tracking](BL-034-automatic-tree-section-tracking.md).

## Reproducer

Run `npm run review:start -- presentation` and open the deepest Data and Code
page from `http://127.0.0.1:4322/` at a desktop width that shows both navigation
rails. Scroll through Adaptive Table, Sticky Code Context, and Navigation
Markers. The right Page contents rail currently provides no differing
background for the active heading, even though its links and section tracking
are present.

## Scope

- Determine whether the active state is missing, applied to the wrong element,
  or visually indistinguishable in the selected palette.
- Restore the same semantic current-heading state and palette-derived visual
  language used by the supported navigation-marker contract.
- Preserve direct hash navigation, continuous scroll tracking, keyboard focus,
  no-JavaScript fallback, and the distinct meanings of current page and current
  heading.
- Do not introduce a new theme setting for the marker.

## Acceptance Criteria

- Exactly one eligible H2 or H3 in the right Page contents rail is visibly
  marked while scrolling a deeply nested page.
- The marker advances through every heading and reaches the final heading at
  the bottom of the document.
- The state is distinguishable in every built-in palette in Light and Dark
  appearance without being the only indication of the current destination.
- Direct fragment navigation marks the destination immediately.
- The fix does not change layout dimensions or move the reading position.
- Browser tests cover scroll tracking, direct fragments, the final heading,
  and at least one Light and one Dark appearance.

## Complexity And Risk

Expected complexity is low if the regression is confined to selector or
palette styling and medium if the active-state update no longer reaches the
right rail. The main risk is accidentally conflating keyboard focus, selected
URL fragment, and automatic reading position.
