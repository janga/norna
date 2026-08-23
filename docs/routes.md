# Routes

`site/content.md` is the homepage and builds to `/`. Optional route pages live
under `site/routes/<NNN-route-id>/content.md` and build to first-level
URLs.

Routes use the same page frontmatter, Norna-managed blocks, and Markdown
section model as the homepage. See [Content](content.md) for the page and
section model.

Route directories can contain route content, route-local images, and
an optional route-local `theme.yaml`. The route theme replaces the root visual
theme for that route and can select any complete top-level theme preset. Route
directories cannot contain `config.yaml` or `sitewide-content.yaml`; technical
configuration and shared logo, banner, and footer settings remain at the
selected site's top level.

## Route Directory Format

Route directories must use:

```text
NNN-route-id
```

`NNN` is a three-digit presentation order from `001` through `999`.
`route-id` becomes the route identity and URL segment.

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

The route id may contain only lowercase `a-z`, numbers, and single hyphens
between alphanumeric groups. The numeric prefix is not part of the route id or
URL.

Renaming `030-contact/` to `015-contact/` changes navigation order but keeps
the route id `contact` and URL `/contact/`.

## Route File

Add a first-level route by creating:

```text
site/routes/010-about/content.md
```

Minimal route page:

```md
---
page:
  title: About
  description: About this site.
---

## Intro {#intro}

Text...
```

The example above builds to `/about/`.

## Navigation

Route navigation uses `page.title` as its visible label and the route-directory
prefix as its order. In a multi-page site, the homepage is the first navigation
item and uses its own `page.title`. An optional logo is a separate home link;
it does not replace the homepage item or own a section menu.

`navigation` has one optional field:

- `listed`: boolean. Defaults to `true`. Set it to `false` to keep the route
  public while excluding it from site navigation.

```yaml
navigation:
  listed: false
```

Route order comes from the directory prefix.
The homepage is always listed before routes.

Current route navigation is intended for small sites. This guidance may change
as route support matures, but the present model is:

- A single-page site should normally use only page navigation between sections.
- A small multi-page site may use site navigation between routes plus page
  navigation between sections on the current page.
- If a site needs many routes, deeply nested routes, or several navigation
  levels, it has probably outgrown the current sticky-navigation model and may
  need a different site structure or navigation system.

## Route Images

Route images live under the physical route directory:

```text
site/routes/010-about/images/intro/image.jpg
```

Image references in route content still use only the filename:

````md
```norna-image-stack
- image: image.jpg
  alt: Intro image.
```
````

The image directory segment after `images/` should match the section id.
If the section id or route folder changes, run `norna content:check` to find
misplaced images and `norna content:sync` to move unambiguous files into the
expected section folder. `content:sync` can move images between route image
roots when the filename is unambiguous across the site and the move will not
break another reference; these cross-route writes require a clean Git working
tree.
