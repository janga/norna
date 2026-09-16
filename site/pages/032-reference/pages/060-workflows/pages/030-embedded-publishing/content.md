---
page:
  description: Combine an embedded Norna site and another static build at the configured URL prefix.
---

# Publish beside another static build

An existing project may publish its own application or project homepage and a
Norna presentation from the same GitHub Pages artifact. Use an embedded Norna
site for this arrangement:

```sh
npx @janga/norna@latest init . --type embedded --site-dir presentation
```

Embedded initialization adds namespaced `norna:*` scripts and the
`presentation/` source directory. It preserves the project's existing build and
deployment setup and does not add the standalone Norna Pages workflow.

## Align the URL and output

Choose the final presentation URL before building. For a repository named
`project` and a presentation published below `/presentation/`, write:

```yaml
# presentation/config.yaml
url: https://owner.github.io/project/presentation/
```

The pathname in `url` and the directory used when combining the output must
match. Norna uses that pathname for links and assets; GitHub Pages does not move
the generated files into it automatically.

Norna and the surrounding project may both write `dist/`, and either build may
clean an existing directory. Build and move the Norna output before running the
main build, then merge it into the final artifact. For an Ubuntu GitHub Actions
job whose main build also produces `dist/`, the relevant steps are:

```yaml
- name: Build Norna presentation
  run: |
    npm run norna:build
    mv dist "${RUNNER_TEMP}/norna-presentation"

- name: Build project homepage
  run: npm run build

- name: Add Norna presentation to the Pages artifact
  run: |
    mkdir -p dist/presentation
    cp -R "${RUNNER_TEMP}/norna-presentation/." dist/presentation/

- name: Upload combined Pages artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: dist
```

Keep the workflow's normal checkout, Node setup, `npm ci`, Pages configuration,
permissions, and deployment steps around this sequence. Install ImageMagick in
the job when the presentation contains managed PNG or JPEG images. If the main
project uses another output directory or public prefix, adapt both merge paths
together rather than changing only one.

## Root files and deployment ownership

The outer project owns files whose meaning is tied to the published site root,
including `CNAME`, root `robots.txt`, and the GitHub Pages custom `404.html`.
Files copied from `presentation/public/` live below `/presentation/`; a nested
`404.html` is generated there but GitHub Pages does not use it as the combined
site's root missing-page response. Managed images, favicons, social metadata,
and the presentation sitemap remain base-path aware inside the nested site.

Use the surrounding project's workflow rather than `npm run norna:deploy`,
because that workflow owns the combined build order and artifact. Norna's
`norna:check`, `norna:build`, local preview, and generated-image cache remain
usable independently. When caching generated images, use the selected site
directory, for example `presentation/.norna/public/images/generated`.
