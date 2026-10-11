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

[Technical verification file to rename and move](/.well-known/review-files/verification.txt)

[Same file using Copy Link](http://127.0.0.1:4398/review/.well-known/review-files/verification.txt "Full address")

1. Try creating `images` under `public/`: it must be rejected with guidance to
   use the owning page’s `images/`. Under `public/.well-known/`, create folder **created-here** and import
   `imports/verification.txt` into it. Creating `public/new-note.txt` must
   be rejected with guidance to use a page attachment.
2. Inspect References and Copy Link for `public/.well-known/review-files/verification.txt`.
   Expect `http://127.0.0.1:4398/review/.well-known/review-files/verification.txt`.
   Technical files keep their `.well-known/` path below this site’s `/review/` prefix.
3. Rename it to `renamed-verification.txt`, then move it into `public/.well-known/other-files/`.
   Both links here and the link on Incoming links must update. The full address
   stays full, with its title. Save changed buffers.
4. Rename `other-files` to `renamed-folder`; links to its file must follow.
5. Inspect deletion of `renamed-folder`, review incoming links, then cancel.
6. Delete the unreferenced `created-here` folder and check Trash.

These verification files are disposable technical test data. In a real site,
use the exact `.well-known/` path required by the service. Content pictures
belong in the owning page’s `images/`, and downloads belong in `downloads/`.

Try a rename with unsaved prose here. Text Undo/Redo and save/close/reopen
must preserve that prose and the intended references.
