## Agent Instructions

`README.md` is the project entry point and `docs/` contains the canonical
human-facing documentation. Read them before changing this project.

Keep this file limited to agent operating rules. If a fact is useful to a human
maintainer, put it in `README.md` instead of duplicating it here.

## Working Rules

- Keep changes small and focused.
- Before changing documentation, schema or IntelliSense descriptions, UI help,
  error-message guidance, or explanatory example text, read and follow
  `docs/design/documentation-style-guide.md`. Treat public configuration keys,
  values, commands, and Norna content-block names as product terminology, not
  as self-explanatory English words.
- Do not silently preserve or rename ambiguous public terminology while doing
  an ordinary documentation edit. Explain the conflict to the user. When the
  user explicitly invokes `$norna-terminology-review` or requests its
  terminology-first workflow, follow the repo skill under
  `.agents/skills/norna-terminology-review/` and stop for approval before
  changing files.
- When implementing a new feature, add or update a concrete item under
  `Documentation` in `BACKLOG.md` describing which reference documentation,
  introduction content, examples, and editor help may need to be updated. Log
  the documentation work as part of the feature change, but do not perform the
  wider documentation or example update until the feature has been tested and
  the user has approved proceeding with it.
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
- Keep the public URL, optional language and optional smooth-scroll switch in
  `site/config.yaml`. Keep engine UI text in the built-in language packs, discover
  GitHub repository/default-branch details at deploy time, and keep footer text
  in `site/sitewide-content.yaml`.
- The site source directory defaults to `site/` and can be overridden with
  `NORNA_SITE_DIR`; use `scripts/lib/site-paths.mjs` instead of
  hardcoding site paths in scripts.
- Keep editable content, Markdown section headings, Norna image block
  references, alt text, captions, and optional section metadata in the selected
  page's `content.md`; the homepage path is
  `site/pages/000-home/content.md`. Keep site-wide visual identity in the root
  `site/theme.yaml`; page-local themes may use only the limited inherited
  presentation fields accepted by the page-theme schema.
- When adding AI-generated images to Norna sites, document their provenance and
  prompt in Markdown near the image block so future maintainers can regenerate
  or revise them. This is not required for disposable test fixtures where the
  prompt has no maintenance value.
- Use root `site/` for the documentation site. Use
  `examples/feature-demos/media-and-surfaces/site` for broad visual demo and
  navigation checks. Use `fixtures/basic/site` for minimal standalone engine
  regression checks.
- Keep site-specific static files in the selected site `public/`; the default
  path is `site/public/`. The selected site's `.norna/public/` directory
  is copied build preparation output plus generated image output.
- Keep Home at `site/pages/000-home/` without child pages. Put global
  navigation roots beside it and nested pages under the nearest meaningful
  non-home page.

## Command Choices


- Start the documentation-site dev server with `npm run dev:local`, or
  `npm run dev:lan` only when testing on another device on the same local
  network. Start the broad feature demo from the repository root with
  `node bin/norna.mjs --site-dir examples/feature-demos/media-and-surfaces/site dev:local`.
  Manage it with the corresponding `dev:stop`, `dev:restart`, `dev:status`, and
  `dev:logs` commands using the same `--site-dir`.
- Run `npm run config:check` after changing `site/config.yaml` or config
  validation behavior.
- Run `npm run content:check` before `npm run build` when changing content or
  Norna-managed images.
- Run `npm run content:check` after changing `site/theme.yaml` or theme
  validation behavior.
- Run `npm run content:sync` after moving Norna image block references between
  pages so unambiguous image files move to the expected page image directory.
- Run `npm run site:public` after changing `site/public/` when you need the
  local generated public copy without a full build.
- Run `npm run test:site-public` after changing static-public sync behavior.
- Run `npm run test:fixture:build` after changing package/site-root behavior
  that should work against the minimal fixture.
- Run `npm run test:examples` after moving or changing runnable examples or
  behavior demonstrated by them.
- Run `npm run test:documentation` after changing the root README, files under
  `docs/`, example README files, or `site/public/llms.txt`.
- Run `npm run build:pages` after changing the documentation Pages artifact,
  rendered example links, or example deployment paths.
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
- Keep exactly one Markdown H1 as the page title. H2 and H3 ids are derived
  deterministically; use explicit ids only when a public anchor must remain
  stable across heading edits. Keep managed homepage images directly in
  `site/pages/000-home/images/` and other images directly in their page's
  `images/` directory.
- Do not commit unreferenced source images unless the user explicitly asks for
  them.
- If Playwright reports a missing Chromium browser, run
  `npx playwright install chromium` once. In sandboxed Codex sessions,
  Playwright may need escalation to launch Chromium.
