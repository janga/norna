# BL-120 Smooth documentation navigation prototype

## Purpose

Evaluate whether Norna can make moving between documentation pages feel
continuous: a stable navigation frame, short and coherent menu motions, quick
page changes, and accurate scrolling. The user selected the whole experience,
including page changes, menus and scrolling, and requested a prototype on
2026-09-17.

## Scope and boundaries

Build a review-only prototype against a physical copy of the documentation
site in `.local/test-sites/scratch/site/`. Use the registered `scratch` review
target and keep the ordinary `docs` target available for comparison. Include
Getting Started, Reference and FAQ, so the sample covers category destinations,
long outlines, nested branches and links between global areas.

Enable the prototype explicitly for its review server. Do not add a supported
configuration key, change released defaults, or publish it as a finished
feature. Its source must be reviewable and reproducible from the repository;
the copied site and captures remain disposable local output.

## Decisions made

- Start with browser-native cross-document View Transitions and ordinary HTML
  links. Keep normal browser history, opening links in new tabs, direct URLs
  and navigation without JavaScript.
- Preserve the existing page hierarchy and reading layout during this trial.
- Keep Appearance consistent during page changes, including category and alias
  destinations. Motion must respect the reader's reduced-motion preference.
- Request only an intentionally targeted next page for prefetching, using
  Astro's existing support; never preload the entire navigation tree.
- Implement the prototype after this brief is committed. Human inspection
  precedes broad browser regression work and committing the visual result.

## Preliminary proposals

- Keep the surrounding frame visually still and use a short fade for the
  article. Starting durations are trial values, not a general design rule.
- Animate navigation disclosure height and opacity over approximately
  180 milliseconds, with a slightly faster chevron rotation. Rapid repeated
  activation must reverse cleanly and leave the correct expanded state.
- Carry existing open branches and navigation scroll positions across pages
  without showing the tree reset first.
- Animate the active outline marker without moving the labels or taking
  keyboard focus away from the reader.
- Use native smooth scrolling for same-page links, while initial hash loads
  and history restoration reach their correct positions without a long sweep.

Reference observations and the reason they fit reading-oriented pages are
recorded in the [preset design guide](../preset-design-guide.md#navigation-continuity-prototype).

## Dependencies and related work

- `BL-054` Optional instant navigation remains a separate, deferred product
  decision. This prototype provides evidence before adopting a client router.
- [BL-119 Direct-hash positioning in static previews](BL-119-static-preview-hash-positioning.md)
  records an existing baseline failure. Check initial hashes explicitly in the
  prototype and report remaining differences; do not weaken its assertions.
  Resolve any remaining anchor defect before promoting this trial to released
  behavior.
- The prototype does not establish a public configuration contract, so public
  reference documentation follows a later decision to ship it. Its local
  review procedure belongs in this brief.

## Review and acceptance

1. Open the baseline and prototype at the same documentation page. Compare
   adjacent page links, category links, global navigation and browser Back.
2. Check desktop and mobile, light and dark Appearance, including stored reader
   preferences. Inspect screenshots before handing the prototype to the user.
3. Open and close nested categories, page-child branches and heading outlines,
   using mouse and keyboard and reversing a motion before it finishes.
4. Check same-page anchors, direct links with hashes, reload, Back/Forward and
   retained menu positions. Verify that category redirects keep their correct
   destination and Appearance.
5. Check reduced motion, disabled JavaScript and unsupported transition APIs.
   Content and ordinary navigation must remain available.
6. Verify that prefetching targets only eligible same-site pages after reader
   intent and does not download the whole tree on page load.
7. Run a quick build/config check if needed to establish a runnable prototype.
   After visual approval, run focused navigation and presentation checks and
   commit the implementation as its own logical change.

The prototype is ready for a product decision when the user can compare the
complete flow locally and the observed benefits, limits and regression results
are recorded. Completing the prototype does not automatically approve a new
public setting or a client-side router.
