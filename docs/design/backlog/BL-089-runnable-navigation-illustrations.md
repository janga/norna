# BL-089: Navigation Illustrations Generated From Runnable Examples

## Status

Sixth in the correction sequence for
[BL-083: Result-first single-page examples](BL-083-result-first-single-page-examples.md).
Requires the agreed, reviewed behavior from
[BL-087: Direct section access from top navigation](BL-087-top-navigation-section-access.md).

## Problem

The navigation SVGs show plausible interfaces rather than faithful Norna
output. The one-page source omits prose shown in the result; mobile panels mix
closed-menu controls with exposed links; the hierarchical illustration puts
unrelated global destinations in the local tree. An extra text brand is shown
without explaining a logo asset. Copies in Features and Examples can drift.

## Outcome And Scope

Build each illustration from a small runnable site. Keep the file tree and
source explanatory, but capture rendered navigation from Norna itself.

- Cover one-page section navigation, flat top-level pages, and nested pages or
  categories. Show representative page and section destinations.
- Make the displayed `content.md` exactly match the visible headings and prose,
  including the text under "What we do".
- Put captions such as "In a sufficiently large browser" outside the depicted
  webpage; identify wide, compact, and open-menu states unambiguously.
- In the closed mobile view, show the Menu trigger and real page content,
  including the target H2 and prose. Do not leave menu links below a closed
  trigger. Show an expanded menu only as a separately identified state.
- Reflect actual logo, Display, and search configuration; do not fabricate a
  text brand or omit configured controls to simplify the result.
- Keep global destinations in the top row and only the current branch in the
  left rail. Demonstrate the post-correction top-menu H2 interaction.
- Maintain one runnable source per scenario and a repeatable capture path for
  all consumers, including Features, Examples, and affected Getting Started
  illustrations. Do not maintain independent hand-edited output copies.

## Acceptance And Verification

- Source, file tree, screenshot, URL, menu state, and caption agree in each
  scenario. Captures wait for image, font, and anchor layout to settle.
- Use existing registered review targets and capture commands; avoid ad hoc
  ports and per-screenshot permission requests.
- Maintained regression sources belong in `fixtures/`; public runnable sites
  belong in `examples/` and receive the required public links.
- Image canvases match visible content without outer padding that disrupts
  caption alignment. Essential relationships have equivalent prose or alt text.
- Validate the runnable sources and affected documentation links, then review
  wide and mobile captures before replacing all affected copies.

## Related Work

Coordinate with the completed
[BL-032: Improved examples for Add nested pages](BL-032-documentation-improve-add-nested-pages.md)
and the capture workflow from
[BL-071: Reusable Playwright review captures](BL-071-reusable-playwright-review-captures.md).
