# BL-128 Investigate recurring release failures

## Purpose

Determine whether recent `npm run release:patch` failures share preventable
causes, and recommend the smallest changes that would detect or prevent them
earlier. Explain why verified development changes still encountered release
failures. Do not assume that every reported error means publication failed.

## Scope and boundaries

Investigate the incidents around 0.7.26, 0.7.27 and the attempted preparation of
0.7.28, using local history through `20dcdaf` as the initial evidence boundary.
Include test expectations, analysis-tool configuration, version preparation,
authentication, publication status and test-process cleanup when supported by
an incident. This item delivers analysis and implementation proposals; it does
not change runtime code, release scripts, test assertions or CI behavior.

## Decisions made

The user requested an investigation that can finish without escalation or
additional questions. Its execution contract is:

- Use tracked source, local read-only Git history and the incident summaries
  below. Existing local logs are supplementary, never prerequisites.
- Write the report to `docs/design/release-failure-analysis.md` and update this
  item's status and backlog entry when the analysis is complete.
- Do not request elevated permissions, credentials, login, user testing,
  approval or clarification. If an operation is unavailable with ordinary
  permissions, omit it, record the resulting evidence gap and continue.
- Do not query GitHub or npm, fetch history, install dependencies, launch a
  browser/server, create a worktree, prepare a version, publish or push.
  Do not read credential files or reuse historical authentication links.
- No commit is required to complete the analysis. If committing would require
  escalation, leave the report changes ready for commit and state that in the
  handoff. Do not start another backlog item to work around this boundary.
- Run `npm run test:documentation` and `git diff --check` using ordinary
  permissions. If a check cannot run, record exactly what remains unverified;
  do not request permissions or install tools. No full release test run is
  required for this documentation-only investigation.

## Initial evidence

These are starting records, not the completed causal analysis. User-reported
observations are preserved here so execution does not depend on this chat.
Several observations may belong to the same release attempt; do not count
each terminal message as a separate incident.

| Observation | Initial evidence and boundary |
| --- | --- |
| 0.7.26: reported mismatch between the intended release and npm availability; `401 Unauthorized`, renewed login and publication confirmation occurred during recovery. | User reports; recovery guidance in `8bcb0a2` and `scripts/release.mjs`. Reconstruct the known order without inferring registry state from an authentication error or a Git tag. |
| Valid `page-move` paths passed content validation but failed the Astro build. | [BL-118 Page ID decoding for valid slugs](BL-118-page-id-decoding.md), corrected in `8cd6083`. Establish its relationship to a release attempt before calling it a release failure. |
| 0.7.27 preparation stopped in `test:site-node-commands`: the assertion expected `has no page or URL of its own`, while the CLI described a category destination generated from child pages. | User-provided failure before commit and the correction in `84116c8`. Version and schemas were rolled back. |
| Reference-link assertions still expected old `docs/content.md` and `docs/theme.md` paths. | Test corrections in `fa1145f`; prepared-version CI added in `625c21d`. Establish whether these were another symptom of the same preparation attempt. |
| After npm reported `+ @janga/norna@0.7.27`, Git push completed and `Released @janga/norna@0.7.27` appeared, a readline/TTY `read EIO` error followed. | User-provided terminal sequence; browser test-process cleanup correction in `2fddd9d`. Distinguish the late process error from failure to publish. |
| 0.7.28 preparation stopped at Knip's `Unused files: src/lib/navigationPrototype.ts`. | Generated import in `astro.config.mjs`; explicit entry correction in `20dcdaf`. The focused Knip check and complete `npm test` then passed with a prepared 0.7.28 in a temporary checkout, without publication. |

Inspect the named commits with local `git show`, and follow their relevant
parents/diffs when needed. Also read `package.json`, `knip.json`,
`.github/workflows/engine-tests.yml`, `scripts/release.mjs`,
`scripts/lib/run-command.mjs`, `scripts/browser-test-server.mjs` and the
[contributor release procedure](../../engine-development.md#npm-release).
The optional local log `.local/release-checks/0.7.28-knip-tests.log` records the
successful prepared-version check; its absence must not block the analysis.

## Preliminary hypotheses

- Some changes were verified locally against their visible behavior while
  dependent assertions or tool configuration remained stale. Examples to
  examine are category wording, canonical reference links and the generated
  prototype import that Knip could not follow.
- Checks on the current development version may differ from checks after
  preparing the next version and its generated schemas. Determine which
  incidents actually depended on this difference.
- Authentication, delayed registry availability and errors from surviving
  child processes may make distinct outcomes look like the same release
  failure. Determine which status messages and recovery steps were ambiguous.

Treat these as hypotheses to support, narrow or reject. A successful local
build or focused browser suite does not establish that every release gate was
checked, but that alone does not prove the cause of a particular failure.

## Investigation and deliverable

1. Build an incident table with attempted version, relevant commit, failing
   phase/check, evidence, direct cause, contributing conditions, corrective
   commit and the earliest practical detection point. Mark confirmed facts,
   supported inferences and unknowns separately.
2. Separate authentication/preflight, preparation/tests, commit/tag creation,
   publication, Git push and errors after reported success. Record what had
   actually completed and whether rollback worked. Do not treat a successful
   rollback as the cause of the initial failure.
3. Compare development verification, prepared-version CI and the release
   command. Identify missing or late checks, version-sensitive expectations,
   dynamically loaded code and process ownership. Account for improvements
   already made; do not propose an existing safeguard as a new fix.
4. Assess when release advice was given relative to the relevant CI result
   and test evidence, where local records permit it. Missing timestamps or CI
   logs are evidence gaps, not grounds for blaming a user or inventing a cause.
5. Produce ranked, concrete recommendations. For each, state the incident it
   addresses, mechanism, affected files, expected benefit, runtime/cost, risk
   and a focused acceptance check. Explain where a cheap development check
   suffices and where a prepared-version release check is necessary; do not
   default to running the full suite after every edit.

The report must give a concise answer about the recurring pattern, a supported
incident ledger and ready-to-schedule descriptions of any remaining fixes.
Choose a recommended order without asking the user to select one. Leave
speculative recommendations clearly labelled and preserve residual uncertainty.

## Dependencies and completion

There are no external prerequisites or unresolved product choices. Existing
fixes supply evidence; reproducing network/authentication failures is not
required. The report is complete when it addresses every starting incident,
states which patterns are supported or rejected, ranks actionable prevention
and records verification limits. Missing optional evidence does not block a
bounded conclusion. Implementation of the recommendations is separate work.
