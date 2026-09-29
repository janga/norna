# BL-148 Content-backed child-page lists

## Purpose

Give every navigation entry an editable `content.md` and a predictable page URL.
An author can make a useful overview without maintaining links to its children
or creating a separate `category.yaml` source type.

## Approved behavior

- Every page directory has `content.md`. The required H1 names the page.
- `page.listChildren: true` appends a generated list after all authored content.
  Editorial text, headings and images are optional. The generated list itself
  cannot be removed or hand-edited.
- Include every directly nested page that is listed in navigation, in sibling
  order. Do not flatten grandchildren or expose unlisted branches. Use each
  child's title and optional description.
- Warn when an opted-in page has no listed direct children. Allow that state
  while the author builds the tree.
- Every such page has its own destination. Remove `category.yaml` and the
  category redirect/generated-list distinction; existing category addresses
  do not need redirect migration.
- Keep direct child choices in navigation menus and preserve working tree,
  breadcrumb, search, sitemap, link, editor and no-JavaScript behavior.

## Implementation boundaries

Convert maintained sites, starters and fixtures to content-backed pages. Update
CLI/editor creation and editing, schemas, diagnostics, tests and current
documentation. Existing completed backlog records remain historical evidence;
update canonical guidance that still teaches categories as a current feature.
Review the rendered list and navigation locally before committing.
