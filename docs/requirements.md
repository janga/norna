# Requirements And Limitations

This page separates requirements for ordinary site work from optional tooling
and current product boundaries.

## Required For Every Site

- Node.js `22.12.0` or later.
- npm or another package manager capable of installing the project-local
  `@janga/norna` dependency. Generated standalone sites use npm scripts and a
  committed `package-lock.json` by default.
- A terminal and a text editor.

## Required For Managed Raster Images

ImageMagick is required when Norna reads raster image dimensions or generates
responsive raster variants. Norna accepts either the current `magick` command
or the older `identify` and `convert` commands.

Static SVG images with an intrinsic aspect ratio are rendered directly and do
not need raster variants. See [Images and Metadata](images-and-metadata.md) for
the supported managed-image behavior.

## Optional Tools

- Git is strongly recommended for reviewing and restoring site changes. It is
  used by the normal commit-and-push publishing workflow.
- GitHub CLI (`gh`) is needed only for Norna's deploy status and monitoring
  helpers.
- Playwright Chromium is needed only for navigation diagnostics used while
  developing the Norna engine.

Neither GitHub CLI nor Playwright is required to edit, preview, check, or build
an ordinary Norna site.

## Current Product Boundaries

- Norna builds generated static output into `dist/`.
- GitHub Pages is the only publishing provider with an included integration.
  Other static hosts can serve the generated files, but Norna does not
  currently configure or publish to them.
- Norna provides its own site model and presentation layer. A project does not
  supply custom page templates, component trees, or rendering logic through
  the normal site interface.
- Norna is intended for content-driven websites. Dynamic applications,
  database-backed publishing, and visual CMS editing are outside its current
  scope.
- Norna is pre-1.0. Breaking changes to files, configuration, and commands may
  occur between releases and should be reviewed before updating a project.

These constraints are part of the product's current scope, not hidden setup
steps. Start with the illustrated
[Getting Started](https://janga.github.io/norna/getting-started/), and use
[`norna engine:version`](commands.md#command-summary) to inspect the version
installed by an existing project.
