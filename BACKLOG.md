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

- Add a complete small `site/theme.yaml` and `site/pages/000-home/content.md` example that a
  new user can compare with the starter.
- Add standalone-project and embedded-project examples that show the expected
  directory layout and npm scripts.
- Add troubleshooting for common workflow errors:
  - running `npm install` before `norna init`;
  - npm authentication or permission failures during publish;
  - YAML/frontmatter indentation problems;
  - stale local preview state;
  - missing, misplaced, or unreferenced images.
- Expand typography profile guidance with examples of when to choose each
  profile in `site/theme.yaml` without losing the complete theme-preset model.
- After the preset proof of concept is approved, document the engine-owned
  presentation guarantees that affect site authors: semantic status colors,
  consistent keyboard focus, minimum control sizes, long-token reflow,
  sidenote fallback during text enlargement, reduced motion, and forced-colors
  support. Keep raw contract internals in the design documentation.
- After the reader Display panel is tested and approved, replace the temporary
  design-document links in the generated theme schema with user-facing theme
  reference links. Document `readerControls`, preset defaults, the three
  base-path-scoped preference cookies, reset behavior, focus-reading behavior,
  and the configured no-JavaScript fallback.
- After the collapsible desktop tree navigation is tested and approved,
  document its one-click control, tab-scoped state, reading-width behavior,
  keyboard semantics, and visible no-JavaScript fallback.
- Turn the release section in `docs/engine-development.md` into a concise
  maintainer runbook covering patch/minor/major releases, the steps performed
  automatically, rollback before the release commit, and recovery after a
  failed publish. Add a discoverability link from `docs/README.md` without
  duplicating the instructions.

## Implementation

Use this section for concrete engine behavior that should be implemented or
verified.

- Refactor `content:sync` into a pure analysis and planning phase followed by a
  small filesystem apply and reporting phase. Preserve conservative conflict
  handling and the current simple rename behavior; do not add speculative
  moves or an elaborate rollback system.
- Define explicit CSS layout invariants for the text column, optional tree
  navigation, headings, managed media, cards, carousels, and sidenotes. Use
  those shared coordinates to remove selector-specific alignment fixes, then
  split `src/styles/global.css` by responsibility without changing the approved
  visual behavior.
- Make `scripts/dev-local.mjs` platform-independent. Replace its direct use of
  Unix tools such as `lsof` and `tail`, and define equivalent port cleanup,
  process termination, and log-following behavior for macOS, Linux, and
  Windows.
- Split `scripts/test-content-model-v2.mjs` into focused test suites for page
  structure, managed media, content synchronization, and Markdown constructs
  such as notes and cards. Preserve the existing behavioral coverage and keep
  the complete suites in the normal test and release chain.
- Extend cross-page content sync if future section-bound metadata or assets
  need to move with an entire section. Such movement should happen only when
  source and destination are unambiguous. It should never guess, should not
  require globally unique section ids or image filenames for ordinary site
  validity, and should prefer diagnostics over unsafe mutation.
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
- Source image copyright metadata is outside the current command surface.
- `norna` assumes a file-driven site model with `config.yaml`,
  `theme.yaml`, `content.md`, source images, and static public files.

## Future Plans

These ideas may be useful later, but should not distract from stabilizing the
basic site workflow.

- Evaluate optional current-section tracking in open tree navigation. A first
  version should use progressive enhancement to mark the current H2 and, when
  shown, H3 while the reader scrolls. It must not change the URL, browser
  history, keyboard focus, or scroll position, and should use a specific option
  such as `navigation.sectionTracking` rather than a general permission for
  navigation JavaScript. The static navigation must remain fully usable when
  tracking is disabled or JavaScript is unavailable.
- Add opt-in static search for larger sites. Prefer a build-time index generated
  from the completed HTML in `dist/`, using Pagefind or an equivalent established
  tool rather than a Norna-specific search engine. A first version should:
  - expose a small site-wide setting such as `search.enabled`;
  - generate an accessible `/search/` page and keep ordinary pages free from
    search JavaScript;
  - index editorial page and section content while excluding navigation,
    banners, and footer content;
  - link results to the matching page or section anchor;
  - work with configured languages, base paths, and GitHub Pages;
  - define predictable development-server index refresh behavior;
  - avoid filters, ranking controls, and hosted search providers until real
    sites demonstrate a need.
- More polished onboarding for non-project users.
- More preset families or richer theme helpers if several real sites need
  them.
- Better diagnostics for generated images and cache reuse.
- A documented pattern for embedding an image-led site into larger GitHub Pages
  projects that also publish an app or project homepage.

## Page Architecture Notes

The unified page tree and theme boundary are implemented. The current contract
is documented in [Pages](docs/pages.md), [Theme](docs/theme.md), and the
[navigation and theme design record](docs/design/navigation-and-theme-plan.md).
Future work should preserve these main boundaries:

- Home is the standalone `pages/000-home/` front door and has no child pages.
- Other top-level pages are global navigation roots; non-home pages may contain
  nested child pages.
- Every page owns its Markdown, metadata, sections, Norna blocks, and images.
- The root theme owns site identity. Page themes inherit and may adjust only
  text width, content spacing, managed-image sizing, and section background
  pattern.
- Normal URLs and anchors remain functional without client-side JavaScript.
