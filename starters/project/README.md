# Project Starter

This is a compact Norna starter for small open source projects, CLI tools,
libraries, and similar project sites.

## Setup

```sh
npm install
npm run norna:dev
```

If the standard local port is blocked, start with:

```sh
npm run norna:dev -- --kill
```

## Files

- `site/config.yaml`: public URL and optional language and smooth scrolling.
- `site/sitewide-content.yaml`: shared logo display settings, banners, and footer.
- `site/theme.yaml`: site-wide visual settings such as layout density, typography
  rhythm, palettes, section surfaces, and typography.
- `site/content.md`: homepage title, sections, placeholders, project summary,
  links, install command, example usage, benefits, next steps, Norna blocks,
  and license.
- `site/pages/010-guide/content.md`: short secondary page with realistic
  project guide content.
- `site/public/robots.txt`: static public file copied into the built site.

The starter intentionally does not include generated output, `node_modules`, or
a local Norna installation. It does include `package-lock.json` because the
GitHub Pages workflow uses `npm ci`.

## Adapt The Starter

1. Replace the project name, tagline, links, install command, example usage,
   benefits, use cases, and license in `site/content.md`.
2. Replace the guide examples in `site/pages/010-guide/content.md`, or
   delete the page if the homepage is enough.
3. Edit `site/sitewide-content.yaml` for logo display settings,
   banners, and footer.
4. Edit `site/theme.yaml` for layout density, typography rhythm, palette, section
   surfaces, and typography.
5. Put managed homepage source images directly in `site/images/`. Images for
   an additional page belong directly in that page's `images/` directory.
6. Edit `site/config.yaml` for the public URL and, when needed, language or smooth
   scrolling. Deploy commands discover the GitHub repository and default branch.
7. Update `package.json` with the site's package name and keep
   `package-lock.json` committed.

## Common Commands

```sh
npm run norna:check
npm run norna:sync
npm run norna:typography:show
npm run norna:build
```

The standalone aliases `npm run dev` and `npm run build` are also available.
For direct `norna dev`, `norna check`, and `norna build` commands, install the
launcher globally with `npm install --global @janga/norna@latest`; it delegates
to this project's locally installed Norna version.

To verify the same install path used by GitHub Pages:

```sh
npm ci
npm run norna:build
```

Generic Norna documentation lives in the Norna repository:

- `docs/getting-started.md`
- `docs/site-files.md`
- `docs/public-files.md`
- `docs/content.md`
- `docs/theme.md`
- `docs/typography.md`
- `docs/pages.md`
- `docs/configuration.md`
- `docs/commands.md`
