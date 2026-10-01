---
page:
  description: Organize pages and attachments, configure navigation and appearance, and check before publishing.
---

# Building a site with Norna

These examples combine page files, configuration and commands. They control
how the site is organized, presented and published.

## Page attachments {#page-attachments}

[Download the visit checklist](visit-checklist.txt).

````md
[Download the visit checklist](visit-checklist.txt).
````

**Source:** An ordinary Markdown link to a file in this page's `downloads/`
directory. The file is published unchanged.

```text
050-building-a-site/
|-- content.md
`-- downloads/
    `-- visit-checklist.txt
```

Norna moves the directory with its page and updates known internal links.
Old external attachment URLs are not redirected. See
[page attachments](/reference/site/attachments/).

## Automatic navigation {#automatic-navigation}

### One page: sections

A single page needs only its title and section links. These screenshots use the
complete Markdown shown below, with the `project` preset.

```image-stack
items:
  - image: navigation-single-desktop.png
    alt: Dog Shelter on a wide screen, with its title and two section links in sticky navigation.
    caption: In a sufficiently large browser.
```

```image-carousel
items:
  - image: navigation-single-mobile.png
    alt: The same page on a small screen, showing What we do and its text below a closed Menu trigger.
    caption: On a small screen, with Menu closed.
  - image: navigation-single-menu.png
    alt: The open compact menu contains Dog Shelter, What we do, and You can help.
    caption: On a small screen, with Menu open.
```

```text
site/root/
`-- content.md
```

<!-- navigation-source: fixtures/navigation-examples/single/site/root/content.md -->

```md title="content.md"
# Dog Shelter

## What we do

We rescue and rehome dogs.

## You can help

Adopt. Foster. Donate.
```

### Top-level pages: top navigation

Adding Dogs and Adopt gives each page its own URL. Select a page name to open
it, or its chevron to choose a section directly.

```image-carousel
items:
  - image: navigation-top-desktop.png
    alt: Dogs on a wide screen, with Dog Shelter, Dogs, and Adopt in top navigation. Page chevrons open their section menus.
    caption: In a sufficiently large browser.
  - image: navigation-top-sections.png
    alt: The Dogs disclosure shows Meet the dogs and Before you adopt as direct section links.
    caption: Each page's chevron reveals its H2 destinations.
```

```image-carousel
items:
  - image: navigation-top-mobile.png
    alt: Dogs with Menu closed on a small screen.
    caption: The page with Menu closed.
  - image: navigation-top-menu.png
    alt: The compact menu groups the Dogs sections beneath Dogs, alongside the other pages.
    caption: Menu groups sections under their pages.
```

```text
site/root/
|-- content.md
`-- pages/
    |-- 010-dogs/content.md
    `-- 020-adopt/content.md
```

<!-- navigation-source: fixtures/navigation-examples/top/site/root/pages/010-dogs/content.md -->

```md title="root/pages/010-dogs/content.md"
# Dogs

## Meet the dogs

Each dog needs a home that suits its personality and daily routine.

## Before you adopt

Talk to our volunteers about exercise, company, and veterinary care.
```

### Nested pages: a page tree

As documentation grows, group related guides and reference pages into branches.
Readers can explore one topic at a time.

Put Adult dogs and Senior dogs beneath Dogs to keep related pages together. The
left tree contains the Dogs branch; Adopt remains a global destination.

```image-stack
items:
  - image: navigation-nested-desktop.png
    alt: Adult dogs with Dogs and its child pages in a left tree, plus the current page's sections.
    caption: In a sufficiently large browser.
```

```image-carousel
items:
  - image: navigation-nested-mobile.png
    alt: Adult dogs on a small screen, without persistent navigation rails.
    caption: The same page with Menu closed.
  - image: navigation-nested-menu.png
    alt: The open compact menu preserves Dogs, its child pages, and their sections.
    caption: Menu preserves the hierarchy.
```

```text
site/root/
|-- content.md
`-- pages/
    |-- 010-dogs/
    |   |-- content.md
    |   `-- pages/
    |       |-- 010-adult-dogs/content.md
    |       `-- 020-senior-dogs/content.md
    `-- 020-adopt/content.md
```

<!-- navigation-source: fixtures/navigation-examples/nested/site/root/pages/010-dogs/pages/010-adult-dogs/content.md -->

```md title="root/pages/010-dogs/pages/010-adult-dogs/content.md"
# Adult dogs

## Daily routines

Adult dogs benefit from regular walks, company, and a quiet place to rest.

## A good match

Tell us about your household so we can help you find a suitable companion.
```

The same structure can hold a larger handbook. Here, platform guides belong
under Installation, and publishing guides form a separate branch. Choosing
Installation gives the left tree that branch and its H2 links. This excerpt
uses the `documentation` preset.

```image-stack
items:
  - image: navigation-documentation-desktop.png
    alt: A handbook with Installation and its platform pages in the left tree. Linux is selected, with Requirements and Local preview beneath it.
    caption: Pages and H2 links share one left tree, leaving room beside the article.
```

```text title="Documentation example"
site/root/
|-- content.md
`-- pages/
    |-- 010-guides/
    |   |-- content.md
    |   `-- pages/
    |       |-- 010-installation/
    |       |   |-- content.md
    |       |   `-- pages/
    |       |       |-- 010-macos/content.md
    |       |       |-- 020-windows/content.md
    |       |       `-- 030-linux/content.md
    |       `-- 020-publishing/
    |           |-- content.md
    |           `-- pages/
    |               `-- 010-github-pages/content.md
    `-- 020-reference/content.md
```

<!-- navigation-source: fixtures/navigation-examples/documentation/site/root/pages/010-guides/pages/010-installation/pages/030-linux/content.md -->

````md title="root/pages/010-guides/pages/010-installation/pages/030-linux/content.md"
# Linux

## Requirements

Install Node.js 22.12 or later. Install ImageMagick too if your site uses
raster images.

### Check Node.js

```sh
node --version
```

## Local preview

From an installed site project's directory, start Norna:

```sh
npm run norna:dev
```

Open the address printed in the terminal. Keep the terminal running while
you edit your site.
````

This is a small excerpt, not a reason to add levels unnecessarily. Large
documentation sites such as
[Kubernetes](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/setup-ha-etcd-with-kubeadm/)
and
[Grafana](https://grafana.com/docs/grafana/latest/alerting/configure-notifications/)
use branches to organize installation methods and configuration topics.

**Source:** The page directories and Markdown headings determine navigation.
`navigation.mode` defaults to `automatic`. H2 links appear in section and top
navigation, or beneath pages in a local tree. H3 remains in the article with
its anchor. As space runs out, the same navigation moves into Menu. Home
stays an uncluttered entry page.

<!-- Screenshots: scripts/capture-navigation-examples.mjs. All four runnable
sources are in fixtures/navigation-examples; no illustrated UI is hand-drawn. -->

Read the
[navigation reference](/reference/configuration/navigation/)
for mode selection, depth, exceptions, and responsive fallbacks.

## Moving pages and preserving links {#page-move}

The preview reports the directory move, affected internal links, and old URLs
without writing files. The write step moves the complete page subtree and its
images, updates links, and records redirect aliases.

```sh
# Preview the complete operation without changing files
norna page:move /guides/install/ /reference/install/

# Apply the reviewed move
norna page:move /guides/install/ /reference/install/ --write
```

**Source:** Norna command. Conflicts, ambiguous links, invalid destinations, and
failed post-write validation stop the operation rather than leaving a partially
accepted structure. Read the
[page-move reference](/reference/commands/move/).

## Search and language {#search}

Norna allows searching page titles, sections, prose, captions, notes, and
structured content without a hosted search service.

```yaml title="site/site-config/settings.yaml"
search: true
```

**Source:** Site configuration. The search engine and its index load only on the
search page. Use **Back to Building a site with Norna** above the search heading to return to your
reading position. Read the
[search reference](/reference/configuration/search/).

### Site language

| Source choice  | Example generated interface labels                  |
| -------------- | --------------------------------------------------- |
| `language: sv` | Sidor, Sidinnehåll, Sök, Visning, Fokuserad läsning |

```yaml title="site/site-config/settings.yaml"
language: sv
```

**Source:** Site configuration. The value identifies the HTML language and
selects one complete built-in interface pack. It does not translate Markdown,
captions, banners, or other editorial content. Most non-English interface packs
were AI-generated and must be reviewed by a fluent speaker before publication.
Read the
[language reference](/reference/configuration/language/).

## Branding, notices and footer {#branding}

<!-- norna-image-provenance:
image: navigation-logo.svg
source: maintained repository asset
Copied from the public files of the site-wide content demonstration.
-->

```image-stack
items:
  - image: navigation-logo.svg
    alt: The Shared Frame example logo, made from overlapping outlined squares and a wordmark.
    caption: A conventionally named logo is discovered without a path setting.
```

```text
site/public/
|-- logo.svg          # Navigation logo
|-- favicon.svg       # Browser tab and bookmark icon
`-- social-image.jpg  # Default social sharing image
```

**Source:** Convention-based public files. Each role has an exact set of
accepted filenames and uniqueness rules; no image path belongs in YAML. Read the
[public-files reference](/reference/site/public-files/).

### Notices and footer

[Open the complete site-wide elements demonstration](https://janga.github.io/norna/examples/feature-demos/sitewide-content/)
to see the same logo, dismissible notices, and footer across several pages.

```yaml title="site/site-config/shared-content.yaml"
logo:
  height: 2.8rem
banners:
  - id: preview-environment
    tone: warning
    title: Preview environment
    text: This sitewide notice appears on every page in the demo.
  - id: content-review
    tone: warning
    title: Content review
    text: Dismiss each notice independently with its close button.
footer:
  copyrightMessage: Shared Frame sitewide-content example.
  buildInfo: true
```

**Source:** The linked demonstration's complete shared configuration. It also
has a conventional `site/public/logo.svg` file. Page prose stays in each
`content.md`; repeated banners, footer content, and an optional logo-height
override belong here. Browse the
[maintained demonstration source](https://github.com/janga/norna/tree/main/examples/feature-demos/sitewide-content)
or read the
[site-wide content reference](/reference/configuration/shared-content/).

## Presets and palettes {#presets}

```card-list
flow: grid
size: s
items:
  - title: Portfolio
    text: Image-led work and visual collections.
    link: https://janga.github.io/norna/examples/feature-demos/theme-preset-portfolio/
  - title: Documentation
    text: Guides, reference material, and sustained reading.
    link: https://janga.github.io/norna/examples/feature-demos/theme-preset-documentation/
  - title: Project
    text: Product or project sites combining prose, code, cards, and images.
    link: https://janga.github.io/norna/examples/feature-demos/theme-preset-project/
  - title: Statement
    text: Concise editorial sites with spacious rhythm and prominent media.
    link: https://janga.github.io/norna/examples/feature-demos/theme-preset-statement/
```

```yaml title="site/root/tree-theme.yaml"
preset: documentation
```

**Source:** Shared theme configuration. A preset supplies coordinated defaults for
a typical scenario: typography, spacing, page width, media placement, colors,
corners, navigation, and structured blocks. It avoids asking the author to
design every relationship independently.

Override only a deliberate exception; all other values still come from the
preset:

```yaml title="site/root/tree-theme.yaml"
preset: documentation
layout:
  textWidth: normal
```

[Open the Theme explorer](https://janga.github.io/norna/examples/theme-presets/)
to switch presets while keeping its comparison content unchanged. Read the
[preset reference](/reference/configuration/presets/).

### Color palettes

This documentation site uses one palette across navigation, prose, controls,
semantic states, Light appearance, and Dark appearance. A palette changes that
coordinated color system without replacing the preset's typography or spacing.
This example selects the same palette with the `documentation` preset:

```yaml title="site/root/tree-theme.yaml"
preset: documentation
palette: clay-rose
```

**Source:** Shared theme configuration. Use the
[Theme explorer](https://janga.github.io/norna/examples/theme-presets/) to
combine the built-in presets and palettes, then inspect the generated
`root/tree-theme.yaml`. Read the
[palette and Appearance reference](/reference/configuration/palettes/).

## Reader display choices {#reader-display}

Open **Display** in this site's header. Reading width is always available;
Narrow, Standard, and Wide alter the reading measure without changing the
source. Appearance can follow the reader's system or use Light or Dark. Focus
reading removes persistent navigation, breadcrumbs, and the footer while
preserving access to the site through a compact menu.

```yaml title="site/root/tree-theme.yaml"
appearance:
  default: system
```

**Source:** Shared theme configuration plus reader-owned choices. The theme sets
the initial presentation. Appearance and reading width are always available;
tree navigation also provides Focus reading. The reader's selection is stored
only in that browser. Read the
[reader Display reference](/reference/reader/display/)
and
[client-side JavaScript contract](/reference/reader/accessibility/).

## Checks before publishing {#source-checks}

```sh title="Check the site's source files"
# Check configuration, then content
# Source files stay unchanged
norna check
```

In a generated site project, `npm run norna:check` runs the same checks without
the optional global launcher. To check only one part:

```sh title="Run a focused check"
# Check settings and themes
norna config:check

# Check Markdown, links, and images
norna content:check
```

- **Invalid setting:** `search: yes` in `site-config/settings.yaml` supplies text where Norna
  requires a boolean. Use `search: true` or `search: false`.
- **Missing image:** `image: portrait.svg` refers to a file that does not exist.
  Put the image in the page's `images/` directory or correct the filename.
- **Broken link:** `[Adopt](/adotp/)` points to a URL with no page. Correct it
  to `/adopt/` if that is the page's address.
- **Duplicate heading id:** two `## Contact` headings on one page both produce
  `contact`. Give them distinct headings or an explicit id, such as
  `## Contact {#press-contact}`.

Fix the reported source and run the check again. These checks do not visit
external websites or judge whether an image's alternative text is useful; review
those separately.

**Source:** Norna commands. Read the
[command reference](/reference/commands/invocation/#command-map)
for the complete check scope, the
[configuration reference](/reference/configuration/site/)
for accepted settings, the
[image reference](/reference/site/images/#source-files)
for file placement, and the
[content reference](/reference/commands/validate/)
for content errors and image synchronization.
