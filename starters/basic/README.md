# norna Starter

This is a minimal site repository starter for `@janga/norna`.

## Setup

```sh
npm install
npm run dev
```

If the standard local port is blocked, start with:

```sh
npm run dev -- --kill
```

Edit shared brand, logo, banners and footer in `site/sitewide-content.md`,
site-wide visual defaults in `site/theme.md`, homepage content and section
metadata in `site/content.md`, and technical settings such as URL and locale
in `site/config.md`. Keep source images under `site/images/<section-id>/`
and static public files under `site/public/`. The image folder name should
match the section id in Markdown, for example `## Work {#work}` uses
`site/images/work/`.

For a GitHub Pages project site without a custom domain, include the repository
path in the public URL:

```yaml
---
url: https://owner.github.io/repository-name/
---
```

Norna derives `/repository-name/` as the base path. Use a root URL such as
`https://example.com/` for a custom domain or root-hosted site.

In GitHub repository settings, configure Pages to build from GitHub Actions.

Page width, side gutters, layout density, typography rhythm, image width, image
height limits, font, palettes, section surfaces, and site-wide typography are
configured in `site/theme.md`. A route may replace that visual theme with its
own `theme.md`.

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

This keeps Norna commands separate from repository-specific build or publishing
commands in projects that embed a Norna site inside a larger GitHub project.
This pure starter also keeps `npm run build` as an alias for
`npm run norna:build`.

Use `npm run norna:engine:version` to inspect the installed engine and
`npm run norna:engine:update` to update it.

Generic documentation lives in the `norna` repository:

- `docs/getting-started.md`
- `docs/site-structure.md`
- `docs/content.md`
- `docs/theme.md`
- `docs/typography.md`
- `docs/routes.md`
- `docs/configuration.md`
- `docs/commands.md`
- `docs/images-and-metadata.md`
- `docs/publishing.md`
