# `sitewide-content.yaml`

`site/sitewide-content.yaml` is optional. It contains banners, footer content,
and optional navigation-logo display settings shared by every page.

The file contains plain YAML without Markdown frontmatter delimiters. Page
sections do not belong here; they remain in each page's `content.md`.

## Navigation Logo

A logo file is discovered from `site/public/`; no path or site name is
configured here. The logo links to the homepage, and its alternative text
comes from the homepage Markdown H1 in `site/pages/000-home/content.md`.

Add `logo` only to override the discovered file's displayed height:

```yaml
logo:
  height: 2rem
```

When `logo` is omitted, Norna uses `2.6rem` on wider screens and caps the logo
at `2.15rem` on narrow screens. The narrow-screen cap also applies to a custom
height. The logo width follows the file's intrinsic aspect ratio. See
[Public Files: Navigation Logo](public-files.md#navigation-logo) for exact
filenames, placement, portability, and validation rules.

The logo is a separate home link and does not have a section menu. In a
multi-page site, the homepage remains the first ordinary navigation item, uses
its Markdown H1 as its label, and exposes its sections in the same way as
pages. Page content and page themes cannot replace the shared logo setting.

## Banners

Use `banners` for short temporary notices shown above page content on every
page. List order controls presentation order:

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

Banner fields are:

| Field | Required | Effect | When omitted |
| --- | --- | --- | --- |
| `id` | Yes | Stable identifier used for dismissal state. It must match `^[a-z0-9-]+$`, and ids must be unique in the file. | No default. |
| `title` | Yes | Short heading inside the notice. | No default. |
| `text` | Yes | Concise explanatory text. | No default. |
| `tone` | No | Semantic treatment for the notice. The only current value is `warning`. | `warning` |
| `visible` | No | Optional date interval for including the banner in generated pages. | Always include the banner. |

Inside `visible`, `from` is the first included date and `until` is the first
excluded date. Both use `YYYY-MM-DD`, and either may be omitted. Norna compares
the dates with the current UTC date when the page is generated. A published
static site therefore needs another build before a later visibility boundary
changes its output. When both dates are present, `until` must be later than
`from`.

Visitors can dismiss each active banner. Norna stores that choice in browser
`localStorage`, scoped by the banner id and its current content. The same notice
stays dismissed in that browser, while changing its title, text, tone, or date
interval gives it new dismissal state and makes it visible again. If JavaScript
or browser storage is unavailable, the banner remains visible and readable.

Keep banners concise. They are compact one-line notices and may use an ellipsis
when space is limited. See [Client-Side JavaScript](client-javascript.md) for
the enhancement boundary.

## Footer

The footer can contain copyright or ownership text and optional generated build
information:

```yaml
footer:
  copyrightMessage: (c) Example Owner.
  buildInfo: true
```

Footer fields are:

| Field | Required | Effect | When omitted |
| --- | --- | --- | --- |
| `copyrightMessage` | No | Copyright or ownership text shown in the shared footer. | Show no ownership text. |
| `buildInfo` | No | When `true`, show the generated build date and time. | `false` |

Build information uses the site's configured language, a compact date and time
format, and UTC. If both copyright text and build information are absent, no
footer is rendered.

See [Site Files](site-files.md) for where this optional file belongs in the
complete site model.
