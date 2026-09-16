---
page:
  description: Add logos, icons and downloads, and understand social previews, sitemaps and 404 output.
---

# Public files and output

`site/public/` holds files copied unchanged to the site's public root. Use it
for downloads, icons, `robots.txt` and verification files. These files keep
their format and are not processed as managed images.

## Recognized files

| File in `public/` | Result | Rule |
| --- | --- | --- |
| `logo.svg`, `logo.png`, `logo.jpg`, `logo.jpeg` | Navigation logo linking to Home | At most one |
| `favicon.svg`, `favicon.ico`, `favicon.png` | Tab and bookmark icons | Any combination |
| `apple-touch-icon.png` | Touch icon | Optional |
| `social-image.png`, `social-image.jpg`, `social-image.jpeg` | Site-wide sharing image | At most one |
| `CNAME` | GitHub Pages domain file | Optional |

Use exact filenames; no path settings or enable switches are needed. Multiple
logo or sharing-image files fail validation. Missing a logo produces a warning
and leaves page-title navigation available. Logo alternative text comes from
Home's H1; [shared content](/reference/configuration/shared-content/#logo)
controls its displayed height. Browsers select among linked icon formats.

## Social previews

Each content page supplies its H1 as sharing title and canonical URL as
sharing URL. `page.description`, when present, supplies description metadata;
Norna does not infer a summary.

A social image provides absolute `og:image` and `twitter:image` URLs and a
large-image card. Without it, output uses a text summary card with no image
metadata. Page-specific preview images and generated text-on-image cards are
not supported.

## Downloads and hosting files

```text title="Preserve public subdirectories"
site/public/
|-- robots.txt
|-- verification.html
`-- downloads/
    `-- checklist.pdf
```

```md title="content.md: a download link"
[Download the checklist](/downloads/checklist.pdf)
```

Omit the deployment prefix from the link. Norna adds it and checks that the
file exists. Other filenames have no special Norna meaning, although browsers,
hosts or crawlers may require them.

`CNAME` contains a hostname alone, for example `www.example.com`. Norna copies
it; GitHub Pages interprets it. `config.yaml`'s public URL should use that domain.

## Generated sitemap

`sitemap.xml` contains absolute canonical URLs including the deployment prefix.
It includes content pages, even unlisted ones, and generated category lists.
Aliases and category redirects are excluded because their targets are already
represented. Entries use URL order, independent of navigation order. `lastmod`
is omitted because Norna has no reliable page-modification date.

Preparation writes `site/.norna/public/sitemap.xml`; the completed build has
`dist/sitemap.xml`. Do not edit these or supply `public/sitemap.xml`.

## Generated 404 page

Every build creates `dist/404.html` with localized text and a Home link. It
uses the root theme, shared content and navigation without marking a current
page. It has `noindex` and no canonical or social metadata. Its message and
Home link work without JavaScript.

Custom editorial 404 content is not supported. The host decides when to serve
this file; [GitHub Pages recognizes it](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site).

## Preparation and reserved paths

`site:public` copies public sources, removes stale copies and generates the
sitemap. It preserves generated images and, while search is enabled, the last
search index. `build` creates the final `dist/` artifact.

`sitemap.xml` and `404.html` are reserved. With search enabled, `/search/` and
`pagefind/` are reserved too. Do not create conflicting public files or routes;
Norna reports conflicts before replacing generated public files.
