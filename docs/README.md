# norna Documentation

This directory contains the reusable product and engine documentation for
`norna`. The root README is the entry point; these files hold the details.

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
3. [Site Examples Structure Note](site-examples-structure-note.md)
4. [Configuration](configuration.md)
5. [Content](content.md)
6. [Engine Development](engine-development.md)

For a quick reference:

- [Configuration](configuration.md) describes every supported
  `site/config.mjs` field, including `layout.pageWidth`, `layout.gutter`,
  gallery viewport limits, `typography.fontFamily`, validation rule, and
  default.
- [Content](content.md) describes page and route frontmatter, section
  frontmatter, typography presets, site themes, inline styles, temporary
  sections, Markdown section matching, and content validation.
- [Commands](commands.md) lists the public CLI surface and starter npm scripts.
- [Command Organization](command-organization.md) defines command namespaces
  for pure gallery projects, mixed projects, and engine development.
- [Site Structure](site-structure.md) separates versioned source files from
  generated build output.
- [Site Examples Structure Note](site-examples-structure-note.md) defines the
  intended vocabulary for starters, examples, docs sites, reference docs, and
  fixtures before any repository reorganization.

Site repositories should document only their site-specific choices and link here
for generic `norna` behavior.

Planning and future work are tracked in [../BACKLOG.md](../BACKLOG.md).
