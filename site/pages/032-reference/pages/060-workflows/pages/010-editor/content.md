---
page:
  description: Install optional VS Code help, recognize supported files and troubleshoot suggestions, diagnostics and formatting.
---

# VS Code editor support

The optional Norna extension connects VS Code to the rules in a project's
installed Norna package. It adds configuration and Markdown help, diagnostics
and managed-image navigation. Command-line checks remain authoritative.

The extension is experimental and distributed as a manually installed VSIX,
not through the Visual Studio Marketplace. An npm installation of Norna does
not install the extension. You can edit and build without it.

## Install and verify

You need VS Code 1.96 or later, a trusted local filesystem workspace and an
installed project-local `@janga/norna` dependency. Open the folder containing
the site's `package.json` and run `npm install` there if needed. Virtual and
untrusted workspaces are unsupported because editor support reads project code.

1. Obtain a `norna-vscode.vsix` evaluation build from the maintainer. Building
   one from source is a [contributor task](https://github.com/janga/norna/blob/main/editors/vscode/README.md#extension-development).
2. In VS Code's Extensions view, open **Views and More Actions**, choose
   **Install from VSIX...** and select the file.
3. Confirm that **Norna** (`janga.norna-vscode`) and **Red Hat YAML** are enabled.
4. Run **Developer: Reload Window**.
5. Open a Norna file and run **Norna: Show IntelliSense Status**. Check both
   extension and project-engine versions.

A **Norna** status-bar item appears for recognized files. Its check mark means
project support is ready; a warning means the package is missing or incompatible.
Selecting it opens the same status report. Each project uses its own installed
engine, so two projects can receive different version-appropriate help.

## Recognized files

Recognition depends on the file's location, surrounding site and local engine,
not just a familiar filename. The extension searches upward for `config.yaml`
and `pages/000-home/content.md`; the site folder need not be named `site`.

| Location relative to the site | Help |
| --- | --- |
| `config.yaml` | Technical site settings |
| `theme.yaml` | Root theme |
| `sitewide-content.yaml` | Shared content |
| `pages/010-guide/content.md` | Frontmatter, Markdown blocks, notes and images |
| `pages/010-guide/theme.yaml` | Limited page-theme settings |
| `pages/010-guide/category.yaml` | Navigation category |

Page rules also apply to valid nested folders repeating `pages/` between
levels. Home has no children. Unrelated Markdown/YAML files do not receive
Norna's own help.

An empty or invalid recognized file can still receive help. When first
creating `config.yaml`, an existing homepage is sufficient to recognize its
location before saving. Start from a generated project rather than an unnamed,
unsaved tab. VS Code must identify the language as Markdown or YAML, not Plain
Text. See [site files](/reference/site/files/) for the source model.

## Suggestions and diagnostics

Press **Ctrl+Space** or run **Trigger Suggest**. On macOS this uses Control,
not Command. Hover supported syntax for explanations and reference links;
open **View > Problems** for diagnostics.

Red Hat YAML supplies ordinary YAML fields/values, schema validation and YAML
formatting. Norna selects the project's schemas, adds empty-file templates and
structured snippets, and checks site-dependent combinations such as section
backgrounds conflicting with tree navigation. Frontmatter and fenced-block
help in Markdown come from Norna's shared engine rules; Red Hat YAML is not
assigned to Markdown fences.

In `content.md`, an unindented blank body line offers `NOTE`, `TIP`,
`IMPORTANT`, `WARNING`, `CAUTION`, `DANGER`, `image-stack`, `image-carousel`,
`card-list` and `page-list`. Callout types also appear after `> [!`.
Templates are not offered inside literal examples, comments, frontmatter or
nested content. Within a Norna block, suggestions follow its YAML fields.

On a blank line after an item, or after an empty `items:`, choose **Add image**
or **Add card** to insert an entry with appropriate indentation. This also
works on an unindented blank line, but not inside multiline text or where it
would split an existing item. `page-list` has no editable items.

Norna prioritizes its own Markdown templates, fields, values and image names
over equally matching generic suggestions. In standalone YAML, this preference
applies only to Norna's templates/snippets, not Red Hat YAML's normal fields.
VS Code still controls matching and snippet placement; other extensions can
propose invalid text. A suggestion's presence does not make it valid Norna.

## Managed images and quick fixes

Image suggestions show **Unused on this page** or **Already used on this page**,
including unsaved references in image/card blocks. Current-page files precede
other-page files; unused files precede used files within each group. These
labels do not describe publication status.

Other-page images are offered because `content:sync` can relocate an unambiguous
source. Duplicate filenames are not guessed: unresolved references show
**Ambiguous on this page** with the source path. **Go to Definition** opens the
matching source, including an unambiguous file under another page.

Quick Fix offers selected repairs: close an unfinished Norna block, run image
sync, or turn a local Markdown image into an image stack. Review edits and run
`content:check`; diagnostics and quick fixes do not replace the full check.

## Formatting

Norna does not register a Markdown formatter or rewrite Markdown on save.
The verified setup uses VS Code and Red Hat YAML without automatic Markdown
formatting. Keep a callout marker and body on adjacent quoted lines:

```md
> [!TIP]
> Use a tip for helpful guidance.
```

If another extension reformats Markdown, disable its save formatting in the
workspace settings:

```json
{
  "[markdown]": {
    "editor.formatOnSave": false
  }
}
```

Merge into an existing language block. Standalone YAML and other languages
retain their settings. Explicit formatting with Prettier or arbitrary Markdown
formatters is outside the verified setup; Norna reports invalid results but
does not undo another formatter's changes. Norna changes no global profile or
formatter settings. [AI suggestions](/reference/workflows/editor-ai-suggestions/)
are a separate source of proposed edits.

## Refresh and troubleshoot

After changing the project's engine, run **Norna: Refresh IntelliSense** to
clear cached support. After replacing the extension, install the new VSIX and
run **Developer: Reload Window**; unpublished evaluation builds do not receive
Marketplace updates.

If help is absent, check the status report, file location and language, trusted
workspace, installed project dependency and enabled Norna/Red Hat YAML
extensions. Trigger suggestions on a blank body line outside fences and
frontmatter. Use `config:check` or `content:check` to distinguish an editor
problem from invalid source. If an incompatible engine is reported, follow
that report rather than changing content to fit another version's suggestions.
