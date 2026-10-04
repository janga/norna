# BL-160: Standard Markdown For Local Attachments

## Purpose

Let authors link to page-owned files using ordinary Markdown, with predictable
file management and clear beginner guidance.

**Status: Implemented 2026-10-04; native VS Code review remains with the owner.**
Requested on 2026-10-02
as the attachment counterpart to
[BL-159 Managed Local Markdown Images](BL-159-managed-local-markdown-images.md).
The owner approved the following decisions on 2026-10-04.

## Existing Baseline

[BL-155 Page Attachments](BL-155-page-attachments.md) already implements
ordinary Markdown attachment links. A bare filename identifies a file in
the current page's `downloads/`:

```md
[Download the checklist](checklist.pdf)
```

A site-relative address can explicitly identify another page's attachment:

```md
[Guide checklist](/guide/downloads/checklist.pdf)
```

Files are published unchanged and move with their owning page. Known
references participate in the shared link and file-operation model. The
browser and hosting headers determine whether a file opens or downloads;
the link text "Download" does not force that behavior.

This investigation must distinguish existing support from actual gaps. It
must not describe standard Markdown attachment links as an unimplemented
feature or duplicate BL-155's delivered scope.

## Scope And Boundaries

Review the supported Markdown reference forms, target resolution, file
ownership, generated links, editor insertion and author-facing guidance.
Establish whether the current model is sufficient or a bounded extension is
needed. A documentation-only conclusion is a valid outcome.

Use the existing `downloads/` model and shared engine rules as the baseline.
Do not broaden this item into remote-file importing, custom viewers, file
conversion, shared-resource repair or language/version variants.

[BL-172 Download Lists](BL-172-download-lists.md) separately covers a coherent
download menu for several files on a page. Coordinate link targets and
open/download behavior here; selection, metadata, order and menu presentation
belong to BL-172.

## Decisions Made

Recommend the actual relative source path, including for links inserted by
VS Code:

```md
[Open the checklist](downloads/checklist.pdf)
```

Accept `downloads/checklist.pdf`, `./downloads/checklist.pdf` and the existing
`checklist.pdf` shorthand as references to the same page-owned file. This
follows BL-159 and lets ordinary Markdown tools resolve the recommended path.
Keep explicit cross-page attachment URLs under BL-155's existing ownership
rules. An explicit local downloads path must not silently use a public file
or a same-named attachment owned by another page.

Use ordinary text links. The browser and hosting headers decide whether to
open or download a file; do not introduce a forced-download attribute or a
custom viewer. A link's visible text and optional title do not control this.

Add a real attachment, a working link and its exact Markdown source to
Standard Markdown. Explain the downloads directory and file lifecycle, with
advanced path forms in the reference. BL-172 owns the multi-file download menu.

## Implementation Brief

- Verify inline, full, collapsed and shortcut reference links, including
  optional titles and definitions used across sections.
- Resolve all three local path forms through the shared attachment model.
  Preserve existing external, public and explicit cross-page URL behavior.
- Preserve the author's path form, titles, queries/fragments, Unicode/spaces,
  CRLF and unrelated text during rename; edit shared definitions only once.
- Check usage/removal and page movement against the same link graph.
- Have the engine's editor insertion API generate `downloads/filename` links,
  retaining the existing insertion, dirty-buffer and Undo boundaries.
- Update Standard Markdown, attachment and editor guidance, and verify actual
  published destinations, unchanged attachment bytes and a non-root base path.

## Gaps Addressed

The link graph already resolved source-relative downloads paths as URLs, but
rendering preparation recognized only the bare filename, editor insertion
emitted that shorthand, and rename converted relative paths into site-relative
URLs. These consumers now share one local-target parser. Rename retains the
author's prefix and updates a shared definition once. Page moves preserve
working local paths, including escaped filenames.

Heading rendering now includes link definitions from the complete page and
rewrites local attachments, so reference links and filename shorthand work in
headings too. Explicit local paths report a missing page-owned file instead
of falling back to public files or another page's attachment.

The engine inserts `downloads/filename` through the existing editor API.
The current development extension **0.15.0** needs no runtime change or new
VSIX; reload the VS Code window to load the updated engine.

Standard Markdown now includes a real publishing checklist, a working link
and matching source. Attachment, Markdown and editor references describe the
accepted forms, rename behavior, optional titles and browser-controlled file
handling.

## Verification

Verified on 2026-10-04:

- The link-graph suite and 21 focused attachment, resource-action and VS Code
  adapter tests passed. Coverage includes all three local forms, inline/full/
  collapsed/shortcut references, titles, shared definitions across sections,
  missing-file ownership errors, dirty CRLF source, Unicode/spaces, removal,
  rename and page movement.
- The page-move and page-Markdown suites passed. After adding escaped-filename
  preservation, the page-move suite and focused deeper-move case passed again.
- Attachment build coverage verified heading, list, quote and card contexts,
  non-root deployment URLs, unchanged file bytes and no forced download.
  The existing complete Markdown-image build test also passed after the
  shared heading-rendering change.
- Documentation checks and an isolated documentation build passed.
- The Local files example was inspected at the registered compact viewport.
  A browser with JavaScript disabled followed the real link under `/norna/`
  and received the original checklist bytes with HTTP 200. The link retained
  its title and had no forced-download attribute.

Native insertion, Undo and dirty save/reopen checks remain for the owner;
automated adapter checks do not establish those results. See the
[editor review scenarios](../editor-workflow-test-plan.md#bl-160-standard-markdown-attachment-review).

## Dependencies

Use [BL-155 Page Attachments](BL-155-page-attachments.md) and the approved
ownership rules in
[BL-142 Page-local Files And Explicit Sharing](BL-142-page-local-files-explicit-sharing.md).
Coordinate terminology and beginner guidance with BL-159. Its discussion
priority does not imply that image rendering must be implemented first.

Current documentation is in the
[page-attachment reference](../../../site/root/pages/reference/pages/site/pages/attachments/content.md)
and the working
[attachment example](../../../site/root/pages/examples/pages/building-a-site/content.md).

## Acceptance Checks

- All accepted local forms resolve to the owning page's file in validation,
  rendering, usage, insertion, rename and page movement.
- Missing explicit local files are errors with the expected source path.
- Reference definitions, optional titles and literal code examples survive
  editing correctly; a shared definition is changed once.
- Published URLs include the deployment prefix and retain queries/fragments;
  attachment bytes are unchanged and no download attribute is forced.
- The beginner example has a usable attachment link and matching source.
- Focused engine and extension-adapter checks pass. The owner handles native
  VS Code review of insertion, Undo, rename and dirty save/reopen.
