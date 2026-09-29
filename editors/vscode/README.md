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

Page names hide numeric ordering prefixes; hover reveals the actual source
path. Each page shows its existing `images/`, `tree-theme.yaml`, `page-theme.yaml` and `pages/` in that
order. Site-wide files are siblings of the homepage, not its children, matching
the physical source layout. The settings folder starts expanded and remembers
subsequent choices. Hover explains theme scope and what belongs in `public/`.
A leaf has no chevron unless it has visible details, including an empty folder.

A page's **+** offers child-page creation, image import and missing supported
source files. It works without `pages/` or `images/`; the chosen operation
creates the directory when needed. The settings folder's **+** also exposes
missing site files.
Creation previews the target and effect, uses a valid initial setting and never
overwrites a file. Incomplete directories remain visible with source-repair
choices. Errors and warnings supplement type icons; unused author files are
informational, while valid static public files remain recognized resources.
Site configuration problems point to the affected configuration file. Its
Add action remains available when homepage content is missing; an unreadable
site or root page directory remains reported in Problems.

Each existing `pages/` also offers **Norna: Add Page…**. Page actions remain in
**…**, the context menu and Command Palette, including information, addresses,
source opening and removal. Active `content.md` reveals its owning page;
resource files retain their own selection.
With a compatible engine, creation and Page Information open a combined form.
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
Import copies one image into the selected page and offers an editable image
block at the end of its content. Image actions also insert existing images,
replace them and remove them after showing managed-image references. Page
removal includes owned files and descendants; Home is protected. Removal and
replacement use the operating system's Trash, not editor Undo, and do not
rewrite references. See the
[image workflow](https://janga.github.io/norna/reference/workflows/editor/#add-and-use-page-images)
for cancellation, recovery and current limits.

Extension 0.5.0 adds **Addresses and links…** to page actions. Copy a public
address or internal link, change a page's final URL segment with a preview,
manage redirect addresses, and open passages linking to a page. Address changes
within the same parent preserve ordering, update internal links and keep old
page addresses as redirects. Additional-address edits stay in the editor
buffer for normal Save and Undo.

Optional themes, shared content and public files have **Move to Trash…** in
their ellipsis/context menu. Confirmations explain inherited settings or known
page links; page removal checks links into the complete removed branch from
pages that remain. **Show links** opens the source list and cancels removal.
Checks include unsaved page content and report incomplete analysis. Required
site configuration and the homepage are protected. These actions need the
engine's corresponding removal/address capabilities. See
[addresses and removal](https://janga.github.io/norna/reference/workflows/editor/#inspect-and-change-addresses).

Direct page opening and the hidden content row require extension 0.6.0.
Missing-file creation, repair and expanded file diagnostics also require the
engine's site-tree editing capability. The single-site selection requires extension
0.3.1 or later. The file view
needs extension 0.3.0 and the engine's optional page-file support.
Engines with the earlier site-tree API retain their page tree and show a
message explaining the unavailable file view. Compatible IntelliSense remains
available. Use **Norna: Refresh Site Tree** after an engine update.

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
