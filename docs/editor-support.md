# VS Code Editor Support

Norna includes a proof-of-concept VS Code extension for project-local YAML and
Markdown assistance. It is not currently published in the VS Code Marketplace;
build and install the VSIX from this repository when evaluating it.

## Requirements

- VS Code 1.96 or later.
- The [Red Hat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml).
- A Norna site with its project-local `@janga/norna` dependency installed by
  `npm install`.

The Norna extension declares Red Hat YAML as an extension dependency. Verify
that both extensions are enabled in VS Code's Extensions view if YAML help is
missing.

## Build And Install The Current Extension

From a Norna repository checkout:

```sh
cd editors/vscode
npm ci
npm run package
code --install-extension norna-vscode.vsix
```

If the `code` shell command is unavailable, open VS Code's Extensions view,
choose **Install from VSIX...**, and select the generated file.

Reload the current VS Code window from the Command Palette with
**Developer: Reload Window**. Rebuild and reinstall the VSIX after changing the
extension itself.

## Project-Local Behavior

Open the site project, not an unrelated parent directory, and run `npm install`
before using editor help. For each recognized Norna file, the extension finds
the surrounding site and then loads schemas and Markdown behavior from that
project's installed `@janga/norna` package.

This keeps editor suggestions aligned with the engine version recorded by the
project. If two site projects install different Norna versions, opening a file
inside each project selects that project's local schema. The extension disables
Norna-specific help when the installed package uses an unsupported schema or
editor API version instead of silently applying incompatible rules.

Run **Norna: Show IntelliSense Status** from the Command Palette to see:

- the detected site directory;
- the installed Norna package and version;
- schema and editor API compatibility;
- the schema selected for the active file;
- detected logo and browser-icon status where relevant.

Run **Norna: Refresh IntelliSense** after installing or changing the local
Norna package. Use **Developer: Reload Window** if the extension itself has
been installed or replaced.

## Recognized Files

Norna-specific support activates only inside a valid current site structure:

```text
site/
|-- config.yaml
|-- theme.yaml
|-- sitewide-content.yaml
`-- pages/
    |-- 000-home/
    |   `-- content.md
    `-- 010-guides/
        |-- category.yaml
        |-- theme.yaml
        `-- pages/
            `-- 010-installation/
                `-- content.md
```

The root `config.yaml`, `theme.yaml`, and `sitewide-content.yaml` use their
matching schemas. Every valid page `content.md` receives frontmatter and Norna
Markdown support. A valid `category.yaml` receives its small category schema
and an empty-category snippet. A limited `theme.yaml` in a page or category
directory receives the deliberately smaller page-theme schema. Other YAML and
Markdown files are left to their normal language extensions.

See [Site Files](site-files.md) and [Pages and Categories](pages.md) for the
complete directory contract.

## YAML Help

Inside a recognized YAML file, use `Ctrl+Space` to request completion. On macOS
this is still written as `Ctrl+Space`, using the Control key rather than
Command. Norna supplies:

- valid fields and values for the active file;
- short syntax examples;
- descriptions and version-matched reference links;
- `Norna:` snippets for structured objects and list entries that generic YAML
  completion cannot express clearly.

Red Hat YAML renders the project-local schema information. Norna's generated
schema and `norna config:check` are authoritative. Word-based editor completion,
other YAML extensions, and AI assistants can also offer text that is unrelated
to Norna and may be invalid.

To reduce unrelated YAML suggestions in one workspace, add settings such as:

```json
{
  "[yaml]": {
    "editor.wordBasedSuggestions": "off",
    "editor.inlineSuggest.enabled": false
  },
  "github.copilot.enable": {
    "yaml": false
  }
}
```

Omit the Copilot setting when Copilot is not installed or when AI suggestions
are useful. These settings do not replace schema validation.

## Markdown And Image Help

In a recognized page `content.md`, the extension provides:

- snippets and field completion for Norna image stacks, carousels, and card
  lists;
- inline-note syntax help;
- managed-image filename completion, including candidates currently located
  under another page;
- Go to Definition from an image filename to matching source files;
- Norna diagnostics in VS Code's **Problems** panel;
- safe quick fixes for an unclosed Norna block, a movable image that needs
  `content:sync`, and a local Markdown image that can become an image stack.

Image completion can show candidates from other pages because
`content:sync` can relocate an unambiguous referenced file. If the same filename
exists in several page image directories, the editor and command must not guess
which source was intended.

## Troubleshooting

If Norna help does not appear:

1. Open a recognized file inside the current site structure.
2. Run `npm install` in the site project and confirm that
   `node_modules/@janga/norna` exists.
3. Confirm that Norna and Red Hat YAML are enabled in the Extensions view.
4. Run **Norna: Show IntelliSense Status** and address the first incompatible or
   missing item it reports.
5. Run **Norna: Refresh IntelliSense** after changing the project's engine.
6. Use **Developer: Reload Window** after installing a new VSIX.
7. Run `norna config:check` or `norna content:check` to distinguish an editor
   display problem from invalid site source.

Generic suggestions may still appear beside Norna suggestions. Their presence
does not mean that Norna accepts them; use the descriptions prefixed with
`Norna:`, the project-local schema, and command validation as the contract.
