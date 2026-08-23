# Norna Documentation

The [Norna introduction site](https://janga.github.io/norna/) explains what the
tool is for. These Markdown files are the authoritative tutorial, workflow
guides, and reference.

## Start Here

1. [Build your first Norna site](getting-started.md) follows one short path from
   an empty directory to a checked build.
2. [Site Files](site-files.md) is the canonical map of every source file,
   convention-based directory, and generated location.
3. [Requirements and limitations](requirements.md) lists required software and
   current product boundaries.
4. [Examples](../examples/README.md) pairs complete and focused source projects
   with rendered sites.

Do not read the reference from beginning to end before trying Norna. Complete
the tutorial, then open the reference for the file or workflow you are changing.

## Site File Reference

Norna expects this top-level source model:

```text
site/
|-- config.yaml
|-- theme.yaml
|-- sitewide-content.yaml
|-- content.md
|-- images/
|-- routes/
`-- public/
```

- [`config.yaml`](configuration.md): public URL, language, and native browser
  scroll behavior.
- [`theme.yaml`](theme.md): complete visual presets and focused presentation
  overrides.
- [`sitewide-content.yaml`](sitewide-content.md): shared navigation identity,
  banners, and footer.
- [`content.md`](content.md): page metadata, sections, prose, notes, and Norna
  blocks.
- [`images/`](images-and-metadata.md): managed source formats, variants, sync,
  and generated image state.
- [`routes/`](routes.md): additional pages, ordering, URLs, route themes, and
  route-local images.
- [`public/`](public-files.md): navigation logos, favicons, and other static
  files copied without managed-image processing.
- [Generated files](site-files.md#generated-files): `site/.norna/public/`,
  `dist/`, and `.astro/`.

The [complete Site Files reference](site-files.md) explains which paths are
required, optional, convention-discovered, versioned, or generated.

## Common Workflows

### Create And Run A Site

- [Create a standalone site](getting-started.md#1-create-and-run-the-site)
- [Add Norna to an existing Node project](how-to/embedded-site.md)
- [Start and manage local preview](local-development.md)
- [Inspect or update the installed engine](commands.md#command-summary)

### Write Content

- [Write page sections](content.md#sections)
- [Use image stacks, carousels, and cards](content.md#norna-blocks)
- [Add notes to prose](content.md#markdown-text)
- [Add another page](routes.md)
- [Add shared banners or footer content](sitewide-content.md)

### Work With Images And Public Assets

- [Add managed source images](images-and-metadata.md#managed-source-images)
- [Check and sync moved image references](content.md#validation-and-sync)
- [Add a navigation logo](public-files.md#navigation-logo)
- [Add favicons](public-files.md#logos-and-favicons)
- [Add other static files](public-files.md#other-static-files)

### Change Presentation

- [Choose a complete theme preset](theme.md#theme-presets)
- [Inspect and override a preset](theme.md#overrides)
- [Give a route a different theme](theme.md#route-themes)
- [Adjust typography](typography.md)

### Check, Build, And Publish

- [Run configuration and content checks](commands.md#starter-npm-scripts)
- [Build and inspect generated output](site-files.md#generated-files)
- [Publish through GitHub Pages](publishing.md#github-pages-workflow)
- [Monitor or troubleshoot deployment](publishing.md)

## Concepts And Explanation

- [Norna's site model](https://janga.github.io/norna/concepts/) explains how
  files, sections, images, and routes become a website.
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

- [Common first problems](getting-started.md#common-first-problems)
- [Manage and restart local preview](local-development.md#manage-preview)
- [Rebuild a stale preview](local-development.md#rebuild-stale-preview)
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
