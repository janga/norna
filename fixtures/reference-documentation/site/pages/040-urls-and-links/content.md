---
page:
  description: Link to pages predictably and keep an earlier page URL working when needed.
---

# URLs and links

Use a page's site-relative URL to link to it. Add an alias only when an old
published URL should continue to identify that same page.

## Link to a page {#link-to-a-page}

Page directories determine page URLs. The numeric order prefix is not part of
the URL, so `site/pages/020-guides/pages/010-install/` has the page URL
`/guides/install/`.

Use a site-relative link when the destination is another page in the same
site:

```md title="content.md: link to a page"
[Set site appearance](/appearance/)
```

[Set site appearance](/appearance/)

Add an H2 or H3 fragment when the link should open a section:

```md title="content.md: link to a section"
[Set the site default](/appearance/#setting)
```

[Set the site default](/appearance/#setting)

Do not include the configured public base path. For example, a site published
at `https://owner.github.io/project/` still uses `/guides/install/` in its
Markdown. Norna adds `/project/` when it builds the published URL.

## Keep an old URL {#keep-an-old-url}

Add a previous page URL to `page.aliases` in the current page's opening
metadata. The alias always points to the page containing it:

```md title="content.md: preserve an earlier URL" {4,5}
---
page:
  description: Install Norna on a new computer.
  aliases:
    - /install-norna/
---

# Install Norna
```

This declaration means: **this old URL permanently identifies this current
page.** Keep the alias if the page moves again. Never reuse it for another
page.

An alias starts and ends with `/`, uses the same lowercase ASCII segments as a
page URL, and has no base path, query string, or fragment. It cannot be `/`.
Norna rejects an alias that collides with a page, category, public file,
generated route, or another alias. Aliases are excluded from the sitemap.

Norna publishes a static redirect document when its host cannot create a
server redirect. GitHub Pages has that limitation: an alias keeps an old
browser link useful, but is not an HTTP `301` response.

## Choose the right method {#choose-a-method}

Use a manual alias when the current page already has its intended directory,
but an unrelated older address should remain useful. Use
[page:move](/move/) when the page directory itself changes. It previews the
folder move, updates Norna-managed internal links, and adds each changed page
URL as an alias unless you choose `--no-aliases`.

## Related tasks {#related-tasks}

- [page:move](/move/) moves a page directory safely when the page's current
  URL must change.
