# BL-159: Managed Local Markdown Images

## Purpose

Let authors use ordinary Markdown image references for local images while
receiving the same file validation, responsive variants and file-lifecycle
support as images referenced through `image-stack`.

**Status: Ready.** Created at the owner's request on 2026-10-02; the authoring
and presentation decisions below were approved on 2026-10-04.
[BL-166 Page Order In Frontmatter](BL-166-page-order-in-frontmatter.md)
is implemented. This is the next implementation item, ahead of the remaining
image-authoring design work. The feature is not yet implemented.

## Scope And Boundaries

Cover Markdown references to images owned by a page, using Norna's existing
managed-image processing and supported image formats. Include validation,
usage detection, rendering, editor reference handling and page/file moves.
The same file must not become unused or unmanaged merely because its author
chose Markdown syntax instead of a structured image block.

Share file management across Markdown images and structured image blocks.
Render each Markdown image according to its authored context, as specified
below.

This item does not authorize downloading remote images or introducing shared
image lookup across pages. Keep broader sharing and repair work within
[BL-142 Page-local Files And Explicit Sharing](BL-142-page-local-files-explicit-sharing.md).

## Decisions Made

The owner approved shared management on 2026-10-02 and the following contract
on 2026-10-04.

### Recommended Reference And Accepted Forms

Recommend the explicit relative path in introductions and whenever Norna
inserts a Markdown image reference:

```md
![A dog resting on a blanket](images/dog.jpg)
```

Accept all three destinations as references to the same file in the referring
page's `images/` directory:

- `images/dog.jpg`: recommended form.
- `./images/dog.jpg`: equivalent relative path.
- `dog.jpg`: supported Norna shorthand, with the page-local meaning approved
  in BL-142.

The final decision to recommend the explicit path supersedes the earlier
preference for recommending the shorthand. A relative path to the actual
file also works in ordinary Markdown tools, including VS Code's built-in
Markdown preview. The shorthand requires Norna-aware resolution; adding
that resolution to VS Code's built-in preview is outside this item.

Support inline image syntax and full, collapsed and shortcut reference-style
images as defined by CommonMark. All forms use the same file lookup and
management rules. A missing local file is an error that identifies the
expected path, even if a file with the same name exists on another page.

### Presentation Follows The Authored Context

A single image that occupies a paragraph on its own follows the existing
theme-controlled presentation for a one-image `image-stack`: fit the available
space, preserve proportions, do not crop, and do not enlarge beyond the
image's natural size. Reuse the existing image inspection behavior for an
unlinked standalone image.

| Context | Behavior |
| --- | --- |
| Image mixed with text in a paragraph | Preserve inline text flow; do not insert a standalone image block. |
| Standalone image inside a list or quotation | Keep it in that container and respect the container's available width. |
| Image inside an authored link | Preserve the link destination; clicking follows that link. |
| Several images in one paragraph | Preserve the authored structure; do not create an automatic gallery. |

Limit automatic click-to-inspect behavior to unlinked standalone images.
Every context still receives managed variants and file-lifecycle support.
Per-image width, height and alignment attributes are outside the first scope.

### Alt Text, Title And Caption

- Preserve alt text as the text alternative for each authored occurrence.
  The same file may have different alt text in different contexts; an empty
  alt value remains valid Markdown.
- Preserve an optional Markdown image title as the image's `title` attribute.
- A caption is an explicitly authored visible image description. Use
  `image-stack` when a visible caption is needed in this first scope.

Do not automatically turn alt text or title into a caption. No new caption
syntax is introduced by this item.

### Ownership, External Images And Migration

Managed images remain in the owning page's `images/` directory. Supporting
explicit relative paths does not permit managed images throughout the source
tree. Keep external URLs and `public/` assets under their separate existing
rules, and keep deliberate sharing between pages in BL-142.

Rendering must not search another page for a replacement file or copy or move
source files. An explicit future import action may copy images into the
appropriate page directories and rewrite references. A full migration tool
is outside this item. Keep the existing managed-image format and filename
limits, document them clearly, and assess them before promising easy migration.

### Examples And Editor Guidance

Extend **Standard Markdown** with the image directory, the recommended
reference, automatic image variants and usage tracking, the alt/title/caption
distinction, and when to choose `image-stack`. Replace the current guidance
that local Markdown references bypass management. Keep supported alternative
paths in the reference without making the beginner tour teach every form.

Update the managed-image, image-block and relevant workflow references in the
implementation change. Keep the **External images and files** examples clear
about the boundary between page-owned managed images and other image sources.

The VS Code extension must recognize the accepted Markdown forms for reference
handling, usage review, rename and move operations. Recommending a path for
Markdown images does not decide whether the editor's default insertion action
should create Markdown or `image-stack`; that remains a separate product choice.

## Implementation Brief

1. Resolve parsed Markdown image references into the existing managed-image
   model. Cover direct and reference-style images, validation and usage
   collection through shared engine rules.
2. Reuse image processing, variants and caching. Add rendering that preserves
   inline and linked contexts while sharing standalone presentation and
   inspection with the existing image components.
3. Carry the reference model through content checks, synchronization planning,
   page/file move and rename handling, and the existing editor image consumers.
   Preserve the referring page's ownership and report missing files consistently.
4. Update the examples and canonical reference together with implementation.
   Validate only the affected engine, rendering, editor and documentation paths.

### Focused Acceptance Checks

- All accepted local paths and CommonMark image reference forms identify the
  same page-owned file and obtain managed variants.
- Same-named files on different pages remain independent; a missing local file
  does not resolve to a different owner's image.
- Markdown usage, including mixed Markdown and image-block usage, prevents an
  image from being classified as unused and appears in removal review.
- Rendering preserves alt/title values, inline text flow, list/quotation
  structure and authored links, without nested anchors or invalid block nesting.
- Standalone images follow the theme, remain responsive without cropping or
  enlargement, and offer inspection only when unlinked. Multiple images in a
  paragraph retain their authored structure.
- File rename and page moves preserve targets for each supported reference
  form. Existing mutation safeguards still apply.
- External and public images retain their existing behavior. Examples and
  reference explain the new managed-image boundary and current file limits.
- Relevant editor behavior is checked through the shared engine contracts;
  changed suggestions and source editing follow the repository's manual review
  agreement. Record any owner review still pending when packaging a VSIX.

## Evidence Behind The Decisions

- [CommonMark images](https://spec.commonmark.org/0.31.2/#images) define the
  reference forms, alt text and optional title.
- [Docusaurus assets](https://docusaurus.io/docs/markdown-features/assets) and
  [Starlight images](https://starlight.astro.build/guides/authoring-content/#images)
  demonstrate relative local image references; Starlight uses Astro's image
  optimization support.
- [Material for MkDocs images](https://squidfunk.github.io/mkdocs-material/reference/images/)
  uses explicit extensions for captions, alignment and lightbox behavior.
- [VS Code Markdown paths](https://code.visualstudio.com/docs/languages/markdown#_path-completions)
  resolve relative paths from the current file. `images/name.jpg` therefore
  identifies Norna's actual source file without a Norna-specific lookup rule.

`images/` is not a universal competitor directory name. The portability reason
for the recommended form is that it points to the file's actual location in a
Norna page, not that this name removes the need to rewrite all imported paths.

## Dependencies

Build on existing image processing and the approved ownership principles in
BL-142; this does not require completing its deferred cross-page sharing work.
Coordinate the resulting reference model with
[BL-135 VS Code Image Block Insertion](BL-135-vscode-image-block-insertion.md)
and [BL-137 VS Code Image Usage And Removal Review](BL-137-vscode-image-usage-removal-review.md)
when updating their existing reference and usage consumers. A change to the
default inserted block type is not part of this brief.

Current behavior is described in the
[managed-image reference](../../../site/root/pages/reference/pages/site/pages/images/content.md)
and [image-block reference](../../../site/root/pages/reference/pages/content/pages/images/content.md).
