---
title: Norna
description: An opinionated CLI for building small static websites from content, presentation and configuration kept as files.
navigation:
  label: Home
---

## Norna {#intro}

**An opinionated CLI for building small static websites from files.**

You work with content, presentation, configuration, routes and assets. Norna
provides the website implementation and builds the result as a static site.

The goal is not to give you another framework for constructing websites. Norna
gives you a defined site model to work within.

You describe the site rather than implement it.

## How Norna works {#model}

### Opinionated by design

Norna deliberately gives you a defined way to structure a website.

Content belongs in content files. Visual presentation belongs in the theme.
Technical behaviour belongs in configuration. Additional pages are routes.
Images and public assets have defined places.

For normal site work, you do not build templates, components or rendering logic
for each project. Norna provides that presentation layer as part of the tool.

This makes Norna less general-purpose than a traditional static site generator
or web framework - intentionally.

The trade-off is less architectural freedom in exchange for less website
implementation work.

### Files are the interface

A typical Norna site looks like this:

```text
site/
  config.mjs
  theme.md
  content.md
  routes/
  images/
  public/
```

- `content.md` - what the homepage says and how its sections are organised
- `theme.md` - how the site looks
- `config.mjs` - technical behaviour such as URL, base path, language labels
  and publishing settings
- `routes/` - additional pages
- `images/` - source images used by the site
- `public/` - static files copied into the published site

Content, presentation and technical configuration stay separate, while routes
and assets can be added as the site grows.

The files are ordinary project files: they can be edited, versioned, reviewed
and kept together with the project they describe.

### From files to a website

![Norna turns site files describing content, presentation, configuration, routes and assets into a static website in dist. GitHub Pages is the integrated publishing target today, while a dashed branch shows possible future integrations with other static hosts.](/workflow.svg)

A Norna build turns the source files into static website output in `dist/`.

Norna currently integrates publishing with GitHub Pages. The generated website
is static, so other static hosting services are technically possible publishing
targets, but Norna does not provide integrations for them today.

Additional publishing integrations may be added in the future.

### One layer above a traditional site generator

A general-purpose static site generator usually gives you tools for building a
website: templates, layouts, components, data pipelines and rendering
primitives.

Norna works at a higher level of abstraction.

You provide the site's content, presentation choices, configuration, routes and
assets. Norna owns more of the website implementation.

That means Norna is not trying to maximise flexibility. It is trying to
minimise how much website-specific implementation you need for the kinds of
sites it supports.

## Why Norna? {#why}

### Keep the website with the project

The website lives in ordinary files that can be read, edited, reviewed and
versioned together with the rest of the project.

There is no separate CMS or content database that has to be kept in sync with
the repository.

### Separate responsibilities

Editorial content belongs in content files, visual defaults in `theme.md`, and
technical settings in `config.mjs`.

The structure is deliberately constrained so that each file has a clear role.

### Less website implementation

For normal site work, you work with the Norna model instead of creating a new
template/component architecture for every site.

### Static output

The result of a build is a static website in `dist/`.

The build output is separate from the source files.

Edit the files under `site/`; let Norna generate `dist/`.

## Good fit for {#good-fit}

Norna is intended for relatively small, mostly static websites where a
file-driven and versioned workflow is useful.

Typical uses include:

- open source and project websites
- lightweight documentation and guides
- portfolios and artist websites
- image-driven presentation sites
- personal websites
- small organisation and information sites
- presentation or documentation sites embedded in existing projects

Norna is a good fit when the site can live naturally as files and when a
defined presentation model is preferable to building a custom web architecture.

It is not intended to replace a general-purpose framework for dynamic web
applications or projects that need complete control over their rendering
architecture.

## Get started {#start}

### Create a site

```sh
npx @janga/norna@latest init my-site
cd my-site
npm install
npm run dev
```

Read [Getting Started](/getting-started/) for the full first-site flow.

### Project links

- [GitHub repository](https://github.com/janga/norna)
- [Documentation](https://github.com/janga/norna/tree/main/docs)
- [npm package](https://www.npmjs.com/package/@janga/norna)
- [Issue tracker](https://github.com/janga/norna/issues)

### Next steps

- [Getting Started](/getting-started/) - create and build your first Norna site
- [Concepts](/concepts/) - understand the file model and abstraction level
- [Examples](/examples/) - see the kinds of sites Norna is designed to build
- [Full documentation](https://github.com/janga/norna/tree/main/docs) - read
  detailed configuration, command and publishing reference

### License

Norna is open source software released under
[GNU GPL v3](https://github.com/janga/norna/blob/main/LICENSE).
