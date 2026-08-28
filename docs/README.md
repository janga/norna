# Norna Documentation

The [Norna introduction site](https://janga.github.io/norna/) explains what the
tool is for, and its [Getting Started](https://janga.github.io/norna/getting-started/)
page introduces the workflow with examples and diagrams. These Markdown files
are the versioned reference for exact file contracts, syntax, defaults,
commands, and troubleshooting.

## Start Here

1. [Getting Started](https://janga.github.io/norna/getting-started/) introduces
   installation, page content, file structure, themes, local work, and
   publishing.
2. [Site Files](site-files.md) is the canonical map of every source file,
   convention-based directory, and generated location.
3. [Content](content.md) and [Pages](pages.md) define the exact Markdown and
   page-tree rules behind the introduction.
4. [Requirements and limitations](requirements.md) lists required software and
   current product boundaries.
5. [Examples](../examples/README.md) pairs complete and focused source projects
   with rendered sites.

Use the web introduction to learn the normal path. Open the reference for the
file or workflow you are changing when you need allowed values, defaults,
constraints, command options, or edge-case behavior.

## Site File Reference

Norna expects this top-level source model:

```text
site/
|-- config.yaml
|-- theme.yaml
|-- sitewide-content.yaml
|-- pages/
|   |-- 000-home/
|   |   |-- content.md
|   |   `-- images/
|   `-- 010-guide/
|       `-- content.md
`-- public/
```

- [`config.yaml`](configuration.md): public URL, language, and native browser
  scroll behavior.
- [`theme.yaml`](theme.md): complete visual presets and focused presentation
  overrides.
- [`sitewide-content.yaml`](sitewide-content.md): shared logo display settings,
  banners, and footer.
- [`pages/`](pages.md): Home, top-level areas, nested pages, ordering, and URLs.
- [`content.md`](content.md): the content file inside every page directory,
  containing its title, optional metadata, sections, prose, notes, and blocks.
- [`images/`](images-and-metadata.md): managed images kept inside the page that
  references them, plus variants, sync, and generated image state.
- [`public/`](public-files.md): navigation logos, favicons, and other static
  files copied without managed-image processing.
- [Generated files](site-files.md#generated-files): `site/.norna/public/`,
  `dist/`, and `.astro/`.

The [complete Site Files reference](site-files.md) explains which paths are
required, optional, convention-discovered, versioned, or generated.

## Common Workflows

### Create And Run A Site

- [Create a standalone site](https://janga.github.io/norna/getting-started/#create)
- [Add Norna to an existing Node project](https://janga.github.io/norna/faq/#add-norna-to-an-existing-project)
- [Start and manage local preview](local-development.md)
- [Inspect or update the installed engine](commands.md#command-summary)

### Write Content

- [Write page sections](content.md#sections)
- [Use image stacks, carousels, and cards](content.md#norna-blocks)
- [Add notes to prose](content.md#markdown-text)
- [Add another page](pages.md)
- [Add shared banners or footer content](sitewide-content.md)

### Work With Images And Public Assets

- [Add managed source images](images-and-metadata.md#managed-source-images)
- [Check and sync moved image references](content.md#validation-and-sync)
- [Add a navigation logo](public-files.md#navigation-logo)
- [Add browser icons](public-files.md#browser-icons)
- [Add other static files](public-files.md#other-static-files)

### Change Presentation

- [Choose a complete theme preset](theme.md#theme-presets)
- [Inspect and override a preset](theme.md#overrides)
- [Adjust limited presentation for a page subtree](theme.md#page-themes)
- [Adjust typography](typography.md)

### Check, Build, And Publish

- [Run configuration and content checks](commands.md#starter-npm-scripts)
- [Build and inspect generated output](site-files.md#generated-files)
- [Publish through GitHub Pages](publishing.md#github-pages-workflow)
- [Monitor or troubleshoot deployment](publishing.md)

## Explanation

- [Getting Started](https://janga.github.io/norna/getting-started/) introduces
  files, sections, images, and page hierarchies as the site grows.
- [Images and Metadata](images-and-metadata.md) explains managed variants and
  published URLs.
- [Command Organization](design/command-organization.md) explains standalone,
  embedded, and engine-development command models.
- [Site Examples Structure](design/site-examples-structure.md) distinguishes
  starters, examples, documentation sites, and fixtures.

## Command And Platform Reference

- [Commands](commands.md): CLI commands, npm scripts, and options.
- [Requirements and limitations](requirements.md): runtime dependencies,
  optional tools, and current boundaries.
- [Publishing](publishing.md): GitHub Pages workflow and deploy helpers.

## Troubleshooting

- [Frequently asked questions](https://janga.github.io/norna/faq/)
- [Manage and restart local preview](local-development.md#manage-preview)
- [Rebuild a stale preview](local-development.md#rebuild-stale-preview)
- [Check ImageMagick and other requirements](requirements.md)
- [Validate and sync content](content.md#validation-and-sync)
- [Inspect publishing failures](publishing.md)
- [Report a reproducible problem](https://github.com/janga/norna/issues)

## Engine Contributors

Start with [Engine Development](engine-development.md). Design documents live
under [`docs/design/`](design/), and planned work is tracked in
[BACKLOG.md](../BACKLOG.md).

## AI-Readable Access

The documentation source is Markdown and can be read directly from this
repository. The published site also exposes
[`llms.txt`](https://janga.github.io/norna/llms.txt), which links AI tools to
the authoritative Markdown entry points rather than duplicating them.

Norna is licensed under [GNU GPL v3](../LICENSE).
