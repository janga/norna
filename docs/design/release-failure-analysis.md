# Recurring release failures

Completed on 2026-09-19 for
[BL-128 Investigate recurring release failures](backlog/BL-128-recurring-release-failures.md).
The incident boundary is local history through `20dcdaf`; the analysis was
performed from `4ec6a2b`. No registry, GitHub API, credentials or new release
attempt was used.

## Finding

The recurring preparation problem is incomplete coverage of a changed
contract's consumers before release: obsolete assertions and a missing static
analysis entry survived successful, narrower checks. One assertion failure
was version-dependent. The Knip failure was not: it would also have
failed before the version bump.

The reported incidents are not all failed npm publications. They include an
authentication/publication uncertainty, preparation failures that rolled back,
a separate build defect, and a test-server error after publication and push
had reported success. Treating all of them as one release failure obscures
the right recovery step.

Existing fixes address the known faulty assertions, content-ID decoding,
dynamic-import registration and process cleanup. Prepared-version CI now
covers the complete release test chain. The remaining useful work is earlier
evidence at handoff and clearer, tested reporting of release boundaries.

## Incident ledger

`Confirmed` below means the local code/diff establishes the mechanism or the
record preserves a directly observed result. A commit message's validation
claim is historical evidence, not a test rerun by this investigation.

| Version and phase | Evidence and direct cause | Contributing condition and certainty | Correction / earliest practical detection |
| --- | --- | --- | --- |
| 0.7.26: publication/availability | Release commit `828f70f` exists. The [reference inventory](reference-inventory.md#original-baseline-and-publication) records npm latest as 0.7.25 on September 15 and again September 16. The user reported `401 Unauthorized`, renewed login and separate publish approval during recovery. | Confirmed mismatch between local version and the recorded latest lookup. The original publication transcript is absent, so its exact failed phase and cause are unknown. A latest lookup alone does not prove that the exact 0.7.26 version was absent. A successful `whoami` is not publish authorization or registry availability. | Recovery guidance `8bcb0a2`; accepted-versus-available clarification `4617d82`. Inspect the exact version after publication and report each phase independently. Do not attribute the mismatch to the later page-ID finding. |
| 0.7.26-era documentation build: valid `page-move` directory | [BL-118 Page ID decoding for valid slugs](backlog/BL-118-page-id-decoding.md) reproduced content validation passing but Astro failing. The old decoder used the last `-page-` substring, confusing a valid directory name with the generated ID prefix. | Confirmed engine bug. Validation did not execute Astro's ID decoding. It was exposed during canonical-reference work after the 0.7.26 release commit; no evidence ties it to the original npm publication interruption. | `8cd6083` shares exact-prefix encoding/decoding and adds adversarial path tests plus relative/absolute fixture builds. Earliest check: the page-model test with such names, supplemented by a real fixture build. |
| 0.7.27 preparation: category CLI assertion | `3477cac` changed category guidance to describe its generated destination; `test-site-node-commands` still expected no page or URL. The user's transcript identifies this assertion and reports version/schema rollback. | Confirmed stale test expectation after a deliberate contract clarification, independent of the prepared package version. The underlying category-destination feature was already introduced by `1d99572`. | `84116c8` checks absence of authored content plus the generated destination guidance. Earliest check: `npm run test:site-node-commands` when changing that CLI output. |
| 0.7.27 preparation/verification: reference-link assertions | `3477cac` introduced a version boundary in `documentationLinkForVersion`: old source links through 0.7.26, new reference sources afterward. Two consumer tests still required old content/theme source paths. | Confirmed version-sensitive assertions: they could pass in the 0.7.26 checkout and fail after preparing 0.7.27. `fa1145f` records the isolated release check. This may be another stage of the same preparation episode; it is not counted as a separately observed user release attempt. | `fa1145f` fixes the consumer assertions; `625c21d` adds prepared-patch CI. Earliest checks: both sides of the version boundary in focused reference tests, then the prepared-version suite for actual release readiness. |
| 0.7.27 after reported publish and push: `read EIO` | The user transcript ends with npm's version line, successful Git push and `Released`, followed by a readline/TTY error. `2fddd9d` replaces launcher-only termination with owned process-group cleanup and ignored stdin. | Confirmed runner defect and a supported explanation of the late error: an Astro descendant could outlive its launcher and retain terminal input. The historical failing PID is unavailable, so attribution to that exact process is inferred. It is not evidence that npm or Git push failed. | `2fddd9d` adds behavioral cleanup tests for nested processes, exited launchers and forced termination. Earliest check: process ownership and teardown tests when adding/changing browser runners. |
| Attempted 0.7.28 preparation: Knip unused module | `astro.config.mjs` injects an import of `src/lib/navigationPrototype.ts` as generated text. Knip could not discover this entry; the user's transcript shows `test:dead-code` stopping preparation and rollback. | Confirmed tool-integration omission introduced with the opt-in prototype. Browser tests and builds exercise the module but do not establish Knip reachability. This is not caused by bumping 0.7.27 to 0.7.28. | `20dcdaf` adds the explicit entry to `knip.json`. Earliest check: `npm run test:dead-code` after entry-point or generated-import changes. The retained 0.7.28 log reaches the final package check after the complete test chain. |

The unchanged release orchestrator is present at both `828f70f` and `20dcdaf`.
The authentication preflight was already introduced in `b776369` on August 4;
adding another identical login preflight would not address these incidents.

## What the release command actually guarantees

The phase ordering comes from [scripts/release.mjs](../../scripts/release.mjs),
the publish command in [package.json](../../package.json), and the
[recovery procedure](../engine-development.md#npm-release).

| Boundary | What has happened | Failure handling / practical limit |
| --- | --- | --- |
| Clean worktree and npm identity preflight | No version preparation yet. | Failure changes no release files. The current catch reports every `whoami` error as authentication, losing distinctions such as network failure. |
| Version, schemas and `npm test` | Local package/schema changes; no new release commit or tag. | Failure restores package files and schemas. The two user-provided preparation traces explicitly show this rollback. Other files unexpectedly changed by checks are not silently reverted. |
| Release commit, then annotated tag | Local release identity exists. | These are retained after subsequent failure. Their existence does not prove publication. |
| Publish command returns successfully | npm accepted the publish operation. | Processing can continue afterward. No registry visibility check is performed by this script. |
| Git push returns successfully | The push command completed. | If push fails after accepted publication, the current catch only says that the commit/tag remain; it does not explicitly report that publication already succeeded. |
| Final `Released` message | Publish and push commands both returned success. | It does not verify registry availability or prove unrelated descendant processes have stopped. |

The rollback message is a safeguard and secondary result, not the cause of
the assertion or Knip failure. A later retry must follow the actual boundary;
preparing another patch is not a substitute for recovering an already tagged
or accepted version.

## Development checks, CI and release advice

| Check layer | Useful evidence | What it does not establish |
| --- | --- | --- |
| Focused development checks | The changed behavior, in the tested fixture and current package version. | Every consumer assertion, generated-import analysis, future version branch or release-process teardown. |
| Engine tests CI, introduced by `625c21d` | Installs dependencies, prepares a patch and schemas, runs `npm test`, then category/alias browser cases on Ubuntu and Node 24.18.0. | A result for a different commit, a different chosen version type, native macOS terminal behavior, npm authorization or publication visibility. The existence of the workflow is not a passing run. |
| Local release preparation | Runs the full chain after the chosen version change, before committing or publishing. | A green CI result for the exact source commit, subsequent publish approval, eventual registry visibility or a future push succeeding. |

The final records for
[BL-120 Smooth documentation navigation prototype](backlog/BL-120-smooth-documentation-navigation-prototype.md)
and
[BL-127 Align early and deferred navigation state interpretation](backlog/BL-127-align-navigation-state-interpretation.md)
explicitly list focused browser/build checks and defer the full release chain.
Those results support their scoped changes; they do not establish release
readiness. The later Knip entry correction demonstrates the missing check for
the generated import. A full suite after every visual edit is unnecessary;
an entry-point change specifically warrants the already available cheap
dead-code check.

The user records release advice followed by failures. Local history cannot
establish which GitHub Actions result was available or inspected at those
moments. On September 16 the prepared-version workflow commit was at 22:14
CEST and the release commit at 22:24 CEST; that interval does not prove a CI
run completed successfully. This investigation intentionally did not query
GitHub. Therefore any earlier unconditional release advice is unsupported by
the retained evidence unless tied to a passing check of the exact source
commit and intended prepared version.

Node 26.7.0 appears in the user's failures, while CI uses Node 24.18.0. This is
an environment difference to retain in evidence, not a demonstrated cause of
obsolete regex expectations, missing Knip entries or the identified process
ownership bug. No evidence supports blaming npm outages for these local test
failures.

## Ranked next actions

These are bounded recommendations, not changes implemented by this analysis.
Costs are relative estimates; this investigation did not benchmark them.

1. **Record release readiness against the exact source commit.** Preserve the
   existing prepared-version CI and distinguish it from Pages deployment and
   focused development checks. Extend the maintainer handoff guidance in
   `docs/engine-development.md` with a compact result record: source SHA,
   prepared version, Engine tests result/run, and any unverified environment.
   Include `test:site-node-commands` for CLI guidance changes and
   `test:dead-code` for dynamically loaded entry changes in its focused-check
   guidance. This addresses the stale assertion and Knip incidents without
   adding a second full test run. Cost is a small documentation change and
   reading an existing CI result; risk is low. Acceptance: a handoff example
   cannot treat green Pages, a previous SHA, or only focused checks as a green
   release result. If CI evidence is unavailable, say so instead of declaring
   the release verified. No additional runtime gate is required initially.

2. **Report and behaviorally test release failure boundaries.** Give
   `scripts/release.mjs` explicit phase and accepted-publication state, preserve
   useful non-secret causes of preflight errors, and print recovery guidance
   appropriate to pre-commit failure, tag failure, publish failure/uncertainty
   and push failure after acceptance. Add an offline test using a disposable
   repository and fake Git/npm command outcomes. Current
   `scripts/test-engine-commands.mjs` checks help and source-text ordering; it
   does not execute those failure transitions. Acceptance: injected failures
   leave/restore the expected files and tag, never run later destructive
   phases, identify publish-before-push success, and never recommend another
   bump to recover an existing version. Test successful publication reported
   as processing without claiming availability. Scope excludes real npm
   access, credentials, real pushes or an automatic republish. Expected cost
   is seconds of offline tests; implementation risk is moderate because the
   release orchestrator changes. This addresses recovery confusion and gives
   executable coverage of the existing rollback contract.

3. **Consider a separate bounded publication-visibility check.** After the
   preceding status model is dependable, a read-only exact-version lookup
   could distinguish accepted-but-pending from visible publication. Reuse the
   existing exact-version recovery guidance. Scope a timeout and preserve the
   accepted state when lookup fails; neither timeout nor network/auth failure
   may trigger republishing or a new version. Acceptance uses mocked pending,
   visible, missing and transport-error responses; compare reported identity
   with the intended release and leave unverified identity explicit. Files:
   `scripts/release.mjs`, a narrow registry helper/test and the maintainer
   procedure. This helps the 0.7.26/0.7.27 visibility confusion but prevents
   none of the local assertion failures. It adds network latency and failure
   states, so it is lower priority and needs a separate implementation brief.

Do not reimplement fixes already present: prepared-version CI, the explicit
Knip entry, precise content-ID decoding and browser process-group cleanup all
have concrete corrective commits. Keep their checks rather than adding
blanket retries, longer timeouts or relaxed assertions.

## Verification and limits

Read-only local commit/diff inspection covered the seven commits named in the
brief and their relevant introducing changes, current package scripts, Knip,
CI, release/command execution and browser-server ownership code. The optional
`.local/release-checks/0.7.28-knip-tests.log` was present: its header identifies
0.7.28 and its final output reports the package check passed, consistent with
`20dcdaf`. It is supplementary historical evidence, not a fresh run or registry
publication evidence.

The report passed `npm run test:documentation` and `git diff --check`.
Historical failures, release preparation, the complete
test chain and live authentication/publication were intentionally not rerun.
The original 0.7.26 publish transcript, exact failed process PID, CI run
statuses and release-advice timestamps remain unavailable; the conclusions
above retain those limits.
