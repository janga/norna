---
title: Notices
description: Inspect Norna's shared banner stack, visibility and dismissal behaviour.
navigation:
  label: Notices
---

## Banner stack {#banner-stack}

The two notices above the page content are defined in `sitewide-content.yaml`.
List order controls their order, and each notice keeps its own identity.

## Dismissal {#dismissal}

Use the close button to dismiss either banner. The choice is stored locally in
the browser and applies on every route. Changing a banner's content gives it a
new dismissal key, allowing an updated notice to appear again.

## Visibility {#visibility}

A banner can optionally have `from` and `until` dates. Norna filters the stack
before rendering, using the same date-window rules as temporary sections.
