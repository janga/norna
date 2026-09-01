# Norna for VS Code

Norna for VS Code adds project-aware help for Norna configuration, page
Markdown, inline notes, content blocks, and managed images.

The extension reads schemas and Markdown behavior from the `@janga/norna`
installed by the current project. This keeps suggestions and documentation
links aligned with the engine version that builds the site. Norna-specific help
appears only in recognized Norna files.

## Features

- Configuration fields, values, descriptions, and snippets through Red Hat
  YAML.
- Markdown block and inline-note completion.
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

## Getting Started

1. Open the root of a Norna site project in VS Code.
2. Run `npm install` in that project.
3. Open `site/theme.yaml` or a page `content.md`.
4. Check the **Norna** item on the right side of the status bar.
5. Start typing or press `Ctrl+Space` to request suggestions.

Select the status item when it shows a warning. It reports the detected site,
installed engine, and any compatibility problem. Run **Norna: Refresh
IntelliSense** after changing the project's Norna version.

See the complete [VS Code Editor Support](https://github.com/janga/norna/blob/main/docs/editor-support.md)
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
