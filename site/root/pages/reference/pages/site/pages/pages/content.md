---
page:
  description: Organize content-backed pages, order siblings and generate child-page lists.
navigation:
  order: 2000
---

# Pages and child-page lists

Every page has a `content.md` with one H1. The homepage is the required root
page at `site/root/content.md`; its children live in
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
    `-- getting-started/
        |-- content.md
        `-- pages/
            |-- install/content.md
            `-- first-page/content.md
```

## List child pages

Set `page.listChildren: true` in the parent's frontmatter to append a generated
list after all its authored content. The H1 is required; introductory prose,
other headings and images are optional.

```md title="site/root/pages/getting-started/content.md"
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

Folders use a lowercase ASCII slug, such as `install-norna`. Slugs contain
letters, digits and single hyphens and must be unique among siblings. The slug
becomes a URL segment; `root/` and intermediate `pages/` directories do not.

Set the optional `navigation.order` in each child's `content.md`:

```yaml title="Page frontmatter"
navigation:
  order: 1000
```

Lower values appear first. Use positive integers with gaps, for example 1000,
2000 and 3000. Siblings without a value follow the explicitly ordered pages,
sorted alphabetically by slug. Duplicate values produce a warning and use slug
to break the tie; preview and publication still work. Dates do not affect order.
The homepage has no sibling order. Unlisted siblings use the same ordering rules.

Changing the order updates frontmatter and keeps the directory and URL stable.
[Page creation](/reference/commands/create/) and [page moves](/reference/commands/move/)
let you choose a position without calculating a value. If no integer fits,
Norna proposes new values for the affected sibling group. You see the affected
files and approve the extra changes before they are written. Build and preview
never renumber pages.

To create a page by hand, make `pages/your-slug/content.md` under its parent and
write one H1. Add `navigation.order` if you want an explicit position; otherwise
the page follows the numbered siblings. See [URLs and links](/reference/site/urls/).

## Source format {#page-source-layout}

Current sites declare `sourceFormat: 2` in `site-config/settings.yaml`.
Older sites with ordering prefixes need a separate conversion before using
this engine. See [Convert an older source layout](/reference/workflows/legacy-source/).

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
