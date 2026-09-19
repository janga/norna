# BL-131: VS Code Site Tree

## Outcome

A site author can understand the Norna site structure, open a page, create a
page, and edit its title and metadata without finding numbered directories by
hand. Deliver this first scope in the existing experimental VS Code extension.

**Status: Implemented in experimental VSIX 0.2.0 on 2026-09-19.** Marketplace
publication remains outside this item.

## Author Workflow

### Browse And Open

- Add a native **Norna: Site Tree** view in VS Code's Explorer. Show page
  titles, category labels, and the engine's sibling order; distinguish pages
  from navigation categories without making folder prefixes the primary label.
- Show the complete authored tree, including pages omitted from generated site
  navigation. Mark those pages as unlisted; they are still published pages.
- Clicking a page opens its `content.md`; clicking a category opens its
  `category.yaml`. The chevron expands or collapses children independently of
  opening the source. Support the equivalent keyboard actions.
- Follow the active Norna source file in the tree, including a file opened by
  the website's existing Open in VS Code action. Reveal its ancestors without
  resetting unrelated expanded branches.
- Refresh after source edits and external file changes while retaining the
  selected page and expansion state when their nodes still exist. Use native
  tree finding for the first scope; a separate search interface is not needed.

### Create

- Offer new page and new navigation category actions at the site root, beside
  the selected node, or beneath a page or category. Make the chosen parent
  explicit. Home cannot contain children.
- Ask for the title or category label, suggest an editable URL segment, and
  show the resulting location and URL before creation. Append the new node to
  its siblings using the engine's ordering rules; reordering comes later.
- Reuse the validation and creation behavior behind `page:add` and
  `category:add`, including custom site roots and collision checks. Do not
  introduce an editor-specific interpretation of valid paths or page files.
- On success, reveal the new node and open its source. Cancelling changes no
  files. A failed operation must preserve existing content and explain what
  the author needs to correct.

### Edit Page Information

- A page information action shows the title, description, navigation
  visibility, current URL, source location, and previous URLs from
  `page.aliases`.
- In this first scope, edit the title in the Markdown H1,
  `page.description`, and `navigation.listed`. For a navigation category, edit
  its label and description in `category.yaml`. Home remains listed.
- The current URL, source location, and previous URLs are read-only here.
  Changing an address and managing redirects belong to the continuation.
- Make clear that changing a title changes labels derived from that title;
  it does not rename a directory, change the URL, or rewrite link text that an
  author has written in another page.
- Apply targeted, undoable source edits through VS Code, preserving unsaved
  text, comments, line endings, and unrelated metadata. Do not force-save or
  replace an open document from a stale disk copy. Reflect edited values in
  the tree before saving, and persist them through normal editor saves.

## Foundation And Dependencies

- Reuse the installed engine's site structure and page model, project/site
  discovery, and shared creation logic. The source files remain authoritative;
  no separate page database, new page identifier scheme, or routing syntax is
  required.
- Build on the existing engine compatibility and versioned VSIX evaluation
  boundaries in [BL-030 Production-ready IntelliSense](BL-030-production-ready-intellisense.md).
  Its ongoing practical evaluation remains open; this item does not require
  Marketplace publication or claim that the broader support work is complete.
- Keep each site's tree, commands, and unsaved document state isolated when a
  workspace contains several sites. Identify the target site before writing.
  Do not rebuild a complete link graph on every keystroke just to render titles.
- Use native VS Code views and context actions, following the
  [Tree View UX guidance](https://code.visualstudio.com/api/ux-guidelines/views).
  A separate visual content editor is outside this scope.

## Boundaries

Moving pages, reordering siblings, changing URLs, deleting nodes, inserting
links, and displaying inbound references belong to
[BL-132 VS Code Site Authoring Continuation](BL-132-vscode-site-authoring-continuation.md).
H2/H3 headings remain sections in the existing document outline, not additional
page containers. This item does not change the published website's navigation.

## Acceptance And Verification

- In a packaged VSIX, use the actual tree and its actions to open an existing
  page, create sibling and child pages, create a category, and edit each
  supported information field. Assert the opened document and resulting files,
  not merely the tree provider's returned data.
- Cover nested pages, categories, unlisted branches, custom site roots, and
  multiple sites. Verify that commands cannot create children under Home or
  overwrite a colliding destination, and that cancellation leaves no files.
- Exercise a dirty page before metadata editing, undo the edit, then edit,
  save, close, reopen, edit, and save again. Compare saved bytes and verify that
  unrelated prose and metadata survive. Confirm that title edits leave URLs
  and authored link text unchanged.
- Verify refresh after direct source edits and external creation, rename, or
  removal. An invalid document should have a focused diagnostic and a usable
  source-opening path without disabling unrelated valid nodes.
- Follow the [editor workflow test plan](../editor-workflow-test-plan.md) for
  packaged-editor coverage and persistence checks. Record any untested UI
  interaction explicitly.
- Update the canonical
  [editor workflow reference](../../../site/pages/032-reference/pages/060-workflows/pages/010-editor/content.md)
  with installation/update steps, the supported actions, and these scope
  boundaries once the implementation is verified.

## Implementation And Verification

The native Explorer tree uses the installed engine's optional site-tree API.
CLI and editor creation share one planner and writer; page information returns
targeted edits for VS Code to apply with normal Undo and save behavior. The
canonical reference, extension README/changelog and engine contributor notes
describe the delivered scope.

All 12 packaged tree workflows passed on VS Code 1.138.0 and 1.96.0, and on
1.138.0 with Prettier 12.4.0. A final full editor integration run verified the
tree alongside existing completion and persistence workflows. Independent
fixtures prevent completion tests from changing the tree's starting documents.
See the [editor workflow test plan](../editor-workflow-test-plan.md#site-tree-workflows)
for UI coverage, screenshots, bundle identity and the native-menu limitation.

Checks run:

- `node scripts/test-editor-site-tree.mjs`
- `npm run test:site-node-commands`
- `npm --prefix editors/vscode run check`
- `npm --prefix editors/vscode run test:integration -- --suite site-tree`
- `npm --prefix editors/vscode run test:integration -- --suite site-tree --version 1.96.0`
- `npm --prefix editors/vscode run test:integration -- --suite site-tree --with-prettier`
- `npm --prefix editors/vscode run test:integration`
- `npm run test:dead-code`
- `npm run package:check`
- `npm run test:documentation`
- `npm run content:check`
- `npm run build`
- `git diff --check`

The complete engine release suite and website-navigation browser suites were
not run: this item changes editor authoring and shared page creation, with
focused engine, CLI, package and real-editor coverage. Remote workspaces,
other operating systems and arbitrary formatter combinations remain outside
the verified experimental setup.
