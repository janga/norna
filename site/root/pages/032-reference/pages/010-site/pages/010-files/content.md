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
|-- site-config/ *
|   |-- settings.yaml *          # Public URL and technical settings
|   `-- shared-content.yaml      # Shared notices, footer and logo height
|-- public/                      # Published site-wide files, such as favicon.ico
`-- root/ *                      # Homepage directory
    |-- content.md *             # Homepage content
    |-- tree-theme.yaml *        # Required preset and inherited visual settings
    |-- page-theme.yaml          # Optional homepage-only settings
    |-- images/                  # Homepage image files
    `-- pages/                   # Child pages
```

Use these exact lowercase names for portability between file systems.
`CNAME`, used by GitHub Pages, is a separate uppercase convention.

The project normally also contains `package.json`, `package-lock.json` and
`.github/workflows/deploy.yml` outside `site/`. They select the dependency,
npm scripts and publishing workflow.

## Page folders

The site folder is a container for shared files and one required root page.
The homepage is `root/content.md`. The directory name `root/` does not appear
in public URLs. Its children live in `site/root/pages/`; deeper
children live in their parent's `pages/`:

```text title="A page with a child"
site/root/
|-- content.md
`-- pages/
    `-- 010-guide/
        |-- content.md
        |-- images/
        `-- pages/
            `-- 010-install/content.md
```

A parent with only an H1 can still be a useful overview: set
`page.listChildren: true` to append its direct child pages. See
[Pages and child-page lists](/reference/site/pages/).

The files in `site-config/` provide technical settings and shared content.
The required `root/tree-theme.yaml` selects the initial preset. A child's
optional `tree-theme.yaml` modifies its branch's inherited settings; an explicit
`preset` starts a new base. Optional `page-theme.yaml` beside any `content.md`
affects only that page. See [Theme inheritance](/reference/configuration/theme/#page-themes).
`public/` contains published files, rather than configuration.

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

Stop the development server and back up the source folder before changing its
layout. For a site that already has `root/`, apply these theme changes:

| Former location | Current location |
| --- | --- |
| `site/site-config/site-theme.yaml` | `site/root/tree-theme.yaml`; an explicit `preset` is required |
| `site/root/theme.yaml` | `site/root/page-theme.yaml`; homepage only |
| A child's `theme.yaml` | `tree-theme.yaml` in the same page directory; inherited modifications |

Existing local overrides can retain their fields and omit `preset`. If the
shared theme had no preset, choose one and review its defaults; record explicit
overrides for old values you want to preserve. Update schema directives: the
root uses `root-theme.schema.json`, descendant tree themes use `theme.schema.json`,
and page-only themes use `page-theme.schema.json`.

For earlier layouts, also move homepage `content.md`, `images/` and `pages/`
from the site container into `root/`. Homepage sources formerly under
`pages/000-home/` belong in `root/`; its siblings belong in `root/pages/`.
Technical `config.yaml` becomes `site-config/settings.yaml`; shared
`sitewide-content.yaml` becomes `site-config/shared-content.yaml`. Keep
`public/` and generated `.norna/` state at the site level. Adjust relative source
and schema links. Directory moves do not change public page addresses.

Norna does not provide an automatic historical converter. `site:upgrade`,
including its retained `--apply` option, checks the layout and reports former
locations without moving files. Builds never move sources. Run `norna check`
and `norna build`, inspect the result, then commit the changed sources and
regenerated image manifest. Use `--site-dir` when needed and restart the server.
