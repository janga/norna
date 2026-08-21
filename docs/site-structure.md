# Site Structure

A `norna` site repository owns the content and configuration for one
published site. The engine repository owns the reusable CLI and renderer.

## Default Layout

The selected site directory defaults to `site/`:

```text
site/
|-- config.mjs
|-- theme.md
|-- sitewide-content.md
|-- content.md
|-- images/
|   `-- <section-id>/
|-- routes/
|   `-- <NNN-route-id>/
|       |-- route-content.md
|       `-- images/
|           `-- <section-id>/
|-- public/
`-- .norna/
    |-- generated-images.json
    `-- public/
```

Use `NORNA_SITE_DIR` or `norna --site-dir <path>` to select another
site directory. Without an explicit site directory, commands first accept the
current directory when it contains both `config.mjs` and `content.md`.
Otherwise, commands started from a subdirectory walk upward until they find the
default `site/` directory containing those files.
`theme.md` is required. It can contain only a complete preset selection.

## Versioned Source Files

Version these files in a site repository:

- `site/config.mjs`: technical site configuration.
- `site/theme.md`: required site-wide visual theme. It normally selects a
  complete preset and may add focused layout, image, typography, palette, or
  section-surface overrides.
  See [Theme](theme.md).
- `site/sitewide-content.md`: shared site identity, banners and footer content.
  See [Sitewide Content](sitewide-content.md).
- `site/content.md`: homepage page file with editable content, Markdown
  sections, optional section metadata, managed media blocks, alt text, and
  captions.
  See [Content](content.md).
- `site/images/<section-id>/`: original source images.
- `site/routes/<NNN-route-id>/route-content.md`: optional route page files.
  See [Routes](routes.md).
- `site/routes/<NNN-route-id>/images/<section-id>/`: original source images
  for that route page.
- `site/public/`: site-specific static public files.
- `site/.norna/generated-images.json`: generated image manifest used to
  decide whether WebP variants and copied managed SVG files can be reused.
- `.github/workflows/deploy.yml`: site-owned GitHub Pages workflow.
- `package.json` and `package-lock.json`: scripts and pinned engine dependency.

## Generated Files

Do not edit these by hand:

- `site/.norna/public/`: build-preparation output copied from
  `site/public/`, plus generated images.
- `dist/`: final static build output.
- `.astro/`: Astro cache, generated types, and dev-server state.
- `public/`: legacy generated public output from older engine versions.

`site:public` removes stale copied static files under
`site/.norna/public/` while preserving generated image output under
`site/.norna/public/images/`.

Favicons are convention-based. Put files such as `favicon.svg`, `favicon.ico`,
`favicon.png`, or `apple-touch-icon.png` in `site/public/`. The renderer emits
icon links only for files that exist and prefixes them with `site.basePath`
when the site is published below a path such as `/repository-name/`.

## Engine Repository Layout

In this repository:

- `bin/norna.mjs` launches the appropriate installed Norna version.
- `bin/norna-cli.mjs` dispatches public CLI commands.
- `scripts/` contains validation, image, local preview, deploy, and test tools.
- `src/` contains the Astro renderer, components, styles, and content schema.
- `starters/basic/` is the default compact starter copied by
  `norna init <target-dir>`.
- `starters/project/` is a project-site starter used as a maintained example
  for small project and developer-tool sites.
- `fixtures/basic/site/` is used by engine regression tests.
- `examples/feature-demos/media-and-surfaces/site/` is the broad visual example
  used by demo builds and navigation diagnostics.
- `examples/complete-sites/` contains coherent sites, while
  `examples/feature-demos/` contains focused visual test benches.
- `site/` is reserved for the local documentation site.
