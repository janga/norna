# Backlog

This file is the ordered index of unfinished Norna work. It is not product
documentation, a release promise, or a completion log. Work from top to bottom
within `Now` and `Next`; dependencies take precedence over perceived feature
value. Items under `External Gate` do not block autonomous work.

Status definitions, ID rules, and the process for adding or completing items
are in the [backlog process](docs/design/backlog/README.md).

`★` marks a user-selected implementation candidate. The marker records product
interest; queue order, dependencies, and unresolved decisions still determine
when implementation can begin.

## Now

`Now` contains at most three active items in exact technical order.

- [`BL-065` Restore the Page contents reading marker](docs/design/backlog/BL-065-page-contents-reading-marker.md):
  **Ready.** Reproduce and restore the missing palette-derived current-heading
  marker in the right Page contents rail on a deeply nested page.

## Next

`Next` is the exact implementation sequence after `Now`. Bounded deterministic
work comes before changes that need visual review. Larger features follow the
smaller page-graph additions they can reuse.

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

- ★ [`BL-063` Sticky row labels in wide tables](docs/design/backlog/BL-063-sticky-table-row-labels.md):
  **Needs one semantics decision.** Preserve row identity during horizontal
  table scrolling only after Norna has an explicit, accessible way to identify
  the row-header column.
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

- [`BL-009` Semantic callouts](docs/design/backlog/BL-009-semantic-callouts.md):
  **Implemented; awaiting human review and documentation.** GitHub-style alert
  blockquotes render as localized, accessible semantic callouts with a closed
  meaning set and deterministic diagnostics.
- [`BL-055` Wide, readable tables with sticky headings](docs/design/backlog/BL-055-wide-readable-tables.md):
  **Implemented and browser-tested; human review found a visible defect.** Fix
  the imperceptible horizontal-overflow cue before documentation. Sticky
  headings in the scrolling fallback are tracked separately by `BL-066`.
- [`BL-059` Compact navigation in Focus reading](docs/design/backlog/BL-059-focus-reading-navigation.md):
  **Implemented and browser-tested; awaiting human review and documentation.**
  Focus reading replaces persistent rails with an accessible overlay that
  reuses the full site hierarchy without moving the reading layout.
- [`BL-056` Lighter Dark navigation markers](docs/design/backlog/BL-056-lighter-dark-navigation-markers.md):
  **Implemented and browser-tested; awaiting human review and documentation.**
  Current-page and current-heading markers share a clearer palette-derived
  surface in Dark appearance.
- [`BL-042` Examples audit and teaching structure](docs/design/backlog/BL-042-examples-audit.md):
  **Visually approved; regression tests and documentation remain.** The example
  roles, source map, and documentation hierarchy are reconciled.
- [`BL-032` Improved examples for Add nested pages](docs/design/backlog/BL-032-documentation-improve-add-nested-pages.md):
  **Visually approved; regression tests and documentation remain.** The example
  maps the real documentation hierarchy to its navigation.

## Needs Decision Or Evidence

These items have no implementation position yet. Move one into `Now`, `Next`,
or `Later` only after the stated evidence or design decision exists.

- [`BL-049` Content alternatives](docs/design/backlog/BL-049-content-alternatives.md):
  **Needs design.** Choose an authoring and no-JavaScript contract before tabs
  or code groups enter Norna's content model.
- [`BL-050` Source-backed code excerpts](docs/design/backlog/BL-050-source-backed-code.md):
  **Needs design.** Establish path, package, watch, and sensitive-file
  boundaries before source files can be included in documentation.
- [`BL-051` Technical diagram sources](docs/design/backlog/BL-051-technical-diagram-sources.md):
  **Needs evidence.** Retain managed SVG as the migration path until maintained
  Norna sites demonstrate a recurring need for build-time diagram rendering.
- [`BL-052` Documentation migration assistant](docs/design/backlog/BL-052-documentation-migration-assistant.md):
  **Needs design.** Start with a read-only source audit that reports direct,
  rewritable, and unresolved constructs before considering automatic writes.
- [`BL-053` Accessible mathematics](docs/design/backlog/BL-053-accessible-mathematics.md):
  **Needs evidence and syntax review.** Keep static conversion as the migration
  path until scientific or mathematical Norna sites justify native rendering.
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
- `BL-054` **Deferred idea.** Reconsider optional instant navigation modelled
  on Material for MkDocs `navigation.instant` only if measurements show that
  normal static-page navigation harms real Norna sites. Preserve ordinary
  links and full-page fallback, fetch only likely or selected destinations,
  and never preload the complete navigation tree.
