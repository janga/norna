# Sitewide Content

`site/sitewide-content.md` contains content and settings shared by the whole site. It
is separate from `content.md`, which defines the homepage, and from
`config.mjs`, which defines technical behaviour.

## Banners

Use `banners` for short notices shown above the page content on every route.
The list order controls the presentation order. Each banner needs a unique
`id`, a title and text:

```yaml
---
banners:
  - id: project-status
    tone: warning
    visible:
      from: "2026-08-01"
      until: "2026-09-01"
    title: Experimental code
    text: Not for production use.
---
```

`visible` uses the same date-window rules as temporary sections. Visitors can
dismiss individual active banners. The dismissal is stored locally in the
browser and is tied to the banner content, so an edited banner can appear
again.

The first version supports the `warning` tone. Keep banner text short; banners
are presented as compact single-line notices and may use an ellipsis when the
text does not fit.

## Footer

The footer is also sitewide content. `copyrightMessage` adds a copyright or
license sentence. `buildInfo` optionally adds a generated build timestamp:

```yaml
footer:
  copyrightMessage: (c) Example Artist.
  buildInfo:
    enabled: true
    text: Built
    dateTimeFormat:
      locale: en-GB
      timeZone: UTC
      dateStyle: short
      timeStyle: short
```

If both the copyright message and enabled build information are absent, the
footer is not rendered.
