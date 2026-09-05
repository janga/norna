# Publishing

A Norna build creates a static website in `dist/`. Norna includes one
publishing integration: a GitHub Actions workflow for GitHub Pages. The public
URL is declared in `site/config.yaml`; deploy helpers discover the repository
and default branch from GitHub when they run.

Do not run deploy commands from the engine repository unless you deliberately
want to deploy the documentation site.

## Requirements

The included publishing workflow requires:

- a Git repository hosted on GitHub;
- `.github/workflows/deploy.yml` from a current Norna starter;
- GitHub Pages configured to use GitHub Actions as its source;
- `package.json` and `package-lock.json` committed with the site source.

Pushing a commit to the repository's default branch starts the workflow. The
Norna deploy helpers are optional conveniences around that Git and GitHub
workflow. They additionally require Git, an `origin` remote that points to the
GitHub repository, the GitHub CLI, and an authenticated `gh` session.

## GitHub Pages Workflow

`norna init` creates the GitHub Pages workflow at exactly:

```text
.github/workflows/deploy.yml
```

The file belongs to the site repository. GitHub Actions runs its contents, while
Norna's deploy helpers use the filename to find and monitor the workflow. Keep
the default filename when using `norna deploy`.

GitHub Actions itself permits other workflow filenames. If the file is renamed,
`norna deploy:watch` can monitor it with `--workflow <name-or-file>`, but the
normal `norna deploy` command still expects `deploy.yml`.

The starter workflow:

1. runs for the repository's default branch,
2. checks out the site repository,
3. sets up Node and image tools,
4. restores the generated image cache,
5. runs `npm ci` and `npm run norna:build`,
6. uploads `dist/`,
7. deploys the artifact to GitHub Pages.

Site-specific public files such as `site/public/CNAME` and `robots.txt` belong
in the site repository. Norna copies them, while GitHub Pages, crawlers, and
other external consumers give those filenames their meaning.

Norna generates canonical links, social sharing URLs, and `sitemap.xml` from
the pages that produce URLs and from the configured public URL. An optional
conventionally named file under `site/public/` supplies one site-wide social
sharing image. See
[Public Files: Social Sharing Image](public-files.md#social-sharing-image) for
filenames, emitted metadata, and omission rules. Do not add a source sitemap at
`site/public/sitemap.xml`; the generated file is included in `dist/` and
published by the same workflow. See
[Public Files: Generated Sitemap](public-files.md#generated-sitemap) for page
inclusion and conflict rules.

Every build also includes a localized `dist/404.html` that uses the root theme,
site navigation, and a base-path-aware homepage link. GitHub Pages recognizes
this file as the site's custom missing-page response, so the included workflow
needs no separate 404 configuration. Other hosts determine how that file is
served. See [Public Files: Generated 404 Page](public-files.md#generated-404-page)
for the exact content, metadata, and source-file conflict rules.

For a project site without a custom domain, include the repository path in
`site/config.yaml`:

```yaml
url: https://owner.github.io/repository-name/
```

For a custom domain or root-hosted site:

```yaml
url: https://example.com/
```

Norna derives the base path from the URL pathname and applies it to generated
internal links, sitemap entries, favicons, managed images, and root-relative
Markdown links.

## Publish An Embedded Site Beside Another Static Build

An existing project may publish its own application or project homepage and a
Norna presentation from the same GitHub Pages artifact. Use an embedded Norna
site for this arrangement:

```sh
npx @janga/norna@latest init . --type embedded --site-dir presentation
```

Embedded initialization adds namespaced `norna:*` scripts and the
`presentation/` source directory. It preserves the project's existing build and
deployment setup and does not add the standalone Norna Pages workflow.

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

## Deploy An Already Committed Branch

Use this helper after committing the site source and lockfile:

```sh
npm run norna:deploy
```

The command requires an authenticated GitHub CLI. It asks GitHub for the
current repository and its default branch, then:

- requires the current branch to be that default branch,
- requires a clean worktree before the build,
- fetches `origin`,
- refuses to proceed when the branch is behind or diverged,
- runs the full build,
- requires the build to leave the worktree clean,
- pushes only when local `HEAD` is ahead of the remote branch,
- checks the included `deploy.yml` GitHub Pages workflow.

It does not create commits or push uncommitted changes.

## Deploy With A Generated Commit

The older convenience flow remains available:

```sh
npm run norna:deploy:commit -- "Commit message"
```

It discovers the same repository/default branch, builds, stages only allowed
site changes, commits, pushes and checks Pages. The allowlist is implemented in
`scripts/deploy-site.mjs` and includes site content and configuration, expected
managed images and generated image state, public files, package files and
renderer source changes.

## Watch A Deploy

Use:

```sh
npm run norna:deploy:watch
```

GitHub Pages is a reliable publishing service, but GitHub Actions or Pages can
occasionally be delayed or experience temporary service problems. Norna includes
`norna:deploy:watch` to make the current deployment status and any reported
failure easier to follow from the command line.

By default it monitors `deploy.yml` for the current `HEAD` in the discovered
repository and default branch. Useful one-run overrides include:

```sh
npm run norna:deploy:watch -- --timeout 20m --interval 5s
npm run norna:deploy:watch -- --sha <commit-sha>
npm run norna:deploy:watch -- --repo owner/name --branch main
```

All watch options are operational overrides; none belongs in `config.yaml`:

| Option | Effect | Default |
| --- | --- | --- |
| `--repo <owner/name>` | Select the GitHub repository. | Repository discovered from the current Git remote. |
| `--workflow <name-or-file>` | Select the workflow to monitor. | `deploy.yml` |
| `--branch <name>` | Select the branch whose runs are searched. | Repository default branch. |
| `--sha <commit-sha>` | Select the exact commit whose run is monitored. | Current `HEAD`. |
| `--site-url <url>` | Replace the public URL printed in status output. | `url` from `site/config.yaml`. |
| `--interval <duration>` | Set the delay between GitHub queries. | `10s` |
| `--timeout <duration>` | Stop waiting after this duration. | `15m` |
| `--limit <count>` | Set how many recent workflow runs are searched for the commit. | `10` |

Durations accept `ms`, `s`, or `m`, including values such as `500ms`, `5s`,
and `0.5m`.

The monitor prints the run id, run URL, Actions URL, branch, commit SHA, status
and public site URL. On failures it fetches failed job details and a log
excerpt.
