# Presentation Engine Contract

This document records the presentation invariants owned by the Norna engine.
They apply before presets are reorganized into profile recipes and cannot be
weakened by a preset, a theme override, or a future reader preference.

This is an engineering contract, not a claim that automated tests alone prove
complete accessibility conformance.

## Semantic Color Roles

Every built-in palette provides coordinated light and dark modes. Each mode
resolves these engine roles:

- primary and secondary text;
- link text;
- focus ring and its contrasting boundary;
- selection background and text;
- control background, active background, and text;
- code background and text;
- warning, error, and success accent, surface, and text colors;
- primary and secondary text for every section surface.

Presets choose a palette. Components consume roles rather than inventing
component-specific translucent text or status colors.

The resolver checks every supported foreground/background pairing. Normal
text must reach `4.5:1`; meaningful non-text indicators and focus boundaries
must reach `3:1`. These thresholds follow WCAG 2.2
[Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
and [Non-text Contrast](https://www.w3.org/WAI/WCAG22/understanding/non-text-contrast.html).

## Typography And Measure

The engine owns the responsive size table. A resolved theme must preserve:

```text
H1 > H2 > H3 > H4
```

The relationship is checked across the complete mobile and desktop viewport
ranges, not only at one screenshot width. Body line height must be at least
`1.4`; caption line height must be at least `1.25`; and heading line height
must be at least `1`.

Named prose widths resolve to character-based measures:

- narrow: `60ch`;
- normal: `72ch`;
- wide: no more than `72ch`, while allowing the media column to provide the
  available space.

The engine ceiling is `80ch`. Presets may select a narrower measure but cannot
silently turn normal prose into an unbounded page-width column.

Prose rhythm uses `em` so spacing follows the active text size. Site frame,
navigation, and component geometry use root- or viewport-relative units.

## Interaction

Keyboard-focusable controls and links receive a shared two-color focus
indicator. The inner indicator is at least `2px`; palette validation ensures
that it remains visible on every supported surface.

Authored navigation and controls use at least a `24 x 24` CSS-pixel target.
Primary mobile controls use the more comfortable `44px` scale where the layout
allows it. This follows WCAG 2.2
[Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Hover, current, selected, warning, and focus states must not rely on low-opacity
text. Color may support a state but cannot be its only cue.

## Reflow And Text Adaptation

Ordinary content must reflow without document-level horizontal scrolling at a
`320px` CSS viewport. Long links and inline code may break. Fenced code remains
a legitimate two-dimensional exception and may scroll inside its own block.

The layout must tolerate:

- browser zoom equivalent to a `320px` CSS viewport;
- text resized to `200%`;
- line height `1.5`, paragraph spacing `2em`, letter spacing `0.12em`, and word
  spacing `0.16em`.

Sidenotes use the margin only when their actual container has enough room. They
return to normal document flow when text enlargement or available width makes
the margin unsafe.

The corresponding WCAG references are
[Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html),
[Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), and
[Text Spacing](https://www.w3.org/WAI/WCAG22/UNDERSTANDING/text-spacing.html).

## User Preferences

The engine honors `prefers-reduced-motion`. It disables decorative transitions,
smooth scrolling, and carousel movement rather than merely shortening the
page-scroll animation. The implementation follows the intent of W3C technique
[C39](https://www.w3.org/WAI/WCAG21/Techniques/css/C39.html).

Forced-colors mode maps content, links, focus, controls, surfaces, and status
indicators to system colors. Component boundaries remain visible without
depending on shadows or translucent fills.

Reader preferences are overlays after theme resolution. The current categories
are color mode (`system`, `light`, `dark`), reading width (`narrow`, `standard`,
`wide`), and focus reading (`off`, `on`). An overlay may adapt the site inside
engine bounds but cannot reduce contrast, remove focus, exceed the text-measure
ceiling, reorder content, or hide the control needed to undo it.

## Verification

`npm run test:presentation-contract` verifies palette combinations, semantic
tokens, typography ordering, line-height floors, text measures, prose spacing,
and required CSS contract hooks.

`npm run test:presentation:browser` verifies representative rendered behavior:

- reflow at `320px`;
- WCAG text-spacing overrides;
- `200%` text resizing;
- minimum target sizes;
- visible two-color keyboard focus;
- reduced motion, including carousel movement;
- forced-colors control boundaries.

`npm run preset:baselines:capture` records all four presets at desktop and
mobile widths in light and dark modes for human review. These screenshots are
references rather than cross-platform pixel assertions.

The engine contract should expand when a new component or reader preference
introduces a new semantic role or interaction. It should not accumulate
preset-specific aesthetic choices.
