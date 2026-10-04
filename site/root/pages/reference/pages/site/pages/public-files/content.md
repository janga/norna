---
page:
  description: Add technical site files and shared images, and understand their published addresses.
navigation:
  order: 7000
---

# Public files and output

`site/public/` holds technical site files and images shared across the site.
Norna checks their locations and publishes them without changing their bytes.
Put documents and other downloads in a page's
[attachments folder](/reference/site/attachments/), even when several pages link to them.

## Allowed files

| Source in `public/` | Published path, before the site's base path |
| --- | --- |
| `robots.txt`, `CNAME`, `llms.txt` | The same filename at the site root |
| Files beneath `.well-known/` | The same `.well-known/` path |
| Explicitly declared verification files | The same filename at the site root |
| Recognized logo, icon and social-image filenames | `/_norna/shared/` followed by the filename |
| JPG, JPEG, PNG and SVG files beneath `images/` | `/_norna/shared/images/` followed by their relative path |

The `images/` and `.well-known/` directories may contain subdirectories.
Use regular files and directories; symbolic links are unsupported. Other files,
including arbitrary HTML, scripts, stylesheets, fonts and documents, are rejected.
Names that differ only in case or Unicode normalization cannot claim the same
published file. A failed publication check leaves prepared output unchanged.

`CNAME` contains a hostname alone, such as `www.example.com`; GitHub Pages
interprets it. The `url` in `site-config/settings.yaml` should use that domain.

A build writes inside its own output directory. If a hosting service requires
`robots.txt`, verification files or `.well-known/` at the **domain root**, deploying
Norna below a path such as `/manual/` does not place those files there. Arrange
that root-level publication with the host.

## Recognized files

| File in `public/` | Result | Rule |
| --- | --- | --- |
| `logo.svg`, `logo.png`, `logo.jpg`, `logo.jpeg` | Navigation logo linking to Home | At most one |
| `favicon.svg`, `favicon.ico`, `favicon.png` | Tab and bookmark icons | Any combination |
| `apple-touch-icon.png` | Touch icon | Optional |
| `social-image.png`, `social-image.jpg`, `social-image.jpeg` | Site-wide sharing image | At most one |

Use exact filenames. Norna links them from the rendered pages using their
published addresses. Multiple logos or social images fail validation. Without
a logo, navigation uses the homepage title. Logo alternative text comes from
Home's H1; [shared content](/reference/configuration/shared-content/#logo)
controls its displayed height.

## Shared images

```text title="An image used on several pages"
site/public/images/site-mark.svg
```

```md title="content.md: a shared image"
![The project mark](/_norna/shared/images/site-mark.svg)
```

Omit the deployment prefix; Norna adds it. Public images currently retain their
original bytes and filenames. They do not receive the responsive variants and
hashing of [page-owned managed images](/reference/site/images/). Shared image
links in ordinary Markdown participate in reference discovery and rename/move
updates. HTML references require manual maintenance.

## Verification files

Place a verification file directly in `public/` and declare its exact filename:

```yaml title="site-config/settings.yaml: optional verification files"
sourceFormat: 2
url: https://example.com/
verificationFiles:
  - google-example.html
```

This permits `public/google-example.html` at `/google-example.html`.
The declaration does not create the file. It cannot override recognized or
reserved names, and it accepts one filename without directory segments.
Files beneath `.well-known/` need no declaration.

## Social previews

Each content page supplies its H1 as sharing title and canonical URL as
sharing URL. `page.description`, when present, supplies the description.
A social image supplies absolute `og:image` and `twitter:image` URLs and a
large-image card. Without it, output uses a text summary card. Page-specific
preview images and generated text-on-image cards are not supported.

## Generated sitemap

Norna generates `sitemap.xml` from canonical URLs for all content pages,
even unlisted ones, including the deployment prefix. Aliases are excluded.
Preparation writes `site/.norna/public/sitemap.xml`; the final build includes
`dist/sitemap.xml`. Do not supply a source `public/sitemap.xml`.
No modification dates are inferred from filesystem times.

## Generated 404 page

Every build creates `404.html` with a localized message, the shared theme and
a Home link. It has `noindex` and works without JavaScript. Custom editorial
404 content is not supported; the host decides when to serve this file.

## Preparation and reserved paths

`site:public` validates sources, replaces prepared technical files, shared images
and attachments, and writes the sitemap. Generated image output and the current
search index are retained in their own areas. `build` produces the final artifact.

The complete `/_norna/` area belongs to resources. Pages named `images`,
`downloads` and `shared` remain available at their ordinary page addresses.
With search enabled, `/search/` is reserved for the search page. See
[URLs and links](/reference/site/urls/) for page and resource addresses.
