---
page:
  description: Write an image stack or carousel using page-local images, alternative text and captions.
---

# Image blocks

Use `image-stack` for one or more images in reading order. Use `image-carousel`
for two or more images the reader switches between. Both reference files in
the page's `images/` folder.

## Image stack

````md title="content.md: one image"
```image-stack
items:
  - image: workspace.jpg
    alt: A laptop displaying the local preview beside an open text editor.
    caption: The editing workspace.
```
````

Add more entries under `items` to stack more images. Image order is source
order; no per-image presentation settings are accepted.

## Image carousel

````md title="content.md: two views"
```image-carousel
items:
  - image: desktop.png
    alt: The page tree and article on a wide screen.
    caption: Wide-screen navigation.
  - image: mobile.png
    alt: The same page with its compact menu open.
    caption: Small-screen navigation.
```
````

Carousels require at least two entries. Images retain their proportions and
the stage fits within width and viewport-height limits. Controls sit beside
the stage, not at the edges of a wider empty area. JavaScript adds previous/
next controls, a position indicator, arrow-key operation and touch dragging.
Without it, all images and captions remain visible in source order.

Use matching aspect ratios for a stable stage. `content:check` warns about
mixed ratios or SVGs with no readable intrinsic ratio; it does not crop them
to make them match.

## Entry fields

| Field | Rule | When omitted |
| --- | --- | --- |
| `image` | Required lowercase filename matching `^[a-z0-9][a-z0-9.-]*\.(jpe?g|png|svg)$`; no path | Error |
| `alt` | Single-line alternative text; `""` is allowed | Empty alt attribute |
| `caption` | Nonempty plain text; multiline YAML is allowed | No visible caption |

The author is responsible for useful alt text on meaningful images. A caption
provides visible context but does not automatically replace alt text. These
fields follow the [shared YAML rules](/reference/content/structured-blocks/).

## Placement and processing

The theme chooses `prose-aligned` or `centered-fit` for stacks and carousels.
The method cannot be selected per block or entry. Tall captions and image
inspection are automatic enhancements; see
[Image presentation](/reference/configuration/images/).

[Managed images](/reference/site/images/) covers variants, source files,
metadata and cache state. To compare actual stack and carousel rendering,
open the [image examples](/examples/#image-stacks).
