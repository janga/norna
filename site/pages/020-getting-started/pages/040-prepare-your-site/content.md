---
page:
  description: Add language, page descriptions, identity files, and content shared across a Norna site.
---

# Prepare Your Site

The page hierarchy and theme define most of a Norna site. Before publishing,
add the few details that identify the complete site, describe its pages to
browsers and sharing services, or appear consistently across pages. Every item
on this page is optional during an initial local preview.

## Set the site language {#language}

Add `language` beside the existing public URL in `site/config.yaml` when the
site is not written in English:

```yaml
url: https://example.com/
language: sv
```

Norna uses this value for the document language and its own interface labels.
The content remains in the language you write. Keep the generated example URL
while working locally; the publishing step replaces it with the real address.

See [Configuration](https://github.com/janga/norna/blob/main/docs/configuration.md#language)
for supported language tags and fallback rules.

## Describe each page {#descriptions}

A page's visible title comes from its H1. Add a concise description in the
same `content.md` when search engines and sharing services should also receive
a summary:

```md
---
page:
  description: Meet the dogs available for adoption from our shelter.
---

# Our Dogs
```

The description is metadata and is not repeated in the visible page. Write it
for the individual page rather than the whole site. The
[Content reference](https://github.com/janga/norna/blob/main/docs/content.md#page-title-and-frontmatter)
defines page metadata and its generated output.

## Add shared identity files {#identity}

Put optional identity files directly in `site/public/`. Norna discovers their
purpose from exact filenames, so no path setting is needed:

```text
site/public/
├── logo.svg          # Logo shown in site navigation
├── favicon.svg       # Icon used by browser tabs and bookmarks
└── social-image.jpg  # Preview image used when a page is shared
```

These are three independent examples, not three required files. The logo's
alternative text comes from the homepage H1. Norna can also discover other
supported file extensions and browser-icon variants.

See [Public Files](https://github.com/janga/norna/blob/main/docs/public-files.md)
for the exact filenames, uniqueness rules, generated metadata, and other files
that may be copied unchanged.

## Add a footer or temporary notice {#shared-content}

Page prose belongs in each page's `content.md`. Editorial content that must be
the same across the complete site belongs in the optional
`site/sitewide-content.yaml` file:

```yaml
footer:
  copyrightMessage: (c) Dog Shelter.
  buildInfo: true

banners:
  - id: temporary-closure
    title: Temporary closure
    text: The shelter is closed this Saturday.
```

The footer appears below every page. A banner is a compact, dismissible notice
above page content; it is not a page section. Banners can also be limited to a
date interval.

Use the
[site-wide content reference](https://github.com/janga/norna/blob/main/docs/sitewide-content.md)
for the complete fields, defaults, date behavior, and logo-height override.
The [site-wide elements demonstration](https://janga.github.io/norna/examples/feature-demos/sitewide-content/)
is useful when you need to inspect the rendered result before choosing an
element.

## Add site search {#search}

For a site with enough pages that navigation alone is no longer sufficient,
enable static search in `site/config.yaml`:

```yaml
search: true
```

Norna adds a Search button and builds an index from the finished page content.
The index needs no search service and follows the site's configured language
and public base path. Search itself uses JavaScript, but ordinary pages do not
load it.

See [Configuration](https://github.com/janga/norna/blob/main/docs/configuration.md#search)
for indexed content, generated paths, URL constraints, and local refresh
behavior.
