# Site Files

Norna expects a defined set of files and directories. Their names and locations
are part of the site model: following the structure lets Norna find content,
presentation, configuration, pages, and assets without path configuration.

The selected site directory is `site/` by default:

```text
site/
|-- config.yaml
|-- theme.yaml
|-- sitewide-content.yaml
|-- content.md
|-- images/
|   `-- image.jpg
|-- pages/
|   `-- <NNN-page-id>/
|       |-- content.md
|       |-- theme.yaml
|       `-- images/
|           `-- image.jpg
|-- public/
`-- .norna/
    |-- generated-images.json
    `-- public/
```

File and directory names shown literally above must use that exact lowercase
spelling. This keeps sites portable between case-sensitive and
case-insensitive file systems.

## Root Files

| Path | Required | Responsibility |
| --- | --- | --- |
| `config.yaml` | Yes | Public URL, language, and browser scroll behavior. |
| `theme.yaml` | Yes | Complete visual preset and optional focused overrides. |
| `sitewide-content.yaml` | No | Shared logo display settings, banners, and footer. |
| `content.md` | Yes | Homepage title, optional metadata, sections, prose, and Norna blocks. |

These responsibilities are deliberately separate:

- [`config.yaml`](configuration.md) contains the few technical settings that
  apply to the whole site.
- [`theme.yaml`](theme.md) controls presentation. A normal file can contain
  only a preset selection.
- [`sitewide-content.yaml`](sitewide-content.md) contains editorial material
  shared by every page.
- [`content.md`](content.md) is the homepage file and remains ordinary
  Markdown. YAML frontmatter is optional.

Pages cannot provide `config.yaml` or `sitewide-content.yaml`. Technical
configuration and shared logo, banner, and footer settings have one site-wide
source.

## Images

Managed homepage images belong in:

```text
site/images/
```

All managed images used by the homepage share this directory. Markdown blocks
refer to managed images by filename, not by path. See
[Images and Metadata](images-and-metadata.md) for supported formats, generated
variants, and syncing.

## Pages

Each first-level page is one directory under `pages/`:

```text
site/pages/010-guide/
|-- content.md
|-- theme.yaml
`-- images/
    `-- image.jpg
```

`content.md` is required for a page. The optional page `theme.yaml` replaces
the root visual theme for that page. Page images live directly in that page's
`images/` directory.

The three-digit page prefix controls navigation order and is not part of the
URL. See [Pages](pages.md) for exact directory-name and page-id rules.

## Public Files

`site/public/` contains static files copied without image processing. Most
names are site-owned, but Norna recognizes a small set of exact conventional
filenames for the navigation logo and browser icons.

See [Public Files](public-files.md) for navigation-logo and browser-icon
filenames, GitHub Pages `CNAME`, arbitrary static files, root-relative links,
and publishing paths.

## Selecting The Site Directory

Use `NORNA_SITE_DIR` or `norna --site-dir <path>` to select a site directory
explicitly.

Without an explicit selection, Norna first accepts the current directory when
it contains both `config.yaml` and `content.md`. Otherwise it walks upward until
it finds a default `site/` directory containing those two files.

## Versioned Files

Version the source files above together with:

- `site/.norna/generated-images.json`, which records reusable managed-image
  output;
- `.github/workflows/deploy.yml`, when using the included GitHub Pages
  publishing integration;
- `package.json` and `package-lock.json`, which pin the local Norna engine and
  project scripts.

Source images and files under `site/public/` are also versioned site input.

## Generated Files

Do not edit these by hand:

- `site/.norna/public/`: build-preparation output copied from `site/public/`,
  plus generated or copied managed images;
- `dist/`: final static website output;
- `.astro/`: Astro cache, generated types, and local dev-server state.

`norna site:public` removes stale copied static files from
`site/.norna/public/` while preserving managed image output under its `images/`
directory.

## Engine Repository Layout

These directories belong to the Norna engine repository, not to an ordinary
site:

- `bin/`: the launcher and public CLI dispatcher;
- `scripts/`: validation, image, preview, publishing, and test tools;
- `src/`: the Astro renderer, components, styles, and content schema;
- `starters/`: source copied by `norna init`;
- `examples/`: complete sites and focused feature demonstrations;
- `fixtures/`: engine regression input;
- root `site/`: the Norna introduction and documentation site.
