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
|-- pages/
|   |-- 000-home/
|   |   |-- content.md
|   |   `-- images/
|   |       `-- image.jpg
|   `-- 010-guide/
|       |-- content.md
|       |-- theme.yaml
|       |-- images/
|       |   `-- image.jpg
|       `-- pages/
|           `-- 010-installation/
|               `-- content.md
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
| `pages/` | Yes | Homepage, top-level pages, and nested page hierarchies. |

These responsibilities are deliberately separate:

- [`config.yaml`](configuration.md) contains the few technical settings that
  apply to the whole site.
- [`theme.yaml`](theme.md) controls presentation. A normal file can contain
  only a preset selection.
- [`sitewide-content.yaml`](sitewide-content.md) contains editorial material
  shared by every page.
- [`pages/000-home/content.md`](content.md) is the required homepage and remains
  ordinary Markdown. YAML frontmatter is optional.

Pages cannot provide `config.yaml` or `sitewide-content.yaml`. Technical
configuration and shared logo, banner, and footer settings have one site-wide
source.

## Pages

Every page is represented by a directory containing `content.md`. The homepage
is the one reserved page:

```text
site/pages/000-home/content.md
```

It maps to `/`, cannot contain child pages, and appears first in global
navigation. Other directories directly under `site/pages/` are top-level page
roots:

```text
site/pages/010-guide/
|-- content.md
|-- theme.yaml
|-- images/
|   `-- image.jpg
`-- pages/
    `-- 010-installation/
        |-- content.md
        `-- images/
            `-- diagram.svg
```

Nested `pages/` directories create child pages and may continue to further
depths. Each page owns its optional `images/` directory. A page-local
`theme.yaml` may adjust a limited set of presentation properties and is inherited
by descendants; site colors, typography, shape, and navigation remain global.

The three-digit page prefix controls sibling navigation order and is not part
of the URL. See [Pages](pages.md) for hierarchy, URL, navigation, and page-theme
rules. See [Images and Metadata](images-and-metadata.md) for managed files.

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
it contains `config.yaml` and `pages/000-home/content.md`. Otherwise it walks
upward until it finds a default `site/` directory containing those markers.

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
- `site/.norna/.astro/`: site-local Astro cache, generated types, and local
  dev-server state;
- `dist/`: final static website output;
- `.astro/`: legacy Astro cache location, which can be removed after upgrading.

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
