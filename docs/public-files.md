# Public Files

`site/public/` contains static files that Norna copies into the published site
without managed-image processing. Use it for browser icons, verification files,
`robots.txt`, a custom-domain `CNAME`, downloadable files, and other assets that
must keep their original format.

Most files and subdirectories under `public/` are site-owned. Logos and browser
icons are exceptions: Norna discovers a small set of exact filenames by
convention.

## Navigation Logo

Put exactly one navigation logo directly in `site/public/`. Its filename must
be exactly one of:

- `logo.svg`
- `logo.png`
- `logo.jpg`
- `logo.jpeg`

Use lowercase letters and match the complete filename exactly. This is required
for portability between case-sensitive and case-insensitive file systems.

Norna discovers and displays the file automatically. No configuration path or
enable switch is needed. Only one supported logo file may exist.

The shared navigation label is configured separately:

```yaml
navigation:
  label: Example Site
```

Without a logo, `label` is shown as navigation text. With a logo, it becomes the
image alternative text. If `label` is omitted, Norna uses the homepage title.

Add the optional `logo` object only to override the displayed height:

```yaml
navigation:
  label: Example Site
  logo:
    height: 2rem
```

The width follows the logo's intrinsic aspect ratio. `navigation.logo` does not
enable the logo or select a file.

`norna config:check` fails when it finds multiple supported logo files, or when
`navigation.logo` is configured but no logo file exists. A site without a logo
uses its text label; the check reports this fallback as a warning.

## Logos And Favicons

A navigation logo is visible inside the website. A favicon identifies the site
in browser tabs, bookmarks, and similar browser UI. They are independent and
may coexist.

Norna recognizes these browser-icon filenames directly under `site/public/`:

- `favicon.svg`
- `favicon.ico`
- `favicon.png`
- `apple-touch-icon.png`

These filenames must also match exactly and use lowercase letters. More than
one format may be present. Norna emits links for every supported file and lets
the browser choose the appropriate one.

## Other Static Files

Other names are not restricted. For example:

```text
site/public/
|-- robots.txt
|-- CNAME
|-- verification.html
`-- downloads/
    `-- project-overview.pdf
```

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

