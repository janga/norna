# BL-099: Stable Semantic Box Colors Across Palettes

## Status

Implemented and regression-tested. Semantic callout colors now distinguish
warning, caution, error, and success roles across light and dark appearances;
unknown callout meanings warn and remain neutral blockquotes.

## Outcome

Norna's informational boxes communicate the same meaning when a reader changes
palette. Palette changes may alter hue temperature, saturation, or lightness,
but must not make a warning look neutral or make neutral information look like
an error.

## Scope

Define one engine-owned semantic color contract for `NOTE`, `TIP`, `IMPORTANT`,
`WARNING`, `CAUTION`, `DANGER`, and `details`. Presets and palettes may provide
harmonized visual variants of that contract, but they must preserve the
semantic ordering and recognizable color families:

- neutral for `NOTE` and `details`;
- positive green or green-adjacent color for `TIP`;
- distinct priority color for `IMPORTANT`;
- yellow or ochre for `WARNING`;
- orange for `CAUTION`;
- red for `DANGER`.

The color must remain supplementary. Visible localized labels, icons, HTML
semantics, and accessible contrast must continue to communicate the meaning.

## Decisions Required

- Decide whether the shared semantic colors are fixed engine values or palette
  tokens with constrained per-palette variants.
- Define separate background, accent, text, and focus colors for each meaning.
- Define minimum contrast for text, borders, icons, and focus indicators against
  both light and dark surfaces.
- Decide whether `NOTE` and `details` share one neutral token or use two close
  neutral surfaces.
- Define the fallback for a migrated or user-defined meaning that has no
  Norna semantic callout: preserve its content as an ordinary neutral
  blockquote, retain any visible source label as text, and never guess a
  warning, error, or success meaning.
- Define how semantic colors behave in forced-colors mode and when color
  support is limited.

## Acceptance Criteria

- Every supported palette renders all semantic box types with stable meanings.
- The same type remains identifiable by label and semantics without relying on
  color alone.
- Unsupported or unmapped meanings have a documented neutral fallback that
  preserves their text and does not assign a misleading semantic color.
- Text and interactive controls meet the project's contrast contract in light,
  dark, and forced-colors modes.
- Automated tests check the token mapping and contrast margins for every
  palette; a focused browser review checks visual hierarchy and distinction.
- Documentation explains that palettes change visual tone, not box meaning,
  and gives a concise table of the semantic roles.
- No per-site or per-box color override is introduced unless a separate design
  decision establishes its accessibility and maintenance cost.

## Dependencies And Risks

This affects the presentation contract, palette definitions, callout and
`details` CSS, contrast tests, preset examples, and reference documentation.
It should be implemented as one cross-palette change rather than by adjusting
individual presets opportunistically. The principal risk is that a palette's
identity becomes weaker if semantic colors are forced into an identical hue;
the contract should therefore constrain meaning while allowing controlled
palette-specific tone.
