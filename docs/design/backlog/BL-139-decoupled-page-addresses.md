# BL-139: Decoupled Page Addresses

## Purpose

Decide whether an author should be able to keep a page's primary public
address independent of its source-directory and navigation hierarchy.

**Status: Needs decision; future analysis requested on 2026-09-20.** This
does not block the current VS Code authoring work.

## Scope And Boundaries

Evaluate an explicit page address containing several URL segments while the
source remains directly under `site/pages/`. Concrete cases are retaining a
canonical address during migration, date-based addresses without year/month
directories, and a campaign page whose address has more levels than its
position in navigation.

Today's `page.aliases` preserves an old entry address through a redirect. It
does not make that address the page's primary address. Compare that existing
contract with the value and cost of an optional override; do not assume that
another public configuration field is already approved.

This is an engine-model decision. Do not implement a second URL resolver in
the VS Code extension or change the site's single homepage/base URL model.

## Decisions Made

- The owner requested a separate item to return to this question later.
- Continue the VS Code page/file work using the current file model.
- The editor obtains public addresses from the engine instead of deriving
  them from source paths. It continues to show the real filesystem hierarchy.
- A possible address override does not imply extra root pages, a CMS,
  publication scheduling, or generated date archives.

## Questions To Resolve

1. Which concrete author need is not adequately served by moves and aliases?
2. If overrides are justified, what is the source format and the exact
   difference between a single URL segment and a complete site-relative path?
3. Which hierarchy defines navigation, breadcrumbs, parent/child lists and
   inherited presentation? What does an overridden parent's address mean for
   descendants?
4. What happens on page moves, renames, removal, or changes to an override?
   Account for aliases, source links, relative links, search and the sitemap.
5. How are collisions with pages, categories, aliases, static files and
   generated routes diagnosed? The homepage and configured site base retain
   their existing identity.

## Expected Result

A reasoned decision to retain the current model or a bounded implementation
brief with examples and focused regression criteria. Any implementation must
preserve existing sites when the new setting is absent. Do not begin an
implementation as part of this analysis item.

## Dependencies

- Builds on the existing page model, aliases, move planner and site link graph.
- Extracted from the future-address consideration in
  [BL-132 VS Code Site Authoring Continuation](BL-132-vscode-site-authoring-continuation.md).
- Independent of [BL-140 VS Code Page Files Implementation](BL-140-vscode-page-files-implementation.md).
