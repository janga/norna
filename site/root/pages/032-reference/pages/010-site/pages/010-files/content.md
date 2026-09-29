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
|   |-- site-theme.yaml *        # Shared preset and visual overrides
|   `-- shared-content.yaml      # Shared notices, footer and logo height
|-- public/                      # Published site-wide files, such as favicon.ico
`-- root/ *                      # Homepage directory
    |-- content.md *             # Homepage content
    |-- theme.yaml               # Optional homepage-only presentation
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

The files in `site-config/` apply to the complete site. Its required
`site-theme.yaml` sets shared visual defaults. Optional `theme.yaml` beside
`root/content.md` changes only the homepage. A child page's
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

Stop the development server and back up the source folder before changing its
layout. In the immediately preceding format, the homepage and its children
lived directly inside `site/`. Move those page-owned sources together:

| Former location | Current location |
| --- | --- |
| `site/content.md` | `site/root/content.md` |
| Optional `site/theme.yaml` | `site/root/theme.yaml` |
| `site/images/` | `site/root/images/` |
| `site/pages/` | `site/root/pages/` |

Keep `site-config/`, `public/` and generated `.norna/` state at the site level.
Adjust relative source links and YAML schema directives for the additional
folder. Page addresses, ordering and theme scopes remain unchanged.

For older formats, first place shared `config.yaml`, shared `theme.yaml` and
optional `sitewide-content.yaml` in `site-config/` as `settings.yaml`,
`site-theme.yaml` and `shared-content.yaml`. Homepage content, images and its
optional local theme from `pages/000-home/` belong in `root/`; other pages belong
in `root/pages/`. A former homepage-only `page-theme.yaml` becomes
`root/theme.yaml`. Keep shared and page-local themes distinct.

Norna does not provide automatic conversion between these source formats.
`site:upgrade`, including its retained `--apply` option, checks the layout and
reports former locations without changing files. Builds never move sources.
After moving files, run the project's `norna check` and `norna build`, inspect
the result, and commit the changed sources and regenerated image manifest.
Use `--site-dir` when the source folder is not `site/`, then restart the server.
