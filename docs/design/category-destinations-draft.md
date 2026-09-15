# Category Destinations

Status: approved behavior, documentation draft. Not implemented or available
in the current release. This text is intended for the Navigation Categories
section of the page reference after implementation and review.
Tracked by [BL-112: Category Destinations](backlog/BL-112-category-destinations.md).

## Opening A Category URL

A category groups related pages without requiring introductory content. Its
directory contains `category.yaml` instead of `content.md`. Norna uses the
category's URL to help visitors reach its content:

| First listed direct child | Result at the category URL |
| --- | --- |
| A page | Redirect to that page. |
| A category | Show the category name and a list of its direct children. |

The first child is determined by the same ordering used in navigation.
Entries excluded from navigation are not offered as destinations.

### Start With A Page

```text
020-getting-started/
|-- category.yaml             # label: Getting Started
`-- pages/
    |-- 010-install-norna/
    |   `-- content.md
    `-- 020-prepare-your-site/
        `-- content.md
```

Opening `/getting-started/` redirects to
`/getting-started/install-norna/`. The visitor reads the existing page; Norna
does not copy its content into a separate category document.

### Start With A Choice

```text
010-guides/
|-- category.yaml             # label: Guides
`-- pages/
    |-- 010-installation/
    |   |-- category.yaml     # label: Installation
    |   `-- pages/
    |       `-- 010-install-norna/
    |           `-- content.md
    `-- 020-workflows/
        `-- content.md
```

Opening `/guides/` shows the heading Guides and links to Installation and
Workflows, with existing descriptions when available. It neither jumps to
Install Norna nor bypasses Installation to open Workflows.

Choosing Installation opens `/guides/installation/`, which redirects to its
first direct page, `/guides/installation/install-norna/`. The visitor chooses
the branch before Norna opens its starting page.

Generated lists contain only direct children, not every page in the subtree.
No additional source file or theme setting is needed. Expanding a category
in the navigation tree still only reveals its children; it does not navigate.

## Categories Need Reachable Content

A category must lead to at least one page included in navigation. If it is
empty or has no listed reachable content, the build fails and identifies the
category's source path. Add a listed content page or remove the category.
A category containing other categories is valid when their branches lead to
listed content; nesting itself does not cause a warning.

## Ordering And Stable Links

Reordering children can change which page a category opens, or change the
category destination from a redirect to a list. Link to a page's own URL when
the link must identify that specific document regardless of ordering.

Category redirects are not permanent aliases. The mechanism depends on the
host: GitHub Pages uses a generated HTML redirect document with an ordinary
destination link, rather than a server-side HTTP redirect. It works without
JavaScript.
