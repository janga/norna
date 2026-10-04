---
navigation:
  order: 1000
---

# BL-166 Create between pages

## Create after Alpha

1. Expand this page. Alpha, Beta and Gamma have orders 1, 2 and 3.
2. Right-click **Alpha**, choose **Add > Page…**, and enter **Inserted page**.
3. Choose **After “Alpha”** in the placement field and wait for the preview.
4. Inspect the proposed file changes, then **Cancel** before creating the page.
5. Repeat, review the affected files and choose **Create page** to confirm.
   If the form asks for another confirmation, review it before proceeding.

## Expected result

Cancel leaves all files unchanged and creates no page. Confirm creates slug
`inserted-page` between Alpha and Beta, with these orders:

| Page | Old | New |
| --- | --- | --- |
| Alpha | 1 | 1000 |
| Inserted page | New | 2000 |
| Beta | 2 | 3000 |
| Gamma | 3 | 4000 |

The review names the three existing sibling files. Their directories, URLs
and body text stay unchanged. The separate Move between pages group is untouched.

Before confirming, also try changing Alpha's prose without saving.
Creation must identify the unsaved file. Save or undo it, then try again.
