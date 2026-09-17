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

`Now` contains at most five active items in exact technical order.

- `BL-122` **Reconsider the right-hand menu:**
  **High priority; ingen analys gjord.** Question the right-hand menu in
  general, since the user finds that it competes with sidenotes.
- [`BL-120` Smooth documentation navigation prototype](docs/design/backlog/BL-120-smooth-documentation-navigation-prototype.md):
  **In progress:** a diagnostic plan and result-record format are documented
  for navigation flashes and initial menu jumps; execution, prototype
  approval, regression checks and the implementation commit remain pending.

## Next

`Next` is the exact implementation sequence after `Now`.

- [`BL-123` Navigation JavaScript refactoring assessment](docs/design/backlog/BL-123-navigation-javascript-refactoring-assessment.md):
  **High priority; ready for analysis after `BL-120` Smooth documentation
  navigation prototype.** Identify justified refactoring needs and their
  risks from the completed prototype; implementation is a separate follow-up.

## External Gate

These items have high product value but require an external account, publishing
action, practical user evaluation, or another user-owned prerequisite. They do
not block `Now` or `Next`.

- [`BL-030` Production-ready IntelliSense](docs/design/backlog/BL-030-production-ready-intellisense.md):
  **In progress: experimental VSIX evaluation.** Continue everyday editing with
  identifiable manual updates and regression tests for reported failures;
  Marketplace publication requires a later explicit decision.

## Later

These accepted maintenance and workflow outcomes follow the ordered product
work above unless a concrete defect raises their urgency.

- [`BL-119` Direct-hash positioning in static previews](docs/design/backlog/BL-119-static-preview-hash-positioning.md):
  **Needs diagnosis.** Resolve the reproducible initial hash-positioning failure
  in the built top-navigation fixture without relaxing the heading visibility
  checks.
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

- **Code-block typography trial:** after visual approval, record the shared
  code-font choice and size/line-height rationale in the preset design guide,
  and run focused code-block regression checks. The trial uses `0.875rem`,
  line-height `1.43`, and the code-title monospace family; no new theme option.

## Needs Decision Or Evidence

These items have no implementation position yet. Move one into `Now`, `Next`,
or `Later` only after the stated evidence or design decision exists.

- `BL-113` **Page References: Needs evidence; unprioritized wishlist idea.**
  Consider an expandable reference to one page with selected heading links and
  automatically retrieved titles, but first try ordinary Markdown links in
  `details` and establish whether recurring maintenance work justifies a new
  construct; no syntax or implementation is approved.
- `BL-116` **Authoring Guidelines: Needs scope; unprioritized documentation idea.**
  Write practical guidance for Norna site authors, distinct from engine rules
  and internal documentation style instructions. Include when to version
  documentation: significant differences in instructions or behavior, not
  every patch release or wording correction; let one documentation version
  cover several compatible releases and keep maintained versions few.
  Use [Docusaurus versioning guidance](https://docusaurus.io/docs/versioning#recommended-practices)
  as a source and coordinate feature-specific advice with `BL-025` Versioned
  Documentation; do not imply that future versioning support already exists.
- [`BL-100` Future Versioning Foundation](docs/design/backlog/BL-100-future-versioning-foundation.md):
  **Needs design.** Establish version identity, lifecycle boundaries and the
  language interaction before versioned documentation can become ready.
- [`BL-101` Deprecation Status](docs/design/backlog/BL-101-deprecation-status.md):
  **Needs design after `BL-100` Future Versioning Foundation.** Define
  page-level deprecation metadata with replacement and version context; this is
  an intentionally incomplete design item, not an implementation-ready
  specification.
- [`BL-050` Source-backed code excerpts](docs/design/backlog/BL-050-source-backed-code.md):
  **Needs design.** Establish path, package, watch, and sensitive-file
  boundaries before source files can be included in documentation.
- [`BL-051` Technical diagram sources](docs/design/backlog/BL-051-technical-diagram-sources.md):
  **Needs evidence.** Retain managed SVG as the migration path until maintained
  Norna sites demonstrate a recurring need for build-time diagram rendering.
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

- `BL-115` **Page-owned Attachments: Deferred wishlist idea.** After
  `BL-023` Multilingual Sites With A Shared Page Tree and `BL-025` Versioned
  Documentation, coordinated with `BL-100` Future Versioning Foundation,
  consider page-owned downloadable files with shared defaults and optional
  language variants. Reuse ordinary Markdown links; update internal links
  during `page:move` without changing historical versions. Allow fallback to
  an explicitly shared file, not silently to another language. Folder names,
  URL stability, and syntax remain undecided; this is not an implementation
  specification or a prioritized item.
- [`BL-052` Docusaurus Migration Obstacle Inventory](docs/design/backlog/BL-052-documentation-migration-assistant.md):
  **Deferred; decision workflow archived.** Resume only for a real site's
  bounded migration trial, using representative pages and focused conversions
  instead of a general decision-management system.
- [`BL-023` Multilingual Sites With A Shared Page Tree](docs/design/backlog/BL-023-multilingual-sites-shared-page-tree.md):
  **Deferred; needs design before implementation.** Publish language variants
  from one shared page tree, with predictable URLs, language switching, and
  explicit fallback behavior.
- `BL-024` **Deferred.** Collections, taxonomies, pagination, and feeds, which
  together require recurring-content identity and a generated-page model.
- [`BL-025` Versioned Documentation](docs/design/backlog/BL-025-versioned-documentation.md):
  **Deferred; needs design after `BL-100` Future Versioning Foundation.**
  Publish a small set of materially different documentation trees with
  version-local navigation, search, and explicit version-switch fallback.
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
  Evidence from `BL-120` Smooth documentation navigation prototype will inform
  whether client-side routing is needed at all.
