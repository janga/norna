# BL-071: Reusable Playwright Review Captures

## Status

Implemented on 2026-09-10. The `review:capture` command uses the BL-067 target
registry and writes disposable screenshots beneath `.local/review-captures/`.

## Outcome

Visual inspection uses one repository-owned command instead of composing a new
Playwright invocation, local port, page URL, viewport, and output path for each
capture. The command reuses the named review environments introduced by
[`BL-067` Stable Local Review And Regression Environments](BL-067-stable-local-test-environments.md),
so one narrowly scoped permission can cover repeated local screenshots.

## User Problem

Launching Chromium can require permission escalation in a sandboxed development
session. Direct commands such as `playwright screenshot` also vary whenever the
port, route, viewport, appearance, or output filename changes. This creates
avoidable interruptions even though every capture targets a known local Norna
review site.

The browser launch itself cannot always avoid operating-system or sandbox
approval. Norna can, however, make that a one-time approval for a constrained
command family rather than a new decision for every screenshot.

## Relationship To BL-067

Do not create another server registry or lifecycle implementation. Extend the
existing review-environment infrastructure:

- resolve target names, site directories, ports, and base paths through
  `scripts/review-environment-registry.mjs`;
- keep `review:start`, `review:status`, and `review:stop` responsible for the
  fixed manual-review servers;
- add a sibling `review:capture` command for browser capture;
- keep captures under `.local/review-captures/`, which is already excluded from
  Git and npm packaging;
- retain the isolated-port behavior of automated `review:test` suites.

The capture helper must not accept an arbitrary remote URL or arbitrary output
path. A caller selects a registered target and a relative page path. The helper
constructs the local URL and a safe output filename.

## Command Contract

Use one stable command shape:

```sh
npm run review:capture -- <target> <relative-page> [options]
```

The command supports `desktop`, `compact`, and `mobile` viewport profiles, plus
bounded `WIDTHxHEIGHT` dimensions for precise responsive reproductions. It also
supports System, Light, and Dark appearance and an optional full-page capture.
Generated filenames identify the target, page, viewport, and appearance without
requiring the caller to supply a filesystem path.

The command checks that the registered review server is reachable. If it is not
running, it exits with the exact `review:start` command and URL rather than
silently starting another server or choosing a fallback port.

## Acceptance Criteria

- `npm run review:capture -- ...` is the only command family needed for ad hoc
  screenshots of registered local review environments.
- Changing target, route, viewport profile, dimensions, or appearance does not
  change the approvable command prefix.
- Targets and base paths come from the existing BL-067 registry.
- Only loopback URLs derived from registered targets are accepted.
- Relative paths cannot escape or replace the registered origin and base path.
- Output is written beneath `.local/review-captures/` using sanitized,
  deterministic names; arbitrary output paths are rejected.
- The command reports both the inspected URL and resulting image path.
- A stopped server produces a concise instruction to run
  `npm run review:start -- <target>`.
- Existing browser regression commands and concurrent isolated test ports are
  unchanged.
- Unit tests cover argument validation, URL construction, output naming, and a
  stopped server. One browser test covers a successful Light and Dark capture.
- Maintainer instructions use the wrapper instead of direct ad hoc Playwright
  screenshot commands for registered sites.

## Complexity And Risk

Expected complexity is low to medium. URL and filename validation are bounded,
and the existing registry supplies the environment model. The main risks are
accidentally allowing external navigation, conflating disposable screenshots
with committed visual baselines, or duplicating server lifecycle behavior.

Committed preset baselines remain owned by `preset:baselines:capture`. This
item only standardizes disposable images used during investigation and human
review.
