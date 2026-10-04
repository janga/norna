# BL-175: Advanced Tables

## Purpose

Represent data that needs merged cells or grouped column headings while
preserving understandable relationships between headings and values.

**Status: Needs evidence and decision.** Separate design item requested on
2026-10-04; a real table must demonstrate the need beyond existing GFM tables.

## Scope And Boundaries

Investigate a bounded extension beyond ordinary rectangular GFM tables.
Norna already provides responsive scrolling, sticky headings and sorting for
its tables. The earlier HTML probe did not give a handwritten table the same
wrapper. Start by establishing which advanced structures are necessary.

## Decisions Made

The owner approved a separate brief. Merged-cell syntax, grouped headings and
their interaction with existing table behavior remain undecided.

## Preliminary Proposals

Compare a representative complex table with several simpler tables. If the
complex structure remains useful, evaluate semantic HTML and established
authoring formats before proposing new syntax.

## Open Questions

1. Which combinations of merged rows, merged columns and heading levels are
   necessary, and what is their authoring form?
2. How do those structures interact with sticky row/column headings, sorting
   and narrow-screen scrolling?
3. How are header relationships expressed for assistive technology, and how
   does Norna explain an ambiguous or unsupported table structure?

## Dependencies

Use the [table reference](../../../site/root/pages/reference/pages/content/pages/tables/content.md)
and [BL-161 audit](../common-html-authoring-audit.md) as the baseline. Preserve
the existing GFM path while investigating the additional structures.

## Ready For Implementation When

A concrete table establishes the need. Source syntax, supported structures,
header semantics and compatibility with current table interactions are agreed.
