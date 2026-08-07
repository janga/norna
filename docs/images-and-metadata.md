# Images And Metadata

This document describes the generic image pipeline. Site repositories own their
source images and any copyright or licensing policy for those images.

## Source Images

Source images live under `site/images/<section-id>/` and are referenced from
`site/content.md` by filename only.

Supported source extensions:

- `.jpg`
- `.jpeg`
- `.png`

Image filenames must be globally unique under `site/images/`. The content and
image scripts reject duplicate filenames because image rows identify images by
filename only.

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

Generated files under `site/.norna/public/` are build-preparation output
and should not be versioned.

## Metadata Behavior

The current engine does not inspect, require, warn about, or write source image
copyright metadata.

Generated WebP files are created with ImageMagick using `-strip`, so embedded
metadata is not a publication mechanism for generated variants. Keep licensing,
credits, copyright notices, alt text, and captions in site-owned files such as
`site/content.md`, `COPYRIGHT.md`, or other site documentation.

If a site wants embedded metadata in original source files, that process is
outside the current `norna` command surface.

## GitHub Actions Cache

The starter workflow caches:

```text
site/.norna/public/images/generated
```

The cache key should include `site/.norna/generated-images.json` so
unchanged generated variants can be restored during deploy. With a cache miss or
a changed source hash, variants are rebuilt from source images.
