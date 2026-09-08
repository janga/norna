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
path for generated links, canonical and social sharing URLs, sitemap entries,
browser icons, and managed images, so there is no separate `basePath` setting.

Root-hosted site or custom domain:

```yaml
url: https://example.com/
```

GitHub Pages project site:

```yaml
url: https://owner.github.io/repository-name/
```

In the second example, Norna derives `/repository-name/` as the base path.
Root-relative Markdown links are prefixed when rendered. Canonical links,
social sharing metadata, and the generated sitemap use absolute URLs below that
path. See [Public Files](public-files.md) for social sharing images and the
generated sitemap.

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

## Edit Link

- Purpose: link each rendered page to its `content.md` source in a local editor,
  on a remote source host, or both.
- Type: an object containing `localEditor`, `baseUrl`, or both.
- Required: no.
- Default: no source link.
- Scope: site-wide.
- Values: `localEditor` currently accepts `vscode`. `baseUrl` accepts an
  absolute remote edit URL.
- Restrictions: `baseUrl` must use `http` or `https` and cannot contain
  credentials, a query string, or a fragment. An empty `editLink` object is
  invalid.

Use both settings when authors should be able to open the source directly in
VS Code during same-computer development and use the repository link elsewhere:

```yaml
url: https://example.com/
editLink:
  localEditor: vscode
  baseUrl: https://github.com/owner/repository/edit/main/
```

Norna chooses the destination from the request and build context:

| Context | Destination |
| --- | --- |
| Development preview opened through `localhost` or another loopback address | `localEditor` when configured; otherwise `baseUrl` |
| Development preview opened through a LAN hostname or address | `baseUrl` when configured; otherwise no link |
| Static or production build | `baseUrl` when configured; otherwise no link |

The loopback restriction matters because only a browser running on the same
computer can use an absolute local source path reliably. A LAN visitor may be
viewing a server whose filesystem is not available on their device.

### Local Editor

Use `localEditor: vscode` to show **Open in VS Code** after each page in a
same-computer development preview:

```yaml
editLink:
  localEditor: vscode
```

VS Code must be installed and registered for `vscode://` links. The browser may
ask for confirmation before it opens the application. Norna emits the editor
URL only while serving a loopback development request; static output never
contains the absolute local path.

### Remote Source Host

The base URL identifies the source host, repository, branch, and any repository
subdirectory that comes before the Norna project. Norna appends the current
page's project-relative `content.md` path:

```yaml
url: https://example.com/
editLink:
  baseUrl: https://github.com/owner/repository/edit/main/
```

For a Norna project in `packages/docs/` on a branch named `release-2`, use:

```yaml
editLink:
  baseUrl: https://github.com/owner/repository/edit/release-2/packages/docs/
```

The generated target for a nested page can then be:

```text
https://github.com/owner/repository/edit/release-2/packages/docs/site/pages/010-guides/pages/020-deploy/content.md
```

This follows the page model rather than inspecting Git. Moving a page through
Norna therefore changes its generated source link, shallow clones do not affect
the result, and a non-default branch works when it is part of `baseUrl`.

The remote link is shown in published builds and LAN previews. It is also the
fallback for a loopback preview when `localEditor` is omitted. Norna does not
check whether the source host permits the visitor to edit the file;
authentication and permissions remain the source host's responsibility.

Omit `editLink` when the site should expose no source destination. Omit only
`baseUrl` when a private source should be available in the local editor but not
linked from the published site.

## `navigation`

`navigation` contains site-wide settings for generated navigation. These
settings do not change the page hierarchy or heading structure. They control
how Norna presents that discovered structure.

### `navigation.mode`

`navigation.mode` selects the site-wide navigation policy. The default policy
uses one stable desktop navigation model for the complete site.

| Value | Effect | Structural constraint |
| --- | --- | --- |
| `automatic` | Use `sections` for a one-page site, `top` for a flat multi-page site, and `tree` throughout a site with listed child pages or categories. | None beyond the effective mode's own requirements. |
| `sections` | Keep the single page's H1 destination and H2 sections in sticky page navigation. | The listed site structure must fit the single-page model. |
| `top` | Present Home and top-level pages in the global row, with page and section menus where needed. | A listed navigation category is invalid. |
| `tree` | Combine global top-level areas with a left page/category rail and, on sufficiently structured pages, a separate right H2/H3 contents rail. | No additional hierarchy limit. |

The field is optional. Its default is `automatic`.

```yaml
url: https://example.com/
navigation:
  mode: automatic
```

Navigation policy is technical and site-wide. It cannot be configured in
`theme.yaml` or in an individual page. In `automatic`, any listed child page
or category gives every ordinary desktop page the same left-rail frame. The
rail shows only the active top-level area, so destinations already available
in global navigation are not repeated. On Home and an independent top-level
page, it provides local page and section context instead of moving that
information below the sticky header. A listed navigation category requires
`tree`, so explicit `sections` or `top` is invalid when a category exists. This
prevents a category with no URL from being presented as an ordinary page link.
See [Pages and Categories](pages.md#navigation) for the exact automatic
selection rules and the relationship between Home, pages, categories, and
headings, and
[Client-Side JavaScript](client-javascript.md) for the no-JavaScript fallback.

## Search

- Purpose: generate site-wide search from the completed static pages.
- Type: boolean.
- Required: no.
- Default: `false`.

Enable search with one site-wide setting:

```yaml
url: https://example.com/
search: true
```

Each build then generates `/search/` and a Pagefind index under
`dist/pagefind/`. Norna adds a search button to the site header. The search
page uses the configured language and visual theme, and result URLs include
the base path derived from `url`.

Norna indexes the rendered editorial content rather than the Markdown source.
Page titles, H2 sections, H3 subsections, prose, captions, notes, and structured
content therefore become searchable as they appear in the finished site.
Navigation, banners, the footer, page-sequence links, source edit links, the
404 page, redirect aliases, and the search page itself are excluded. Matching
sections can appear as links to their heading anchors.

Search is static: no search server or hosted service is required. Ordinary
pages still load no search JavaScript. The generated `/search/` page loads the
Pagefind interface and index only after a visitor opens it. Without JavaScript,
the site's normal page navigation remains available.

During local work, run `norna build:local` after searchable content changes.
It rebuilds the final HTML and index, then restarts local preview. A plain
`norna dev` can serve the most recently built index but does not regenerate it.
Published builds always generate a fresh index.

When search is enabled, `/search/` and `pagefind/` are generated locations. A
source page, alias, or public file cannot use the same public destination.
Norna uses [Pagefind](https://pagefind.app/) as its post-build indexer.

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
editLink:
  localEditor: vscode
  baseUrl: https://github.com/owner/repository/edit/main/
navigation:
  mode: automatic
search: true
scrollBehavior: instant
```

Run `npm run norna:config:check` after changing the file.

## Publishing Discovery

The GitHub repository, default deployment branch, and deploy workflow are not
deployment fields in `config.yaml`. An optional `editLink.baseUrl` only creates
links to a source host's editing interface; it does not configure publishing.

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
