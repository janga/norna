# BL-030: Production-ready IntelliSense

## Outcome

Norna's IntelliSense is a supported editor feature rather than a repository-local
proof of concept. A site author can install it through a documented distribution
channel, keep it aligned with the project's Norna version, and rely on it only in
recognized Norna files.

Do not describe IntelliSense as complete until the acceptance criteria below are
met.

## First Scope

- Publish and version the VS Code extension through a supported installation and
  update path.
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
- Update user documentation only after the supported installation and update
  workflow exists.

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
- Markdown blocks, inline notes, and valid managed-image filenames have tested
  completion behavior, including cross-page image discovery where supported.
- Automated tests cover a packaged extension, clean installation, update and
  downgrade compatibility, project discovery, refresh behavior, and activation
  boundaries.
- Canonical editor documentation explains installation, updating, compatibility,
  supported files, troubleshooting, and the CLI-authoritative boundary.
