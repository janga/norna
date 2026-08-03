# Commands

The `cli-gallery` binary is the stable command surface. The starter's npm
scripts are thin aliases around these commands.

## CLI Commands

```sh
cli-gallery dev:local
cli-gallery dev:lan
cli-gallery dev:restart
cli-gallery dev:status
cli-gallery dev:logs
cli-gallery dev:stop
cli-gallery config:check
cli-gallery content:check
cli-gallery content:sync
cli-gallery typography:presets
cli-gallery typography:show
cli-gallery site:public
cli-gallery images
cli-gallery engine:update [version|latest]
cli-gallery engine:version [--latest]
cli-gallery init <target-dir> [--type pure|embedded] [--site-dir <path>]
cli-gallery build
cli-gallery build:local
cli-gallery deploy
cli-gallery deploy:commit
cli-gallery deploy:watch
cli-gallery preview
cli-gallery astro
cli-gallery doctor
```

Global options:

```sh
cli-gallery --site-dir <path> <command>
cli-gallery --help
```

`cli-gallery dev` is accepted as an alias for `dev:local`. `help`, `-h`, and
`--help` print usage.

## Starter npm Scripts

The starter uses `gallery:*` for gallery-specific work. This avoids collisions
when a `cli-gallery` presentation is embedded inside a larger GitHub project
whose own `build`, `test`, or deploy scripts mean something different.

The starter defines:

```sh
npm run dev
npm run gallery:dev
npm run gallery:dev:lan
npm run gallery:dev:restart
npm run gallery:dev:status
npm run gallery:dev:logs
npm run gallery:dev:stop
npm run gallery:check
npm run gallery:config:check
npm run gallery:content:check
npm run gallery:sync
npm run gallery:typography:presets
npm run gallery:typography:show
npm run gallery:public
npm run gallery:images
npm run gallery:build
npm run gallery:build:local
npm run gallery:deploy
npm run gallery:deploy:commit
npm run gallery:deploy:watch
npm run gallery:doctor
npm run gallery:preview
npm run gallery:engine:update
npm run gallery:engine:version
npm run build
```

`npm run dev` calls `npm run gallery:dev`. In the pure starter,
`npm run build` aliases `npm run gallery:build`. In mixed repositories, such as
a GitHub project that embeds a gallery presentation next to an app, `build`
should normally mean the repository's complete publishable artifact, while
`gallery:build` builds only the `cli-gallery` part.

## Command Summary

- `doctor`: prints resolved engine root, site project root, site directory,
  content/config/image/public paths, generated manifest, Astro output paths, and
  cache path.
- `config:check`: validates `site/config.mjs` against the runtime config
  reader.
- `content:check`: validates section structure and gallery references, then
  runs `astro sync`.
- `content:sync` / `gallery:sync`: rewrites Markdown section order and moves misplaced referenced
  image files after confirmation.
- `typography:presets`: prints the exact built-in values for every typography
  preset.
- `typography:show`: prints the selected site's resolved typography after
  applying the default preset, site overrides, and section overrides.
- `site:public`: copies `site/public/` into `site/.cli-gallery/public/` and
  removes stale copied static files.
- `images`: generates WebP variants and writes
  `site/.cli-gallery/generated-images.json`.
- `engine:update [version|latest]`: updates the site repository's
  `@janga/cli-gallery` dependency with `npm install --save-exact`, normalizes
  `package-lock.json` for the pinned GitHub Actions Linux/npm environment, and
  verifies it with `npm ci --dry-run` before running config/content/build checks.
  Use `--skip-checks` to skip only the site checks; lockfile normalization and
  CI verification still run. Unless npm already has a cache configured, it uses
  `node_modules/.cache/cli-gallery-npm` in the site project.
- `engine:version [--latest]`: prints the declared site dependency, installed
  engine version, engine root, Astro dependency, and installed Astro version.
  With `--latest`, it also asks npm for the latest published engine version.
- `init <target-dir> [--type pure|embedded] [--site-dir <path>]`: creates a
  pure gallery project from the packaged starter, or adds a gallery source
  directory plus `gallery:*` scripts to an existing project in embedded mode.
  Pure setup pins `@janga/cli-gallery` to the version that created it.
- `build`: runs config check, content check, public sync, image generation, and
  Astro build.
- `build:local`: runs `build` and restarts `dev:local`.
- `dev:local`: starts Astro dev in background mode on `localhost:4321`.
- `dev:lan`: starts the same server on all local network interfaces and prints
  the IPv4 URL to open from another device on the same network. Stop it after
  testing because it is accessible to that local network.
- `dev:restart`, `dev:status`, `dev:logs`, `dev:stop`: manage the local dev
  server tracked under `.astro/`.
- `preview`: runs Astro preview with the `cli-gallery` Astro config.
- `astro`: runs Astro with the `cli-gallery` Astro config.
- `deploy`: builds and publishes an already committed deploy branch.
- `deploy:commit`: older convenience flow that builds, stages allowed site
  changes, commits, pushes, and checks Pages.
- `deploy:watch`: follows a GitHub Pages workflow run.

## Deploy Watch Options

`deploy:watch` accepts:

```sh
--repo <owner/name>
--workflow <name>
--branch <name>
--sha <sha>
--site-url <url>
--interval <duration>
--timeout <duration>
--limit <count>
```

Durations may use `ms`, `s`, or `m`, for example `500ms`, `10s`, or `15m`.
Without `--sha`, the current `HEAD` is monitored.
