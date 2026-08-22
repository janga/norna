# Norna Documentation

Use this page to choose documentation by what you are trying to accomplish.
The [Norna introduction site](https://janga.github.io/norna/) explains the
product; these Markdown files provide the tutorial, task guides, explanation,
and exact reference.

## Start Here

1. [Build your first Norna site](getting-started.md) follows one short path from
   an empty directory to a checked build.
2. [Requirements and limitations](requirements.md) states what must be
   installed and what Norna does and does not support today.
3. [Examples](../examples/README.md) pairs complete and focused source projects
   with their rendered sites.

Do not read the reference from beginning to end before trying Norna. Complete
the tutorial, then use the task links below when a real site needs them.

## How-To Guides

### Create And Run A Site

- [Create a standalone site](getting-started.md#1-create-and-run-the-site)
- [Add Norna to an existing Node project](how-to/embedded-site.md)
- [Start and manage local preview](local-development.md)
- [Inspect or update the installed engine](commands.md#command-summary)

### Write And Organise Content

- [Write page sections](content.md#sections)
- [Use image stacks, carousels, and cards](content.md#managed-media-blocks)
- [Add notes to prose](content.md#markdown-text)
- [Add another page](routes.md)
- [Add shared identity, banners, and a footer](sitewide-content.md)

### Work With Images

- [Add managed source images](images-and-metadata.md#managed-source-images)
- [Place image blocks in Markdown](content.md#managed-media-blocks)
- [Check and sync moved image references](content.md#validation-and-sync)
- [Understand generated variants and SVG handling](images-and-metadata.md#generated-variants-and-static-svg)

### Change The Presentation

- [Choose a complete theme preset](theme.md#theme-presets)
- [Inspect and override a preset](theme.md#overrides)
- [Give a route a different theme](theme.md#route-themes)
- [Adjust typography](typography.md)

### Check, Build, And Publish

- [Run content and configuration checks](commands.md#starter-npm-scripts)
- [Build and inspect generated output](site-structure.md#generated-files)
- [Publish through the included GitHub Pages workflow](publishing.md#github-pages-workflow)
- [Monitor or troubleshoot a deployment](publishing.md)

## Concepts And Explanation

- [Norna's site model](https://janga.github.io/norna/concepts/) explains how
  files, sections, images, and routes become a website.
- [Site Structure](site-structure.md) separates source files, generated files,
  examples, fixtures, and engine code.
- [Images and Metadata](images-and-metadata.md) explains why Norna manages image
  variants and published URLs.
- [Command Organization](design/command-organization.md) explains the command
  model for standalone sites, embedded sites, and engine development.
- [Site Examples Structure](design/site-examples-structure.md) explains the
  difference between starters, examples, documentation sites, and fixtures.

## Reference

- [Configuration](configuration.md): `site/config.md` fields and defaults.
- [Sitewide Content](sitewide-content.md): shared identity, banners, and footer.
- [Content](content.md): page frontmatter, sections, blocks, notes, and checks.
- [Theme](theme.md): presets, overrides, layout, image sizing, and surfaces.
- [Typography](typography.md): typography roles, rhythms, and inspection.
- [Routes](routes.md): directory names, route IDs, URLs, and route images.
- [Images and Metadata](images-and-metadata.md): source formats, variants, and
  generated manifests.
- [Commands](commands.md): CLI commands, npm scripts, options, and exit behavior.
- [Requirements and limitations](requirements.md): runtime dependencies,
  optional tools, and current product boundaries.

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
