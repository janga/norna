# norna Starter

This is a minimal site repository starter for `@janga/norna`.

## Setup

```sh
npm install
npm run norna:dev
```

Edit site-wide theme defaults in `site/theme.md`, homepage content and section
overrides in `site/content.md`, technical settings such as URL, layout, font,
and locale labels in `site/config.mjs`, source images under
`site/images/<section-id>/`, and static public files under `site/public/`.

The page width is configured with `layout.pageWidth`; gallery width is
configured with `gallery.width`. Side margins are configured with
`layout.gutter`; image height is limited with
`gallery.maxAvailableHeightPercent`.

The site font is configured with `typography.fontFamily` in `site/config.mjs`.
Site-wide text presentation is configured with typography presets and overrides
in `site/theme.md`; page and section overrides live in `site/content.md`.

Commit `package-lock.json` after the first install so GitHub Actions can use
`npm ci`.

Use `norna:*` scripts for norna-specific work:

```sh
npm run norna:content:check
npm run norna:sync
npm run norna:typography:presets
npm run norna:typography:show
npm run norna:build
```

This keeps gallery commands separate from repository-specific build or
publishing commands in projects that embed a gallery inside a larger GitHub
project. This pure starter also keeps `npm run build` as an alias for
`npm run norna:build`.

Use `npm run norna:engine:version` to inspect the installed engine and
`npm run norna:engine:update` to update it.

Generic documentation lives in the `norna` repository:

- `docs/getting-started.md`
- `docs/site-structure.md`
- `docs/content.md`
- `docs/configuration.md`
- `docs/commands.md`
- `docs/images-and-metadata.md`
- `docs/publishing.md`
