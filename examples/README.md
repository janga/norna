# Norna examples

Runnable examples are grouped by purpose.

```text
examples/
|-- complete-sites/
|   |-- dog-shelter-single-page/
|   `-- dog-shelter-multi-page/
`-- feature-demos/
    |-- theme-presets/
    `-- media-and-surfaces/
```

## Complete sites

`complete-sites/` contains small sites that can be read as coherent examples
of a Norna project.

- `dog-shelter-single-page/` demonstrates a homepage made from sections.
- `dog-shelter-multi-page/` adds ordered routes and route-local content.

## Feature demos

`feature-demos/` contains focused visual test benches. They are useful for
documentation, manual inspection and integration checks, but are not intended
as starter templates.

- `theme-presets/` compares Norna's complete built-in theme presets.
- `media-and-surfaces/` demonstrates managed media blocks, notes, palettes and
  section surfaces.

The repository's GitHub Pages workflow publishes rendered copies under
`https://janga.github.io/norna/examples/` so the HTML documentation can link to
working sites rather than only their source files.

Run an example from the repository root by passing its `site/` directory:

```sh
node bin/norna.mjs --site-dir examples/feature-demos/media-and-surfaces/site dev:local
```
