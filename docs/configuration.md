# `config.yaml`

Technical site configuration lives in the selected site's `config.yaml`; by
default that is `site/config.yaml`. The file is required and contains plain
YAML without Markdown frontmatter delimiters.

A normal configuration needs only the public URL:

```yaml
url: https://example.com/
```

Norna deliberately keeps this file small. Visual choices belong in
[`theme.yaml`](theme.md); shared banners, footer content, and logo display
settings belong in [`sitewide-content.yaml`](sitewide-content.md); page content
belongs in [`pages/*/content.md`](content.md).

## `url`

- Purpose: canonical public URL and source of the site's deployment path.
- Type: absolute `http` or `https` URL.
- Required: yes.
- Default: none.
- Restrictions: no query string, fragment, or repeated slash in the URL path.

Norna adds a trailing slash when omitted. The URL pathname becomes the base
path for generated links, browser icons, and managed images, so there is no
separate `basePath` setting.

Root-hosted site or custom domain:

```yaml
url: https://example.com/
```

GitHub Pages project site:

```yaml
url: https://owner.github.io/repository-name/
```

In the second example, Norna derives `/repository-name/` as the base path.
Root-relative Markdown links are prefixed when rendered.

## `language`

- Purpose: language tag on the root `<html lang="...">` element and selection
  of Norna's built-in interface text.
- Type: `en`, `sv`, or a regional tag such as `en-GB` or `sv-SE`.
- Required: no.
- Default: `en`.

Norna includes interface text for English and Swedish. Regional tags use the
language identified by their primary subtag. An unsupported language is an
error because silently rendering English controls on another-language page
would be misleading.

Interface labels are part of the engine and are not configured individually.
Editorial text remains in page content and `sitewide-content.yaml`.

## `navigation`

`navigation.mode` selects one navigation model for the whole site. It does not
change the page hierarchy or heading structure; it controls how Norna presents
that discovered structure.

| Value | Effect | Structural constraint |
| --- | --- | --- |
| `automatic` | Select `sections`, `top`, or `tree` from the listed pages, categories, and navigable headings. | None beyond the selected mode's own requirements. |
| `sections` | Keep the single page's H1 destination and H2 sections in sticky page navigation. | The listed site structure must fit the single-page model. |
| `top` | Present Home and top-level pages in the global row, with shallow page and section menus where needed. | A listed navigation category or deeper page/heading path is invalid. |
| `tree` | Combine global top-level areas with a local page/category hierarchy and current-page headings. | No additional hierarchy limit. |

The field is optional. Its default is `automatic`.

```yaml
url: https://example.com/
navigation:
  mode: automatic
```

Navigation behavior is technical and site-wide. It cannot be configured in
`theme.yaml` or in an individual page. A listed navigation category requires
`tree`: `automatic` selects it, while explicit `sections` or `top` is invalid.
This prevents a category with no URL from being presented as an ordinary page
link. See [Pages and Categories](pages.md#navigation) for the exact automatic
selection rules and the relationship between Home, pages, categories, and
headings, and
[Client-Side JavaScript](client-javascript.md) for the no-JavaScript fallback.

## `scrollBehavior`

`scrollBehavior` controls same-page anchor movement. It does not affect links
that load another page.

| Value | Effect |
| --- | --- |
| `instant` | Move immediately to the target. This is the default. |
| `smooth` | Ask the browser to animate the movement with native smooth scrolling. |

Example using the browser's native smooth scrolling:

```yaml
url: https://example.com/
scrollBehavior: smooth
```

The field is optional. Norna does not add a scripted scrolling implementation.
Visitors whose system requests reduced motion always get immediate anchor
movement.

## Complete Example

```yaml
url: https://example.com/
language: en-GB
navigation:
  mode: automatic
scrollBehavior: instant
```

Run `npm run norna:config:check` after changing the file.

## Publishing Discovery

GitHub repository, default branch, and deploy workflow are not fields in
`config.yaml`.

`npm run norna:deploy` discovers the current GitHub repository and default
branch through the authenticated GitHub CLI. Norna's included workflow file is
`.github/workflows/deploy.yml`. `npm run norna:deploy:watch -- <options>`
accepts command-line overrides when a one-off run needs different operational
values.

See [Publishing](publishing.md) for the complete workflow.

## Site Directory Selection

The site directory is not configured in `config.yaml`.

The cross-platform command-line form is:

```sh
npm exec -- norna --site-dir presentation build
```

Commands also honor the `NORNA_SITE_DIR` environment variable. The syntax for
setting an environment variable for one command depends on the shell and
operating system.

If `NORNA_SITE_DIR` is set to an empty value, commands fail. Relative site
directories are resolved by walking upward from the invocation directory until
the selected directory contains `config.yaml` and
`pages/000-home/content.md`.

Without an explicit selection, the current directory itself can be the site
directory when it contains those two files. Otherwise Norna walks upward for a
default `site/` directory containing them.

See [Site Files](site-files.md) for the complete source and generated layout.
