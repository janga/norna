# BL-112: Category Destinations

## Status

Ready. Behavior agreed on 2026-09-15. Not implemented. The
[user documentation draft](../category-destinations-draft.md) records the
intended behavior, not the current release.

## Problem

A category groups pages without editorial content. Its URL prefix currently
has no destination, so visiting `/getting-started/` fails even though its
children are published. Automatically descending through categories could
instead send the visitor deep into the tree without letting them choose.

## Decision

Evaluate listed direct children using the existing navigation order:

- If the first child is a page, redirect the category URL to that page.
- If the first child is a category, render a generated navigation page with
  the category label as H1 and links to all listed direct children in order.
- Do not descend automatically, skip a first category to find a later page,
  or flatten the complete subtree onto the generated page.
- Show existing descriptions when available; do not invent introductory copy
  or require descriptions solely for this listing.
- A child-category link targets its category URL and applies the same rule.
- A category with no listed reachable content page is a build error, not a
  warning. Report its source path and suggest adding a listed page or removing
  the category. Authoring a temporarily empty category remains possible.

A first child that is a category is valid and produces no build warning.
Keep existing ancestor-based navigation exclusions; this feature must not
expose pages excluded from navigation or require making private pages listed.
Cover excluded subtrees explicitly in validation tests.

Category destinations are derived navigation, not permanent redirect aliases:
reordering the children may change the destination or replace it with a list.
Reuse static redirect infrastructure where appropriate, but do not claim a
server-side temporary HTTP redirect on GitHub Pages. The redirect must have a
working ordinary destination link without JavaScript.

## Navigation And Integration

- Global category links target the category URL, rather than independently
  selecting a deep descendant. Existing tree and compact-menu disclosure
  controls continue to expand without navigating.
- Generated pages use the existing site frame, category context, reader
  controls, and responsive navigation. Do not add source Markdown, synthetic
  children, or a new configuration field.
- Internal-link checks accept category URLs and reject nonexistent fragments.
- Resolve destinations from one shared page-tree model in preview and builds.
- Account for category routes in alias collision checks, `page:move`, sitemap,
  and search. Redirect stubs must not become duplicate searchable documents;
  generated lists must not duplicate indexed descendant body text.

## Acceptance And Verification

- `/getting-started/` reaches its first listed direct page, Install Norna.
- A first child category produces a direct-child list, even if a later sibling
  is an ordinary page. No automatic recursive redirect occurs.
- Reordering or excluding entries recalculates the destination consistently.
- Empty categories and categories containing only excluded content fail the
  build with an actionable source-path diagnostic; valid nested categories do
  not warn. Existing excluded-subtree semantics remain intact.
- Links work with a deployment base path, encoded path segments, and without
  JavaScript. Alias collisions cannot overwrite a category destination.
- Focused unit/build tests cover resolution, validation, links and route output.
  Browser tests cover both destination types and unchanged disclosure behavior.
- Human review checks the generated listing on desktop and mobile before its
  user documentation is promoted from draft to reference.

## Documentation Completion

Replace the obsolete non-routable-category rules in `docs/pages.md`, then
reconcile configuration, internal-link, alias, move, sitemap, search, and
JavaScript references with the implementation. Add one concise HTML example
only where it demonstrates the new destination behavior. Avoid duplicating
the complete contract across reference pages.

## Reference

[Docusaurus category links](https://docusaurus.io/docs/sidebar/items#category-links)
provide a comparable generated direct-child index. The first-child resolution
rule above is a Norna product decision, not a Docusaurus convention.
