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

Edit site-wide visual defaults in `site/theme.md`, homepage content and section
overrides in `site/content.md`, technical settings such as URL and locale
labels in `site/config.mjs`, source images under `site/images/<section-id>/`,
and static public files under `site/public/`. The image folder name should
match the section id in Markdown, for example `## Work {#work}` uses
`site/images/work/`.

Use `site.basePath: '/'` for a custom domain or root-hosted site. For a GitHub
Pages project site without a custom domain, set both values:

```js
site: {
	url: 'https://owner.github.io/repository-name/',
	basePath: '/repository-name/',
}
```

In GitHub repository settings, configure Pages to build from GitHub Actions.

Page width, side gutters, layout density, typography rhythm, image width, image
height limits, font, palettes, section surfaces, and site-wide typography are configured in
`site/theme.md`. Page and section presentation overrides live in
`site/content.md`.

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
