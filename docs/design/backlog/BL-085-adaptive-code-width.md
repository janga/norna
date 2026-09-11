# BL-085: Adaptive Width For Long Code Examples

## Status

Implemented on 2026-09-11. Six focused code and shared table-width browser
checks passed, including narrow screens and no-JavaScript code access.
The final audit also exposed width-probe errors caused by the global
reduced-motion transition duration. Measured code and table frames now disable
transitions explicitly. The same six checks passed with reduced motion, as
did the three focused gallery checks against the documentation site.
Visual review is included in the final Examples audit. Second in the sequence for
[BL-083: Result-first single-page examples](BL-083-result-first-single-page-examples.md),
after
[BL-084: Readable table columns without broken words](BL-084-readable-table-columns.md).
Reuse relevant width and collision findings without making code depend on
table-specific DOM or measurements.

## Problem

The Examples table source needs approximately 1,630 CSS pixels for its longest
line, but its code block has approximately 640 pixels available. The measured
font size is already about 15 pixels. Shrinking the type until every line fits
would make the source unreadable.

## Outcome And Scope

Give long top-level code examples additional available width before requiring
horizontal scrolling. Short examples stay aligned with prose. This is a
shared presentation rule, not a page-specific style or new fence option.

- Reuse the safe content boundaries established for wide blocks: visible
  navigation and sidenotes must not be covered.
- Let Focus reading use genuinely available space without moving ordinary
  prose or creating document-level horizontal overflow.
- Keep code inside callouts and other bounded containers within those bounds.
- Preserve readable typography, whitespace, indentation, exact copied source,
  line emphasis, titles, and existing sticky context.
- Make remaining horizontal overflow discoverable and keyboard accessible;
  reuse existing patterns where appropriate.
- Preserve readable, scrollable source without JavaScript. Avoid reducing
  font size or wrapping source lines solely to claim that content fits.

## Acceptance And Verification

- Short and long code blocks use the smallest suitable safe width.
- Long source remains inspectable at compact and mobile widths, including
  browser zoom, without colliding with the copy control or navigation.
- Copying returns the original source, and emphasized lines and titles remain
  aligned after horizontal scrolling and resizing.
- Focused browser tests cover the width boundaries, reader controls, a bounded
  callout, and no-JavaScript fallback; human review assesses readability.
- Update `docs/content.md` where the new width behavior needs documentation.
  Shortening demonstration data remains the responsibility of
  [BL-090: Readable examples with exact source and clear syntax boundaries](BL-090-exact-readable-examples.md).

## Related Work

Preserve the contracts of
[BL-048: Code titles and line emphasis](BL-048-rich-code-examples.md)
and [BL-062: Sticky context for long code examples](BL-062-sticky-code-context.md).
