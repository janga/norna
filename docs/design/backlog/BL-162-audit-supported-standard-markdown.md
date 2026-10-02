# BL-162: Audit Supported Standard Markdown

## Purpose

Give authors and maintainers a reliable account of which CommonMark and GFM
constructs Norna supports end to end, and ensure Examples documents the useful
constructs that already work.

**Status: Completed on 2026-10-02.** The representative built-site fixture,
findings, fixes and remaining boundaries are recorded in the
[Standard Markdown compatibility audit](../standard-markdown-compatibility-audit.md).
The result is not a claim of full specification compliance.

## Scope And Boundaries

Compare Norna's parser, Markdown transformations, site build, generated HTML
and maintained authoring guidance with selected CommonMark and GFM constructs.
Cover parsing and Norna-specific constraints that affect actual published
content. Identify unsupported or partially supported syntax and clarify what
Examples should teach.

Do not implement broad parser conformance, add new Markdown features, or
duplicate the HTML-pattern investigation in
[BL-161 Norna-Shaped Alternatives To Common HTML](BL-161-norna-shaped-alternatives-to-common-html.md).
Local image and attachment management decisions remain with
[BL-159](BL-159-managed-local-markdown-images.md) and
[BL-160](BL-160-standard-markdown-local-attachments.md).

## Preliminary Coverage List

- CommonMark blocks: paragraphs, ATX and setext headings, thematic breaks,
  block quotes, nested and loose lists, indented and fenced code blocks.
- CommonMark inlines: emphasis and delimiter edge cases, code spans, escapes,
  entities, inline and reference links, titles, images, and soft/hard breaks.
- GFM: tables and alignment, task list items, strikethrough, autolinks and
  URL/email handling.
- Norna integration: heading extraction, alert transformation, footnotes,
  raw HTML behavior, link/file resolution and exact displayed-source guidance.

This list is a starting point. Record deviations and meaningful edge cases,
not only successful examples.

## Questions Reviewed

1. Which constructs are parsed correctly in isolation and preserved through
   Norna's complete content pipeline?
2. Which specification versions and extensions are actually enabled by the
   current parser configuration?
3. Which syntax has constraints caused by Norna's heading, link, file,
   callout or page-generation behavior?
4. What representative cases belong in automated regression coverage, and
   which belong in Examples or the reference?
5. Are any current examples misleading, inconsistent with exact source, or
   teaching a nonportable dialect without saying so?

## Completion Criteria

- The audit records parser configuration and relevant integration points.
- A representative fixture set covers supported, constrained and unsupported
  cases for each in-scope construct.
- The team has decided whether any implementation changes are warranted;
  documentation-only completion is acceptable when behavior is already
  sufficient.
- Public Examples and reference wording distinguish CommonMark, GFM and
  Norna-specific syntax precisely.
