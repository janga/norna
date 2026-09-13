# BL-104: Evidence-Based Migration Solution Register

## Status And Boundary

**Implemented on 2026-09-12 after `BL-052` initial read-only audit.** Replaced the current
executive-style migration summary with a compact decision site built from
concrete migration solutions. This item interprets the audit; it does not
change the audit parser, add write mode, or add a general Docusaurus runtime to
Norna.

The result is private maintainer material under `marketing/`. It must remain
separate from public Norna documentation and npm package output.

## Problem

An aggregate finding count is not enough to decide what Norna should support.
The maintainer needs to see, for each recurring source problem:

- what the source data looks like;
- how often it occurs and on how many pages;
- what Norna can preserve;
- what a concrete conversion, adapter, or fallback would do;
- what information or behavior would be lost; and
- whether the result justifies Norna implementation work.

The existing decision material is too essay-like and groups problems by broad
strategy. The primary unit must instead be a concrete solution for a concrete
problem fingerprint. Broad strategies remain useful as filters and totals,
not as the main explanation.

## Target Format

The report site must contain a short overview and a solution register. Each
solution record uses the same compact structure:

```text
solution -> source problem -> evidence -> Norna result -> loss -> decision
```

The overview must show mutually exclusive migration-path totals:

| Migration path | Occurrences | Share of all findings |
| --- | ---: | ---: |
| Rewrite to existing Norna syntax | ... | ... |
| Simple readable fallback | ... | ... |
| Source-specific adapter | ... | ... |
| AI or manual review | ... | ... |

Percentages must state their denominator. The report must distinguish
occurrences from unique affected pages; one page may contain several findings.

Each solution record must contain:

| Field | Requirement |
| --- | --- |
| Solution ID | Stable ID for the proposed solution, separate from the source problem ID |
| Problem type | One or more exact audit fingerprints, with counts per fingerprint |
| Source construct | The concrete Docusaurus syntax, metadata, or data shape |
| Occurrences | Absolute count and percentage of all findings and of the solution path |
| Affected pages | Count of unique pages and representative source links |
| Source evidence | A short real excerpt, source-file location, or a relevant snapshot |
| Norna representation | Exact accepted syntax or generated data shape |
| Evidence of result | A rendered Norna example, screenshot, or structured before/after mapping |
| Preserved data | Meaning and presentation retained by the conversion |
| Lost data | Behavior, metadata, or presentation that cannot be retained |
| Migration method | Rewrite, fallback, adapter, or AI/manual review |
| Product decision | Build in Norna, build an adapter, use fallback, or ignore as an engine feature |
| Priority | Relative order justified by frequency, user value, complexity, and loss |
| Open decision | The smallest unresolved choice blocking implementation |

## Evidence Rules

Evidence must make the problem understandable from the data, not merely claim
that it exists.

- Syntax problems show real source input and the corresponding Norna output.
- Metadata problems use a field-mapping table showing source, Norna, and status.
- Visual problems use side-by-side source and Norna snapshots when appearance
  is part of the problem.
- Unsupported behavior shows the readable fallback and states the lost behavior.
- Route and page-model problems show source paths or metadata beside the
  proposed Norna page tree.
- AI/manual cases show the source fragment and the competing interpretations
  that require a human decision.

Use the smallest evidence that proves the decision. Do not reproduce a whole
competitor website or create decorative illustrations unrelated to the source
problem.

## Proposed Solution Families

The initial register should cover the current report without hiding its
individual fingerprints. Expected first solution records include:

- code metadata conversion;
- semantic callout conversion;
- managed image conversion;
- readable fallback for unsupported code metadata;
- removal of source-only MDX module statements while preserving content;
- frontmatter and route metadata adapters;
- static treatment or review of tabs, generated child lists, and presentation
  wrappers; and
- human or AI review for unsupported components, expressions, interactive
  behavior, and missing page identity.

A solution may group related fingerprints only when they share the same
conversion rule and loss profile. Otherwise each fingerprint gets its own
record.

## Acceptance Criteria

- The current executive-style decision site is replaced by a compact overview
  and solution register; it is not expanded into a long narrative.
- Every audited problem type is either attached to a concrete solution record
  or explicitly marked as unresolved, out of scope, or intentionally ignored.
- Every solution record contains occurrence counts, unique-page counts where
  available, percentages with denominators, priority, method, fallback, and
  product decision.
- Every high-frequency record contains real source evidence and a Norna
  representation. The evidence is either a source excerpt, a mapping table,
  or a side-by-side rendered comparison appropriate to the problem.
- The register distinguishes a migration fallback from a decision to add a
  permanent Norna feature.
- Totals reconcile with `migration-report.json`: 13,658 findings and 26
  problem types for the current Docusaurus revision.
- A reader can answer, without reading a long essay, which problems are common,
  which solutions cover them, what is lost, and what Norna should do next.
- The decision site builds as a normal private Norna site and does not execute,
  mirror, or publish the Docusaurus project.

## Dependencies And Non-Goals

- Depends on `BL-052` for stable problem IDs, counts, samples, provenance, and
  machine-readable findings.
- May reuse `BL-098` migration trials as visual and syntax evidence, but must
  not treat those manually curated trials as proof of universal conversion.
- Does not implement automatic migration writes.
- Does not add tabs, MDX execution, Docusaurus-compatible components, or other
  Norna runtime features merely because the report contains such findings.
- Does not require a public documentation page or a marketing claim.
