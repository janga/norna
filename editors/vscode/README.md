# Norna for VS Code

Norna for VS Code adds project-aware help for Norna configuration, page
Markdown, named sidenotes, content blocks, and managed images.

**Experimental:** this extension is distributed as a VSIX for evaluation.
It is not published in the Visual Studio Marketplace, and updates must be
installed manually. Editor coverage and compatibility are still being
evaluated. Norna sites can be edited and built without the extension.

The extension reads schemas and Markdown behavior from the `@janga/norna`
installed by the current project. This keeps suggestions and documentation
links aligned with the engine version that builds the site. Norna-specific help
appears only in recognized Norna files.

## Features

- Configuration fields, values, and descriptions through Red Hat YAML using
  the project's Norna schemas.
- Norna starting templates and structured YAML snippets.
- Markdown block, semantic-callout, and named-sidenote completion.
- Embedded YAML fields and values from the engine's shared block schema.
- Managed-image filename completion across the site.
- Go to Definition for managed-image references.
- Hover help with version-matched reference links.
- Norna diagnostics in the Problems panel.
- Safe quick fixes for selected content problems.
- A status-bar report for project discovery and compatibility.

The command-line checks remain authoritative. Use the extension while editing,
then run the project's `norna:config:check` and `norna:content:check` scripts
before building or publishing.

## Requirements

- VS Code 1.96 or later.
- A trusted local workspace on the filesystem.
- A current Norna site with its project-local `@janga/norna` dependency
  installed.

Red Hat YAML is an extension dependency and supplies the standard YAML schema
experience.

## Editor Ownership

Red Hat YAML supplies ordinary field/value completion, schema validation, and
formatting in standalone YAML files. Norna adds project-local schema selection,
starting templates, schema-defined snippets, and site-dependent checks.
In `content.md`, Norna owns frontmatter and embedded content-block help and
diagnostics; Red Hat YAML is not assigned Markdown fences.

Norna gives its own suggestions a sorting preference over equally matching
generic suggestions, only in recognized files and valid editing contexts.
For standalone YAML, including `theme.yaml`, this applies to Norna's templates
and snippets, not to ordinary properties or values supplied by Red Hat YAML.
VS Code's text matching and user snippet-placement settings still apply;
Norna suggestions are not guaranteed first place.

Norna does not register a Markdown formatter or repair content during saves.
The supported baseline uses VS Code and Red Hat YAML, without a Markdown
formatter. If another extension formats Markdown automatically, scope this
workspace setting to Markdown:

```json
"[markdown]": {
  "editor.formatOnSave": false
}
```

This does not disable YAML formatting or unrelated extension features. Explicit
Markdown formatting by third-party extensions is outside the verified setup;
Norna will report invalid content but will not undo another formatter's edits.

## Getting Started

Obtain a `norna-vscode.vsix` evaluation build from the maintainer, or build it
using [Extension Development](#extension-development). In VS Code's Extensions
view, open **Views and More Actions**, choose **Install from VSIX...**, and
select the file. Ensure that Norna and Red Hat YAML are installed and enabled,
then run **Developer: Reload Window**. Repeat installation and reload for each
evaluation update; there are no Marketplace updates for this extension.

1. Open the root of a Norna site project in VS Code.
2. Run `npm install` in that project.
3. Open `site/theme.yaml` or a page `content.md`.
4. Check the **Norna** item on the right side of the status bar.
5. On a blank, unindented Markdown body line, press `Ctrl+Space` or run
   **Trigger Suggest** to choose a callout, image block, card list, or page list
   without typing its syntax first. Inside a block, suggestions follow its fields.

Select the status item when it shows a warning. It reports the detected site,
installed engine, and any compatibility problem. Run **Norna: Refresh
IntelliSense** after changing the project's Norna version.
After replacing a VSIX, run **Norna: Show IntelliSense Status** and verify that
its reported extension version matches the intended evaluation build.

See the complete [VS Code Editor Support](https://janga.github.io/norna/reference/workflows/editor/)
guide for recognized files, feature examples, and troubleshooting.

## Extension Development

From `editors/vscode/`:

```sh
npm ci
npm run check
npm run package
```

`npm run package` creates `norna-vscode.vsix`. Open this directory in VS Code
and press `F5` to launch an Extension Development Host. The development launch
uses the Norna repository as its test project.

Run the packaged integration tests from the repository root:

```sh
npm run test:editor-integration
npm run test:editor-integration:minimum
```

The tests install the VSIX and Red Hat YAML into an isolated VS Code instance.
They cover the latest VS Code release and the minimum supported version.
They accept suggestions in the editor and verify repeated edit/save/close/
reopen cycles, exact file contents, and diagnostic recovery. The separate
formatter scenario installs real Prettier with the documented Markdown save
exception:

```sh
npm run test:integration -- --with-prettier
```

Run that command from `editors/vscode/`. See the
[editor workflow test plan](../../docs/design/editor-workflow-test-plan.md)
for the scenario matrix, assertions, and limitations.

Relevance checks compare exact Norna candidate sets and reject unexpected or
duplicate suggestions. They cover literal examples, comments, YAML text,
frontmatter mapping ownership, and switching between files and projects.

Construction selection tests inspect the visible suggestion widget and select
each supported block, callout, note template, and complete-file template. Run
only this matrix from the repository root with:

```sh
npm --prefix editors/vscode run test:integration -- --suite constructions
```

The isolated VS Code inspector uses loopback port `9238`; a busy port fails
instead of connecting to another instance. The matrix records missing support
for tabs and code metadata separately. It does not claim that every Norna
feature already has an editor suggestion.

For a focused ranking and isolation check, use `--suite priority` instead of
`--suite constructions`. It observes Norna and a competing generic provider
in the visible widget, with Red Hat YAML enabled. Add `--with-prettier` for
the supported formatter setup. These checks cover Norna-owned suggestions;
they do not assert priority for Red Hat's ordinary YAML property/value
suggestions. See [Editor Ownership](#editor-ownership) for the boundary.
