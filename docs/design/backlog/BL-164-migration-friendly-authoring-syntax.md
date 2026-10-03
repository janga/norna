# BL-164: Migration-Friendly Authoring Syntax

## Purpose

Find out whether a small syntax change or optional shorthand would
substantially reduce the manual work of trying Norna with existing
documentation. The result should make common content easier to bring across
without making Norna's normal authoring model ambiguous or tied to one source
system.

**Status: Prioritized investigation requested by the owner on 2026-10-03;
needs evidence and decision.** No syntax change is approved yet.

## Scope And Boundaries

Use the pinned, representative Docusaurus, VitePress, Material for MkDocs and
Starlight pages from
[BL-098 Representative Documentation Remigration](BL-098-representative-documentation-remigration.md)
as the first comparison set. For each repeated manual rewrite, identify the
source construct, current Norna representation, number and kind of edits, and
any lost meaning or behavior. Sample additional real sites only when the
existing set cannot test a promising cross-system pattern.

Compare three ways to remove work: keep the current explicit syntax and give
clearer migration guidance; accept a narrow shorthand that normalizes to an
existing Norna construct; or change a Norna authoring rule when that also
improves ordinary writing. Include images, attachments, callouts, tabs/code
groups, code excerpts, diagrams and mathematics only where the corpus shows a
concrete migration obstacle. Coordinate with BL-159, BL-160, BL-050, BL-051 and
BL-053 instead of pre-empting their syntax decisions.

This is a syntax and authoring investigation, not a general importer, MDX/JSX
execution layer, source-system compatibility mode or resumed
[BL-052 Docusaurus Migration Obstacle Inventory](BL-052-documentation-migration-assistant.md).
Keep competitor sources read-only and do not revive BL-104's archived decision
registry or broad conversion workflow.

## Decisions Made

- The owner wants to test whether syntax or syntactic sugar can materially
  lower the barrier for people trying Norna with existing content.
- Any change must benefit more than an isolated example; ordinary Norna
  authoring remains the baseline.

## Open Questions

1. Which repeated manual edits cost the most across representative source
   systems? Distinguish syntax changes from missing product capabilities,
   source assets, bespoke components and editorial work.
2. Would a shorthand preserve semantics, links, source locations, validation,
   search, print and no-JavaScript reading? Would it remain understandable in
   Markdown source outside Norna?
3. Does the benefit recur across systems, or would a one-off migration recipe
   be simpler than permanently accepting another source form?
4. Can a candidate be parsed and diagnosed unambiguously alongside standard
   Markdown, GFM and existing Norna blocks? How would authors convert from the
   shorthand to Norna's canonical form, if the two differ?
5. How much manual work would each candidate actually remove in the pinned
   corpus, and what ongoing parser, editor and documentation cost would it add?

## Ready For Implementation When

- A small before/after comparison counts the edits avoided for each candidate
  across the representative pages and names the remaining losses.
- Candidates are ranked by migration benefit, Norna fit and permanent cost;
  source-specific conveniences with little shared value are rejected.
- The owner approves any proposed syntax and its canonical meaning before
  implementation. A finding that guidance or one-off conversion is better is
  also a valid completion of this investigation.
