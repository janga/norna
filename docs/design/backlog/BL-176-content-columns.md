# BL-176: Content Columns

## Purpose

Let readers compare related content side by side, such as an example and its
explanation, while retaining a clear reading order on smaller screens.

**Status: Needs evidence and decision.** Separate design item requested on
2026-10-04; a representative layout is needed before selecting syntax.

## Scope And Boundaries

Investigate a bounded arrangement of content blocks. Cards already group
related choices, and tabs already group alternatives. Establish a use case
they do not serve before adding column layout. General CSS controls and a
page-builder system are outside the initial scope.

## Decisions Made

The owner approved a separate brief. Column counts, content types and source
syntax remain open.

## Preliminary Proposals

Start with two related regions and a deliberate source order. Let Norna
choose when they stack, using the available reading width. Evaluate a working
example beside explanatory prose under the existing site layouts.

## Open Questions

1. Which content combinations justify columns, and what constraints keep them
   readable without author-written layout styles?
2. Which content comes first when columns stack, and how do headings affect
   the page outline and anchor navigation?
3. How should the layout respond to wide content, Focus reading, printing and
   different presets?

## Dependencies

Use the [BL-161 audit](../common-html-authoring-audit.md), the existing card
and tab constructs, and the current layout model. Coordinate image-only
collections with the `norna-image-grid` idea under BL-019 if it is resumed.

## Ready For Implementation When

A concrete example establishes the reading benefit. Permitted content,
source order, outline behavior and stacking rules are agreed without exposing
general layout programming to authors.
