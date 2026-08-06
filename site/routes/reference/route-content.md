---
title: Reference
description: Links to Norna technical reference documentation.
navigation:
  label: Reference
  order: 40
sections:
  - id: docs
    presentation:
      typography:
        preset: statement
  - id: commands
  - id: development
---

## Technical reference {#docs}

The web introduction explains the model. The exact reference lives in Markdown
so it stays useful on GitHub and for coding agents.

Start here:

- [Documentation map](https://github.com/janga/norna/blob/main/docs/README.md)
- [Getting started](https://github.com/janga/norna/blob/main/docs/getting-started.md)
- [Site structure](https://github.com/janga/norna/blob/main/docs/site-structure.md)
- [Content](https://github.com/janga/norna/blob/main/docs/content.md)
- [Theme](https://github.com/janga/norna/blob/main/docs/theme.md)
- [Typography](https://github.com/janga/norna/blob/main/docs/typography.md)
- [Routes](https://github.com/janga/norna/blob/main/docs/routes.md)
- [Configuration](https://github.com/janga/norna/blob/main/docs/configuration.md)
- [Images and metadata](https://github.com/janga/norna/blob/main/docs/images-and-metadata.md)
- [Publishing](https://github.com/janga/norna/blob/main/docs/publishing.md)

## Commands {#commands}

The CLI binary is named `norna`. In site repositories, use the starter npm
scripts; they call the local `norna` binary from `node_modules/.bin`.

```sh
npm run norna:dev
npm run norna:check
npm run norna:build
npm run norna:deploy:watch
```

Use the direct CLI form when `norna` is on your shell `PATH`, inside an npm
script, or through `npm exec`:

```sh
npm exec -- norna --help
npm exec -- norna content:check
npm exec -- norna build
```

Command reference:
[docs/commands.md](https://github.com/janga/norna/blob/main/docs/commands.md).

## Engine development {#development}

Work on the reusable package in the engine repository. Use focused tests while
developing and `npm test` before release.

Engine reference:
[docs/engine-development.md](https://github.com/janga/norna/blob/main/docs/engine-development.md).
