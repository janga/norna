# BL-112: Category Destinations

## Status

Complete. Implemented, visually approved, and documented on 2026-09-15.
The canonical contract is now
[Opening A Category URL](../../pages.md#opening-a-category-url).

## Problem

A category groups pages without editorial content. Its URL prefix previously
had no destination, so visiting `/getting-started/` failed even though its
children were published. Automatically descending through categories could
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

Replaced the obsolete non-routable-category rules in `docs/pages.md` and
reconciled configuration, internal links, page moves and aliases, sitemap,
search, JavaScript, theme inheritance, CLI reference, and schema help.
Getting Started demonstrates its own category URL and links to the reference.
Removed the superseded documentation draft to keep one canonical definition.

## Review And Test Record

- Documentation preview: `http://127.0.0.1:4321/norna/getting-started/`
  opens Install Norna instead of a 404.
- Generated listing: `http://127.0.0.1:4399/category-review/guides/`.
  Check the category label, direct-child list, descriptions, and surrounding
  navigation on desktop and mobile. Choosing Installation opens Requirements;
  visiting Guides itself must not jump there.
- Maintained source: `fixtures/category-destinations/site`; prepare the
  registered scratch target using the fixture README when the scratch site
  has been replaced by another test.
- Passed: root build, site-link graph, page aliases, sitemap, site-node
  commands, nested-page/static top-navigation contract, page moves,
  static-public sync, dead-code, schema-help, and documentation checks.
- Four focused browser cases passed: both category destinations and tree
  disclosure with JavaScript enabled and disabled, using a deployment prefix.
- Desktop/light and mobile/dark listing screenshots inspected. The user
  approved the result after LAN review. The complete release suite was not run.

## Reference

[Docusaurus category links](https://docusaurus.io/docs/sidebar/items#category-links)
provide a comparable generated direct-child index. The first-child resolution
rule above is a Norna product decision, not a Docusaurus convention.
