# BL-169: Abbreviations And Glossaries

## Purpose

Help readers understand abbreviations and unfamiliar terms at the point where
they occur, with explanations authors can maintain consistently.

**Status: Needs decision.** Separate design item requested on 2026-10-04.

## Scope And Boundaries

Consider local term definitions, `<abbr>`, explanatory popovers and a shared
glossary. Establish the smallest useful scope first. Footnotes and sidenotes
already serve related explanatory needs and remain available.

## Decisions Made

The owner approved a separate brief for this reader need. Global term matching,
tooltip behavior and a shared glossary format remain undecided.

## Preliminary Proposals

Compare explicit references with automatic matching of declared abbreviations.
Evaluate a page-local form before choosing a site-wide registry. Explanations
should be reachable with touch and keyboard as well as a pointer.

## Open Questions

1. Where are definitions authored, and how are local and shared definitions
   resolved when they disagree?
2. Which occurrences receive an explanation: every occurrence, the first one,
   or only explicit references? How do case and plural forms affect matching?
3. Should the explanation appear inline, in a popover, or through a glossary
   link, including when printing or using the page without JavaScript?

## Dependencies

Coordinate displayed definition lists with
[BL-168 Definition Lists](BL-168-definition-lists.md). This brief does not
require multilingual-site support or replace the existing note constructs.

## Ready For Implementation When

Definition scope, occurrence matching and the reader interaction are agreed,
with examples that make the distinction from ordinary notes clear.
