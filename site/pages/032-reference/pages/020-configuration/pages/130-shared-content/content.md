---
page:
  description: Configure shared logo height, timed notices and footer text in sitewide-content.yaml.
---

# Shared site content

Optional `site/sitewide-content.yaml` contains logo display settings, notices
and footer text shared by every page. It is plain YAML, not frontmatter.
Page text remains in `content.md`.

## Logo

Place one supported [logo file](/reference/site/public-files/#recognized-files)
in `public/`. Norna discovers it automatically; this setting only changes its
height:

```yaml title="site/sitewide-content.yaml"
logo:
  height: 2rem
```

The default is 2.6rem on wider screens, capped at 2.15rem on narrow screens.
The narrow cap also applies to custom heights. Width follows the image ratio.
Height uses the [layout length syntax](/reference/configuration/layout/#length-syntax).
Configuring `logo` without a logo file is an error.

The logo links to Home and uses Home's H1 for alternative text. It has no
section disclosure; Home remains an ordinary navigation item as well.

## Banners

```yaml title="site/sitewide-content.yaml: a temporary notice"
banners:
  - id: maintenance
    title: Scheduled maintenance
    text: Publishing is paused during the maintenance window.
    tone: warning
    visible:
      from: "2026-10-01"
      until: "2026-10-03"
```

| Field | Accepted value | Omitted |
| --- | --- | --- |
| `id` | Required unique lowercase letters, digits and hyphens | Error |
| `title` | Required nonempty heading | Error |
| `text` | Required nonempty message | Error |
| `tone` | Only `warning` currently | `warning` |
| `visible` | `from`, `until` or both, real `YYYY-MM-DD` dates | Always included |

List order is display order. `from` includes that UTC date; `until` excludes
that date and must be later than `from` when both exist. Dates are evaluated
when generating the page: a static deployment needs rebuilding to cross a
visibility boundary.

Readers can dismiss banners with JavaScript. Browser local storage keys the
choice by notice ID and current content; changing title, text, tone or date
interval makes the new notice visible. Without JavaScript or storage the
message remains readable. Keep notices short; compact presentation may truncate
long text with an ellipsis.

## Footer

```yaml title="site/sitewide-content.yaml"
footer:
  copyrightMessage: (c) Example Owner.
  buildInfo: true
```

`copyrightMessage` is optional nonempty text. `buildInfo` is a boolean,
defaulting to `false`; it adds the generated build date/time in UTC using the
site language. With neither text nor build information, no footer is rendered.
