# cli-gallery Starter

This is a minimal site repository starter for `@janga/cli-gallery`.

## Setup

```sh
npm install
npm run gallery:dev
```

Edit site-specific content and presentation presets in `site/content.md`,
technical settings such as URL, layout, and font in `site/config.mjs`, source images under
`site/images/<section-id>/`, and static public files under `site/public/`.

The page width is configured with `layout.pageWidth`; gallery width is
configured with `gallery.width`. Side margins are configured with
`layout.gutter`; image height is limited with
`gallery.maxAvailableHeightPercent`.

The site font is configured with `typography.fontFamily` in `site/config.mjs`.
Text presentation is configured with typography presets and overrides in
`site/content.md`.

Commit `package-lock.json` after the first install so GitHub Actions can use
`npm ci`.

Use `gallery:*` scripts for gallery-specific work:

```sh
npm run gallery:content:check
npm run gallery:sync
npm run gallery:typography:presets
npm run gallery:typography:show
npm run gallery:build
```

This keeps gallery commands separate from repository-specific build or
publishing commands in projects that embed a gallery inside a larger GitHub
project. This pure starter also keeps `npm run build` as an alias for
`npm run gallery:build`.

Use `npm run gallery:engine:version` to inspect the installed engine and
`npm run gallery:engine:update` to update it.

Generic documentation lives in the `cli-gallery` repository:

- `docs/getting-started.md`
- `docs/site-structure.md`
- `docs/content.md`
- `docs/configuration.md`
- `docs/commands.md`
- `docs/images-and-metadata.md`
- `docs/publishing.md`
