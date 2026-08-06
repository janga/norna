---
title: Getting Started
description: Create and run a first Norna site.
navigation:
  label: Getting Started
  order: 10
sections:
  - id: create
    presentation:
      typography:
        preset: statement
  - id: edit
  - id: check-build
---

## Create a site {#create}

Create a new site repository with the published package:

```sh
cd ..
npx @janga/norna@latest init my-gallery
cd my-gallery
npm install
npm run norna:dev
```

Run `init` before `npm install`. A new target directory is not a Node project
until Norna has created its `package.json`.

## Make the first edits {#edit}

Start with the files Norna creates in `site/`:

- edit `site/config.mjs` for URL, layout, language labels, and GitHub settings;
- edit `site/theme.md` for colors, typography preset, inline styles, and frame
  colors;
- edit `site/content.md` for homepage content, section order, galleries, alt
  text, and captions;
- put source images under `site/images/<section-id>/`;
- put static public files under `site/public/`.

Keep content and images close to each other. A section with id `work` normally
uses `site/images/work/`.

## Check and build {#check-build}

Before publishing, run:

```sh
npm run norna:check
npm run norna:build
```

`norna:check` validates configuration and content. `norna:build` generates the
static site.

For GitHub Pages without a custom domain, set the public URL and path prefix in
`site/config.mjs`:

```js
site: {
  url: 'https://owner.github.io/repository-name/',
  basePath: '/repository-name/',
}
```

For a custom domain or root-hosted site, use `basePath: '/'`. The starter also
includes `.github/workflows/deploy.yml`; set GitHub Pages to build from GitHub
Actions before publishing.

Full guide: [docs/getting-started.md](https://github.com/janga/norna/blob/main/docs/getting-started.md)
