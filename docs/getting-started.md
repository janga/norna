# Getting Started

This guide creates a new site repository from the included starter. It describes
the generic `norna` setup; site-specific content belongs in the new site
repository.

## Requirements

- Node.js `>=22.12.0`
- ImageMagick for image generation
- GitHub CLI (`gh`) for deploy checks and deploy monitoring

Install Playwright Chromium only when you plan to run navigation diagnostics:

```sh
npx playwright install chromium
```

## Create A Site

### Standalone Site

Use a standalone setup when the website is its own project. Create the site
from the starter first, then install dependencies inside the new site
directory:

```sh
cd path/to/your/projects
npx @janga/norna@latest init my-site
cd my-site
npm install
npm run dev
```

After `npm install`, the project's npm scripts use the project-local `norna`
binary from `node_modules/.bin`. A globally installed `norna` can also be used
as a convenience launcher; inside a project with an installed `@janga/norna`
dependency, it delegates to the project's local version.

A freshly created empty directory is not a `norna` site yet. It becomes a
site when `init` copies the starter files, including `package.json`. If you run
`npm install` in an empty directory, npm may walk up to a parent directory and
install dependencies for another project instead.

For normal site work, keep site repositories as siblings of the `norna`
engine repository. For example:

```text
Projects/
  norna/
  my-site/
```

The starter contains:

- `package.json` with npm scripts that call `norna`
- `.github/workflows/deploy.yml` for GitHub Pages
- `site/config.mjs`
- `site/theme.md`
- `site/sitewide-content.md`
- `site/content.md`
- `site/public/robots.txt`

Commit the generated `package-lock.json` after the first install.

### Embedded Site

Use an embedded setup when a Norna site should live inside an existing Node or
GitHub project:

```sh
cd existing-project
npx @janga/norna@latest init . --type embedded --site-dir presentation
npm install
npm run norna:dev
```

The command looks different because the target is different. `.` means "add
Norna to the current project" instead of creating a new directory.
`--site-dir presentation` tells Norna to manage `presentation/` as the site
directory instead of the default `site/`.

Embedded setup keeps the surrounding project structure. It adds namespaced
`norna:*` scripts so Norna does not take over the project's normal `build`,
`test`, or deploy scripts.

Relevant documentation: [Commands](commands.md), [Site Structure](site-structure.md).

## First Edits

1. Edit `site/config.mjs` for the site's URL, language labels, GitHub
   repository, and deploy settings.
2. Edit `site/sitewide-content.md` for the shared brand or logo, banners and
   footer content.
3. Keep `site/theme.md` and select a complete theme preset. Add focused visual
   overrides only when the preset needs adjustment.
4. Edit `site/content.md` for homepage title, description, Markdown sections,
   text, Norna managed media blocks, alt text, and captions.
5. Put source images under `site/images/<section-id>/`, where `<section-id>`
   matches a `## Section {#section-id}` heading in `site/content.md`.
6. Add optional route pages under
   `site/routes/<NNN-route-id>/route-content.md`, for example
   `site/routes/010-about/route-content.md`.
7. Put static files such as `robots.txt`, `CNAME`, and favicons under
   `site/public/`.
8. Run:

```sh
npm run norna:config:check
npm run norna:content:check
npm run norna:sync
npm run norna:check
npm run build
```

`norna:sync` moves misplaced referenced image files when the intended move is
unambiguous. It can move images between sections and routes, but cross-route
writes require a clean Git working tree so the operation is easy to roll back.
Publishing is normally done by committing the site files and pushing them with
Git; the starter GitHub Pages workflow runs the required checks before
publishing.

Relevant documentation: [Content](content.md), [Theme](theme.md),
[Typography](typography.md), [Routes](routes.md), [Images And Metadata](images-and-metadata.md).

## Choose A Theme

The required root `theme.md` can be deliberately short:

```yaml
---
preset: project
---
```

Available complete presets are `portfolio`, `documentation`, `project`, and
`statement`. They coordinate layout, image sizing, font, typography, spacing,
palette, and section surfaces.

Override only what the site needs to change:

```yaml
---
preset: project
layout:
  pageWidth: 1240px
---
```

Export a commented reference for a preset with:

```sh
npm run norna:theme:export -- project
```

The generated `site/orig-project-theme.md` is reference material and is not
loaded by Norna. The command does not overwrite an existing reference file.

Relevant documentation: [Theme](theme.md), [Typography](typography.md),
[Commands](commands.md).

## Configure The Public URL

For a custom domain or any site published at the web root, use:

```js
site: {
	url: 'https://example.com/',
	basePath: '/',
}
```

For a GitHub Pages project site without a custom domain, the site is served
under the repository name. Configure both values:

```js
site: {
	url: 'https://owner.github.io/repository-name/',
	basePath: '/repository-name/',
}
```

After that, content files may still use root-style internal links such as
`/getting-started/` and `/favicon.svg`. Norna applies `site.basePath` during
rendering so the built links work under the GitHub Pages project path.

The starter includes a GitHub Pages workflow in `.github/workflows/deploy.yml`.
In the GitHub repository settings, configure Pages to build from GitHub
Actions.

Relevant documentation: [Configuration](configuration.md), [Publishing](publishing.md).

Read [Site Structure](site-structure.md), [Content](content.md),
[Theme](theme.md), [Typography](typography.md), [Routes](routes.md), and
[Configuration](configuration.md) before publishing a real site.

To change the site's overall visual expression, select a top-level preset in
`site/theme.md`. Override individual page-width, gutter, image, typography, or
palette values only where needed. See [Theme](theme.md) for the accepted shape.

To give a route a different visual expression, add a route-local `theme.md`
and normally select another complete top-level preset. See
[Theme](theme.md#route-themes) and [Typography](typography.md).
Use `norna typography presets` to inspect the installed preset and rhythm values
and `norna typography show` to inspect the resolved typography for the selected
site.
