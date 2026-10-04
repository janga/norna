# BL-174: Embedded Content

## Purpose

Let authors place an external player, map or demonstration within a page using
a small, predictable authoring model.

**Status: Needs evidence and decision.** Separate design item requested on
2026-10-04; supported use cases and providers remain open.

## Scope And Boundaries

Investigate bounded external embeds. The BL-161 probe emitted `<iframe>` but
did not establish a supported embed experience. Files played directly by the
browser belong to BL-173. Arbitrary executable components are outside scope.

## Decisions Made

The owner approved a separate brief. No provider list, URL detection,
automatic loading or execution policy has been chosen.

## Preliminary Proposals

Start from one concrete service and reader task. Compare a normal link with
an embedded view; retain a usable destination when the embed cannot load.
Describe the authoring choice in terms of the content readers will see.

## Open Questions

1. Which content sources justify embedding, and how are accepted URLs and
   useful titles supplied?
2. How should embedded content size itself, and what should readers see when
   a service is unavailable, blocked or unsuitable for printing?
3. When should external content load, what information is sent to the service,
   and which embedding permissions does each supported case require?

## Dependencies

Coordinate external execution and publication decisions with
[BL-163 Author HTML Publication Boundary](BL-163-author-html-publication-boundary.md).
Keep direct media playback in [BL-173 Video And Audio](BL-173-video-and-audio.md).

## Ready For Implementation When

The first supported use case, source restrictions, loading policy, permissions
and fallback are agreed, with an Examples proposal showing the reader benefit.
