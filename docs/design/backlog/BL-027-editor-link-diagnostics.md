# BL-027: Editor Link Diagnostics

## Outcome

The experimental VS Code integration reports internal link problems and can
navigate from a valid link to its page or heading source without implementing
a second URL model.

## Dependencies

Build on the canonical site link graph from `BL-001` and the supported editor
distribution, versioning, caching, invalidation, and test boundaries established
by `BL-030` Production-ready IntelliSense.

## First Scope

- Consume the shared site link graph instead of duplicating Markdown or URL
  resolution in the extension.
- Show missing pages, anchors, public files, and category targets in the
  Problems panel.
- Provide Go to Definition for valid page and heading links.
- Refresh diagnostics when page Markdown, page directories, categories, or
  public files change.

## Risks

- Rebuilding a complete site graph after every keystroke would make larger
  documentation sites unpleasant to edit.
- Extension diagnostics must stay in parity with `content:check`; editor-only
  interpretations are not acceptable.

## Acceptance Criteria

- The same fixture produces matching CLI and editor issue codes.
- Updates invalidate only the necessary cached page and graph information.
- Disabling or omitting the extension has no effect on Norna validation or
  builds.
