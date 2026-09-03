# Pages And Categories

`site/pages/` is an ordered hierarchy. Every `NNN-id/` directory in that
hierarchy must represent exactly one of two things:

| Marker file | Meaning | Own URL | Editorial content and images |
| --- | --- | --- | --- |
| `content.md` | A page that readers can open. | Yes | The Markdown and an optional adjacent `images/` directory belong to the page. |
| `category.yaml` | A navigation-only label that groups child pages. | No | A category has no Markdown content and cannot contain `images/`. |

Do not put both marker files in one directory. A directory with neither marker
is also invalid. This distinction lets a collection use a real introductory
page when it has something useful to say, or a category when it only needs a
navigation label.

For example:

```text
site/pages/
|-- 000-home/
|   `-- content.md
|-- 010-guides/
|   |-- category.yaml
|   `-- pages/
|       `-- 010-installation/
|           |-- content.md
|           `-- images/
`-- 020-reference/
    `-- content.md
```

`Home`, `Installation`, and `Reference` are pages. `Guides` is a category. The
example builds `/`, `/guides/installation/`, and `/reference/`, but it does not
build `/guides/`.

Pages use the Markdown H1, optional metadata, sections, Norna blocks, and
managed-image model described in [Content](content.md). Categories use the
small YAML shape described under [Navigation Categories](#navigation-categories).

## Homepage And Top-Level Entries

The homepage is required at:

```text
site/pages/000-home/content.md
```

It builds to `/`. The `000` prefix is reserved for `000-home`, and Home cannot
contain a nested `pages/` directory. Home is the site's front door, not the
parent of every page.

Other directories directly under `site/pages/` are top-level navigation
entries. A top-level page is both a navigation destination and a page. A
top-level category is a label for its descendants; its global-navigation link
opens the first listed descendant page instead of creating a category page.

## Choose A Section, Page, Or Category

A section is part of its current page and shares that page's H1, URL, metadata,
and `content.md`. A separate page has its own directory, `content.md`, H1, URL,
metadata, and optional images.

Use a section for another part of the same reading task. Add a page for a
distinct task or topic that remains useful when opened directly.

A page is usually appropriate when all of these statements are true:

- it answers a question or supports a task of its own;
- a reader can understand it without first reading the complete parent page;
- linking directly to it is useful and likely to remain useful;
- its subject has a clear place in the surrounding hierarchy.

Keep the content as a section when it needs the surrounding page for context,
continues the same task or argument, or is too short to justify another
navigation choice.

Use one purpose sentence to test a proposed page:

```text
This page helps <audience> to <understand or accomplish one thing>.
```

For a child page, also complete:

```text
It belongs under <parent> because <clear relationship>.
```

For example, `Installation` can introduce installation as a whole, while
`macOS`, `Linux`, and `Windows` are child pages that each support a distinct
installation task. A short `Verify` procedure normally remains a section on
each operating-system page because it completes the same task.

Use a category instead of a parent page only when the collection needs a label
in navigation but no useful introduction, overview, or other content of its
own. Do not replace a useful parent page with a category merely to shorten its
file tree.

This is editorial guidance, not a validation rule. Norna validates the file
structure, while the site author decides which topics deserve pages.

## Navigation Categories

A category is a non-routable grouping in the page hierarchy. Its directory
contains `category.yaml` instead of `content.md`:

```text
site/pages/010-guides/
|-- category.yaml
`-- pages/
    |-- 010-installation/
    |   `-- content.md
    `-- 020-workflows/
        `-- content.md
```

The complete category file is:

```yaml
label: Guides
```

The directory id still contributes the `guides` segment to descendant URLs:

```text
/guides/installation/
/guides/workflows/
```

Norna does not generate `/guides/`. The category appears as:

- a link to its first listed descendant in global top navigation;
- a disclosure-only label in the desktop tree and mobile menu;
- non-linked text in breadcrumbs.

A category may contain an optional limited `theme.yaml`; descendant pages
inherit it. A category cannot contain `images/`, because it has no page content
that can reference them. Put an image on a child page, or replace
`category.yaml` with `content.md` when the collection needs editorial content.

An empty category is allowed temporarily while editing, but `content:check`
reports a warning. A category with no listed descendant is omitted from
generated navigation.

## Nested Pages

Both a page and a category may contain a `pages/` directory. A page remains the
right parent when the broader topic needs its own useful destination:

```text
site/pages/010-guides/
|-- content.md
`-- pages/
    `-- 020-workflows/
        |-- content.md
        `-- pages/
            `-- 010-local/
                `-- content.md
```

This produces:

```text
/guides/
/guides/workflows/
/guides/workflows/local/
```

Replace a parent's `content.md` with `category.yaml` only when that parent is a
navigation label rather than a page. Descendant URL segments stay the same,
but the parent URL is then absent.

## Directory Names, Order, And URLs

Page and category directories use:

```text
NNN-id
```

`NNN` is a three-digit sibling presentation order. `id` becomes that entry's
URL segment or, for a category, the URL prefix inherited by its descendants.
Valid names include:

```text
010-getting-started
020-concepts
120-api-reference
```

Invalid names include:

```text
10-about
000-about
010_About
010-About
010-about-
010-about--team
```

The id may contain only lowercase `a-z`, numbers, and single hyphens between
alphanumeric groups. The numeric prefix is not part of the URL. Renaming
`030-contact/` to `015-contact/` changes its order among siblings but keeps the
URL segment `contact`.

Sibling ids and numeric orders must be unique across both pages and categories.
Reusing the same id below a different parent is valid because the complete URL
path remains different.

## Preserve Old Page URLs

Moving or renaming a page directory can change its public URL. Add each URL
that readers may still use to `page.aliases` in the page's `content.md`:

```md
---
page:
  description: Install Norna on a new computer.
  aliases:
    - /installation/
    - /guides/install/
---

# Install Norna
```

An alias is an old site-relative page URL attached to the current page. The
declaration means:

> This old URL permanently identifies this current page.

The target is therefore always the page containing the declaration. An alias
is not a general redirect rule and cannot name a separate target or an external
website. Keep it when the page moves again, and do not reuse that old URL for a
different page.

Alias paths use the same lowercase ASCII segments as page directory ids. They
must start and end with `/`, cannot contain a query string or fragment, and
cannot be `/`. Write them relative to the Norna site, without its configured
base path. For example, `/installation/` on a site configured as
`https://owner.github.io/project/` preserves
`https://owner.github.io/project/installation/`.

Norna checks every alias against page URLs, category paths, other aliases,
files under `site/public/`, and generated routes. A collision stops the check
and build with both source locations. Aliases are not pages and are excluded
from `sitemap.xml`.

The publishing mechanism depends on the hosting service. A provider with
native redirect rules can represent a permanent alias as an HTTP `301` or
`308` when a publishing integration supports that provider. Without such an
integration, Norna's static output contains a small redirect document with a
canonical target, immediate browser navigation, and an ordinary link to the
current page.

> **GitHub Pages limitation:** GitHub Pages is the only publishing provider
> integrated with Norna today. It does not let a deployed static artifact
> define arbitrary path-level HTTP redirects. Norna therefore publishes the
> static redirect document for each alias. It keeps old browser links useful,
> but its response is not an HTTP `301`.

When moving a page manually:

1. Record the page's current site-relative URL.
2. Move or rename its directory.
3. Add the recorded URL to `page.aliases` in the moved `content.md`.
4. Run `npm run norna:check`, then build and inspect the old URL.

Each moved child page has its own URL identity. When a complete page subtree
moves, add the previous URL to every moved page that must remain reachable.

## Create Pages And Categories

Use the project-local Norna installation through `npm exec`:

```sh
npm exec -- norna category:add "Guides" --parent /
npm exec -- norna page:add "Installation" --parent /guides/
npm exec -- norna page:add "macOS" --parent /guides/installation/
```

If the optional global launcher is installed, the equivalent shorter commands
start with `norna` instead of `npm exec -- norna`.

`page:add` creates `content.md` with an H1 and an `Introduction` H2, plus an
adjacent empty `images/` directory. `category:add` creates `category.yaml` and
an empty `pages/` directory. Both commands derive an ASCII id from the supplied
title or label; for example, `Räksmörgås` becomes `raksmorgas`.

By default, a new entry uses the nearest higher multiple of ten after its
existing siblings. Use these options when the default is unsuitable:

| Option | Effect |
| --- | --- |
| `--parent /` | Create a top-level entry. |
| `--parent /guides/` | Create a child below the existing logical path. |
| `--slug custom-id` | Replace the generated ASCII id. |
| `--order 15` | Replace the generated sibling order; the directory uses `015`. |
| `--dry-run` | Print the destination and URL behavior without writing files. |

Without `--parent`, run the command from exactly `site/pages/` to add a
top-level entry, or from an existing page/category directory to add a child.
Norna reports an error from any other working directory rather than guessing.

The requested slug and order must be unique among siblings. Norna prepares the
new directory under `site/.norna/create/` and then moves the complete directory
into place, so a failed preparation does not leave a partial page or category.

## Page Content

A minimal page is ordinary Markdown:

```md
---
page:
  description: Installation instructions.
---

# Installation

Introductory text.

## Requirements {#requirements}

Text...
```

The H1 supplies the visible page title, document title, and navigation label.
`page.description` is optional metadata and is not rendered. H2 and H3 headings
provide page-local navigation according to the selected navigation model.

## Navigation

Home and listed top-level entries appear in global navigation. Child pages and
categories appear in the local hierarchy for their top-level area. Breadcrumbs
show actual page and category ancestors; category labels are text because they
have no URL. Home is not added as an artificial ancestor.

The numeric prefix controls order among siblings. Set `navigation.listed` to
`false` in a non-home page's frontmatter when the page should remain public but
not appear in generated navigation:

```yaml
navigation:
  listed: false
```

An unlisted page still has a public URL and remains in the generated sitemap.
This setting is not access control. See
[Public Files: Generated Sitemap](public-files.md#generated-sitemap).

Home is always listed. Categories do not have page frontmatter; a category is
shown only when it has a listed descendant.

With `navigation.mode: automatic`, Norna chooses from the listed hierarchy:

| Site structure | Selected mode |
| --- | --- |
| Home is the only listed page | `sections` |
| Several listed pages, no categories, and no combined page/H2/H3 path deeper than two levels | `top` |
| A listed category or a deeper page/heading path | `tree` |

The depth includes both page directories and navigable headings. A top-level
page is level one, its H2 headings are level two, and its H3 headings are level
three. A child page is level two, so adding H2 headings to that page also
requires tree navigation. Unlisted pages do not influence automatic selection.

The modes present the same source hierarchy differently:

- `sections` keeps the one page's H1 destination and H2 sections in sticky
  page navigation.
- `top` keeps Home and top-level pages in the global row. Child pages use page
  submenus, and the current page's H2 sections use local navigation when there
  is more than one.
- `tree` keeps top-level areas in the global row and shows the active area's
  page/category hierarchy plus current-page H2 and H3 headings in a desktop
  sidebar.

Categories require `tree` navigation because they need disclosure behavior
without pretending to be page links. Explicit `sections` or `top` mode is
therefore invalid when a listed category exists.

### Focus Reading With A Desktop Tree

`tree` navigation always adds Focus reading to the Display panel, even when the
selected preset would otherwise omit that choice. Focus reading hides the local
tree together with the other secondary navigation, breadcrumbs, and footer.
The Display control stays visible so the reader can restore the normal view.

The document column keeps its width and horizontal position while Focus reading
changes. Prose, headings, images, cards, and section surfaces therefore do not
reflow or jump sideways. The choice is stored in the `norna-focus-reading`
cookie and follows the reader across pages until it is changed or reset.

On small screens, the complete hierarchy remains available in the expandable
menu. Without JavaScript, Focus reading cannot be selected and the tree stays
visible; all page and anchor links remain usable.

### Current Reading Position

Tree navigation always identifies the current page. A site can additionally
set `navigation.sectionTracking: true` in `config.yaml` to let the tree follow
the reader within that page. When an H2 or H3 reaches the top of the reading
area below the sticky header, Norna marks its corresponding tree link. The
marker remains on that heading until the next navigable heading reaches the
same position.

This optional enhancement does not change the URL, browser history, keyboard
focus, or scroll position. The link uses `aria-current="location"` as well as a
visible marker. Without JavaScript, the page and anchor links remain usable but
the marker does not follow scrolling. See
[`navigation.sectionTracking`](configuration.md#navigationsectiontracking) for
the setting, default, and availability.

Navigation also sets the boundary for section backgrounds. `sections` and
`top` navigation may use full-viewport `alternating` or `accented` H2 section
bands. `tree` navigation always uses one `uniform` reading surface beside its
persistent navigation region. See
[Section Backgrounds](theme.md#section-backgrounds).

On a small screen, page, category, and heading destinations are collected in
one expandable menu. Expanding a branch reveals its children without
navigating; following a page link is a separate action. Real page and anchor
links remain usable without JavaScript. See
[Client-Side JavaScript](client-javascript.md) for the enhancement boundary.

The site-wide `navigation.mode` in `config.yaml` can explicitly select
`automatic`, `sections`, `top`, or `tree`. See
[Configuration](configuration.md#navigation).

## Page Images

Managed images belong directly to the page that references them:

```text
site/pages/010-guides/pages/020-workflows/images/diagram.svg
```

The Markdown block still uses only the filename:

````md
```norna-image-stack
- image: diagram.svg
  alt: The local workflow.
```
````

Run `npm run norna:content:check` to find missing or misplaced images and
`npm run norna:sync` to move unambiguous files into the expected page image
root. Sync shows its complete plan before writing and never guesses when a
filename has multiple possible sources. If a filesystem error interrupts
several moves, run sync again after fixing the reported problem; completed
moves are retained.

Categories cannot contain images. Put an image in the `images/` directory of
the page that references it.

## Page Themes

The root `site/theme.yaml` owns the site's visual identity: preset, palette,
corners, typography, page frame, navigation presentation, and defaults for
structured content blocks.

An optional limited `theme.yaml` may appear in a non-home page or category
directory. It may adjust only:

- `layout.textWidth`
- `layout.contentSpacing`
- managed-image presentation and sizing under `images`
- `sections.backgroundPattern` when navigation does not resolve to `tree`

These values are inherited by descendant pages and merged with more local
settings. A category theme affects descendants even though the category itself
does not render a page. Site colors, typography, corners, page width, gutters,
structured content-block defaults, and navigation remain global.

Page and category directories cannot contain `config.yaml` or
`sitewide-content.yaml`; technical configuration and shared editorial content
remain at the selected site's top level. Tree navigation requires a uniform
section background, so an explicit `alternating` or `accented` local override
is invalid. See [Theme](theme.md#page-themes).
