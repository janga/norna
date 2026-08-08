---
title: Getting Started
description: Create and understand a first Norna site.
navigation:
  label: Getting Started
  order: 10
sections:
  - id: quickstart
  - id: site-files
  - id: setup
  - id: check-build
---

## Quickstart {#quickstart}

You need Node.js 22.12 or later. ImageMagick is used when Norna generates
image variants.

Create a site:

```sh
npx @janga/norna@latest init my-site
cd my-site
npm install
npm run dev
```

The new project contains the Norna site files, npm scripts and the setup needed
to build the site.

For a real project, keep the generated lockfile committed so local and
automated builds use the same Norna version.

## The site files {#site-files}

A typical Norna site starts here:

```text
site/
  config.mjs
  theme.md
  content.md
  routes/
  images/
  public/
```

### `content.md`

The homepage content and its sections. It can also describe image rows,
captions and other page content.

### `theme.md`

Site-wide visual defaults such as layout, image sizing, typography and colors.

### `config.mjs`

Technical settings such as the public URL, base path, language labels, footer
and GitHub/deployment settings.

### `routes/`

Optional additional pages. Each route is a directory with its own
`route-content.md`, and can have route-specific images and public files much
like the top-level site.

### `images/`

Source images associated with the homepage or individual routes.

### `public/`

Static files that should be published with the site, such as `robots.txt`,
favicons or a `CNAME` file.

## Standalone or embedded {#setup}

The normal setup creates a dedicated site project:

```sh
npx @janga/norna@latest init my-site
```

Norna can also add a site to an existing Node project:

```sh
npx @janga/norna@latest init . --type embedded --site-dir presentation
```

The surrounding project keeps its own structure while Norna manages the
selected site directory and adds its namespaced npm commands.

## Check, build and publish {#check-build}

During normal work, use the development server while editing the source files.

Before publishing, validate and build the site:

```sh
npm run norna:check
npm run build
```

Norna validates the site source, processes images when needed and builds static
output.

The starter workflow can then publish the built site through GitHub Pages. More
detailed build, deployment and command documentation belongs in the reference
documentation rather than on this introductory page.
