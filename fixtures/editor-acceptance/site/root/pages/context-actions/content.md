---
navigation:
  order: 5000
---

# BL-154 Context actions

## Page title and optional themes

1. Rename child **Rename this title** to **Renamed title** in Site Tree.
   Its H1 and row change; slug `rename-me` and URL stay the same.
2. Inspect removal of this page's optional `page-theme.yaml` or `tree-theme.yaml`.
   Cancel once, then remove one and add it again. The homepage theme stays protected.
3. Open a row's keyboard context menu with Shift+F10 and compare its actions.

## Public files and folders

[Public note to rename and move](/review-files/note.txt)

1. Under `public/`, create folder **created-here** and a file **new-note.txt** inside it.
2. Inspect References and Copy Link for `public/review-files/note.txt`.
3. Rename it to `renamed-note.txt`, then move it into `public/other-files/`.
   This link and the link on Incoming links must update. Save changed buffers.
4. Rename `other-files` to `renamed-folder`; links to its file must follow.
5. Inspect deletion of `renamed-folder`, review incoming links, then cancel.
6. Delete the unreferenced `created-here` folder and check Trash.

Try a rename with unsaved prose here. Text Undo/Redo and save/close/reopen
must preserve that prose and the intended references.
