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
npx @janga/norna@latest init my-gallery
cd my-gallery
npm install
npm run norna:dev
```

A freshly created empty directory is not a `norna` site yet. It becomes a
site when `init` copies the starter files, including `package.json`. If you run
`npm install` in an empty directory, npm may walk up to a parent directory and
install dependencies for another project instead.

For normal site work, keep site repositories as siblings of the `norna`
engine repository. For example:

```text
Projects/
  norna/
  my-gallery/
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

1. Edit `site/config.mjs` for the site's URL, layout, font, language labels,
   GitHub repository, footer, and deploy settings.
2. Edit `site/theme.md` for site-wide colors, typography preset, inline styles,
   and frame colors, or omit it to use engine defaults.
3. Edit `site/content.md` for homepage title, description, sections, text,
   gallery rows, page/section presentation overrides, alt text, and captions.
4. Put source images under `site/images/<section-id>/`.
5. Add optional route pages under
   `site/routes/<route-folder>/route-content.md`.
6. Put static files such as `robots.txt`, `CNAME`, and favicons under
   `site/public/`.
7. Run:

```sh
npm run norna:check
npm run build
```

Read [Site Structure](site-structure.md), [Content](content.md), and
[Configuration](configuration.md) before publishing a real site.

To change the site's maximum page width, set `layout.pageWidth` in
`site/config.mjs`. To change side margins, set `layout.gutter`. To change the
maximum gallery width inside that page area, set `gallery.width`. To keep
images within a comfortable viewport height, set
`gallery.maxAvailableHeightPercent`. See [Configuration](configuration.md) for
the accepted formats and default values.

To change the site's font, set `typography.fontFamily` in `site/config.mjs`.
See [`typography.fontFamily`](configuration.md#typographyfontfamily) for the
accepted format and default value.

To change the site-wide typography preset, edit `site/theme.md`. To change one
page or section, add a focused `presentation.typography` override in
`site/content.md`. Use `npm run norna:typography:presets` to inspect the
installed preset values and `npm run norna:typography:show` to inspect the
resolved typography for the selected site.
