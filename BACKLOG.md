# Backlog

This file is the ordered index of unfinished Norna work. It is not product
documentation, a release promise, or a completion log. Work from top to bottom
within `Now` and `Next`; dependencies take precedence over perceived feature
value. Items under `External Gate` do not block autonomous work.

Status definitions, ID rules, and the process for adding or completing items
are in the [backlog process](docs/design/backlog/README.md).

## Now

`Now` contains at most three active items in exact technical order.

- [`BL-038` Selling homepage and product positioning](docs/design/backlog/BL-038-selling-homepage.md):
  **Ready.** Turn implemented strengths into a concise, proof-led front page
  and remove duplicated technical detail.
- [`BL-037` Refine left-navigation visual hierarchy](docs/design/backlog/BL-037-left-navigation-visual-hierarchy.md):
  **Ready.** Make the existing page rail clearer and more visually polished,
  using Linear Docs as a quality reference without changing navigation behavior.

## Next

`Next` is the exact implementation sequence after `Now`. Bounded deterministic
work comes before changes that need visual review. Larger features follow the
smaller page-graph additions they can reuse.

- [`BL-006` Previous and next page navigation](docs/design/backlog/BL-006-sequential-navigation.md):
  **Ready.** Define ordered traversal over the stable listed page
  graph before exposing that graph inside content.
- [`BL-007` Explicit child page list](docs/design/backlog/BL-007-child-page-list.md):
  **Ready after `BL-006`.** Reuse its traversal rules in one explicit Markdown
  block rather than creating a parallel hierarchy.
- [`BL-011` Edit source links](docs/design/backlog/BL-011-edit-source-links.md):
  **Ready.** Add repository-derived links after page source identity is stable;
  keep Git-derived dates outside this item.
- [`BL-005` Static search](docs/design/backlog/BL-005-static-search.md): **Ready.**
  Index final HTML only after page inclusion, URLs, and anchors have one shared
  contract; adopt an external indexer only after reviewing its package impact.
- [`BL-008` Long navigation tree controls and filtering](docs/design/backlog/BL-008-long-tree-controls.md):
  **Ready after `BL-006`.** Add progressive controls and a title filter only
  after tree scope, active-page, expansion, and traversal behavior are stable.
- [`BL-009` Semantic callouts](docs/design/backlog/BL-009-semantic-callouts.md):
  **Ready after `BL-005`.** Extend Markdown semantics after search and page
  output rules can consume the new structure consistently.

## External Gate

These items have high product value but require an external account, publishing
action, or another user-owned prerequisite. They do not block `Now` or `Next`.

- [`BL-030` Production-ready IntelliSense](docs/design/backlog/BL-030-production-ready-intellisense.md):
  **In progress.** The version-aligned package and real VS Code tests are ready;
  complete the first Visual Studio Marketplace publication before describing
  IntelliSense as a supported installable feature.

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
  **Ready after `BL-030` Production-ready IntelliSense.** Connect the editor to
  the shared site link graph only after its distribution, versioning, cache,
  and test boundaries are stable.

## Documentation Follow-ups

These items document behavior that already exists. Complete them independently
of the product sequence when the corresponding implementation has been
verified and approved for documentation.

- [`BL-041` Beginner-first Getting Started audit](docs/design/backlog/BL-041-getting-started-audit.md):
  **Implemented; awaiting human review.** The audited beginner path and starter
  changes are complete; review the rendered progression with the revised
  homepage before closing it.
- [`BL-042` Examples audit and teaching structure](docs/design/backlog/BL-042-examples-audit.md):
  **Ready after `BL-041` Beginner-first Getting Started audit.** Make every
  example discoverable, purposeful, current, and clearly separated from
  tutorial and reference material.
- [`BL-032` Improved examples for Add nested pages](docs/design/backlog/BL-032-documentation-improve-add-nested-pages.md):
  **Ready for final visual review.** The example now maps the real documentation
  hierarchy to its navigation; close the item once that presentation is accepted.
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
- `BL-039` **Deferred.** Draft and scheduled page publication; reconsider only
  when a representative site needs publication state that Git branches cannot
  provide, because every page consumer must share the same inclusion rules.
- `BL-040` **Deferred.** Convention-based local fonts; retain built-in font
  stacks until representative sites justify the licensing, preload, fallback,
  weight, and performance contracts.
