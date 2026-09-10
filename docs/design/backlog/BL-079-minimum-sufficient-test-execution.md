# BL-079: Minimum Sufficient Test Execution

## Status

Implemented on 2026-09-10 through the repository agent instructions.

## Outcome

Development work runs the smallest set of automated tests that gives reliable
coverage of the changed contract. Finishing a task or preparing a commit does
not by itself trigger a broad test suite.

The rule reduces repeated builds and browser runs while preserving wider
verification for changes whose shared impact cannot be covered safely by a
focused test.

## Working Contract

- Prefer the most focused deterministic test command that covers the changed
  behavior and its regression case.
- Run more than one focused command only when the change affects genuinely
  distinct contracts that one command does not cover.
- Do not run both an aggregate suite and one of its child suites against the
  same unchanged implementation unless the broader run has an independent
  purpose.
- Wait until an implementation is coherent before running its normal focused
  checks. For visible behavior, retain the established human-review-first rule.
- After a failed test, change the implementation, fixture, or test before
  rerunning it, unless the failure itself provides evidence of an intermittent
  infrastructure problem.
- Scale verification with blast radius. Shared parsers, page models, build
  paths, package boundaries, and cross-cutting presentation behavior may
  justify broader tests even when the requested feature is small.
- Reserve the complete `npm test` chain for release verification, broad
  cross-cutting work, an explicit user request, or a change for which no
  narrower set gives dependable coverage.
- During a sequence of backlog changes, use focused checks for each completed
  item and run at most one justified broader verification pass for the final
  combined state.
- Report the exact checks run and any intentionally deferred verification in
  the completion summary.

## Acceptance Criteria

- Repository instructions explicitly require minimum sufficient test
  selection.
- A commit boundary alone is not a reason to run `npm test`.
- Overlapping parent and child suites are not routinely repeated against the
  same source state.
- A failed test is not repeatedly invoked without an intervening correction or
  an identified intermittent-failure investigation.
- Full verification remains available and mandatory when change scope or an
  explicit instruction requires it.
- Test reporting remains transparent enough for a maintainer to decide whether
  further verification is warranted.

## Follow-up Boundary

This item changes development policy only. Automatic changed-file selection,
test-result caching, commit attestations, and release reuse are separate future
infrastructure work and should be introduced only if this simpler rule leaves a
measured problem.
