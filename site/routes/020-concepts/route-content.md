---
title: Concepts
description: Understand Norna's opinionated file model and how it differs from a traditional static site generator.
navigation:
  label: Concepts
---

## Files are the interface {#files}

A Norna site is defined primarily through files rather than through a CMS,
database, visual editor or application-specific component tree.

The files are both the source of the website and the interface through which
the site is maintained.

They can be:

- edited with ordinary tools
- versioned with Git
- reviewed as changes
- kept beside the project they document or present

Norna reads those files and turns them into a static website.

## Opinionated by design {#opinionated}

Norna deliberately defines how the major parts of a site are represented.

Instead of asking each project to invent its own relationship between content,
templates, layouts, components and rendering logic, Norna provides a fixed site
model.

This is what makes Norna opinionated.

It reduces flexibility, but also reduces the amount of website architecture
each project has to create and maintain.

## Separate concerns {#concerns}

### Content - what the site says

`content.md` and route content files contain headings, text, sections, image
references, alt text and captions.

### Theme - how the site looks

`theme.md` contains site-wide visual choices such as layout, image sizing,
typography and colors.

### Configuration - how the site behaves

`config.mjs` contains technical settings such as URLs, base paths, locale
settings and GitHub publishing configuration.

## Sections and routes {#routes}

Sections organise content within a page.

Routes create additional pages with their own URLs.

The homepage is defined by `content.md`. Additional pages live under `routes/`
and use their own route content.

Routes use the broader Norna site model rather than defining an independent
website implementation.

## Source and output {#source-output}

```text
site/  ->  Norna  ->  dist/
source               generated static website
```

Do not edit generated output to change the website. Change the source files
and build again.

## Norna compared with a traditional SSG {#compared}

A traditional static site generator usually exposes lower-level
website-building primitives: templates, layouts, components, data sources or
rendering logic.

That gives developers substantial control over how the website itself is
implemented.

Norna deliberately exposes a higher-level interface.

The user describes:

- content
- presentation
- configuration
- routes
- assets

Norna provides more of the implementation.

The distinction is therefore not simply:

```text
dynamic website vs static website
```

Both can produce static websites.

The distinction is primarily the level at which the user works.

A useful summary is:

> With a traditional SSG, you build the website. With Norna, you describe the
> website within a defined model.

This is a conceptual explanation of Norna's intended workflow, not an absolute
technical claim about every other static site generator.

## Publishing is separate {#publishing}

A build creates static output in `dist/`.

Publishing is a separate step.

Norna currently integrates that step with GitHub Pages only.

Because the output is static, support for other static hosting providers could
be added in the future.

That architectural possibility is not current provider support.
