---
page:
  description: Know what deploy helpers build, commit, push and monitor, including their refusal conditions.
---

# Publishing commands

Norna's deploy helpers operate on a GitHub repository's default branch. They
require Git, an `origin` remote pointing to that repository, an authenticated
GitHub CLI (`gh`), and the site's `.github/workflows/deploy.yml` workflow.

The [publishing workflow](/reference/workflows/publishing/) explains initial
setup. These commands perform Git and GitHub operations; they do not configure
a hosting account.

## Deploy committed sources

```sh
npm exec -- norna deploy
```

`deploy` discovers the repository and default branch, requires that branch and
a clean worktree, fetches `origin`, and refuses a behind or diverged branch.
It builds and requires the worktree to remain clean. It checks the remote
state again, pushes when local HEAD is ahead, and checks `deploy.yml`.

If the build changes the image manifest, review and commit that change before
retrying. When local HEAD already matches the remote, no push is needed.
The command never creates a commit or pushes uncommitted files.

## Build and create a commit

```sh
npm exec -- norna deploy:commit "Update site content"
```

This convenience command builds, checks changed paths, stages allowed changes,
commits with the required message, pushes and checks Pages. It applies the same
default-branch and remote-divergence requirements.

The allowlist covers page-tree files, public files, referenced managed images,
the generated image manifest, root config/theme, package files,
`astro.config.mjs`, `tsconfig.json` and `src/`. Unexpected untracked files and
changes outside the allowlist stop the command. In particular, it is not a
general command for committing every site-root or workflow file; commit such
changes deliberately before using `deploy`.

Build, commit, push and deployment are separate operations. A later failure
does not undo an earlier commit or push. Inspect Git status, the reported
commit and the workflow result before retrying.

## Monitor a workflow

```sh
npm exec -- norna deploy:watch --timeout 20m --interval 5s
```

`deploy:watch` polls the workflow for a specific commit without committing or
pushing. Its options are operational overrides, not site configuration:

| Option | Meaning | Default |
| --- | --- | --- |
| `--repo <owner/name>` | Repository to query | Discovered from the Git remote |
| `--workflow <name-or-file>` | Workflow to monitor | `deploy.yml` |
| `--branch <name>` | Branch whose runs are searched | Repository default branch |
| `--sha <commit>` | Exact commit to find | Current HEAD |
| `--site-url <url>` | Public URL printed in status | Configured site URL |
| `--interval <duration>` | Delay between queries | `10s` |
| `--timeout <duration>` | Maximum wait | `15m` |
| `--limit <count>` | Positive number of recent runs to search | `10` |

Durations accept `ms`, `s` and `m`, including `500ms` and `0.5m`. `-h` or
`--help` prints usage. The monitor prints run/Actions URLs, branch, SHA, status
and site URL; on failure it fetches failed-job details and a log excerpt.
Timeout and failed deployment produce a nonzero exit status.

Renaming the workflow requires `--workflow` for monitoring; normal `deploy`
still expects `deploy.yml`. Do not use these site helpers to publish the Norna
engine package itself.
