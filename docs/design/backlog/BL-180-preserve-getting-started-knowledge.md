# BL-180: Preserve And Relocate Getting Started Knowledge

## Outcome

Readers can still find and understand the useful knowledge currently taught
by Getting Started when that introduction is rewritten around a VS Code
workflow. File structure, page relationships, commands and publishing details
have current, discoverable reference or explanatory destinations, while the
introduction retains the context needed to complete each step.

## Status And Priority

**Ready; first item in Now.** The owner requested this prioritized item on
2026-10-11 at 14:43 CEST. This brief records the agreed preservation work;
the inventory and relocation have not been performed.

Complete this item before replacing or substantially shortening the existing
Getting Started. Drafting the new outline and example project may proceed in
parallel. No source section or teaching asset may be removed as part of that
rewrite until its disposition is implemented and verified.

## Agreed Context

- The primary audience uses Markdown and VS Code for documentation or project
  sites. Scientific and technical examples can demonstrate useful capabilities
  without making doctoral researchers the primary audience.
- The introduction leads through a small coherent project: first a working
  local site, then publication on GitHub Pages.
- Assume basic Markdown and some VS Code familiarity. Explain installation,
  necessary terminal commands and publishing at the point of use.
- Keep an initial explanation of the file model and essential commands.
  Detailed file trees, command alternatives and technical rules belong in
  linked reference or explanatory material.
- Existing Examples already pair source code with rendered results. Reuse
  relevant material and link to it; tutorial excerpts serve the current step.
- Retain `sourceFormat` as a generated format marker, but keep it out of the
  introduction. Its explanation belongs in the
  [configuration reference](../../../site/root/pages/reference/pages/configuration/pages/site/content.md#source-format)
  and format-conversion guidance. The owner confirmed this on 2026-10-11;
  Getting Started and the README now omit it, with tutorial snippets explicitly
  showing additions or edits to existing settings.

## Scope And Boundaries

Inventory the complete current source tree under
[`site/root/pages/getting-started/`](../../../site/root/pages/getting-started/),
including Install Norna, Grow Your Site, Choose A Theme, Prepare Your Site,
Build And Publish, their images and diagrams, and links to and from affected
sections. Compare it with the relevant current Reference and Examples pages.

The baseline at brief creation is Git revision
`d00def01a3ff6b4363077aafc79ccce08634bb78`. At implementation start, record the
actual source revision and any relevant working-tree changes so later edits
cannot silently fall outside the inventory.

Preserve reader needs, correct facts and useful teaching relationships, not
every old sentence. Consolidate duplication and correct obsolete explanations.
Do not move the complete tutorial into reference unchanged or expand reference
into a compulsory beginner sequence. Use a focused explanation page when a
longer account of relationships has distinct reader value.

This item does not implement the new introduction, redesign all Reference or
Examples pages, add engine/editor capabilities, or settle public distribution.
Changes outside the affected teaching material require their own justification.

## Required Work

1. Create a version-controlled content map under `docs/design/`, outside the
   published prose. Record each source page and section, its reader question,
   associated examples and assets, and current coverage elsewhere.
2. Assign each content unit a disposition: retain briefly, relocate,
   consolidate with existing material, or remove with a reason. Record the
   exact destination page and anchor, required changes and verification status.
   A statement that material already exists elsewhere requires a coverage check.
3. Check behavioral claims against the current reference and, where necessary,
   implementation, schemas and tests. Resolve or explicitly report conflicts;
   do not preserve obsolete paths, commands or image/public-file rules.
4. Complete the destination material. Preserve explanations of relationships,
   not just isolated syntax. Reuse and update useful diagrams and captures;
   maintain their source/provenance notes and valid asset references.
5. Establish precise links from the existing introduction to the destinations.
   Record which short explanations and links the later rewrite must retain.
   Handle affected incoming links and anchors; record a concrete continuity
   plan for any address change deferred to the rewrite.
6. Review the map against the original source and the rendered destinations.
   Mark verified outcomes only after both coverage and discoverability have
   been checked. Keep this record as the handoff to the introduction rewrite.

## Starting Destination Map

These are starting points for comparison, not evidence of complete coverage.

| Current subject | Destination to inspect and extend where needed |
| --- | --- |
| Source tree, file responsibilities and generated output | [Site files](../../../site/root/pages/reference/pages/site/pages/files/content.md) |
| Sections, pages, children and ordering | [Pages and child-page lists](../../../site/root/pages/reference/pages/site/pages/pages/content.md) |
| Relationship between file structure and rendered navigation | [Navigation](../../../site/root/pages/reference/pages/configuration/pages/navigation/content.md), with focused explanation or Examples where useful |
| Page-owned images and attachments | [Images](../../../site/root/pages/reference/pages/site/pages/images/content.md) and [Attachments](../../../site/root/pages/reference/pages/site/pages/attachments/content.md) |
| Terminal invocation and alternative command forms | [Command invocation](../../../site/root/pages/reference/pages/commands/pages/invocation/content.md) and the relevant individual command pages |
| Presets, overrides and inheritance | [Theme](../../../site/root/pages/reference/pages/configuration/pages/theme/content.md) |
| Checks, static output and GitHub Pages | [Publishing workflow](../../../site/root/pages/reference/pages/workflows/pages/publishing/content.md) and command reference |
| Copyable demonstrations and rendered results | [Examples](../../../site/root/pages/examples/content.md) |

## Dependencies And Prior Work

- Follow the [Documentation Style Guide](../documentation-style-guide.md).
- [BL-041: Beginner-First Getting Started Audit](BL-041-getting-started-audit.md)
  is completed. Its [content audit](../getting-started-content-audit.md) is
  historical input, not current coverage evidence; recheck its old paths and
  editorial choices against the current sources and agreed VS Code workflow.
- This work has no dependency on Marketplace publication or new engine
  features. It is a prerequisite for the content replacement in the planned
  Getting Started rewrite, not for discussing that rewrite's outline.

## Acceptance Criteria

- Every inventoried source section, example and teaching asset has a traceable
  outcome. Removed or consolidated material has an explicit reason.
- Useful knowledge and pedagogical relationships remain available in current
  documentation; Git history alone does not count as an accessible destination.
- Each destination is verified to cover the corresponding reader need with
  correct behavior, sufficient explanation and usable examples where needed.
- The map identifies the essential context to retain in Getting Started so a
  newcomer can follow the future workflow without constant reference detours.
- Relevant diagrams and screenshots are accurate, legible and linked to their
  maintained sources. Required assets are not orphaned by relocation.
- Updated links and anchors resolve. Any address change left to the later
  rewrite has a recorded continuity action and remains intact until then.
- Documentation checks pass, and affected rendered pages are reviewed at
  narrow and wide viewports. Record actual checks and owner review separately.
- The completed content map and destination changes are available before the
  old introduction is replaced; the handoff contains no unresolved loss of
  useful content.

## Verification

For implementation, run `npm run test:documentation` and the build/checks
appropriate to changed rendered content under
[Engine Development](../../engine-development.md). Use separate build state
when an active preview would otherwise share its cache. Inspect affected
rendered destinations and obtain applicable presentation approval under
`AGENTS.md`. Do not run a full release or editor suite for this editorial work.

Creating this brief does not establish that any inventory, relocation,
rendered review or implementation acceptance criterion has passed.
