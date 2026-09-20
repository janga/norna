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
|-- page-theme.yaml        # Optional homepage-only presentation
|-- sitewide-content.yaml  # Shared notices, footer and logo height
|-- content.md *           # Homepage: one H1 followed by its content
|-- images/                # Homepage image files
|-- pages/                 # Child pages and categories
`-- public/               # Files copied unchanged, such as favicon.ico
```

Use these exact lowercase names for portability between file systems.
`CNAME`, used by GitHub Pages, is a separate uppercase convention.

The project normally also contains `package.json`, `package-lock.json` and
`.github/workflows/deploy.yml` outside `site/`. They select the dependency,
npm scripts and publishing workflow.

## Page folders

The homepage is the root page. Its children live in `site/pages/`; deeper
children live in their parent's `pages/`:

```text title="A page with a child"
site/
|-- content.md
`-- pages/
    `-- 010-guide/
        |-- content.md
        |-- images/
        `-- pages/
            `-- 010-install/content.md
```

A group without editorial text uses `category.yaml` instead of `content.md`.
[Pages and categories](/reference/site/pages/) explains this choice and names.

`config.yaml` and `sitewide-content.yaml` apply only at the root. Root
`theme.yaml` controls the whole site. Optional root `page-theme.yaml` controls
only the homepage. A child page or category's `theme.yaml` supplies
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


## Convert the former homepage folder

Sites made with the former model keep the homepage under `pages/000-home/`.
After updating Norna, stop the local dev server and preview the conversion:

```sh
norna site:upgrade
norna site:upgrade --apply
norna check
norna build
```

The first command lists the moves without changing files. `--apply` moves the
homepage's `content.md` and `images/` into the site root, and renames its local
`theme.yaml` to root `page-theme.yaml`. The shared root `theme.yaml` and all
child pages stay in place; public page URLs do not change. Generated image
output is rebuilt from the new source locations.

Use the same `--site-dir` selection for preview and apply when the source
folder is not `site/`. Commit the converted sources and generated image
manifest together, then restart the local dev server.

Conversion refuses existing destination files or directories, symbolic links,
extra files in the old homepage folder and non-empty child folders beneath it.
Resolve the reported conflict before applying; Norna does not merge or overwrite
these sources. Running the command on an already converted site changes nothing.
