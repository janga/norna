# Norna: project instructions

## Find the relevant guidance

README.md introduces the product. docs/README.md indexes contributor guidance.
Read the sections relevant to the task, not every linked document.

- Engine, site paths, review environments and releases:
  docs/engine-development.md
- Documentation, schema descriptions, UI help and diagnostics:
  docs/design/documentation-style-guide.md
- Website presentation and presets:
  docs/design/preset-design-guide.md
- VS Code extension and engine-side editor APIs:
  editors/vscode/README.md and docs/design/editor-workflow-test-plan.md
- Backlog work:
  BACKLOG.md and docs/design/backlog/README.md

Approved design decisions remain requirements until explicitly superseded.
Unapproved proposals and historical test results do not create requirements;
a document's age or filename does not determine its status. Use the latest
approved decision and report unresolved conflicts between code, documentation
and requirements.

## Project boundaries

- For CLI site discovery, use scripts/lib/site-paths.mjs. Editor and reusable
  APIs must honor their explicit siteRoot, not substitute the process's
  selected site or hardcode site/.
- The homepage is the selected site's content.md. Children live under pages/.
  Shared appearance belongs in site-config/site-theme.yaml; root theme.yaml
  affects only the homepage. Descendant themes inherit within their branches.
- Reuse engine validation and mutation rules in the VS Code extension.
  Editor support must follow the selected project's engine capabilities.
- Generate schemas from scripts/lib/schema-definitions.mjs; do not hand-edit
  generated schemas.
- Use registered review commands for registered sites. Use a physical scratch
  copy for disposable review; do not symlink it to maintained source.
  Examples are public; fixtures and private research are not.
- Preserve real links and usable content/navigation without JavaScript.
- Do not use npm link to test the engine. Use npm scripts or node bin/norna.mjs
  inside this repository, not a globally installed norna command.

## Verification and review

- Select checks by the changed behavior and its consumers. Do not repeat checks
  already covered by a successful aggregate on the same relevant source state.
  A commit alone does not justify a broader run.
- Use the full npm test chain for release or when the change requires its scope.
  npm run build already checks configuration and content.
- For new or materially changed visual presentation or interaction, inspect
  the result and obtain local user approval before committing. Quick relevant
  checks may run before review. Reuse existing approval while the approved
  presentation and behavior remain unchanged.
- Verify changed IntelliSense through the real suggestion widget. For changed
  source-editing behavior, verify Undo and dirty save/reopen cycles.
  State clearly when practical verification is incomplete.
- Update documentation for settled behavior in the same change. Record a
  Documentation Follow-up only for work deliberately deferred.

## Working with the owner

- Do not create branches unless requested. Commit completed backlog items
  separately. Push and release require authorization for those actions.
- Refer to backlog items with both identifier and title.
- During design discussion, collect decisions and update documents together
  when the questions are settled, unless an interim update is requested.
- Use the owner's Default VS Code profile for local review, with disposable
  test files. Do not change profile settings to make tests pass.
- Include date and local time in progress reports.
