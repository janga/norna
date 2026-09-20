# Changelog

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
