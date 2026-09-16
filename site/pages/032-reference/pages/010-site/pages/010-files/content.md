---
page:
  description: Find editable source files, generated output and the files to keep in Git.
---

# Site files

A Norna site is a folder of Markdown, YAML settings and images. Norna builds
those sources into static HTML. Edit the source folder, not the generated HTML.

## Source layout

This reference uses `site/` as the source folder. An asterisk marks a required
file or directory:

```text title="Source files"
site/
|-- config.yaml *          # Public URL and technical settings
|-- theme.yaml *           # Preset and visual overrides
|-- sitewide-content.yaml  # Shared notices, footer and logo height
|-- pages/ *
|   `-- 000-home/ *        # Home has no child pages
|       |-- content.md *   # One H1 followed by the page content
|       `-- images/        # This page's image files
`-- public/               # Files copied unchanged, such as favicon.ico
```

Use these exact lowercase names for portability between file systems.
`CNAME`, used by GitHub Pages, is a separate uppercase convention.

The project normally also contains `package.json`, `package-lock.json` and
`.github/workflows/deploy.yml` outside `site/`. They select the dependency,
npm scripts and publishing workflow.

## Page folders

Additional pages sit beside Home; children sit in their parent's `pages/`:

```text title="A page with a child"
site/pages/
|-- 000-home/content.md
`-- 010-guide/
    |-- content.md
    |-- images/
    `-- pages/
        `-- 010-install/content.md
```

A group without editorial text uses `category.yaml` instead of `content.md`.
[Pages and categories](/reference/site/pages/) explains this choice and names.

`config.yaml` and `sitewide-content.yaml` apply only at the root. A `theme.yaml`
may also appear in a page or category folder, but accepts only
[limited inherited overrides](/reference/configuration/theme/#page-themes).

## Generated files

| Location | Purpose | Keep in Git? |
| --- | --- | --- |
| Markdown, YAML, images and `public/` | Editable sources | Yes |
| `package.json` and `package-lock.json` | Requested and resolved versions | Yes |
| `site/.norna/generated-images.json` | Image hashes and output metadata | Yes |
| `site/.norna/public/` | Prepared files and image variants | No |
| `site/.norna/.astro/` and `site/.norna/dev/` | Build and preview state | No |
| `dist/` | Completed static website | No |

Norna can rebuild generated output. Keep the starter's `.gitignore`; older
project-level `.astro/` output should also remain ignored. Each selected site
has its own generated state. The usual `dist/` is beside `site/`.

## Select another source folder

```sh title="Build presentation/ instead of site/"
npm exec -- norna --site-dir presentation build
```

The global option and `NORNA_SITE_DIR` environment variable choose a source
folder, not a setting in `config.yaml`. [Command invocation](/reference/commands/invocation/#site-selection)
gives the lookup rules, including commands run from inside a site.
