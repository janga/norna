# Images And Metadata

This document describes Norna's image pipeline. Site repositories own their
source images and any copyright or licensing policy for those images.

## Managed Source Images

Norna-managed local images are referenced from Markdown with
`norna-image-stack`, `norna-image-carousel`, or `norna-card-list` blocks. See
[Content](content.md#norna-blocks) for the block syntax.

Homepage source images live under:

```text
site/pages/000-home/images/
```

Images for any page, including nested pages, live directly under that page:

```text
site/pages/<NNN-page-id>/pages/<NNN-page-id>/images/
```

The number of nested `pages/` segments follows the page hierarchy.

Supported source extensions:

- `.jpg`
- `.jpeg`
- `.png`
- `.svg`

Managed image block references use only the filename:

````md
```norna-image-stack
- image: portrait.jpg
  alt: Optional alt text.
  caption: Optional caption.
```
````

`alt` and `caption` are optional. If `alt` is omitted, Norna renders an empty
alt attribute.

For generated or edited images, keep provenance near the image in a source-only
comment. Norna removes these comments from rendered HTML:

```md
<!-- norna-image-provenance:
image: portrait.jpg
source: generated
prompt: Short prompt or editing note.
-->
```

The `norna-image-provenance:` marker makes the whole comment source-only. The
fields inside it are a maintenance convention rather than validated image
metadata: `image` identifies the nearby file, `source` records how it was
obtained, and `prompt` records enough context to reproduce or revise it.

Each filename identifies one managed source image within its page. The same
filename may be used by another page. Automatic sync only moves misplaced
files when the filename identifies exactly one source candidate across all
page image roots, and when the move will not break another reference.
`content:sync` shows the complete plan before writing and uses an atomic rename
for each file. If source and destination are on different filesystems, it stops
and reports the paths for a manual move.

## Managed Image Presentation

The selected theme preset also determines how standalone image stacks and
carousels are placed:

- `prose-aligned` starts the image and caption at the body-text edge and sizes
  the image from available horizontal space;
- `centered-fit` centers the image and caption in a broader media area and fits
  the image within both available width and viewport height.

The presentation method applies to all standalone image stacks and carousels
in the root or page theme's scope. It does not affect images inside cards and
cannot be selected for an individual image entry. See [Image
Sizing](theme.md#image-sizing) for preset defaults, overrides, and size
settings.

Presentation does not change source discovery, responsive variant generation,
hashing, or sync. Those operations use the same managed source image regardless
of where the rendered image is aligned.

## Markdown Images

Use ordinary Markdown images for external images or static public assets:

```md
![External image](https://example.com/image.jpg)
![Public asset](/favicon.svg)
```

Relative local Markdown images such as `![Portrait](portrait.jpg)` are not
managed by Norna. `content:check` warns about them because Norna cannot
validate, process, or sync those files through the image pipeline.

## Generated Variants And Static SVG

For raster images, `npm run norna:images` and `npm run norna:build` generate
WebP files in:

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

SVG files are managed by the same Markdown image blocks, validation and sync
model, but they are not rasterized and do not get WebP variants. Norna copies
the SVG source to:

```text
site/.norna/public/images/original/
```

The copied SVG filename includes the source hash. If the SVG has a `viewBox` or
numeric `width` and `height`, Norna stores that ratio in the image manifest so
the existing image layout can size it like other images. If no intrinsic aspect
ratio can be read, the SVG is still rendered directly.

## Manifest

The generated image manifest is:

```text
site/.norna/generated-images.json
```

It is versioned site state. For raster images, it stores source hashes,
original dimensions, output version, and generated variant paths. For static
SVG images, it stores the source hash, copied public path, output version, and
intrinsic dimensions when they can be read. The image pipeline reuses generated
or copied files only when the manifest entry matches the current source hash
and output version, and all expected output files exist.

Generated files under `site/.norna/public/` are build-preparation output and
should not be versioned.

## Metadata Behavior

The current engine does not inspect, require, warn about, or write source image
copyright metadata.

Generated WebP files are created with ImageMagick using `-strip`, so embedded
metadata is not a publication mechanism for generated variants. Keep licensing,
credits, copyright notices, alt text, and captions in site-owned files such as
`site/pages/000-home/content.md`, other page content files, `COPYRIGHT.md`, or
other site documentation.

If a site wants embedded metadata in original source files, that process is
outside the current Norna command surface.

## AI-Generated Images

For AI-generated images, keep provenance and the generation prompt in a
Markdown comment near the image block. This makes the image maintainable as
content: future editors can understand where it came from and regenerate or
revise it without reverse-engineering the asset.

````md
<!-- norna-image-provenance:
image: workflow.png
source: generated
prompt: A clean editorial illustration of ordinary project files becoming a
  static website, restrained colors, readable composition, no text in the
  image.
-->

```norna-image-stack
- image: workflow.png
  alt: Abstract illustration of project files becoming a website.
  caption: Generated illustration.
```
````

Use the same comment next to a `norna-image-carousel` or `norna-card-list`
block when it references a generated or edited image.

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
