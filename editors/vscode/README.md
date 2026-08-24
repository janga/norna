# Norna for VS Code

Proof-of-concept editor support for project-local Norna schemas, Markdown
blocks, notes, and managed image filenames. The extension reads schemas and
language behavior from the `@janga/norna` installed by the current project.
It activates only for files in a recognized Norna site and uses the schema and
editor API version declared by that local installation.

The proof of concept provides:

- described YAML fields and values through Red Hat YAML
- concise syntax examples and links to the matching file reference
- context-aware Norna block fields and values
- site-wide managed-image filename completion and Go to Definition
- content diagnostics and safe quick fixes
- detected navigation-logo and browser-icon status, with diagnostics for conflicts and likely convention mistakes
- minimal snippets for empty Norna files
- high-priority `Norna:` snippets for structured YAML objects and list items where generic YAML completion is too abstract

Recognized files are the root `config.yaml`, `theme.yaml`,
`sitewide-content.yaml`, and `content.md`, plus `content.md` and optional
`theme.yaml` in a valid `pages/NNN-page-id/` directory. Other YAML and
Markdown files are left entirely to their normal language support.

During development:

1. Open `editors/vscode` as the VS Code workspace.
2. Press `F5` and choose **Run Norna Extension**.
3. In the Extension Development Host, run **Norna: Show IntelliSense Status**.
4. Open `site/theme.yaml` to try schema completion.
5. In a page `content.md`, place the cursor after an `image:` field and press
   `Ctrl+Space` to see images from the current section and other pages.

Run `npm install` and `npm run package` in this directory to create an
installable `norna-vscode.vsix`.

The development launch opens the Norna repository as the test project. The
Red Hat YAML extension is required for YAML schema support.
