# BL-157: VS Code Site Tree Addresses And Paths

## Purpose

Let authors inspect a page's address directly from Site Tree without filling
every row with address details. This helps everyday navigation as well as
understanding page moves.

Status: **Ready** for the first implementation scope. Decisions approved by
the owner on 2026-09-30. Local path copying remains an idea recorded below.

## Scope And Boundaries

The first scope covers page tooltips and an optional URL-path display in the
VS Code extension's Site Tree. Slug editing through Properties is a later
step. The existing page-move interaction remains governed by
[BL-153 VS Code Site Tree Page Placement And Previous Addresses](BL-153-vscode-site-tree-page-placement.md).

## Decisions Made

- Keep page titles as the normal tree labels. Indentation communicates the
  hierarchy; expansion continues to reveal page contents and child pages.
- Replace the verbose ordinary page tooltip with the complete published URL
  and the page's own slug, on separate lines. Neither value has a label or
  heading. Omit the repeated page title, generic click instructions and local
  source path from this ordinary tooltip.
- Example tooltip for a page with slug `installation`:

  ```text
  https://example.se/guide/installation/
  installation
  ```

- Add **Show URL paths** to the existing Site Tree view menu. It applies to
  the whole tree, is off by default, and remembers the user's choice.
- When enabled, display each page's URL path as secondary text after its
  title, including when the page is collapsed. Do not repeat the domain or
  add a separate slug to each row.
- Keep warnings and unsaved-state indicators visible when paths are shown.
- Properties and Copy Link remain available through the page's context menu,
  including for keyboard users.

## Preliminary Proposals

The owner also requested an idea for copying the absolute local path of a
page, image directory or attachment directory, so it can be used with `cd`.
Record this separately from the approved tooltip contents: a local filesystem
path and a published URL serve different purposes.

A proposed context-menu action would copy the page's containing directory or
the selected image/attachment directory. For a page, copying `content.md`
itself would not provide a directory usable with `cd`.

Before implementing this idea, settle the action's name, whether copying the
source file path is also needed, and how paths containing spaces should be
presented for terminal use. These choices do not block the first scope.

## Dependencies

Use the implemented context-menu model from
[BL-154 VS Code Site Tree Context Actions](BL-154-vscode-site-tree-context-actions.md)
and the selected site's address information. Image and attachment directories
are available through the implemented
[BL-155 Page Attachments](BL-155-page-attachments.md) work.

## Acceptance And Verification

- Default page rows remain compact; ordinary tooltips contain the unlabelled
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
