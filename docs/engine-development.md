# Engine Development

This document is for work on the reusable `norna` package itself.

## Main Areas

- `bin/norna.mjs`: public CLI launcher and local-version resolver.
- `bin/norna-cli.mjs`: public CLI command dispatcher.
- `scripts/lib/site-paths.mjs`: engine/site path resolution.
- `scripts/lib/project-config.mjs`: plain YAML `site/config.yaml`
  validation, defaults and derived URL path.
- `scripts/sync-content-sections.mjs`: content validation and sync behavior.
- `scripts/generate-images.mjs`: managed image pipeline and manifest.
- `scripts/sync-site-public.mjs`: static public file sync.
- `scripts/deploy-site.mjs`: deploy and deploy:commit behavior.
- `scripts/watch-pages-deploy.mjs`: GitHub Pages workflow monitor.
- `src/content.config.ts`: Astro content schema.
- `src/components/` and `src/layouts/`: rendered page, navigation, image
  blocks, and layout.
- `tests/`: Playwright navigation diagnostics.
- `fixtures/basic/site/`: minimal site used for engine checks.
- `fixtures/preset-baseline/site/`: shared representative content used to
  compare every built-in preset.
- `tests/preset-baselines/`: resolved preset contracts and committed desktop
  and mobile reference images.
- `starters/basic/`: copyable site starter.
- `examples/feature-demos/media-and-surfaces/site/`: broad visual example used
  by demo builds and navigation diagnostics.

The repository-local `site/` directory is reserved for a local documentation
site. It is useful for dogfooding Norna documentation. Preset regression uses
the dedicated preset-baseline fixture so changes to the documentation content
do not silently redefine the visual contract.

## Common Checks

Run focused checks while developing:

```sh
npm run test:content-check
npm run test:site-public
npm run test:documentation
npm run test:fixture:build
npm run test:examples
npm run test:preset-baselines
npm run test:documentation-preset-review
npm run demo:build
npm run package:check
```

`npm run test:examples` builds every complete site and feature demo under
`examples/`. `npm run test` includes those builds in the standard check
sequence. Each build uses that example's own temporary output and site-local
Astro state, so it cannot replace the documentation site's `dist/` or reload
an active documentation dev server.

`npm run test:documentation` checks local Markdown links, rejects obsolete site
paths and filenames in documentation and examples, and verifies that every
Markdown source linked from `llms.txt` exists.

`npm run build:pages` is specific to this repository. It builds the
documentation site and assembles rendered examples under `dist/examples/` for
the shared GitHub Pages artifact. It is not a generic Norna site command.

`npm run test:preset-baselines` builds the same representative site with every
built-in preset and verifies characterized values and rendered markup. The
committed screenshots are human-review references rather than pixel-perfect
test assertions. Use `npm run preset:documentation:review` for an interactive
local comparison of the `documentation` preset candidates. Use
`npm run palette:review` to render every built-in palette against the same
representative content and switch between them in one browser view. The
corresponding `*:build` commands create the review output without starting a
server. Capture new baseline images only after the intended visual change has
been reviewed:

```sh
npm run preset:baselines:capture
```

The root `site/` directory is the documentation site. Use the ordinary local
commands for it:

```sh
npm run dev:local
npm run build
```

Inside the engine repository, use npm scripts or explicitly run
`node bin/norna.mjs ...`. Do not rely on a bare `norna ...` command there: a
globally installed launcher deliberately does not delegate to another package
whose own name is `@janga/norna`, so it may continue with the published global
implementation instead of the working tree.

The media-and-surfaces feature demo remains a broad structured-content and
navigation diagnostic target:

```sh
node bin/norna.mjs --site-dir examples/feature-demos/media-and-surfaces/site dev:local
npm run demo:build
```

The demo build is written to `examples/feature-demos/media-and-surfaces/dist/`,
not to the engine repository's root `dist/`.

Navigation diagnostics are separate because they use Playwright:

```sh
npm run test:navigation
npm run test:navigation:stress
npm run test:navigation:preview
```

If Chromium is missing:

```sh
npx playwright install chromium
```

## Package Check

`npm run package:check` packs this repository, extracts the package, copies the
packaged starter into a temporary site project, installs dependencies, runs
`norna doctor` from a site subdirectory, runs config/content checks,
builds the installed site, and verifies selected rendered output and validation
failures.

It needs network access when npm dependencies are not already cached.
The check uses a reusable npm cache at
`node_modules/.cache/norna-package-check-npm` and runs npm with
`--prefer-offline` so repeat runs do not redownload dependencies. Set
`NORNA_PACKAGE_CHECK_CACHE=/path/to/cache` to use another cache.

## CI Lockfiles

Site repositories are developed on different operating systems but deployed on
GitHub Actions Linux. `engine:update` therefore normalizes `package-lock.json`
with npm 11.16.0 for Linux x64 glibc and verifies a clean install before it runs
the site checks. The starter workflow pins Node 24.18.0, which provides the
same npm version.

`npm run test:ci-lockfile` recreates and repairs the optional npm peer-dependency
case that previously caused GitHub Actions `npm ci` failures.

## Test The Package In A Site Repository

> **Warning:** `npm link` is not supported for `norna`. Astro resolves
> renderer modules and runtime dependencies differently when the package is a
> symlink, so a linked site can fail to start even though the published package
> works. Do not use `npm link @janga/norna` to test a site.

Use `npm run package:check` to test the package before release. To test a
specific published engine version in a real site, update it with:

```sh
npm run norna:engine:update -- <version>
```

Commit the resulting `package.json` and `package-lock.json` changes in the
site repository after the site's normal checks pass.

The installed `norna` command is created from the package `bin` field. The
launcher first looks for the nearest project `package.json`. If that project
declares `@janga/norna` and Node can resolve an installed copy from that project
root, the launcher delegates to that local entrypoint. The engine repository
itself is excluded from delegation to prevent recursion; its working tree is
selected explicitly through npm scripts or `node bin/norna.mjs`.

## npm Release

The npm package is published as `@janga/norna`. Use the release scripts for the
complete release; do not run `npm version` or `npm publish` separately during a
normal release.

### 1. Choose The Version Change

| Command | Use when |
| --- | --- |
| `npm run release:patch` | The release contains backwards-compatible fixes or maintenance changes. |
| `npm run release:minor` | The release adds backwards-compatible functionality. |
| `npm run release:major` | The release contains an incompatible product change. |

### 2. Check The Starting State

The release command requires a clean Git working tree. Before starting:

```sh
git status --short
```

Commit or remove every listed change. The command also checks npm
authentication against the same registry and cache used for publication. If
that preflight fails, run the exact login command printed by the script and
start the release again. No version file, commit, or tag has changed at this
point.

### 3. Run One Release Command

For example, to release a patch:

```sh
npm run release:patch
```

The command performs these steps in order:

1. Updates `package.json` and `package-lock.json` without creating a commit.
2. Regenerates schemas whose documentation links contain the new `v<version>`
   Git tag.
3. Runs the complete `npm test` release chain.
4. Verifies that checks changed only `package.json`, `package-lock.json`, and
   generated schemas.
5. Creates commit `Release v<version>` and annotated tag `v<version>`.
6. Publishes the public package to npm.
7. Pushes the release commit and tag.

GitHub Pages deployment monitoring is deliberately separate from the npm
release.

### 4. Recover At The Reported Boundary

**Failure before the release commit:** the script restores the previous package
version, lockfile, and generated schemas automatically. Correct the reported
problem, confirm that `git status --short` is clean, and run the chosen release
command again.

**Release commit and tag remain locally, but npm publication failed:** inspect
the retained commit and tag. After correcting authentication, permissions, or
the reported registry problem, publish that prepared version and push it:

```sh
npm run release:publish
git push --follow-tags
```

Do not run `release:patch`, `release:minor`, or `release:major` again merely to
retry these two steps; that would prepare a different version.

**Release commit exists but tag creation failed:** read the version from
`package.json`, create the matching annotated tag, then continue with
publication and push:

```sh
git tag -a v<version> -m "Release v<version>"
npm run release:publish
git push --follow-tags
```

**npm publication succeeded but Git push failed:** do not publish again. Verify
the published version with `npm view @janga/norna@<version> version`, then retry
`git push --follow-tags`.

If it is unclear whether npm accepted a publish request, check the exact version
with `npm view` before choosing between publication and push recovery.

### 5. Verify A Real Site

After publication, update one real site repository to the exact released
version, commit its `package.json` and `package-lock.json`, and run that site's
normal checks and build. Record any friction in the release backlog before the
next engine release.

## Rendering Notes

The renderer discovers a required homepage at
`site/pages/000-home/content.md`, top-level navigation roots beside Home, and
nested entries under each non-home page or category's `pages/` directory. An
entry with `content.md` is a routable page. An entry with `category.yaml` is a
navigation-only category whose path remains part of descendant URLs.

Navigation has two related levels:

- Global navigation moves between Home and top-level page/category areas. A
  category label targets its first listed descendant page.
- Local navigation follows nested pages, categories, and headings within the
  active area.
  Section links use real `href="#section-id"` anchors so they work without
  JavaScript.

Automatic navigation selects section navigation for one-page sites, top
navigation for shallow page structures, and tree navigation for deeper page or
heading hierarchies. A visible category also requires tree navigation because
it is a disclosure rather than a page destination. `config.yaml` may choose a
compatible mode explicitly. Home is a standalone front door and cannot contain
child pages or categories.

The optional JavaScript enhancement manages menu interaction and active local
navigation while retaining normal links and browser history. The rendered page
tree and anchor navigation remain usable without client-side JavaScript.

The sticky navigation updates a root scroll-offset variable so direct hash
links and clicked links remain visible below the fixed header. The browser owns
anchor movement; Norna does not run a separate scroll animation or retry anchor
positions after later layout shifts.

The shared layout selects Norna's built-in UI labels from the optional
`language` in `site/config.yaml`. Keep editorial content in page Markdown and
non-editorial engine UI labels in the engine language packs.
