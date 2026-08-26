# `sitewide-content.yaml`

`site/sitewide-content.yaml` is optional. It contains editorial content and
optional logo display settings shared by every page: banners, footer, and an
optional navigation-logo height override.

The file contains plain YAML without Markdown frontmatter delimiters. Page
sections do not belong here; they remain in each page's `content.md`.

## Navigation Logo

A logo file is discovered from `site/public/`; no path or site name is
configured here. The logo links to the homepage, and its alternative text
comes from the homepage Markdown H1 in `site/pages/000-home/content.md`.

Add `logo` only to override the discovered file's displayed height:

```yaml
logo:
  height: 2.6rem
```

The logo width follows the file's intrinsic aspect ratio. See
[Public Files: Navigation Logo](public-files.md#navigation-logo) for exact
filenames, placement, portability, and validation rules.

The logo is a separate home link and does not have a section menu. In a
multi-page site, the homepage remains the first ordinary navigation item, uses
its Markdown H1 as its label, and exposes its sections in the same way as
pages. Page content and page themes cannot replace the shared logo setting.

## Banners

Use `banners` for short notices shown above page content on every page. List
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

`tone` currently supports `warning`. `visible` is optional. `from` is inclusive
and `until` is exclusive; both use `YYYY-MM-DD`, and either may be omitted.

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
  buildInfo: true
```

Set `buildInfo` to `true` to show the generated build date and time. Norna uses
the site's configured language, a compact format, and UTC. If both copyright
text and build information are absent, no footer is rendered.

See [Site Files](site-files.md) for where this optional file belongs in the
complete site model.
