# `sitewide-content.yaml`

`site/sitewide-content.yaml` is optional. It contains editorial content and
identity shared by every page: the navigation label, banners, and footer.

The file contains plain YAML without Markdown frontmatter delimiters. Page
sections do not belong here; they remain in each page's `content.md`.

## Navigation Identity

Use the optional `navigation` object for identity shared by the homepage and
all routes:

```yaml
navigation:
  label: Example Site
```

Without a navigation logo, `label` is shown in the home link. With a logo,
`label` becomes the image alternative text. If omitted, Norna uses the homepage
title from `site/content.md`.

A logo file is discovered from `site/public/`; no path is configured here. Add
`logo` only to override its displayed height:

```yaml
navigation:
  label: Example Site
  logo:
    height: 2.6rem
```

The logo width follows the file's intrinsic aspect ratio. See
[Public Files: Navigation Logo](public-files.md#navigation-logo) for exact
filenames, placement, portability, and validation rules.

Routes inherit this identity and cannot replace it in route content or a route
theme.

## Banners

Use `banners` for short notices shown above page content on every route. List
order controls presentation order. Each banner needs a unique lowercase `id`,
a title, and text:

```yaml
banners:
  - id: project-status
    tone: warning
    visible:
      from: "2026-08-01"
      until: "2026-09-01"
    title: Experimental code
    text: Not for production use.
```

`tone` currently supports `warning`. `visible` is optional and uses the same
date-window rules as temporary sections: `from` is inclusive and `until` is
exclusive.

Visitors can dismiss each active banner. Dismissal state is stored locally in
the browser and tied to the banner content, so an edited banner can appear
again. Keep banners concise; they are rendered as compact one-line notices and
may use an ellipsis when space is limited.

## Footer

The footer can contain copyright or ownership text and optional generated build
information:

```yaml
footer:
  copyrightMessage: (c) Example Owner.
  buildInfo:
    enabled: true
    text: Built
    dateTimeFormat:
      locale: en-GB
      timeZone: UTC
      dateStyle: short
      timeStyle: short
```

`dateTimeFormat` uses `Intl.DateTimeFormat` values. `timeZone` must be a valid
IANA time-zone name. If both copyright text and enabled build information are
absent, no footer is rendered.

See [Site Files](site-files.md) for where this optional file belongs in the
complete site model.
