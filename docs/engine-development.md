# Engine Development

This document is for work on the reusable `norna` package itself.

## Main Areas

- `bin/norna.mjs`: public CLI dispatcher.
- `scripts/lib/site-paths.mjs`: engine/site path resolution.
- `scripts/lib/project-config.mjs`: `site/config.mjs` validation and defaults.
- `scripts/sync-content-sections.mjs`: content validation and sync behavior.
- `scripts/generate-images.mjs`: WebP image pipeline and manifest.
- `scripts/sync-site-public.mjs`: static public file sync.
- `scripts/deploy-site.mjs`: deploy and deploy:commit behavior.
- `scripts/watch-pages-deploy.mjs`: GitHub Pages workflow monitor.
- `src/content.config.ts`: Astro content schema.
- `src/components/` and `src/layouts/`: rendered page, navigation, gallery, and
  layout.
- `tests/`: Playwright navigation diagnostics.
- `fixtures/basic/site/`: minimal site used for engine checks.
- `starters/basic/`: copyable site starter.

The repository-local `site/` directory is a dog-gallery demo. It is useful for
manual engine checks, but it is not a published site.

## Common Checks

Run focused checks while developing:

```sh
npm run test:content-check
npm run test:site-public
npm run test:fixture:build
npm run demo:build
npm run package:check
```

`npm run test` runs the same set in sequence.

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

## npm Release

The npm package is published under the `@janga` scope. Choose the release type
when starting a release; the command requires a clean working tree, verifies npm
registry authentication for the same registry/cache used by `release:publish`,
runs `npm test`, requires a clean working tree after the checks, updates
`package.json` and `package-lock.json`, creates the release commit and Git tag,
publishes to npm, then pushes the commit and tag.

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
If npm publication fails, it stops before pushing; the local version commit and
tag remain available for inspection or recovery.

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
`site/routes/<route-folder>/route-content.md`.

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

The sticky navigation updates root scroll offset variables so direct hash links
and clicked links land below the fixed header. Hash targets may be corrected
again after layout shifts such as image loading, but that correction must not
add history entries or change the active section independently of the URL hash.

The shared layout reads UI language and labels from `site/config.mjs`
`locale`. Keep editorial content in page Markdown and non-editorial engine UI
labels in config.
