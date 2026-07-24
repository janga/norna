# Publishing

Publishing is site-specific. The generic deploy commands read repository,
branch, workflow, watch, and public URL settings from the selected site's
`site/config.mjs`.

Do not run deploy commands from the engine repository unless you deliberately
want to test the demo configuration.

## GitHub Pages Workflow

Each site repository should own its `.github/workflows/deploy.yml`. The starter
workflow:

1. checks out the site repository,
2. sets up Node,
3. installs image tools,
4. restores the generated image cache,
5. runs `npm ci`,
6. runs `npm run build` in the starter, which aliases
   `npm run gallery:build`,
7. uploads `dist/`,
8. deploys to GitHub Pages.

Site-specific static files such as `site/public/CNAME`, `robots.txt`, and
`sitemap.xml` belong in the site repository.

## Deploy An Already Committed Branch

Use:

```sh
npm run gallery:deploy
```

The deploy command:

- requires the current branch to equal `github.branch`,
- requires a clean worktree before build,
- fetches `origin`,
- refuses to proceed when the branch is behind or diverged,
- runs the full build,
- requires the build to leave the worktree clean,
- pushes only when the local branch is ahead of `origin/<branch>`,
- checks the configured GitHub Pages workflow.

It does not create commits or push uncommitted changes.

## Deploy With A Generated Commit

The older convenience flow remains available:

```sh
npm run gallery:deploy:commit -- "Commit message"
```

It builds, stages only allowed site changes, commits, pushes, and checks Pages.
The allowlist is implemented in `scripts/deploy-site.mjs` and includes the
site content file, selected config/static files, expected gallery images,
generated image manifest, package files, `tsconfig.json`, `astro.config.mjs`,
and `src/` changes.

## Watch A Deploy

Use:

```sh
npm run gallery:deploy:watch
```

By default it monitors the workflow run for the current `HEAD` on the configured
branch and repository. Useful one-run overrides include:

```sh
npm run gallery:deploy:watch -- --timeout 20m --interval 5s
npm run gallery:deploy:watch -- --sha <commit-sha>
```

The monitor prints the run id, run URL, Actions URL, branch, commit SHA, status,
and configured public site URL. On failures it fetches failed job details and a
log excerpt.
