---
page:
  description: Choose the canonical Norna reference for the file, setting, command, or workflow you need to understand.
---

# Reference documentation

The introductory site teaches the normal Norna workflow. The reference
documentation answers narrower questions precisely: what belongs in a file,
which values are allowed, what happens by default, and which constraints are
enforced.

The reference is maintained as Markdown in the Norna repository. Start with
the subject you are changing rather than reading every document in order.

## Understand the site structure {#structure}

Start with [Site Files](https://github.com/janga/norna/blob/main/docs/site-files.md)
when you are unsure which file owns a setting or where a source asset belongs.
It distinguishes files you maintain from generated output.

Continue with
[Pages And Categories](https://github.com/janga/norna/blob/main/docs/pages.md)
for page directories, ordering, URLs, nesting, navigation categories, and safe
page moves.

## Write content and add images {#content}

[Content](https://github.com/janga/norna/blob/main/docs/content.md) defines page
headings, sections, links, notes, code blocks, image blocks, cards, and content
validation.

[Images And Metadata](https://github.com/janga/norna/blob/main/docs/images-and-metadata.md)
explains where page images belong, how Norna creates responsive output, and how
`content:sync` follows moved references.

[Public Files](https://github.com/janga/norna/blob/main/docs/public-files.md)
covers convention-based files such as the navigation logo, browser icons,
social sharing image, and static files copied without image processing.

## Choose the visual presentation {#presentation}

[Theme](https://github.com/janga/norna/blob/main/docs/theme.md) is the main
reference for presets, palettes, media presentation, reader controls, and
supported overrides.

[Typography](https://github.com/janga/norna/blob/main/docs/typography.md)
defines the built-in type profiles, heading scales, spacing, prose width, and
caption treatment.

[Site-Wide Content](https://github.com/janga/norna/blob/main/docs/sitewide-content.md)
defines shared navigation identity, banners, and footer content.

## Configure and run the site {#operation}

[Configuration](https://github.com/janga/norna/blob/main/docs/configuration.md)
defines the technical settings in `config.yaml`, including language,
navigation, local and remote source links, static search, and anchor scrolling.

[Commands](https://github.com/janga/norna/blob/main/docs/commands.md) lists the
CLI commands and project scripts, including their options and side effects.
Use [Local Development](https://github.com/janga/norna/blob/main/docs/local-development.md)
for preview startup, LAN access, logs, restart, and stale-preview recovery.

## Build and publish {#publishing}

[Publishing](https://github.com/janga/norna/blob/main/docs/publishing.md)
describes the GitHub Pages workflow, custom domains, deployment monitoring, and
publishing failures.

[Requirements And Limitations](https://github.com/janga/norna/blob/main/docs/requirements.md)
lists supported runtimes, external tools, and current product boundaries.

## Maintain the project {#maintenance}

[Upgrading A Site](https://github.com/janga/norna/blob/main/docs/upgrading.md)
explains routine engine updates and migrations between file models.

[VS Code Editor Support](https://github.com/janga/norna/blob/main/docs/editor-support.md)
documents project-local YAML and Markdown assistance, image-name completion,
installation, and troubleshooting.

## Check Norna's guarantees {#guarantees}

[Presentation Guarantees](https://github.com/janga/norna/blob/main/docs/presentation-guarantees.md)
defines the accessibility and readability baseline that themes cannot weaken.

[Client-Side JavaScript](https://github.com/janga/norna/blob/main/docs/client-javascript.md)
identifies which features are static, progressively enhanced, or interactive.

The [complete Markdown index](https://github.com/janga/norna/blob/main/docs/README.md)
also includes contributor and design material. The
[AI-readable index](/llms.txt) provides a compact entry point for tools that
need authoritative source links.
