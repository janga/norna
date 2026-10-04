# BL-160: Standard Markdown For Local Attachments

## Purpose

Investigate how ordinary Markdown should let authors link to local files and
attachments for readers to open or download, with predictable file management
and clear beginner guidance.

**Status: Needs evidence and decision.** Requested on 2026-10-02 as the
attachment counterpart to
[BL-159 Managed Local Markdown Images](BL-159-managed-local-markdown-images.md).
Discuss it immediately after BL-159; this is not yet an implementation brief.

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

- The owner requested a separate investigation analogous to BL-159.
- Whether additional syntax or behavior is needed remains open.
- BL-155's existing attachment and browser-handling decisions remain in force
  unless explicitly changed during this investigation.

## Open Questions

1. **Syntax coverage.** Which ordinary Markdown forms work end to end today:
   inline links, reference-style links and optional titles? Verify parsing,
   rendered destinations and reference updates rather than assuming parity.
2. **Paths and management.** Should the author use `file.pdf`,
   `downloads/file.pdf`, or both? Which forms already work? Explain how a
   page-owned file differs from a `public/` file or an external URL, and
   preserve explicit ownership and missing-file diagnostics.
3. **HTML and browser behavior.** Is a normal link the complete intended
   presentation? Does the product need an explicit way to request download,
   or should it retain normal browser handling? Any download-specific option
   would require a separate decision and an honest explanation of its limits.
4. **Standard Markdown guidance.** Where should the beginner tour demonstrate
   a working local file link and explain Norna's publication and management?
   Distinguish visible link text, an optional title and the actual file action;
   avoid promising that a label alone controls downloading.
5. **Editor and file lifecycle.** Do insertion, usage discovery, rename and
   page moves handle the chosen forms consistently, including filenames with
   spaces or Unicode and links containing queries or fragments?

## Preliminary Proposals

- Prefer ordinary Markdown links as the default authoring form, building on
  the implementation already delivered in BL-155.
- Compare source-relative `downloads/file.pdf` with the existing filename
  shorthand for readability and compatibility with other Markdown tools.
- Show a real attachment in Standard Markdown and link to the attachment
  reference for ownership and lifecycle rules.

These are discussion proposals; no new path convention, download attribute
or editor default has been approved.

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

## Ready For Implementation When

- Existing support has been compared with representative Markdown links and
  any remaining gap is concrete.
- Reference syntax, ownership and open/download behavior are agreed.
- Standard Markdown guidance and editor implications are specified.
- Either a bounded implementation with directly relevant checks is ready,
  or the investigation concludes that existing behavior only needs clearer
  documentation.
