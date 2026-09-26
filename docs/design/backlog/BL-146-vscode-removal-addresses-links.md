# BL-146: VS Code Removal, Addresses And Incoming Links

## Purpose And Status

Let an author remove optional files or page branches with understandable
consequences, and inspect or change page addresses from Site Tree.

**Status: Completed on 2026-09-26, with the native UI verification limit below.**
The owner approved the interface proposal and requested implementation on
2026-09-22, then requested completion with only directly relevant tests on
2026-09-26.

## Approved Contract

- Keep Add under **+** and other actions under **…**, with native context-menu
  and Command Palette access. No custom webview or profile changes.
- Offer **Move to Trash…** on optional local themes, shared content and public
  files. Retain image actions. Protect required site configuration, homepage
  content and standalone content/category source deletion.
- Confirm the selected path and effect: inherited appearance after removing
  a theme, removed shared content, or references to an asset. Use the operating
  system's Trash, never permanent deletion as a fallback.
- Page removal includes descendants and owned files. Warn about authored
  internal links from remaining pages into the removed branch, including
  aliases and anchors. Exclude references entirely within the removed branch.
- **Show links** opens a native list with source titles, locations and passages;
  selecting a result opens that source location. Incoming links are also
  available independently. Include unsaved content and report incomplete
  analysis. Recheck files, references and active-site identity before mutations.
- **Addresses and links…** shows the full public address and the internal link
  without the deployment prefix, with copy actions. Explain homepage and
  category boundaries. Keep title edits independent of addresses.
- **Change URL segment…** renames a page within its current parent using the
  engine's page-move planning and transaction, preserves ordering, previews
  old/new addresses and descendant/link changes, and preserves old page URLs.
- Manage additional addresses in `page.aliases` with add/remove controls,
  immediate format/collision feedback and source-buffer edits supporting Undo.
  Explain that these addresses redirect to the current page. Keep critical
  help beside inputs, with a link to canonical URL reference.
- No free canonical routes detached from folders, category relocation,
  drag/drop, theme creation, downloads format, or automatic repair of links
  after deletion. Those remain separate decisions.

## Dependencies And Boundaries

Build on [BL-145 VS Code Site Tree Ordering And Add Menu](BL-145-vscode-site-tree-ordering-add-menu.md)
and [BL-144 VS Code Page And Image Authoring Prototype](BL-144-vscode-page-image-authoring-prototype.md).
This delivers the removal portion of
[BL-136 VS Code Local Theme Creation And Removal](BL-136-vscode-local-theme-creation-removal.md);
theme creation remains undecided. Arbitrary canonical routes remain in
[BL-139 Decoupled Page Addresses](BL-139-decoupled-page-addresses.md).

## Verification And Documentation Plan

Use focused engine and adapter checks for optional/required files, subtree
links, aliases, unsaved input, incomplete reads, stale plans, cancellation,
Trash failures, scoped address changes, collisions and preserved source bytes.
Exercise native menus and dialogs on disposable files in the owner's ordinary
VS Code profile. Check alias save/reopen and directory-rename editor tracking.
Do not repeat unrelated completion or presentation suites.

Reader-understanding plan: the reader knows how to select a tree row but may
not distinguish a title, URL segment, full web address and redirect. Explain
the action entry first, then the displayed addresses and editing effects;
keep inheritance, incoming-link and recovery help beside removal. Update the
editor reference, extension help and authoring-track record together after
the implementation is verified.

## Implementation And Verification Record

Implemented in extension 0.5.0 with optional engine capabilities, preserving
older-engine page information. Required files have explanatory help; optional
files have scoped removal actions. Incoming-link results include dirty page
buffers and incomplete-read reports, and removal excludes links wholly inside
the removed branch. Address edits reuse the shared page-move planner and
transaction; aliases are editor-buffer edits. The page-move transaction now
avoids restoring files if an editor refuses the initial rename before any
mutation starts.

Direct regression checks found and fixed two connected authoring cases:
removing the last metadata field now removes its empty frontmatter wrapper,
and editing aliases in block-style metadata retains a block list that a later
`page:move` can extend. URL-change help explains that returning to an old
address requires first removing conflicting redirects on the page and its
descendants; editor Undo is not a whole-operation rollback.

Passed checks before the interruption on 2026-09-22:

- `node scripts/test-editor-site-files.mjs`.
- `node editors/vscode/test/site-file-actions-contract.mjs`.
- `node editors/vscode/test/site-tree-contract.mjs`.
- `node editors/vscode/test/package-contract.mjs`.
- `npm run test:dead-code`, `npm run content:check` and
  `npm run test:documentation`.

Direct completion checks on 2026-09-26:

- `node scripts/test-editor-page-addresses.mjs`: eight cases covering removal
  eligibility, link resolution and dirty sources, alias syntax/collisions and
  source preservation, address changes after editing aliases, stale plans,
  required pages, linked filesystem paths and transaction rollback.
- `node editors/vscode/test/site-address-actions-contract.mjs`: six adapter
  cases covering menu choices, copying, alias buffer edits, cancellation,
  opening reference locations, optional-file Trash, rename confirmation and
  late-edit/active-site guards. These use a simulated VS Code API, not native
  widget automation.
- `node scripts/test-editor-site-tree.mjs`, `npm run test:page-move` and
  `npm run test:documentation` cover the directly affected metadata helper,
  shared CLI transaction and edited documentation.
- Package extension 0.5.0 with `npm --prefix editors/vscode run package` and
  compare the installed Default-profile bundle with the packaged source.

Native verification was interrupted when computer control lost the VS Code
window; that tool was unavailable when work resumed. The new dialogs have
not been verified through their actual widgets. Alias dirty/save/close/reopen
cycles and open-tab tracking through rename remain unverified in the owner's
Default profile. Do not treat adapter assertions as evidence of those native
behaviors. The disposable review site is retained at
`.local/test-sites/scratch/bl-146/site/`, beside the existing scratch site so
that its earlier review content remains intact.

No full test chain, broad integration suite, browser tests, formatter or
completion matrix, or minimum-version pass was run during completion. The
last documentation build had started before the interruption, but its process
result was unavailable after restart; no successful final build is claimed
and it was not repeated. No push or release.
