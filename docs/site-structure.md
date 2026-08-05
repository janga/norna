# Site Structure

A `cli-gallery` site repository owns the content and configuration for one
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
|-- public/
`-- .cli-gallery/
    |-- generated-images.json
    `-- public/
```

Use `CLI_GALLERY_SITE_DIR` or `cli-gallery --site-dir <path>` to select another
site directory. Commands started from a subdirectory walk upward until they find
the selected site directory containing both `config.mjs` and `content.md`.
`theme.md` is also required for rendering and validation, but the upward
directory discovery currently keys on `config.mjs` and `content.md`.

## Versioned Source Files

Version these files in a site repository:

- `site/config.mjs`: technical site configuration.
- `site/theme.md`: site-wide visual theme, inline styles, and frame defaults.
- `site/content.md`: homepage page file with editable content, section
  definitions, gallery rows, alt text, and captions.
- `site/images/<section-id>/`: original source images.
- `site/public/`: site-specific static public files.
- `site/.cli-gallery/generated-images.json`: generated image manifest used to
  decide whether WebP variants can be reused.
- `.github/workflows/deploy.yml`: site-owned GitHub Pages workflow.
- `package.json` and `package-lock.json`: scripts and pinned engine dependency.

## Generated Files

Do not edit these by hand:

- `site/.cli-gallery/public/`: build-preparation output copied from
  `site/public/`, plus generated images.
- `dist/`: final static build output.
- `.astro/`: Astro cache, generated types, and dev-server state.
- `public/`: legacy generated public output from older engine versions.

`site:public` removes stale copied static files under
`site/.cli-gallery/public/` while preserving generated image output under
`site/.cli-gallery/public/images/`.

Favicons are convention-based. Put files such as `favicon.svg`, `favicon.ico`,
`favicon.png`, or `apple-touch-icon.png` in `site/public/`. The renderer emits
icon links only for files that exist.

## Engine Repository Layout

In this repository:

- `bin/cli-gallery.mjs` dispatches public CLI commands.
- `scripts/` contains validation, image, local preview, deploy, and test tools.
- `src/` contains the Astro renderer, components, styles, and content schema.
- `starters/basic/` is copied by `cli-gallery init <target-dir>` to create a
  site repository.
- `fixtures/basic/site/` is used by engine regression tests.
- `site/` is the local dog-gallery demo used by default in this repository.
