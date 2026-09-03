# Backlog

This file is the ordered index of unfinished Norna work. It is not product
documentation, a release promise, or a completion log. Work from top to bottom
within `Now` and `Next`; dependencies take precedence over perceived feature
value.

Status definitions, ID rules, and the process for adding or completing items
are in the [backlog process](docs/design/backlog/README.md).

## Now

`Now` contains at most three active items in exact technical order.

- [`BL-035` Navigation surfaces and managed-image alignment](docs/design/backlog/BL-035-navigation-surfaces-and-image-alignment.md):
  **In progress; human visual review and documentation pending.** Apply one
  coherent content canvas across top and tree navigation, keep desktop
  navigation visually quiet, and verify prose-aligned and centered-fit geometry
  without adding author-controlled positioning options.
- [`BL-030` Production-ready IntelliSense](docs/design/backlog/BL-030-production-ready-intellisense.md):
  **In progress.** The version-aligned package and real VS Code tests are ready;
  complete the first Marketplace publication before describing IntelliSense as
  a supported installable feature.
- [`BL-028` Automatic page move and reconciliation](docs/design/backlog/BL-028-page-move.md):
  **Ready.** Use the shared reverse link index and redirect alias model to move
  a page or reconcile an already moved page without guessing.

## Next

`Next` is the intended implementation sequence after `Now`. The order first
completes deterministic site output, then builds reading features on the stable
page graph, and only afterward expands Markdown or URL behavior.
- [`BL-036` Contextual page and contents rails](docs/design/backlog/BL-036-contextual-navigation-rails.md):
  **Ready after `BL-035` Navigation surfaces and managed-image alignment.**
  Keep global navigation stable while separating the active branch's page tree
  on the left from the current page's H2/H3 outline on the right.
- [`BL-032` Improved examples for Add nested pages](docs/design/backlog/BL-032-documentation-improve-add-nested-pages.md):
  **Ready after `BL-036` Contextual navigation rails.**
  Ground the file-tree example in the documentation hierarchy without forcing
  explanatory media into artwork geometry.
- [`BL-034` Automatic contents-rail section tracking](docs/design/backlog/BL-034-automatic-tree-section-tracking.md):
  **Ready after `BL-036` Contextual page and contents rails.** Track the
  reader's current H2 or H3 automatically in the right contents rail and remove
  the low-value public on/off setting.
- [`BL-003` Social sharing metadata](docs/design/backlog/BL-003-social-metadata.md):
  **Ready.** Reuse canonical page identity and existing metadata
  before adding further generated-page behavior.
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
- [`BL-008` Long navigation tree controls and filtering](docs/design/backlog/BL-008-long-tree-controls.md):
  **Ready after `BL-006` and `BL-036`.** Add progressive controls and a
  title filter only after tree scope, active-page, expansion, and traversal
  behavior are stable.
- [`BL-009` Semantic callouts](docs/design/backlog/BL-009-semantic-callouts.md):
  **Ready after `BL-005`.** Extend Markdown semantics after search and page
  output rules can consume the new structure consistently.
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
- [`BL-031` System appearance as the universal default](docs/design/backlog/BL-031-system-appearance-default.md):
  **Ready.** Make themes and built-in presets follow the visitor's system
  preference unless the site explicitly selects Light or Dark.
- [`BL-027` Editor link diagnostics](docs/design/backlog/BL-027-editor-link-diagnostics.md):
  **Ready after `BL-030` Production-ready IntelliSense.** Connect the editor to
  the shared site link graph only after its distribution, versioning, cache,
  and test boundaries are stable.

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
