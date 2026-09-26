# BL-142: Page-local Files And Explicit Sharing

## Purpose

Make it predictable which image or attachment a page uses, while allowing
authors to choose between independent local copies and deliberate sharing.
The same ownership principles should apply to both kinds of file.

**Status: Deferred.** The owner approved rules 1–3 below on 2026-09-21 and
requested a backlog record to revisit later. No implementation is scheduled.

## Scope And Boundaries

Cover the engine's file resolution, validation and repair support, together
with the corresponding authoring help in the VS Code extension. Reuse one
engine contract rather than introducing separate lookup rules in the editor.

Retain the current site and page hierarchy. This item does not include the
separately discussed Site Tree ordering and error-marker changes, multilingual
or versioned content, or general file management.

Moving an owning page and reviewing deletion consequences need coordination
with existing and future commands. Automatic rewriting on moves and a new
deletion workflow are not additional approved requirements in this item.

## Decisions Made

### 1. A Bare Filename Identifies A Local File

A managed image filename identifies a file in the referring page's `images/`.
An attachment filename identifies a file in that page's `downloads/`. Authors
may use ordinary Markdown links without writing the attachment directory:

```md
[Checklista (PDF)](checklista.pdf)
```

Identical filenames on other pages do not affect this lookup. Local copies
are acceptable: they let pages keep independent resources, at the cost of
having to update each copy when the same material changes.

### 2. A Missing Local File Is An Error With Repair Help

If the local file is missing, report an error even when exactly one file with
that name exists elsewhere. Discovery elsewhere may support a proposed move
or copy, but it must not silently resolve the reference during rendering.

Repair must not guess between candidates, overwrite a destination, or move a
file away from another page that still uses it. Keep correction separate from
lookup and require an explicit correction action.

This replaces the earlier discussion idea that a globally unique filename
could automatically resolve outside the referring page.

### 3. Sharing Requires An Explicit Path

An author may deliberately refer to an image or attachment owned by another
page using an explicit path. That reference identifies a particular file;
other files with the same name must not change its meaning.

The file retains its owning page when its reference is moved between pages.
The reference may need a path adjustment, depending on the syntax selected
later; moving the reference must not itself relocate the shared file.

### Related Decisions From The Discussion

- Attachments belong in the owning page's `downloads/`, including
  `site/downloads/` for the homepage. Keep `public/` for site-wide static
  files such as `robots.txt`, logos and icons; the sitemap remains generated.
- Attachment links use the browser's normal handling: a supported document
  can open for reading, and other files can download. Do not force every link
  to download. Browser settings and hosting headers can affect the result.
- Existing published attachment URLs may break when attachments are moved;
  preserving them through redirects or aliases is not a requirement.

## Open Questions

1. What explicit path syntax works for both managed image blocks and Markdown
   attachment links? Define its base and distinguish source paths from public
   URLs, ordinary page links, anchors and external links.
2. How are attachment files published, named and checked for output collisions?
   Decide supported directory depth and how existing links to static files
   continue to be interpreted.
3. How should repair help offer move, copy or an explicit shared reference?
   Define the CLI and VS Code extension responsibilities, including useful
   suggestions without automatic file changes.
4. What happens to explicit references during existing page moves and content
   synchronization? Identify the minimum changes needed to preserve their
   targets and any separate follow-up work.

## Dependencies

- Build on the existing managed-image validation and `content:sync` repair
  contract. Page-local attachments and explicit managed-image paths require
  new support; this record does not describe already available features.
- Coordinate the editor work with
  [BL-134 VS Code Image File Operations](BL-134-vscode-image-file-operations.md),
  [BL-135 VS Code Image Block Insertion](BL-135-vscode-image-block-insertion.md)
  and [BL-137 VS Code Image Usage And Removal Review](BL-137-vscode-image-usage-removal-review.md).
  Preserve their agreed discussion order and separate visual approval steps.
- BL-115 Page-owned Attachments covers later language/version variants of this
  basic contract. Those variants are not prerequisites for this item.

## Ready For Implementation When

The owner resumes the item, the path and publication questions have concrete
examples, and the engine/editor scope is agreed. The implementation brief
must include focused checks for local lookup with duplicate filenames, missing
local files despite a unique candidate on another page, safe repair, explicit
sharing, and reference moves that retain the original file owner.

Update the image, attachment, validation and authoring reference documentation
with the implementation once the relevant contracts are verified. Any changed
VS Code suggestions must also be tested through the suggestion widget.
