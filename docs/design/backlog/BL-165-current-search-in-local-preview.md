# BL-165: Current Search In Local Preview

## Purpose

Let an author search the content they are currently previewing after editing
Markdown, without running a separate local build and restarting the preview.

**Status: Prioritized by the owner on 2026-10-03; needs implementation design.**
Production builds already create a fresh static Pagefind index. The
[current search reference](../../../site/root/pages/032-reference/pages/020-configuration/pages/040-search/content.md)
says that `dev` can serve an older index until `build:local` is run.

## Scope And Boundaries

Keep production search's indexed-content rules and result destinations. Solve
the local authoring feedback gap for the explicitly selected site, including
new, edited, moved and removed pages. Avoid rebuilding the full production
site on every keystroke or introducing a hosted search service. Readers of a
published site should see no new search dependency or behavior change.

## Open Questions

1. Can Pagefind refresh a development index from rendered changed pages, or is
   a separate development-only search path necessary? What should the search
   page show while a refresh is in progress or has failed?
2. When should content changes trigger refreshes, and how are bursts of edits,
   incomplete Markdown and deleted pages handled without stale links?
3. How will the index respect the selected site, base path, unlisted pages and
   the same exclusions as production search?
4. How can preview refresh avoid the concurrent build/dev cache identity
   conflict recorded in [BL-015](../../../BACKLOG.md)?

## Ready For Implementation When

- A focused prototype shows fresh section-level results after an edit and no
  stale result after a page move or deletion, without restarting the preview.
- The design sets a measured refresh cost for a representative documentation
  site and preserves production index behavior.
- Failure and in-progress states are understandable, and the preview remains
  navigable when JavaScript or the local index is unavailable.
