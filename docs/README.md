# cli-gallery Documentation

This directory contains the reusable product and engine documentation for
`cli-gallery`. The root README is the entry point; these files hold the details.

## Recommended Reading

For a site maintainer:

1. [Getting Started](getting-started.md)
2. [Site Structure](site-structure.md)
3. [Configuration](configuration.md)
4. [Content](content.md)
5. [Images And Metadata](images-and-metadata.md)
6. [Local Development](local-development.md)
7. [Publishing](publishing.md)

For a developer integrating or updating the engine:

1. [Commands](commands.md)
2. [Command Organization](command-organization.md)
3. [Configuration](configuration.md)
4. [Content](content.md)
5. [Engine Development](engine-development.md)

For a quick reference:

- [Configuration](configuration.md) describes every supported
  `site/config.mjs` field, including `layout.pageWidth`, `layout.gutter`,
  gallery viewport limits, `typography.fontFamily`, validation rule, and
  default.
- [Commands](commands.md) lists the public CLI surface and starter npm scripts.
- [Command Organization](command-organization.md) defines command namespaces
  for pure gallery projects, mixed projects, and engine development.
- [Site Structure](site-structure.md) separates versioned source files from
  generated build output.

Site repositories should document only their site-specific choices and link here
for generic `cli-gallery` behavior.
