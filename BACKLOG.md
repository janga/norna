# Backlog

This backlog tracks planned `cli-gallery` work. It is not product
documentation and does not promise a release date. Move items into ordinary
documentation only when the behavior exists or the guidance is stable.

## Release Readiness

Use this section for work that should normally happen before the next npm
release.

- Verify the current starter flow after each command-surface change:
  `init`, `npm install`, `gallery:check`, `gallery:build`, and local preview.
- Update one real site repository after release and note any friction in the
  upgrade flow.
- Keep release recovery instructions current for the case where version commit
  and tag are created locally but `npm publish` fails.

## Documentation

Documentation is sufficient for current development, but should become more
approachable before wider use.

- Add a short "Build your first gallery in 5 minutes" guide with one happy path
  and no reference material.
- Add a complete small `site/content.md` example that a new user can compare
  with the starter.
- Add pure-project and embedded-project examples that show the expected
  directory layout and npm scripts.
- Add troubleshooting for common workflow errors:
  - running `npm install` before `cli-gallery init`;
  - npm authentication or permission failures during publish;
  - YAML/frontmatter indentation problems;
  - stale local preview state;
  - missing, misplaced, or unreferenced images.
- Add a plain explanation of what is versioned, what is generated, and what is
  published.
- Expand typography preset guidance with examples of when to choose each
  preset and how to make small overrides without losing the preset model.
- Document the recommended site-upgrade workflow after a new engine version is
  published.

## Implementation

Use this section for concrete engine behavior that should be implemented or
verified.

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

## Known Limitations

These are current constraints, not necessarily bugs.

- `npm link` is not supported for testing the engine in a site repository.
- The rendered shared UI still contains Swedish labels in some places.
- The renderer is intentionally single-page; adding routes would be a larger
  architectural decision.
- Source image copyright metadata is outside the current command surface.
- `cli-gallery` assumes a file-driven site model with `config.mjs`,
  `content.md`, source images, and static public files.

## Future Plans

These ideas may be useful later, but should not distract from stabilizing the
basic site workflow.

- More polished onboarding for non-project users.
- More preset families or theme-level presentation models if several real sites
  need them.
- Better diagnostics for generated images and cache reuse.
- Optional localization of built-in UI labels.
- A documented pattern for embedding a gallery into larger GitHub Pages
  projects that also publish an app or project homepage.
