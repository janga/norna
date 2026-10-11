# BL-178: Automatic Site Image Processing

## Purpose

Let authors supply one original per named site-image role while Norna prepares
appropriate display sizes and handles browser caching after an image changes.

## Scope And Boundaries

Consider responsive variants for raster navigation logos, direct SVG output
and content hashes for named site resources. Generated variants belong in build
output; authors keep recognized source filenames directly in `public/`.
General shared content images and cross-page image syntax are outside this idea.

## Decisions Made

On 2026-10-11 the owner requested this as an idea, separate from implementing
BL-179 Simplify Public Site Resources. This supersedes the 2026-10-04 proposal
to process a general shared-image source area under `public/`.

Ordinary content images belong to their page's `images/`. The recognized logo,
favicon, touch icon and social image remain in `public/`. Existing artwork,
including individually optimized entries in an ICO file, must be preserved.

## Preliminary Proposals

- Prefer SVG for logos; generate useful raster sizes from a sufficiently large
  original when the author supplies PNG/JPEG.
- Keep source authoring simple: no manual collection of resolution filenames.
- Treat icon generation as a separate design choice; shrinking a logo does not
  guarantee a legible small icon or a well-composed social image.

## Open Questions

- Which raster logo sizes follow the configurable display height, and what
  happens when the source is too small?
- Which named resources should receive hashed output URLs, and how should
  metadata and external icon discovery refer to them?
- Is there an evidenced need to generate touch icons or icon formats? If so,
  how can authors provide simplified artwork and retain a prepared ICO?
- Which validation and editor feedback would help without requiring more
  configuration or author-maintained resolution variants?

## Dependencies

BL-177 Publication Path Ownership And Collision Checks supplies publication
ownership. BL-179 Simplify Public Site Resources defines allowed sources.

## Ready For Implementation When

The first consumers, sizing rules and cache behavior are agreed. This idea is
not implementation authorization; BL-179 continues to copy named assets unchanged.
