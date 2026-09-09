# BL-056: Lighter Dark Navigation Markers

## Outcome

Dark appearance gives the current page and current heading a shared marker
that is easier to distinguish from the navigation background without becoming
a dominant panel.

## Presentation Contract

- Keep current-page and current-heading markers visually consistent.
- Derive the Dark marker from the active palette's existing `soft` and
  `emphasis` surfaces. Do not add an isolated navigation color.
- Make the Dark marker lighter than `soft`, but less prominent than the full
  `emphasis` surface.
- Preserve the existing Light marker and all non-color cues, including weight
  and underlining.
- Apply the same Dark marker in the persistent tree and compact tree.
- Retain readable text contrast and forced-colors behavior.

## Acceptance Criteria

- Current page and current heading have the same computed background in Dark
  appearance.
- The marker is visibly lighter than the Dark navigation background and its
  `soft` surface.
- Marker text retains at least 4.5:1 contrast.
- Light appearance is unchanged.
- Desktop and compact navigation use the same palette-derived rule.

## Complexity And Risk

Expected complexity is low. The main risk is making the marker too prominent
in one of the palettes, so the implementation must use palette surface roles
rather than a fixed color.
