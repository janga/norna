---
title: Norna
description: Build and publish small static websites from files kept in your project repository.
navigation:
  label: Home
  order: 0
sections:
  - id: intro
  - id: links
  - id: create
  - id: idea
  - id: why
  - id: good-fit
  - id: next
  - id: license
---

## Norna - build small static websites from files {#intro}

Norna is an open source CLI for building and publishing small static websites
from files kept in your project repository.

Write content in Markdown, keep visual presentation separate from technical
configuration, add routes and images when needed, and let Norna validate and
build the result as a static website.

The site stays with your project: readable as files, versionable with Git, and
suitable for simple static publishing workflows such as GitHub Pages.

## Project links {#links}

- [GitHub repository](https://github.com/janga/norna)
- [Documentation](https://github.com/janga/norna/tree/main/docs)
- [npm package](https://www.npmjs.com/package/@janga/norna)
- [Issue tracker](https://github.com/janga/norna/issues)

## Create a site {#create}

Create a new Norna site and start the local development server:

```sh
npx @janga/norna@latest init my-site
cd my-site
npm install
npm run dev
```

Norna creates the site project first and pins the engine version used by that
project.

## The idea {#idea}

```text
files
  ↓
Norna
  ↓
static website
```

![Diagram showing Norna site files, including routes, flowing through the Norna CLI into a static website.](/workflow.svg)

A Norna site is made from ordinary project files:

```text
site/
  config.mjs
  theme.md
  content.md
  routes/
  images/
  public/
```

Content, visual defaults and technical configuration remain separate, while
routes and images can be added as the site grows.

## Why Norna? {#why}

### Files are the source of truth

The website lives in files that can be read, edited, reviewed and versioned
together with the rest of the project.

There is no separate content system that has to be kept in sync with the
repository.

### Separate content, presentation and configuration

Editorial content belongs in `content.md`, site-wide visual choices in
`theme.md`, and technical settings in `config.mjs`.

This keeps the different concerns visible without requiring you to assemble
your own site framework.

### Use it standalone or inside an existing project

Norna can create a dedicated site project, or add a Norna site directory to an
existing Node project.

That makes it useful both for independent websites and for project
presentations or documentation that should live beside the code they describe.

### From local files to static publishing

Norna provides commands for local development, validation, image generation,
static builds and GitHub Pages-oriented deployment workflows.

## Good fit for {#good-fit}

Norna is intended for relatively small, mostly static websites where keeping
the site as files is an advantage.

Typical uses include:

- open source and project websites
- lightweight documentation and guides
- portfolios and image-driven presentation sites
- personal websites
- small organisation and information sites
- presentation or documentation sites embedded in existing projects

It is a good fit when a file-driven, versioned workflow is more useful than
introducing a CMS, database or larger web application framework.

## Next steps {#next}

Read [Getting Started](/getting-started/) to create your first site.

Browse the [Documentation](https://github.com/janga/norna/tree/main/docs) for
content, themes, routes, images, commands and publishing.

Visit [GitHub](https://github.com/janga/norna) for the source code and issue
tracker.

## License {#license}

Norna is open source software released under the
[GNU GPL v3](https://github.com/janga/norna/blob/main/LICENSE).
