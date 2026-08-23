# `config.yaml`

Technical site configuration lives in the selected site's `config.yaml`; by
default that is `site/config.yaml`. The file is required and contains plain
YAML without Markdown frontmatter delimiters.

A normal configuration needs only the public URL:

```yaml
url: https://example.com/
```

Norna deliberately keeps this file small. Visual choices belong in
[`theme.yaml`](theme.md), shared editorial content belongs in
[`sitewide-content.yaml`](sitewide-content.md), and page content belongs in
[`content.md`](content.md).

## `url`

- Purpose: canonical public URL and source of the site's deployment path.
- Type: absolute `http` or `https` URL.
- Required: yes.
- Default: none.
- Restrictions: no query string or fragment.

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

## `scrollBehavior`

- Purpose: select native same-page anchor movement.
- Type: `instant` or `smooth`.
- Required: no.
- Default: `instant`.

Example using the browser's native smooth scrolling:

```yaml
url: https://example.com/
scrollBehavior: smooth
```

Norna does not add a scripted scrolling implementation. Visitors whose system
requests reduced motion always get immediate anchor movement.

## Complete Example

```yaml
url: https://example.com/
language: en-GB
scrollBehavior: instant
```

Run `norna config:check` after changing the file.

## Publishing Discovery

GitHub repository, default branch, and deploy workflow are not fields in
`config.yaml`.

`norna deploy` discovers the current GitHub repository and default branch
through the authenticated GitHub CLI. Norna's included workflow file is
`.github/workflows/deploy.yml`. `deploy:watch` accepts command-line overrides
when a one-off run needs different operational values.

See [Publishing](publishing.md) for the complete workflow.

## Site Directory Selection

The site directory is not configured in `config.yaml`.

Use one of:

```sh
NORNA_SITE_DIR=presentation norna build
norna --site-dir presentation build
```

If `NORNA_SITE_DIR` is set to an empty value, commands fail. Relative site
directories are resolved by walking upward from the invocation directory until
the selected directory contains `config.yaml` and `content.md`.

Without an explicit selection, the current directory itself can be the site
directory when it contains those two files. Otherwise Norna walks upward for a
default `site/` directory containing them.

See [Site Files](site-files.md) for the complete source and generated layout.
