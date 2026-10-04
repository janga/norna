---
page:
  description: Link to pages, headings and files, and keep an old address working with an alias.
navigation:
  order: 3000
---

# URLs and links

A page URL follows its folders, not its H1. Home is `/`. Other pages use their
folder slugs without intermediate `pages/` directory names. Presentation order
lives in frontmatter and does not affect URLs.

## Page addresses

```text title="Folders become URL segments"
site/root/content.md                    -> /
site/root/pages/guides/content.md                  -> /guides/
site/root/pages/guides/pages/install/content.md -> /guides/install/
```

The public `url` in `site-config/settings.yaml` supplies the domain and any deployment
prefix. With `url: https://example.com/manual/`, the last page is published
as `https://example.com/manual/guides/install/`.

Write internal links **without** `/manual/`; Norna adds it during rendering:

```md title="content.md: links on a site containing Guides"
[Installation](/guides/install/)
[Requirements](/guides/install/#requirements)
```

A parent page has its own URL. It can append a
[generated list of child pages](/reference/site/pages/#list-child-pages).

## Heading anchors

The part after `#` identifies a place within a page. Norna gives H1 the fixed
anchor `page-title` and derives H2/H3 anchors from their text. Changing heading
text can change a derived anchor. Give an H2 or H3 an explicit ID for stable
links:

```md title="content.md: preserve an anchor when the heading changes"
## Before you install {#requirements}

Read the [requirements](#requirements) before continuing.
```

Explicit IDs use lowercase ASCII letters, digits and hyphens and must be
unique on the page. H4 and deeper headings do not supply checked navigation
destinations. See [Markdown and headings](/reference/content/markdown/).

## Relative links and files

Relative links resolve from the **published page URL**, not the source folder.
From `/guides/install/`, `../` reaches `/guides/` and `../usage/` reaches
`/guides/usage/`. Prefer paths beginning with `/` when the target is unclear.
Reference-style links and card `link` fields use the same destination rules.

For `site/root/downloads/checklist.pdf`, a link from another page uses:

```md title="content.md: a homepage attachment"
[Download the checklist](/_norna/downloads/~home/checklist.pdf)
```

Norna checks that the file exists, but not anchors inside PDFs or other public
files. External URLs are not fetched by the local link checker.

Full HTTP/HTTPS URLs to known pages and files in this source tree are also
checked and followed when pages or files are renamed or moved. The scheme,
host, port and deployment prefix must match `url` in `site-config/settings.yaml`. **Copy Link** in Site
Tree produces this form. A full URL stays full when Norna updates its target;
link text, titles, queries and fragments are retained. URLs outside that site
remain external, including old domains and other local preview ports.
An absolute URL with no locally owned destination also stays external: the
same server may host other, independently built sites. Short internal links
still report missing destinations.

For the same attachment, these identify the same destination when the site
URL is `https://example.com/manual/`:

```md title="Short and complete addresses"
[Checklist](/_norna/downloads/~home/checklist.pdf)
[Checklist](https://example.com/manual/_norna/downloads/~home/checklist.pdf)
```

`manual/_norna/downloads/~home/checklist.pdf` is a different, relative destination beneath
the current page. Do not add the deployment prefix to a short internal link.

## Resource addresses

Resources occupy `/_norna/`, separately from page URLs. Managed images use
`/_norna/images/` with content hashes. Attachments use
`/_norna/downloads/<page-key>/<filename>`; the homepage key is `~home`, and
other keys join page slugs with `--` (for example `guides--install`).
Shared public images use `/_norna/shared/`. Known technical public files keep
their required site-relative paths. See [public files](/reference/site/public-files/).

Pages can use the slugs `images`, `downloads` and `shared` without claiming
resource directories. Internal resource references and **Copy Link** follow
the same publication rules. Local attachment syntax stays `downloads/filename`.

## Keep an old URL

An **alias** is an additional address owned by one current page. Add it at the
start of that page's `content.md`:

```md title="content.md: preserve /installation/" {3,4}
---
page:
  aliases:
    - /installation/
---

# Install Norna
```

If this page now lives at `/guides/install/`, `/installation/` leads there.
The alias means: **this old URL continues to identify this page**, even if the
page moves again. Keep it with the page; do not reuse it for different content.
An alias cannot name a separate destination or an external website.

Paths begin and end with `/`, omit the deployment prefix and use page-folder
slug characters. `/`, queries and fragments are forbidden. Aliases cannot
collide with pages, other aliases, public files or generated routes.

Norna currently emits static redirect documents with a canonical target,
immediate browser navigation and an ordinary link. They are excluded from
the sitemap and are **not HTTP 301 responses**. GitHub Pages cannot configure
arbitrary HTTP redirects from a static artifact. Other hosts may offer native
rules, but Norna does not generate provider-specific redirect rules today.

For a folder move or rename, use [page:move](/reference/commands/move/) instead:
it updates internal links and normally records the old addresses. Add an alias
manually when preserving an address outside such a move.

## Check links

```sh title="Check local destinations without editing files"
npm exec -- norna content:check
```

Checks cover local pages, H2/H3 anchors, public files and card links, including
generated routes and aliases. A link to an alias works but is reported for
replacement by its canonical address. An anchor on a category redirect is
not a stable checked section destination; link directly to the page.

Checking does not rewrite anything. [Validation and image sync](/reference/commands/validate/)
distinguishes reporting problems from moving files.
