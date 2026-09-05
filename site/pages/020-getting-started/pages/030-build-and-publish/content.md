---
page:
  description: Check, build, and publish a Norna site with GitHub Pages.
---

# Build And Publish

Norna turns the checked source files into a static website and includes the
GitHub Actions workflow needed to publish it with GitHub Pages.

## Set the public URL {#public-url}

Before the first build for publication, set the final site URL in
`site/config.yaml`:

```yaml
url: https://owner.github.io/repository/
```

Norna uses the URL to derive the base path for internal links, public files,
and generated images. It also uses the URL for canonical links, social sharing
metadata, and the sitemap. Use a root URL such as `https://example.com/` for a
custom domain.

## Check the site {#check}

Run the complete check before building:

```sh
# Validate the site without changing source files
norna check
```

Correct reported problems in the source files. The focused
`norna config:check` and `norna content:check` commands run the same checks
separately when you need to diagnose a problem.

## Build the static site {#build}

Build the site locally:

```sh
# Check the source and create dist/
norna build
```

Treat `dist/` as generated output. Edit the files under `site/` and build again
instead of changing the generated files.

The build includes responsive image output, canonical and social metadata, a
sitemap, and a default `404.html`. A conventionally named optional image under
`site/public/` supplies the site's social preview. See
[Public files](https://github.com/janga/norna/blob/main/docs/public-files.md)
for its filename and for the exact generated-output rules.

## Publish with GitHub Pages {#publish}

Create a GitHub repository for the site and push the project. In the repository,
open **Settings -> Pages** and select **GitHub Actions** as the publishing
source.

Commit the site source together with `package.json` and `package-lock.json`.
The lockfile lets the workflow install the same Norna and dependency versions
that were checked locally.

The starter includes `.github/workflows/deploy.yml`. Whenever you push to the
repository's default branch, that workflow installs the recorded dependencies,
checks the source, builds the site, and publishes `dist/` if the checks pass.

```sh
# Trigger the included GitHub Pages workflow
git push
```

See [Publishing](https://github.com/janga/norna/blob/main/docs/publishing.md)
for repository setup, custom domains, deploy commands, and troubleshooting.

## Watch a deployment {#watch}

GitHub Actions or Pages can occasionally be delayed or report a temporary
service problem. Norna can follow the current workflow run from the terminal:

```sh
norna deploy:watch
```

The command reports the workflow status, public URL, and available failure
details. It does not publish or change the site. This optional helper requires
an installed and authenticated GitHub CLI; pushing the commit is sufficient to
start publication. See
[Watch a deploy](https://github.com/janga/norna/blob/main/docs/publishing.md#watch-a-deploy)
for options and troubleshooting.
