# BL-062: Sticky Context For Long Code Examples

## Outcome

A long titled code example keeps its filename or title and copy control visible
while the reader moves through the example. The compact context bar releases at
the end of its own code block and never obscures the sticky site header.

This refines the code-title and copy behavior already implemented by
[`BL-048` Code titles and line emphasis](BL-048-rich-code-examples.md). It adds
no Markdown syntax or theme setting.

## User Problem

In a long code example, the title and copy control disappear before the reader
reaches the lines they identify. The reader can lose track of the source file
and must scroll back to copy the complete example.

## Presentation Contract

- Apply sticky behavior only to the existing title bar of a titled code
  example. Do not add a permanent empty toolbar to ordinary code fences.
- Keep the title and copy control together directly below the sticky site
  header while their code block is passing through the viewport.
- Release the bar at the code block's lower boundary.
- Keep the title's full accessible text available when its visible form must
  wrap or truncate on a narrow screen.
- Preserve horizontal scrolling inside the code block and never make the page
  scroll horizontally.
- Derive the opaque bar, separator, focus indicator, and controls from existing
  palette and shape tokens.
- Retain the current static title and code when JavaScript is unavailable. The
  sticky position should be CSS-driven; copying remains progressive
  enhancement.
- Disable only nonessential transition effects under reduced motion. Sticky
  positioning itself is not motion.

## Acceptance Criteria

- A titled example taller than the available viewport keeps its title and copy
  control visible below the site header while the reader is inside the block.
- The context bar does not remain after the code block's final line passes.
- Short titled examples retain their current appearance and spacing.
- Untitled fences do not gain a new visible toolbar solely for stickiness.
- Long titles, long code lines, 320 CSS-pixel viewports, browser zoom, Dark
  appearance, forced colors, keyboard use, and no-JavaScript output remain
  usable.
- Copying still returns only the code text, not the title.
- Automated browser tests cover the sticky start and release boundaries and
  confirm that the site header and code bar do not overlap.

## Complexity And Risk

Expected complexity is low to medium. The implementation primarily affects the
existing code-example wrapper and content CSS. The main risks are nested sticky
containers, a title bar that consumes too much of a short viewport, and an
incorrect stacking order beside the site header.
