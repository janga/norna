# BL-153: VS Code Site Tree Page Placement And Previous Addresses

## Purpose

Let an author reorder a page or move it under another page using the familiar
Site Tree, while showing the resulting page addresses and preserving old ones
when they change.

**Status: Implemented and locally reviewed.** The owner verified repeated
moves in Site Tree: old addresses accumulate and the address reclaimed by a
return move is removed from the page's aliases.

## Decisions Made

- Start **Move Page** from the page row's `…` or context menu. Choose a target
  and placement in the existing Site Tree, with a temporary preview row. The
  author can try another placement or cancel before any file changes. Do not
  introduce a second site tree or a separate placement dialog. Clicking a page
  continues to open its `content.md` during placement; right-click chooses the
  destination and position.
- Use the same interaction for reordering among siblings and moving to a new
  parent. Changing only the order keeps page addresses; changing the parent
  changes addresses for the page and its descendants.
- For changed addresses, retain each old address by default on its page as
  a `page.aliases` entry, and update supported internal links to the new
  primary addresses. Show the old-to-new address mapping before applying the
  move. Updated owner decision on 2026-09-30: the final confirmation offers
  **Preserve old addresses as aliases**, checked by default. Unchecking it
  creates no aliases for the old addresses of the page or affected descendants.
  Existing aliases remain available, with the same primary-address reclaim
  rule. Reordering within the same parent leaves addresses unchanged and does
  not need this choice.
- A previous address remains reserved until its alias is explicitly removed,
  except when the same page moves back to that address. Then its own alias
  becomes the primary address and is removed from `page.aliases`, including
  for each affected descendant. An address owned by another page remains a
  collision. New-page creation must report an address collision immediately
  and prevent submission. Direct filesystem edits that create the same
  collision must fail content checking and building.
- Validate the destination against the complete site address model, including
  pages, aliases, public files and generated routes. Uniqueness of sibling
  slugs alone is insufficient. Recheck the plan immediately before writing;
  stale previews and conflicts must not make partial changes.
- Add old addresses to valid `page.aliases` lists, including inline lists
  and one-line `page` mappings. Where source-aware editing cannot safely
  change YAML constructs such as anchors or tags, stop the move and identify
  the affected file. Offer **Open affected file**, **Try another placement** and
  **Cancel move** in the error dialog. Dismissing the dialog also cancels the
  move. Do not silently move without preserving the old address.
- The first version does not offer an extension-specific **Undo move** after
  applying a move. Require affected unsaved edits to be saved or undone before
  writing. Mark dirty pages in Site Tree, including pages with dirty local
  settings; show counts on their collapsed ancestors and name blocking files
  in move errors. Use the engine's rollback for handled failures and report paths to
  inspect if restoration is incomplete. Ordinary editor Undo must not be
  presented as reversing the whole operation.

## Messages To Review In The Prototype

Use page titles and exact addresses in these templates. Make the full affected
address list available from the placement preview; keep the short summary
readable in the tree. The final wording may be tightened during local review,
but each message must identify the conflicting owner and the next action.

| Situation | Message |
| --- | --- |
| Address-changing preview | `This move changes 3 page addresses. Their old addresses will continue to lead to the moved pages.` |
| Destination is another page | `Cannot move here. /guides/install/ already belongs to “Install Norna”. Choose another location.` |
| Destination is a previous address | `Cannot move here. /guides/install/ is a previous address for “Setup” at /setup/. Choose another location.` |
| Destination is this page's own previous address | Allow the move; remove that alias when it becomes the primary address. Apply the same rule to descendants. |
| Destination is another resource | `Cannot move here. /guides/install/ is used by a public file.` Identify a generated route similarly. |
| Later page creation at an old address | `/guides/install/ is a previous address for “Install Norna”, now at /reference/install/. Choose another URL segment, or remove this previous address from “Install Norna”.` |
| Collision introduced by direct file edits | `/guides/install/ is used by both the new page and a previous address for “Install Norna”. Rename the new page or remove the previous address from “Install Norna”.` The diagnostic must identify both source files. |
| Site changed after preview | `The site changed since this move was previewed. Review the placement and addresses again.` |
| Old address cannot be saved in YAML | `Cannot preserve /old-address/ in [file]. Edit page.aliases in the source to remove unsupported YAML anchors or tags, then try the move again.` |

Removing a previous address is a separate, existing page-information action.
Its confirmation must explain that links to that address may stop working.
The creation error should point the author to **Addresses and links… →
Additional addresses…** on the named page; it should not remove the alias
automatically.

## Dependencies And Verification

This item promotes the reorder and move proposals from
[BL-132 VS Code Site Authoring Continuation](BL-132-vscode-site-authoring-continuation.md).
Reuse the engine's `page:move` planning, link and alias validation, and the
selected-site rules of [BL-131 VS Code Site Tree](BL-131-vscode-site-tree.md).

Check sibling reordering, parent changes with descendants, return moves into
the branch's own former addresses, collisions with another page's aliases, preview
cancellation, cancellation after a planning error, address and alias collisions,
later creation at an old address,
manual-file collisions at `content:check` and build, stale plans, YAML alias
format errors, and interrupted writes. Verify the final interaction in the
owner's Default VS Code profile with a disposable site before committing
changed interaction behavior.

### Follow-up: Initially Hidden Cancellation

On 2026-09-30 the owner reported that **Cancel page move** could be hidden by
a previously collapsed source branch. VS Code remembers expansion by item ID;
setting the item's initial expanded state again does not override that choice.
Starting a move must explicitly reveal and expand its source page, making the
first child action visible before a destination is chosen. Keep cancellation
in the source context menu if the author later collapses the branch. Do not
change the move plan, confirmation, source/destination labels or header layout.

Check a previously collapsed page, cancel without changing files, collapse it
again and start another move. Inspect the actual native tree, not just the
provider's initial expansion property. The owner authorized committing this
correction on 2026-09-30 and will handle further interface review.

Verified on 2026-09-30: the tree-adapter regression failed before the fix and
passed after it. Native review in the owner's Default VS Code profile with
extension 0.12.1 confirmed that restarting a move after collapse and cancellation
reveals **Cancel page move** again. The disposable source file remained unchanged.

Large subtree moves and repeated moves can accumulate many aliases and static
redirect pages. Retain the current per-page alias model; defer performance
thresholds, prefix rules and hosting-specific redirect output until measured
move or build costs show a real need. Do not silently discard older aliases.


## Alias Choice In Move Confirmation

Owner request on 2026-09-30: match the slug-editing choice from BL-158 in the
final page-move confirmation. The engine now exposes
`sitePagePlacementOptionsApiVersion: 1`, carrying the boolean `preserveAliases`
choice through planning and application. The default remains true. Source
state and the reviewed option are both checked before application.

The 13 focused placement tests passed, including both choices for a branch
with pre-existing parent/child aliases and unchanged addresses on reordering.
The owner handles the subsequent VSIX installation and native review.

The final confirmation now presents the checked preservation option when
addresses change and the engine supports the optional API. The original tree
preview remains the source of the reviewed placement; changed source state
requires cancelling and reviewing that placement again. Cancelling just the
confirmation returns to the active move. Sibling reordering and older engines
retain their existing simple confirmation.

Focused placement tests, the Site Tree adapter, confirmation lifecycle tests,
a headless Chromium checkbox/keyboard test, the package contract and the
documentation check passed. The tree adapter covers both alias choices,
cancelled moves and stale previews; the lifecycle check discards plans when
the form closes during planning. Native review of **0.13.1** remains for the
owner. No complete release suite or installation was performed here.


## Focused Move Menus And Reachable Cancellation

Approved on 2026-09-30: while a page move is active, Site Tree context menus
show only applicable placement actions and **Cancel Page Move**. The preview
also retains **Complete Page Move…**. Hide ordinary actions, including disabled
editing actions, inspection commands and the Add submenu, until the move ends.
The moving page and its descendants cannot be placement targets.

Cancellation must remain reachable without finding the original page:

- Show a close icon in the Site Tree toolbar, labelled **Cancel Page Move**,
  only during a move.
- Offer **Cancel Page Move** from any row's context menu during a move.
- Let Escape cancel while Site Tree has focus. Escape in an editor, input
  field or final confirmation keeps its own behavior.
- Retain the existing source and preview cancellation rows. Cancelling needs
  no confirmation and leaves files unchanged; normal menus then return.

Verify menu visibility for normal pages, the homepage, the moving branch,
resources and the preview. Verify cancellation without a selected source,
cleanup of the preview and restored menus. The owner installs the evaluation
VSIX and reviews toolbar visibility, native menus and keyboard focus behavior.

Implemented in evaluation extension **0.13.2**. The Site Tree adapter and package
contract passed, including valid target markers, cancellation from another row,
unchanged source files, restored state, hidden ordinary menu entries and the
focus conditions for Escape. Documentation checks passed. The VSIX was built
and its manifest and bundle verified against the current files. Native menus,
toolbar presentation and keyboard dispatch remain for the owner's review.


## Keep Page Rows Familiar During Moves

Owner decision on 2026-09-30: preserve the source page's normal title, icon
and description during a move. The destination preview uses the same page
title and icon, with its proposed URL only when Show URL paths is enabled.
Remove the added FROM/TO row descriptions and Preview title prefix.

Put the addresses on the cancellation rows instead:

- At the source: **Cancel page move from /relative/path/**.
- At the proposed destination: **Cancel page move to /relative/path/**.

Both cancel the complete move. Remove the “leave files unchanged” description
and the equivalent cancellation tooltip; that behavior is already expected.
Keep the existing completion and review details under the destination.

Use VS Code's ordinary selection highlight. The owner accepted dropping a
persistent custom background if it cannot be implemented cleanly. Do not add
file decorations, theme overrides, custom row backgrounds or change the toolbar
icon as part of this revision. The existing toolbar and Escape cancellation
remain available. Verify source/preview presentation and both addresses with
focused adapter checks; the owner reviews the resulting VSIX.

Implemented in **0.13.3**. The focused Site Tree adapter check passed, covering
unchanged source presentation, normal preview icons, source/destination cancel
labels, absent cancellation descriptions/tooltips and optional URL display.
Documentation checks and VSIX packaging passed; the packaged version and bundle
were verified. Native presentation remains for the owner's review.


### Shorter Destination Actions

Owner refinement on 2026-09-30, corrected in **0.13.5**: the destination
rows read `Complete move to <slug>` and `Cancel move to <slug>`. Use the
selected target page's slug, without slashes or parent path. Moving `guide`
under, before or after `topics` makes both rows end in `topics`. When the
selected target is the homepage, use `/` because it has no slug. The source's
**Cancel page move from /relative/path/** label remains unchanged. Completion
still opens the existing final confirmation.

The focused tree adapter and documentation checks passed. VSIX 0.13.4 was
built and its version and bundle verified. Native label review remains for
the owner.

Owner review caught the incorrect source slug in 0.13.4. The labels now use
the selected target, rather than the resulting URL of the moving page.

The updated regression failed before the fix and passed after it. Focused
adapter checks cover a different target slug for sibling/child placement and
`/` for the homepage. Documentation and VSIX packaging passed; version 0.13.5
and its packaged bundle were verified. Native review remains for the owner.


## Complete Move With Address Context

Owner decision on 2026-09-30 supersedes the source/destination action wording
above. Both cancellation rows read **Cancel page move**. At the destination,
a changed URL produces **Complete move from /old/path/ to /new/path/**, using
the moving page's complete old and proposed site-relative paths. A sibling
reorder instead describes the placement, for example **Complete move after
“Topics”** or **Complete move last under “Home”**.

Remove the **opens final confirmation** row description and the entire
**No files changed yet / Save affected edits first** detail row. Keep the
address/link detail groups. Completion still opens the existing confirmation
with the alias choice where relevant. Keep guards for unsaved files and stale
plans. The existing page icons, normal selection and global cancellation stay.

Verify both completion labels, short cancellation labels, removed descriptions
and note row, and that the completion command still opens confirmation. The
owner reviews the native presentation after installing the evaluation VSIX.

Implemented in **0.13.6**. The focused tree adapter and documentation checks
passed. The adapter covers changed-address and reorder labels, cancellation
at both locations, removal of the extra row/description and the existing final
confirmation flow. VSIX packaging passed and its version and bundle were
verified. The owner approved the native presentation in **0.13.6** on
2026-09-30 at 17:51 CEST (“Ser bra ut. Godkänner.”).
