# BL-098: Representative Documentation Remigration

## Status And Outcome

Implemented, machine-verified, and human-reviewed on 2026-09-12. The private trial
contains 16 source articles from Docusaurus, VitePress, Material for MkDocs, and
Astro Starlight: eight complete articles and eight selected-section adaptations,
plus a report homepage for each source system.

This is a bounded evaluation, not implementation of
[BL-052: Documentation Migration Assistant](BL-052-documentation-migration-assistant.md).
The earlier [BL-046: Migration Compatibility Inventory](BL-046-migration-compatibility-inventory.md)
is useful evidence, but neither that inventory nor navigation-only copies
demonstrate current content fidelity.

## Acceptance Criteria

- Reuse licensed, revision-pinned source snapshots. Keep original files and
  older evaluation sites intact. Keep adaptations and reports in the private
  local research repository, outside public examples and package output.
- Start with a small page migration before expanding to representative pages
  from all four systems. Identify full-page and selected-section migrations.
- Retain source prose, headings, code, and link destinations within the stated
  scope. Translate supported constructs to current Norna syntax. Expose every
  tab alternative when native tab behavior cannot be retained.
- Preserve image files and alternative text when available. Do not substitute
  invented illustrations for source assets.
- Record stripped presentation wrappers, metadata changes, missing source
  assets or includes, disabled interactivity, and other losses. Do not execute
  competitor components, configuration, plugins, or embedded scripts.
- Every migrated page offers an original-page link opening in a separate tab,
  a pinned-source link, and a migration report. Explain that the documentation
  still describes the source product, not Norna's own configuration.
- Validate the selected sites with Norna's configuration/content checks and
  builds. Check local links, loaded images, representative rendered constructs,
  responsive navigation, and no-JavaScript readability in a narrow browser pass.
- Provide stable local URLs and concise human-review instructions. Human
  comparison establishes visual suitability; successful builds alone do not.
- Feed concrete migration gaps back into existing feature/design items before
  inventing new syntax or a general importer.

## Boundaries

The source snapshots were captured on 6 September 2026. Live original pages
may have changed since then; pinned source links are the reproducible baseline.
Do not describe this trial as a complete migration of the source websites,
support for their configuration APIs, or a production-ready migration tool.

## Delivered Evaluation

- Each article links to its live original in a new tab, its pinned source,
  and the corresponding migration report. Original licences and attribution
  remain beside the adaptations.
- Current Norna callouts, footnotes, code titles and line emphasis, cards,
  details, tables, and managed images replace supported source constructs.
  Source configuration examples still describe their original products.
- Compatible tab groups now use BL-049: Content Alternatives, including
  VitePress package-manager commands, Material table alignment, Docusaurus image
  authoring, and Starlight's basic Tabs example. Source code examples still
  demonstrate their original product's syntax.
- Groups nested in other blocks remain labelled consecutive alternatives with
  a loss report. Norna does not synchronize or persist tab choices. All options
  remain visible without JavaScript and in print. Static cards keep their source
  destinations; file trees and step decorations become ordinary lists.
- Nested callouts retain inner text and hierarchy as labelled blockquotes.
  Custom callout titles become bold introductory text; source-specific icons,
  table sorting, and footnote tooltips are not reproduced.
- A pinned-source parser adapter translates Unicode code-point offsets before
  slicing JavaScript strings. Focused tests cover exact heading and link ranges
  after supplementary Unicode characters.
- Source and output hashes prevent unnoticed changes to the input baseline
  and accidental overwriting of manually edited generated evaluation files.

## Follow-up Decisions

Use this corpus to review [BL-049: Content Alternatives](BL-049-content-alternatives.md)
against the original pages. Native code and mixed-content groups demonstrate
the approved syntax; Starlight Steps demonstrates the deliberately retained
nested-group fallback. This does not reopen the choice against hidden headings
or synchronized reader preferences.

[BL-052: Documentation Migration Assistant](BL-052-documentation-migration-assistant.md)
must distinguish complete pages from explicit excerpts, preserve parent headings
and source anchors, expand only available pinned includes, and report semantic
losses rather than treating a successful build as proof of migration fidelity.
The trial's fixed recipes are not a general converter for arbitrary MDX.

## Verification

- All four sites passed Norna configuration/content validation and isolated
  production builds. The updated private research index also passed its build.
- The source-range tests passed for supplementary Unicode characters and the
  pinned Docusaurus heading annotation that exposed the offset mismatch.
- Playwright checked all 16 articles with JavaScript and all 16 without it.
  Checks cover comparison links, local anchors, original image loading,
  representative content constructs, retained heading annotations, and desktop
  document overflow, switching every native alternative, and no-JavaScript tab
  visibility. Mobile navigation and overflow were checked on one page
  per product, with desktop, mobile, and open-menu captures.
- `npm run test:documentation` passed. No full engine or release suite was run;
  this task adds private evaluation material, not production engine behavior.
- Five focused conversion tests cover code groups, indented alternatives,
  static component tabs, preserved source examples, and explicit fallbacks.
- Live comparison and visual suitability were approved in the human review;
  this does not assert that every upstream feature migrated without loss.
