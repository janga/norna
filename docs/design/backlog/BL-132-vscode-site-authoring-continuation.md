# BL-132: VS Code Site Authoring Continuation

## Purpose

Turn the first VS Code site tree into a practical tool for maintaining site
structure and writing connected pages. Preserve the proposed order and the
value of each follow-up so future work can be scoped without repeating the
feature inventory.

**Status: Needs design after
[BL-131 VS Code Site Tree](BL-131-vscode-site-tree.md).** This is a continuation
record, not approval to implement every proposal as one change.

## Scope And Boundaries

Start with the existing tree and engine operations, then add authoring help
that uses the shared site link graph. Keep source files editable without the
extension. Do not introduce wiki syntax, a second URL resolver, or a separate
content database for these workflows.

When promoting a step, give it a bounded implementation item with its own
acceptance criteria. Reuse an existing backlog item when it already owns the
outcome. The order below is a product recommendation; existing dependencies
still apply.

## Decisions Made

- The first delivery is a functioning tree with open, create, and page
  information editing in
  [BL-131 VS Code Site Tree](BL-131-vscode-site-tree.md).
- Record subsequent work with a short description and a proposed priority.
  Features considered from Wikipedia, Docusaurus, and Obsidian inform the
  foundation; recording them does not authorize their implementation now.

## Preliminary Proposals

### Recommended Follow-up Order

| Priority | Proposal | Author benefit and first boundary |
| --- | --- | --- |
| 1 | Reorder siblings | Move pages and categories up or down without editing numeric folder prefixes. Start with keyboard-accessible commands; add drag and drop only with equally clear placement feedback. Preserve page URLs and preview any change to a category's first-child destination. |
| 2 | Move pages and change addresses | Choose a new parent or URL segment, preview affected descendants, links, and previous URLs, then apply one coordinated operation. Build on `page:move`; category moves and separate alias editing need an explicit extension of its current contract. |
| 3 | Delete with an impact preview | Show children, page-owned files, and inbound references before removal. Offer a recoverable path and explicit handling of children or a replacement destination; never silently delete referring text. |
| 4 | Follow links and diagnose broken targets | Navigate from a Markdown link to its page or heading source and show unresolved destinations in Problems. Implement through [BL-027 Editor Link Diagnostics](BL-027-editor-link-diagnostics.md), respecting its existing dependency gate. |
| 5 | Insert page and heading links | Find a destination by title, URL, or previous URL and insert an ordinary Markdown link. Preserve selected prose as link text; offer page creation when the desired destination does not exist. |
| 6 | Show inbound references and editorial reports | Show which pages link to the current page and jump to the referring passage. Add focused reports for missing destinations and pages with no incoming links, distinguishing authored links from generated navigation. |
| 7 | Preview linked content | Show a short page or section preview on hover so the author can check a reference without leaving the current paragraph. Keep this separate from a full website preview. |
| 8 | Create from authoring templates | Offer reusable starting text and metadata for recurring page types through the existing creation flow. This is a source-authoring aid, not a new rendered component or plugin API. |
| 9 | Suggest links for unlinked mentions | Identify prose that may refer to existing page titles or author-defined alternative names. Let the author approve each link; alternative names are not the old URL paths stored in `page.aliases`. |
| 10 | Merge pages or extract a child page | Move selected content between pages while reviewing heading anchors, links, managed images, and previous URLs. Reuse the proven structural and link-editing operations instead of treating this as copy and paste. |

This order completes the tree's structural editing tasks first, then improves
everyday link writing and review. Hover previews and templates follow the
core navigation and link workflows; suggestions and content restructuring
require more editorial judgement and depend on those earlier operations.

### Later Possibilities That Affect The Foundation

These are lower-priority considerations, not additional ready implementation
steps. Revisit them for a demonstrated authoring need after the sequence above.

| Possibility | Short description and existing boundary |
| --- | --- |
| Topic labels and saved views | Find pages across the folder hierarchy by topic or metadata. Topic membership must not be confused with Norna's single-parent navigation categories; coordinate with BL-024 Collections, Taxonomies, Pagination And Feeds. |
| Reuse content and reference smaller passages | Reference shared content or a stable passage without copying it into several pages. Evaluate ordinary links and heading anchors first; coordinate with BL-113 Page References and [BL-050 Source-backed Code Excerpts](BL-050-source-backed-code.md) where their scopes apply. |
| Navigate between language or version counterparts | Find the corresponding page in another language or documentation version. Depends on [BL-023 Multilingual Sites With A Shared Page Tree](BL-023-multilingual-sites-shared-page-tree.md), [BL-025 Versioned Documentation](BL-025-versioned-documentation.md), and [BL-100 Future Versioning Foundation](BL-100-future-versioning-foundation.md). |
| Show publication state | Distinguish drafts or scheduled content from published pages if BL-039 Draft And Scheduled Page Publication becomes approved. Being absent from navigation is not a draft state. |
| Separate public addresses from source organization | Consider whether page identity and stable addresses need to survive structural changes independently. First evaluate existing move-and-alias behavior; this is an engine model decision, not an editor-only shortcut. |
| Review page history and follow changes | Open relevant Git history or highlight changes in selected pages, using VS Code's existing source-control support where possible rather than creating a separate history store. |

Research references for later design include
[VS Code view actions](https://code.visualstudio.com/api/extension-guides/tree-view#view-actions),
[Obsidian outgoing links](https://obsidian.md/help/plugins/outgoing-links),
[aliases](https://obsidian.md/help/aliases),
[page preview](https://obsidian.md/help/plugins/page-preview),
[templates](https://obsidian.md/help/plugins/templates), and
[note composer](https://obsidian.md/help/plugins/note-composer), together with
[MediaWiki special pages](https://www.mediawiki.org/wiki/Help:Special_pages)
and [Docusaurus documentation organization](https://docusaurus.io/docs/create-doc#organizing-folder-structure).
These are comparison sources, not claims that Norna already supports the same
contracts.

## Open Questions

Resolve these when scoping the affected step; they do not block the first tree:

- For reorder and move: which operations can be undone coherently across open
  buffers, directory changes, rewritten references, and aliases? What recovery
  remains available after VS Code closes?
- For deletion: how should the author choose between removing a subtree,
  retaining its children elsewhere, and selecting a replacement page? Define
  recovery and inbound-link handling before enabling the operation.
- For alternative names, shared content, and saved views: is new persisted
  metadata justified by actual usage, and which part belongs to the engine?

Do not assume that existing `page:move` is a general reorder, category-move,
delete, or editor-undo API. Its plan and link updates are reusable foundations;
each additional mutation needs its own contract.

## Dependencies

- Evaluate [BL-131 VS Code Site Tree](BL-131-vscode-site-tree.md) before fixing
  the first continuation step's interaction details.
- Preserve [BL-030 Production-ready IntelliSense](BL-030-production-ready-intellisense.md)
  compatibility and distribution boundaries; keep
  [BL-027 Editor Link Diagnostics](BL-027-editor-link-diagnostics.md) as the
  owner of link diagnostics and Go to Definition.
- Reuse the shared site structure, link graph, and page-move planner. An
  operation's preview and execution must use the same interpretation of paths,
  aliases, and references, including unsaved editor changes where supported.
- Existing deferred product items remain deferred. This record does not move
  versioning, multilingual content, publication state, or content reuse into
  the implementation queue.

## Ready For Implementation When

The selected next step has a bounded brief, explicit source and URL effects,
defined cancellation and recovery behavior, and acceptance cases covering its
actual editor interaction. Resolve its relevant open questions and dependencies
before moving that step into the ordered backlog. The continuation record can
be completed when its retained proposals have been assigned to concrete items
or explicitly deferred; it does not require implementing every idea at once.
