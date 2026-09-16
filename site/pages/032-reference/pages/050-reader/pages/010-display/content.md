---
page:
  description: Understand reader-controlled appearance, reading width, Focus reading and saved preferences.
---

# Display and preferences

The site's **Display** panel always offers Appearance and reading width. It
also offers **Focus reading** when navigation resolves to `tree`. These
choices adapt the site's presentation without editing its theme or changing
content order.

## Defaults and overrides

| Choice | Initial value | Reader choices |
| --- | --- | --- |
| Appearance | `appearance.default`, otherwise System | System, Light, Dark |
| Reading width | Resolved `layout.textWidth` | Narrow, Standard, Wide |
| Focus reading | Off | Off, On; available with tree navigation |

A saved reader choice wins over the site's default. **Reset** removes saved
choices and restores the configured defaults. For Appearance, System follows
the device's light/dark preference; it does not mean the site's own default.
See [Appearance](/reference/configuration/appearance/) for the author setting.

Narrow, Standard and Wide bound prose to approximately `60ch`, `72ch` and
`80ch`. The author value `normal` corresponds to the reader label Standard.
Managed images retain their separate width rules. Norna tries to preserve the
visible reading position when width or Focus reading changes, except at the
top of the page.

No theme switch removes these universal controls. Reader choices cannot
remove keyboard focus, reduce the engine's contrast baseline, reorder content
or hide the Display control needed to undo a choice.

## Focus reading

Focus reading hides persistent navigation rails, breadcrumbs and the footer.
The document keeps its selected prose width and reading axis. Site identity,
Display and a compact **Menu** remain available.

Menu opens the same page and section destinations as ordinary navigation in an
overlay, without resizing the document or moving the reading position.
Selecting a destination closes the overlay and follows its normal link.
Escape closes it and returns focus to the trigger.

The choice follows the reader across pages where it is available. It does not
change the source hierarchy or page URL. It requires JavaScript; without it,
normal navigation and the footer remain visible.

## Saved preferences

Norna writes first-party cookies when a reader chooses a value:

| Choice | Cookie | Values |
| --- | --- | --- |
| Appearance | `norna-appearance` | `system`, `light`, `dark` |
| Reading width | `norna-reading-width` | `narrow`, `standard`, `wide` |
| Focus reading | `norna-focus-reading` | `off`, `on` |

Each uses the configured base path, a one-year lifetime and `SameSite=Lax`;
HTTPS adds `Secure`. Invalid stored values fall back to the configured default.
Browser policy can prevent persistence. Path scoping is not isolation between
overlapping root and subpath sites: both can supply a cookie with the same
name. Reset expires the three cookies at the current site's path.

Without JavaScript, configured appearance and initial prose width still apply,
but Display choices cannot change or persist. Search uses separate
[temporary return-navigation storage](/reference/configuration/search/#return-from-search);
banner dismissal belongs to [shared content](/reference/configuration/shared-content/#banners).
