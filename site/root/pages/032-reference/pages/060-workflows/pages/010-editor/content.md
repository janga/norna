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
Tree. Hover over the page to see the actual source path.

The tree follows the actual [file organization](/reference/site/files/).
Shared `site-config/` and `public/` are siblings before the homepage. Each page
shows its existing images, theme files and child pages in that order.
A readable page row represents `root/` or a numbered child directory; ordering
numbers stay in the filesystem but do not clutter the displayed title.

For example, a homepage titled **Norna** and a child titled **Guide** appear as:

```text
site-config/                           +
  settings.yaml
  shared-content.yaml
public/
  robots.txt
  icon.ico
Norna  Homepage                         +  …
  images/
  tree-theme.yaml
  page-theme.yaml
  pages/
    Guide                              +  …
      images/
      tree-theme.yaml
```

Only existing folders appear. A page with no visible details has no expansion
chevron; an existing empty folder is still a visible detail. An incomplete
page directory remains visible so you can repair its missing source.
The `site-config/` folder starts expanded; the extension remembers your later choice for that site in the
workspace, including after refresh or window reload. An open settings file
does not force the folder open again.

`root/tree-theme.yaml` controls
the initial site appearance and requires a preset. A branch's `tree-theme.yaml`
modifies inherited values or explicitly chooses a new preset for that branch.
Optional `page-theme.yaml` can appear beside any page, including the homepage;
it affects only that page. See
[theme scope](/reference/configuration/theme/#page-themes). Hover over a page to
see its active preset and the source file that selected it. Hover over a theme
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

To create a page in an existing `pages/` folder, select its **Norna: Add Page…**
plus button or the same action in its context menu. That folder is already
the destination. Enter a title and URL segment, review the resulting address
and directory, then select **Create page**. The new page appears last among
its siblings and opens for editing.

To create a child, select its parent page, use the **+** button beside its
title (**Norna: Add…**) and choose **Add child page…**. This also works when
`pages/` does not yet exist: the extension creates it with the first child.
The parent is already selected in the creation form.
The same menu offers **Import image…** on content pages and missing source
files permitted at that location, including `tree-theme.yaml`. The **+** in the tree
toolbar acts on the selected page or the owner of a selected resource.

The **…** beside a page opens **Page Actions**: edit page information, open
the source, work with addresses and links, or remove the page. The Command
Palette and context menu remain available. **Norna: New Page…** additionally
offers creation beside a page or at the site root. Browsing alone creates no folders.
Choosing Home as the parent creates a child in the site root's `pages/` folder.
Select **Cancel** or close the form before creation to leave files unchanged.
These actions use the same rules as
[`page:add`](/reference/commands/create/).

Creation opens a form with the fields together. Enter the title and optional
description, review the destination, and choose whether to show the page in
navigation. The URL segment follows the title until you edit that segment.
The form previews the internal address and source path before **Create page**.
Errors leave your entries in place so you can correct them.

Choose **Norna: Page Information…** to open the same form with the page's
current title, description, navigation choice, child-list choice and additional addresses filled
in. Empty fields show example
text; examples are not saved values. Leave a description empty to remove it.
Changing an existing URL segment remains a separate **Addresses and links…**
action in **Page Actions**, because it can move files and affect other pages.

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
Page Information need a source edit.

The `site-config/` layout requires extension version 0.3.2 or later and an
engine build supporting that source format. The extension also recognizes
older source layouts when working with earlier engines. Single-site selection
requires extension version 0.3.1 or later. The file
tree requires extension version 0.3.0 or later and an engine build
with page-file support. The Add menu and earlier grouping-row behavior
originally arrived in extension 0.4.1. Direct page opening and the hidden
content row require extension 0.6.0. Missing-file creation, repair and the
expanded file diagnostics also need the corresponding engine capability.
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

Use **Page Information** on pages. Other files open for normal
editing and do not receive page-metadata actions. Moving pages
to another parent, reordering pages and inserting page links remain outside
this tree's scope. Generated `.norna` output and symbolic links are not listed;
use Explorer for files outside the tree.

### Add or repair a source file

Select the owning page's **+** and choose the missing file. The `site-config/`
folder's **+** also offers missing site configuration. Existing singleton files
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
The settings folder's **+** still works without homepage content. Site
configuration errors point to the affected configuration file; open
**View > Problems** if the site or root page directory cannot be read.

The type icon stays recognizable when a row has an **error** or **warning**.
Hover for the explanation; open an existing file to repair it. The owning page
also signals problems in its descendants. Source/schema checks and available
editor diagnostics include unsaved edits; they do not replace `norna check`.

| Indication | Meaning and next step |
| --- | --- |
| Missing required file | Use the owner's **+** to create it, or restore it from version control. |
| Misplaced source file | The file is visible at its actual location; hover explains where it belongs. Move it through Explorer. |
| Invalid content or conflicting sources | Open the file to correct it. A page directory must contain `content.md`; `category.yaml` is no longer supported. |
| **Not used by Norna** | An extra author file, such as notes. It is not automatically an error. Valid files in `public/` remain published resources. |

Generated output, operating-system metadata and symbolic links stay outside this
view. Use Explorer when a repair needs access to an excluded entry. Correcting
or removing the offending file clears its tree indication after refresh.

### Inspect and change addresses

Select **Addresses and links…** from a page's **…** menu. **Web address** copies
the full public address for sharing. **Internal link** copies the path to use
in `content.md`, without the site's deployment prefix. For example, a page
published at `https://example.com/manual/guide/` uses `/guide/` in internal
links. The domain and `/manual/` come from `site-config/settings.yaml`.

**Change URL segment…** changes the final part of a content page's address.
Enter one segment, such as `installation`, without slashes. The extension
previews the full old and new addresses, source directories, descendant
pages and authored links that will change. Confirming renames the page folder
within its current parent while keeping its order number. The title stays the
same. The engine updates supported internal links and keeps old page addresses
as redirects, using the same planning and transaction as
[`page:move`](/reference/commands/move/). Descendant page paths also change
and receive aliases.

Save or undo unsaved page and site-settings edits before changing an
address. The action writes affected content files and moves the complete page
directory. Editor Undo does not reverse the whole operation. To return to an
old address, first remove conflicting additional addresses on this page and
its descendants, save, then change the URL segment again.
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

**Incoming links…** lists authored links to the selected page.
The list includes source page titles, file locations, line numbers and source
passages; select a result to open that passage. Checks include unsaved page
content, Markdown links and Norna block links, including aliases and anchors.
External URLs and raw HTML are not checked. If some sources cannot be checked,
the list and removal confirmations say so instead of reporting a clean result.

### Remove an optional file

Use **Move to Trash…** in the file's **…** menu. This is available for local
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

Choose **Move page to Trash…** from the page's **…** menu. Review the source
directory and the number of page/category entries and files, then confirm.
The whole page directory is removed, including its images, configuration and
descendants. The confirmation counts authored internal links from pages that
remain to the removed page or its descendants, including old addresses and
anchors. Links wholly inside the removed branch do not trigger this warning.
Links from other pages are not rewritten. The required homepage cannot be removed.

Choose **Show links** to open the source list before deciding. This cancels
the removal; run the action again after reviewing or editing those links.
You may still confirm removal when known incoming links exist.

Save or undo unsaved edits in the affected files first. If files change during
confirmation, the action stops so you can review them again. Files go to the
operating system's Trash; restore them there, not through editor Undo. A trash
failure is reported without retrying as permanent deletion.

After restoring a folder, check its name against the source directory shown
in the removal confirmation. If Trash added a suffix because it already held
the same name, rename the restored folder to its original name.

## Add and use page images

Select a page, use its **+** menu and choose **Import images…**. No `images/`
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

An existing image's **…** menu offers insertion, replacement and removal.
**Insert image…** opens one form with a large preview that you can expand, the current filename,
decorative choice, optional alternative text and caption. Marking an image
decorative hides the alternative-text field. The action adds an `image-stack`
at the end of the owning page. The page edit stays unsaved until you save
`content.md`.
**Replace image…** keeps the filename and references, copies a replacement
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
