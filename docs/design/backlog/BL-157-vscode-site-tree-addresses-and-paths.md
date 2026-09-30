# BL-157: VS Code Site Tree Addresses And Paths

## Purpose

Let authors inspect a page's address directly from Site Tree without filling
every row with address details. This helps everyday navigation as well as
understanding page moves.

Decisions approved by the owner on 2026-09-30. The implementation comprises
page address display followed by local folder path copying.

## Scope And Boundaries

The first scope covers page tooltips and an optional URL-path display in the
VS Code extension's Site Tree. Slug editing through Properties is a later
step. The existing page-move interaction remains governed by
[BL-153 VS Code Site Tree Page Placement And Previous Addresses](BL-153-vscode-site-tree-page-placement.md).

## Decisions Made

- Keep page titles as the normal tree labels. Indentation communicates the
  hierarchy; expansion continues to reveal page contents and child pages.
- Replace the verbose ordinary page tooltip with the complete published URL
  and the page's own slug, on separate lines labelled **URL:** and **Slug:**.
  The homepage shows only **URL:**. Omit the repeated page title, generic click instructions and local
  source path from this ordinary tooltip.
- Example tooltip for a page with slug `installation`:

  ```text
  URL: https://example.se/guide/installation/
  Slug: installation
  ```

- Add **Show URL paths** to the existing Site Tree view menu. It applies to
  the whole tree, is off by default, and remembers the user's choice.
- When enabled, display each page's URL path as secondary text after its
  title, including when the page is collapsed. Do not repeat the domain or
  add a separate slug to each row.
- Keep warnings and unsaved-state indicators visible when paths are shown.
- Properties and Copy Link remain available through the page's context menu,
  including for keyboard users.

## Local Folder Paths

Approved as the second implementation step:

- Add **Copy Folder Path** to the context menu for a page, its image directory
  and its attachment directory.
- For a page, copy the absolute directory containing `content.md`. For an
  image or attachment directory, copy that directory's absolute path.
- Copy the plain path without `cd` or added quotation marks. Authors must quote
  paths containing spaces when using them with `cd`.
- A separate command to copy the `content.md` file path is outside this scope.

## Dependencies

Use the implemented context-menu model from
[BL-154 VS Code Site Tree Context Actions](BL-154-vscode-site-tree-context-actions.md)
and the selected site's address information. Image and attachment directories
are available through the implemented
[BL-155 Page Attachments](BL-155-page-attachments.md) work.

## Acceptance And Verification

- Default page rows remain compact; ordinary tooltips contain the labelled
  address and slug in that order.
- The view-menu choice shows and hides paths throughout the tree and survives
  reopening the workspace. Page expansion does not control address visibility.
- Use the selected site's configured public address, including its deployment
  prefix. Handle the homepage and missing address configuration accurately;
  do not invent a slug or a domain.
- Inspect long paths, narrow sidebars, warning/unsaved indicators and active
  page-move rows when implementing the display.
- Run directly relevant tree/address checks for changed behavior. The owner
  installs the evaluation VSIX and performs manual interface review under the
  current project workflow; record unperformed manual checks honestly.
- Update the extension guide and canonical editor reference with the
  implemented behavior in the implementation commit.

## Implementation Evidence

2026-09-30, first step: concise page tooltips and the saved **Show URL paths**
choice are implemented. The focused Site Tree adapter and package contracts
passed. Coverage includes deployment prefixes, unsaved settings, missing
settings, older engines, workspace reload, active move rows, and error/dirty
indicators. Native layout and tooltip review remains for the owner.

2026-09-30, second step: **Copy Folder Path** is implemented for pages and
image/attachment directories, including during a page move. The focused tree
adapter covers exact plain paths with spaces, homepage and directory targets,
unsupported selections and stale handles from another site. No source files
are changed by either step. Manual interface review remains outstanding.

The final tree adapter and package contracts passed. The changed canonical
editor reference parses without errors. VSIX **0.12.2** was built at
`editors/vscode/norna-vscode.vsix`; its version, bundled code and changelog were
checked. No installation, native interface review or full release suite was
performed. The owner's review steps are in the
[editor workflow test plan](../editor-workflow-test-plan.md#site-tree-addresses-and-paths-bl-157).


The owner revised the tooltip decision on 2026-09-30 after reviewing 0.12.2:
label the values **URL:** and **Slug:** so that the slug cannot be mistaken
for a continuation of a wrapped URL. This supersedes the original decision
to omit labels; the tooltip retains the same two values.

The label correction passed the focused Site Tree adapter contract and VSIX
**0.12.3** packaging. The owner reviews the labels and long-URL wrapping in the
native interface; that manual check has not been performed here.

## Owner Approval

2026-09-30 at 15:51 CEST: the owner approved **BL-157 VS Code Site Tree
Addresses And Paths** following the 0.12.3 tooltip correction. This closes the
owner-review follow-up above. The approval does not add claims that each
individual manual test scenario was performed.
