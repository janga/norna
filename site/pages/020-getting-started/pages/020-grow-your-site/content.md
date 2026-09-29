---
page:
  description:
    Choose between sections and pages as a Norna site
    grows.
---

# Grow Your Site

A new Norna site begins with one page. As its content grows, decide whether new
material continues the current page, deserves another main area, or belongs
below a broader topic.

## Choose sections or pages {#choose-sections-or-pages}

A section continues the current page and shares its H1, URL, and `content.md`. A
separate page has its own page directory, H1, URL, content, and images.

Use a section for another part of the same reading task. Add a page for a
distinct task or topic that remains useful when opened directly. If that page is
a clear part of a broader topic, make it a child of the broader page.

See
[Choose a section or page](/reference/site/pages/#choose-pages-and-sections)
for the complete editorial test and examples.

## Start with one page {#single-page-site}

A new Norna site starts with one Home page. Its content and images live together
at the root of the site folder:

```text
site/
├── content.md               # Homepage title, sections, and text
├── site-config/
│   ├── settings.yaml        # Technical settings
│   ├── site-theme.yaml      # Shared visual choices
│   └── shared-content.yaml  # Shared logo settings, banners, and footer
├── images/                  # Images used by the homepage
├── pages/                   # Create this when adding child pages
└── public/                  # Static files copied unchanged
    ├── favicon.ico          # Optional browser tab and bookmark icon
    └── robots.txt           # Instructions for search crawlers
```

Each page keeps its Markdown content and images together. Norna uses this
structure to connect them without additional configuration.

Each page starts with exactly one H1. Every H2 starts a section, and each H3
creates a subsection within the current section:

````md
# Dog Shelter

## What we do

We rescue and rehome dogs.

```image-stack
items:
  - image: dog-house.svg
    caption: Ready for adoption.
```

## You can help

Adopt. Foster. Donate.

```image-stack
items:
  - image: heart.svg
    caption: Foster care creates space.
```
````

On a one-page site, the page title and H2 section headings form the navigation.
Desktop navigation keeps these links close to the page; the mobile menu exposes
the same destinations in one expandable panel. H3 headings structure the text
inside a section but are not additional links in this single-page menu.

<!-- norna-image-provenance:
image: single-page-site.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to explain
how a single-page file tree, content.md and page-local images map to a
simple single-page website.
-->

```image-stack
items:
  - image: single-page-site.svg
    alt: A three-column diagram showing a single-page Norna file tree, Markdown page content, and the resulting browser page with navigation derived from its headings.
```

The example places both images in the page's `images/` directory and inserts
them with `image-stack` blocks. A stack may contain one or several images;
alt text and captions can be added to each entry.

External images can use ordinary Markdown image syntax. See
[Images and metadata](/reference/site/images/)
for image placement, processing, and captions.

## Add top-level pages {#top-level-pages}

Add top-level pages when the site needs several main areas. Each page has its
own URL, content, and images. Its H2 headings can provide local section
navigation:

```text
site/
├── content.md
└── pages/
    ├── 010-dogs/
    │   ├── content.md
    │   └── images/
    └── 020-adopt/
        └── content.md
```

Create the two pages with the project's installed Norna version:

```sh
norna page:add "Dogs" --parent /
norna page:add "Adopt" --parent /
```

Link to the new pages with ordinary Markdown in any page's `content.md`:

```md
[Meet the dogs](/dogs/)
[Learn how to adopt](/adopt/)
```

Norna adapts site-relative links to the configured publishing path.
`norna content:check` reports links to missing pages or headings. See
[Internal Links](/reference/site/urls/)
for page, section, relative, and public-file links.

The numeric prefix orders pages among their siblings, while the remaining page
id becomes the URL segment: `010-dogs/` appears before `020-adopt/` and produces
a URL ending in `/dogs/`. The command chooses those ten-step order values and
ASCII ids automatically; the [page command reference](/reference/commands/create/)
documents overrides and conflict handling.

Top-level pages normally use horizontal navigation on wide screens. On small
screens, the same pages are collected in one expandable menu. Select a page
name to open it, or its chevron to reveal its H2 sections. These section links
stay in the page menus instead of occupying a second sticky row.

Images referenced through Norna blocks are managed images: Norna validates,
processes, and keeps track of their files. Each one belongs in the `images/`
directory beside the page that uses it. If an image reference moves to another
page, run:

```sh
# Preview and confirm an unambiguous image move
norna content:sync
```

Norna moves the uniquely identified file into the receiving page's `images/`
directory. `norna content:check` reports a missing, misplaced, or ambiguous
image instead of guessing. See
[Images and metadata](/reference/site/images/)
for the complete placement and synchronization rules.

The following views show the Dogs page before and after opening its mobile
navigation.

<!-- norna-image-provenance:
image: dog-shelter-mobile-page.png
source: local screenshot
Captured from the dog-shelter-multi-page example at 390x600 with Menu closed.
Regenerate with node scripts/capture-navigation-examples.mjs.
-->

<!-- norna-image-provenance:
image: dog-shelter-mobile-navigation.png
source: local screenshot
Captured from the same Dogs page at 390x600 with Menu open.
Regenerate with node scripts/capture-navigation-examples.mjs.
-->

```image-carousel
items:
  - image: dog-shelter-mobile-page.png
    alt: The Dog Shelter Dogs page on a small screen with the navigation menu closed and a Menu button in the top-right corner.
    caption: The page on a small screen. Select Menu to open navigation.
  - image: dog-shelter-mobile-navigation.png
    alt: The Dog Shelter Dogs page on a narrow screen, with an open menu listing Dog Shelter, Dogs, and Adopt.
    caption: The same page with navigation open and the current page marked.
```

## Add nested pages {#child-pages}

Use nested pages when several distinct pages belong under one broader heading.
The parent always has its own page. The `Getting Started` area you are reading
has five child pages. Its parent page can introduce the area or simply list
the child pages automatically.

The illustration maps the documentation's real page directories to the
navigation visible on this page. Numeric prefixes determine sibling order but
are omitted from the displayed labels. The highlighted
`020-grow-your-site/content.md` file supplies the current page title and its H2
section links.

<!-- norna-image-provenance:
image: getting-started-file-map.svg
source: hand-authored
Hand-authored SVG diagram based on the actual Getting Started page hierarchy
and navigation in the Norna documentation site.
-->

```image-stack
items:
  - image: getting-started-file-map.svg
    alt: The actual documentation file tree mapped to the rendered Getting Started navigation. The 020-getting-started page contains Install Norna, Choose A Theme, Grow Your Site, Prepare Your Site, and Build And Publish in numeric order. The highlighted 020-grow-your-site content file maps to the current page and its H2 section links.
    caption: The page directories and their content become the navigation and page you are using now.
```

The parent page can contain only a heading and the child-list setting:

```md
---
page:
  listChildren: true
---

# Getting Started
```

Create the parent and its first child with:

```sh
norna page:add "Getting Started" --parent /
norna page:add "Install Norna" --parent /getting-started/
```

The second command creates `/getting-started/install-norna/`. Opening
`/getting-started/` shows the parent page and its generated list of direct
listed children. If the parent needs an introduction, add it after the H1;
the list stays after all authored content. See
[List child pages](/reference/site/pages/#list-child-pages).

Each child page remains an ordinary Markdown file. For example:

```md
---
page:
  description:
    Choose between sections and pages as a Norna site
    grows.
---

# Grow Your Site

## Choose sections or pages

Use a section for another part of the same reading task.

## Start with one page

Each page keeps its Markdown content and images together.
```

The top-level page gives Getting Started a menu in global navigation.
Its two pages stay together in one left tree, with H2 links beneath each page.
Click a page name to open it; use the separate chevron to expand or collapse
its outline. A parent page opens its own content and generated child list.

For a larger collection with subgroups, the selected subgroup supplies the
local tree. Home keeps global navigation without a persistent left tree.
On small screens, the same pages and H2 destinations move into Menu. The
[navigation reference](/reference/configuration/navigation/) explains how
Norna selects areas and remembers branch choices.

At the end of each page, previous and next links follow this same listed branch
in depth-first order. They make a guide readable in sequence without carrying
the reader into another top-level area.

Home is the root page at `site/content.md`. Its children in `site/pages/` are
the top-level entries in navigation. Place deeper topics beneath the page or
parent page they belong to.

See [Pages and child-page lists](/reference/site/pages/)
for source files, creation options, ordering, URLs, inherited page themes,
navigation behavior, and safe page moves.

## Review the resulting structure {#review-structure}

As the hierarchy grows, inspect the structure Norna actually derives without
changing any source files:

```sh
norna navigation:review
```

The report lists branches, pages, H2/H3 outlines, internal page
links, and each page's effective navigation mode. Errors are reported
separately from advisory prompts. Those prompts are starting points for editorial judgment,
not validation failures or automatic rewrites.

The [command reference](/reference/commands/navigation/)
defines every reported term, the conservative review thresholds, exit behavior,
and the stable JSON format for tools.
