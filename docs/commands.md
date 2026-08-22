# Commands

The `norna` binary is the stable command surface. Site repositories normally
use starter npm scripts such as `npm run norna:content:check`; those scripts
call the local `norna` binary from `node_modules/.bin`.

Npm installation exposes the command as `norna` on macOS, Linux, and Windows
through the package `bin` field. When a globally installed `norna` is started
inside a project that declares and has installed its own `@janga/norna`
dependency, the launcher delegates to that project-local version. If no
project-local install is found, the version that was started continues running.

Use direct `norna ...` commands only when the binary is on your shell `PATH`,
inside an npm script, or through `npm exec -- norna ...`.

## CLI Commands

```sh
norna dev:local
norna dev:lan
norna dev:restart
norna dev:status
norna dev:logs
norna dev:stop
norna config:check
norna content:check
norna content:sync
norna theme:export <preset>
norna typography presets
norna typography show
norna site:public
norna images
norna engine:update [version|latest]
norna engine:version [--latest]
norna init <target-dir> [--type pure|embedded] [--site-dir <path>]
norna build
norna build:local
norna deploy
norna deploy:commit
norna deploy:watch
norna preview
norna astro
norna doctor
```

Global options:

```sh
norna --site-dir <path> <command>
norna --help
```

`norna dev` is accepted as an alias for `dev:local`. `help`, `-h`, and
`--help` print usage.

## Starter npm Scripts

The starter uses `norna:*` for norna-specific work. This avoids collisions
when a Norna site is embedded inside a larger GitHub project
whose own `build`, `test`, or deploy scripts mean something different.

The starter defines:

```sh
npm run dev
npm run norna:dev
npm run norna:dev:lan
npm run norna:dev:restart
npm run norna:dev:status
npm run norna:dev:logs
npm run norna:dev:stop
npm run norna:check
npm run norna:config:check
npm run norna:content:check
npm run norna:sync
npm run norna:theme:export -- <preset>
npm run norna:typography:presets
npm run norna:typography:show
npm run norna:public
npm run norna:images
npm run norna:build
npm run norna:build:local
npm run norna:deploy
npm run norna:deploy:commit
npm run norna:deploy:watch
npm run norna:doctor
npm run norna:preview
npm run norna:engine:update
npm run norna:engine:version
npm run build
```

`npm run dev` calls `npm run norna:dev`. In the pure starter,
`npm run build` aliases `npm run norna:build`. In mixed repositories, such as
a GitHub project that embeds a Norna site next to an app, `build`
should normally mean the repository's complete publishable artifact, while
`norna:build` builds only the `norna` part.

## Command Summary

- `doctor`: prints resolved engine root, site project root, site directory,
  content/config/image/public paths, generated manifest, Astro output paths, and
  cache path.
- `config:check`: validates `site/config.md` against the runtime config
  reader.
- `content:check`: validates section structure, managed media references,
  inline styles, and common content mistakes.
- `content:sync` / `norna:sync`: moves misplaced referenced image files after
  confirmation when the intended move is unambiguous. Moving files between the
  homepage and routes, or between routes, requires a clean Git working tree.
- `theme:export <preset>`: writes a protected, commented
  `orig-<preset>-theme.md` reference under the selected site directory. The
  available complete theme presets are `portfolio`, `documentation`,
  `project`, and `statement`. Norna continues to load only `theme.md`.
- `typography presets`: prints the exact built-in values for typography
  presets and rhythms.
- `typography show`: prints the selected site's resolved typography for the
  theme, every page route, and every section. Each value includes its source,
  and inherited page or section values are marked with `inherited: true`.
- `site:public`: copies `site/public/` into `site/.norna/public/` and
  removes stale copied static files.
- `images`: generates WebP variants for raster images, copies managed SVG
  images, and writes `site/.norna/generated-images.json`.
- `engine:update [version|latest]`: updates the site repository's
  `@janga/norna` dependency with `npm install --save-exact`, normalizes
  `package-lock.json` for the pinned GitHub Actions Linux/npm environment, and
  verifies it with `npm ci --dry-run` before running config/content/build checks.
  Use `--skip-checks` to skip only the site checks; lockfile normalization and
  CI verification still run. Unless npm already has a cache configured, it uses
  `node_modules/.cache/norna-npm` in the site project.
- `engine:version [--latest]`: prints the declared site dependency, installed
  engine version, engine root, Astro dependency, and installed Astro version.
  With `--latest`, it also asks npm for the latest published engine version.
- `init <target-dir> [--type pure|embedded] [--site-dir <path>]`: creates a
  standalone site project from the packaged starter, or adds a Norna site
  directory plus `norna:*` scripts to an existing project in embedded mode.
  Pure setup pins `@janga/norna` to the version that created it.
- `build`: runs config check, content check, public sync, image generation, and
  Astro build.
- `build:local`: runs `build` and restarts `dev:local`.
- `dev:local`: starts Astro dev in background mode on `localhost:4321`. Pass
  `--kill` to stop processes that are blocking the standard port before
  starting.
- `dev:lan`: starts the same server on all local network interfaces and prints
  the IPv4 URL to open from another device on the same network. Stop it after
  testing because it is accessible to that local network.
- `dev:restart`, `dev:status`, `dev:logs`, `dev:stop`: manage the local dev
  server tracked under `.astro/`.
- `preview`: runs Astro preview with the `norna` Astro config.
- `astro`: runs Astro with the `norna` Astro config.
- `deploy`: discovers the GitHub repository and default branch, then builds and
  publishes the already committed branch.
- `deploy:commit`: older convenience flow that builds, stages allowed site
  changes, commits, pushes, and checks Pages.
- `deploy:watch`: follows the included `deploy.yml` GitHub Pages workflow run.

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
Without repository and branch options, Norna discovers the current GitHub
repository and its default branch. Without `--sha`, the current `HEAD` is
monitored.
