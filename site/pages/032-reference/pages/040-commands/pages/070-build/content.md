---
page:
  description: Understand the build sequence, generated public output and the boundary of direct Astro commands.
---

# Build and public output

`build` produces a complete static website from the selected source directory:

```sh
npm exec -- norna build
```

It runs configuration checks, content checks, public-file synchronization,
managed-image generation, Astro's static build and search-index generation,
in that order. A failed step stops later steps. It does not publish or commit.

## Output and changed files

The completed site is normally `dist/` in the project directory. Generated
public files live under the selected site's `.norna/public/`; the image
manifest `.norna/generated-images.json` may change and should be reviewed in
Git. PNG/JPEG processing requires ImageMagick when cached output cannot be
reused.

The artifact includes generated page/category destinations, aliases,
`sitemap.xml` and `404.html`; enabled search adds `/search/` and `pagefind/`.
See [public files and output](/reference/site/public-files/) for inclusion,
reserved paths and host behavior.

`build:local` runs the same build and then restarts local development. It
does not open a new browser window. Use `preview` to serve the completed
artifact instead of development output.

## Sync public files separately

```sh
npm exec -- norna site:public
```

This copies the selected site's `public/` files into `.norna/public/`, removes
stale copied static files and generates the sitemap. It rejects reserved
source names such as `sitemap.xml`, `404.html`, and `pagefind/` when search is
enabled. It does not build pages or refresh search. Use it when a local
development server needs an updated copied public file without a full build.

## Direct Astro access

`astro` forwards its remaining arguments to Astro with Norna's configuration
and resolved paths. This is an escape hatch for Astro tooling; direct
`astro build` does not run Norna's complete preparation and post-build search
sequence. Use Norna's `build` for a publishable artifact.

Engine-repository `build:pages` additionally builds the maintained examples
into the documentation Pages artifact. It is not an installed-site CLI
command; its contributor workflow is documented in the repository.
