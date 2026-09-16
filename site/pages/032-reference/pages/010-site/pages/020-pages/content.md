---
page:
  description: Organize pages and categories, order siblings and understand category URLs.
---

# Pages and categories

A **page** contains editorial content in `content.md`. A **category** groups
pages under a label in `category.yaml`, without introductory prose. Each
folder contains exactly one of these files, never both.

## Page or category

Use a page for an independent reader need; a section for another part of the
same reading task; and a category when a parent would only repeat child links
already available in navigation.

```text title="A category and two pages"
site/pages/
|-- 000-home/content.md
`-- 010-getting-started/
    |-- category.yaml
    `-- pages/
        |-- 010-install/content.md
        `-- 020-first-page/content.md
```

```yaml title="site/pages/010-getting-started/category.yaml"
label: Getting started
```

The category label appears in navigation. A page label comes from its one H1.
Both pages and categories can have children in `pages/`, with no fixed depth
limit. Home is the exception: `pages/000-home/content.md` cannot have children.
It is a welcome page, not an ancestor of every other page.

## Names and order

Folders use `NNN-slug`: a three-digit order number and lowercase ASCII slug,
such as `010-install-norna`. Except for Home, numbers run from `001` to `999`.
Slugs use letters, digits and single hyphens. Both number and slug must be
unique among siblings; they can recur under different parents.

Numeric order determines navigation order. The slug becomes a URL segment;
the number and intermediate `pages/` folders do not. Changing the H1 or
reordering a folder does not change its URL. See [URLs and links](/reference/site/urls/).

[page:add and category:add](/reference/commands/create/) create the files, or
you can edit them directly. Categories have no image content of their own.

## Opening a category URL

A category has a URL despite having no `content.md`. Norna examines its first
**listed direct child**, in numeric order:

| First listed direct child | Category URL result |
| --- | --- |
| A page | Static redirect to that page |
| Another category | Generated list of this category's listed direct children |

Norna does not search through subcategories for an arbitrary first page. The
generated list shows labels and available page descriptions. A valid
category-first structure causes no warning.

The redirect has a normal link fallback. It is not a permanent
[alias](/reference/site/urls/#keep-an-old-url): its target follows the current
first listed child. Link directly to a page when a link must keep identifying
that page after reordering.

A listed category must eventually contain a reachable listed page. Empty
categories are possible while editing, but fail content checks and builds.
Categories require tree navigation, normally selected automatically.

## Listed and unlisted pages

Pages are listed by default. A non-home page can stay published without
appearing in generated navigation:

```md title="content.md: hide a navigation entry"
---
navigation:
  listed: false
---

# Supplementary measurements
```

An unlisted parent also removes its descendants from navigation. This does
not make URLs private or remove pages from the sitemap. Categories do not
accept this metadata, and Home must remain listed.

[Automatic navigation](/reference/configuration/navigation/) defines menus,
breadcrumbs and page sequences. [page:move](/reference/commands/move/) changes
the folder hierarchy while updating internal links.
