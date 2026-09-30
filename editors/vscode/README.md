# Norna for VS Code

Norna for VS Code provides a site tree for opening and creating pages and
editing their titles and metadata, together with project-aware help for Norna
configuration, Markdown, named sidenotes, content blocks and managed images.

**Experimental:** this extension is distributed as a VSIX for evaluation.
It is not published in the Visual Studio Marketplace, and updates must be
installed manually. Editor coverage and compatibility are still being
evaluated. Norna sites can be edited and built without the extension.

The extension reads schemas and Markdown behavior from the `@janga/norna`
installed by the current project. This keeps suggestions and documentation
links aligned with the engine version that builds the site. Norna-specific help
appears only in recognized Norna files.

Extension 0.9.0 supports the `root/` source layout and schema version 6,
including independent site-resource ownership in the engine's editing tree.

## Features

- A dedicated Norna view with readable page names and their actual
  configuration, images, child-page folders and public files.
- Page opening, creation from each `pages/` folder, and
  source-preserving page information edits.
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

Select **Norna** in the Activity Bar to open **Site Tree**. The VS Code
extension shows one active site from the folders in your workspace. A sole
site is selected automatically. If the workspace contains several, use
**Norna: Choose Site…** to select one by title and source location. The choice
is remembered for that workspace; opening another site's file does not switch
or add a tree. Open just your site's folder for a workspace containing only
that site's files; the ordinary Explorer continues to show all workspace folders.

The tree shows site-wide `site-config/` and `public/` before the homepage,
marked **Homepage**. The homepage represents `root/`. Select a page title to
open its `content.md`; that file has no separate tree row. Only the chevron or
keyboard expansion opens the branch.
Directories select without opening a file. Individual files use VS Code's
normal editor or preview, including image previews.

Page names hide numeric ordering prefixes. Hover over a page to see its full
published URL and its slug on separate lines labelled **URL:** and **Slug:**.
The homepage shows only **URL:**. If the configured address is unavailable, the tooltip
shows the known site-relative path.
Choose **Show URL paths** in the Site Tree view menu to add paths after page
titles. It starts off, remembers your choice for the workspace, and applies to
collapsed and expanded pages. Warnings and unsaved markers remain visible.

Each page shows its existing `images/`, `tree-theme.yaml`, `page-theme.yaml` and `pages/` in that
order. Site-wide files are siblings of the homepage, not its children, matching
the physical source layout. The settings folder starts expanded and remembers
subsequent choices. Hover explains theme scope and what belongs in `public/`.
A leaf has no chevron unless it has visible details, including an empty folder.

Hover over a theme file to see whether it modifies inherited settings or
replaces them with a preset, even when that preset has the same name. Tree-theme
help describes the branch; page-theme help describes only that page. These
values include unsaved theme edits. Errors show that the preset is unavailable
until the theme is repaired. Removing an optional theme previews the inherited
tree theme and preset that resume; page-only overrides and independent presets
farther down the tree keep their respective scopes.

Right-click a row to add, change or delete its contents. Use the native
keyboard context-menu command (Shift+F10) if preferred. There are no permanent
per-row **+** or **…** buttons. The first visible Site Tree explains this once;
**Site Tree Help** in the view menu repeats it.

| Row | Context actions |
| --- | --- |
| Page | Add, Rename, Properties, Move, Copy Link, Copy Folder Path, References, Delete |
| Homepage | Page actions except Move and Delete |
| `pages/` | Add Page, Delete |
| `images/` | Add Images, Copy Folder Path, Delete |
| Image | Insert Image in Page, Rename, Replace, References, Delete |
| `downloads/` | Add Attachments, Copy Folder Path, Delete |
| `site-config/` | Add missing supported configuration |
| Optional configuration file | Delete |
| `public/` | New File, Add Files, New Folder, Delete |
| Public subfolder | Public-folder actions plus Rename and Move |
| Public file | Rename, Replace, Move, Copy Link, References, Delete |

**Add** on a page creates a child page, imports images, or creates a missing
page/branch theme. Missing `pages/` and `images/` are created by the operation.
A required file cannot be deleted separately. Fixed folder and configuration
filenames cannot be renamed. Left-click or Enter opens an existing page/file;
Open is not duplicated in its context menu.

The view menu offers **Add Public Files…**, including when `public/` is absent,
and **Add Site Configuration…** for missing site files. These actions work
without a valid homepage. A damaged page retains its source-repair choices.
Errors and warnings supplement type icons and point to the affected files.
Changes made outside the extension normally refresh the tree; **Norna: Refresh
Site Tree** remains in the view menu and Command Palette.

**Copy Folder Path** in the context menu copies the absolute local directory
for a page, `images/` or `downloads/`. For a page, this is the directory
containing `content.md`. The clipboard contains a plain path, without `cd` or
added quotation marks. Quote paths containing spaces when using them with `cd`.

**Rename…** on a page changes its H1 and title, preserving its URL. **Properties…**
shows the complete published address and edits page metadata. With extension
0.13.0 and the engine's `sitePageAddressOptionsApiVersion: 1`, it also provides
**Slug** and a separate **Change address…** action. Review the new address,
affected descendants and links, then confirm. The homepage has no slug field.

**Preserve old addresses as aliases** starts checked and covers the page and
all affected descendants. Uncheck it to create no aliases for their old
addresses. Existing aliases remain available; an alias becoming the primary
address is reclaimed. Edit each page's alias list later if needed.

Apply metadata and slug changes separately. Save or undo unsaved page and
site-settings edits before changing the slug. **Save changes** edits metadata
in the buffer; **Change address…** moves the directory and writes affected
files. Editor Undo does not reverse the address change. Earlier engines keep
the current address display and their existing address commands.

**Move…** in the page's context menu reorders it or changes its parent. It keeps you
in Site Tree: expand and scroll the familiar tree, then right-click a
destination page to place the moving page before, after, first or last under
it. Clicking a page still opens its `content.md`. The source page remains in
place with its normal title, page icon and description. Starting the move
expands that page to show **Cancel page move from /relative/path/**. A temporary
row at the destination uses the same page title and icon; its cancellation
row reads **Cancel move to slug**. From extension 0.13.4, destination actions
use the moving page’s slug, for example **Cancel move to guide**. With **Show URL paths** enabled, page rows show their
respective paths. The ordinary selection highlight follows the selected row.
The destination's other children show affected addresses, authored links to update,
and a reminder that files have not changed yet. Expand the detail groups to
see individual changes. Beneath the preview,
choose **Complete move to slug**. For a parent change, the final confirmation
shows **Preserve old addresses as aliases**, checked by default. Uncheck it to
create no aliases for the old addresses of the page and its affected
descendants. Existing aliases remain available. Confirm **Complete page move**
to apply, or cancel to return to the tree. **Cancel page move** leaves files
unchanged and ends the move. Reordering keeps its simple confirmation because
addresses do not change. The checkbox requires extension 0.13.1 and the engine's
`sitePagePlacementOptionsApiVersion: 1`; older engines retain preservation.

Extension 0.13.2 shows only applicable placement actions and **Cancel Page Move**
in row menus during a move; the preview also offers completion. To cancel from
anywhere in the tree, use the **Cancel Page Move** close icon in the Site Tree
toolbar, any row's context menu, or Escape while the tree has focus. Escape in
an editor or input field keeps its normal behavior. Cancellation leaves files
unchanged and restores the ordinary menus. The source and preview cancellation
rows remain available. A second move cannot start until the current move ends.
If planning fails, the error dialog can open
the affected file, keep the move active for another placement, or cancel it.
Reordering among siblings leaves URLs intact; moving to another parent updates
supported internal links and preserves old
page and descendant addresses by default. Moving back to a page's own previous address
reclaims it as the primary address; another page's previous address remains
reserved. Site Tree marks unsaved pages and shows their
count on ancestor rows, even when the affected page is collapsed. Save affected
edits first; move errors list the files that still need saving. VS Code Undo
does not reverse the whole move; Norna attempts to restore files after a
handled failure and reports any paths that still need inspection.
With a compatible engine, creation and Properties open a combined form.
Existing information is prefilled; empty inputs have example placeholders.
Additional addresses start with a **+** button and no empty row. Each added
row has a remove button. Saved alias removal retains incoming-link review.
The form requires the engine's `sitePageFormApiVersion: 1`; older engines keep
the separate dialogs.
Creation previews the parent, address and directory before writing. Information
edits stay in the buffer for normal save and undo. See the
[site-tree reference](https://janga.github.io/norna/reference/workflows/editor/#work-from-the-site-tree)
for fields, previous URLs, unlisted pages and scope limits.

Extension 0.4.0 adds prototype page/image actions with a compatible engine.
The current development import form copies one or several images into the
selected page. Its image previews open a larger view, including for an
existing image that would be replaced. Each row can instead be ignored or
inserted into one editable image block at the end of its content, with
optional alt text and caption.
The editable filename determines whether the import creates a new image or
replaces an existing one; replacements are clearly previewed and confirmed
together. **Insert Image in Page…** inserts the image into its owning page,
whose title is shown in the form. It opens one form with a large,
expandable preview, decorative choice, alternative text and caption. Its
current filename is shown below the image;
use **Rename…** on the image row to rename its file and update known image-block
references. The extension preserves the extension and refuses collisions or
unresolved references. Text edits retain existing unsaved work and remain
unsaved until you save them. Editor Undo does not reverse the complete rename.
Image actions also replace and remove images after showing managed-image
references. Page
removal includes owned files and descendants; Home is protected. Removal and
replacement use the operating system's Trash, not editor Undo, and do not
rewrite references. See the
[image workflow](https://janga.github.io/norna/reference/workflows/editor/#add-and-use-page-images)
for cancellation, recovery and current limits.

Use **Norna: Addresses and Links…** from the Command Palette for additional address operations. Copy a public
address or internal link, change a page's final URL segment with a preview,
manage redirect addresses, and open passages linking to a page. Address changes
within the same parent preserve ordering, update internal links and keep old
page addresses as redirects. Additional-address edits stay in the editor
buffer for normal Save and Undo.

Optional themes, shared content and public files have **Delete…** in
their context menu. Confirmations explain inherited settings or known
page links; page removal checks links into the complete removed branch from
pages that remain. **Show links** opens the source list and cancels removal.
Checks include unsaved page content and report incomplete analysis. Required
site configuration and the homepage are protected. These actions need the
engine's corresponding removal/address capabilities. See
[addresses and removal](https://janga.github.io/norna/reference/workflows/editor/#inspect-and-change-addresses).

Public files and subfolders can be created, imported, renamed and moved within
`public/`. Public-file replacement keeps the address and sends the original to
Trash. Renaming or moving updates known page-content links, including dirty
buffers; configuration, raw HTML and external references are not rewritten.
Preflight checks prevent overwriting and conflicts with generated paths, page
addresses and conventional site logos. Warnings explain changes to automatic
logo/icon discovery. **Copy Link** copies the full published address.

Deleting a nonempty optional folder reviews its pages, files and incoming
references before sending it to Trash. Invalid or linked filesystem entries
that cannot be checked safely require repair in Explorer first. Resource
rename restores the original path if its text update fails; a failed recovery
reports both paths. Save edited references before publishing.

The context action model requires extension 0.10.0 and the engine's optional
`siteResourceActionsApiVersion: 1`. An older engine retains its supported
commands without exposing unsupported resource operations. Direct page opening and the hidden content row require extension 0.6.0.
Missing-file creation, repair and expanded file diagnostics also require the
engine's site-tree editing capability. The single-site selection requires extension
0.3.1 or later. The file view
needs extension 0.3.0 and the engine's optional page-file support.
Engines with the earlier site-tree API retain their page tree and show a
message explaining the unavailable file view. Compatible IntelliSense remains
available. Use **Norna: Refresh Site Tree** after an engine update.

## Page Attachments

Use **Add > Add Attachments…** on a page to copy files into its `downloads/`
folder. The batch form offers **Import and insert link**, **Import** and
**Ignore**, with editable filenames/link text and ordering. It inserts at the
owning page's captured cursor or appends when that page was not active.
Single links use ordinary Markdown; multiple links form a list.

Name collisions show the existing and incoming file's type, size and filesystem
modification date. Replacement requires confirmation and moves the previous
file to Trash. Text edits stay dirty and support Undo; filesystem copies and
replacement do not. Cancellation before applying changes nothing. Stale pages
and unsafe insertion locations are rejected, and partial failures list recovery
work instead of claiming the batch was atomic.

Existing attachments offer insertion, rename, replacement, reference lookup,
link copying and deletion. Empty `downloads/` and `images/` folders are hidden;
the page always retains Add actions. This requires the selected engine's
`siteAttachmentsApiVersion: 1`, available in current development builds.
See [page attachments](https://janga.github.io/norna/reference/site/attachments/)
for storage, sharing and publication rules, and the
[editor workflow](https://janga.github.io/norna/reference/workflows/editor/#add-and-use-page-attachments)
for recovery and editing behavior.

## Local Preview

Right-click a page for **Preview Page**, or choose **Preview Site** in Site
Tree's view menu. Preview opens saved source in the default browser through
the selected project's engine. Unsaved site files prompt **Save Site and
Preview**, **Preview Saved Files** or **Cancel**; unrelated files are not saved.

Port precedence is the registered review site's fixed port, otherwise
`NORNA_DEV_PORT` from the VS Code launch environment, otherwise **4321**.
`settings.yaml` has no development-port field. Quit and relaunch VS Code when
changing its environment. An occupied or unverified port fails without a spare
port or `--kill`. Only an identity-verified server for this exact site is reused.

The view menu also provides **Stop Preview Server** and **Show Preview Log**.
A ready server survives window close/reload; cancellation cleans up only a
new server started by that request. A failed page response does not open a
browser. Browser-launch failure retains the server and offers URL copying or
retry. The capability is `sitePreviewApiVersion: 1`; older engines receive an
explicit update message. See the
[preview reference](https://janga.github.io/norna/reference/workflows/editor/#preview-your-site-locally)
for port conflicts, saved source and recovery.

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
For standalone YAML, including `tree-theme.yaml`, this applies to Norna's templates
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
3. Open `site/root/tree-theme.yaml` or a page `content.md`.
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

For the focused site-tree workflow, run from the repository root:

```sh
npm --prefix editors/vscode run test:integration -- --suite site-tree
```

It uses the actual tree, menus and input widgets to open/create pages and edit
information, including dirty-buffer undo, repeated saves, multiple sites and
external file changes. Add `--version 1.96.0` for the minimum editor or
`--with-prettier` for the supported formatter configuration.

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
