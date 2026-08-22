# Configuration

Technical site configuration lives in the selected site's `config.md`; by
default that is `site/config.md`. The file contains YAML frontmatter only.

A normal configuration needs only the public URL:

```yaml
---
url: https://example.com/
---
```

Norna deliberately keeps this file small. Visual choices belong in
`theme.md`; shared identity, banners and footer content belong in
`sitewide-content.md`.

## `url`

- Purpose: canonical public URL and the source of the site's deployment path.
- Type: absolute `http` or `https` URL.
- Required: yes.
- Default: none.
- Restrictions: no query string or fragment.

Norna adds a trailing slash when it is omitted. The URL pathname becomes the
base path for generated links, favicons and managed images, so there is no
separate `basePath` setting.

Root-hosted site or custom domain:

```yaml
---
url: https://example.com/
---
```

GitHub Pages project site:

```yaml
---
url: https://owner.github.io/repository-name/
---
```

In the second example, Norna derives `/repository-name/` as the base path.
Root-relative links written in Markdown are prefixed when rendered.

## `language`

- Purpose: language tag rendered on the root `<html lang="...">` element and
  selection of Norna's built-in interface text.
- Type: language tag such as `en`, `en-GB`, `sv` or `sv-SE`.
- Required: no.
- Default: `en`.

Norna currently includes interface text for English and Swedish. Regional tags
use the language identified by their primary subtag. An unsupported language is
an error because silently rendering English controls on another-language pages
would be misleading.

Interface labels are part of the engine and are not configured individually.
Editorial text remains in `content.md`, route content files and
`sitewide-content.md`.

## `smoothScroll`

- Purpose: enables smooth same-page anchor movement.
- Type: boolean.
- Required: no.
- Default: `false`.

Example:

```yaml
---
url: https://example.com/
smoothScroll: true
---
```

Norna uses the browser's native CSS scrolling behavior rather than a scripted
animation. Visitors whose system requests reduced motion always get immediate
anchor movement.

## Complete Example

```yaml
---
url: https://example.com/
language: en
smoothScroll: false
---
```

Do not add Markdown below the closing `---`; `config.md` is frontmatter-only.
Run `npm run norna:config:check` after changing it.

## Related Files

- [`theme.md`](theme.md) selects a complete presentation preset and optional
  focused overrides.
- [`sitewide-content.md`](sitewide-content.md) contains shared identity,
  banners and footer content.
- [`content.md`](content.md) and route content files contain page content.

## Publishing Discovery

GitHub repository, default branch and deploy workflow are not site
configuration fields.

`norna deploy` discovers the current GitHub repository and its default branch
through the authenticated GitHub CLI. Norna's included workflow file is
`.github/workflows/deploy.yml`. `deploy:watch` accepts command-line overrides
such as `--repo`, `--branch`, `--workflow`, `--interval`, `--timeout` and
`--limit` when a one-off run needs different values.

See [Publishing](publishing.md) for the complete workflow.

## Site Directory Selection

The site directory is not configured in `config.md`.

Use one of:

```sh
NORNA_SITE_DIR=my-site npm run norna:build
norna --site-dir my-site build
```

If `NORNA_SITE_DIR` is set to an empty value, commands fail. Relative site
directories are resolved by walking upward from the invocation root until the
selected directory contains `config.md` and `content.md`. Absolute site
directories are accepted and make their parent the site project root.

When no site directory is explicitly selected, the current directory itself
can be the site directory if it contains `config.md` and `content.md`. If not,
Norna walks upward looking for a default `site/` directory with those files.
