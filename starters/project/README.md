# Project Starter

This is a compact Norna starter for small open source projects, CLI tools,
libraries, and similar project sites.

## Setup

```sh
npm install
npm run norna:dev
```

Open the address printed by the development server. Stop it later with
`npm run norna:dev:stop`.

## Files

- `site/site-config/settings.yaml`: public URL and optional language and smooth scrolling.
- `site/site-config/shared-content.yaml`: shared logo display settings, banners, and footer.
- `site/site-config/site-theme.yaml`: the site-wide visual preset and any focused overrides.
- `site/root/content.md`: homepage title, sections, placeholders,
  project summary,
  links, install command, example usage, benefits, next steps, Norna blocks,
  and license.
- `site/root/pages/010-guide/content.md`: short secondary page with realistic
  project guide content.
- `site/public/robots.txt`: static public file copied into the built site.

The starter intentionally does not include generated output, `node_modules`, or
a local Norna installation. It does include `package-lock.json` because the
GitHub Pages workflow uses `npm ci`.

## Adapt The Starter

1. Replace the project name, tagline, links, install command, example usage,
   benefits, use cases, and license in `site/root/content.md`.
2. Replace the guide examples in `site/root/pages/010-guide/content.md`, or
   delete the page if the homepage is enough.
3. Edit `site/site-config/shared-content.yaml` for logo display settings,
   banners, and footer.
4. Select a preset in `site/site-config/site-theme.yaml`. Add focused overrides only when the
   project needs them.
5. Put managed homepage source images in `site/root/images/`. Images
   for another page belong directly in that page's `images/` directory.
6. Edit `site/site-config/settings.yaml` for the public URL and, when needed, language or smooth
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

Start with the [illustrated Getting Started guide](https://janga.github.io/norna/getting-started/install-norna/).
Use the [Norna reference](https://janga.github.io/norna/reference/)
for exact file contracts, syntax, commands, and publishing behavior.
