# norna

`norna` is a reusable command-line toolchain for small static websites.
It provides the CLI, Astro renderer, validation scripts, image pipeline,
starter project, fixtures, and deploy helpers used by site repositories such as
`www.walde.se`.

Use this repository when you are:

- creating a new site repository from the starter,
- maintaining the reusable `@janga/norna` engine,
- looking up the generic CLI, content, configuration, image, build, or deploy
  behavior.

Site-specific content, domain files, source images, and publication decisions
belong in each site repository. For example, Karin Walde's site lives in
`www.walde.se` and depends on a pinned version of this package.

## Mental Model

A `norna` site is file-driven:

1. A site repository depends on this package.
2. The site keeps technical settings, including public URL and optional URL
   base path, in `site/config.mjs`.
3. The site keeps site-wide visual theme defaults, including layout, image
   sizing, font, typography, palettes, and section surfaces, in `site/theme.md`.
4. The site keeps homepage content, Markdown section order, managed media
   blocks, alt text, captions, and optional section metadata in
   `site/content.md`.
5. Optional route pages live under
   `site/routes/<NNN-route-id>/route-content.md`.
6. Source images live under `site/images/<section-id>/` for the homepage, or
   under `site/routes/<NNN-route-id>/images/<section-id>/` for a route.
7. Static public files live under `site/public/`.
8. `norna` validates the files, prepares managed images, builds static Astro
   pages, and can help publish the committed branch through GitHub Pages.

The default site directory is `site/`. Commands can also use another directory
with `NORNA_SITE_DIR` or `norna --site-dir <path>`. Without an explicit site
directory, commands first accept the current directory when it contains
`config.mjs` and `content.md`; otherwise they walk upward looking for a
`site/` directory with those files.

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
npx @janga/norna@latest init my-site
cd my-site
npm install
npm run dev
```

Run `init` before `npm install`. A new site directory is not a Node project
until the starter has created its `package.json`; running `npm install` in an
empty directory can make npm use a parent project instead. Keep real site
repositories next to this engine repository, not inside it.

The starter pins `@janga/norna` to an exact npm version. Commit the
generated `package-lock.json` in the site repository so local builds and GitHub
Actions use the same engine version.

## Common Tasks

- Create a site: [Getting Started](docs/getting-started.md)
- Understand required site files: [Site Structure](docs/site-structure.md)
- Edit sections and managed media blocks: [Content](docs/content.md)
- Configure a site: [Configuration](docs/configuration.md)
- Publish under a GitHub Pages project path:
  [`site.basePath`](docs/configuration.md#sitebasepath)
- Configure site-wide theme: [Theme](docs/theme.md)
- Add route pages: [Routes](docs/routes.md)
- Set page width: [`layout.pageWidth`](docs/theme.md#layout)
- Set side gutters: [`layout.gutter`](docs/theme.md#layout)
- Set image area width: [`gallery.width`](docs/theme.md#image-sizing)
- Keep images within viewport height:
  [`gallery.maxAvailableHeightPercent`](docs/theme.md#image-sizing)
- Set the site font: [`typography.fontFamily`](docs/theme.md#typography)
- Choose typography presets and overrides: [Typography](docs/typography.md)
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

## License

`norna` is licensed under [GNU GPL v3](LICENSE).

## Documentation

The Norna-built introduction site lives in [`site/`](site/) and is configured
for GitHub Pages at <https://janga.github.io/norna/>.

Start with [docs/README.md](docs/README.md) for the documentation map and
recommended reading order.

Planning and future work are tracked in [BACKLOG.md](BACKLOG.md).

`AGENTS.md` contains operating rules for coding agents. Human-facing product
and workflow documentation should live in this README and `docs/`.
