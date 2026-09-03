# BL-034: Automatic Tree Section Tracking

## Outcome

Tree navigation automatically marks the H2 or H3 at the reading line. Site
authors do not configure whether this orientation aid is active.

Navigation remains fully usable without JavaScript. In that fallback, native
links and URL fragments continue to identify explicitly selected destinations,
but the marker does not follow scrolling.

## Rationale

A persistent page tree needs clear feedback about the reader's position. An
optional `navigation.sectionTracking` setting lets otherwise identical tree
sites behave inconsistently and makes an important orientation aid easy to
disable accidentally. The preset-baseline review exposed this directly: hash
selection appeared to work, but the marker did not follow the reader because
the fixture inherited the current `false` default.

The feature already changes neither the URL nor keyboard focus. Its scroll work
is scheduled through `requestAnimationFrame`, so the remaining costs do not
justify a public configuration concept for the site sizes Norna targets.

## Scope

- Remove `navigation.sectionTracking` from `config.yaml`, its schema,
  IntelliSense, diagnostics, examples, and reference documentation.
- Enable the existing section-tracking enhancement whenever resolved
  navigation uses the tree model.
- Keep top, section, and no-navigation modes outside automatic tracking unless
  separate evidence establishes a need.
- Keep the existing no-JavaScript and native-anchor fallback.
- Preserve URL, history, scroll, and keyboard-focus behavior while the marker
  changes.

## Acceptance Criteria

- Every tree-navigation page with navigable H2 or H3 headings updates one
  corresponding local-navigation item as the reading line passes headings.
- Direct hash navigation marks the selected destination before and without
  JavaScript enhancement.
- Scrolling does not change the URL or move keyboard focus.
- Pages without H2 or H3 headings do not show a false section marker.
- Top, section, and no-navigation output does not load section-tracking code
  solely for this feature.
- Existing configurations that contain `navigation.sectionTracking` fail with
  a focused migration message instructing the author to remove it.
- Desktop, mobile, focus-reading, long-tree, and no-JavaScript navigation tests
  continue to pass.

## Test Plan

- Replace configuration-toggle tests with a tree-navigation invariant test.
- Verify marker transitions across H2 and H3 boundaries, including a tall
  managed-image block between headings.
- Verify unchanged URL and focus while scrolling.
- Verify the native hash state with JavaScript disabled.
- Verify that non-tree pages do not receive unnecessary tracking behavior.
