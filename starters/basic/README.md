# norna Starter

This is a minimal site repository starter for `@janga/norna`.

## Setup

```sh
npm install
npm run norna:dev
```

If the standard local port is blocked, start with:

```sh
npm run norna:dev -- --kill
```

Edit shared logo settings, banners, and footer in
`site/sitewide-content.yaml`,
site-wide visual defaults in `site/theme.yaml`, homepage content and section
metadata in `site/pages/000-home/content.md`, and technical settings such as URL
and locale in `site/config.yaml`. Keep managed homepage source images under
`site/pages/000-home/images/` and static public files under `site/public/`.

For a GitHub Pages project site without a custom domain, include the repository
path in the public URL:

```yaml
url: https://owner.github.io/repository-name/
```

Norna derives `/repository-name/` as the base path. Use a root URL such as
`https://example.com/` for a custom domain or root-hosted site.

In GitHub repository settings, configure Pages to build from GitHub Actions.

Page width, side gutters, content spacing, image sizing, palette, corners, and
site-wide typography are configured in `site/theme.yaml`. A page may use a
limited `theme.yaml` for local text width, content spacing, managed-image
sizing, and section background pattern.

Commit `package-lock.json` after the first install so GitHub Actions can use
`npm ci`.

Use `norna:*` scripts for norna-specific work:

```sh
npm run norna:content:check
npm run norna:sync
npm run norna:typography:profiles
npm run norna:typography:show
npm run norna:build
```

This keeps Norna commands separate from repository-specific build or publishing
commands in projects that embed a Norna site inside a larger GitHub project.
This standalone starter also keeps `npm run dev` and `npm run build` as aliases.

For direct `norna dev`, `norna check`, and `norna build` commands, install the
launcher globally with `npm install --global @janga/norna@latest`. The launcher
still selects this project's locally installed Norna version.

Use `npm run norna:engine:version` to inspect the installed engine and
`npm run norna:engine:update` to update it.

Generic documentation lives in the `norna` repository:

- `docs/README.md`
- `docs/site-files.md`
- `docs/public-files.md`
- `docs/content.md`
- `docs/theme.md`
- `docs/typography.md`
- `docs/pages.md`
- `docs/configuration.md`
- `docs/commands.md`
- `docs/images-and-metadata.md`
- `docs/publishing.md`
