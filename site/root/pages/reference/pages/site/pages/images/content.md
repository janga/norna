---
page:
  description: Store images with their page and understand variants, cache state and image metadata.
navigation:
  order: 5000
---

# Managed images

Norna manages images referenced with ordinary Markdown or an `image-stack`,
`image-carousel` or `card-list` block. The file belongs in the referring page's
`images/` folder. Norna checks the reference, generates display sizes and moves
the image with its page, regardless of which supported syntax you use.

## Source files

```text title="An image belongs to the page that uses it"
site/root/pages/guide/
|-- content.md
`-- images/
    `-- workspace.jpg
```

```md title="content.md: a managed image"
![A laptop displaying the local preview beside an open text editor](images/workspace.jpg)
```

For Markdown, prefer `images/workspace.jpg`; `./images/workspace.jpg` and the
Norna shorthand `workspace.jpg` identify the same local file. Image blocks use
the bare filename. See [Markdown images](/reference/content/markdown/#markdown-images)
for presentation and text fields, or [image blocks](/reference/content/images/)
for captions and collections.

Supported extensions are `.jpg`, `.jpeg`, `.png` and `.svg`, including uppercase
spellings. Filenames start with a letter or number and contain only letters,
numbers, dots and hyphens. Keep files directly in `images/`; nested directories
and relative references to other pages are not supported. Another page may
have an independent image with the same filename. A missing local file is an
error even when that name exists elsewhere; building never borrows another
page's file.

`content:check` reports missing, misplaced and unused images. `content:sync`
moves only unambiguous misplaced files; see [image sync](/reference/commands/validate/#image-sync).
`page:move` moves the entire page folder, including its images.

## Variants and SVG

`images` and `build` prepare raster images with ImageMagick. Normal WebP
widths are 480, 768, 1080, 1440 and 1920 pixels, skipping sizes above the
source width. The source width is also included when it differs from these sizes,
including sources narrower than 480 pixels. Output lives in `site/.norna/public/images/generated/`.

Filenames include the first eight characters of the source SHA-256 hash.
Changing a source therefore changes its published URLs and avoids stale caches.

SVG files are copied to `site/.norna/public/images/original/` with hashed names.
They are not rasterized and need no ImageMagick. A `viewBox` or numeric width
and height supplies an intrinsic ratio; an unreadable ratio does not prevent
direct SVG rendering.

[Image presentation](/reference/configuration/images/) controls alignment and
viewport limits independently of processing.

## Manifest and cache

Keep `site/.norna/generated-images.json` in Git. It records hashes, dimensions,
output version and variant paths. Output is reused only when the manifest
matches the source and all expected files exist. Missing cached files are
regenerated. The starter Actions cache keys generated output from this manifest.

Do not version `site/.norna/public/` itself.

## Credits and provenance

Norna does not inspect or enforce embedded copyright metadata. WebP generation
strips embedded metadata. Publish licensing and credits in captions or other
site documents rather than relying on EXIF.

Record generated-image provenance in a source-only comment when useful:

```md title="content.md: maintainable image provenance"
<!-- norna-image-provenance:
image: workspace.png
source: generated
prompt: An overhead view of a writing desk and laptop, no lettering.
-->
```

The marker hides the whole comment from published content. Its fields are an
editorial convention, not validated settings.

Markdown references to external URLs and root-relative `public/` assets stay
outside managed image processing. Norna does not download remote images.
Custom HTML images also remain outside this pipeline.
