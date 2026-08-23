---
title: Identity
description: See how a convention-based logo and shared identity work across a Norna site.
navigation:
  label: Identity
---

## One identity across routes {#identity}

The logo in the navigation is discovered from `public/logo.svg`. Its alt text
and display height belong to `sitewide-content.yaml`, because the identity is
shared by every route.

If a site has no logo file, Norna shows the navigation label as text instead. A
route cannot replace the shared navigation identity.

## Navigation context {#navigation}

The route links come from the site's page structure. The shared logo returns to
Home, while the active route is indicated in the same navigation row.
