# Commands

The `norna` binary is the stable command surface. Site repositories normally
use starter npm scripts such as `npm run norna:content:check`; those scripts
call the local `norna` binary from `node_modules/.bin`.

Installing the npm package exposes the command as `norna` on macOS, Linux, and
Windows through the package `bin` field. When a globally installed `norna` is
started inside a project that declares and has installed its own `@janga/norna`
dependency, the launcher delegates to that project-local version. If no
project-local install is found, the version that was started continues running.

The project-owned `norna:*` npm scripts are the portable default for both
standalone and embedded sites. To use direct commands from an ordinary shell,
install the launcher once:

```sh
npm install --global @janga/norna@latest
```

You can then use commands such as `norna dev`, `norna check`, and
`norna build`. The launcher still delegates to the current project's locally
installed and pinned Norna version.

## CLI Commands

```sh
norna dev:local
norna dev:lan
norna dev:restart
norna dev:status
norna dev:logs
norna dev:stop
norna check
norna config:check
norna content:check
norna content:sync
norna theme:presets
norna theme:export <preset>
norna typography profiles
norna typography show
norna site:public
norna images
norna engine:update [version|latest]
norna engine:version [--latest]
norna init <target-dir> [--type standalone|embedded] [--site-dir <path>]
norna page:add <title> [--parent <path>] [--slug <slug>] [--order <NNN>] [--dry-run]
norna category:add <label> [--parent <path>] [--slug <slug>] [--order <NNN>] [--dry-run]
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

`norna dev` is accepted as an alias for `dev:local`. `norna check` runs the
configuration and content checks in sequence. `help`, `-h`, and `--help` print
usage.

## Starter npm Scripts

The starter uses `norna:*` for norna-specific work. This avoids collisions
when a Norna site is embedded inside a larger GitHub project
whose own `build`, `test`, or deploy scripts mean something different.

The stable project scripts are:

```sh
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
npm run norna:theme:presets
npm run norna:theme:export -- <preset>
npm run norna:typography:profiles
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
```

The standalone starter also provides `npm run dev` and `npm run build` as
convenience aliases. In mixed repositories, such as
a GitHub project that embeds a Norna site next to an app, `build`
should normally mean the repository's complete publishable artifact, while
`norna:build` builds only the `norna` part.

## Create Pages And Categories

`page:add` creates a routable page with `content.md` and `images/`.
`category:add` creates a navigation-only category with `category.yaml` and
`pages/`; the category has no URL of its own.

Use the project-local binary without a global installation:

```sh
npm exec -- norna page:add "About" --parent /
npm exec -- norna category:add "Guides" --parent /
npm exec -- norna page:add "Installation" --parent /guides/
```

With the optional global launcher installed, omit `npm exec --`.

Both commands:

- generate a lowercase ASCII slug from the title or label;
- choose the nearest higher multiple of ten after existing siblings;
- reject a slug or order already used by a sibling page or category;
- accept `--slug` and `--order` when generated values are unsuitable;
- accept `--dry-run` to report the destination without writing it.

`--parent /` selects the top level. A logical path such as
`--parent /guides/` selects an existing page or category. Without `--parent`,
the current directory must be exactly `site/pages/` or an existing page or
category directory; Norna reports an error instead of guessing from another
directory.

See [Pages and Categories](pages.md#create-pages-and-categories) for generated
files, URL behavior, transliteration, ordering, and the complete structural
contract.

## Command Summary

- `doctor`: prints resolved engine root, site project root, site directory,
  content/config/image/public paths, generated manifest, Astro output paths, and
  cache path.
- `config:check`: validates root configuration, the root and page/category
  themes, `sitewide-content.yaml`, navigation and section-background
  compatibility, and convention-based logo/public filenames. It also prints
  the resolved site URL and main presentation settings.
- `check`: runs `config:check` followed by `content:check`.
- `content:check`: validates the page hierarchy, required H1 titles, heading
  ids, frontmatter, Norna blocks, managed-image references, inline notes, and
  common content mistakes. It reports all discovered issues before exiting and
  never moves files.
- `content:sync`: moves misplaced referenced image files when the intended move
  is unambiguous. It shows the complete move plan and asks for confirmation
  before writing; pass `--yes` to accept the displayed plan without a prompt.
  A failed move reports completed and remaining work so the command can be run
  again. Moves between different filesystems must be completed manually. The
  starter npm wrapper is `npm run norna:sync`.
- `theme:presets`: lists the available complete theme presets and explains the
  intended use of each one.
- `theme:export <preset>`: writes a protected, commented
  `orig-<preset>-theme.yaml` reference under the selected site directory. The
  available complete theme presets are `portfolio`, `documentation`,
  `project`, and `statement`. Norna continues to load only `theme.yaml`.
- `typography profiles`: prints the exact built-in values for typography
  profiles and rhythms.
- `typography show`: prints the selected site's resolved typography for the
  root theme, every page, and every section. Each value identifies the profile,
  rhythm, or root override that supplied it.
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
- `init <target-dir> [--type standalone|embedded] [--site-dir <path>]`: creates a
  standalone site project from the packaged starter, or adds a Norna site
  directory plus `norna:*` scripts to an existing project in embedded mode.
  Standalone setup pins `@janga/norna` to the version that created it.
- `page:add <title>`: creates one complete page directory at the selected
  parent. It writes an H1 and an `Introduction` H2 starter to `content.md`, and
  creates `images/`.
- `category:add <label>`: creates one non-routable navigation category at the
  selected parent. It writes `category.yaml` and creates `pages/`.
- `build`: runs config check, content check, public sync, image generation, and
  Astro build.
- `build:local`: runs `build` and restarts `dev:local`.
- `dev:local`: syncs public files, prepares managed images, and starts Astro dev
  in background mode on `localhost:4321`. Pass `--kill` to stop an identifiable
  process that is blocking the standard port before starting; when listener
  information is unavailable, stop that process manually.
- `dev:lan`: starts the same server on all local network interfaces and prints
  the IPv4 URL to open from another device on the same network. Stop it after
  testing because it is accessible to that local network.
- `dev:restart`, `dev:status`, `dev:logs`, `dev:stop`: manage the local dev
  server tracked under `site/.norna/.astro/`.
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
monitored. See [Watch A Deploy](publishing.md#watch-a-deploy) for each option's
effect and default.
