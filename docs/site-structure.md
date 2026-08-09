# Site Structure

A `norna` site repository owns the content and configuration for one
published site. The engine repository owns the reusable CLI and renderer.

## Default Layout

The selected site directory defaults to `site/`:

```text
site/
|-- config.mjs
|-- theme.md
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
`theme.md` is optional; omit it to use the engine's built-in visual defaults.

## Versioned Source Files

Version these files in a site repository:

- `site/config.mjs`: technical site configuration.
- `site/theme.md`: optional site-wide visual theme, including layout, spacing,
  image sizing, font, typography defaults, colors, inline styles, and frame
  colors.
  See [Theme](theme.md).
- `site/content.md`: homepage page file with editable content, section
  definitions, image rows, alt text, and captions. See [Content](content.md).
- `site/images/<section-id>/`: original source images.
- `site/routes/<NNN-route-id>/route-content.md`: optional route page files.
  See [Routes](routes.md).
- `site/routes/<NNN-route-id>/images/<section-id>/`: original source images
  for that route page.
- `site/public/`: site-specific static public files.
- `site/.norna/generated-images.json`: generated image manifest used to
  decide whether WebP variants can be reused.
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
- `starters/basic/` is copied by `norna init <target-dir>` to create a
  site repository.
- `fixtures/basic/site/` is used by engine regression tests.
- `examples/dog-gallery/site/` is the local visual dog example used by demo
  builds and navigation diagnostics.
- `site/` is reserved for the local documentation site.
