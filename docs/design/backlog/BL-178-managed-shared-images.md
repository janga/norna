# BL-178: Managed Shared Images

## Purpose

Give deliberately shared site images, including the navigation logo, the
processing and usage support already available to page-owned images.

## Scope And Boundaries

Follow BL-177 Publication Path Ownership And Collision Checks. Reuse image
hashing, appropriate responsive sizes and direct SVG output. Track uses across
page content and site configuration for rename and removal review. Keep source
ownership explicit. Do not introduce stable unversioned original image URLs.

## Decisions Made

The owner approved a separate follow-up on 2026-10-04. Shared images have a
defined source area in public/; recognized site images keep their source names.

## Open Questions

- Select explicit shared-image references for ordinary Markdown and Norna
  image blocks, including ordinary Markdown preview behavior.
- Define logo sizing and retain format requirements for social images and
  browser icons before including those special consumers in processing.
- Settle configuration-reference updates and native editor insertion support.

## Dependencies

BL-177 supplies publication ownership. Coordinate with BL-142 Page-local Files
And Explicit Sharing without reopening its separate cross-page repair scope.

## Ready For Implementation When

Shared-reference syntax and the first set of consumers are agreed, with
concrete rename/removal examples. Implementation is not part of BL-177.
