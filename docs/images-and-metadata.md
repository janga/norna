# Images And Metadata

This document describes Norna's image pipeline. Site repositories own their
source images and any copyright or licensing policy for those images.

## Managed Source Images

Norna-managed local images are referenced from Markdown with
`norna-image-stack` or `norna-image-carousel` blocks. See
[Content](content.md#image-blocks) for the block syntax.

Homepage source images live under:

```text
site/images/<section-id>/
```

Route source images live under:

```text
site/routes/<NNN-route-id>/images/<section-id>/
```

Supported source extensions:

- `.jpg`
- `.jpeg`
- `.png`

Image block references use only the filename:

````md
```norna-image-stack
- image: portrait.jpg
  alt: Optional alt text.
  caption: Optional caption.
```
````

`alt` and `caption` are optional. If `alt` is omitted, Norna renders an empty
alt attribute.

Filenames do not have to be globally unique for the site to be valid.
Automatic sync only moves files when the filename identifies exactly one source
candidate within the current page or route.

## Markdown Images

Use ordinary Markdown images for external images or static public assets:

```md
![External image](https://example.com/image.jpg)
![Public asset](/workflow.svg)
```

Relative local Markdown images such as `![Portrait](portrait.jpg)` are not
managed by Norna. `content:check` warns about them because Norna cannot
validate, process, or sync those files through the image pipeline.

## Generated Variants

`npm run norna:images` and `npm run norna:build` generate WebP files in:

```text
site/.norna/public/images/generated/
```

The normal display widths are:

```text
480, 768, 1080, 1440, 1920
```

Widths larger than the source image are skipped. If the source image is wider
than all normal display widths, the pipeline also creates one variant at the
source width.

Generated filenames include the first eight characters of the source SHA-256
hash:

```text
example-work-1a2b3c4d-1440.webp
```

When a source image changes, the generated URL changes too. This avoids stale
browser, CDN, and GitHub Actions cache entries at the old URL.

## Manifest

The generated image manifest is:

```text
site/.norna/generated-images.json
```

It is versioned site state. It stores source hashes, original dimensions,
output version, and generated variant paths. The image pipeline reuses generated
files only when the manifest entry matches the current source hash and output
version, and all expected variant files exist.

Generated files under `site/.norna/public/` are build-preparation output and
should not be versioned.

## Metadata Behavior

The current engine does not inspect, require, warn about, or write source image
copyright metadata.

Generated WebP files are created with ImageMagick using `-strip`, so embedded
metadata is not a publication mechanism for generated variants. Keep licensing,
credits, copyright notices, alt text, and captions in site-owned files such as
`site/content.md`, route content files, `COPYRIGHT.md`, or other site
documentation.

If a site wants embedded metadata in original source files, that process is
outside the current Norna command surface.

## AI-Generated Images

For AI-generated images, keep provenance and the generation prompt in a
Markdown comment near the image block. This makes the image maintainable as
content: future editors can understand where it came from and regenerate or
revise it without reverse-engineering the asset.

````md
<!--
AI image prompt for workflow.png:
A clean editorial illustration of ordinary project files becoming a small
static website, restrained colors, readable composition, no text in the image.
-->

```norna-image-stack
- image: workflow.png
  alt: Abstract illustration of project files becoming a website.
  caption: Generated illustration.
```
````

This is a maintenance rule for real editorial images. It is not necessary for
throwaway test fixtures or examples where the prompt has no practical value.

## GitHub Actions Cache

The starter workflow caches:

```text
site/.norna/public/images/generated
```

The cache key should include `site/.norna/generated-images.json` so unchanged
generated variants can be restored during deploy. With a cache miss or a
changed source hash, variants are rebuilt from source images.
