---
page:
  description:
    Choose between sections, pages, and navigation categories as a Norna site
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
[Choose a section, page, or category](https://github.com/janga/norna/blob/main/docs/pages.md#choose-a-section-page-or-category)
for the complete editorial test and examples.

## Start with one page {#single-page-site}

A new Norna site starts with one Home page. Its content and images live together
in one page directory:

```text
site/
├── config.yaml              # Technical settings
├── theme.yaml               # Visual choices
├── sitewide-content.yaml    # Shared banners and footer
│
├── pages/                   # The site's pages
│   └── 000-home/            # The required home page
│       ├── content.md       # Page title, sections, and text
│       └── images/          # Images used by this page
│
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

```norna-image-stack
- image: dog-house.svg
  caption: Ready for adoption.
```

## You can help

Adopt. Foster. Donate.

```norna-image-stack
- image: heart.svg
  caption: Foster care creates space.
```
````

On a one-page site, the page title and section headings form the navigation.
Desktop navigation keeps these links close to the page; the mobile menu exposes
the same page and heading structure in one expandable panel. Subsections can be
included when the chosen navigation model needs that extra level.

<!-- norna-image-provenance:
image: single-page-site.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to explain
how a single-page file tree, content.md and page-local images map to a
simple single-page website.
-->

```norna-image-stack
- image: single-page-site.svg
  alt: A three-column diagram showing a single-page Norna file tree, Markdown page content, and the resulting browser page with navigation derived from its headings.
```

The example places both images in the page's `images/` directory and inserts
them with `norna-image-stack` blocks. A stack may contain one or several images;
alt text and captions can be added to each entry.

External images can use ordinary Markdown image syntax. See
[Images and metadata](https://github.com/janga/norna/blob/main/docs/images-and-metadata.md)
for image placement, processing, and captions.

## Add top-level pages {#top-level-pages}

Add top-level pages when the site needs several main areas. Each page has its
own URL, content, images, and section navigation:

```text
site/pages/
├── 000-home/
│   └── content.md
├── 010-dogs/
│   ├── content.md
│   └── images/
└── 020-adopt/
    └── content.md
```

Create the two pages with the project's installed Norna version:

```sh
npm exec -- norna page:add "Dogs" --parent /
npm exec -- norna page:add "Adopt" --parent /
```

If you installed the optional global launcher in the first guide, the shorter
forms are `norna page:add "Dogs" --parent /` and
`norna page:add "Adopt" --parent /`.

The numeric prefix orders pages among their siblings, while the remaining page
id becomes the URL segment: `010-dogs/` appears before `020-adopt/` and produces
a URL ending in `/dogs/`. The command chooses those ten-step order values and
ASCII ids automatically; the [page command reference](https://github.com/janga/norna/blob/main/docs/pages.md#create-pages-and-categories)
documents overrides and conflict handling.

Top-level pages normally use horizontal navigation on wide screens. On small
screens, the same pages are collected in one expandable menu.

With several pages, Norna-managed images keep each local image with the page
that uses it. The command `npm run norna:content:check` reports missing or
misplaced images. If an image reference moves to another page, run:

```sh
# Preview and confirm an unambiguous image move
npm run norna:sync
```

Norna moves the uniquely identified file into the receiving page's `images/`
directory. Moving a reference between sections on the same page requires no file
move because those sections share the same image directory.

The following views show the Dogs page before and after opening its mobile
navigation.

<!-- norna-image-provenance:
image: dog-shelter-mobile-page.png
source: local screenshot
Screenshot of the Dogs page in the dog-shelter-multi-page example at a mobile
viewport with navigation closed.
-->

<!-- norna-image-provenance:
image: dog-shelter-mobile-navigation.png
source: local screenshot
Screenshot of the same Dogs page with its mobile navigation menu open.
-->

```norna-image-carousel
- image: dog-shelter-mobile-page.png
  alt: The Dog Shelter Dogs page on a small screen with the navigation menu closed and a Menu button in the top-right corner.
  caption: The page on a small screen. Select Menu to open navigation.
- image: dog-shelter-mobile-navigation.png
  alt: The Dog Shelter Dogs page on a narrow screen, with an open menu listing Dog Shelter, Dogs, and Adopt.
  caption: The same page with navigation open and the current page marked.
```

## Add nested pages {#child-pages}

Use nested pages when several distinct pages belong under one broader heading.
The heading can be a real parent page or a navigation category.

Choose a parent page when the broader topic needs an introduction or overview
of its own. Choose a category when the heading only needs to group child pages
in navigation.

This documentation example uses `Guides` as a category:

```text
site/pages/
├── 000-home/
│   └── content.md
└── 010-guides/
    ├── category.yaml
    └── pages/
        └── 010-installation/
            ├── content.md
            └── pages/
                ├── 010-macos/
                │   └── content.md
                ├── 020-linux/
                │   └── content.md
                └── 030-windows/
                    └── content.md
```

The category file contains only its navigation label:

```yaml
label: Guides
```

Create the category and its first page with:

```sh
npm exec -- norna category:add "Guides" --parent /
npm exec -- norna page:add "Installation" --parent /guides/
```

`Guides` has no page or URL of its own. The category id still remains in the
child URLs, so the commands create `/guides/installation/`; further child pages
produce `/guides/installation/macos/`, `/guides/installation/linux/`, and
`/guides/installation/windows/`.

If `Guides` needs an introduction or overview, use `content.md` instead of
`category.yaml`. It then becomes a real page at `/guides/`, while the child URLs
remain unchanged. A page/category directory must contain exactly one of those
two marker files.

The macOS page remains an ordinary Markdown file:

```md
---
page:
  description: A macOS installation page.
---

# macOS

## Install

This page is available at `/guides/installation/macos/`.

### Prerequisites

Add details that belong under the installation step.

## Verify

Explain how the reader can verify the installation.
```

The top-level category stays in global navigation and opens its first child
page. In the local tree and breadcrumbs, `Guides` remains a non-linked grouping
label. The current page's H2 and H3 headings appear with the page hierarchy. On
a small screen, the same structure becomes one expandable menu instead of a
separate desktop sidebar.

Home is the exception: `000-home` is the site's front door and cannot have child
pages or categories. Start each navigable hierarchy with another top-level
entry beside it.

<!-- norna-image-provenance:
image: nested-pages-desktop.png
source: local screenshot
Screenshot of the Installation page in the nested-pages fixture after Guides
became a navigation category above the operating-system pages.
-->

```norna-image-stack
- image: nested-pages-desktop.png
  alt: A rendered Installation page with Guides in global navigation and as a category above Installation, macOS, Linux, and Windows in the left navigation tree.
  caption: A category groups related pages without adding another page to read.
```

On a wide screen, readers can hide or show the tree with one control. Norna
remembers the choice for the current browser tab without moving the document
column; without JavaScript, the tree remains visible and usable.

An optional limited `theme.yaml` in the category directory is inherited by its
descendant pages. See [Pages and categories](https://github.com/janga/norna/blob/main/docs/pages.md)
for exact marker files, creation options, directory names, ordering, URL
segments, inheritance, warnings, and automatic navigation behavior.
