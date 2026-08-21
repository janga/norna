# Build Your First Norna Site

This tutorial takes the shortest path from an empty directory to a running,
edited, and verified Norna site. Follow the steps in order. Installation time
depends on your npm connection, but the site work itself should take about five
minutes.

At the end you will have:

- a standalone site project with a pinned Norna version,
- a homepage with your own content and navigation,
- a complete visual preset,
- validated source files and a static build in `dist/`.

## Before You Start

You need:

- Node.js `22.12` or later,
- npm, which is included with Node.js,
- a terminal and a text editor.

ImageMagick is needed when you add raster images that Norna should process. It
is not needed to make the text-only first edit in this tutorial. GitHub CLI and
Playwright are not required.

See [Requirements and limitations](requirements.md) for platform details and
the current product boundaries.

## 1. Create And Run The Site

Run these commands from the directory where you keep projects:

```sh
npx @janga/norna@latest init my-site
cd my-site
npm install
npm run dev
```

`init` creates the project before `npm install` runs. The generated
`package.json` pins the Norna engine version so this project keeps using the
same version until you update it deliberately.

### Checkpoint: The Starter Is Visible

Open the URL printed by the development server. It is normally
`http://localhost:4321/`, but Norna uses another available port when necessary.
You should see the starter homepage and its section navigation.

Leave the development server running while you complete the next steps.

## 2. Replace The Homepage Content

Replace `site/content.md` with:

```md
---
title: My first Norna site
description: A website built from plain files.
---

## Welcome {#welcome}

This page is written in Markdown. Norna provides its layout and navigation.

## Next {#next}

Edit this file while the development server is running and the browser updates.
```

Each `##` heading is a page section. Its explicit `{#section-id}` gives the
section a stable identity and is required by Norna.

### Checkpoint: Content And Navigation Update

Return to the browser. The page should now contain `Welcome` and `Next`, and
the single-page navigation should link to those two sections. You should not
need to restart the server.

## 3. Set The Shared Brand

Replace `site/sitewide-content.md` with:

```yaml
---
navigation:
  brand: My first Norna site
footer:
  copyrightMessage: My first Norna site.
---
```

The brand and footer are site-wide content rather than page sections. If you
add routes later, they inherit these values.

### Checkpoint: The Brand Is Shared

The navigation should now display `My first Norna site`. The footer should show
the new message.

## 4. Choose A Complete Theme

Replace `site/theme.md` with:

```yaml
---
preset: project
---
```

The preset supplies coordinated layout, typography, spacing, image sizing,
palette, and section surfaces. Add overrides only when a real site needs to
differ from the preset.

### Checkpoint: The Preset Is Active

The browser should refresh with the `project` presentation. Your content files
remain unchanged because presentation belongs in `theme.md`.

## 5. Check And Build

Open another terminal in `my-site` and run:

```sh
npm run norna:check
npm run build
```

The check should complete without errors. The build should create:

```text
dist/
```

`dist/` is generated output. Continue editing the files under `site/`; do not
edit the built HTML as the source of the website.

### Checkpoint: The Source Produces A Clean Build

Confirm that both commands exit successfully and that `dist/index.html`
exists. You now have a complete local Norna workflow: edit, preview, check, and
build.

## What To Do Next

- [Add and manage images](content.md#managed-media-blocks)
- [Add another page](routes.md)
- [Inspect and adjust the theme](theme.md)
- [Configure the public URL](configuration.md)
- [Publish with GitHub Pages](publishing.md)
- [Browse complete and focused examples](../examples/README.md)

To add Norna inside an existing Node project instead of creating a standalone
site, see [Add an embedded site](how-to/embedded-site.md).

The [documentation map](README.md) separates task guides, explanation, and
reference so you can continue from the kind of question you have.

## Common First Problems

### The Default Port Is Occupied

Start the development server with:

```sh
npm run dev -- --kill
```

This tells Norna to stop the process occupying its standard port before
starting. The separator `--` is required so npm forwards `--kill` to Norna.

### Images Fail During Checking Or Building

Install ImageMagick and confirm that either `magick` or the older `identify`
and `convert` commands are available. Then rerun the failed command.

### The Page Reports Invalid Content

Run:

```sh
npm run norna:content:check
```

Read all reported issues before editing. Norna reports file and line context
for invalid sections and managed content blocks. See [Content](content.md) for
the accepted Markdown forms.
