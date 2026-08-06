# Command Organization

This document defines the naming principles for commands in `cli-gallery`,
gallery site repositories, and GitHub projects that embed a gallery.

The goal is that command names reveal both the action and the scope they affect.
This matters because the same repository can contain a gallery, an app, tests,
and a publishing workflow that should not accidentally share ambiguous command
names.

## Situations

`cli-gallery` commands must be understandable in three situations:

- Pure gallery project: the repository exists only to publish one
  `cli-gallery` site.
- Mixed gallery project: the repository contains another project, such as an
  app or library, and includes a `cli-gallery` presentation as one part of its
  GitHub Pages output.
- Engine development: the repository is `cli-gallery` itself.

## Namespaces

Use these namespaces consistently.

### `gallery:*`

Use `gallery:*` npm scripts in repositories that consume `cli-gallery`.

These scripts operate on a selected gallery source directory. In a pure gallery
project that directory is normally `site/`. In a mixed project it may be a more
specific directory such as `presentation/`, with the script setting
`NORNA_SITE_DIR` or passing `norna --site-dir`.

Examples:

```sh
npm run gallery:dev
npm run gallery:check
npm run gallery:sync
npm run gallery:build
```

Mixed projects must use `gallery:*` for gallery work so names such as `build`,
`test`, and `deploy` can remain under the containing project's control.

Pure gallery projects should also use `gallery:*` as the primary documented
interface. They may provide unprefixed aliases when the alias means the same
thing for the whole repository, for example `npm run build` as an alias for
`npm run gallery:build`.

### Project Commands That Call Gallery Commands

`cli-gallery` does not define a consuming project's unprefixed commands. Names
such as `build`, `test`, and `deploy` belong to the project that consumes the
gallery engine.

Examples:

```sh
npm run build
npm run test
npm run deploy
```

When those project commands need the gallery, they should call `gallery:*`
scripts instead of calling `cli-gallery` directly. That keeps the selected
gallery source directory and other project-specific wrapper behavior in one
place.

In a mixed project, if `npm run build` exists, it should build the project's
complete publishable artifact, not only the gallery. If the project publishes a
GitHub Pages artifact containing both a gallery and an app, `build` should
produce that full artifact and may call `npm run gallery:build` internally.

In a pure gallery project, project commands may be aliases to `gallery:*`
commands because the gallery is the whole project.

### `release:*`

Use `release:*` only in the engine repository.

Examples:

```sh
npm run release:patch
npm run release:minor
npm run release:major
npm run release:publish
```

These commands change or publish the reusable `@janga/cli-gallery` package.
They must not be part of ordinary site repositories.

### Direct CLI Commands

The `cli-gallery` binary is the stable low-level command surface.

Examples:

```sh
cli-gallery content:check
cli-gallery content:sync
cli-gallery build
cli-gallery deploy
```

Npm scripts in site repositories are convenience wrappers around this binary.
Documentation for ordinary site work should prefer the npm scripts because they
can set the correct site directory for the repository.

## Functional Groups

### Install Gallery Software

Creating a new pure gallery project starts outside the target project because
the target does not have a `package.json` yet:

```sh
npx @janga/cli-gallery@latest init my-gallery
cd my-gallery
npm install
```

A mixed project already has its own repository and may have its own
`package.json`. In that situation the gallery dependency should be installed as
part of the existing project setup:

```sh
npm install --save-exact @janga/cli-gallery
```

The mixed project should then add `gallery:*` scripts that point at the chosen
gallery source directory.

Engine development uses ordinary package installation in the engine repository:

```sh
npm install
```

### Upgrade Or Inspect Gallery Software

In a consuming repository, upgrading or inspecting the installed gallery engine
is gallery maintenance, so the preferred namespace is `gallery:*`:

```sh
npm run gallery:engine:version
npm run gallery:engine:update
npm run gallery:engine:update -- 0.2.0
```

These commands update the `@janga/cli-gallery` dependency and lockfile used by
the repository. They do not release the engine package.

In the engine repository, version changes belong to `release:*`:

```sh
npm run release:minor
npm run release:publish
```

### Initialize A Gallery Project Directory

Initialization is a direct CLI operation because it usually happens before a
project has npm scripts:

```sh
npx @janga/cli-gallery@latest init my-gallery
```

The initializer should support two setup modes that share the same `gallery:*`
command vocabulary.

#### Pure Setup

Pure setup creates a new project where the gallery is the whole repository:

```sh
npx @janga/cli-gallery@latest init my-gallery --type pure
```

This should be the default when the target is a new or empty directory.

Pure setup should create:

- a normal gallery source directory, normally `site/`;
- a `package.json` with `gallery:*` scripts;
- unprefixed convenience aliases only when they mean the same thing as the
  whole project, for example `build` as an alias for `gallery:build`;
- the standard GitHub Pages workflow for publishing the gallery.

#### Embedded Setup

Embedded setup adds a gallery to an existing project without taking ownership
of that project's root commands:

```sh
npx @janga/cli-gallery@latest init . --type embedded --site-dir presentation
```

Embedded setup should be selected explicitly, or suggested when the target
already contains a `package.json`.

Embedded setup should create or update only the gallery-owned parts:

- the chosen gallery source directory, for example `presentation/`;
- `@janga/cli-gallery` as a project dependency;
- `gallery:*` scripts that set the selected site directory;
- no unprefixed aliases such as `build`, `test`, `dev`, or `deploy`;
- no project publishing workflow unless the caller explicitly asks for one.

Embedded setup must not overwrite existing npm scripts without explicit user
confirmation. If a needed `gallery:*` script already exists, the initializer
should report the conflict and let the user decide whether to replace it.

### Control The Dev Server

Gallery dev-server commands belong under `gallery:dev:*` in consuming
repositories:

```sh
npm run gallery:dev
npm run gallery:dev:lan
npm run gallery:dev:restart
npm run gallery:dev:status
npm run gallery:dev:logs
npm run gallery:dev:stop
```

The shorter `gallery:dev` starts the normal local server. Subcommands manage
the same server.

In the engine repository, engine/demo development may use the engine's own
unprefixed commands:

```sh
npm run dev:local
npm run dev:lan
```

### Test Configuration And Content

Gallery validation should use `gallery:check` for the normal full check and
more specific commands when a caller needs one part:

```sh
npm run gallery:check
npm run gallery:config:check
npm run gallery:content:check
```

`gallery:check` should run configuration and content checks in the order needed
by the engine.

Project-level tests remain project-owned commands:

```sh
npm run test
```

If a mixed project defines `test`, that command should cover the whole project.
It may call `gallery:check`, but it should not be a hidden synonym for only
gallery validation.

### Inspect Gallery Presentation

Commands that inspect gallery presentation without changing source files use
`gallery:*` in consuming repositories:

```sh
npm run gallery:typography:presets
npm run gallery:typography:show
```

`gallery:typography:presets` shows the built-in typography presets from the
installed engine. `gallery:typography:show` shows the effective typography for
the selected gallery after presets and overrides have been applied.

### Correct Content And Configuration

Commands that modify gallery-owned source files use `gallery:*`:

```sh
npm run gallery:sync
npm run gallery:public
npm run gallery:images
```

`gallery:sync` is the preferred npm wrapper for `cli-gallery content:sync`.
Messages emitted by the engine should mention the direct CLI command and the
starter-style npm wrapper when suggesting a fix.

Configuration edits are normally manual edits to the selected gallery
`config.mjs`, followed by:

```sh
npm run gallery:config:check
```

### Build

In a pure gallery project:

```sh
npm run gallery:build
npm run gallery:build:local
npm run build
```

`gallery:build:local` builds and restarts the local dev server. `build` may
alias `gallery:build` because the gallery is the whole project.

In a mixed project:

```sh
npm run gallery:build
npm run gallery:build:local
npm run build
```

`gallery:build` builds only the gallery. `gallery:build:local` builds the
gallery and restarts the local gallery dev server. If the mixed project defines
`build`, that project command should build the complete publishable artifact,
such as a GitHub Pages output that combines the gallery with an app. It may call
`gallery:build` internally.

In the engine repository:

```sh
npm run build
npm run demo:build
npm run test:fixture:build
```

Engine build commands verify the reusable package, fixtures, or demo site.

### Publish

Gallery deploy helpers belong under `gallery:deploy*` in consuming
repositories:

```sh
npm run gallery:deploy
npm run gallery:deploy:commit
```

Use these only when the gallery is the deployable site or when the containing
project deliberately delegates deployment to the gallery engine.

Mixed projects may instead have project-owned deploy commands:

```sh
npm run deploy
```

Those commands should publish the complete project artifact. If they need the
gallery, they should call `gallery:*` scripts internally.

Engine publishing uses `release:*`, not `gallery:*`:

```sh
npm run release:publish
```

### Monitor Publishing

Gallery Pages monitoring belongs under:

```sh
npm run gallery:deploy:watch
```

Mixed projects may provide a project-owned monitoring command when monitoring
is not specific to the gallery:

```sh
npm run deploy:watch
```

That command should monitor the whole project's publishing workflow. If it needs
gallery-specific deploy settings, it should call `gallery:deploy:watch`.

## Naming Rules

- Use `gallery:*` for every npm script in a consuming repository whose direct
  object is the gallery, its source files, its generated images, its dev server,
  or its engine dependency.
- `cli-gallery` does not define unprefixed project commands such as `build`,
  `test`, and `deploy` in consuming repositories.
- If project commands need gallery behavior, they should call `gallery:*`
  scripts.
- In pure gallery projects, unprefixed project commands may alias `gallery:*`
  commands.
- In mixed projects, unprefixed project commands must not be aliases for only
  the gallery unless the command name makes that scope explicit.
- Use `release:*` only for publishing the reusable engine package.
- Prefer direct `cli-gallery ...` commands in engine docs and diagnostics;
  prefer npm scripts in site-repository docs.
- Do not create separate namespaces for every internal concept. If a command is
  about maintaining the gallery dependency in a consuming repository, keep it
  under `gallery:*`.
