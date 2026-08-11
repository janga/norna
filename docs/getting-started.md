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

## Create A Site Repository

Create the site from the starter first, then install dependencies inside the
new site directory:

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
- `site/content.md`
- `site/images/work/.gitkeep`
- `site/public/robots.txt`

Commit the generated `package-lock.json` after the first install.

## First Edits

1. Edit `site/config.mjs` for the site's URL, language labels, GitHub
   repository, footer, and deploy settings.
2. Edit `site/theme.md` for site-wide layout, layout density, typography
   rhythm, image sizing, font, typography preset, colors, inline styles, and
   frame colors, or omit it to use engine defaults.
3. Edit `site/content.md` for homepage title, description, Markdown sections,
   text, Norna image blocks, page/section presentation overrides, alt text, and
   captions.
4. Put source images under `site/images/<section-id>/`.
5. Add optional route pages under
   `site/routes/<NNN-route-id>/route-content.md`, for example
   `site/routes/010-about/route-content.md`.
6. Put static files such as `robots.txt`, `CNAME`, and favicons under
   `site/public/`.
7. Run:

```sh
npm run norna:check
npm run build
```

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
`/getting-started/` and `/workflow.svg`. Norna applies `site.basePath` during
rendering so the built links work under the GitHub Pages project path.

The starter includes a GitHub Pages workflow in `.github/workflows/deploy.yml`.
In the GitHub repository settings, configure Pages to build from GitHub
Actions.

Read [Site Structure](site-structure.md), [Content](content.md),
[Theme](theme.md), [Typography](typography.md), [Routes](routes.md), and
[Configuration](configuration.md) before publishing a real site.

To change the site's maximum page width, side gutters, layout density,
typography rhythm, image width, image height limits, font, colors, or
site-wide typography preset, edit `site/theme.md`. See [Theme](theme.md) for
the accepted shape.

To change one page or section, add a focused `presentation.typography`
override in `site/content.md`. See [Typography](typography.md). Use
`norna typography presets` to inspect the installed preset and rhythm values and
`norna typography show` to inspect the resolved typography for the selected
site.
