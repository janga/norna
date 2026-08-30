---
page:
  description: Create, edit, build and publish your first Norna site.
---

# Getting Started

## Install Norna and create a site {#create}

You need:

- Node.js 22.12 or later.
- ImageMagick

Norna uses ImageMagick to prepare raster images for responsive layouts. Install
it separately for your operating system before adding JPEG or PNG images to the
site.{note-ref}

{note: [How to install ImageMagick.](/faq/#install-imagemagick)}

```sh
# Create a new site project in my-site/
npx @janga/norna@latest init my-site
cd my-site

# Install the Norna version recorded by the project
npm install
```

The first command uses the latest Norna release to create the project.
`package.json` records the project's Norna version, and `npm install` installs
that version.

See
[Requirements and limitations](https://github.com/janga/norna/blob/main/docs/requirements.md)
for exact runtime and external-tool requirements.

## Preview and make the first edit {#preview}

Start the development server from the project directory:

```sh
# Start local preview
npm run norna:dev
```

Open the address printed by the command. Then edit
`site/pages/000-home/content.md` and save the file:

```md
# Dog Shelter

We help dogs find permanent homes.

## Our dogs

Meet the dogs currently waiting for a family.

### Meet Rover

Rover enjoys long walks and quiet afternoons.
```

`#` is the page title, `##` starts a section, and `###` creates a subsection. On
a one-page site, Norna builds local navigation from the page title and its `##`
sections.

## Growing your site {#pages}

### Start with one page {#single-page-site}

A new Norna site starts with one Home page. Its content and images live
together in one page directory:

```text
site/
├── config.yaml              # Technical settings
├── theme.yaml               # Visual choices
├── sitewide-content.yaml    # Shared banners and footer
│
├── pages/                   # The site's pages
│   └── 000-home/            # The required home page
│       ├── content.md       # Page title, sections, and text
│       └── images/          # Managed images used by this page
│
└── public/                  # Static files copied unchanged
    ├── favicon.ico          # Optional browser tab and bookmark icon
    └── robots.txt           # Instructions for search crawlers
```

Each page keeps its Markdown content and images together. Norna uses this
structure to connect them without additional configuration.

For the first edit, focus on `content.md` and the adjacent `images/` directory.
The generated defaults in the other files are enough for local preview.

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
[Content](https://github.com/janga/norna/blob/main/docs/content.md) for exact
heading, generated-id, note, and Norna-block syntax, and
[Images and metadata](https://github.com/janga/norna/blob/main/docs/images-and-metadata.md)
for image placement, processing, and captions.

### Add top-level pages {#top-level-pages}

Sites with more content need more pages and navigation that fits the available
screen. Top-level pages normally use horizontal navigation on wide screens. As
pages or their contents gain more levels, Norna switches to a navigation tree.
On small screens, the same structure is presented in an expandable menu.

Add peer pages when the site needs several main areas. Each page has its own
URL, content, images, and section navigation:

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

The numeric prefix orders pages among their siblings, while the remaining page
id becomes the URL segment: `010-dogs/` appears before `020-adopt/` and produces
a URL ending in `/dogs/`.

With several pages, Norna-managed images are useful for keeping each image with
the page that uses it. These are local files referenced from Norna image,
carousel, or card blocks. The command `npm run norna:content:check` reports
missing or misplaced files. If an image reference moves to another page, run
`npm run norna:sync`; it can move a uniquely identified image into that page's
`images/` directory.

The Dogs page builds on the same shelter example. On a small screen, its
top-level pages move into one expandable menu. The following views show the
same page before and after opening that menu.

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

### Add nested pages {#nested-pages}

Group related pages under one top-level page, each with its own URL and section
navigation:

```text
site/pages/
├── 000-home/
│   └── content.md
└── 010-guides/
    ├── content.md
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

This creates `/guides/`, `/guides/installation/`, and
separate installation pages for macOS, Linux, and Windows. Every directory is a
real page with its own H1, content, and URL; Norna does not use empty grouping
directories.

The macOS page remains an ordinary Markdown file:

```md
---
page:
  description: A third-level macOS installation page.
---

# macOS

## Install

This third-level page is available at `/guides/installation/macos/`.

### Prerequisites

Add details that belong under the installation step.

## Verify

Explain how the reader can verify the installation.
```

The top-level area stays in global navigation. Its descendants form a local page
tree, and the current page's H2 and H3 headings appear with that tree. On a
small screen, the same hierarchy becomes an expandable menu rather than a
separate desktop sidebar.

Home is the exception: `000-home` is the site's front door and cannot have child
pages. Start each navigable hierarchy with another top-level page beside it.

The rendered page keeps the top-level area in global navigation and shows its
deeper page hierarchy in the desktop navigation tree:

<!-- norna-image-provenance:
image: nested-pages-desktop.png
source: local screenshot
Screenshot of the macOS page in the nested-pages fixture after adding Linux and
Windows as sibling installation pages.
-->

```norna-image-stack
- image: nested-pages-desktop.png
  alt: A rendered macOS installation page with Guides in the global navigation and a left navigation tree showing Installation, macOS, Linux, and Windows.
  caption: A nested documentation page keeps its wider context visible on a desktop screen.
```

On a wide screen, readers can hide or show the tree with one control. Norna
remembers the choice for the current browser tab without moving the document
column; without JavaScript, the tree remains visible and usable.

See [Pages](https://github.com/janga/norna/blob/main/docs/pages.md) for page
directory rules, ordering, URL segments, nesting, inheritance, and the exact
automatic navigation contract.

## Choose the site's presentation {#theme}

A theme preset is a complete visual starting point. Norna includes four:

- `portfolio` for image-led sites with restrained typography
- `documentation` for guides and sustained reading
- `project` for project and product sites that balance text, code, cards, and images
- `statement` for short sites with a stronger editorial voice

Choose one in `site/theme.yaml`:

```yaml
preset: documentation
```

Start with the preset alone and review it with real content before adding
overrides. The [preset comparison](https://janga.github.io/norna/examples/theme-presets/)
renders identical content with all four presets, so differences in typography,
spacing, media, and surfaces can be compared directly.

If you later need an override, export the installed preset as a commented
reference:

```sh
npm run norna:theme:export -- documentation
```

This creates `site/orig-documentation-theme.yaml`. Norna does not load the
reference file, and the command refuses to overwrite an existing one.

Presets can also enable reader choices for color mode, text width, and focus
reading. The site remains readable without JavaScript; JavaScript is used only
to change and remember those choices.

See [Theme presets and overrides](https://github.com/janga/norna/blob/main/docs/theme.md#theme-presets),
[Reader Display controls](https://github.com/janga/norna/blob/main/docs/theme.md#reader-display-controls),
[Typography](https://github.com/janga/norna/blob/main/docs/typography.md), and
[Presentation guarantees](https://github.com/janga/norna/blob/main/docs/presentation-guarantees.md)
for exact defaults, allowed overrides, page-theme scope, and the presentation
baseline that presets cannot weaken.

## Core commands {#commands}

The generated `package.json` exposes Norna through project-local npm scripts.
Their common form is `npm run norna:<task>`:

```sh
# Start local preview
npm run norna:dev

# Validate configuration, content, and managed image references
npm run norna:check

# Move image files after their references move between pages
npm run norna:sync

# Create the static website in dist/
npm run norna:build
```

`norna:check` does not change source files. Use its focused variants when
diagnosing a configuration or content problem:

```sh
npm run norna:config:check
npm run norna:content:check
```

`norna:sync` is needed only after a managed image reference moves to another
page. It shows the complete move plan before asking for confirmation. Moving a
reference between sections on the same page requires no sync because those
sections share the same page-local `images/` directory.

### Optional shorter commands

The `norna:*` npm scripts work without a global installation. If you prefer
shorter direct commands, install the cross-platform launcher once:

```sh
npm install --global @janga/norna@latest
```

The corresponding direct commands are:

```sh
norna dev
norna check
norna content:sync
norna build
```

Inside a project, the launcher delegates to that project's locally installed
Norna version. The project dependency and lockfile therefore remain the source
of the engine version.

See [Commands](https://github.com/janga/norna/blob/main/docs/commands.md) for
all project scripts, direct CLI forms, options, side effects, and engine
selection.

## Build and publish {#publish}

Before the first publish, set the public site URL in `site/config.yaml`:

```yaml
url: https://owner.github.io/repository/
```

Create a GitHub repository for the site and push the project. In the repository,
open **Settings -> Pages** and select **GitHub Actions** as the publishing
source.

The included workflow checks and builds the site whenever you push to the
repository's default branch. If the checks pass, GitHub Pages publishes the
generated `dist/` output.

See [Publishing](https://github.com/janga/norna/blob/main/docs/publishing.md)
for custom domains, deploy commands, and troubleshooting.
