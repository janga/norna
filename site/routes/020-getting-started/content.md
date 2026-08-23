---
page:
  title: Getting Started
  description: Create, edit, build and publish your first Norna site.
---

## Create a site {#create}

You need Node.js 22.12 or later. ImageMagick is used when Norna generates image
variants.

### Standalone site

Use this when the website is its own project:

```sh
npx @janga/norna@latest init my-site
cd my-site
npm install
npm run norna:dev
```

The new project contains the Norna site files, npm scripts and setup needed to
build the site.

For a short path with a visible checkpoint after every edit, follow the
[five-minute tutorial](https://github.com/janga/norna/blob/main/docs/getting-started.md).

For a real project, keep the generated lockfile committed so local and automated
builds use the same Norna version.

### Embedded site

Use this when the website should live inside an existing Node project:

```sh
cd existing-project
npx @janga/norna@latest init . --type embedded --site-dir presentation
npm install
npm run norna:dev
```

Here `.` means "add Norna to the current project". `--site-dir presentation`
means the Norna source files will live under `presentation/` instead of the
default `site/`.

Embedded setup keeps the surrounding project structure and uses namespaced
`norna:*` scripts so Norna does not take over the project's normal `build`,
`test`, or deploy scripts.

### Optional shorter commands

The `norna:*` npm scripts work in both standalone and embedded projects. If you
prefer direct commands, install the cross-platform launcher once:

```sh
npm install --global @janga/norna@latest
```

You can then use:

```sh
norna dev
norna check
norna build
```

Inside a project, the launcher uses that project's locally installed and pinned
Norna version. The global package is only the launcher; the project dependency
and lockfile remain the source of its engine version.

Relevant documentation:
[Getting Started](https://github.com/janga/norna/blob/main/docs/getting-started.md),
[Requirements and limitations](https://github.com/janga/norna/blob/main/docs/requirements.md),
[Commands](https://github.com/janga/norna/blob/main/docs/commands.md).

## The site files {#site-files}

```text
site/
  config.yaml
  theme.yaml
  sitewide-content.yaml
  content.md
  routes/
  images/
  public/
```

### Content

`content.md` contains the homepage content and its sections. Its frontmatter
keeps page metadata together under `page`:

```yaml
page:
  title: My first Norna site
  description: A website built from plain files.
```

`page.title` names the page and its route link. `page.description` is optional
and is used as the page's HTML meta description, not as visible page content.

Additional pages live under `routes/`.

Routes are listed in site navigation by default. A public route can opt out:

```yaml
navigation:
  listed: false
```

### Presentation

`theme.yaml` is required and normally selects a complete visual preset. Focused
values in the same file can override the preset.

### Shared site content

`sitewide-content.yaml` contains shared banners, footer content and optional
display settings for a convention-based navigation logo. Navigation text and
logo alternative text come from the homepage `page.title`.

```yaml
logo:
  height: 2rem
```

The `logo` block only changes the displayed height of a supported logo file in
`site/public/`; it does not select or enable the file.

### Configuration

`config.yaml` contains the public URL and optional language and smooth scrolling.
Norna derives the base path from the URL and discovers GitHub repository details
when a deploy command runs.

### Assets

`images/` contains source images.

`public/` contains static files copied into the site, including the
convention-based navigation logo and browser icons, `robots.txt`, or a `CNAME`
file.

These files are the interface you normally work with. The website implementation
itself is provided by Norna.

Relevant documentation:
[Site Files](https://github.com/janga/norna/blob/main/docs/site-files.md),
[Public Files](https://github.com/janga/norna/blob/main/docs/public-files.md),
[Content](https://github.com/janga/norna/blob/main/docs/content.md),
[Theme](https://github.com/janga/norna/blob/main/docs/theme.md),
[Configuration](https://github.com/janga/norna/blob/main/docs/configuration.md).

## Choose a theme {#theme}

Norna includes four complete theme presets. Each one coordinates layout, image
sizing, font and typography, spacing, palette and section surfaces:

- `portfolio` for restrained, image-led presentation
- `documentation` for reading and technical explanation
- `project` for compact project and product sites
- `statement` for short content that needs a stronger editorial voice

A complete site theme can therefore be this short:

```yaml
preset: documentation
```

Add only the values that should differ from the preset:

```yaml
preset: documentation
layout:
  pageWidth: 1320px
palette: dark
```

To inspect a preset before overriding it, export a commented reference file:

```sh
npm run norna:theme:export -- documentation
```

This creates `site/orig-documentation-theme.yaml`. Norna does not load that file;
only `theme.yaml` is active. The command refuses to overwrite an existing
reference file.

A route can select a different complete preset in its own optional `theme.yaml`.
The route theme replaces the root visual theme for that route, while the shared
logo display settings remain site-wide.

Relevant documentation:
[Theme](https://github.com/janga/norna/blob/main/docs/theme.md),
[Typography](https://github.com/janga/norna/blob/main/docs/typography.md),
[Routes](https://github.com/janga/norna/blob/main/docs/routes.md),
[Commands](https://github.com/janga/norna/blob/main/docs/commands.md).

## Work locally and build {#workflow}

### Work locally

```sh
npm run norna:dev
```

Edit the source files while the development server is running. You normally do
not edit generated website code or create a separate template/component layer.

<!-- norna-image-provenance:
image: local-workflow.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to show the
local edit-and-preview loop and the check before committing.
-->

```norna-image-stack
- image: local-workflow.svg
  alt: Edit the site files and preview locally in a repeating loop. Run the local checks when the result is ready.
  caption: Local workflow: edit and preview until the site is ready, then run the local checks before committing.
```

### Check and build

During local work, run the combined check or the focused commands:

```sh
npm run norna:check
npm run norna:config:check
npm run norna:content:check
npm run norna:sync
```

`config:check` validates technical configuration. `content:check` validates
content, sections and managed image references. `norna:sync` helps keep image
files aligned when content moves between sections or routes. Cross-route sync
requires a clean Git working tree before files are moved, so the operation is
easy to roll back.

Before publishing, validate and build the site:

```sh
npm run norna:check
npm run norna:build
```

Norna reads the source files, validates them, processes images when needed and
creates the static website in:

```text
dist/
```

Treat `dist/` as generated output.

Do not edit it as the source of the site.

Relevant documentation:
[Commands](https://github.com/janga/norna/blob/main/docs/commands.md),
[Images And Metadata](https://github.com/janga/norna/blob/main/docs/images-and-metadata.md).

## Publish and project setup {#publish}

### Publish

Norna currently provides integrated publishing for GitHub Pages.

GitHub Pages is the only integrated publishing target today.

The starter includes the GitHub Actions setup needed to build the site and
publish the generated `dist/` output.

Publishing is normally done by committing the site files and pushing them with
Git. The included GitHub Pages workflow runs the required checks before
publishing.

<!-- norna-image-provenance:
image: publishing-workflow.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to show that
the included GitHub workflow automatically checks, builds and publishes after a
push.
-->

```norna-image-stack
- image: publishing-workflow.svg
  alt: Commit the site and push to GitHub. The included GitHub workflow automatically checks, builds and publishes the site to GitHub Pages.
  caption: Publishing workflow: push committed changes to GitHub, where the included workflow checks, builds and publishes to GitHub Pages automatically.
```

Other static hosting services can technically serve static files, but Norna does
not currently provide publishing integrations for them.

More publishing integrations may be added in the future.

Detailed GitHub Pages publishing documentation:
[docs/publishing.md](https://github.com/janga/norna/blob/main/docs/publishing.md).

Relevant documentation:
[Publishing](https://github.com/janga/norna/blob/main/docs/publishing.md),
[Configuration](https://github.com/janga/norna/blob/main/docs/configuration.md).

### Next

- [Concepts](/concepts/)
- [Examples](/examples/)
- [Full documentation](https://github.com/janga/norna/tree/main/docs)
