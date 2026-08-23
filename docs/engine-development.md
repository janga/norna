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
- `starters/basic/`: copyable site starter.
- `examples/feature-demos/media-and-surfaces/site/`: broad visual example used
  by demo builds and navigation diagnostics.

The repository-local `site/` directory is reserved for a local documentation
site. It is useful for dogfooding `norna` documentation, but it is not the
primary visual regression demo.

## Common Checks

Run focused checks while developing:

```sh
npm run test:content-check
npm run test:site-public
npm run test:documentation
npm run test:fixture:build
npm run test:examples
npm run demo:build
npm run package:check
```

`npm run test:examples` builds every complete site and feature demo under
`examples/`. `npm run test` includes those builds in the standard check
sequence.

`npm run test:documentation` extracts the file examples from the five-minute
tutorial, applies them to a freshly initialized temporary site, runs the
configuration and content checks, builds the result, and checks local Markdown
links plus the `llms.txt` source targets.

`npm run build:pages` is specific to this repository. It builds the
documentation site and assembles rendered examples under `dist/examples/` for
the shared GitHub Pages artifact. It is not a generic Norna site command.

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

The media-and-surfaces feature demo is the broad visual and navigation
diagnostic target:

```sh
node bin/norna.mjs --site-dir examples/feature-demos/media-and-surfaces/site dev:local
npm run demo:build
```

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

The npm package is published under the `@janga` scope. Choose the release type
when starting a release; the command requires a clean working tree, verifies npm
registry authentication for the same registry/cache used by the publish step,
updates `package.json` and `package-lock.json` without creating a commit, and
regenerates schemas with documentation links pinned to the new `v<version>` Git
tag. It then runs `npm test`, verifies that only release files changed, creates
the release commit and Git tag, publishes to npm, and pushes the commit and tag.

```sh
npm run release:patch
```

Use `patch` for backwards-compatible fixes and maintenance changes. Use `minor`
for backwards-compatible features and `major` for incompatible changes:

```sh
npm run release:minor
npm run release:major
```

The release command deliberately does not run GitHub Pages deployment monitoring.
If version preparation, schema generation, or testing fails before the release
commit, the script restores the previous package version and generated schemas.

If npm publication fails, it stops before pushing; the local version commit and
tag remain available for inspection or recovery. Retry publication with
`npm run release:publish`, then push the existing commit and tag with
`git push --follow-tags`. Do not start a new version bump merely to retry these
steps.

If the npm authentication preflight fails, no version commit or tag has been
created yet. Run the printed login command:

```sh
npm login --registry=https://registry.npmjs.org/ --auth-type=web --cache /private/tmp/norna-npm-cache
```

Then start the release command again.

After publication, update site repositories to the exact published npm version
and commit their updated `package-lock.json`.

## Rendering Notes

The renderer builds the homepage at `/` and optional first-level routes from
`site/routes/<NNN-route-id>/content.md`.

Navigation has two separate levels:

- Site navigation moves between pages and routes. It uses normal page URLs and
  browser history.
- Page navigation moves between sections on the current page. It uses real
  `href="#section-id"` links so anchors work without JavaScript.

The current navigation model is deliberately scoped to single-page and small
multi-page sites. That scope may change as route support matures. For now,
single-page sites should rely on page navigation only; small route-based sites
may combine site navigation and page navigation; larger information
architectures should not be forced into the sticky-navigation model without a
separate design decision.

The JavaScript enhancement keeps the URL hash as the source of truth for active
page-navigation state. A section-link click pushes one hash entry into browser
history, back/forward moves between hash entries, and returning to the same page
without a hash restores the first section as active. The enhancement does not
derive active section state from free manual scrolling.

The sticky navigation updates a root scroll-offset variable so direct hash
links and clicked links remain visible below the fixed header. The browser owns
anchor movement; Norna does not run a separate scroll animation or retry anchor
positions after later layout shifts.

The shared layout selects Norna's built-in UI labels from the optional
`language` in `site/config.yaml`. Keep editorial content in page Markdown and
non-editorial engine UI labels in the engine language packs.
