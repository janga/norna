---
page:
  description:
    Answers about local preview problems and preserving published URLs when pages move.
---

# Maintenance and publishing

## How do I refresh a stale local preview? {#stale-preview}

First save the source file and check that the tracked server is still running:

```sh
npm run norna:dev:status
```

If content or generated images still look stale, run the complete local rebuild:

```sh
npm run norna:build:local
```

This checks and builds the site, then restarts its development server. Use
`npm run norna:dev:logs` when the restart reports an error. The
[local-development reference](https://github.com/janga/norna/blob/main/docs/local-development.md)
documents server status, logs, LAN testing, and cleanup.

## How do I move a page without breaking links? {#preserve-old-page-urls}

Give `page:move` the old and new site-relative URLs:

```sh
npm exec -- norna page:move /guides/install/ /reference/install/
```

This is a dry run. Review the listed directory move, link updates, and old URL
aliases. Apply the plan by repeating it with `--write`:

```sh
npm exec -- norna page:move /guides/install/ /reference/install/ --write
```

If you already moved the directory by hand, run the same command. Norna sees
that only the new URL exists and reconciles internal references and aliases
without moving it again. A moved subtree includes its descendant pages.

An alias says: **This old URL permanently identifies this current page.** The
page containing the alias is its target. Keep the alias if the page moves
again, and never assign the old URL to another page. Use `--no-aliases` only
when old public URLs should deliberately stop working.

Norna rejects collisions with pages, categories, public files, generated
routes, or other aliases. Aliases are excluded from the sitemap.

How the redirect is delivered depends on the hosting service. Norna currently
integrates publishing with GitHub Pages only. GitHub Pages cannot turn a file in
the static artifact into an arbitrary HTTP `301`, so Norna publishes a small
redirect page with canonical metadata, automatic browser navigation, and a
normal link to the current page. Other hosting services may support native
permanent redirects, but Norna does not provide those publishing integrations
today.

See [Move or reconcile a page](https://github.com/janga/norna/blob/main/docs/pages.md#move-or-reconcile-a-page)
for ordering, link formats, subtree rules, and failure handling. See
[Preserve old page URLs](https://github.com/janga/norna/blob/main/docs/pages.md#preserve-old-page-urls)
for alias paths, collisions, base paths, and the exact hosting boundary.
