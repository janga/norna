---
navigation:
  order: 2000
---

# BL-166 Move between pages

## Move into the exhausted gap

1. Expand this page. Alpha, Beta, Gamma and Move me have orders 1, 2, 3 and 4.
2. Start **Move** on **Move me**. On **Alpha**, select placement **after**.
3. Use the completion row, inspect renumbering, then cancel once.
4. Repeat and confirm the move.

## Expected result

Cancel preserves Alpha, Beta, Gamma, Move me and all file contents.
Confirm produces Alpha, Move me, Beta, Gamma with orders 1000, 2000, 3000, 4000.
The three extra sibling edits appear before confirmation. No directory or
URL changes: Move me stays at `/renumber-move/move-me/`.

This group is independent of the creation test. Reset the copy before repeating
its original exhausted-gap case after a completed move.
