---
page:
  description: Configure and verify a standalone site's GitHub Pages deployment using its generated workflow.
---

# Publish to GitHub Pages

A standalone Norna project includes `.github/workflows/deploy.yml`, which
builds a static site and publishes `dist/` through GitHub Actions. You need a
GitHub repository and permission to configure its Pages source.

## Prepare the site

Set the final public URL in `site/config.yaml`. A project site normally includes
the repository name; a custom domain or root site does not:

```yaml title="site/config.yaml: project-site example"
url: https://owner.github.io/repository-name/
```

The URL pathname supplies the deployment prefix for generated links and assets.
Do not add it again to authored site-relative links. Check source, build and
inspect the result:

```sh
npm run norna:check
npm run norna:build
npm run norna:preview
```

Commit source, package files, lockfile and any changed generated image
manifest together. Static site files such as `CNAME` and `robots.txt` belong
in `site/public/`; their meaning is defined by the host or crawler.

## Configure and publish

1. In the GitHub repository's Pages settings, choose **GitHub Actions** as the
   source.
2. Keep the generated `deploy.yml` workflow and push the checked commit to the
   repository's default branch.
3. Inspect the workflow run and its deployed URL. Open the published Home,
   nested links, images and search if enabled.

The starter checks out the repository, sets up Node and image tools, restores
the image cache, runs `npm ci` and `npm run norna:build`, uploads `dist/` and
deploys it. Search's generated page and Pagefind bundle are part of that same
artifact; no separate service is required.

Norna generates canonical/social URLs, the sitemap and a localized `404.html`.
GitHub Pages serves the latter as its missing-page response. Do not supply a
source sitemap or 404 file with those reserved names. See
[public output](/reference/site/public-files/) for exact rules.

## Inspect failures

Open the failed Actions job and its log. Reproduce a source or build error
locally with the same pinned dependency and lockfile before changing the
workflow. Optional [deploy helpers](/reference/commands/publishing/) require
GitHub CLI authentication and can push an already committed branch or monitor
an exact SHA. They do not replace initial Pages setup.

If another application owns the repository's build, follow
[embedded publishing](/reference/workflows/embedded-publishing/) to combine
both outputs. Other static hosts can serve `dist/`, but Norna currently
integrates setup and deployment only for GitHub Pages.
