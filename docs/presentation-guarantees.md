# Presentation Guarantees

Norna presets and theme overrides change a site's visual direction inside a
presentation baseline owned by the engine. A preset, page theme, or reader
Display choice cannot weaken this baseline.

These guarantees apply to valid Norna themes and Norna-generated components.
They are safeguards, not a claim that automated checks alone prove complete
accessibility conformance for every site's authored content.

## Color And Focus

Built-in palettes define semantic roles for text, links, controls, code,
selection, status messages, focus indicators, and section surfaces in both
Light and Dark appearances. Norna validates every foreground and background
pairing that its components use.

- normal and secondary text supplied by the engine must reach a contrast ratio
  of at least `5:1`, providing a margin above the WCAG AA minimum of `4.5:1`;
- meaningful control boundaries and focus indicators must reach at least
  `3:1`;
- keyboard focus uses a shared two-color indicator with an inner width of at
  least `2px`;
- hover, current, selected, warning, and focus states do not rely on color
  alone.

Theme settings select coordinated palettes and appearances rather than
arbitrary component colors. See
[Palette And Appearance](theme.md#palette-and-appearance).

Desktop navigation uses the same opaque base background as the page. The
sticky top bar uses a subtle boundary against scrolling content. In a nested
branch, the left page rail and optional right contents rail use spacing,
hierarchy, current states, and low-contrast separators instead of contrasting
navigation panels. Tree pages reserve a common desktop content axis whether or
not the current page has enough headings to show the right rail.

## Typography And Reading Width

The engine keeps the visible heading hierarchy ordered as `H1 > H2 > H3 > H4`
across supported screen widths. It also enforces minimum line-height values and
uses text-relative spacing for prose rhythm.

Prose uses bounded character-based measures. Theme settings and reader Display
choices may make the measure narrower or wider, but cannot exceed the engine's
`80ch` ceiling. Managed media can use a wider media column without forcing prose
to follow it.

Managed image stacks and carousels preserve intrinsic proportions and do not
crop by default. Norna positions them inside the current page's content canvas,
after persistent navigation rails and their gaps have been excluded.
Prose-aligned media keeps a stable edge with the body text; centered-fit media
shares one center axis with its caption and remains within both the available
width and its configured viewport-height limit. Both methods return to the
available content width on narrow screens. See
[Image Sizing](theme.md#image-sizing).

## Reflow And Text Adaptation

Ordinary content reflows without document-level horizontal scrolling at a
`320px` CSS viewport. Long links and inline code may break. Fenced code may
scroll inside its own block because code is two-dimensional content.

Norna's layout is designed to tolerate browser zoom, text resized to `200%`,
and increased line, paragraph, letter, and word spacing. Side notes use the
margin only while their actual container has enough room; otherwise they return
to the normal reading flow.

## Controls And User Preferences

Norna-generated links and controls use at least a `24 x 24` CSS-pixel target.
Primary controls on small screens use the more comfortable `44px` scale where
the layout permits it.

The engine honors operating-system preferences:

- `prefers-reduced-motion` removes decorative transitions, smooth scrolling,
  and carousel movement;
- forced-colors mode uses system colors and keeps component boundaries visible;
- The System option for Appearance follows `prefers-color-scheme`.

Reader Display choices are bounded overlays on the resolved theme. They can
change appearance, prose width, or the visibility of secondary page chrome, but
cannot reduce contrast, remove keyboard focus, reorder content, or hide the
Display control needed to undo the choice. See
[Reader Display Controls](theme.md#reader-display-controls).

## Author Responsibilities

The engine cannot determine whether the authored content itself communicates
well. Site authors remain responsible for matters such as:

- meaningful heading text and link labels;
- suitable alternative text for informative images;
- captions and surrounding explanation where they are needed;
- avoiding information conveyed only through an image's color or appearance;
- checking third-party files placed under `public/`.

The internal [Presentation Engine Contract](design/presentation-engine-contract.md)
records implementation details, WCAG references, and contributor verification
commands.
