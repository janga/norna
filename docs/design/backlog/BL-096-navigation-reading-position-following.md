# BL-096: Keep The Reading Position Visible In Navigation

## Status And Dependencies

Ready. Extends the existing section tracking and responsive navigation;
no new configuration, page model, or dependency is needed.

## Problem And Outcome

On a long page such as the public Examples gallery, the active heading can
move beyond the visible part of its navigation list. Norna still highlights
the heading, but the reader cannot see that feedback without scrolling the
navigation separately.

Keep the active entry visible during document reading. Use the same rule for
headings integrated into the left page tree and for a separate right outline.
Material for MkDocs provides a related
[anchor-following feature](https://squidfunk.github.io/mkdocs-material/setup/setting-up-navigation/#anchor-following).
The interaction rules below are Norna's contract, not claims about that product.

## Acceptance Criteria

- Leave the list stationary while the active entry fits within its visible
  area. Otherwise scroll only that list by the smallest useful distance, with
  a small inset and allowance for sticky navigation controls and wrapped text.
- Follow the right outline when it is visible; otherwise follow the left
  integrated outline. Never scroll both rails for the same reading update.
- Pause following when the reader scrolls, clicks, filters, or uses the
  keyboard in navigation. Resume when the reader scrolls the document again,
  not after a timeout. Do not move a focused navigation control off screen.
- Do not open closed branches. Highlight the nearest visible ancestor of the
  active entry instead, without replacing the current-page semantics.
- Do not scroll hidden navigation. On opening the compact menu, reveal the
  current position once without moving focus away from its normal control.
- Handle direct fragment arrivals, reverse scrolling, responsive rail changes,
  and Focus reading without changing the document scroll position, URL,
  history, selection, or keyboard focus as a side effect.
- Use an immediate, minimal adjustment rather than continuous animated
  centering. Ordinary links, disclosures, and manual scrolling still work
  without JavaScript. Do not add live announcements for every heading change.

## Verification And Documentation

- Add browser regressions for long outlines in left and right rails, including
  sticky controls, manual scrolling, keyboard focus, collapsed ancestors,
  compact-menu arrival, resizing, and no-JavaScript navigation.
- Reuse the registered navigation review environment and public Examples
  page; do not create another disposable server port or public demo site.
- Run focused navigation checks, not the complete release suite. Record the
  exact commands and results here.
- Document the verified behavior in the page-navigation reference. Keep a
  concrete documentation follow-up if human review changes the interaction.
- Human review: scroll down and back up through
  `/norna/examples/#semantic-callouts`, then scroll the menu independently and
  return to the document. Also inspect a deep page at wide, intermediate, and
  compact widths.
