# BL-030: Production-ready IntelliSense

## Outcome

Norna's IntelliSense is a supported editor feature rather than a repository-local
proof of concept. A site author can install it through a documented distribution
channel, keep it aligned with the project's Norna version, and rely on it only in
recognized Norna files.

Do not describe IntelliSense as complete until the acceptance criteria below are
met.

## Current Status

**In progress: experimental VSIX evaluation.** On 2026-09-14 the user chose
continued everyday editing with manually installed VSIX builds before deciding
whether to publish in the Visual Studio Marketplace. Publication is not the
only remaining acceptance step and is not required for this evaluation phase.

The current implementation has packaged-extension tests in minimum supported
and current VS Code, including actual suggestion-widget selection, negative
contexts, and documented Red Hat YAML/Prettier coexistence scenarios. These
results do not prove that every everyday editing workflow is reliable or every
Norna construction has completion support. Tabs and code metadata still lack
dedicated suggestions.

User documentation now describes experimental VSIX installation, manual
updates, status verification, and known boundaries. Do not promise Marketplace
availability, automatic updates, or complete IntelliSense coverage.

Related implementation and tests remain under BL-108: Standard And Uniform
Content Syntax, BL-109: Context-Relevant IntelliSense Tests, and BL-110:
Context-Scoped Completion Priority. Those items are complete and committed
together as a compatible engine/extension combination; practical VSIX
evaluation remains open here.

## Next Step: Practical VSIX Evaluation

- Use the extension during ordinary authoring, not only in a dedicated test
  profile. Record relevant enabled extensions when a problem occurs.
- Give each distributed evaluation build a new extension version. Record the
  tested Norna engine version so two different builds are not confused merely
  because they share a VSIX filename.
- Verify installation and replacement through **Norna: Show IntelliSense
  Status** after **Developer: Reload Window**.
- Exercise open, edit, select suggestions, save, close, reopen, edit, and save
  again. Include configuration, Markdown blocks, callouts, notes, image
  selection, and transitions to unrelated Markdown/YAML files.
- Turn reproducible failures into focused regression tests at the failing
  layer. Completion-provider output alone does not prove that a suggestion can
  be selected and inserted in the widget.
- Keep canonical documentation aligned with observed behavior and explicit
  limitations. Do not wait for Marketplace publication to document the
  evaluation workflow.
- Keep the item open until the user considers the practical editing workflow
  reliable. Marketplace publication requires a separate explicit decision;
  elapsed time or passing automated tests alone does not authorize it.

If external testers are invited, a versioned VSIX attached to a GitHub
pre-release is a possible distribution path. No such published artifact is
assumed to exist, and creating one is not part of the current authorization.

## First Scope

- Version and distribute evaluation builds through manual VSIX installation;
  decide the public installation and update path after practical evaluation.
- Define compatibility between the extension, its editor-support manifest, and
  the Norna engine installed in the current project.
- Activate Norna help only for recognized files inside a valid Norna project and
  site structure.
- Keep YAML completion compatible with Red Hat YAML without duplicating generic
  or unrelated suggestions.
- Preserve project-local schemas, versioned documentation links, Markdown block
  help, note help, and managed-image filename completion.
- Provide clear status and recovery guidance for missing dependencies,
  incompatible versions, stale generated support files, and unrecognized
  projects.
- Add automated coverage for installation artifacts, activation boundaries,
  upgrades, downgrades, embedded sites, and non-Norna YAML and Markdown files.
- Document the installation and update workflow that actually exists, clearly
  distinguishing experimental evaluation from a supported public release.

## Boundaries

- This item productizes the help that already exists; it does not add a general
  Norna language server.
- Internal link diagnostics and Go to Definition remain in `BL-027` Editor Link
  Diagnostics and must reuse the shared site link graph.
- The CLI remains authoritative. Editor help must not introduce syntax or
  validation rules that the installed Norna engine does not recognize.
- Support for editors other than VS Code is limited to portable YAML schemas and
  ordinary Markdown unless a separate product decision is made.

## Risks

- Independently versioned engine and extension releases can provide misleading
  help unless compatibility is explicit and tested.
- Red Hat YAML and Norna can produce duplicate or competing suggestions if their
  responsibilities are not kept separate.
- Broad Markdown or YAML activation can make unrelated projects noisy.
- Shipping generated schemas or documentation links without a release contract
  can make older projects depend on the latest repository state.

## Acceptance Criteria

The evaluation phase requires reproducible installation and manual updates,
identifiable builds, regression coverage for reported failures, accurate
documentation, and the user's approval of everyday editing. The complete item
also requires the following public-support criteria; they are not prerequisites
for beginning VSIX evaluation:

- A new user can install and update the extension without cloning the Norna
  repository or running repository-internal packaging commands.
- The extension selects support data compatible with the Norna engine installed
  in the open project and disables incompatible help with an actionable message.
- Norna-specific completions and diagnostics do not appear in unrelated YAML or
  Markdown files.
- Red Hat YAML and Norna together provide one coherent completion experience for
  all supported Norna YAML files.
- Completion descriptions use current terminology and link to documentation for
  the installed Norna version.
- Markdown blocks, named sidenotes, and valid managed-image filenames have tested
  completion behavior, including cross-page image discovery where supported.
- Automated tests cover a packaged extension, clean installation, update and
  downgrade compatibility, project discovery, refresh behavior, and activation
  boundaries.
- Canonical editor documentation explains installation, updating, compatibility,
  supported files, troubleshooting, and the CLI-authoritative boundary.
