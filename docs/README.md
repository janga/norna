# norna Documentation

This directory contains the reusable product and engine documentation for
`norna`. The root README is the entry point; these files hold the details.

## Recommended Reading

For a site maintainer:

1. [Getting Started](getting-started.md)
2. [Site Structure](site-structure.md)
3. [Configuration](configuration.md)
4. [Content](content.md)
5. [Theme](theme.md)
6. [Typography](typography.md)
7. [Routes](routes.md)
8. [Images And Metadata](images-and-metadata.md)
9. [Local Development](local-development.md)
10. [Publishing](publishing.md)

For a developer integrating or updating the engine:

1. [Commands](commands.md)
2. [Configuration](configuration.md)
3. [Content](content.md)
4. [Theme](theme.md)
5. [Typography](typography.md)
6. [Routes](routes.md)
7. [Engine Development](engine-development.md)

For design and naming principles:

1. [Command Organization](design/command-organization.md)
2. [Site Examples Structure](design/site-examples-structure.md)

For a quick reference:

- [Configuration](configuration.md) describes every supported
  `site/config.mjs` field, including `layout.pageWidth`, `layout.gutter`,
  gallery viewport limits, `typography.fontFamily`, validation rule, and
  default.
- [Content](content.md) describes page frontmatter, section frontmatter,
  galleries, carousels, temporary sections, Markdown section matching, and
  content validation.
- [Theme](theme.md) describes site-wide presentation, page and section
  presentation overrides, frame colors, and inline styles.
- [Typography](typography.md) describes presets, roles, overrides,
  inheritance, and inspection commands.
- [Routes](routes.md) describes route files, slugs, route navigation, and
  route image directories.
- [Commands](commands.md) lists the public CLI surface and starter npm scripts.
- [Site Structure](site-structure.md) separates versioned source files from
  generated build output.

Design documents are intentionally separate from the user reference:

- [Command Organization](design/command-organization.md) defines command
  namespaces for pure gallery projects, mixed projects, and engine development.
- [Site Examples Structure](design/site-examples-structure.md) defines the
  intended vocabulary for starters, examples, documentation sites, reference
  docs, and fixtures.

Site repositories should document only their site-specific choices and link here
for generic `norna` behavior.

`norna` is licensed under [GNU GPL v3](../LICENSE).

Planning and future work are tracked in [../BACKLOG.md](../BACKLOG.md).
