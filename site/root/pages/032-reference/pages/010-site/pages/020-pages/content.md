---
page:
  description: Organize content-backed pages, order siblings and generate child-page lists.
---

# Pages and child-page lists

Every page has a `content.md` with one H1. The homepage is the required root
page at `site/root/content.md`; its children are ordered directories in
`site/root/pages/`. Any child can have its own `pages/` directory, with no fixed
depth limit.

## Choose pages and sections

Use a child page for an independent reader need and an H2 section for another
part of the same reading task. A parent page can have editorial text or simply
introduce its children. It always has its own URL and can be opened directly.

```text title="A parent and two child pages"
site/root/
|-- content.md
`-- pages/
    `-- 010-getting-started/
        |-- content.md
        `-- pages/
            |-- 010-install/content.md
            `-- 020-first-page/content.md
```

## List child pages

Set `page.listChildren: true` in the parent's frontmatter to append a generated
list after all its authored content. The H1 is required; introductory prose,
other headings and images are optional.

```md title="site/root/pages/010-getting-started/content.md"
---
page:
  description: Install Norna and prepare your first site.
  listChildren: true
---

# Getting started

Choose a task below.
```

The list contains every **direct** child listed in navigation, in sibling
order. It uses each child's H1 and optional `page.description`; it does not
include grandchildren or children under an unlisted branch. The list is
generated and cannot be edited separately. A page with `listChildren: true`
and no listed direct child remains valid, but `content:check` and `build`
warn about the empty list.

## Names and order

Folders use `NNN-slug`: a three-digit order number and lowercase ASCII slug,
such as `010-install-norna`. Numbers run from `001` to `999`. The root homepage
has no numbered folder; reordering children does not replace it.
Slugs use letters, digits and single hyphens. Both number and slug must be
unique among siblings; they can recur under different parents.

Numeric order determines navigation order. The slug becomes a URL segment;
the number, `root/` and intermediate `pages/` folders do not. Changing the H1 or
reordering a folder does not change its URL. See [URLs and links](/reference/site/urls/).

Use [page:add](/reference/commands/create/) or create the files directly.

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
not make URLs private or remove pages from the sitemap. Home must remain
listed.

[Automatic navigation](/reference/configuration/navigation/) defines menus,
breadcrumbs and page sequences. [page:move](/reference/commands/move/) changes
the folder hierarchy while updating internal links.
