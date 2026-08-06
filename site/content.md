---
title: Norna
description: An introduction to Norna, a file-based static website toolchain.
navigation:
  label: Home
  order: 0
sections:
  - id: intro
    presentation:
      typography:
        preset: statement
        overrides:
          heading:
            size: xlarge
          body:
            size: large
  - id: workflow
  - id: next
---

## Norna builds websites from files {#intro}

Norna is an independent open source CLI for building small file-based static
websites.

You keep content, presentation, configuration, images, and public files in a
plain project directory. Norna validates those files, prepares responsive image
assets, and builds a static website.

![Diagram showing site files flowing through the Norna CLI into a static website.](/workflow.svg)

## The workflow {#workflow}

```text
site files -> norna -> static website
```

The source model is intentionally simple:

- `config.mjs` holds technical settings such as URL, layout, language labels,
  GitHub Pages workflow details, and deployment watch settings.
- `theme.md` holds site-wide visual defaults such as colors, typography preset,
  frame colors, and inline text styles.
- `content.md` holds the homepage title, description, section order, text,
  galleries, alt text, and captions.
- `routes/` can hold additional pages.
- `images/` holds source images next to the sections that use them.
- `public/` holds static files such as `robots.txt`, `CNAME`, and favicons.

## Where to go next {#next}

Use the guided route if you want to try Norna now:

[Start with Norna](/getting-started/)

Use the concepts route if you want to understand how the parts fit together:

[Understand the model](/concepts/)

Use the reference route when you need exact command, configuration, content, or
publishing details:

[Open the reference map](/reference/)
