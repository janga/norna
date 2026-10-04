# BL-173: Video And Audio

## Purpose

Present instructional recordings and audio clips with usable playback controls
and supporting text that fit Norna pages.

**Status: Needs evidence and decision.** Separate design item requested on
2026-10-04; a representative author task is needed before selecting scope.

## Scope And Boundaries

The BL-161 probe emitted authored `<video>` and `<audio>`. Investigate a
documented media construct, including source files, controls, captions or
transcripts and responsive presentation. External service embeds belong to
BL-174. Media transcoding and a streaming service are outside the initial scope.

## Decisions Made

The owner approved a separate brief for video and audio. A managed-media
pipeline, storage convention and playback defaults have not been approved.

## Preliminary Proposals

Use a short instructional video and an audio recording as design examples.
Evaluate standard playback controls, supporting text and a direct file link
before adding custom player behavior.

## Open Questions

1. Which local and remote source forms are needed, and how do local media
   files participate in ownership, reference checks and page moves?
2. How are video posters, subtitles, captions and transcripts authored and
   associated with a recording?
3. What loading, playback and sizing defaults work for long pages and narrow
   screens, and what appears when playback is unavailable?

## Dependencies

Build on the [BL-161 audit](../common-html-authoring-audit.md) and existing
[page attachments](BL-155-page-attachments.md). Coordinate media file choices
with BL-160 and keep provider integration in
[BL-174 Embedded Content](BL-174-embedded-content.md).

## Ready For Implementation When

A real use case establishes the first media types and source model. Playback,
supporting-text and file-lifecycle decisions are agreed, with a bounded example
and an implementation plan that preserves them.
