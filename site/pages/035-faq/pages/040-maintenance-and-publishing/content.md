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

## How do I preserve old links after moving a page? {#preserve-old-page-urls}

Record the page's old site-relative URL before moving or renaming its directory.
After the move, add that URL to `page.aliases` in the same page's `content.md`:

```md
---
page:
  aliases:
    - /guides/install/
---

# Install Norna
```

The alias says: **This old URL permanently identifies this current page.** You
do not configure a separate target; the page containing `aliases` is the
target. Keep the alias if the page moves again, and never assign the old URL to
another page.

Run the complete check after editing:

```sh
npm run norna:check
```

Norna rejects collisions with pages, categories, public files, generated
routes, or other aliases. The alias is excluded from the sitemap.

How the redirect is delivered depends on the hosting service. Norna currently
integrates publishing with GitHub Pages only. GitHub Pages cannot turn a file in
the static artifact into an arbitrary HTTP `301`, so Norna publishes a small
redirect page with canonical metadata, automatic browser navigation, and a
normal link to the current page. Other hosting services may support native
permanent redirects, but Norna does not provide those publishing integrations
today.

See [Preserve old page URLs](https://github.com/janga/norna/blob/main/docs/pages.md#preserve-old-page-urls)
for path rules, base paths, subtree moves, and the exact hosting boundary.
