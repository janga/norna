# Norna Examples

These examples are source projects, visual demonstrations, and integration
checks. Every example is built by `npm run test:examples` and published by the
documentation workflow.

| Example | Purpose | Live demo | Source |
| --- | --- | --- | --- |
| Dog shelter, single page | A coherent homepage made from sections | [Open site](https://janga.github.io/norna/examples/complete-sites/dog-shelter-single-page/) | [View files](complete-sites/dog-shelter-single-page/) |
| Dog shelter, multi-page | A coherent site with ordered pages and page-local images | [Open site](https://janga.github.io/norna/examples/complete-sites/dog-shelter-multi-page/) | [View files](complete-sites/dog-shelter-multi-page/) |
| Theme presets | All complete presets without overrides | [Open site](https://janga.github.io/norna/examples/feature-demos/theme-presets/) | [View files](feature-demos/theme-presets/) |
| Media and surfaces | Image blocks, cards, notes, palettes, and section surfaces | [Open site](https://janga.github.io/norna/examples/feature-demos/media-and-surfaces/) | [View files](feature-demos/media-and-surfaces/) |
| Sitewide content | Shared logo settings, banners, and footer content | [Open site](https://janga.github.io/norna/examples/feature-demos/sitewide-content/) | [View files](feature-demos/sitewide-content/) |

## Directory Structure

```text
examples/
|-- complete-sites/
|   |-- dog-shelter-single-page/
|   `-- dog-shelter-multi-page/
`-- feature-demos/
    |-- theme-presets/
    |-- media-and-surfaces/
    `-- sitewide-content/
```

`complete-sites/` contains small sites that can be read as coherent Norna
projects. `feature-demos/` contains focused visual test benches. Feature demos
are useful for documentation and integration checks, but are not starter
templates.

## Run An Example Locally

From the Norna repository root, pass the example's `site/` directory:

```sh
node bin/norna.mjs --site-dir examples/feature-demos/media-and-surfaces/site dev:local
```

Use another path from the table to run a different example. The repository's
GitHub Pages workflow publishes the same source projects under
`https://janga.github.io/norna/examples/`.
