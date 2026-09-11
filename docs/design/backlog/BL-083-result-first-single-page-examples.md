# BL-083: Result-First Single-Page Examples

## Status

Corrections implemented and technically verified on 2026-09-11; awaiting human
review of the revised gallery. The ordered sequence below resolved table
readability, source-to-result, and navigation-example problems, then audited
all 20 sections against current behavior. The final Pages build passed.

Review instructions and per-section evidence are in
[Examples content audit](../examples-content-audit.md). Do not schedule the
completed corrections again or mark the gallery visually approved until the
user has reviewed it.

## Correction Sequence

Follow this order, with general presentation and navigation changes before
the examples that demonstrate them:

1. [BL-084: Readable table columns without broken words](BL-084-readable-table-columns.md).
2. [BL-085: Adaptive width for long code examples](BL-085-adaptive-code-width.md).
3. [BL-086: One consistent navigation contract in documentation](BL-086-consistent-navigation-reference.md).
4. [BL-087: Direct section access from top navigation](BL-087-top-navigation-section-access.md).
5. [BL-088: Child-page lists that help readers choose](BL-088-useful-child-page-list-example.md).
6. [BL-089: Navigation illustrations generated from runnable examples](BL-089-runnable-navigation-illustrations.md).
7. [BL-090: Readable examples with exact source and clear syntax boundaries](BL-090-exact-readable-examples.md).
8. [BL-091: Final examples audit against implemented behavior](BL-091-final-examples-implementation-audit.md).

The final audit must run after all seven preceding items. Its corrections,
verification, and applicable human review are required before closing this
parent item. Keep completed work committed in separate logical changes.

## Problem

The public Examples entry page explains how the example area is organized
before it demonstrates what Norna produces. Focused demonstrations are split
across several child pages whose introductory and configuration-boundary text
interrupts comparison. A reader must infer which page contains a desired
result before seeing the rendered result or its source.

## Outcome

Make `/examples/` one maintained, result-first gallery of focused Norna
examples. Each section answers one concrete authoring or site-building need by
showing the rendered result before the smallest exact source that produces it.
Complete example sites remain independently built sites and appear together in
one final section.

The page is an introduction and practical gallery, not an exhaustive feature
list or normative reference. Every example links to the exact canonical
reference section for complete syntax, defaults, constraints, and fallback
behavior.

## Example Contract

Use this compact sequence for each example:

1. a task-oriented heading or the established name of the demonstrated
   concept;
2. the actual rendered result, or a faithful screenshot when a site-wide state
   cannot coexist with the documentation site's current state;
3. the smallest complete Markdown, YAML, file-tree, or command source that
   produces that result;
4. a short source classification such as **Standard Markdown**, **Norna
   Markdown extension**, **Site configuration**, or **Norna command**;
5. at most one short use boundary when readers must choose between related
   constructs; and
6. a descriptive link to the exact canonical reference section.

Do not insert sections that explain how to choose, compare, or read the
examples. Do not repeat complete option tables or configuration boundaries
from reference documentation. Keep result and source adjacent, and use real
content rather than placeholder prose.

## Content Order

Present the examples in this order:

1. **Write with standard Markdown**: headings, prose, emphasis, links, lists,
   and quotations.
2. **Add a single image**: one managed image showing all supported image-entry
   fields: `image`, `alt`, and `caption`.
3. **Image stacks**: several images kept visible in reading order.
4. **Image carousels**: a sequence sharing one visual position.
5. **Card lists**: a short set of comparable choices or resources.
6. **Semantic callouts**: the closed semantic meanings supported by Norna.
7. **Sidenotes**: margin placement and reading-flow fallback, with ordinary
   reference footnotes identified as the end-of-page alternative.
8. **Code blocks**: language, title, line emphasis, sticky context, and copy
   enhancement.
9. **Get readable tables from standard Markdown**: a sufficiently long and
   wide table to expose progressive width, sticky headings, and overflow
   navigation without requiring layout syntax.
10. **List child pages automatically**: the source and result of `page-list`.
11. **Automatic responsive navigation**: one-page, top-level, and nested page
    structures mapped to their wide- and narrow-screen navigation.
12. **Move pages without breaking links**: dry run, write step, internal-link
    updates, and retained old URLs.
13. **Add static search**: the generated search entry point, representative
    result, and one site-wide setting.
14. **Set the site language**: the site language and generated interface text,
    with the current human-review boundary stated prominently.
15. **Brand your site**: convention-based logo, browser icon, and social image
    files.
16. **Add site-wide notices and a footer**: shared editorial content in
    `sitewide-content.yaml`.
17. **Get coherent defaults from a preset**: purpose-specific defaults for the
    Documentation, Portfolio, Project, and Statement scenarios, followed by
    one small override.
18. **Choose a coordinated color palette**: palette, Light and Dark variants,
    and the distinction between palette and Appearance.
19. **Let readers adapt the display**: Reading width, Appearance including Dark,
    and Focus reading in the live Display panel.
20. **Complete sites**: the single-page dog shelter, multi-page dog shelter,
    and this hierarchical documentation site.

## Managed Images And Author Responsibility

Explain the managed-image boundary beside the first image rather than in a
separate conceptual preface:

- local editorial images use Norna image blocks instead of ordinary Markdown
  image syntax;
- Norna validates the filename, creates responsive output, keeps the source
  beside its page, and moves that page-owned image when `page:move` moves the
  page directory;
- ordinary Markdown images remain suitable for external URLs and static files
  under `site/public/`;
- an AI tool may draft alternative text, but the author must decide whether it
  conveys the image's purpose in the actual page context and must review it
  before publishing.

State the wider accessibility boundary once, concisely: Norna owns semantic
HTML, responsive layout, keyboard behavior, focus handling, and accessible
control labels; the author owns meaningful headings, links, captions,
language, and alternative text. Do not claim that Norna can make inaccessible
editorial content accessible automatically.

## Page And URL Structure

- Remove the focused Examples child pages after their useful demonstrations
  have been incorporated and compressed.
- Do not preserve the removed focused-page URLs as aliases. Update maintained
  internal links to `/examples/` section anchors; an obsolete direct URL may
  return the normal 404 page.
- Update internal documentation links to the new section anchors.
- Keep complete sites under `examples/` as independent builds. Link to both
  their rendered output and maintained source from the final section.
- Move retained managed image assets into the `/examples/` page image
  directory and remove assets that no longer contribute to a demonstration.

## Acceptance Criteria

- Opening `/examples/` reveals a rendered example without first requiring the
  reader to choose an example type or read instructions about the page.
- Every focused example is available on the same page and has a descriptive H2
  destination.
- Rendered output appears before exact source in each section.
- Source classification is short, consistent, and does not depend on color or
  position alone.
- Every section links to a relevant canonical reference anchor.
- The single-image example shows `image`, `alt`, and `caption`, explains the
  managed-image boundary, and states the author's alternative-text
  responsibility.
- The table is wide and long enough to exercise sticky headings and horizontal
  overflow controls at representative widths.
- Search, language, palettes, Appearance, Reading width, Dark appearance, and
  Focus reading are demonstrated without implying unsupported multilingual
  content or verified translations.
- Presets are introduced as coordinated defaults for typical site scenarios;
  overrides remain a secondary example.
- The page remains usable with keyboard navigation, browser zoom, a narrow
  viewport, and JavaScript disabled. Complete sites remain discoverable under
  their own final heading.
- Content validation, the documentation build, internal links, and the public
  Pages artifact pass. Human review covers desktop, compact, mobile, Light,
  Dark, and Focus reading before the item is removed from the active backlog.

## Reference Model

This page adapts the GOV.UK Design System's component-documentation pattern:
identify the thing, show a visual example, provide usable code, explain only
the relevant use boundary, and remove text without a clear reader purpose.
Diataxis supplies the separation between goal-oriented examples and complete
reference. Google's heading guidance supplies task verbs for actions and noun
phrases for established concepts.

- [How GOV.UK documents components and patterns](https://designnotes.blog.gov.uk/2018/11/05/how-we-document-components-and-patterns-in-the-gov-uk-design-system/)
- [GOV.UK Design System component example](https://design-system.service.gov.uk/components/accordion/)
- [Diataxis: How-to guides](https://www.diataxis.fr/how-to-guides/)
- [Google: Headings and titles](https://developers.google.com/style/headings)
- [W3C WAI: Images tutorial](https://www.w3.org/WAI/tutorials/images/)
