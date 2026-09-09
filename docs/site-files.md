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
|   `-- 010-guides/
|       |-- category.yaml
|       |-- theme.yaml
|       `-- pages/
|           `-- 010-installation/
|               |-- content.md
|               `-- images/
|                   `-- diagram.svg
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
| `config.yaml` | Yes | Public URL and optional language, local and remote source links, navigation model, static search, and browser scroll behavior. |
| `theme.yaml` | Yes | Complete visual preset and optional focused presentation overrides. |
| `sitewide-content.yaml` | No | Shared logo display settings, banners, and footer. |
| `pages/` | Yes | Homepage plus ordered page and navigation-category hierarchies. |

These responsibilities are deliberately separate:

- [`config.yaml`](configuration.md) contains the few technical settings that
  apply to the whole site.
- [`theme.yaml`](theme.md) controls presentation. A normal file can contain
  only a preset selection.
- [`sitewide-content.yaml`](sitewide-content.md) contains shared banners,
  footer content, and optional logo display settings.
- [`pages/000-home/content.md`](content.md) is the required homepage and remains
  ordinary Markdown. YAML frontmatter is optional.

Page and category directories cannot provide `config.yaml` or
`sitewide-content.yaml`. Technical configuration and shared logo, banner, and
footer settings have one site-wide source.

## Page Hierarchy

Every ordered directory under `site/pages/` contains exactly one marker file:

| Marker | Meaning |
| --- | --- |
| `content.md` | A page with its own H1, content, optional images, and URL. |
| `category.yaml` | A navigation-only category for child pages, with no content or URL of its own. |

The homepage is the one reserved page:

```text
site/pages/000-home/content.md
```

It maps to `/`, cannot contain child pages, and appears first in global
navigation. Other directories directly under `site/pages/` are top-level
navigation entries. This example uses a category because `Guides` needs a
navigation label but no introductory page:

```text
site/pages/010-guides/
|-- category.yaml
|-- theme.yaml
`-- pages/
    `-- 010-installation/
        |-- content.md
        `-- images/
            `-- diagram.svg
```

Nested `pages/` directories may continue to further depths below either kind
of entry. Each page owns its optional `images/` directory; categories cannot
contain images. A limited local `theme.yaml` may appear in a page or category
directory and is inherited by descendant pages. Site colors, typography,
corners, structured content-block defaults, and navigation remain global.

The three-digit prefix controls sibling navigation order and is not part of the
URL. Category ids remain in descendant URLs even though no category page is
generated. See [Pages and Categories](pages.md) for exact marker files,
hierarchy, URL, navigation, commands, and theme inheritance. See
[Images and Metadata](images-and-metadata.md) for managed files.

## Public Files

`site/public/` contains static files copied without image processing. Most
names are site-owned, but Norna recognizes a small set of exact conventional
filenames for the navigation logo, browser icons, and social sharing image. The
root filenames `sitemap.xml` and `404.html` are reserved for generated output
and must not exist in this source directory.

See [Public Files](public-files.md) for navigation-logo, browser-icon, and
social-image filenames, GitHub Pages `CNAME`, arbitrary static files,
root-relative links, publishing paths, the generated sitemap, and the default
missing-page response.

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
  plus generated or copied managed images, `sitemap.xml`, and the most recently
  built `pagefind/` search bundle when search is enabled;
- `site/.norna/.astro/`: site-local Astro cache, generated types, and dev-server
  logs;
- `site/.norna/dev/`: Norna's local dev-server process record;
- `dist/`: final static website output, including generated `404.html` and
  `sitemap.xml` files, plus `/search/` and `pagefind/` when search is enabled;
- `.astro/`: legacy Astro cache location, which can be removed after upgrading.

`norna site:public` removes stale copied static files from
`site/.norna/public/`, preserves managed image output under its `images/`
directory and the most recently built Pagefind bundle when search is enabled,
and regenerates `sitemap.xml` from the current page tree.

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
