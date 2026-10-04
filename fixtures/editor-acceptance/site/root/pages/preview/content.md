---
navigation:
  order: 7000
---

# BL-156 Local preview

## Start and reuse

1. Choose **Preview Page** on child **Nested preview target**.
2. Expect `http://127.0.0.1:4398/review/preview/child/` in your browser.
3. Choose **Preview Site**. Expect `http://127.0.0.1:4398/review/`.
4. Repeat both; they must reuse this site's server.

## Saved edits and lifecycle

1. Change the child's marker to **PREVIEW UPDATED** without saving.
2. Choose Preview Page. If prompted, save the site's changes and continue.
   Verify the updated marker appears after saving.
3. Choose **Show Preview Log**; it must belong to this review site.
4. Choose **Stop Preview Server**. The docs site on port 4321 must remain available.
5. Choose Preview Page again: start this site's server and open the child.

If already running, the first action checks reuse. Steps 4–5 check stop/start.
