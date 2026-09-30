# BL-154: VS Code Site Tree Context Actions

## Purpose And Status

Give every Site Tree element a predictable menu for adding, changing and
removing its contents. Authors should not need to try several buttons to find
an operation or leave Site Tree to manage public files.

**Status: Implemented; commit authorized on 2026-09-30.** The owner
approved this interaction model and authorized implementation on 2026-09-30.
The engine plans, native menus and adapter operations are implemented.
Focused automated checks pass. Native review has verified the page and image
rename flows, real Undo and dirty save/reopen, keyboard context menus, public
text-file creation, and cancellation of folder deletion with incoming links.
The review matrix and remaining practical checks are recorded in
[the editor workflow test plan](../editor-workflow-test-plan.md). The owner
handles further interface review and error reports; those checks are not claimed
as passed and no longer block committing the implementation.

## Approved Interaction Model

- Clicking a page or file opens its content. Clicking a directory selects it.
  The chevron and keyboard navigation control expansion separately.
- Right-click opens the native context menu for the selected element. Retain
  keyboard access to that menu and useful Command Palette alternatives.
- Remove per-row `+` and `…` buttons and the duplicate Quick Pick action
  menus. Remove Open from context menus; opening remains available by row
  activation, including keyboard activation.
- Give first-time authors a short explanation of the right-click entry point.
  Do not add permanent instruction rows to the file tree.
- Group actions with separators in this order: add, edit, organize, inspect
  or copy, delete. Omit empty groups. Use at most one submenu level, mainly
  Add when several kinds of child can be created. A folder with one add
  operation exposes that operation directly.
- Use short names: Add, Rename, Properties, Move, Insert, Replace, Copy Link,
  References and Delete. Use an ellipsis when further input or confirmation
  follows, rather than as a separate row button.
- Hide actions that never apply to the selected type. Explain temporary
  unavailability, such as an operation blocked by the active page move.
- Keep the reviewed local Complete and Cancel controls during a page move.
  This active workflow is an exception to menu-only editing entry points.

## Menus By Element

| Element | Actions |
| --- | --- |
| Page | Add > Page…, Images…, Page theme, Branch theme; Rename…; Properties…; Move…; Copy Link; References…; Delete… |
| Homepage | The page actions except Move and Delete |
| pages/ | Add Page…; Delete… |
| images/ | Add Images…; Delete… |
| Managed image | Insert Image in Page…; Rename…; Replace…; References…; Delete… |
| site-config/ | Add > missing supported configuration files |
| Optional configuration file | Delete… |
| Required configuration file | No mutation menu unless a supported operation exists; activate the row to edit |
| public/ | New File…; Add Files…; New Folder…; Delete… |
| Author-named public subfolder | Public-folder actions plus Rename… and Move… |
| Public file | Rename…; Replace…; Move…; Copy Link; References…; Delete… |

Only offer missing singleton files. Page theme creates page-theme.yaml;
Branch theme creates tree-theme.yaml. Add Page on a page creates a child in
its pages/; Add Images uses its images/. Create missing directories only when
the operation proceeds. Do not offer image import on pages/.

For images, use the explicit label Insert Image in Page… rather than Insert…
so the destination is clear. The form names the image's owning page; another
active editor does not change that destination.

Keep site-wide actions in the Site Tree view menu, including Add Public Files
when public/ does not exist and creation or repair of missing site settings.
These must work without a valid homepage. Do not invent a homepage-owned
public/ or a synthetic directory to host the action.

## Rename, References And Removal

- Rename on a page changes its displayed title and H1, preserving its URL.
  Properties separates title, address, aliases and other page metadata.
  It shows the full address; it does not introduce decoupled addresses or
  silently make a read-only address editable. Slug editing with a separate
  explicit action is subsequently approved in
  [BL-158 VS Code Page Slug Editing](BL-158-vscode-page-slug-editing.md).
- Rename on an image or public resource changes its actual filename or
  author-named directory. Update known internal references together with the
  filesystem change. Review the effect using the selected engine's rules.
  Image rename preserves the format and extension; renaming is not conversion.
- Fixed names such as pages, images, public and configuration filenames cannot
  be renamed. A public subfolder's user-chosen name can be changed.
- References identifies referring pages and opens the relevant source
  location. Preserve and explain the reference types the engine actually
  checks; incomplete analysis must not be reported as no references.
- Public-file and folder moves stay within public/. Page Move keeps its
  reviewed reordering, parent selection and previous-address behavior.
- New/imported/renamed public resources must obey the engine's reserved-path,
  URL collision and conventional logo/icon rules. Never overwrite silently.
- Delete uses the operating system's Trash after confirmation. For a nonempty
  optional folder, summarize all affected pages/files and known incoming
  references. Reuse the constituent removal rules rather than bypassing them
  with a raw recursive delete. Protect required files and the homepage.
- Coordinate filesystem changes and source edits, including dirty buffers.
  Preflight conflicts; if application fails, restore changes already made or
  give an accurate recovery report. Do not claim Editor Undo restores an
  operation unless that complete behavior has been verified.

## Attachment Extension Point

[BL-155 Page Attachments](BL-155-page-attachments.md) adds a future resource
type stored in a page-owned downloads/ directory. Keep action selection based
on the element's role and supported operations, not on an image-versus-file
assumption. Share menu ordering and mutation checks where their rules match;
retain image-specific previews, metadata and insertion behavior.

When attachment support is available, a page can offer Add > Attachments…,
downloads/ can offer Add Attachments…, and an attachment can offer Insert Link in Page…,
Rename…, Replace…, References…, Copy Link and Delete…. The attachment brief
records the approved link and publication behavior. BL-154 must not expose
nonfunctional attachment commands or implement an attachment engine early.
This is a bounded extension point, not a new plugin API.

The subsequent empty-folder visibility requirement for both downloads/ and
images/ is owned by BL-155, including Add entry points on the page when a
folder is hidden. It is not yet delivered by this implementation.

## Dependencies And Scope Ownership

- Build on BL-134 VS Code Image File Operations, BL-146 VS Code Removal,
  Addresses And Incoming Links, BL-151 Site Tree For The Site And Theme Model and BL-153 VS Code
  Site Tree Page Placement And Previous Addresses.
- Absorb [BL-152 VS Code Image Rename](BL-152-vscode-image-rename.md) as the image
  rename part of this delivery, preserving its failure and reference cases.
- This decision supersedes the permanent per-row Add/ellipsis requirements in
  BL-145 VS Code Site Tree Ordering And Add Menu and BL-147 VS Code Site Tree
  Icons And Editing Model. Keep their other file ownership and editing rules.
- Reuse current insertion behavior. BL-135 VS Code Image Block Insertion still
  owns improved insertion-location choices; BL-137 VS Code Image Usage And
  Removal Review retains later refinements beyond the references needed here.
- Attachments do not block this implementation. Their engine and editor work
  follow in BL-155 Page Attachments once its draft is ready.

## Acceptance And Delivery

Verify the menu matrix on actual rows, including absent folders, missing
required files, optional files already present, and active page moves. Check
native keyboard access and that opening/expansion still behave independently.
Check adding public files, text files and nested folders, collisions, reserved
paths, rename/reference updates, nonempty-folder deletion and cancellation.
Include dirty-buffer, save/reopen, Undo and injected failure cases where source
or filesystem changes require them. Test the selected engine's capabilities
and explicit siteRoot, including a project lacking the new operations.

Use the owner's Default VS Code profile and disposable files for local review.
The owner handles any remaining review after commit. Update the
extension README, canonical editor reference and relevant engine documentation
with delivered behavior. Run directly affected checks; this item alone does
not require a full release test run.
