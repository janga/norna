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

See [Requirements and limitations](https://github.com/janga/norna/blob/main/docs/requirements.md)
for exact runtime and external-tool requirements.

## Preview and make the first edit {#preview}

Start the development server from the project directory:

```sh
# Why use norna:dev? npm runs the Norna version installed by this project.
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

### Optional shorter commands

The generated `norna:*` npm scripts are the portable project commands. If you
prefer direct commands, install the cross-platform launcher once:

```sh
npm install --global @janga/norna@latest
```

You can then use `norna dev`, `norna check`, and `norna build`. Inside a project,
the launcher delegates to that project's locally installed Norna version. The
project dependency and lockfile therefore remain the source of the engine
version.

[Commands](https://github.com/janga/norna/blob/main/docs/commands.md) documents
all npm scripts, direct CLI forms, options, and project-local engine selection.

## Start with one page {#single-page-site}

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

```md
# Dog Shelter

An introduction to the site.

## What we do

We rescue and rehome dogs.

### Recovery

Every dog receives care before adoption.

## You can help

Adopt. Foster. Donate.
```

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

Managed local images are placed in the page's `images/` directory and inserted
with a small Norna Markdown block:

````md
```norna-image-stack
- image: rover.jpg
  alt: Rover waiting for a home.
  caption: Rover
```
````

External images can use ordinary Markdown image syntax. See
[Content](https://github.com/janga/norna/blob/main/docs/content.md) for exact
heading, generated-id, note, and Norna-block syntax, and
[Images and metadata](https://github.com/janga/norna/blob/main/docs/images-and-metadata.md)
for image placement, processing, and captions.

## Add top-level pages {#top-level-pages}

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

## Add nested pages {#nested-pages}

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

The top-level area stays in global navigation. Its descendants form a local
page tree, and the current page's H2 and H3 headings appear with that tree. On a
small screen, the same hierarchy becomes an expandable menu rather than a
separate desktop sidebar.

Home is the exception: `000-home` is the site's front door and cannot have
child pages. Start each navigable hierarchy with another top-level page beside
it.

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

## Check and maintain the source {#check}

Run the combined check before committing or publishing:

```sh
# Does this change files? No. It validates configuration and content.
npm run norna:check
```

Use the focused checks while diagnosing a problem:

```sh
npm run norna:config:check
npm run norna:content:check
```

When a managed image reference moves to another page, sync can move the source
image to that page's `images/` directory:

```sh
# When is sync useful? After moving an image reference between pages.
# Unlike check, this command moves the corresponding image file.
npm run norna:sync
```

Moving a reference between sections on the same page requires no sync because
both sections use the same page-local `images/` directory. For a move between
pages, sync shows every source and destination before asking for confirmation.
If a filesystem error interrupts the operation, fix the reported problem and
run sync again; already completed moves remain in place.

Git is still recommended because it lets you restore an unintended content edit
or image move, but sync does not require a clean working tree.

See [Commands](https://github.com/janga/norna/blob/main/docs/commands.md) for
command side effects and options, and
[Images and metadata](https://github.com/janga/norna/blob/main/docs/images-and-metadata.md)
for sync matching, ambiguity, and diagnostics.

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

GitHub Pages is the only integrated publishing target today. Other services can
serve static files, but Norna does not currently provide publishing integrations
for them.

See [Publishing](https://github.com/janga/norna/blob/main/docs/publishing.md)
for repository setup, workflow permissions, custom domains, and troubleshooting.

## Continue with the reference {#reference}

This page introduces the normal path from an empty directory to a published
site. The Markdown reference goes deeper without repeating the tutorial:

- [Site files](https://github.com/janga/norna/blob/main/docs/site-files.md) lists required, optional, versioned, and generated paths.
- [Content](https://github.com/janga/norna/blob/main/docs/content.md) defines headings, ids, notes, Norna blocks, and validation rules.
- [Pages](https://github.com/janga/norna/blob/main/docs/pages.md) defines directory names, ordering, URLs, nesting, and navigation.
- [Theme](https://github.com/janga/norna/blob/main/docs/theme.md) and [Typography](https://github.com/janga/norna/blob/main/docs/typography.md) define presets, overrides, and inheritance.
- [Configuration](https://github.com/janga/norna/blob/main/docs/configuration.md) defines technical settings and defaults.
- [Commands](https://github.com/janga/norna/blob/main/docs/commands.md) documents every project script and direct CLI form.
- [Images and metadata](https://github.com/janga/norna/blob/main/docs/images-and-metadata.md) explains managed images, generated variants, sync, and metadata.

You can also browse the [Examples](/examples/) or use the [FAQ](/faq/) when a
normal setup produces an unexpected result.
