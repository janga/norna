# cli-gallery

`cli-gallery` is a reusable command-line toolchain for small static gallery
sites. It provides the CLI, Astro renderer, validation scripts, image pipeline,
starter project, fixtures, and deploy helpers used by site repositories such as
`www.walde.se`.

Use this repository when you are:

- creating a new site repository from the starter,
- maintaining the reusable `@janga/cli-gallery` engine,
- looking up the generic CLI, content, configuration, image, build, or deploy
  behavior.

Site-specific content, domain files, source images, and publication decisions
belong in each site repository. For example, Karin Walde's site lives in
`www.walde.se` and depends on a pinned version of this package.

## Mental Model

A `cli-gallery` site is file-driven:

1. A site repository depends on this package.
2. The site keeps technical settings, including page width, gallery width, and
   the global font family, in `site/config.mjs`.
3. The site can keep site-wide visual theme defaults in `site/theme.md`.
4. The site keeps homepage content, section order, gallery rows, alt text, and
   captions in `site/content.md`.
5. Optional route pages live under
   `site/routes/<route-folder>/route-content.md`.
6. Source images live under `site/images/<section-id>/` for the homepage, or
   under `site/routes/<route-folder>/images/<section-id>/` for a route.
7. Static public files live under `site/public/`.
8. `cli-gallery` validates the files, generates WebP variants, builds static
   Astro pages, and can help publish the committed branch through GitHub Pages.

The default site directory is `site/`. Commands can also use another directory
with `NORNA_SITE_DIR` or `norna --site-dir <path>`.

## Quick Start

For engine development in this repository:

```sh
npm install
npm run dev:local
npm run test:fixture:build
npm run package:check
```

For a new site repository:

```sh
cd ../
npx @janga/cli-gallery@latest init my-gallery
cd my-gallery
npm install
npm run gallery:dev
```

Run `init` before `npm install`. A new site directory is not a Node project
until the starter has created its `package.json`; running `npm install` in an
empty directory can make npm use a parent project instead. Keep real site
repositories next to this engine repository, not inside it.

The starter pins `@janga/cli-gallery` to an exact npm version. Commit the
generated `package-lock.json` in the site repository so local builds and GitHub
Actions use the same engine version.

## Common Tasks

- Create a site: [Getting Started](docs/getting-started.md)
- Understand required site files: [Site Structure](docs/site-structure.md)
- Edit sections and galleries: [Content](docs/content.md)
- Configure a site: [Configuration](docs/configuration.md)
- Configure site-wide theme: [Content](docs/content.md#site-theme)
- Set page width: [`layout.pageWidth`](docs/configuration.md#layoutpagewidth)
- Set side gutters: [`layout.gutter`](docs/configuration.md#layoutgutter)
- Set gallery width: [`gallery.width`](docs/configuration.md#gallerywidth)
- Keep images within viewport height:
  [`gallery.maxAvailableHeightPercent`](docs/configuration.md#gallerymaxavailableheightpercent)
- Set the site font: [`typography.fontFamily`](docs/configuration.md#typographyfontfamily)
- Choose typography presets and overrides: [Content](docs/content.md#typography-presets)
- Look up CLI and npm scripts: [Commands](docs/commands.md)
- Understand generated images: [Images And Metadata](docs/images-and-metadata.md)
- Run local preview: [Local Development](docs/local-development.md)
- Publish a site: [Publishing](docs/publishing.md)
- Work on the engine: [Engine Development](docs/engine-development.md)

## Requirements

- Node.js `>=22.12.0`.
- ImageMagick, either `magick` or the older `identify` and `convert` commands,
  when generating images locally.
- GitHub CLI (`gh`) when using deploy checks or deploy monitoring.
- Playwright Chromium when running navigation diagnostics.

GitHub Pages workflows created from the starter install the image tools during
deployment.

## Documentation

Start with [docs/README.md](docs/README.md) for the documentation map and
recommended reading order.

Planning and future work are tracked in [BACKLOG.md](BACKLOG.md).

`AGENTS.md` contains operating rules for coding agents. Human-facing product
and workflow documentation should live in this README and `docs/`.
