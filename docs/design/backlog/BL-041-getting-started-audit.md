# BL-041: Beginner-First Getting Started Audit

## Outcome

Getting Started gives a newcomer the shortest coherent path to understanding
what Norna does, creating a site, changing it, seeing the result, and knowing
where to continue. It introduces only the concepts needed for that first
success and links to canonical reference material for complete behavior.

## Dependency

Complete [`BL-038` Selling Homepage And Product Positioning](BL-038-selling-homepage.md)
first. The homepage should establish the product promise and audience before
Getting Started decides what it must explain rather than repeat.

## Required Inventory

Before editing, build a content map of every current source that teaches,
introduces, or demonstrates Norna. Include:

- the complete documentation-site Getting Started subtree and relevant
  introductory material on the homepage, FAQ, Resources, and Examples pages;
- the root `README.md`, `docs/README.md`, every canonical Markdown reference,
  and any Markdown tutorial or onboarding text elsewhere in the repository;
- all starter READMEs, starter site files, generated starter instructions, and
  the commands a new project actually exposes;
- every complete example site, feature demo, example README, and documentation
  page written in Norna format;
- local or intentionally excluded Norna-format teaching and analysis sites
  present in the working tree, recording when useful source material is not
  available from a fresh clone;
- current schemas, command help, tests, and implementation where they are
  needed to resolve a conflict between instructional sources.

For each relevant subject, record where it currently appears, which location
is authoritative, and whether Getting Started should explain it, demonstrate
it briefly, link to it, or omit it. Treat old wording as evidence of a reader
need, not automatically as text that must be preserved.

## Review Questions

- Can a newcomer tell what Norna is, whether the prerequisites are available,
  and which installation path to use?
- Can the reader create a site, start a local preview, make one meaningful text
  or image change, validate it, and build it without searching another page?
- Is the relationship between Markdown headings, pages, image directories,
  navigation, presets, and generated output introduced in a useful order?
- Are Norna-specific terms defined before use, with implementation detail
  deferred until it solves the reader's current problem?
- Are project-local commands, Git expectations, publishing boundaries,
  recovery paths, and optional editor help introduced at the point where a
  beginner first needs them?
- Does each illustration teach a relationship that prose or a small copyable
  example cannot communicate as clearly?
- Does the final step point to a purposeful next destination rather than a
  generic collection of links?

The audit may conclude that a subject does not belong in a short introduction.
Record that decision and provide a precise reference link instead of expanding
Getting Started by default.

## Acceptance Criteria

- The source inventory covers all tracked introductory, example, starter, and
  reference Markdown, plus relevant excluded Norna-format material available
  in the working tree.
- A keep, move, consolidate, link, or remove decision exists for every
  duplicated or conflicting introductory subject found by the inventory.
- One tested happy path takes a new user from prerequisites to a locally
  previewed change and a successful build using current generated commands and
  file names.
- The path explains enough of Norna's file and heading model for the reader to
  predict where ordinary content, images, pages, theme choices, and site-wide
  content belong.
- Complete syntax, defaults, exceptions, and failure recovery remain in
  canonical reference pages and are linked at the point of need.
- No example presents unsupported syntax, stale paths, obsolete commands, or a
  product capability that differs from current implementation.
- Repetition with the homepage, Examples, starter READMEs, and reference pages
  is limited to the context needed to continue the task.
- Documentation link tests and the relevant starter/package checks pass.
- A newcomer who has not worked on Norna reviews the rendered desktop and
  mobile flow, or the review explicitly records that this human test remains.

If the audit reveals a missing product capability rather than a documentation
gap, create a separate backlog item. Do not invent behavior in Getting Started.
