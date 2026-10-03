# BL-159: Managed Local Markdown Images

## Purpose

Let authors use ordinary Markdown image references for local images while
receiving the same file validation, responsive variants and file-lifecycle
support as images referenced through `image-stack`.

**Status: Needs decision; follows BL-166 in discussion order.** Created at the
owner's request on 2026-10-02. Discuss
[BL-166 Page Order In Frontmatter](BL-166-page-order-in-frontmatter.md) first,
then settle this model before further image-authoring design. This discussion
order does not make page-local image management technically dependent on
BL-166's implementation. The open choices below still need agreement.

## Scope And Boundaries

Cover Markdown references to images owned by a page, using Norna's existing
managed-image processing and supported image formats. Include validation,
usage detection, rendering, editor reference handling and page/file moves.
The same file must not become unused or unmanaged merely because its author
chose Markdown syntax instead of a structured image block.

Separate file management from presentation. A shared processing pipeline does
not by itself decide whether the rendered image is inline, a standalone
figure or equivalent to a one-image stack.

This item does not authorize downloading remote images or introducing shared
image lookup across pages. Keep broader sharing and repair work within
[BL-142 Page-local Files And Explicit Sharing](BL-142-page-local-files-explicit-sharing.md).

## Decisions Made

Approved direction from the owner on 2026-10-02:

- Local images referenced with ordinary Markdown should receive the same
  management as images referenced through `image-stack`.
- Prioritize this work, with HTML placement still to be discussed.
- Explain management in the **Standard Markdown** examples, so beginners
  understand what Norna does with their local image references.
- Settle how to describe the distinction between caption and title.

The request creates a prioritized backlog item; it does not settle those
questions or authorize implementation yet.

## Open Questions

1. **HTML placement and behavior.** How should a standalone image be rendered
   and aligned? What happens to an image within a paragraph, list, quotation
   or link? Decide which existing image-stack presentation and inspection
   behavior applies while preserving authored text flow and link destinations.
2. **Standard Markdown guidance.** Where should the beginner tour introduce
   page-owned images, their source directory and automatic management? Show
   the simplest supported reference and explain when `image-stack` is useful;
   revise the current advice that local Markdown images bypass management.
3. **Caption versus title.** Markdown supplies alt text and an optional image
   title; it has no dedicated caption field. Decide how Norna explains these
   roles, whether any caption convention is wanted, and how authors obtain a
   visible caption. Do not present a title-to-caption conversion as standard
   Markdown or as an already approved Norna rule.
4. **Reference forms and ownership.** Decide whether authors write a bare
   filename, `images/name.jpg`, or both, and which Markdown reference forms
   are supported. Define missing-file diagnostics and the boundary with
   external URLs and `public/` assets without guessing another page's owner.

## Preliminary Proposals

- Resolve supported Markdown images into the shared managed-image model,
  rather than maintaining separate resizing, caching or validation rules.
- Consider `images/name.jpg` for compatibility with other Markdown tools;
  assess it against the approved ownership rules in BL-142.
- Keep alt text attached to each authored occurrence. Consider retaining
  ordinary `title` semantics and using `image-stack` when a caption is needed.
  These are proposals, not settled syntax or presentation decisions.

## Dependencies

Build on existing image processing and the approved ownership principles in
BL-142; this does not require completing its deferred cross-page sharing work.
Coordinate the resulting reference model with
[BL-135 VS Code Image Block Insertion](BL-135-vscode-image-block-insertion.md)
and [BL-137 VS Code Image Usage And Removal Review](BL-137-vscode-image-usage-removal-review.md)
before choosing new insertion defaults or usage displays.

Current behavior is described in the
[managed-image reference](../../../site/root/pages/032-reference/pages/010-site/pages/050-images/content.md)
and [image-block reference](../../../site/root/pages/032-reference/pages/030-content/pages/020-images/content.md).
[CommonMark image syntax](https://spec.commonmark.org/0.31.2/#images) defines
the alt-text and optional-title baseline.

## Ready For Implementation When

- The supported local reference syntax and HTML behavior are agreed,
  including inline and linked images.
- The caption/title explanation and any Norna-specific behavior are agreed.
- The Standard Markdown teaching example and affected reference updates are
  outlined together with the new managed/unmanaged boundary.
- A bounded implementation brief identifies shared engine/editor consumers
  and focused checks for file resolution, variants, alt/title preservation,
  usage detection, rename/move handling and responsive rendering.
