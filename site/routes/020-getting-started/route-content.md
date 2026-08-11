---
title: Getting Started
description: Create, edit, build and publish your first Norna site.
navigation:
  label: Getting Started
---

## Create a site {#create}

You need Node.js 22.12 or later. ImageMagick is used when Norna generates
image variants.

Create a site:

```sh
npx @janga/norna@latest init my-site
cd my-site
npm install
npm run dev
```

The new project contains the Norna site files, npm scripts and setup needed to
build the site.

For a real project, keep the generated lockfile committed so local and
automated builds use the same Norna version.

## Understand the site files {#site-files}

```text
site/
  config.mjs
  theme.md
  content.md
  routes/
  images/
  public/
```

### Content

`content.md` contains the homepage content and its sections.

Additional pages live under `routes/`.

### Presentation

`theme.md` contains site-wide visual defaults such as layout, image sizing,
typography and colors.

### Configuration

`config.mjs` contains technical settings such as public URL, base path,
language labels, footer and GitHub publishing configuration.

### Assets

`images/` contains source images.

`public/` contains static files copied into the site, such as favicons,
`robots.txt` or a `CNAME` file.

These files are the interface you normally work with. The website
implementation itself is provided by Norna.

## Work locally and build {#workflow}

### Work locally

```sh
npm run dev
```

Edit the source files while the development server is running. You normally do
not edit generated website code or create a separate template/component layer.

### Check and build

```sh
npm run norna:check
npm run build
```

Norna validates the source, processes images when needed and creates the
static website in:

```text
dist/
```

Treat `dist/` as generated output.

Do not edit it as the source of the site.

## Publish and project setup {#publish}

### Publish

Norna currently provides integrated publishing for GitHub Pages.

GitHub Pages is the only integrated publishing target today.

The starter includes the GitHub Actions setup needed to build the site and
publish the generated `dist/` output.

Other static hosting services can technically serve static files, but Norna
does not currently provide publishing integrations for them.

More publishing integrations may be added in the future.

Detailed GitHub Pages publishing documentation:
[docs/publishing.md](https://github.com/janga/norna/blob/main/docs/publishing.md).

### Standalone or embedded

The normal setup creates a dedicated site project:

```sh
npx @janga/norna@latest init my-site
```

Norna can also add a site to an existing Node project:

```sh
npx @janga/norna@latest init . --type embedded --site-dir presentation
```

The surrounding project keeps its own structure while Norna manages the
selected site directory and adds namespaced npm commands.

### Next

- [Concepts](/concepts/)
- [Examples](/examples/)
- [Full documentation](https://github.com/janga/norna/tree/main/docs)
