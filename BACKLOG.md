# Backlog

This backlog tracks planned `norna` work. It is not product
documentation and does not promise a release date. Move items into ordinary
documentation only when the behavior exists or the guidance is stable.

## Release Readiness

Use this section for work that should normally happen before the next npm
release.

- Verify the current starter flow after each command-surface change:
  `init`, `npm install`, `norna:check`, `norna:build`, and local preview.
- Update one real site repository after release and note any friction in the
  upgrade flow.
- Keep release recovery instructions current for the case where version commit
  and tag are created locally but `npm publish` fails.

## Documentation

Documentation is sufficient for current development, but should become more
approachable before wider use.

- Add a short "Build your first image-led site in 5 minutes" guide with one happy path
  and no reference material.
- Add a complete small `site/theme.yaml` and `site/content.md` example that a
  new user can compare with the starter.
- Add standalone-project and embedded-project examples that show the expected
  directory layout and npm scripts.
- Add troubleshooting for common workflow errors:
  - running `npm install` before `norna init`;
  - npm authentication or permission failures during publish;
  - YAML/frontmatter indentation problems;
  - stale local preview state;
  - missing, misplaced, or unreferenced images.
- Add a plain explanation of what is versioned, what is generated, and what is
  published.
- Expand typography profile guidance with examples of when to choose each
  profile in `site/theme.yaml` without losing the complete theme-preset model.
- Document the recommended site-upgrade workflow after a new engine version is
  published.
- Turn the release section in `docs/engine-development.md` into a concise
  maintainer runbook covering patch/minor/major releases, the steps performed
  automatically, rollback before the release commit, and recovery after a
  failed publish. Add a discoverability link from `docs/README.md` without
  duplicating the instructions.
- Document IntelliSense suggestion sources for Norna YAML files. Explain that
  schema-based completions come from Norna's project-local schemas, while VS
  Code word suggestions and AI extensions may offer unrelated or invalid
  content. State that the Norna schema and `norna config:check` are
  authoritative, and include optional workspace settings for disabling
  word-based and Copilot suggestions for YAML when users want schema-only
  completion.

## Implementation

Use this section for concrete engine behavior that should be implemented or
verified.

- Stabilize content model v2:
  - Markdown is authoritative for section existence and section order.
  - Level 2 Markdown headings define sections and must use explicit ids, for
    example `## About {#about}`.
  - Page frontmatter `sections` is an optional metadata map keyed by section id.
  - `sections` metadata should contain only properties that do not naturally
    belong in Markdown, such as `visible` and `presentation`.
  - Norna-managed images are written as fenced Markdown blocks:
    `norna-image-stack` for one or more stacked images, and
    `norna-image-carousel` for carousels.
  - Normal Markdown images do not participate in Norna image processing or
    `content:sync`; local Markdown images should warn, external Markdown images
    should not.
  - Image filenames and section ids do not need to be globally unique for a
    valid site.
  - `content:sync` may move unambiguously identified image files across page
    and route image roots when the Git worktree is clean.
  - Build and render must not mutate source files.
- Add a future task for cross-route content sync. The future command should
  relocate section metadata and section-bound assets across routes only when
  source and destination are unambiguous. It should never guess, should not
  require globally unique section ids or image filenames for ordinary site
  validity, and should prefer diagnostics over unsafe mutation.
- Review carousel control placement and carousel text/caption placement after
  testing the content model v2 proof of concept. The current carousel UI works,
  but controls and text placement need a deliberate pass before the model is
  promoted to user-facing examples.
- Consider `norna-image-grid` after the stack/carousel model has been tested.
  A first version should probably use a simple `columns` value plus a flat image
  list, fill cells in reading order, allow an incomplete final row, and avoid
  empty cells until a real need appears.
- Improve `init --type embedded` if real mixed projects reveal missing setup
  steps.
- Consider a lighter local-engine testing workflow than publishing to npm,
  without using `npm link`.
- Continue improving `content:check` errors so users see focused fixes before
  Astro or YAML parser stack traces.
- Review whether dev-server restart behavior can be clearer when content,
  images, or generated state changes.
- Decide whether image cache and generated manifest behavior needs a more
  explicit command for repair or reset.
- Consider a conservative command for refreshing marked `theme.yaml` help
  comment blocks without changing user-owned YAML values.

## Known Limitations

These are current constraints, not necessarily bugs.

- `npm link` is not supported for testing the engine in a site repository.
- Routes currently support one route segment under `site/routes/<route-folder>/`;
  nested routes and richer navigation behavior remain out of scope.
- Source image copyright metadata is outside the current command surface.
- `norna` assumes a file-driven site model with `config.yaml`,
  `theme.yaml`, `content.md`, source images, and static public files.

## Future Plans

These ideas may be useful later, but should not distract from stabilizing the
basic site workflow.

- More polished onboarding for non-project users.
- More preset families or richer theme helpers if several real sites need
  them.
- Better diagnostics for generated images and cache reuse.
- A documented pattern for embedding an image-led site into larger GitHub Pages
  projects that also publish an app or project homepage.

## Route Architecture Notes

Basic first-level routes are implemented. These notes record structural
decisions so future route work can avoid unnecessary breaking changes.

- `site/content.md` is the homepage page file for `/`, not a catch-all site
  file.
- Route files are analogous page files, for example:

```text
site/
  content.md
  routes/
    <slug>/
      content.md
      images/
```

- `site/config.yaml` is site-level technical configuration for the public URL,
  language and optional smooth scrolling. Norna derives the base path from the
  URL and discovers GitHub repository/default-branch details during deploy.
- `site/theme.yaml` is site-level visual configuration. An optional route-local
  `theme.yaml` replaces it for that route.
- Page files own page metadata, section definitions, Norna block references,
  and Markdown body content.
- Theme resolution is:

```text
engine defaults
-> root theme.yaml or route-local theme.yaml
```

- Navigation should keep site navigation and page navigation conceptually
  separate. Site navigation changes pages/routes; page navigation changes the
  current URL hash and active section within the current page.
- Section navigation history should remain hash-based: each clicked section
  link creates one hash entry, browser back/forward moves through those section
  entries, and the hashless page state maps back to the first active section.
  Active section state should not be driven by free manual scrolling unless a
  later design explicitly reintroduces that behavior without conflicting with
  hash history.
- Page metadata such as `title` and `description` should remain page-local and
  should not inherit from the homepage.
- Sections, Norna blocks, and Markdown content should remain page-local and should
  not inherit from the homepage.
