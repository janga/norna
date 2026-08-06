## Agent Instructions

`README.md` is the project entry point and `docs/` contains the canonical
human-facing documentation. Read them before changing this project.

Keep this file limited to agent operating rules. If a fact is useful to a human
maintainer, put it in `README.md` instead of duplicating it here.

## Working Rules

- Keep changes small and focused.
- Do not create branches unless the user asks for one.
- Do not push uncommitted changes.
- Before committing, run `git status --short` and make sure untracked files are
  intentional.
- Commit before pushing.
- Do not run `npm run deploy:watch` in this engine repository unless the user
  explicitly asks for it. Deploy monitoring is for site repositories.
- For visual presentation, layout, color, spacing, sticky navigation, footer,
  and demo-content changes, prefer human local inspection before automated
  tests. Start or reuse a local dev server and give the user the URL when visual
  inspection is needed. After the user approves the visual result, run the
  relevant automated checks before committing, unless the user explicitly says
  to skip tests.
- Exceptions to human-first testing: run a quick relevant automated check early
  when schema validation, config validation, packaging, build mechanics, or
  deploy behavior may be broken by the change. If the user explicitly says to
  skip tests, do not run them and report that they were skipped.
- Keep technical project settings in `site/config.mjs`; do not hardcode the
  public URL, GitHub repo, deploy branch, Pages workflow name, footer text,
  or smooth-scroll timing in scripts or components.
- The site source directory defaults to `site/` and can be overridden with
  `NORNA_SITE_DIR`; use `scripts/lib/site-paths.mjs` instead of
  hardcoding site paths in scripts.
- Keep editable content, section definitions, image references, gallery alt
  text, and captions in the selected site `content.md`; the default path is
  `site/content.md`. Keep site-wide visual theme defaults and inline styles in
  the selected site `theme.md`; the default path is `site/theme.md`.
- Use root `site/` for the documentation site. Use `examples/dog-gallery/site`
  for visual demo and navigation checks. Use `fixtures/basic/site` for
  standalone engine regression checks.
- Keep site-specific static files in the selected site `public/`; the default
  path is `site/public/`. The selected site's `.norna/public/` directory
  is copied build preparation output plus generated image output.
- Do not add routes or split sections into separate Markdown files unless the
  user explicitly changes the single-page architecture.

## Command Choices


- Start the documentation-site dev server with `npm run dev:local`, or
  `npm run dev:lan` only when testing on another device on the same local
  network. Use `npm run demo:dev` for the dog-gallery demo. Manage it with
  `npm run dev:stop`, `npm run dev:restart`, `npm run dev:status`, and
  `npm run dev:logs`.
- Run `npm run config:check` after changing `site/config.mjs` or config
  validation behavior.
- Run `npm run content:check` before `npm run build` when changing content or
  gallery images.
- Run `npm run content:check` after changing `site/theme.md` or theme
  validation behavior.
- Run `npm run content:sync` after moving gallery rows between sections so image
  files move to the matching section directory.
- Run `npm run site:public` after changing `site/public/` when you need the
  local generated public copy without a full build.
- Run `npm run test:site-public` after changing static-public sync behavior.
- Run `npm run test:fixture:build` after changing package/site-root behavior
  that should work against the minimal fixture.
- Run `npm run package:check` after changing package files, CLI dispatch,
  Astro path resolution, or starter structure.
- Run `npm run build` after content, layout, config, or image-pipeline changes.
- Run `npm run build:local` when a local preview may be using stale content and
  should be rebuilt and restarted.
- Run `npm run test:content-check` after changing content validation or
  `content:sync` behavior.
- Run `npm run test:navigation` after sticky navigation, anchor offset, or
  scroll behavior changes.
- Use `npm run test:navigation:stress` for intermittent anchor navigation
  races.
- Use `npm run test:navigation:preview` for production-like sticky-navigation
  anchor testing against `dist/`.

## Implementation Notes

- Preserve progressive enhancement in section navigation: keep real
  `href="#section-id"` links so anchors work without JavaScript.
- The sticky navigation uses root `scroll-padding-top` to compensate for the
  fixed header area. Avoid section-level `scroll-margin-top` unless you are
  deliberately testing anchor offsets.
- When adding, renaming, or moving sections, keep the frontmatter section `id`,
  the Markdown heading id, and the `site/images/<section-id>/` image directory in
  sync.
- Do not commit unreferenced source images unless the user explicitly asks for
  them.
- If Playwright reports a missing Chromium browser, run
  `npx playwright install chromium` once. In sandboxed Codex sessions,
  Playwright may need escalation to launch Chromium.
