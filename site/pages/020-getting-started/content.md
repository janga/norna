---
page:
  description: Create, edit, build and publish your first Norna site.
---

# Getting Started

## Install Norna and create a site {#create}

You need Node.js 22.12 or later.

```sh
# Create a new site project in my-site/
npx @janga/norna@latest init my-site
cd my-site

# Install the Norna version recorded by the project
npm install
```

The first command uses the latest Norna release to create the project.
`package.json` records the project's Norna version, and `npm install` installs
that version locally.{note-ref}

{note: Adding Norna to an existing Node project is also supported. See the
[FAQ](/faq/#add-norna-to-an-existing-project).}

Commit `package.json` and `package-lock.json` to Git. Together they let you
restore an earlier version after a failed upgrade and keep installations
consistent for everyone working on the site and for automated builds.

Norna uses ImageMagick to prepare raster images for responsive layouts. Install
it separately for your operating system before adding JPEG or PNG images to the
site.{note-ref}

{note: [How to install ImageMagick.](/faq/#install-imagemagick)}

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

`#` is the page title, `##` starts a section, and `###` adds structure within
that section. Norna renders the page and derives its local navigation from the
same heading hierarchy.

## Growing your site {#pages}

### Start with one page {#single-page-site}

The generated project starts with one page named Home:

```text
site/
├── config.yaml
├── theme.yaml
├── sitewide-content.yaml
├── pages/
│   └── 000-home/
│       ├── content.md
│       └── images/
└── public/
```

Norna expects these files in defined places. The page text belongs in
`content.md`; managed source images belong beside it in `images/`; visual
choices belong in `theme.yaml`; and technical settings belong in `config.yaml`.
Shared banners and footer content belong in `sitewide-content.yaml`, while
`public/` contains files copied directly to the published site.

Following this structure lets Norna connect content, images, presentation,
configuration, and navigation without requiring you to describe those
relationships again.

A page has exactly one H1. Each H2 begins a section and each H3 is a subsection
within the current section:

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

The example places both managed source images in the page's `images/` directory
and inserts them with `norna-image-stack` blocks. A stack may contain one or
several images; alt text and captions can be added to each entry.

External images can use ordinary Markdown image syntax. See
[Content](https://github.com/janga/norna/blob/main/docs/content.md) for exact
heading, generated-id, note, and Norna-block syntax, and
[Images and metadata](https://github.com/janga/norna/blob/main/docs/images-and-metadata.md)
for image placement, processing, and captions.

### Add top-level pages {#top-level-pages}

Add a page directory beside `000-home` when the site needs another main page:

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

These pages are peers. Each gets its own URL, content, managed images, and local
headings. The numeric prefix orders pages among their siblings, while the
remaining page id becomes the URL segment: `010-dogs/` appears before
`020-adopt/` and produces a URL ending in `/dogs/`.

Top-level pages appear in the site's global navigation. Selecting one reveals
that page's sections without losing access to the other pages. On mobile, pages
and their sections are presented together in the same menu.

<!-- norna-image-provenance:
image: multi-page-site.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to explain
how page folders map to page content, navigation, managed images and URLs.
-->

```norna-image-stack
- image: multi-page-site.svg
  alt: A three-column diagram showing top-level page folders, the Dogs page Markdown, and the resulting Dogs page with its URL and global navigation.
```

### Add nested pages {#nested-pages}

When a top-level area needs more structure, add a `pages/` directory inside its
page:

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
                └── 020-macos/
                    └── content.md
```

This creates `/guides/`, `/guides/installation/`, and
`/guides/installation/macos/`. Every directory is a real page with its own H1,
content, and URL; Norna does not use empty grouping directories.

The top-level area stays in global navigation. Its descendants form a local page
tree, and the current page's H2 and H3 headings appear with that tree. On a
small screen, the same hierarchy becomes an expandable menu rather than a
separate desktop sidebar.

Home is the exception: `000-home` is the site's front door and cannot have child
pages. Start each navigable hierarchy with another top-level page beside it.

<!-- norna-image-provenance:
image: nested-pages.svg
source: hand-authored
Hand-authored SVG diagram created for the Norna introduction site to explain
how nested page directories map to URLs and desktop and mobile navigation.
-->

```norna-image-stack
- image: nested-pages.svg
  alt: A diagram showing nested Guides, Installation and macOS page folders mapped to their URLs, a desktop navigation tree and an expandable mobile menu.
```

See [Pages](https://github.com/janga/norna/blob/main/docs/pages.md) for page
directory rules, ordering, URL segments, nesting, inheritance, and the exact
automatic navigation contract.

## Choose the site's presentation {#theme}

Norna includes four complete visual presets:

- `portfolio` for restrained, image-led presentation
- `documentation` for reading and technical explanation
- `project` for compact project and product sites
- `statement` for short content with a stronger editorial voice

A complete site theme can therefore be this short:

```yaml
preset: documentation
```

Add only values that should differ from the preset:

```yaml
preset: documentation
layout:
  pageWidth: 1320px
palette: dark
```

To inspect a preset before overriding it, export a commented reference file:

```sh
npm run norna:theme:export -- documentation
```

This creates `site/orig-documentation-theme.yaml`. Norna does not load the
reference file, and the command refuses to overwrite an existing one.

The root theme keeps colors, shape, typography, page frame, and navigation
consistent. A page-local `theme.yaml` can make narrower presentation changes
that its descendants inherit.

See [Theme](https://github.com/janga/norna/blob/main/docs/theme.md) and
[Typography](https://github.com/janga/norna/blob/main/docs/typography.md) for
presets, allowed overrides, defaults, and page-theme inheritance.

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

Build the same static output that will be published:

```sh
npm run norna:check
npm run norna:build
```

Norna writes the generated website to `dist/`. Do not edit `dist/` as site
source; edit the files under `site/` and build again.

The generated project includes GitHub Pages publishing. Commit the source and
push it to GitHub when it is ready:

```sh
git status
git add site/
git commit -m "Update site"
git push
```

The included GitHub Actions workflow then runs the required checks, builds the
site, and publishes the generated output. A failed check prevents a broken site
from being published.

Git also lets you restore an unintended content edit or image move. Norna does
not require a clean working tree for normal checks or image sync.

GitHub Pages is the only integrated publishing target today. Other services can
serve static files, but Norna does not currently provide publishing integrations
for them.

See [Publishing](https://github.com/janga/norna/blob/main/docs/publishing.md)
for repository setup, workflow permissions, custom domains, and troubleshooting.
