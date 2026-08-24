# Pages

`site/content.md` is the homepage and builds to `/`. Optional additional pages live
under `site/pages/<NNN-page-id>/content.md` and build to first-level
URLs.

Pages use the same H1 title, optional frontmatter, Norna-managed blocks, and
Markdown section model as the homepage. See [Content](content.md) for the page
and section model.

Page directories can contain page content, page-local images, and
an optional page-local `theme.yaml`. The page theme replaces the root visual
theme for that page and can select any complete top-level theme preset. Page
directories cannot contain `config.yaml` or `sitewide-content.yaml`; technical
configuration and shared logo, banner, and footer settings remain at the
selected site's top level.

## Page Directory Format

Page directories must use:

```text
NNN-page-id
```

`NNN` is a three-digit presentation order from `001` through `999`.
`page-id` becomes the page id and URL segment.

Valid examples:

```text
010-getting-started
020-concepts
120-api-reference
```

Invalid examples:

```text
10-about
000-home
010_About
010-About
010-about-
010-about--team
```

The page id may contain only lowercase `a-z`, numbers, and single hyphens
between alphanumeric groups. The numeric prefix is not part of the page id or
URL.

Renaming `030-contact/` to `015-contact/` changes navigation order but keeps
the page id `contact` and URL `/contact/`.

## Page File

Add a first-level page by creating:

```text
site/pages/010-about/content.md
```

Minimal additional page:

```md
---
page:
  description: About this site.
---

# About

Introductory text.

## Team {#team}

Text...
```

The example above builds to `/about/`.

## Navigation

Site navigation uses each page's Markdown H1 as its visible label and the
page-directory prefix as its order. In a multi-page site, the homepage is the
first navigation item and uses its own H1. An optional logo is a separate home
link; it does not replace the homepage item or own a section menu.

`navigation` has one optional field:

- `listed`: boolean. Defaults to `true`. Set it to `false` to keep the page
  public while excluding it from site navigation.

```yaml
navigation:
  listed: false
```

Page order comes from the directory prefix.
The homepage is always listed before additional pages.

Current site navigation is intended for small sites. This guidance may change
as navigation support matures, but the present model is:

- A single-page site should normally use only section navigation.
- A small multi-page site may use site navigation between pages plus section
  navigation on the current page.
- If a site needs many pages, deeply nested pages, or several navigation
  levels, it has probably outgrown the current sticky-navigation model and may
  need a different site structure or navigation system.

## Page Images

Page images live under the physical page directory:

```text
site/pages/010-about/images/image.jpg
```

Image references in page content still use only the filename:

````md
```norna-image-stack
- image: image.jpg
  alt: Intro image.
```
````

All managed images used by the page share this one `images/` directory. Run
`norna content:check` to find missing or misplaced images and
`norna content:sync` to move unambiguous files into the expected page image
root. `content:sync` can move images between page image roots when the filename
is unambiguous across the site and the move will not break another reference;
these cross-page writes require a clean Git working tree.
