# BL-067: Stable Local Review And Regression Environments

## Status

Implemented on 2026-09-09. Maintained review sites now use the named commands
and fixed manual-review URLs below. Registered browser suites reserve isolated
ports internally, and the scratch workflow creates a disposable physical copy
under `.local/`.

[`BL-071` Reusable Playwright Review Captures](BL-071-reusable-playwright-review-captures.md)
extends the same registry and permission boundary to disposable screenshots.

## Outcome

Repeated visual reviews and browser regressions use named environments instead
of inventing a new `--site-dir`, port, URL, and command on each run. The command
surface is narrow enough to approve once in a managed development environment,
while test sites and generated state remain isolated from maintained sources.

## User Problem

Norna currently starts review sites through many combinations of
`NORNA_DEV_PORT`, `--site-dir`, Playwright base URLs, and direct script paths.
The same logical site consequently appears on different ports over time, and
small command differences can require repeated permission escalation. The
operator also has to remember which server belongs to which source directory.

Automated tests have a different constraint: fixed ports make parallel runs and
CI less reliable. The solution must stabilize the approved command boundary
without requiring every short-lived regression server to use a globally fixed
port.

## Environment Registry

Keep one version-controlled registry that maps a short target name to its site
source, manual-review port, expected base path, and applicable browser suites.
Start with these assignments:

| Target | Site source | Review port | Expected base path |
| --- | --- | ---: | --- |
| `docs` | `site/` | `4321` | `/norna/` |
| `presentation` | `fixtures/presentation-review/site/` | `4322` | `/` |
| `navigation` | `fixtures/nested-pages/site/` | `4323` | `/` |
| `presets` | `fixtures/preset-baseline/site/` | `4324` | `/` |
| `scratch` | `.local/test-sites/scratch/site/` | `4399` | Read from the copied site's config |

The registry is the only place that assigns these ports. Adding another
persistent review target requires a distinct source path and port.

## Command Contract

Provide stable, allowlisted entry points rather than requiring callers to
compose environment variables and paths:

```text
npm run review:start -- docs
npm run review:status -- docs
npm run review:logs -- docs
npm run review:stop -- docs
npm run review:test -- navigation
```

`review:start` uses the registered fixed port and prints the complete URL.
`review:test` selects the registered site and test suite but reserves an
available port internally for that run. This preserves parallel and CI safety
while allowing one stable command prefix to cover browser regression tests.

Unknown target names fail with the complete list of valid names. These commands
do not accept arbitrary site paths or ports. Existing low-level commands remain
available for exceptional development work, but maintained scripts and agent
instructions use the named entry points.

## Scratch-Site Contract

Reserve `.local/test-sites/scratch/site/` as the one runnable temporary site.
The complete `.local/` tree stays ignored by Git and excluded from packages and
published examples.

Add a helper that takes a source site inside the workspace and materializes a
fresh copy at the reserved path. It must:

- validate that the source resembles a Norna site before changing the scratch
  workspace;
- omit generated `.norna`, dependency, build, log, and test-result directories;
- refuse to replace an existing scratch site unless replacement is explicit;
- copy into a temporary sibling and rename it into place only after the copy
  succeeds;
- report both the source and resulting `scratch` review URL;
- provide an explicit cleanup command.

An optional symlink may record which source was selected, but the runnable
`site/` directory remains a physical copy. A direct runnable symlink is unsafe
because Norna would write generated state through it into the maintained source
site, and it would be less portable on Windows.

## Process And Permission Boundaries

- A named review server may replace only the process recorded for its assigned
  target and port. If an unrelated process occupies the port, fail with an
  explanatory error instead of terminating it.
- Server state, logs, generated images, Astro state, and test output remain
  isolated per registered target.
- Manual review servers never choose a fallback port. Stable URLs are part of
  their contract.
- Automated browser tests always stop their short-lived server in `finally`,
  including after test failure or interruption.
- The wrapper commands work on macOS, Linux, and Windows without requiring
  shell-specific environment-variable syntax or symlink support.

## Acceptance Criteria

- Every maintained manual review target starts at its documented fixed URL
  through the same command family.
- Every maintained browser suite can be selected by target name and runs on an
  internally allocated port without caller-provided URLs.
- One narrowly scoped approval per command family is sufficient for repeated
  local server and Playwright runs; changing target names does not require a new
  command shape.
- Two automated suites can run concurrently without a port collision.
- A port occupied by an unrelated process causes a clear failure and is never
  killed automatically.
- Scratch setup, replacement, cleanup, stale-state recovery, and a source path
  containing spaces have automated tests.
- Scratch setup cannot modify its source site, and generated files remain
  ignored and absent from npm package contents.
- Documentation and agent instructions stop prescribing ad hoc port and
  `--site-dir` combinations for maintained review targets.

## Complexity And Risk

Expected complexity is medium. Most work is orchestration around existing
development-server and Playwright helpers. The main risks are introducing a
second server lifecycle implementation, killing the wrong process, making CI
tests depend on fixed ports, or allowing scratch setup to mutate its source.
Reuse the existing process-state and server-readiness code rather than
duplicating it.
