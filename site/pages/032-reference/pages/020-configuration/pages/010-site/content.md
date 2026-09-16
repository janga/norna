---
page:
  description: Set the public URL and find the site-wide technical settings in config.yaml.
---

# Site configuration

`site/config.yaml` is required. It contains plain YAML for technical choices
that apply to the whole site. A minimal file contains only the public URL:

```yaml title="site/config.yaml"
url: https://example.com/
```

## Public URL

`url` is the final public address, not the local preview address. Use an
absolute HTTP or HTTPS URL without query, fragment or repeated path slashes.
Norna adds a trailing slash if missing.

```yaml title="site/config.yaml: a GitHub Pages project site" {1}
url: https://owner.github.io/project/
```

Here `/project/` becomes the deployment prefix, also called the **base path**.
There is no separate `basePath` field. Canonical URLs, images, sitemap entries
and internal links use this prefix. Write [content links](/reference/site/urls/)
without it.

## Optional settings

| Setting | Purpose | Default |
| --- | --- | --- |
| [`language`](/reference/configuration/language/) | Content language, generated labels and locale | `en` |
| [`editLink`](/reference/configuration/source-links/) | Links to local or remote source files | None |
| [`navigation.mode`](/reference/configuration/navigation/) | Automatic or explicit navigation model | `automatic` |
| [`search`](/reference/configuration/search/) | Static search page and index | `false` |
| `scrollBehavior` | Same-page anchor movement | `instant` |

This is the complete configuration surface. Visual settings belong in
[`theme.yaml`](/reference/configuration/theme/) and shared notices/footer text
in [`sitewide-content.yaml`](/reference/configuration/shared-content/).

## Anchor movement

```yaml title="site/config.yaml: animate anchor navigation" {2}
url: https://example.com/
scrollBehavior: smooth
```

`instant` moves immediately; `smooth` requests native browser animation.
Reduced-motion preferences always get immediate movement. This setting does
not affect links that load another page and adds no scripted scrolling engine.

## Check configuration

```sh title="Validate the selected site"
npm exec -- norna config:check
```

Unknown fields are errors. GitHub repository, branch and workflow selection
are discovered by [publishing commands](/reference/commands/publishing/), not
configured here. Selecting a source directory uses the global
[`--site-dir` option](/reference/commands/invocation/#site-selection).
