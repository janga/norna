# Backlog

This file is the ordered index of unfinished Norna work. It is not product
documentation, a release promise, or a completion log. Work from top to bottom
within `Now` and `Next`; dependencies take precedence over perceived feature
value.

Status definitions, ID rules, and the process for adding or completing items
are in the [backlog process](docs/design/backlog/README.md).

## Now

`Now` contains at most three implementation-ready items in exact technical
order.

- [`BL-003` Social sharing metadata](docs/design/backlog/BL-003-social-metadata.md):
  **Ready.** Reuse canonical page identity and existing metadata
  before adding further generated-page behavior.

## Next

`Next` is the intended implementation sequence after `Now`. The order first
completes deterministic site output, then builds reading features on the stable
page graph, and only afterward expands Markdown or URL behavior.

- [`BL-004` Default 404 page](docs/design/backlog/BL-004-default-404.md): **Ready.**
  Add the smallest engine-owned generated page and verify
  root, base-path, localization, and GitHub Pages behavior.
- [`BL-005` Static search](docs/design/backlog/BL-005-static-search.md): **Ready.**
  Index final HTML only after page inclusion,
  URLs, and anchors have one shared contract.
- [`BL-006` Previous and next page navigation](docs/design/backlog/BL-006-sequential-navigation.md):
  **Ready.** Define ordered traversal over the stable listed page
  graph before exposing that graph inside content.
- [`BL-007` Explicit child page list](docs/design/backlog/BL-007-child-page-list.md):
  **Ready after `BL-006`.** Reuse its traversal rules in one explicit Markdown
  block rather than creating a parallel hierarchy.
- [`BL-008` Long navigation tree controls](docs/design/backlog/BL-008-long-tree-controls.md):
  **Ready after `BL-006`.** Add progressive controls only after active-page,
  expansion, and traversal behavior are stable.
- [`BL-009` Semantic callouts](docs/design/backlog/BL-009-semantic-callouts.md):
  **Ready after `BL-005`.** Extend Markdown semantics after search and page
  output rules can consume the new structure consistently.
- [`BL-010` Static redirect aliases](docs/design/backlog/BL-010-redirect-aliases.md):
  **Ready.** Add old URL identities only after
  collision, canonical URL, sitemap, and generated-output rules are stable.
- [`BL-028` Automatic page move and reconciliation](docs/design/backlog/BL-028-page-move.md):
  **Ready after `BL-010`.** Use the shared reverse link index to move a page or
  reconcile an already moved page without guessing.
- [`BL-011` Edit source links](docs/design/backlog/BL-011-edit-source-links.md):
  **Ready.** Add repository-derived links after page source
  identity is stable; keep Git-derived dates outside this item.

## Later

These accepted maintenance and workflow outcomes follow the ordered product
work above unless a concrete defect raises their urgency.

- `BL-012` **Needs a scoped reproducer.** Improve generated-image diagnostics
  and cache reuse reporting, then decide whether a repair or reset command is
  still necessary.
- `BL-013` **Needs design.** Provide a lighter workflow for testing a local
  Norna engine in a site repository without publishing to npm or using
  unsupported `npm link` behavior.
- `BL-014` **Needs task design.** Improve onboarding for people creating a
  standalone website rather than adding a site to an existing project.
- `BL-015` **Needs a scoped reproducer.** Clarify dev-server recovery when
  content, images, generated state, or watchers become stale.
- [`BL-027` Editor link diagnostics](docs/design/backlog/BL-027-editor-link-diagnostics.md):
  **Needs design.** Improve the experimental VS Code integration's cache and
  test boundary before connecting it to the shared site link graph.

## Documentation Follow-ups

These items document behavior that already exists. Complete them independently
of the product sequence when the corresponding implementation has been
verified and approved for documentation.

- `BL-016` Document progressive copy controls for fenced code blocks in the
  Markdown reference and documentation site, including keyboard and
  screen-reader feedback without implying that ordinary content needs
  JavaScript.
- `BL-017` Document the supported pattern for embedding an image-led Norna site
  in a larger GitHub Pages project that also publishes an application or
  project homepage.
- `BL-029` Document internal page, heading-anchor, public-file, category, and
  card-link validation in the content and command references, the documentation
  site, and focused examples. Keep editor behavior explicitly out of scope
  until `BL-027` is implemented.
- `BL-030` Document automatic sitemap generation in the publishing and public
  file references and the documentation site. Replace obsolete instructions to
  create `site/public/sitemap.xml`; explain URL/base-path handling, page
  inclusion, category exclusion, and source-file conflicts.

## Needs Decision Or Evidence

These items have no implementation position yet. Move one into `Now`, `Next`,
or `Later` only after the stated evidence or design decision exists.

- `BL-018` **Needs evidence.** Extend cross-page sync to whole-section metadata
  or additional assets only when a real section-bound resource exists; retain
  unambiguous discovery and never guess.
- `BL-019` **Needs evidence and syntax design.** Consider `norna-image-grid`
  after real sites demonstrate that stack and carousel are insufficient; keep
  any first model to ordered images, a column count, and an incomplete final
  row.
- `BL-020` **Needs evidence.** Improve `init --type embedded` only when real
  mixed projects reveal a missing setup step.
- `BL-021` **Needs evidence.** Add a protected command for refreshing generated
  `theme.yaml` help comments only if exported reference files prove
  insufficient.
- `BL-022` **Needs evidence.** Add preset families or richer theme helpers only
  when several real sites require the same visual outcome.

## Explicitly Deferred

Do not schedule these as opportunistic additions. Each requires a separate
product brief, representative sites, migration rules, and an explicit decision
that the expanded audience is worth the permanent complexity.

- `BL-023` **Deferred.** Multilingual page trees, translation identity,
  locale-aware URLs, language switching, fallbacks, `hreflang`, sitemap
  entries, and search partitions.
- `BL-024` **Deferred.** Collections, taxonomies, pagination, and feeds, which
  together require recurring-content identity and a generated-page model.
- `BL-025` **Deferred.** Versioned documentation with coordinated page trees,
  URL and search partitions, selectors, canonical metadata, and asset policy.
- `BL-026` **Deferred.** A general template, component, or plugin API; prefer
  narrow engine-owned constructs and a general-purpose generator when a
  project requires implementation freedom.
