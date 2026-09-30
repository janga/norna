# Changelog

## 0.13.0

- Edit a page's slug in Properties with a separate Change address action,
  a preview of descendant addresses and a final confirmation.
- Choose whether to preserve old addresses as aliases for the entire affected
  subtree. The choice starts checked; existing aliases remain available.
- Keep metadata buffer edits separate from address changes, and reject stale
  forms or unsaved affected sources before moving files.

## 0.12.3

- Label page tooltip values URL and Slug so a slug cannot be mistaken for a
  continuation of a wrapped address.

## 0.12.2

- Show only the published URL and slug in page tooltips. Theme details remain
  on theme files; page errors remain in Problems.
- Add Show URL paths to the Site Tree view menu, with a saved workspace choice.
- Add Copy Folder Path for pages and image/attachment directories, copying
  the plain absolute directory path.

## 0.12.1

- Explicitly expand a page when starting a move, so Cancel page move is visible
  even when VS Code remembers the source branch as collapsed.

## 0.12.0

- Preview the selected site or page in the default browser, with explicit
  unsaved-file choices and project-local engine selection.
- Reuse only verified local servers, honor configured ports, and provide Stop
  Preview Server and Show Preview Log without automatic port fallback or kill.

- Add page-owned attachments with a batch import/link form, explicit replacement,
  existing-file insertion and reference-aware resource actions.
- Hide empty images/downloads folders while retaining the page's Add actions.
- Preserve native text Undo and unsaved buffers; report partial file failures
  and Trash recovery separately from editor Undo.

## 0.10.0

- Group Site Tree editing in native context menus, with actions for each row
  type and no permanent row Add/ellipsis buttons.
- Rename page titles without changing URLs; show full addresses in Properties.
- Rename managed images and public resources with known reference updates.
- Create, import, replace and move public files; delete optional nonempty
  folders after reviewing their contents and incoming references.
- Keep required files protected and site-level repair available without a
  valid homepage. New operations require the selected engine’s resource API.

## 0.9.2

- Move and reorder pages from the native Site Tree with a placement preview.
  Parent changes update supported links and preserve old page and descendant
  addresses; sibling reordering keeps URLs unchanged.
- Identify the page that owns a reserved previous address when a new page
  tries to reuse it.
- Keep page clicks opening `content.md` during placement; use the context menu
  for destination choices. Mark unsaved pages and their collapsed ancestors in
  Site Tree, and name files that must be saved before a move.
- Offer explicit cancellation and source opening when page placement fails.

## 0.9.1

- Show active presets and their source files in page and theme hovers, including
  unsaved changes. Explain inherited modifications and explicit replacement.
- Preview the inherited tree theme and preset when removing an optional theme.

## 0.9.0

- Support Norna schema 6: required root/tree-theme.yaml, inherited branch themes
  and optional page-theme.yaml. An explicit preset replaces the inherited base.

## 0.8.1

- Give shared configuration and public files their own site context, so their
  actions keep working when homepage content needs repair.
- Keep unreadable-site diagnostics and report configuration errors at their
  actual source files.
- Reject obsolete `000-home` child directories and legacy `config.yaml`
  discovery markers in the `root/` source layout (Norna schema 5).

## 0.7.0

- Match Norna schema 4 and editor API 3. Content-backed overview pages replace
  navigation categories; Site Tree and IntelliSense support `page.listChildren`.
- Give the compatible VSIX a distinct version so VS Code does not keep an older
  0.6.0 build after an engine update.

- Combine page creation and Page Information fields in a form with current
  values, example placeholders, address previews and inline validation.
- Add and remove additional-address rows, with engine validation and
  incoming-link confirmation before removing saved aliases.

## 0.6.0

- Open page content from its title and hide the redundant `content.md` row.
  Category titles open their information; chevrons expand independently.
- Keep object icons recognizable beside separate error/warning descriptions.
  Show misplaced files, unused author files and repairable incomplete entries.
- Add missing supported source files from **+**, with validated templates,
  explicit effects and overwrite protection; retain the selected site when
  required files are missing.
- Follow active page content through its owning row and preserve configuration
  expansion. Keep existing Trash and incoming-link safeguards.

## 0.5.0

- Remove optional local themes, shared content and public files through Trash,
  with confirmation and an explanation of their effect.
- Review incoming links before removing a page branch. Include aliases,
  anchors and unsaved content; open source passages and report incomplete checks.
- Copy public/internal addresses, rename a page's URL segment through the
  engine's page-move transaction, and add/remove redirect addresses in the
  normal editor buffer. Keep old page addresses and update internal links
  when renaming; protect the homepage and required files.

## 0.4.1

- Keep page and directory labels as grouping rows; open sources from their
  actual file rows. Remove grouping tooltips and follow the active file row.
- Show site configuration with a settings icon, initially expanded, and
  remember its expanded/collapsed state across refresh and window reload.
  Updated engines put `site-config/` and `public/` before homepage files.
- Use each page's plus for an Add menu with child-page creation and image
  import, even without `pages/` or `images/`. Keep other actions in the ellipsis.
- Put `theme.yaml` before the content it controls and explain its scope on
  hover. Add help for `public/`, without permanent descriptions on these rows.

## 0.4.0

- Add a child directly from a visible page-row plus, even without `pages/`.
- Add page and image action menus for ordinary authoring work.
- Import one local image, append an editable image block, replace an image,
  and remove images or non-home page branches through the operating system's
  Trash. Show managed-image uses, preserve originals during import, refuse
  collisions, and guard dirty or changed removal targets.

## 0.3.2

- Recognize the `site-config/` layout and show page content before its
  configuration, images and child-page folders.

## 0.3.1

- Show one active workspace site in Site Tree. Select a sole site automatically;
  use **Norna: Choose Site…** for workspaces containing several sites.
- Remember the chosen site across window reloads. Opening other sites' files
  no longer adds or switches trees; removed workspace folders are forgotten.
- Mark the root page **Homepage** and keep page actions within the active site.

## 0.3.0

- Move Site Tree to its own Norna Activity Bar entry and show one homepage
  root per site.
- Show each page's existing configuration, images and child-page folders,
  plus root public files. Open resources with VS Code's normal editor choice.
- Add a page directly from each `pages/` folder while retaining page,
  category and information actions.
- Preserve the earlier page tree for compatible engines without file support.

## 0.2.0

- Add Norna: Site Tree in Explorer for opening pages and categories, creating
  children and siblings, and editing titles, descriptions and navigation
  visibility.
- Preserve unsaved source edits and support normal editor undo for page
  information changes; show current and previous URLs as read-only information.
- Keep sites isolated, reveal the active source, and refresh after external
  changes without hiding malformed pages or unlisted branches.
- Require the engine's optional site-tree API for these actions while keeping
  existing IntelliSense available with compatible older engines.

## 0.1.1

- Keep semantic callout markers and body text on adjacent quoted lines when a
  content file is saved.

## 0.1.0

- Establish the supported extension package, project compatibility checks, and
  automated VS Code integration coverage.
- Add a file-scoped Norna status indicator and current page snippets.
- Show extension and engine versions separately in the status report.
- Verify that generated snippets and YAML suggestions follow the installed
  Norna schema.
