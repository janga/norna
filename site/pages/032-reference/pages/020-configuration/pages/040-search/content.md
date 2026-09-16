---
page:
  description: Enable static search, refresh the local index and understand indexed content and return navigation.
---

# Search

`search: true` creates a search page and static index during builds. It needs
no search server or hosted account. The default is `false`.

```yaml title="site/config.yaml" {2}
url: https://example.com/
search: true
```

## Index and reserved routes

The build creates `/search/` and `dist/pagefind/` and adds a Search button to
the header. These routes, including their public-file destinations, cannot
also be source pages, aliases or public assets.

Norna indexes rendered editorial content: titles, H2/H3 headings, prose,
captions, notes and structured blocks. Result links can target sections.
Category lists contribute labels and direct-child descriptions, not copies
of descendant body text.

Navigation, banners, footer, page-sequence/source links, the 404 page,
redirects and the search page are excluded. Unlisted means absent from
navigation, not private; do not use it to protect searchable content.

Only the search page loads the Pagefind interface and index. Language-specific
behavior depends on [Pagefind support](https://pagefind.app/docs/multilingual/).

## Local updates

```sh title="Refresh searchable HTML and restart local preview"
npm exec -- norna build:local
```

`dev` can serve the most recently built index but does not regenerate it as
Markdown changes. Published builds always create a fresh index. An unavailable
local index is not evidence that the content is unsearchable.

## Return from search

Opening Search from a page offers a **Back to ...** link, restoring that page,
its query and anchor, scroll position and focus on the Search button. Display
choices remain unchanged. The return link works even with no results or an
index-load failure.

This destination is stored in the tab's session storage and search history
entry, not a cookie. Reloading preserves it; direct/new-tab entry or unavailable
storage uses **Go to the homepage**. Search itself needs JavaScript. Without
it, Home and ordinary site navigation remain available.
