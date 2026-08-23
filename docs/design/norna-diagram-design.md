# Norna Diagram Design

This document defines a repository-local workflow for creating technical and
pedagogical diagrams for Norna.

It is intentionally not a vendored copy of any external skill, MCP server, or
diagram tool. The first experiment should use hand-authored SVG assets managed
by Norna's existing image model.

## Goal

Norna diagrams should help a new reader understand the site model faster than
text alone.

A diagram should explain one idea clearly, not show every related feature. If a
topic needs several ideas, split it into several diagrams.

## Current Scope

Use this workflow for diagrams in the Norna documentation site under `site/`.

Do not add diagram generation to the Norna build pipeline yet. Diagram creation
is an authoring workflow for now, not product functionality.

Do not require Excalidraw, MCP servers, browser plugins, or external layout
tools for the first experiment.

## Diagram Brief

Before creating or replacing a diagram, write a short brief:

```md
Purpose:
Audience:
Main message:
Concepts to show:
Concepts to avoid:
Norna features that must not be implied:
Suggested layout:
Mobile/readability requirement:
Where the SVG will live:
Markdown block and alt text:
```

The brief can live in the discussion, in a source-only Markdown comment near
the image, or in `docs/design/` when it is useful for future maintenance.

## Design Principles

- Show one primary flow or relationship.
- Prefer two to five main objects.
- Use short labels.
- Use one clear visual hierarchy.
- Keep arrows few and directional.
- Avoid diagrams where every object connects to every other object.
- Prefer multiple simple diagrams over one dense diagram.
- Make route order, URL slugs, section ids, image folders, source files, and
  generated output visually distinct when those ideas matter.
- Do not show templates, components, custom rendering logic, route-level
  technical configuration, or hosting integrations that Norna does not support.
- Do not show page layouts that Norna cannot actually render unless the diagram
  is clearly abstract and not a product capability example.

## Norna-Specific Accuracy

Diagrams must match the current Norna model:

- A Norna site is described with site files, not arbitrary project structure.
- `content.md` is the homepage content file.
- `sitewide-content.yaml` contains shared logo settings, banners, and footer
  content.
- Additional pages are route directories with `content.md`.
- Route folder prefixes control route presentation order.
- Route ids become default URL slugs.
- Images belong under the image root for the page or route, usually grouped by
  section id.
- Markdown remains the primary writing format.
- Norna blocks cover fixed site patterns such as image stacks,
  carousels, and card lists.
- `theme.yaml` controls visual presentation.
- `config.yaml` controls the public URL and optional language and smooth
  scrolling.
- `dist/` is generated static output.
- GitHub Pages is the integrated publishing target today.

## SVG Requirements

Use hand-authored SVG for the first experiment.

SVG assets should:

- have a `viewBox`;
- include `<title>` and `<desc>`;
- use real text, not outlined text;
- avoid external fonts and external image files;
- remain readable at the size used on the site;
- work when scaled down on a phone;
- use restrained colors that fit the surrounding page;
- avoid decorative effects that compete with the explanation;
- keep text inside boxes with visible margins;
- be maintainable by editing the SVG source.

If a diagram is too wide for mobile, prefer splitting it into smaller diagrams
over relying on horizontal scrolling.

## Source Placement

Store diagram SVG files as normal Norna managed image assets:

```text
site/routes/<NNN-route-id>/images/<section-id>/<diagram-name>.svg
```

Reference them with a Norna image block:

````md
<!-- norna-image-provenance:
image: diagram-name.svg
source: hand-authored
Short maintenance note explaining why the diagram exists.
-->

```norna-image-stack
- image: diagram-name.svg
  alt: Concise explanation of what the diagram shows.
```
````

## Review Checklist

Before accepting a diagram:

- The main message is obvious without reading the surrounding section.
- The diagram does not imply unsupported Norna functionality.
- URL, route, section, image, theme, config, and output terminology is
  consistent with documentation.
- Text fits inside boxes at desktop and mobile widths.
- Arrows clarify the relationship instead of adding noise.
- The SVG has title, description, and useful alt text in Markdown.
- `norna content:check` passes.
- A desktop and mobile visual check has been done when layout changed.

## Relationship To Excalidraw

Excalidraw can be useful as a sketching style or inspiration for box-and-arrow
clarity, but the first Norna experiment should not depend on Excalidraw files,
exports, or MCP tooling.

If future experiments show that diagram generation should be automated, evaluate
that as a separate authoring tool or CLI. Do not make it part of the site build
engine unless there is a clear product reason.

## Future Questions

- Should diagram briefs become tracked files next to SVG assets?
- Should Norna have a separate authoring helper for diagrams?
- Should generated diagrams store both a source format and exported SVG?
- Should a later tool create Excalidraw-compatible files, plain SVG, or both?
- What review rules are needed before diagrams are used in starters or examples?
