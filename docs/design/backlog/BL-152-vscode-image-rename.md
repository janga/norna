# BL-152: VS Code Image Rename

## Purpose

Let an author rename an existing page image from its row in the VS Code Site
Tree while understanding what happens to pages that refer to it.

**Status: Needs decision.** The location of the action is approved; the source
edit and recovery rules are not yet settled.

## Decisions Made

- **Insert Image** shows the selected image's current filename under its
  preview as a read-only value. Inserting a content reference does not rename
  the stored file.
- A future **Rename image…** action belongs on the image row in Site Tree.
  It must review known managed-image references before changing the filename.

## Open Questions

- Should the action update all known managed-image references automatically,
  or leave them unchanged after a clear warning? Decide how unsaved editor
  buffers and incomplete reference analysis affect this choice.
- Confirm whether only the base name can change or the supported extension
  too. A rename does not convert the image format.
- Define collision handling and recovery if the filesystem move succeeds but
  one of the content edits fails.

## Dependencies And Verification

Reuse the owning-page and managed-image rules from
[BL-134 VS Code Image File Operations](BL-134-vscode-image-file-operations.md).
Test the action on a disposable page with zero, one and several references,
including an unsaved page, an ambiguous same-name image elsewhere, invalid
filenames, collisions and a failed move. Check the resulting tree, content,
Undo/Trash expectations and saved page rendering in the owner's Default VS
Code profile before commit.
