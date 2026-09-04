# BL-034: Automatic Contents-Rail Section Tracking

## Outcome

The right contents rail introduced by `BL-036` automatically marks the H2 or
H3 at the reading position. The position normally sits halfway down the
viewport and moves toward the viewport bottom as the document end approaches,
so every heading remains reachable during continuous scrolling. Site authors
do not configure whether this orientation aid is active.

Navigation remains fully usable without JavaScript. In that fallback, native
links and URL fragments continue to identify explicitly selected destinations,
but the marker does not follow scrolling.

## Rationale

A persistent contents rail needs clear feedback about the reader's position.
An optional `navigation.sectionTracking` setting lets otherwise identical sites
behave inconsistently and makes an important orientation aid easy to disable
accidentally. The preset-baseline review exposed this directly: hash selection
appeared to work, but the marker did not follow the reader because the fixture
inherited the current `false` default.

The feature already changes neither the URL nor keyboard focus. Its scroll work
is scheduled through `requestAnimationFrame`, so the remaining costs do not
justify a public configuration concept for the site sizes Norna targets.

## Scope

- Remove `navigation.sectionTracking` from `config.yaml`, its schema,
  IntelliSense, diagnostics, examples, and reference documentation.
- Enable the existing section-tracking enhancement whenever the resolved page
  presents a right contents rail.
- Keep top, section, and no-navigation modes outside automatic tracking unless
  separate evidence establishes a need.
- Keep the existing no-JavaScript and native-anchor fallback.
- Preserve URL, history, scroll, and keyboard-focus behavior while the marker
  changes.
- Keep the normal reading position near the viewport midpoint rather than
  tying it to the sticky header.
- Move the effective reading position downward as the remaining document
  scroll becomes smaller than the remaining viewport. Do not add artificial
  trailing space merely to make the final headings cross a fixed line.
- Let direct jumps select their actual destination immediately. Do not queue
  transient marker states after an anchor click, Page Down, or scrollbar drag.

## Acceptance Criteria

- Every page with a contents rail updates one corresponding H2 or H3 item as
  the reading position passes headings.
- Every distinct H2 or H3 has a non-empty activation interval during
  continuous fine-grained scrolling, including headings near the document
  end.
- The final H2 or H3 is active at the maximum document scroll position.
- Direct hash navigation marks the selected destination before and without
  JavaScript enhancement.
- Scrolling does not change the URL or move keyboard focus.
- Pages without H2 or H3 headings do not show a false section marker.
- Top, section, and no-navigation output does not load section-tracking code
  solely for this feature.
- Existing configurations that contain `navigation.sectionTracking` fail with
  a focused migration message instructing the author to remove it.
- Desktop, mobile, focus-reading, long-tree, contents-rail, and no-JavaScript
  navigation tests continue to pass.

## Test Plan

- Replace configuration-toggle tests with a contents-rail invariant test.
- Verify forward and backward marker transitions across every H2 and H3 on a
  short page without adding test-only bottom padding.
- Verify marker transitions across H2 and H3 boundaries with a tall managed
  image between headings.
- Verify unchanged URL and focus while scrolling.
- Verify the native hash state with JavaScript disabled.
- Verify that pages without a contents rail do not receive unnecessary tracking
  behavior.
