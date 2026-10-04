---
navigation:
  order: 6000
---

# BL-155 Import and replace

## Existing attachment

[Replacement target](downloads/replace.txt)

The initial file begins **REPLACE ORIGINAL**. Its external replacement in the
workspace's imports folder begins **REPLACE UPDATED**.

## Import and insert

1. Put the cursor in the paragraph below. Choose **Add > Attachments…** on this page
   and select external `first.txt`. Keep **Import and insert link** and confirm.
2. Expect `[text](downloads/first.txt)` at the cursor. Try text Undo, Redo, then save.
3. Repeat with `second.txt` and `räkningar två.txt`; reorder them in the form.
   Expect a bullet list in that order, with encoded filename characters.
4. On existing `replace.txt`, also try **Insert Link in Page…**.

Insert review links here.

## Collision and replacement

1. Import external `replace.txt`. Inspect Existing file/New file, then cancel.
   The original bytes must stay unchanged.
2. Use **Replace…** on the existing attachment with external `replace.txt`.
3. Open the live link again: **REPLACE UPDATED**, at the same URL.
   The previous file should be in Trash.

## Import without a link and deletion

Import `delete-me.txt` with **Import** only. It appears under downloads without
inserting text. Delete it, cancel once, then confirm and check Trash.
Inspect deletion of referenced `replace.txt` and cancel after reading its links.

For the image menu, use Add Images with external `replacement-image.svg`.
It can also replace a copied test image. Save, close and reopen after insertion.
