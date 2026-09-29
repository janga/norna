# BL-134: VS Code Image File Operations

## Purpose

Let a site author import one or several images into a page from one clear VS
Code form. This is step 2 of the
[VS Code Files And Images track](../vscode-authoring-track.md).

**Status: Implemented; locally approved.** The owner chose to test the first
working draft on `main`, without a separate prototype.
[BL-144 VS Code Page And Image Authoring Prototype](BL-144-vscode-page-image-authoring-prototype.md)
provides the earlier single-file baseline, plus image removal and replacement.

## Approved First Draft

- The page's **+** opens **Import images…**. A native picker selects one or
  several JPG, JPEG, PNG or SVG files; the originals stay in place. The form
  shows the destination page, large source previews and one row per image.
  Each preview opens a still larger view; replacement rows label the selected
  file **New image** and the file already on the page **Existing image**, with
  both filenames visible. The latter has the same expanded view.
  Import uses the same plus icon as page creation. The image folder updates
  automatically after import or external file changes; the general tree
  refresh remains in the view menu as a recovery command.
- Each row has one action: **Import** (default), **Import and insert**, or
  **Ignore**. There is no batch-wide **Insert all** shortcut. The target
  filename is editable. Insertion offers optional
  alternative text and caption without a persistent explanatory warning.
  The decorative choice comes before alternative text, hides that field when
  selected and produces empty alt text. The same extra warning text is removed
  from **Insert Image**.
- The initial target name uses Norna's normalized source filename and does
  not append a number merely because the name is already in use. The target
  filename alone determines whether the
  image is new or replaces an existing image. A collision is shown on its
  row as a clear replacement status that tells the author an unused filename
  keeps both images, with previews of both images. Entering a free filename
  changes the row to a new import without another control;
  entering any occupied filename shows which image would be replaced. There
  is no separate **Replace** checkbox. Duplicate target names within the
  selected batch block submission. All replacements receive one explicit
  confirmation listing the files and known managed-reference counts;
  cancelling returns to the form with the choices intact. Previous versions
  go to Trash.
- Up/down controls determine the order of inserted images. All inserted rows
  become one `image-stack` at the end of the owning `content.md`, using an
  ordinary undoable editor edit. Import-only and ignored rows do not enter it.
- Cancelling before work starts changes nothing. Once work starts, completed
  copies remain after a failure; the form identifies completed and pending
  files and can retry pending rows. A staged replacement is checked before its
  old file goes to Trash. If the final copy fails after trashing, the form
  reports where the old image can be recovered.
- The first draft uses the **Import images…** button. Finder drag/drop and
  clipboard import wait until the form has been tried. **Insert Image** on an
  existing image now opens one form with a large preview that can expand,
  optional alternative text, decorative choice and caption. Its filename is
  shown read-only below the
  image; a future rename action belongs on the image row in Site Tree
  ([BL-152 VS Code Image Rename](BL-152-vscode-image-rename.md)).
  Selecting several existing images together,
  or placing a block inside prose or an existing block, belongs to
  [BL-135 VS Code Image Block Insertion](BL-135-vscode-image-block-insertion.md).

The engine validates the owning page, filenames, image format and destination;
the VS Code extension handles the picker, previews, copies, Trash and editor
edit. Image removal remains the reviewed BL-144 action. Its confirmation gives
a short, scoped reference result, identifies the owning page and explains
that a file must be restored from Trash rather than VS Code Undo.

## Acceptance And Verification

Review the form in the owner's Default VS Code profile with disposable images:
one image, several images, imported-only and inserted rows, reordered entries,
an ignored row, an existing-name collision, a renamed free target, a renamed
target that collides with another image, multiple replacements, duplicate
batch names, missing/empty alternative text, cancelling, and an interrupted
batch. Check the visible previews, expanded views and compact layout. Verify
the actual `images/` files,
unsaved editor edit, Undo, Save, close/reopen and rendered image block. The
original files must remain unchanged. Run focused engine and VS Code action
tests, then update the user guide with the verified behavior.

## Dependencies

The file targets from [BL-133 VS Code Page Files](BL-133-vscode-page-files.md)
and the engine's managed-image rules are available. Follow this item with
[BL-135 VS Code Image Block Insertion](BL-135-vscode-image-block-insertion.md)
for the later existing-image form and content placement.
