# BL-052: Docusaurus Migration Audit And Norna Comparison Report

## Status And Boundary

**Implemented: initial read-only audit.** This is the first, deliberately
smaller phase of a future migration assistant. Do not implement write mode,
other source adapters, or a new Norna content syntax as part of this item.

The first adapter targets Docusaurus. This is a practical first choice because
Norna already has Docusaurus material in its private migration corpus and
Docusaurus exposes an explicit documentation-version model. It is not a claim
that one download metric proves the largest installed base.

## Outcome

A maintainer can point the diagnostic tool at a complete Docusaurus project and
receive a separate Norna report site that focuses on recurring problem types
and representative affected pages. Each problem type has a stable ID, a
description, a total occurrence count, and at most 20 deterministic sample
links. The machine-readable report retains every occurrence.

The source project remains unchanged. Norna must inspect the source material,
not build or reproduce the competitor's website.

## Product Contract

The first command is proposed as:

```sh
norna migrate:check --source docusaurus <project-root> --report-dir <empty-directory>
```

The input is the Docusaurus project root, not only a selected Markdown file.
The report destination is explicit and separate from the source project.

The audit must:

- read pages, frontmatter, navigation configuration, local assets, and relevant
  source metadata from the complete project;
- never modify the source project;
- never install source dependencies or execute JavaScript, TypeScript, MDX,
  React components, plugins, templates, or build configuration;
- ignore dependencies, caches, and build output;
- use parser-backed inspection where appropriate rather than regular expressions
  for nested syntax;
- emit only accepted Norna syntax or an explicit readable Markdown fallback.

## Classification Contract

Each content construct or source region receives one of these classifications:

| Code | Meaning |
| --- | --- |
| `copy` | Ordinary Markdown or GFM that Norna can use without syntactic conversion. |
| `rewrite` | A deterministic conversion to accepted Norna syntax with meaning and information preserved. |
| `assist` | A useful conversion or fallback can be proposed, but a human or AI must review it. |
| `model-gap` | The source represents a data model that Norna does not have, such as collections or taxonomies. |
| `feature-gap` | The concept fits Norna's model, but Norna has no corresponding capability. |
| `unresolved` | The tool cannot determine the meaning or conversion safely. |
| `out-of-scope` | Build configuration, plugins, CSS, templates, or application code rather than page content. |

`copy` and `rewrite` must mean full preservation of semantic information, not
identical visual presentation. A page summary is derived from its findings;
one page may contain several classifications.

## Report Site

The report directory is a normal Norna site generated from the audit result.
It contains:

- an overview with counts by classification;
- source-system and analysis provenance;
- one detail page for each aggregated problem type;
- the exact Git source link for each sampled occurrence in the copied revision;
- the source construct and location;
- the proposed Norna result or fallback;
- information, meaning, presentation, or interaction that may be lost;
- a concrete human/AI follow-up action.

Pages classified as fully `copy` are not expanded into individual report pages.
They may appear only in the aggregate counts. A report page may show a small,
license-compliant source excerpt, but it must not reproduce the competitor's
website or build its source project locally.

## Problem Type Aggregation

The report groups findings by classification, diagnostic code, description, and
recommended action. The problem fingerprint is a SHA-256 digest of that
canonical grouping key, and the displayed problem ID uses its first 12
hexadecimal characters. A problem page samples at most 20 occurrences using a
deterministic hash ranking, so repeated runs show the same representatives for
the same source revision and adapter version. The JSON report retains the full
occurrence list for machine processing.

## Version Provenance

The report must distinguish source material, source revision, published
documentation version, and analysis time. Its data model must support fields
equivalent to:

```yaml
source:
  system: docusaurus
  repository: https://github.com/example/project
  revision: a3e5eba...
  tag: v3.10.2
  documentationVersion: "3.10"
  publicUrl: https://example.com/docs/3.10/guide/
  sourceCapturedAt: 2026-09-12

analysis:
  nornaVersion: 0.7.25
  adapterVersion: 1
  analyzedAt: 2026-09-12T20:15:00Z
```

The Git revision is mandatory when the source was copied from Git. A
`documentationVersion` and public URL may be recorded only when their mapping
to that revision has been verified. The tool must never construct a versioned
public URL by guessing. If no matching published page is known, link to the
exact Git revision and mark the public rendering as unavailable or unverified.

## Existing Evidence And Dependencies

- `BL-046` defines content-preserving migration as the target.
- `BL-098` provides the existing Docusaurus article corpus, pinned source
  revisions, reports, licenses, comparison conventions, and a reproducible
  script-based migration baseline.
- Norna's existing page model, content checks, link checks, and static build
  must validate any generated Norna report or later conversion result.
- Full Norna documentation versioning in `BL-025` is not a dependency. This
  item records provenance for one analysis; it does not add versioned Norna
  documentation.

## Existing Trial Creation And Provenance

The current files under `marketing/source-material/migration-trials/` are not
AI-translated pages. They are generated by
`source-material/migration-trials/migrate.mjs`, which reads pinned source
snapshots, parses Markdown, applies deterministic conversion rules, and writes
Norna pages and `migration-report.json`. The resulting prose remains in the
source system's language; the migration changes structure and supported syntax.

The migration scope is manually curated in `recipes.mjs`: page selection,
section selection, source revisions, and explanatory loss notes are human
decisions encoded as data. The conversion itself does not call an AI service or
model API. The migration and browser tests verify parser ranges, generated
constructs, links, images, and no-JavaScript readability, but they do not prove
whether someone used AI outside the repository while preparing the recipes.

The older sites under
`marketing/source-material/navigation-evaluations/` were committed as static
adaptations before the current migration generator existed. Their repository
history does not establish whether their prose was written manually or with
external AI assistance. They are therefore evidence of earlier visual and
navigation evaluation, not a reproducible migration pipeline.

BL-052 may reuse the current trials as fixtures, examples, and evidence for
conversion rules. Its engine implementation must not import the private
`marketing/` scripts, snapshots, or generated sites at runtime. Any shared
parser or diagnostic logic must be extracted into engine-owned code with its
own tests and a stable public boundary.

## Later Write Mode

Write mode is explicitly outside the first implementation, but its eventual
contract must require:

- an explicitly selected empty destination;
- source-hash verification before writing;
- no in-place changes to the competitor project;
- collision, symlink, sensitive-file, partial-output, and rollback rules;
- accepted Norna syntax or visible fallback for every retained construct;
- a machine-readable unresolved report when manual work remains.

## Decision Material Follow-up

`BL-104: Evidence-based migration solution register` consumes this audit's
problem fingerprints and counts. It is deliberately separate from the audit
engine: the audit reports what it found, while BL-104 explains concrete
solutions with source evidence, Norna output, fallback behavior, loss, and a
product decision. The decision register must not turn the audit into a claim
of complete automatic migration.

## Acceptance Criteria For The Implementation

- The command, report directory behavior, and report JSON schema are specified
  by the implementation and covered by focused tests.
- The complete Docusaurus project root can be analyzed without installing or
  executing its dependencies.
- Every relevant finding has a stable classification, source file, line or
  region, explanation, and recommended action.
- Repeated findings are grouped under stable problem IDs with occurrence counts
  and deterministic samples of no more than 20 links.
- The report contains the Norna version, analysis time, source capture date,
  source revision, and verified documentation-version mapping where available.
- The report site contains only problem-type pages and builds as a normal
  Norna site.
- No competitor site is built, mirrored, or executed.
- The same source and adapter version produce the same ordered report apart
  from deliberately excluded run-time metadata.
- The report generation is deterministic and does not require AI services,
  private marketing files, or competitor dependencies at runtime.
- The existing `BL-098` corpus can serve as an integration test without
  becoming a runtime dependency of ordinary Norna builds.
- Any future write-mode proposal is reviewed separately from this read-only
  audit.
