# Public Files

`site/public/` contains static files that Norna copies into the published site
without managed-image processing. Use it for browser icons, verification files,
`robots.txt`, a custom-domain `CNAME`, downloadable files, and other assets that
must keep their original format.

Most files and subdirectories under `public/` are site-owned. Logos and browser
icons are exceptions: Norna discovers a small set of exact filenames by
convention.

## Navigation Logo

To add a navigation logo, place exactly one supported logo file directly in
`site/public/`:

- `logo.svg`
- `logo.png`
- `logo.jpg`
- `logo.jpeg`

Norna discovers the logo from its filename, so you do not configure a path or
enable it separately. Use the exact lowercase filename to keep the site
portable between case-sensitive and case-insensitive file systems.

The logo links to the homepage. Its alternative text comes from the homepage
Markdown H1 in `site/pages/000-home/content.md`; no separate site name or logo alt text is
configured.

Configure top-level `logo` in `site/sitewide-content.yaml` only when you need
to override the displayed height:

```yaml
logo:
  height: 2rem
```

The width follows the image's intrinsic aspect ratio. `logo` does
not enable the logo or select a file.

`norna config:check` fails when it finds multiple supported logo files, or when
`logo` is configured but no logo file exists. A site without a logo uses its
ordinary page-title navigation; the check reports the missing logo as a
warning.

## Browser Icons

To add browser icons, place one or more supported files directly in
`site/public/`:

- `favicon.svg`
- `favicon.ico`
- `favicon.png`
- `apple-touch-icon.png`

Norna discovers these files from their filenames, so you do not configure paths
or enable them separately. Use the exact lowercase filenames to keep the site
portable between case-sensitive and case-insensitive file systems.

You may include several supported browser-icon files. Norna links every file it
finds and lets the browser select the appropriate format.

Browser icons are separate from the navigation logo. The logo appears inside
the website, while browser icons identify it in tabs, bookmarks, and similar
browser interfaces.

## GitHub Pages Custom Domain

To use a custom domain with GitHub Pages, place a file named exactly `CNAME`
directly in `site/public/`. Write the domain name in the file without a protocol
or path:

```text
www.example.com
```

Norna does not discover or interpret `CNAME`; it copies the file to the root of
the generated website. GitHub Pages gives the filename its meaning. The public
`url` in `site/config.yaml` should use the same domain.

## Other Static Files

Other names are not restricted. For example:

```text
site/public/
|-- robots.txt
|-- verification.html
`-- downloads/
    `-- project-overview.pdf
```

Except for the navigation logo and browser icons documented above, Norna does
not attach meaning to filenames or inspect their contents. It copies them
unchanged. Browsers, crawlers, hosting services, and verification providers may
still require their own exact filenames and locations.

Norna preserves subdirectories while copying these files. A source file such
as `site/public/downloads/project-overview.pdf` is published at
`/downloads/project-overview.pdf`, prefixed with the site's configured base path
when the site is published below a path such as `/repository-name/`.

Ordinary Markdown image syntax may reference a public asset with a root-relative
URL:

```md
![Public diagram](/diagrams/overview.svg)
```

Use Norna image blocks instead for local editorial images that should be
validated, synced, processed, and captioned. See
[Images and Metadata](images-and-metadata.md).

## Generated Copy

`norna site:public` copies source files from `site/public/` to
`site/.norna/public/`. The latter directory is generated build-preparation
output and must not be edited or versioned.
