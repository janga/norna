# BL-182 Restore CI Integration Checks

## Scope

Repair the test fixtures and CI prerequisites exposed by the `6c7c6cc` runs.
Keep the existing product contracts and meaningful assertions. This item does
not change engine behavior, editor presentation or source format.

## Evidence And Repairs

- [Editor extension](https://github.com/janga/norna/actions/runs/38163548298)
  failed in packaged VS Code 1.96.0 after its language, package and audit checks
  passed. The same initial failure exists in the
  [preceding release run](https://github.com/janga/norna/actions/runs/38155481129),
  before Sharp. The completion probe leaves the required root preset empty,
  so theme resolution correctly reports that error before checking navigation.
  Assert both diagnostics in sequence, filling in the preset between them.
- Align the later native assertions with current metadata fields, visual theme
  overrides and template names. Use current configuration files, page-owned
  image paths and page URLs in the accessibility labels; continue checking the
  physical source opened by each relevant action. Wait for asynchronous editor
  opening and tree reveals before issuing the next UI action.
- [Engine tests](https://github.com/janga/norna/actions/runs/38163548317)
  passed the complete prepared-release `npm test` chain, then failed before
  executing its four category-navigation assertions because WebKit was absent.
  Install WebKit alongside Chromium in that workflow.

The separate Windows installation-test cleanup fix is recorded in
[BL-181 Replace ImageMagick With Sharp](BL-181-replace-imagemagick-with-sharp.md).

## Verification

These are test and workflow repairs. Reuse the passing production checks from
the runs above. Verify the affected packaged editor suite, the exact navigation
browser command, workflow syntax and contributor documentation.

- **Passed:** all four `tests/category-destinations.spec.ts` cases through
  `scripts/test-navigation.mjs --site-dir fixtures/category-destinations/site`,
  using WebKit locally. Log: `/tmp/norna-category-ci-fix.log`.
- **Passed in segments:** the packaged VS Code 1.96.0 suite in an isolated macOS
  arm64 test profile, extension 0.15.0 and Red Hat YAML 1.25.0. The complete run
  passed diagnostics, completion relevance, editing, construction acceptance
  and priority checks before stopping in Site Tree. After repairing that test,
  its focused rerun passed all 16 workflows, including Undo, save/reopen,
  creation, collisions, external file changes and site switching. Logs:
  `/tmp/norna-editor-integration-fix-3.log` and
  `/tmp/norna-editor-site-tree-fix-2.log`.
- **Passed:** workflow YAML parsing and `npm run test:documentation`. No
  production code or generated schema changed; the full aggregate already
  passed in CI and was not repeated for these test-only repairs.
- **Required, not yet run:** corrected Editor extension and Engine tests jobs
  on GitHub's Ubuntu runner. Keep this item active until both pass; local results
  do not establish remote results. Push and release remain separate actions.
