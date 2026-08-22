# Publishing

Norna includes a GitHub Pages workflow and deploy helpers. The public URL is
declared in `site/config.md`; repository and default branch are discovered from
GitHub when a deploy command runs.

Do not run deploy commands from the engine repository unless you deliberately
want to deploy the documentation site.

## GitHub Pages Workflow

Each site repository owns `.github/workflows/deploy.yml`. The starter workflow:

1. runs for the repository's default branch,
2. checks out the site repository,
3. sets up Node and image tools,
4. restores the generated image cache,
5. runs `npm ci` and `npm run build`,
6. uploads `dist/`,
7. deploys the artifact to GitHub Pages.

In the GitHub repository settings, set Pages to build from GitHub Actions.
Site-specific public files such as `site/public/CNAME`, `robots.txt` and
`sitemap.xml` belong in the site repository.

For a project site without a custom domain, include the repository path in
`site/config.md`:

```yaml
---
url: https://owner.github.io/repository-name/
---
```

For a custom domain or root-hosted site:

```yaml
---
url: https://example.com/
---
```

Norna derives the base path from the URL pathname and applies it to generated
internal links, favicons, managed images and root-relative Markdown links.

## Deploy An Already Committed Branch

Use:

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

By default it monitors `deploy.yml` for the current `HEAD` in the discovered
repository and default branch. Useful one-run overrides include:

```sh
npm run norna:deploy:watch -- --timeout 20m --interval 5s
npm run norna:deploy:watch -- --sha <commit-sha>
npm run norna:deploy:watch -- --repo owner/name --branch main
```

The default poll interval is 10 seconds, timeout is 15 minutes and recent-run
limit is 10. `--workflow`, `--site-url` and `--limit` provide further one-run
overrides; these operational values do not belong in `config.md`.

The monitor prints the run id, run URL, Actions URL, branch, commit SHA, status
and public site URL. On failures it fetches failed job details and a log
excerpt.
