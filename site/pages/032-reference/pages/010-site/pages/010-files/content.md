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
|-- content.md *                 # Homepage content
|-- theme.yaml                   # Optional homepage-only presentation
|-- site-config/
|   |-- settings.yaml *          # Public URL and technical settings
|   |-- site-theme.yaml *        # Shared preset and visual overrides
|   `-- shared-content.yaml      # Shared notices, footer and logo height
|-- images/                      # Homepage image files
|-- public/                      # Files copied unchanged, such as favicon.ico
`-- pages/                       # Child pages and categories
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

The files in `site-config/` apply to the complete site. Its required
`site-theme.yaml` sets shared visual defaults. Optional `theme.yaml` beside
root `content.md` changes only the homepage. A child page or category's
`theme.yaml` supplies [limited inherited overrides](/reference/configuration/theme/#page-themes)
for that branch. `public/` contains published files, rather than configuration.

## Generated files

| Location                                     | Purpose                           | Keep in Git? |
| -------------------------------------------- | --------------------------------- | ------------ |
| Markdown, YAML, images and `public/`         | Editable sources                  | Yes          |
| `package.json` and `package-lock.json`       | Requested and resolved versions   | Yes          |
| `site/.norna/generated-images.json`          | Image hashes and output metadata  | Yes          |
| `site/.norna/public/`                        | Prepared files and image variants | No           |
| `site/.norna/.astro/` and `site/.norna/dev/` | Build and preview state           | No           |
| `dist/`                                      | Completed static website          | No           |

Norna can rebuild generated output. Keep the starter's `.gitignore`; older
project-level `.astro/` output should also remain ignored. Each selected site
has its own generated state. The usual `dist/` is beside `site/`.

## Select another source folder

```sh title="Build presentation/ instead of site/"
npm exec -- norna --site-dir presentation build
```

The global option and `NORNA_SITE_DIR` environment variable choose a source
folder, not a setting in `site-config/settings.yaml`. [Command invocation](/reference/commands/invocation/#site-selection)
gives the lookup rules, including commands run from inside a site.


## Convert the former source layout {#convert-the-former-homepage-folder}

Earlier sites keep `config.yaml`, the shared `theme.yaml`, and optional
`sitewide-content.yaml` directly in the site root. After updating Norna, stop
the local dev server and preview the conversion:

```sh
norna site:upgrade
norna site:upgrade --apply
norna check
norna build
```

The first command lists changes without writing files. `--apply` performs them:

| Former location | Current location |
| --- | --- |
| `config.yaml` | `site-config/settings.yaml` |
| Shared root `theme.yaml` | `site-config/site-theme.yaml` |
| `sitewide-content.yaml` | `site-config/shared-content.yaml` |
| Homepage-only `page-theme.yaml` | Root `theme.yaml` |

The same command also supports the older homepage at `pages/000-home/`. It
moves that page's `content.md`, `images/` and optional `theme.yaml` into the
root. Descendant page themes retain their scope; public page URLs do not
change. Relative YAML schema directives are adjusted to retain their targets;
other source bytes are preserved. Builds never move source files.

Use the same `--site-dir` selection for preview and apply when the source
folder is not `site/`. Commit the converted sources and any regenerated image
manifest together, then restart the local dev server.

Conversion refuses conflicting destinations, mixed configuration layouts,
symbolic links, extra files in the old homepage folder and non-empty child
folders beneath that old homepage. Resolve the reported conflict before
applying; Norna does not merge or overwrite these sources. A failed apply
attempts to restore the original layout and reports any recovery that needs
manual attention. Running the command on an already converted site changes
nothing.
