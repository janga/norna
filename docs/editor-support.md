# VS Code Editor Support

The Norna extension adds project-aware help while you edit a Norna site in
Visual Studio Code. It suggests valid configuration and Markdown syntax,
reports content problems in the editor, and helps you find managed images.
The command-line checks remain authoritative.

## Public Availability

The extension package and compatibility tests are ready for the first public
release. It has not yet been published in the Visual Studio Marketplace. Until
that release, install the repository-built VSIX only when evaluating the editor
support.

After Marketplace publication, install **Norna** from VS Code's Extensions
view. Marketplace installation also supplies automatic extension updates. The
Norna extension declares
[Red Hat YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)
as a dependency, so VS Code installs the YAML support it needs.

## What You See In VS Code

Open a Norna project and select a recognized Norna file. A **Norna** item then
appears on the right side of the status bar:

- a check mark means that project-local editor support is ready;
- a warning symbol means that the local Norna package is missing or
  incompatible;
- no Norna item means that the active file is not part of a recognized Norna
  site.

Select the status item for a detailed report. The same report is available from
the Command Palette as **Norna: Show IntelliSense Status**. The report names
both the installed extension version and the project-local Norna engine version
so stale editor support can be distinguished from stale project dependencies.

Norna uses standard VS Code features:

| Feature | How to use it | What Norna adds |
| --- | --- | --- |
| Suggestions | Start typing or press `Ctrl+Space`. On macOS, use the Control key, not Command. | Valid fields, values, blocks, and managed-image filenames for the current file. |
| Hover help | Hold the pointer over supported syntax. | A short explanation and a link to reference documentation matching the installed Norna version. |
| Problems | Open **View > Problems**. | Content errors and warnings for recognized page files. |
| Quick Fix | Place the cursor on a reported problem and select the light-bulb action. | Safe repairs for selected problems, such as closing an unfinished Norna block. |
| Go to Definition | Place the cursor on a managed-image filename and run **Go to Definition**. | Opens the matching source image, including an unambiguous image found under another page. |

Editor diagnostics are immediate guidance, not a replacement for
`norna config:check` or `norna content:check`. Run the command-line checks before
building or publishing.

## Requirements

- VS Code 1.96 or later.
- A trusted local filesystem workspace. Virtual and untrusted workspaces are
  not supported because the extension reads the project's installed engine.
- A Norna site whose project-local `@janga/norna` dependency has been installed
  with `npm install`.

Open the site project itself rather than an unrelated parent directory. The
extension finds the surrounding Norna site and loads schemas and Markdown
behavior from that project's installed `@janga/norna` package.

This keeps suggestions aligned with the Norna version recorded by the project.
Two projects may use different Norna versions; each receives help from its own
installation. If the local engine and extension use incompatible schema or
editor API versions, the extension disables Norna-specific help and reports how
to recover instead of applying incorrect rules.

## Recognized Files

Norna-specific support activates only inside the current site structure:

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

The three root YAML files use their matching schemas. Every valid page
`content.md` receives frontmatter and Norna Markdown support. A valid
`category.yaml` receives its category schema. A `theme.yaml` inside a page or
category directory receives the deliberately smaller page-theme schema.
Unrelated YAML and Markdown files keep their normal editor behavior and do not
receive Norna suggestions or diagnostics.

See [Site Files](site-files.md) and [Pages And Categories](pages.md) for the
complete directory contract.

## Configuration Help

Inside a recognized YAML file, start typing or press `Ctrl+Space`. Norna
supplies:

- valid fields and values for that file;
- small snippets for structured objects and list entries;
- descriptions that explain the effect of each choice;
- links to reference documentation for the project's installed Norna version.

Red Hat YAML displays the project-local schemas. Norna contributes the
structured snippets that are specific to its file model. Other extensions,
word-based completion, and AI assistants may still offer unrelated text. A
suggestion from another source is not necessarily valid Norna configuration.
VS Code combines these sources in one list; an unknown field is rejected by the
Norna schema in the **Problems** panel even if another source suggested it.

## Markdown And Image Help

In a recognized page `content.md`, Norna provides:

- a complete starting snippet when the file is empty;
- snippets and field suggestions for image stacks, carousels, and card lists;
- inline-note syntax help;
- managed-image filename suggestions from the current page and other pages;
- Go to Definition from an image filename to matching source files;
- Norna diagnostics in the **Problems** panel;
- safe quick fixes for an unclosed Norna block, an image that needs
  `content:sync`, and a local Markdown image that can become an image stack.

Image suggestions can include files under another page because `content:sync`
can relocate an unambiguous referenced image. If several page image directories
contain the same filename, neither the editor nor the command guesses which
source was intended.

## Refresh After An Engine Change

Run **Norna: Refresh IntelliSense** from the Command Palette after installing,
upgrading, or downgrading the project's `@janga/norna` package. The command
clears cached project support and reloads the current engine contract.

Use **Developer: Reload Window** after installing or replacing the extension
itself. Reloading the window does not replace the project's command-line
checks.

## Evaluate A Repository Build

Before the first Marketplace release, build an installable VSIX from a Norna
repository checkout:

```sh
cd editors/vscode
npm ci
npm run package
code --install-extension norna-vscode.vsix
```

If the `code` shell command is unavailable, open the Extensions view, select
**Views and More Actions**, choose **Install from VSIX...**, and select
`editors/vscode/norna-vscode.vsix`. Then run **Developer: Reload Window**.

## Troubleshooting

If Norna help does not appear:

1. Open a recognized file inside the current site structure.
2. Run `npm install` in the site project and confirm that
   `node_modules/@janga/norna` exists.
3. Check the **Norna** status item. Select it for the first missing or
   incompatible requirement.
4. Confirm that Norna and Red Hat YAML are enabled in the Extensions view.
5. Run **Norna: Refresh IntelliSense** after changing the project's engine.
6. Use **Developer: Reload Window** after installing a different VSIX.
7. Run `npm run norna:config:check` or `npm run norna:content:check` to
   distinguish an editor problem from invalid site source.

If unrelated YAML suggestions make the list difficult to read, first check the
source label shown by VS Code. Norna's structured YAML snippets are prefixed
with `Norna:`. Word completion, inline AI completion, and other extensions can
be disabled per language in workspace settings, but doing so is optional and
does not change what Norna accepts.
