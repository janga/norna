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

- Add a short "Build your first gallery in 5 minutes" guide with one happy path
  and no reference material.
- Add a complete small `site/theme.md` and `site/content.md` example that a
  new user can compare with the starter.
- Add pure-project and embedded-project examples that show the expected
  directory layout and npm scripts.
- Add troubleshooting for common workflow errors:
  - running `npm install` before `norna init`;
  - npm authentication or permission failures during publish;
  - YAML/frontmatter indentation problems;
  - stale local preview state;
  - missing, misplaced, or unreferenced images.
- Add a plain explanation of what is versioned, what is generated, and what is
  published.
- Expand typography preset guidance with examples of when to choose each
  preset in `site/theme.md`, how to make page-level overrides, and how to make
  section-level overrides without losing the preset model.
- Document the recommended site-upgrade workflow after a new engine version is
  published.

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
  - `content:sync` v1 is page-local/route-local only and should not move files
    or section metadata across routes.
  - Build and render must not mutate source files.
  - Backwards compatibility with old `sections[]` plus frontmatter `gallery`
    is not required if it complicates the model.
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
- Consider a conservative command for refreshing marked `theme.md` help
  comment blocks without changing user-owned YAML values.

## Known Limitations

These are current constraints, not necessarily bugs.

- `npm link` is not supported for testing the engine in a site repository.
- Routes currently support one route segment under `site/routes/<route-folder>/`;
  nested routes and richer navigation behavior remain out of scope.
- Source image copyright metadata is outside the current command surface.
- `norna` assumes a file-driven site model with `config.mjs`,
  `theme.md`, `content.md`, source images, and static public files.

## Future Plans

These ideas may be useful later, but should not distract from stabilizing the
basic site workflow.

- More polished onboarding for non-project users.
- More preset families or richer theme helpers if several real sites need
  them.
- Better diagnostics for generated images and cache reuse.
- A documented pattern for embedding a gallery into larger GitHub Pages
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
      route-content.md
      images/
```

- `site/config.mjs` is site-level technical configuration, including URL,
  layout, gallery sizing, font family, locale/UI labels, footer, GitHub, and
  deploy settings.
- `site/theme.md` is site-level visual theme configuration, including
  site-wide presentation defaults, inline styles, and frame defaults.
- Page files own page metadata, page-level `presentation` overrides,
  page-level `frame` overrides, section definitions, gallery references, and
  Markdown body content.
- Presentation resolution should remain:

```text
engine defaults
-> site/theme.md presentation
-> page frontmatter presentation
-> sections[].presentation
```

- Page-level `presentation` is always an override on top of `site/theme.md`.
- Navigation should keep site navigation and page navigation conceptually
  separate. Site navigation changes pages/routes; page navigation changes the
  current URL hash and active section within the current page.
- Section navigation history should remain hash-based: each clicked section
  link creates one hash entry, browser back/forward moves through those section
  entries, and the hashless page state maps back to the first active section.
  Active section state should not be driven by free manual scrolling unless a
  later design explicitly reintroduces that behavior without conflicting with
  hash history.
- `frame.colors` is explicit and may use `theme`, `presentation`, or explicit
  `backgroundColor`/`textColor` values.
- Page metadata such as `title` and `description` should remain page-local and
  should not inherit from the homepage.
- Sections, galleries, and Markdown content should remain page-local and should
  not inherit from the homepage.
- `presentation.inlineStyles` belongs at site theme level so all future pages
  can use the same Markdown inline-style vocabulary.
