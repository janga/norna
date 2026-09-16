---
page:
  description: Check build prerequisites and the boundaries of the current Norna release.
---

# Requirements and limits

Building requires **Node.js 22.12 or later and npm**. The published site is
static; readers need only a browser.

## Tools

| Tool | Needed for |
| --- | --- |
| Node.js and npm | Installing Norna, checking sources and building |
| ImageMagick | Processing managed JPEG and PNG images |
| Git | Source control and GitHub publishing commands |
| GitHub CLI (`gh`) | Norna deploy and deploy-monitoring commands |
| VS Code and the Norna extension | Optional editing assistance |

ImageMagick is a system tool, not an npm dependency. Norna accepts `magick`
or compatible `identify` and `convert` commands. SVG-only sites do not need it.
The [installation FAQ](/faq/installation/#install-imagemagick) gives installation
instructions. Playwright and engine-contributor tools are not required for a site.

## Product boundaries

Norna builds its prescribed file tree, Markdown extensions and YAML settings.
It does not provide a database, server-rendered application, arbitrary MDX/React
components, user templates or an open plugin API. Custom scripts and styles
are not a supported theme-extension model.

GitHub Pages is the integrated publishing target. Other static hosts can serve
the output; their deploy and native-redirect configuration remain external.

One language applies to a site. Language selectors and versioned documentation
branches are not implemented. Separate site folders remain possible. See
[Language](/reference/configuration/language/) for translations and search limits.

## Experimental releases

This reference describes the repository's current Norna 0.7.26 implementation.
On 2026-09-16, npm latest was still 0.7.25; do not assume that release supports
every feature described here. Check the installed version with
`npm exec -- norna engine:version` when comparing behavior.

Norna is pre-1.0: syntax can change between releases and no general automatic
migration is provided. Keep sources and lockfiles in Git and follow
[Upgrading a site](/reference/workflows/upgrading/) when changing versions.
