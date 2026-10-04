# BL-171: Button Links

## Purpose

Let authors emphasize a destination such as Get started, Download or Try the
example using a consistent button presentation.

**Status: Needs decision.** Separate design item requested on 2026-10-04.

## Scope And Boundaries

Cover links that navigate to pages, attachments or external destinations.
Linked cards already exist. This item concerns a compact standalone link;
form submission and arbitrary scripted actions are outside its scope.

## Decisions Made

The owner approved a separate brief. Syntax, available visual treatments and
placement rules remain open.

## Preliminary Proposals

Retain ordinary link behavior while adding a small, consistent presentation
choice. Reuse Norna's existing destination resolution and file-reference rules.
Compare a single prominent link with a small group of related links.

## Open Questions

1. What source form clearly expresses the presentation without requiring
   authors to select CSS classes?
2. Are one or two levels of visual emphasis useful, and where may they appear?
3. How should multiple links wrap, and when would a card or download list
   provide better context?

## Dependencies

Coordinate attachment behavior with
[BL-160 Standard Markdown For Local Attachments](BL-160-standard-markdown-local-attachments.md)
and file collections with [BL-172 Download Lists](BL-172-download-lists.md).
A Download label alone does not change browser handling of a file.

## Ready For Implementation When

The syntax, placement and appearance are agreed, with working Examples for
page and attachment destinations and a defined boundary with cards and lists.
