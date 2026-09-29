---
page:
  description: Set the site's default light or dark appearance and see when a reader's choice overrides it.
---

# Appearance

`appearance.default` sets the appearance used when the reader has not made
their own choice in **Display**, the site's viewing-settings panel.

## Site default

Set the default in `site/root/tree-theme.yaml`. The highlighted line accepts `system`,
`light`, or `dark`:

```yaml title="site/root/tree-theme.yaml" {2}
appearance:
  default: system
```

- `system`: follow the device's light/dark preference, as reported by the browser.
- `light`: use light appearance.
- `dark`: use dark appearance.

Omitting `appearance` uses `system`. If you include `appearance`, supply
`default` as shown above.

Set a shared initial value in `root/tree-theme.yaml`, or override it in a
branch's `tree-theme.yaml` or a single page's `page-theme.yaml`. Reader choices
still take precedence when navigating between differently themed pages.

## Reader's choice

If the reader chooses `dark` or `light`, that choice applies. If they choose
`system`, their device's preference applies. Otherwise, the site default applies.

Appearance is always available in Display. Norna remembers the reader's choice
in a cookie for up to one year, if the browser allows it.

Changing `appearance.default` does not replace a saved choice. To see the site
default again, select **Reset** in Display. Reset also resets reading width
and Focus reading, which hides persistent navigation.

## Without JavaScript

The site default applies, including the device preference for `system`.
Reader choices in Display and the saved-choice cookie require JavaScript.
