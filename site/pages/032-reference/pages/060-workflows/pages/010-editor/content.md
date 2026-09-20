---
page:
  description: Find pages, configuration and images in VS Code, create pages, edit page information and use Norna-aware suggestions.
---

# VS Code editor support

The optional Norna extension connects VS Code to the rules in a project's
installed Norna package. Its site tree opens pages and their files, creates
pages and edits their titles and metadata. It also adds configuration and
Markdown help, diagnostics and managed-image navigation. Command-line checks
remain authoritative.

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
and `content.md`; the site folder need not be named `site`.

| Location relative to the site | Help |
| --- | --- |
| `config.yaml` | Technical site settings |
| `theme.yaml` | Shared site theme |
| `page-theme.yaml` | Homepage-only presentation overrides |
| `content.md` | Homepage frontmatter, Markdown blocks, notes and images |
| `sitewide-content.yaml` | Shared content |
| `pages/010-guide/content.md` | Frontmatter, Markdown blocks, notes and images |
| `pages/010-guide/theme.yaml` | Limited page-theme settings |
| `pages/010-guide/category.yaml` | Navigation category |

Page rules also apply to valid nested folders repeating `pages/` between
levels. Unrelated Markdown/YAML files do not receive Norna's own help.

An empty or invalid recognized file can still receive help. When first
creating `config.yaml`, an existing homepage is sufficient to recognize its
location before saving. Start from a generated project rather than an unnamed,
unsaved tab. VS Code must identify the language as Markdown or YAML, not Plain
Text. See [site files](/reference/site/files/) for the source model.

## Work from the site tree

Select **Norna** in VS Code's Activity Bar, the strip of view icons beside the
sidebar. Its **Site Tree** shows pages by their readable titles and files by
their real names. The ordinary **Explorer** remains available for other project
files. You can also find **Site Tree** through **View: Open View…**.

The VS Code extension shows one active site from your workspace, the folder
or set of folders opened in this VS Code window. When the workspace contains
one site, it is selected automatically. With several sites, select
**Choose Site…** in the empty view or run **Norna: Choose Site…** from the
Command Palette. The chooser shows each site's title and source location.
Use that command or the view's **Choose Site…** button to switch later.
The extension remembers your choice in this workspace.

Opening a file from another site does not add or switch the tree. To work
with only one site's files in both Site Tree and Explorer, use **File → Open
Folder…** to open that site's source folder. Site Tree does not change which
folders VS Code includes in Explorer.

The top row uses the homepage's title and is marked **Homepage**. Clicking it
opens `site/content.md` (or `content.md` in your chosen site source folder).
Beneath a page, the tree follows the actual
[file organization](/reference/site/files/): existing configuration files come
first, followed by `images/` and the child-page folder `pages/`. The root also
shows its existing `public/` folder, including nested downloads and other
static files. A readable page row represents its numbered source directory;
the number stays in the filesystem but does not clutter the displayed title.

For example, a homepage titled **Norna** and a child titled **Guide** appear as:

```text
Norna  Homepage           opens site/content.md
  config.yaml
  theme.yaml
  page-theme.yaml
  images/
  pages/
    Guide                 opens site/pages/010-guide/content.md
      theme.yaml
      images/
  public/
```

Only existing files and folders appear. The root `theme.yaml` controls the
shared site appearance; optional `page-theme.yaml` affects only the homepage.
A branch's `theme.yaml` belongs under that branch. See
[configuration files](/reference/configuration/). The page row opens
`content.md`, so that file is not repeated beneath it. Navigation categories
use their labels and open `category.yaml`; that file also appears among the
category's configuration files.

Click a title to open its source. Use the separate chevron, or the keyboard
arrow keys, to expand and collapse children. Within the chosen site, the tree
reveals the active source file, including one opened through the website's
**Open in VS Code** link. Other expanded branches remain open. Resource files use VS Code's normal
editor selection: PNG images, for example, open in its image preview. Use
VS Code's built-in tree find when looking for a visible label.

Site source folders can have a name other than `site`. Pages omitted from
generated navigation remain in the authoring tree, marked **unlisted**; they
are still published. That mark also applies to descendants of an unlisted page.

To create a page in an existing `pages/` folder, select its **Norna: Add Page…**
plus button or the same action in its context menu. That folder is already
the destination. Enter a title and URL segment, review the resulting address
and directory, then select **Create page**. The new page appears last among
its siblings and opens for editing.

To create the first child of a page without `pages/`, right-click the page and
choose **Norna: New Page…**, then **Inside**. The same command also offers
creation beside a page or at the site root. Browsing alone creates no folders.
**Norna: New Category…** follows the same steps for a navigation category.
Choosing Home as the parent creates a child in the site root's `pages/` folder.
Escape cancels before creation without writing files. These actions use the same rules as
[`page:add` and `category:add`](/reference/commands/create/).

Choose **Norna: Page Information…** to edit the title, description or whether
a page is listed in navigation. For categories, edit the label and description.
Leave a description empty to remove it. The current URL, source location and
previous URLs are also shown; addresses are read-only in this version.

A title edit changes the Markdown H1 and labels derived from it. The page's
address and link text written elsewhere stay the same. Changes are made in
the editor buffer, support **Undo**, and retain earlier unsaved edits. Save
normally when ready. If the source changes while the information dialog is
open, reopen the dialog before applying the edit. Repair invalid YAML or a
missing/duplicate H1 in the source; other valid tree nodes remain usable.
YAML aliases, anchors or tagged values that cannot be edited directly through
Page Information need a source edit.

Single-site selection requires extension version 0.3.1 or later. The file
tree requires extension version 0.3.0 or later and an engine build
with page-file support. Engines with the earlier site-tree support retain
their page tree and show a message explaining the missing file view. An
incompatible engine reports the problem on its site root; compatible
IntelliSense remains available. Run **Norna: Refresh Site Tree** after an engine
update or to rediscover sites. External file changes normally refresh the
tree automatically.

Use **Page Information** on pages and categories. Other files open for normal
editing and do not receive page-metadata actions. Importing or deleting images,
creating themes, moving/reordering/deleting pages, changing addresses and
inserting links are outside this tree's scope. Generated `.norna` output and
symbolic links are not listed; use Explorer for files outside the tree.

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
