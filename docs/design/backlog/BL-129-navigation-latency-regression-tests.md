# BL-129 Regression tests for the navigation latency correction

## Purpose and status

**Ready; prioritized under `Now`.** Complete the maintained regression checks
for the navigation latency correction described in the
[investigation record](../navigation-latency-investigation.md). The user
approved the visual result on 2026-09-18, then explicitly requested a separate
backlog item so these tests can run with the other prioritized work. The
remaining browser regression run is therefore deferred from the correction's
commit, rather than recorded as passed.

The correction removes the article's separate View Transition snapshot and
crossfade from `src/styles/navigation-prototype.css`. It remains part of the
opt-in prototype; enable it with `NORNA_NAVIGATION_PROTOTYPE=1` when testing.

## Scope and existing evidence

Run the maintained prototype suite against the approved correction. Cover
page changes, menu position and label weight, disclosure behavior, category
and prose links, fragments, Back/Forward, reduced motion and navigation
without JavaScript through its existing assertions.

The opt-in build, inspected desktop/mobile light/dark captures, Safari timing
comparison and exploratory interaction checks in installed Safari, Chrome,
Firefox and Brave already passed. Their methods and results are in the
investigation record. Repeating them is not a prerequisite for this item;
repeat only a relevant check if a failure or subsequent change warrants it.
Playwright WebKit does not replace installed Safari evidence, and this
functional suite does not establish a new latency measurement.

## Execution

From the repository root, run the complete focused suite once:

```sh
NORNA_NAVIGATION_PROTOTYPE=1 node scripts/test-navigation.mjs --site-dir site tests/navigation-prototype.spec.ts
```

The runner reserves its own local port and temporary generated state. It does
not depend on the review server on port 4399. Confirm that the prototype is
enabled and that the suite actually runs rather than being skipped.

Record the tested commit or working-tree changes, exact command, pass/fail/skip
counts and elapsed time in the investigation record. Diagnose any failure
before rerunning. Preserve the behavior assertions; do not turn a failure into
a skip or weaken it solely to finish the item. Make any necessary repair a
focused change. A repair that changes visible behavior needs fresh review;
the existing correction already has the user's approval.

If a repair changes shared tree navigation or scroll behavior, also run
`npm run review:test -- navigation`. The existing CSS-only correction does
not require that additional fixture suite, the presets suite, another build
or the full release test chain. Do not duplicate aggregate and child checks
against an unchanged implementation.

After recording the result, run:

```sh
npm run test:documentation
git diff --check
```

## Completion

Complete when the focused suite passes without unexpected skips, any required
repair checks pass, and the investigation record distinguishes prior visual
and exploratory evidence from this maintained regression result. Remove this
item from `BACKLOG.md` in its completion commit. If execution is blocked, record
the concrete blocker and leave the item open; do not claim a passing result.

No release, publication or change to the prototype's default status is part of
this item. It can run independently of the other prioritized analysis work.
