# Norna Documentation

The [Norna introduction site](https://janga.github.io/norna/) explains what the
tool is for. Its [Getting Started](https://janga.github.io/norna/getting-started/install-norna/)
guide begins by installing Norna and previewing a first site, then continues with
[page structure](https://janga.github.io/norna/getting-started/grow-your-site/)
and [publishing](https://janga.github.io/norna/getting-started/build-and-publish/).
These Markdown files are the versioned reference for exact file contracts,
syntax, defaults, commands, and troubleshooting.

## Start Here

1. [Install Norna](https://janga.github.io/norna/getting-started/install-norna/)
   begins the Getting Started guide with installation, the first edit, a visual
   preset, and the local check.
   Continue with [Grow Your Site](https://janga.github.io/norna/getting-started/grow-your-site/)
   and [Build And Publish](https://janga.github.io/norna/getting-started/build-and-publish/)
   when those tasks become relevant.
2. [Site Files](site-files.md) is the canonical map of every source file,
   convention-based directory, and generated location.
3. [Content](content.md) and [Pages and Categories](pages.md) define the exact
   Markdown and page-tree rules behind the introduction.
4. [Requirements and limitations](requirements.md) lists required software and
   current product boundaries.
5. [VS Code Editor Support](editor-support.md) explains project-local YAML,
   Markdown, and image assistance.
6. [Examples](../examples/README.md) pairs complete and focused source projects
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
|   `-- 010-guides/
|       |-- category.yaml
|       `-- pages/
|           `-- 010-installation/
|               `-- content.md
`-- public/
```

- [`config.yaml`](configuration.md): public URL, language, navigation model,
  and native browser scroll behavior.
- [`theme.yaml`](theme.md): complete visual presets, structured content-block
  defaults, and focused presentation overrides.
- [`sitewide-content.yaml`](sitewide-content.md): shared logo display settings,
  banners, and footer.
- [`pages/`](pages.md): Home, routable pages, navigation-only categories,
  ordering, nesting, and URLs.
- [`content.md`](content.md): the content file inside every page directory,
  containing its title, optional metadata, sections, prose, notes, and blocks.
- [`category.yaml`](pages.md#navigation-categories): a label for a group of
  child pages when the group should not produce a page of its own.
- [`images/`](images-and-metadata.md): managed images kept inside the page that
  references them, plus variants, sync, and generated image state.
- [`public/`](public-files.md): navigation logos, favicons, and other static
  source files copied without managed-image processing.
- [Generated files](site-files.md#generated-files): `site/.norna/public/`,
  `site/.norna/.astro/`, `dist/`, and the generated sitemap.

The [complete Site Files reference](site-files.md) explains which paths are
required, optional, convention-discovered, versioned, or generated.

## Common Workflows

### Create And Run A Site

- [Create a standalone site](https://janga.github.io/norna/getting-started/install-norna/#create)
- [Add Norna to an existing Node project](https://janga.github.io/norna/faq/#add-norna-to-an-existing-project)
- [Start and manage local preview](local-development.md)
- [Inspect or update the installed engine](commands.md#command-summary)
- [Migrate an older site model](upgrading.md)

### Write Content

- [Write page sections](content.md#sections)
- [Use image stacks, carousels, and cards](content.md#norna-blocks)
- [Add notes to prose](content.md#markdown-text)
- [Add a page or navigation category](pages.md#create-pages-and-categories)
- [Understand generated navigation](pages.md#navigation)
- [Add shared banners or footer content](sitewide-content.md)
- [Use project-local VS Code help](editor-support.md)

### Work With Images And Public Assets

- [Add managed source images](images-and-metadata.md#managed-source-images)
- [Check and sync moved image references](content.md#validation-and-sync)
- [Add a navigation logo](public-files.md#navigation-logo)
- [Add browser icons](public-files.md#browser-icons)
- [Add other static files](public-files.md#other-static-files)
- [Understand the generated sitemap](public-files.md#generated-sitemap)

### Change Presentation

- [Choose a complete theme preset](theme.md#theme-presets)
- [Configure palettes and Appearance](theme.md#palette-and-appearance)
- [Understand and configure reader Display choices](theme.md#reader-display-controls)
- [Inspect and override a preset](theme.md#overrides)
- [Adjust limited presentation for a page subtree](theme.md#page-themes)
- [Adjust typography](typography.md)
- [Understand engine-owned presentation guarantees](presentation-guarantees.md)

### Check, Build, And Publish

- [Run configuration and content checks](commands.md#starter-npm-scripts)
- [Build and inspect generated output](site-files.md#generated-files)
- [Publish through GitHub Pages](publishing.md#github-pages-workflow)
- [Monitor or troubleshoot deployment](publishing.md)

## Explanation

- [Install Norna](https://janga.github.io/norna/getting-started/install-norna/)
  introduces the first local workflow in the Getting Started guide.
- [Grow Your Site](https://janga.github.io/norna/getting-started/grow-your-site/)
  introduces files, sections, images, and page hierarchies as the site grows.
- [Client-side JavaScript](client-javascript.md) identifies static features,
  progressively enhanced navigation, and features that require browser-side
  behavior.
- [Presentation Guarantees](presentation-guarantees.md) describes the contrast,
  focus, typography, reflow, and user-preference baseline owned by the engine.
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
- [Upgrading](upgrading.md): pre-1.0 file-model migration and routine engine
  updates.

## Troubleshooting

- [Frequently asked questions](https://janga.github.io/norna/faq/)
- [Manage and restart local preview](local-development.md#manage-preview)
- [Rebuild a stale preview](local-development.md#rebuild-stale-preview)
- [Check ImageMagick and other requirements](requirements.md)
- [Validate and sync content](content.md#validation-and-sync)
- [Troubleshoot VS Code IntelliSense](editor-support.md#troubleshooting)
- [Inspect publishing failures](publishing.md)
- [Report a reproducible problem](https://github.com/janga/norna/issues)

## Engine Contributors

Start with [Engine Development](engine-development.md). Use the
[npm release runbook](engine-development.md#npm-release) when publishing an
engine version. Design documents live under [`docs/design/`](design/), and
planned work is tracked in [BACKLOG.md](../BACKLOG.md). Follow the
[Documentation Style Guide](design/documentation-style-guide.md) when naming or
describing public concepts, configuration, commands, diagnostics, or editor
help.

## AI-Readable Access

The documentation source is Markdown and can be read directly from this
repository. The published site also exposes
[`llms.txt`](https://janga.github.io/norna/llms.txt), which links AI tools to
the authoritative Markdown entry points rather than duplicating them.

Norna is licensed under [GNU GPL v3](../LICENSE).
