# Project Starter

This is a compact Norna starter for small open source projects, CLI tools,
libraries, and similar project sites.

## Setup

```sh
npm install
npm run dev
```

If the standard local port is blocked, start with:

```sh
npm run dev -- --kill
```

## Files

- `site/config.mjs`: technical settings such as URL, language labels, GitHub
  repository, and deploy workflow.
- `site/theme.md`: site-wide visual settings such as brand text, layout
  density, typography rhythm, colors, frame colors, and inline text styles.
- `site/content.md`: homepage title, sections, placeholders, project summary,
  links, install command, example usage, benefits, next steps, and license.
- `site/routes/010-guide/route-content.md`: short secondary page with realistic
  project guide content.
- `site/public/robots.txt`: static public file copied into the built site.

The starter intentionally does not include generated output, `node_modules`, or
a local Norna installation. It does include `package-lock.json` because the
GitHub Pages workflow uses `npm ci`.

## Adapt The Starter

1. Replace the project name, tagline, links, install command, example usage,
   benefits, use cases, and license in `site/content.md`.
2. Replace the guide examples in `site/routes/010-guide/route-content.md`, or
   delete the route if the homepage is enough.
3. Edit `site/theme.md` for brand name, layout density, typography rhythm,
   colors, frame colors, and inline text styles.
4. Edit `site/config.mjs` for public URL, GitHub repository, footer text, and
   deploy workflow name.
5. Update `package.json` with the site's package name and keep
   `package-lock.json` committed.

## Common Commands

```sh
npm run norna:check
npm run norna:typography:show
npm run build
```

To verify the same install path used by GitHub Pages:

```sh
npm ci
npm run build
```

Generic Norna documentation lives in the Norna repository:

- `docs/getting-started.md`
- `docs/site-structure.md`
- `docs/content.md`
- `docs/theme.md`
- `docs/typography.md`
- `docs/routes.md`
- `docs/configuration.md`
- `docs/commands.md`
