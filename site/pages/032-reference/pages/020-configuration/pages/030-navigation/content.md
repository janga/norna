---
page:
  description: Understand which navigation Norna builds from the page tree and how it adapts on narrower screens.
---

# Automatic navigation

Norna builds navigation from page folders and Markdown headings. Normally
leave `navigation.mode` at `automatic`: adding listed pages and categories
then changes the navigation without maintaining a separate menu file.

```yaml title="site/config.yaml" {3}
url: https://example.com/
navigation:
  mode: automatic
```

## How automatic chooses

| Listed structure | Mode | Wide-screen navigation |
| --- | --- | --- |
| Only Home | `sections` | H1 and H2 links in sticky navigation |
| Home plus top-level pages, without children or categories | `top` | Page links with disclosures for their H2 sections |
| Any child page or navigation category | `tree` | Global top-level links and a local left page tree |

The selected mode is site-wide. H2/H3 headings do not add page-tree depth.
Unlisted pages do not affect the choice. Home is a deliberate exception in
tree mode: it has global links without a persistent local rail. Its outline
remains available in the compact menu.

## Page links and outlines

In `sections` mode, one H2 is enough to create section navigation. With no H2,
the H1 remains a top link rather than leaving an empty menu.

In `top` mode, a separate chevron opens each page's H2 destinations without
loading that page first. Clicking the title follows the page link. Sections
are not duplicated in a second sticky row. Small screens group these links
under their page names in Menu.

In `tree` mode, the left rail shows the current top-level area, not every
unrelated global destination. On shallow branches, each page can disclose its
H2/H3 outline. A branch at least three visible page levels deep can instead
place the current outline in a right rail, provided the current page has at
least two H2/H3 destinations. H1 and H4-or-deeper headings are not in outlines.

Current-page branches open on entry; other explicit branch choices are
remembered during the browser session with JavaScript. A chevron toggles a
branch independently of its link. Native disclosures and real links work
without JavaScript, but expansion state is then not carried across loads.

## Narrow screens and Focus reading

Navigation simplifies in order as horizontal space decreases:

1. Separate left page tree and right contents rail.
2. One left tree with integrated page outlines.
3. Compact Menu with the same page and heading destinations.

Shallow trees begin at the second step. Top/section navigation moves directly
to a compact menu. No destination disappears because a rail no longer fits.

[Focus reading](/reference/reader/display/#focus-reading) lets readers hide
persistent rails themselves while retaining Menu. This does not change the
site hierarchy or the selected navigation mode.

## Orientation and long trees

Breadcrumbs show actual ancestors, not Home as an invented parent. Category
labels in breadcrumbs are plain text. Previous/Next page links traverse listed
pages depth-first within the current top-level area, skipping categories and
stopping before another global area. These are ordinary links.

Tree controls filter navigation labels, expand/collapse branches and locate
the current page; filtering is not full-text site search. The current page
and heading are marked without relying only on color. During scrolling,
Norna keeps the active outline entry visible, but pauses following while the
reader operates that list. It does not reopen closed branches, remove a filter,
change keyboard focus or write scroll positions into the URL.

The right outline follows when present; otherwise the left outline follows.
A closed branch receives a marker on its nearest visible ancestor. At the end
of a document the marker can still reach its last headings. Automatic tracking
and following require JavaScript; manual navigation remains available without it.

## Explicit modes

`sections`, `top` and `tree` may be selected explicitly in `config.yaml`.
`sections` is for a one-page site, not a way to hide additional pages.
Explicit `top` can expose child pages in submenus, but cannot represent a
listed category. Listed categories therefore reject `sections` and `top`.

Tree mode requires [uniform section backgrounds](/reference/configuration/sections/),
also in Focus reading and on small screens. Built-in presets make this
adjustment automatically unless an explicit conflicting override is present.
