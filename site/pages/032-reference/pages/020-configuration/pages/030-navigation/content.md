---
page:
  description: Understand how Norna turns the page hierarchy into menus, local page trees and heading links.
---

# Automatic navigation

Norna builds navigation from [pages and categories](/reference/site/pages/)
and Markdown headings. Leave `navigation.mode` at `automatic` to let the
listed hierarchy choose the presentation. No separate menu file is needed.

```yaml title="site/config.yaml" {3}
url: https://example.com/
navigation:
  mode: automatic
```

## How automatic chooses

| Listed structure | Mode | Wide-screen navigation |
| --- | --- | --- |
| Only Home | `sections` | H1 and H2 links in sticky navigation |
| Home and direct child pages, without deeper pages or categories | `top` | Page links with disclosures for their H2 sections |
| Any child page or navigation category | `tree` | Area menus and a local page tree with H2 links |

The selected mode is site-wide. Headings do not add page-tree depth, and
unlisted pages do not affect the choice. In `sections` mode, one H2 is enough
for section navigation; with no H2, the H1 remains a top link.

In `top` mode, clicking a page title follows its link. A separate chevron
opens that page's H2 destinations without loading it first. Sections are not
duplicated in a second sticky row.

## Areas in tree navigation

An **area** is the part of the listed page hierarchy shown in the left menu.
Norna derives areas from existing pages and categories; there is no area
setting to maintain.

Home shows the global destinations in its sticky navigation. A destination
without children is a direct link. A destination with children opens a menu
on hover, or through click, touch or keyboard activation. The menu groups
parents with descendants separately from direct page links. Descriptions come
from page metadata or the optional `description` in `category.yaml`.

The selected destination determines the left menu:

- A collection containing only direct pages keeps those pages together. For
  example, Getting Started with Install and Prepare pages shows both pages
  and their H2 links in one tree.
- In a collection with subgroups, a child with descendants supplies the local
  area. For example, Reference → Site model shows Site model's pages. A direct
  page beside such groups shows only its own H2 links, when present.
- An authored parent's own page remains a menu choice and opens with its full
  tree. Its H2 links appear before its child pages.

A menu with more than twelve choices becomes a direct link to its destination,
where the full collection tree is available. The count includes an authored
root's own page, but not descendants below the direct choices. This limit is
built in, not configurable.

On reading pages, sticky breadcrumbs replace the global sticky row. The menu
button beside the breadcrumbs opens the same area choices, with Home and
other global destinations below. The site identity links to Home; Search and
Display remain available above the left menu. Home itself has no persistent
left tree. No separate right outline competes with the article's margin.

## Page links and outlines

The tree includes H2 links beneath each page, including a page with only one
H2. H1, H3 and deeper headings remain in the document but are not extra outline
levels. Their anchors still work as ordinary links.

Clicking page or category text follows its destination. The separate chevron
opens or closes that branch. Choosing a page opens its branch and H2 outline;
clicking the current page name returns to its beginning and opens its outline.
Other branches retain their choices. Expanding keeps the clicked row in place;
collapsing does too, unless the shorter tree requires clamping its scroll
position. Selection does not change the label's font weight.

With JavaScript, Back, Forward and reload restore the entry's saved branch
choices and menu position, including a deliberately closed current branch.
History traversal also restores the article's reading position. Native links
and disclosures work without JavaScript, but saved state is not carried
across page loads.

## Narrow screens and Focus reading

When the left tree no longer fits, a compact **Menu** offers the same page and
H2 destinations. Top and section navigation also use Menu on small screens.
The area panel fits within the viewport; a long panel can scroll.

[Focus reading](/reference/reader/display/#focus-reading) lets readers hide
the persistent tree themselves while retaining compact navigation. This does
not change the hierarchy or navigation mode. Search still searches site
content; the tree's filter only matches navigation labels.

## Orientation and long trees

Breadcrumbs show actual ancestors, not Home as an invented parent. Category
labels in breadcrumbs are plain text. Previous/Next page links traverse listed
pages depth-first within the current top-level collection, skipping categories
and stopping before another global collection. They do not stop at a smaller
local area's boundary.

Tree controls filter navigation labels, expand or collapse branches, and
locate the current page. The current page and heading are marked without
relying only on color. During article scrolling, Norna keeps the active H2
entry visible, but pauses following while the reader operates the tree. After
arrival or history restoration, it leaves the restored menu position alone
until the reader resumes interaction with the article.

Following does not reopen closed branches, remove a filter, change keyboard
focus or write scroll positions into the URL. A closed branch receives a
marker on its nearest visible ancestor. At the end of the document the marker
can reach its last heading. Automatic tracking and following require
JavaScript; manual navigation remains available without it.

## Explicit modes

`sections`, `top` and `tree` may be selected explicitly in `config.yaml`.
`sections` is for a one-page site, not a way to hide additional pages.
Explicit `top` can expose child pages in submenus, but cannot represent a
listed category. Listed categories therefore reject `sections` and `top`.

Tree mode requires [uniform section backgrounds](/reference/configuration/sections/),
also in Focus reading and on small screens. Built-in presets make this
adjustment automatically unless an explicit conflicting override is present.
