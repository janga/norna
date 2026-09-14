# VS Code Editor Support

The Norna extension adds project-aware help while you edit a Norna site in
Visual Studio Code. It suggests valid configuration and Markdown syntax,
reports content problems in the editor, and helps you find managed images.
The command-line checks remain authoritative.

**Experimental:** the extension is available for evaluation as a manually
installed VSIX package, not through the Visual Studio Marketplace. Editor
coverage and compatibility are still being evaluated. The extension is
optional; you can write and build a Norna site without it.

## Install The Extension

Obtain a `norna-vscode.vsix` evaluation build from the maintainer. To build one
from a repository checkout, follow the
[extension build instructions](../editors/vscode/README.md#extension-development).
An npm installation of Norna does not by itself install the VS Code extension.

1. Open VS Code's Extensions view and its **Views and More Actions** menu.
2. Choose **Install from VSIX...** and select `norna-vscode.vsix`.
3. Confirm that **Norna** (`janga.norna-vscode`) and its dependency
   [Red Hat YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)
   are installed and enabled. Install Red Hat YAML if it is missing.
4. Run **Developer: Reload Window** from the Command Palette.
5. Open a recognized Norna file and run **Norna: Show IntelliSense Status**.
   Check the reported extension and project Norna versions against the
   evaluation build you intended to install.

Evaluation updates are manual: install the replacement VSIX and reload the
window. Do not expect Marketplace updates for this unpublished extension.
An installed extension does not guarantee that the project's Norna version is
compatible; use the status report to check both.

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
| Problems | Open **View > Problems**. | Content errors, warnings, and project-aware theme conflicts in recognized Norna files. |
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

Open the folder containing your site's `package.json` in VS Code. Run
`npm install` there if you have not already done so. The extension and the
project dependency have different jobs: the extension connects Norna to VS
Code, while the local `@janga/norna` package supplies the rules for your site.
Installing the extension alone does not install that project dependency.

This keeps suggestions aligned with the Norna version recorded by the project.
Two projects may use different Norna versions; each receives help from its own
installation. If a part of the editor support is incompatible with the local
Norna version, that help is unavailable and the status report explains why.

## Recognized Files

Norna identifies a file by where it is stored and which Norna installation
belongs to the project. A filename such as `theme.yaml`, or Norna syntax pasted
into an unrelated Markdown file, is not enough.

For example, these files belong to a recognizable site:

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

The extension checks three things before supplying the corresponding help:

1. **A surrounding site.** Starting from the file's directory, it looks upward
   for `config.yaml` and `pages/000-home/content.md`. Both files must exist on
   disk. The site directory does not have to be named `site`.
2. **A recognized location.** Root configuration files belong directly under
   that site directory. Page files belong under numbered page directories,
   such as `pages/030-examples/`. Nested pages repeat `pages/` between levels.
   Page directory names use three digits, a hyphen, and a lowercase slug, as
   in `030-examples`; `000-home` is reserved for the homepage and has no child
   pages.
3. **A compatible project installation.** The extension finds the project's
   local `@janga/norna` package and checks whether its editor rules are
   compatible. A missing or incompatible package is reported in VS Code.

| File location, relative to the site directory | Help provided |
| --- | --- |
| `config.yaml` | Site configuration |
| `theme.yaml` | Site-wide theme settings |
| `sitewide-content.yaml` | Shared content, such as banners and the footer |
| `pages/030-examples/content.md` | Page frontmatter, Norna Markdown blocks, notes, and images |
| `pages/030-examples/theme.yaml` | The smaller set of allowed page-theme overrides |
| `pages/010-guides/category.yaml` | Category settings |

The page-file rules also apply at valid nested locations. Example sites use
the same recognition rules as any other site; they do not need a special
editor setting.

Recognition does not require error-free content. An empty or invalid file can
still receive help when it has a recognized location. When first creating
`config.yaml`, the existing `pages/000-home/content.md` is enough to identify
its location before the configuration file is saved. Start from a generated
Norna project rather than an unnamed, unsaved editor tab.

The cursor's position determines which suggestions are relevant next. In
`content.md`, a blank body line can offer Norna blocks; inside an image block,
the help follows its YAML fields. A normal JavaScript code example does not
receive Norna block snippets. VS Code must also recognize the file's language
as **Markdown** or **YAML**, not **Plain Text**.

Unrelated YAML and Markdown files do not receive Norna's own suggestions or
diagnostics. Other installed extensions can still provide their usual help.

See [Site Files](site-files.md) and [Pages And Categories](pages.md) for the
complete directory contract.

## Configuration Help

Inside a recognized YAML file, start typing or press `Ctrl+Space`. The installed
Norna schemas and the two extensions work together to provide:

- valid fields and values for that file;
- small snippets for structured objects and list entries;
- descriptions that explain the effect of each choice;
- links to reference documentation for the project's installed Norna version.

Red Hat YAML supplies ordinary field and value suggestions, such as `palette`
and the allowed values of `preset`, from the project's Norna schemas. The Norna
extension adds starting templates for empty files and schema-defined snippets
for structured objects and list entries.

In `config.yaml`, `theme.yaml`, page-local `theme.yaml`, `sitewide-content.yaml`,
and `category.yaml`, Norna gives **its own templates and snippets** a sorting
preference over equally matching generic suggestions. It does not change the
priority of field or value suggestions supplied by Red Hat YAML. Not every
field has a Norna snippet, so recognizing a Norna file does not make all its
valid configuration suggestions appear first.

Other extensions, word-based completion, and AI assistants may still offer
unrelated text. A
suggestion from another source is not necessarily valid Norna configuration.
VS Code combines these sources in one list; an unknown field is rejected by the
Norna schema in the **Problems** panel even if another source suggested it.
Norna also checks combinations that JSON Schema cannot decide in isolation. For
example, it reports a non-uniform `sections.backgroundPattern` when the current
page hierarchy makes navigation resolve to `tree`.

## Markdown And Image Help

In a recognized page `content.md`, Norna provides:

- a complete starting snippet when the file is empty;
- snippets and YAML field suggestions for image stacks, carousels, and card lists;
- semantic-callout snippets on a blank body line or after `> [!`, using the six supported meanings;
- named-sidenote reference and definition help;
- managed-image filename suggestions from the current page and other pages;
- Go to Definition from an image filename to matching source files;
- Norna diagnostics in the **Problems** panel;
- safe quick fixes for an unclosed Norna block, an image that needs
  `content:sync`, and a local Markdown image that can become an image stack.

Image suggestions show **Unused on this page** or **Already used on this page**
beside the filename. Norna checks references in this page's image and card
blocks, including unsaved edits; these labels do not describe publication
status. Images stored on this page come first, then images from other pages.
Within each group, unused images come before used images.

Image suggestions can include files under another page because `content:sync`
can relocate an unambiguous referenced image. If several page image directories
contain the same filename, neither the editor nor the command guesses which
source was intended. A reference that cannot be resolved to one source file is
marked **Ambiguous on this page**; the suggestion also shows its source path.

To discover Norna blocks without knowing their syntax, place the cursor on a
blank, unindented body line and run **Trigger Suggest** from the Command Palette
or press `Ctrl+Space`. The list includes `NOTE`, `TIP`, `IMPORTANT`, `WARNING`,
`CAUTION`, `DANGER`, `image-stack`, `image-carousel`, `card-list`, and `page-list`.
Selecting an entry inserts its source template.

These top-level templates are not offered inside code examples, comments,
frontmatter, or nested content. Inside a Norna block, suggestions instead follow
that block's YAML fields. Other extensions may add their own suggestions.

To add another entry, run **Trigger Suggest** on a blank line after an item in
`image-stack`, `image-carousel`, or `card-list`. Choose **Add image** or
**Add card**. Norna inserts the entry with the list's indentation, even when
the blank line has no indentation. Missing fields for the current item remain
available. The same commands work after an empty `items:` line. They are not
offered inside multiline text or where insertion would split an existing item.
`page-list` has no editable items because its entries come from the page tree.

In recognized `content.md` files, Norna gives its own templates, frontmatter
suggestions, embedded-block fields and values, and image filenames priority
over equally matching generic suggestions. In standalone YAML files, this
preference applies only to Norna's own templates and snippets, as described
under [Configuration Help](#configuration-help). VS Code still
controls text matching and your snippet-placement preferences, so Norna entries
are not guaranteed to appear first in every configuration. Ordinary Markdown
and YAML files, including literal code examples within a Norna page, do not
receive this priority. Example sites use the same project-recognition rules as
other Norna sites; their directory name does not disable editor support.
No global editor or formatter settings are changed.

Semantic callouts use the GitHub-style alert marker on its own quoted line:

```md
> [!TIP]
> Use a tip for helpful guidance.
```

Keep the marker and body on adjacent quoted lines. Norna does not repair
Markdown during saves or register a Markdown formatter. Custom callout titles
remain invalid; the type supplies the built-in localized label. Completion
lists only the six standard types. An unknown uppercase type can still be
written manually and falls back to a
neutral blockquote with a warning. See the
[semantic-callout reference](content.md#semantic-callouts).

Red Hat YAML supplies ordinary field/value completion, schema validation, and
formatting in standalone YAML files. Norna adds schema selection, its own
templates and snippets, and checks that depend on the site structure. Norna
provides frontmatter and embedded block help in `content.md` from
the engine's shared schema; Red Hat YAML is not assigned Markdown fences.
The supported setup uses VS Code and Red Hat YAML without a Markdown formatter.
When another extension formats Markdown automatically, disable formatting on
save for Markdown in the workspace settings:

```json
{
  "[markdown]": {
    "editor.formatOnSave": false
  }
}
```

Merge this setting into an existing `[markdown]` block rather than adding a
duplicate. Standalone YAML formatting and other languages keep their existing
settings. Explicit Markdown formatting with Prettier or another extension is
outside the verified setup. Norna does not guarantee compatibility with
arbitrary formatter settings. It reports invalid content but does not undo
another formatter's changes.

## Refresh After An Engine Change

Run **Norna: Refresh IntelliSense** from the Command Palette after installing,
upgrading, or downgrading the project's `@janga/norna` package. The command
clears cached project support and reloads the current engine contract.

Use **Developer: Reload Window** after installing or replacing the extension
itself. Reloading the window does not replace the project's command-line
checks.

## Troubleshooting

If Norna help does not appear:

1. Open `pages/000-home/content.md` inside your site and run
   **Norna: Show IntelliSense Status** from the Command Palette. If the command
   is absent, check that the Norna extension is installed and enabled.
2. If the file is not recognized, compare its location with
   [Recognized Files](#recognized-files). Check that `config.yaml` and the
   homepage exist on disk, and that VS Code shows **Markdown** for `content.md`
   or **YAML** for a configuration file.
3. If the project dependency is missing, run `npm install` in the folder
   containing the site's `package.json`. If support is incompatible, follow
   the status report rather than changing the document to fit another version.
4. Confirm that the workspace is trusted and both Norna and Red Hat YAML are
   enabled. Trust a workspace only when you trust its source.
5. Run **Norna: Refresh IntelliSense** after installing or changing the
   project's Norna dependency. Use **Developer: Reload Window** after replacing
   the extension itself.
6. In `content.md`, place the cursor on an unindented blank body line outside
   code blocks and frontmatter. Run **Trigger Suggest**. Norna block names
   should appear; not every position offers the same suggestions.
7. Run `npm run norna:config:check` or `npm run norna:content:check` to
   distinguish an editor problem from invalid site source.

If unrelated YAML suggestions make the list difficult to read, first check the
source label shown by VS Code. Norna's structured YAML snippets are prefixed
with `Norna:`. Word completion, inline AI completion, and other extensions can
be disabled per language in workspace settings, but doing so is optional and
does not change what Norna accepts.
