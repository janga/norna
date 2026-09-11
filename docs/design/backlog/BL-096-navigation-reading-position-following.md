# BL-096: Keep The Reading Position Visible In Navigation

## Status And Dependencies

Completed. Implemented, technically verified, and approved by the user after
local interaction review on 2026-09-11. Reference documentation is updated.
Extends the existing section tracking and responsive navigation;
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

## Implementation And Verification Record

Implemented 2026-09-11. The existing section tracker delegates minimal list
scrolling to `src/lib/navigationFollowing.ts`. The active outline yields to
reader interaction; a closed branch keeps its state and shows an ancestor
marker. Compact navigation reveals the current entry once when opened and
keeps its focused Close control visible. Returning focus to the menu trigger
does not scroll the document.

The regressions also exposed a shared disclosure-state bug: synchronization
between desktop and compact trees reopened the current branch after a manual
collapse. Current branches now open automatically on page arrival only.

Verification:

- `npm run review:test -- navigation`: 62 of 63 browser cases passed. The
  remaining assertion compared a temporary fragment marker with the next
  scroll-selected heading. Its setup now establishes a scroll-selected
  heading before checking that a fitting entry stays still.
- `node scripts/test-navigation.mjs --site-dir fixtures/nested-pages/site
  tests/navigation-following.spec.ts --grep 'keeps a fitting entry'
  --repeat-each=3`: all nine executions passed after that test correction.
  Together with the aggregate run, all 63 distinct navigation cases passed;
  the unchanged runtime was not subjected to another complete run.
- `npm run test:review-environments`: passed, including registration of the
  new suite and capture of compact navigation without Playwright's implicit
  pre-click scrolling of the document.
- `node bin/norna.mjs --site-dir fixtures/nested-pages/site content:check`:
  passed with the existing warning about the Windows child-page description.
- `npm run content:check`, `npm run build`, and
  `npm run test:documentation`: passed.
- Registered `review:capture` screenshots were inspected for the public
  Examples page and the deep fixture in desktop and compact-menu layouts.
  The full release suite was intentionally not run.

Human review URLs:

- Public long outline:
  <http://127.0.0.1:4321/norna/examples/#semantic-callouts>.
- Separate right outline on wide screens:
  <http://127.0.0.1:4323/guides/reading-position/>.
- Integrated left outline on wide screens:
  <http://127.0.0.1:4323/reference/reading-position/>.

On the deep fixture, compare widths above 1280px, 961-1280px, and 960px or
less. Scroll the page forward and backward, browse the navigation separately,
then return to document scrolling. Check closed branches, keyboard focus,
and opening the compact menu near the end of the page.
