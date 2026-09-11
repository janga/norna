# `config.yaml`

Use the selected site's `config.yaml` for technical choices that apply to the
complete site. The default location is `site/config.yaml`. The file is required
and contains plain YAML without Markdown frontmatter delimiters.

A normal configuration needs only the public URL:

```yaml
url: https://example.com/
```

The remaining settings are optional:

| Setting | Decision | Default when omitted |
| --- | --- | --- |
| `language` | Which language identifies the site and supplies Norna's interface text | `en` |
| `editLink` | Whether a rendered page links to its source | No source link |
| `navigation.mode` | How Norna presents the discovered page and heading hierarchy | `automatic` |
| `search` | Whether the build creates static site search | `false` |
| `scrollBehavior` | Whether same-page anchor movement is immediate or browser-animated | `instant` |

Norna deliberately keeps this file small. Visual choices belong in
[`theme.yaml`](theme.md); shared banners, footer content, and logo display
settings belong in [`sitewide-content.yaml`](sitewide-content.md); page content
belongs in [`pages/*/content.md`](content.md).

## `url`

Set `url` to the final public address of the built site. Norna derives every
public path from it; the setting does not select a local development host or
port.

- Purpose: canonical public URL and source of the site's deployment path.
- Type: absolute `http` or `https` URL.
- Required: yes.
- Default: none.
- Scope: site-wide.
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

Set `language` to the language used by the site's editorial content. Norna
uses that choice to identify the generated HTML and to select its own interface
text. It does not translate content written by the author.

For a site written in Swedish:

```yaml
url: https://example.com/
language: sv
```

- Purpose: identify the site language and select one complete built-in Norna
  interface pack.
- Type: one supported primary language or required language-and-script tag,
  optionally followed by a region such as `en-GB` or `pt-BR`.
- Required: no.
- Default: `en`.
- Scope: site-wide and single-language.

### What The Setting Changes

`language` controls:

- the complete language tag on the root `<html>` element;
- Norna-owned labels in navigation, controls, notes, callouts, error pages,
  and other generated interface elements;
- locale-sensitive values such as a generated build date;
- the language and labels used by the optional Pagefind search interface.

It does not translate page Markdown, captions, banners, footer text, or other
editorial content. Those remain exactly as the author writes them.

### Choose A Language Tag

Use a primary language tag for the normal case:

```yaml
language: es
```

Use a regional tag only when the full tag should appear in the HTML or regional
formatting should differ:

```yaml
language: pt-BR
```

Norna preserves `pt-BR` as `<html lang="pt-BR">`, uses it for
locale-sensitive formatting, and selects the Portuguese interface pack from
`pt`. Two-letter and three-digit BCP 47 region subtags are accepted for every
supported language and script form.

Two languages require an explicit script in the current interface set:

- use `sr-Cyrl` or `sr-Latn` for Serbian because `sr` alone does not select a
  writing system;
- use `az-Latn` for Azerbaijani because Norna currently supplies only the
  Latin-script interface.

An unsupported language or script stops configuration validation and lists
the available alternatives.

### Supported Languages

The following primary values select complete built-in Norna interface packs.
They cover left-to-right Latin, Greek, and Cyrillic writing systems that can
use ordinary system-font fallback; no Norna-provided font file is required.

| Language | Primary value |
| --- | --- |
| Albanian | `sq` |
| Azerbaijani, Latin | `az-Latn` |
| Belarusian | `be` |
| Bosnian | `bs` |
| Bulgarian | `bg` |
| Catalan | `ca` |
| Croatian | `hr` |
| Czech | `cs` |
| Danish | `da` |
| Dutch | `nl` |
| English | `en` |
| Estonian | `et` |
| Filipino | `fil` |
| Finnish | `fi` |
| French | `fr` |
| German | `de` |
| Greek | `el` |
| Hausa | `ha` |
| Hungarian | `hu` |
| Icelandic | `is` |
| Indonesian | `id` |
| Irish | `ga` |
| Italian | `it` |
| Javanese | `jv` |
| Latvian | `lv` |
| Lithuanian | `lt` |
| Luxembourgish | `lb` |
| Macedonian | `mk` |
| Maltese | `mt` |
| Montenegrin | `cnr` |
| Nigerian Pidgin | `pcm` |
| Norwegian Bokmål | `nb` |
| Norwegian Nynorsk | `nn` |
| Polish | `pl` |
| Portuguese | `pt` |
| Romanian | `ro` |
| Russian | `ru` |
| Serbian, Cyrillic | `sr-Cyrl` |
| Serbian, Latin | `sr-Latn` |
| Slovak | `sk` |
| Slovenian | `sl` |
| Spanish | `es` |
| Swahili | `sw` |
| Swedish | `sv` |
| Turkish | `tr` |
| Ukrainian | `uk` |
| Vietnamese | `vi` |

### Search And Translation Boundaries

Search remains available for every accepted language. Pagefind provides
language-specific stemming for its own supported languages; other Norna
language packs receive translated search controls but use Pagefind's generic
indexing behavior. See
[Pagefind multilingual search](https://pagefind.app/docs/multilingual/) for
that search-engine boundary.

Interface labels are part of the engine and are not configured individually.
Editorial text remains in page content and `sitewide-content.yaml`.

This is a single-language site setting. It does not create translated routes,
a language selector, fallback content, or `hreflang` metadata.

## Edit Link

Add `editLink` when a rendered page should give an author a direct route to its
`content.md` source. The setting chooses link destinations; it does not grant
repository access or configure publication.

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

Norna discovers two related structures from the site files:

- page and category directories determine URLs and the hierarchy between
  pages;
- each page's H1 names that page, while its H2 and H3 headings form the page
  outline.

`navigation.mode` chooses how Norna presents those structures. It does not add,
remove, or move pages and it does not change heading levels. H2 and H3 headings
alone never make a site hierarchical.

### `navigation.mode`

Use `automatic` unless the site has a deliberate reason to keep a particular
navigation presentation as its structure changes. Omitting `navigation`
entirely has the same effect.

```yaml
url: https://example.com/
navigation:
  mode: automatic
```

- Purpose: select one navigation presentation for the complete site.
- Type: one of `automatic`, `sections`, `top`, or `tree`.
- Required: no.
- Default: `automatic`.
- Scope: site-wide; page files and `theme.yaml` cannot override it.

With `automatic`, the listed page hierarchy decides the effective mode:

| Listed site structure | Effective mode | Result on a wide screen |
| --- | --- | --- |
| Home is the only page | `sections` | The page title and its H2 sections remain in sticky page navigation. |
| Home plus additional top-level pages | `top` | The pages remain in the global top row; the current page receives section navigation when needed. |
| Any listed child page or navigation category | `tree` | Top-level areas remain global and ordinary non-home pages receive a persistent left page tree. |

The choice is stable across the complete site. For example, one nested branch
makes ordinary non-home pages use the same tree-navigation frame. Pages with
`navigation.listed: false` do not affect automatic selection.

The four accepted values have these roles:

| Value | Use it when | Result and constraint |
| --- | --- | --- |
| `automatic` | The navigation should follow the listed site structure. This is the normal choice. | Resolves to one of the other three modes using the rules above. |
| `sections` | The site is intended to remain a one-page site. | Emphasizes the current page and its H2 sections. It is not a way to hide additional pages. |
| `top` | Pages should stay in top navigation instead of using a persistent left tree. | Top-level pages use the global row. Explicit `top` can place child pages in submenus, but it cannot represent a navigation category. |
| `tree` | The site needs a persistent page hierarchy, or should retain that frame before child pages are added. | Uses a left page rail. A sufficiently deep branch can add a separate right H2/H3 contents rail. |

### One Page: `sections`

```text
pages/
`-- 000-home/
    `-- content.md  # One H1 and its H2 sections
```

With `automatic`, this structure resolves to `sections`. Wide screens keep the
page title and H2 destinations in sticky navigation. Small screens collect the
same destinations in the compact menu.

With no H2 headings, the H1 remains a top link and no empty section menu is
created. One H2 is enough to create section navigation on a one-page site.

### Top-Level Pages: `top`

```text
pages/
|-- 000-home/
|   `-- content.md
|-- 010-dogs/
|   `-- content.md
`-- 020-adopt/
    `-- content.md
```

With `automatic`, this flat structure resolves to `top`. Home, Dogs, and Adopt
appear in the global row. The current page's H2 sections receive local
navigation when there is more than one.

### Child Pages Or Categories: `tree`

```text
pages/
|-- 000-home/
|   `-- content.md
`-- 010-guides/
    |-- content.md
    `-- pages/
        `-- 010-installation/
            `-- content.md
```

With `automatic`, this structure resolves to `tree`. The global row keeps Home
and Guides. A left rail shows pages in the current top-level area without
repeating unrelated global destinations. On shallow branches, expandable page
outlines place each page's H2 and H3 destinations below that page. A branch at
least three visible page levels deep can instead use a right contents rail for
the current page.

Home keeps the global top row without a persistent local rail. Its outline
remains available in the compact menu. Other independent top-level pages use
the left rail, just like pages inside a branch. A separate right contents rail
requires at least two H2/H3 destinations on the current page.

When the viewport cannot hold both rails, Norna first moves the current page
outline into the left tree. It then replaces the persistent tree with a compact
menu when the page becomes narrower. The destinations remain the same through
these fallbacks.

The current page outline opens when the reader enters the page. Other expanded
page and category branches remain remembered during the browser session when
JavaScript is available. Ordinary links and native disclosure controls remain
usable without JavaScript.

A listed navigation category has no page URL and therefore requires `tree`.
Norna rejects an explicit `sections` or `top` value when a listed category
exists. Use `automatic`, use `tree`, or replace the category with a page that
has meaningful content.

See [Pages and Categories](pages.md#navigation) for page ordering, unlisted
pages, breadcrumbs, page sequences, exact rail placement, and the complete
responsive contract. See
[Client-Side JavaScript](client-javascript.md) for enhancement and fallback
behavior.

## Search

Set `search` to `true` when readers need to find text across pages. The build
creates a static index and a dedicated search page; the setting does not
connect the site to a hosted search service.

- Purpose: generate site-wide search from the completed static pages.
- Type: boolean.
- Required: no.
- Default: `false`.
- Scope: site-wide.

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

`scrollBehavior` controls movement to an anchor on the current page. Keep the
default immediate movement unless the site deliberately prefers the browser's
native animation. The setting does not affect links that load another page.

- Purpose: choose immediate or browser-animated same-page anchor movement.
- Type: one of `instant` or `smooth`.
- Required: no.
- Default: `instant`.
- Scope: site-wide.

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
