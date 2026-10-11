---
page:
  description: Add a site logo, browser icons, sharing image and technical files, and understand their published addresses.
navigation:
  order: 7000
---

# Public files and output

`site/public/` holds technical site files and the site's named logo, browser
icons and sharing image. Norna checks these public files' locations and
publishes them without changing their bytes.

Put ordinary content images in the owning page's
[`images/` folder](/reference/site/images/), beside `content.md`.
Put documents and other downloads in a page's
[attachments folder](/reference/site/attachments/), even when several pages link to them.

```text title="Example source locations"
site/
|-- public/
|   |-- logo.svg
|   |-- favicon.ico
|   `-- robots.txt
`-- root/
    |-- content.md
    |-- images/diagram.svg
    `-- downloads/handbook.pdf
```

The logo and icon are discovered automatically. The diagram and handbook belong
to Home; refer to them as `images/diagram.svg` and `downloads/handbook.pdf` in its
Markdown. A general `public/images/` or download folder is not supported.

## Allowed files

| Source in `public/` | Published path, before the site's base path |
| --- | --- |
| `robots.txt`, `CNAME`, `llms.txt` | The same filename at the site root |
| Files beneath `.well-known/` | The same `.well-known/` path |
| Explicitly declared verification files | The same filename at the site root |
| Recognized logo, icon and social-image filenames | `/_norna/shared/` followed by the filename |

The `.well-known/` directory may contain subdirectories for technical files.
Use regular files and directories; symbolic links are unsupported. Other files,
including arbitrary HTML, scripts, stylesheets, fonts and documents, are rejected.
Names that differ only in case or Unicode normalization cannot claim the same
published file. A failed publication check leaves prepared output unchanged.

`CNAME` contains a hostname alone, such as `www.example.com`. GitHub Pages uses
it for publishing from a branch; a custom Actions workflow uses the domain
configured in the repository's Pages settings instead. See
[GitHub's CNAME guidance](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages#cname-errors).
The `url` in `site-config/settings.yaml` should use that domain.

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

Norna copies these images as supplied. It does not remove backgrounds, create
icon formats or choose different artwork for Light and Dark appearance. Prepare
logos and icons that remain legible on both backgrounds. Browsers choose among
the supplied favicon formats; a touch icon is used when a supporting device
adds the site to its home screen.

### Choosing formats and sizes

These are practical starting points, not required dimensions:

| Resource | Recommendation |
| --- | --- |
| Navigation logo | Prefer SVG. For PNG/JPEG, supply enough pixels for the configured height on a high-density screen; twice the displayed dimensions is a useful starting point. |
| Favicon | Use SVG or a real ICO containing several sizes, including 16 × 16 and 32 × 32. Simplify tiny artwork when lettering or fine details become illegible. |
| Touch icon | Supply `apple-touch-icon.png` at 180 × 180. |
| Sharing image | Start with a composed PNG/JPEG at 1200 × 630, with important text and artwork away from the edges. |

Norna does not generate these sizes or a sharing composition from the logo.
A prepared ICO keeps all its embedded sizes. The named public images retain
their filenames and receive no content hashes or responsive variants.
The [branding examples](/examples/building-a-site/#branding) show the logo,
browser icon and sharing image in one working site.

## Verification files

Place a verification file directly in `public/` and declare its exact filename:

```yaml title="site/site-config/settings.yaml: optional verification files"
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
sharing URL. `page.description`, when present, supplies the description;
Norna does not infer a summary from the prose.
A social image supplies absolute `og:image` and `twitter:image` URLs and a
large-image card. Without it, output uses a text summary card. The receiving
service decides how to display that information and may cache earlier values.
Page-specific preview images and generated text-on-image cards are not supported.

## Generated sitemap

Norna generates `sitemap.xml` from canonical URLs for all content pages,
even unlisted ones, and generated category lists, including the deployment
prefix. Aliases and category redirects are excluded. Entries are sorted by
URL, independently of navigation order.
Preparation writes `site/.norna/public/sitemap.xml`; the final build includes
`dist/sitemap.xml`. Do not supply a source `public/sitemap.xml`.
The sitemap omits `lastmod`; no modification dates are inferred from filesystem times.

## Generated 404 page

Every build creates `404.html` with a localized message, the shared theme and
a Home link. It has `noindex`, no canonical URL or social metadata, and works
without JavaScript. Custom editorial 404 content is not supported; the host
decides when to serve this file.

## Preparation and reserved paths

`site:public` validates sources, replaces prepared technical files, named site images
and attachments, and writes the sitemap. Generated image output and the current
search index are retained in their own areas. `build` produces the final artifact.

The complete `/_norna/` area belongs to resources. Pages named `images`,
`downloads` and `shared` remain available at their ordinary page addresses.
With search enabled, `/search/` is reserved for the search page. See
[URLs and links](/reference/site/urls/) for page and resource addresses.
