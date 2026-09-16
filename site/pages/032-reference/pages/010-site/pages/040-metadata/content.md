---
page:
  description: Set descriptions, aliases and navigation visibility in content.md.
---

# Page metadata

Optional YAML at the beginning of `content.md` configures a page without
becoming its body text. This **frontmatter** sits between two `---` lines.

## Available fields

```md title="content.md: all supported metadata fields"
---
page:
  description: Install the tools and preview your first Norna page.
  aliases:
    - /installation/
navigation:
  listed: true
---

# Install Norna
```

| Field | Effect | Omitted |
| --- | --- | --- |
| `page.description` | Nonempty text for description metadata, social previews and child lists | No inferred description |
| `page.aliases` | Nonempty list of additional page addresses | No aliases |
| `navigation.listed` | Boolean controlling navigation inclusion | `true` |

The example shows available fields, not requirements. Frontmatter can be
omitted. H1 supplies the title; there is no separate `title` setting. Visual
choices belong in [theme files](/reference/configuration/theme/).

## Descriptions

Describe what a reader gets from the page instead of repeating its title.
The description is not inserted into the body. It can appear beside the title
in [child-page lists](/reference/content/child-lists/) and category lists.
Missing descriptions warn when a `page-list` block needs them, not on every
page. Norna does not derive one from the opening paragraph.

## Aliases and visibility

[URLs and links](/reference/site/urls/#keep-an-old-url) defines alias rules.
[page:move](/reference/commands/move/) normally creates them during a move.

`navigation.listed: false` removes a non-home page and its branch from
navigation, not from output or the sitemap. It is not access control.
Home must stay listed. See [Pages and categories](/reference/site/pages/).

## Validation

`content:check` validates metadata and resulting links. Unknown keys are
errors, including keys copied from another generator. `category.yaml`
accepts `label` only; it is not a frontmatter file.
