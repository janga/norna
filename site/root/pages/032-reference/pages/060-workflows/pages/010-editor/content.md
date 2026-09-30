---
page:
  description: Edit and preview a Norna site in VS Code, manage page files and use Norna-aware suggestions.
---

# VS Code editor support

The optional Norna extension connects VS Code to the rules in a project's
installed Norna package. Its site tree opens pages and their files, creates
pages and edits their titles and metadata. It also manages images and page
attachments, opens a local site preview, and adds configuration and Markdown
help and diagnostics. Command-line checks remain authoritative.

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

The `root/` source layout requires VS Code extension 0.8.0 and engine schema
version 5. Update the local extension when updating to this source format.

## Recognized files

Recognition depends on the file's location, surrounding site and local engine,
not just a familiar filename. The extension searches upward for `site-config/settings.yaml`
and `root/content.md`; the site folder need not be named `site`.

| Location relative to the site | Help |
| --- | --- |
| `site-config/settings.yaml` | Technical site settings |
| `root/tree-theme.yaml` | Shared site theme |
| `root/page-theme.yaml` | Homepage-only presentation overrides |
| `root/content.md` | Homepage frontmatter, Markdown blocks, notes and images |
| `site-config/shared-content.yaml` | Shared content |
| `root/pages/010-guide/content.md` | Frontmatter, Markdown blocks, notes and images |
| `root/pages/010-guide/tree-theme.yaml` | Inherited visual settings or a new preset for the branch |

Page rules also apply to valid nested folders repeating `pages/` between
levels. Unrelated Markdown/YAML files do not receive Norna's own help.

An empty or invalid recognized file can still receive help. When first
creating `site-config/settings.yaml`, an existing homepage is sufficient to recognize its
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

The homepage row uses its title and is marked **Homepage**. Select it to edit
`root/content.md` in your chosen site source folder. Every page works the same
way: its title opens its own `content.md`, which has no separate row in Site
Tree. Hover over a page to see its complete published URL followed by its
slug, labelled **URL:** and **Slug:**. The homepage shows only **URL:**. When site settings are
unavailable, the tooltip shows the known site-relative path.

Choose **Show URL paths** in the Site Tree view menu to show paths beside page
titles. Paths are hidden by default. The choice is remembered for this
workspace and works on both collapsed and expanded pages. Status indicators
such as warnings and unsaved changes remain visible.

The tree follows the actual [file organization](/reference/site/files/).
Shared `site-config/` and `public/` are siblings before the homepage. Each page
shows its images, attachments, theme files and child pages in that order.
A readable page row represents `root/` or a numbered child directory; ordering
numbers stay in the filesystem but do not clutter the displayed title.

For example, a homepage titled **Norna** and a child titled **Guide** appear as:

```text
site-config/
  settings.yaml
  shared-content.yaml
public/
  robots.txt
  icon.ico
Norna  Homepage
  images/
  downloads/
  tree-theme.yaml
  page-theme.yaml
  pages/
    Guide
      images/
      tree-theme.yaml
```

Only existing folders appear; empty `images/` and `downloads/` folders are
hidden. Their **Add** actions remain available on the page. A page with no
visible details has no expansion chevron. An incomplete
page directory remains visible so you can repair its missing source.
The `site-config/` folder starts expanded; the extension remembers your later choice for that site in the
workspace, including after refresh or window reload. An open settings file
does not force the folder open again.

`root/tree-theme.yaml` controls
the initial site appearance and requires a preset. A branch's `tree-theme.yaml`
modifies inherited values or explicitly chooses a new preset for that branch.
Optional `page-theme.yaml` can appear beside any page, including the homepage;
it affects only that page. See
[theme scope](/reference/configuration/theme/#page-themes). Hover over a theme
file to see its scope and whether it modifies inherited settings or starts a
new base. An explicit preset starts a new base even when its name matches the
inherited preset; remove that key to resume inheritance. Tree-theme help shows
the branch's preset; page-theme help includes the page-only changes. Help
reflects unsaved theme edits and reports when errors prevent resolving the preset.
Every page has `content.md`; a page with a generated
child list uses `page.listChildren: true` in that file.

Page titles open their content. Directory
labels select a row without opening a file.
The `public/` folder has a tooltip explaining that its files are published
unchanged with the site, for example `robots.txt` and icons.
Use the separate chevron, or the keyboard arrow keys,
to expand and collapse children without opening their source. Select an
individual file to open it. Within the chosen site, the tree reveals the
active file, or its owning page when editing `content.md`. This also applies
to the website's **Open in VS Code** link. Other expanded branches remain open.
Resource files use VS Code's normal
editor selection: PNG images, for example, open in its image preview. Use
VS Code's built-in tree find when looking for a visible label.

Site source folders can have a name other than `site`. Pages omitted from
generated navigation remain in the authoring tree, marked **unlisted**; they
are still published. That mark also applies to descendants of an unlisted page.

**Copy Folder Path** in the context menu copies the absolute local directory
for a page, `images/` or `downloads/`. For a page, this is the directory
containing `content.md`. The clipboard contains a plain path, without `cd` or
added quotation marks. Quote paths containing spaces when using them with `cd`.

Right-click a row to open its context menu. Actions are grouped as Add,
editing, organization, links and Delete. Only actions for that element appear.
There are no permanent **+** or **…** row buttons. Use Shift+F10 for the native
keyboard context menu. **Site Tree Help** in the view menu repeats the short
introduction shown the first time.

| Row | Available actions |
| --- | --- |
| Page | Preview Page, Add, Rename, Properties, Move, Copy Link, Copy Folder Path, References, Delete |
| Homepage | Page actions except Move and Delete |
| `pages/` | Add Page, Delete |
| `images/` | Add Images, Copy Folder Path, Delete |
| Image | Insert Image in Page, Rename, Replace, References, Delete |
| `downloads/` | Add Attachments, Copy Folder Path, Delete |
| Attachment | Insert Link in Page, Rename, Replace, Copy Link, References, Delete |
| `site-config/` | Add missing supported configuration files |
| Optional configuration file | Delete |
| `public/` | New File, Add Files, New Folder, Delete |
| Public subfolder | Public-folder actions plus Rename and Move |
| Public file | Rename, Replace, Move, Copy Link, References, Delete |

To create a child page, right-click its parent and choose **Add → Add Page…**.
Alternatively, right-click its `pages/` folder and choose **Add Page…**. The
parent is already selected. Enter the title and URL segment, review the address
and directory, then choose **Create page**. The page appears last among its
siblings and opens for editing. The first child creates `pages/` automatically.

The page's **Add** submenu also offers **Add Images…**, **Add Attachments…**,
**Page Theme** and **Branch Theme**. Existing singleton files are omitted. The operation creates
missing resource folders when needed; browsing does not create them.
**Norna: New Page…** remains in the Command Palette for creation beside the
selected page or at the site root. Choosing the homepage as parent creates a
child in `root/pages/`. Cancel before creation to leave files unchanged.
These actions use the same rules as [`page:add`](/reference/commands/create/).

Creation opens a form with the fields together. Enter the title and optional
description, review the destination, and choose whether to show the page in
navigation. The URL segment follows the title until you edit that segment.
The form previews the internal address and source path before **Create page**.
Errors leave your entries in place so you can correct them.

Choose **Properties…** to open the same form with the page's
current title, description, navigation choice, child-list choice and additional addresses filled
in. Empty fields show example
text; examples are not saved values. The current published address is shown in full. Leave a description empty to remove it.
For a page below the homepage, edit **Slug**, review the proposed address and
choose **Change address…**. The preview lists changed descendant addresses
and the number of authored links to update. The final **Change address**
confirmation moves the directory and writes the affected files.

**Preserve old addresses as aliases** is checked by default. It preserves the
old address of this page and every affected descendant. Uncheck it to create
no new aliases for those addresses. Existing aliases remain available; an
alias becoming its page's primary address is reclaimed. The choice covers
page addresses, not old image or attachment URLs. You can edit each page's
alias list afterwards.

Apply slug changes separately from other Properties changes. Save metadata
changes in the editor before reopening Properties to change the slug. If both
were entered together, restore the current slug to save the metadata first.
Save or undo unsaved page and site-settings edits before changing an address.
Editor Undo does not reverse the whole address change. The homepage has no
editable slug. This form requires extension 0.13.0 and an engine exposing
`sitePageAddressOptionsApiVersion: 1`; earlier engines keep the current-address
display and their existing address commands.

The **Additional addresses (aliases)** list starts with only **+** when there
are no aliases. Use **+** to add a row and **−** to remove one. Enter paths such
as `/old-guide/`, without the site's deployment prefix; these addresses
redirect to the page. Remove unused rows before submitting. The engine checks
for invalid, duplicate and conflicting addresses. Removing a saved alias
requires confirmation with a review of incoming links. See
[page addresses](/reference/site/urls/) for the URL rules.

A title edit changes the Markdown H1 and labels derived from it. The page's
address and link text written elsewhere stay the same. Changes are made in
the editor buffer, support **Undo**, and retain earlier unsaved edits. Save
normally when ready. If the source changes while the information dialog is
open, reopen the dialog before applying the edit. Repair invalid YAML or a
missing/duplicate H1 in the source; other valid tree nodes remain usable.
YAML aliases, anchors or tagged values that cannot be edited directly through
Properties need a source edit.

The `site-config/` layout requires extension version 0.3.2 or later and an
engine build supporting that source format. The extension also recognizes
older source layouts when working with earlier engines. Single-site selection
requires extension version 0.3.1 or later. The file
tree requires extension version 0.3.0 or later and an engine build
with page-file support. The Add menu and earlier grouping-row behavior
originally arrived in extension 0.4.1. Direct page opening and the hidden
content row require extension 0.6.0. Missing-file creation, repair and the
expanded file diagnostics also need the corresponding engine capability.
The context-menu model requires extension 0.10.0 and an engine exposing
`siteResourceActionsApiVersion: 1`. Earlier engines retain their supported
actions without offering unsupported file operations.
The combined creation/information form needs an extension build containing
the form and an engine exposing `sitePageFormApiVersion: 1`; older engines
retain the separate input dialogs.
Optional-file removal, incoming-link review and address editing require
extension 0.5.0 and the corresponding engine capabilities. Earlier engines
retain their read-only address rows in **Page Information** and report which
new actions need an engine update.
Engines with the earlier site-tree support retain their page tree, where page
labels still open the source, and show a message explaining the missing file view. An
incompatible engine reports the problem on its site root; compatible
IntelliSense remains available. Run **Norna: Refresh Site Tree** after an engine
update or to rediscover sites. External file changes normally refresh the
tree automatically.

Use **Properties…** on pages. Other files open for normal
editing and do not receive page-metadata actions. **Move…** handles ordering
and changes of parent. Inserting page links remains outside this tree's scope. Generated `.norna` output and symbolic links are not listed;
use Explorer for files outside the tree.

### Add or repair a source file

Right-click the owning page and choose the missing file under **Add**. The
`site-config/` folder's **Add** submenu offers missing site configuration. Existing singleton files
are omitted; image import and child-page creation remain available when other
images or children already exist.

Review the destination and initial effect before confirming. An optional theme
starts without preset or overrides, keeping its inherited appearance. A missing
root tree theme starts with an explicit documentation preset. The confirmation
explains whether the file affects one page or a branch. Creating `settings.yaml` asks for the site's
public URL. The extension opens the new file for further editing. Cancelling
leaves no partial files or directories and creation never overwrites a file.

If a page directory lacks `content.md`, its row opens the Add menu. Create page
content or restore the file.
The homepage requires `content.md`. A missing required file does not remove the
active site or its remaining pages from the tree.
The settings folder's **Add** still works without homepage content. The view
menu's **Add Site Configuration…** also repairs missing site files, including
when their folder is absent. Site
configuration errors point to the affected configuration file; open
**View > Problems** if the site or root page directory cannot be read.

The type icon stays recognizable when a row has an **error** or **warning**.
Read the explanation in **View > Problems**, or hover over the affected file;
open an existing file to repair it. The owning page
also signals problems in its descendants. Source/schema checks and available
editor diagnostics include unsaved edits; they do not replace `norna check`.

| Indication | Meaning and next step |
| --- | --- |
| Missing required file | Use the owner's **Add** menu to create it, or restore it from version control. |
| Misplaced source file | The file is visible at its actual location; hover explains where it belongs. Move it through Explorer. |
| Invalid content or conflicting sources | Open the file to correct it. A page directory must contain `content.md`; `category.yaml` is no longer supported. |
| **Not used by Norna** | An extra author file, such as notes. It is not automatically an error. Valid files in `public/` remain published resources. |

Generated output, operating-system metadata and symbolic links stay outside this
view. Use Explorer when a repair needs access to an excluded entry. Correcting
or removing the offending file clears its tree indication after refresh.

### Inspect and change addresses

To change where a page appears in **Site Tree**, select **Move…** from its
context menu. Right-click another page to place the moving page
before, after, first or last under it. The source page stays in place, marked
**FROM** with its current address. A temporary **Preview:** row at the destination
is marked **TO** with its proposed address. Starting the move expands the source
page to show **Cancel page move** immediately. Both rows use an accent-colored icon.
Expand the preview's details to see affected addresses and authored links.
Under the preview, choose **Complete page move…**. For a move to another
parent, the final confirmation offers **Preserve old addresses as aliases**,
checked by default. Uncheck it to create no new aliases for the old addresses
of the page and all affected descendants. Existing aliases remain available.
Confirm **Complete page move** to apply. Cancel the confirmation to return to
the tree, or choose **Cancel page move** to end the move without changing files.
The checkbox requires extension 0.13.1 and the engine's
`sitePagePlacementOptionsApiVersion: 1`; older engines retain preservation.
Reordering has no alias choice because its addresses stay the same.
With extension 0.13.2, row menus show only applicable placement actions and
**Cancel Page Move** during a move; the preview also offers completion. Cancel
from anywhere using the **Cancel Page Move** close icon in the Site Tree toolbar,
any row's context menu, or Escape while the tree has focus. Escape in an editor
or input field keeps its normal behavior. Cancellation leaves files unchanged
and restores ordinary menus. The cancellation rows at the source and preview
remain available. Another move cannot start until you finish or cancel this one. If a placement fails, the error dialog offers to
open the affected file, try another placement or cancel the move. Closing that
dialog without a choice also cancels. A new parent changes the page's address
and those of its descendants; Norna updates supported internal links and
keeps their old addresses as redirects when the preservation choice is checked. Reordering below the same parent leaves
addresses unchanged. Moving a page back to its own previous address removes
that address from its aliases; the same applies to affected descendants. Save
affected edits first. Editor Undo does not reverse
the whole move; on a handled failure Norna attempts to restore the original
files and reports any paths that still need inspection.

Select the page, then run **Norna: Addresses and Links…** from the Command
Palette. The row's **Copy Link** directly copies the full published address. **Web address** copies
the full public address for sharing. **Internal link** copies the path to use
in `content.md`, without the site's deployment prefix. For example, a page
published at `https://example.com/manual/guide/` uses `/guide/` in internal
links. The domain and `/manual/` come from `site-config/settings.yaml`.

**Change URL segment…** changes the final part of a content page's address.
Enter one segment, such as `installation`, without slashes. The extension
previews the full old and new addresses, descendant pages and the number of
authored links that will change. Confirming renames the page folder
within its current parent while keeping its order number. The title stays the
same. The engine updates supported internal links and keeps old page addresses
as redirects, using the same planning and transaction as
[`page:move`](/reference/commands/move/). Descendant page paths also change
and receive aliases.

Save or undo unsaved page and site-settings edits before changing an
address. The action writes affected content files and moves the complete page
directory. Editor Undo does not reverse the whole operation. To return to a
previous address owned by this page, change the URL segment normally. Norna
removes that address from its aliases. Another page's address remains unavailable.
The homepage's internal address is fixed at
`/`. This action does not detach addresses from folders.

**Additional addresses…** manages addresses that redirect to the current page.
Choose **Add additional address…**, or select an existing address to copy or
remove it. Enter a site-relative path beginning and ending with `/`, such as
`/old-guide/` or `/archive/guide/`. Omit the deployment prefix. These entries
are stored in `page.aliases`; they do not change the page's primary address.
Conflicts with other pages, redirects, public files or generated
routes are reported before accepting the edit. See
[URLs and links](/reference/site/urls/#keep-an-old-url) for the exact rules.

Additional-address edits stay in the page's editor buffer, preserve existing
prose and support normal Save and Undo. Removing an address requires
confirmation and shows known links to it. If relevant content changes while a
dialog is open, repeat the action to review the current result.

**References…** in the context menu lists authored links to the selected page.
The list includes source page titles, file locations, line numbers and source
passages; select a result to open that passage. Checks include unsaved page
content, Markdown links and Norna block links, including aliases and anchors.
External URLs and raw HTML are not checked. If some sources cannot be checked,
the list and removal confirmations say so instead of reporting a clean result.

### Manage public files

Right-click `public/` to create a text file with **New File…**, copy files from
your computer with **Add Files…**, or create a folder with **New Folder…**.
If `public/` does not exist, use **Add Public Files…** from the Site Tree view
menu. These actions work even when homepage content needs repair.

**Rename…** and **Move…** work on public files and author-named subfolders.
A move chooses an existing destination inside `public/`. The `public/` folder
itself has a fixed name and location. **Replace…** keeps a file's address and
sends the original to Trash. Import and rename never silently overwrite files.
The extension checks generated paths, page addresses and logo conventions.

Renaming or moving updates known Markdown and Norna-block links in page
content, including unsaved text. Configuration, raw HTML and external links
are not rewritten. The confirmation describes this boundary and any effect
on automatic logo/icon discovery. Updated page buffers remain unsaved; save
them before publishing. Editor Undo does not reverse the whole resource
operation. If reference editing fails, the extension restores the original
resource name or reports the paths needing recovery.

**Copy Link** copies the complete published address. **References…** opens
pages that link to the resource. Shared static files belong here; use
[page attachments](#add-and-use-page-attachments) for files owned by a page.

### Remove an optional file

Use **Delete…** in the file's context menu. This is available for local
`page-theme.yaml`, descendant `tree-theme.yaml`, `site-config/shared-content.yaml`
and files in `public/`. Required `root/tree-theme.yaml` cannot be removed.
Images retain their [image actions](#add-and-use-page-images).

Review the path and effect before confirming. Removing a homepage theme
returns that page to the shared site theme. Removing a branch theme restores
inherited settings for that branch; descendants keep their own overrides.
The confirmation names the inherited tree-theme file, its preset and the file
that selected that preset. A page-only theme still affects only its page;
a descendant's explicit preset continues to provide an independent base.
If errors in the remaining themes prevent this preview, the confirmation says so.
Removing shared content removes its authored notices, footer content and logo
display settings. Public-file removal shows known page links, but references
in configuration or outside page content are not checked.

Required site settings, the root tree theme and page content cannot be removed
separately through Site Tree. To remove a page, use its page row's
actions instead. Save or undo dirty edits in the file first. Files go to the
operating system's Trash and can be restored there.

### Remove a page

Choose **Delete…** from the page's context menu. Review the source
directory and the number of page/category entries and files, then confirm.
The whole page directory is removed, including its images, configuration and
descendants. The confirmation counts authored internal links from pages that
remain to the removed page or its descendants, including old addresses and
anchors. Links wholly inside the removed branch do not trigger this warning.
Links from other pages are not rewritten. The required homepage cannot be removed.

Choose **Show links** to open the source list before deciding. This cancels
the removal; run the action again after reviewing or editing those links.
You may still confirm removal when known incoming links exist.

Optional `pages/`, `images/`, `downloads/` and public folders also offer **Delete…** when
nonempty. The confirmation summarizes affected pages/files and incoming
references. Required site folders and the homepage are protected. Unexpected
entries that cannot be checked safely must be repaired in Explorer first.

Save or undo unsaved edits in the affected files first. If files change during
confirmation, the action stops so you can review them again. Files go to the
operating system's Trash; restore them there, not through editor Undo. A trash
failure is reported without retrying as permanent deletion.

After restoring a folder, check its name against the source directory shown
in the removal confirmation. If Trash added a suffix because it already held
the same name, rename the restored folder to its original name.

## Preview your site locally

Right-click a page in Site Tree and choose **Preview Page** to open it in
your default browser. For the homepage, choose **Preview Site** from Site Tree's
view menu. The extension starts the selected site's local server or reuses its
verified running server. It opens the current page address, not an alias or
the published website, including for pages omitted from navigation.

Preview uses files saved on disk. With unsaved site files, choose **Save Site
and Preview**, **Preview Saved Files**, or **Cancel**. The first choice saves
only files in the selected site; it does not save unrelated workspace files.
Failed saves stop the preview request. After saving, the extension reads the
page address and URL prefix again so configuration changes take effect.

### Port and server lifetime

For ordinary sites, the port is **4321**, unless VS Code's launch environment
sets `NORNA_DEV_PORT` to another integer from 1 through 65535. This is not a
`settings.yaml` field. To change that environment, quit VS Code and start it
with the variable set; reloading a window is not a substitute. Norna repository
contributors' registered review sites use their registered command and fixed
port instead.

An occupied port produces an error unless the extension can verify that it
belongs to this exact site's local server. Preview never selects a spare port,
uses `--kill`, stops another site's server or exposes the site on the LAN.
If you change the port while this site is running, stop its existing server
explicitly before starting on the new port. A site already running in LAN mode
must likewise be stopped before using local preview.

Once started, the server continues running when the VS Code window closes.
Choose **Stop Preview Server** from Site Tree's view menu to stop the selected
site's verified server. Cancelling a startup request cleans up its newly started
server, but leaves a reused server running.

### Failed preview

**Show Preview Log** opens the selected site's startup and preparation logs in
VS Code's Output panel. Invalid configuration, a conflicting port, an unverified
server record or a page that fails to render prevents browser opening. Repair
the reported cause and try again. An old or stale server record may require
the site's [development commands](/reference/commands/development/) for recovery;
the extension will not guess which process it may stop.

If the server is ready but the browser cannot open, copy the offered local URL
or retry. The working server stays running. These commands require an evaluation
extension and a project-local engine with preview support; an older engine
receives an update message rather than using another project's installation.

## Add and use page images

Right-click a page and choose **Add → Add Images…**, or right-click its
`images/` folder and choose **Add Images…**. No `images/`
folder is required before starting. Choose one or several JPG, JPEG, PNG or
SVG files. The VS Code extension shows a preview for each file; select one to
view it larger before deciding. Its default action is **Import**; select
**Import and insert** to add a reference
to the page, or **Ignore** to skip a file. You can edit the destination
filename. The originals remain unchanged, including when you choose an image
from another page.

If the filename already exists on that page, the row shows which image will be
replaced. Change the filename to a free one to import a separate image; if
the new name is also occupied, the row shows that image instead. The incoming
and existing previews are labelled **New image** and **Existing image**, show
their filenames and both open a larger view. Images in the same import must
have different target names. One confirmation lists all replacements before
the import starts. Old versions go to the operating system's Trash. A failed
batch keeps completed copies and
identifies the pending files so you can retry them. If a replacement fails
after the old version reaches Trash, restore that version there.

For **Import and insert**, enter an optional caption and alternative text.
Mark a purely decorative image to hide the alternative-text field and give it
an explicit empty alternative. Use the up/down buttons to set image order.
The inserted rows form one `image-stack`
at the end of the owning `content.md`. That edit remains unsaved and supports
ordinary editor Undo. Edit the block to change its position. Cancelling the
form before import starts changes nothing.

An existing image's context menu offers insertion, rename, replacement, references and removal.
**Insert Image in Page…** inserts the image into the page that owns it, whose
title is shown in the form. The form contains a large preview that you can expand, the current filename,
decorative choice, optional alternative text and caption. Marking an image
decorative hides the alternative-text field. The action adds an `image-stack`
at the end of the owning page. The page edit stays unsaved until you save
`content.md`.
**Replace…** keeps the filename and references, copies a replacement
of the same format and sends the previous file to Trash. Before replacement
or removal, the confirmation shows managed-image references, including
unsaved pages. Local images take precedence over equal filenames elsewhere.
Unresolved references and incomplete checks are labelled; ordinary Markdown,
HTML and external references are outside this check. Removing an image leaves
its content references in place, where diagnostics can report the missing file.

On macOS, open **Trash** in Finder and choose **Put Back** to restore a removed
or replaced image. VS Code's Undo command does not restore deleted files.
If the restored file has an added suffix, rename it to the original filename
used in `content.md`. Check that you restored the intended version before
replacing a file that already exists.

The combined image forms require a VS Code extension build and Norna engine
that include the batch-image API. Finder drag/drop, clipboard
import and insertion into an existing block or at an arbitrary cursor position
are not yet provided by these tree actions.

### Rename an image

Right-click the image and choose **Rename…**. Keep its extension: this renames
a file and does not convert its format. The confirmation reviews known image
references. Name collisions or unresolved references stop the operation.

The extension updates references in Norna image and card blocks while retaining
existing unsaved page edits. Ordinary Markdown images, raw HTML and external
references are not checked. Save the edited pages when ready. Editor Undo
undoes text edits, not the complete file rename. If reference editing fails,
the extension attempts to restore the original filename and reports any
remaining recovery work.


## Add and use page attachments

Right-click a page in Site Tree and choose **Add > Add Attachments…**.
Select one or several files. The extension copies them into `downloads/`
beside that page's `content.md`; source files remain unchanged. No folder
needs to exist beforehand. Empty `downloads/` and `images/` folders are hidden
in Site Tree, but their page's Add actions remain available.

The form names the page and insertion position. If that page was active when
you started, links go at its captured cursor position. Otherwise they are
appended to the owning page, never to a different active page.

For each file, keep **Import and insert link**, choose **Import** to copy
without a link, or **Ignore** to skip it. Edit the destination filename and
link text; use **Move up** and **Move down** to order inserted links. One file
produces a Markdown link; several produce a bullet list. File type, size and
Modified describe the source file on disk, not a publication date.

A name collision shows **Existing file** and **New file** for comparison.
Replace is preselected for an initial collision, but a separate confirmation
is required before replacement. Choose a free name or Ignore instead. If you
edit a name and it collides with a different file, select Replace again.
Files in the same batch cannot overwrite one another.

The text edit remains unsaved and supports ordinary Undo. Undo does not remove
imported files or restore replaced files; previous files go to the operating
system's Trash. Cancel before applying changes nothing. If the page changes
while the form is open, reopen the form at the intended position. The extension
refuses insertion inside code, links, tables, HTML or page settings.

An existing attachment offers **Insert Link in Page…**, **Rename…**, **Replace…**,
**References**, **Copy Link** and **Delete…**. Rename updates known references;
Replace preserves its address. Deletion reports known incoming links but does
not remove those links. A failed import lists copied files and recovery work;
check that report before retrying. Restore a replaced original from Trash when
needed.

These actions need an evaluation extension and project engine with attachment
support. They accept any file type and do not promise that the browser will
download rather than display it. See [page attachments](/reference/site/attachments/)
for local links, sharing between pages and published addresses.

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
