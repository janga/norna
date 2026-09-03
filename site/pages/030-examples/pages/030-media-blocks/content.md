---
page:
  description: Inspect Norna image stacks, carousels and card lists as rendered content blocks.
---

# Media blocks

Norna blocks extend ordinary Markdown for recurring presentation needs. The
author supplies images, captions and short options; Norna supplies responsive
output, layout and interaction without a page-specific component.

## Image stacks {#image-stacks}

Use an image stack when every image should remain visible in reading order.
One image is valid, and additional entries create a vertical sequence.

```norna-image-stack
- image: stack-one.svg
  alt: A pale panel with one large circle and two horizontal lines.
  caption: The first image introduces one visual idea.
- image: stack-two.svg
  alt: A dark panel with three aligned rectangular forms.
  caption: Related images continue in the same stack.
```

The image list and captions belong to the block in `content.md`. Its alignment
and maximum size come from the root preset or an allowed page-theme image
override.

## Carousels {#carousels}

Use a carousel for a related sequence that should occupy one visual position.
Norna provides the controls, keyboard interaction, position status and caption
switching.

```norna-image-carousel
- image: carousel-one.svg
  alt: A green panel with a broad diagonal line.
  caption: First frame: a broad direction.
- image: carousel-two.svg
  alt: A blue panel with two overlapping circles.
  caption: Second frame: a closer relationship.
- image: carousel-three.svg
  alt: A red panel with a compact grid.
  caption: Third frame: a denser detail.
```

The carousel order belongs to `content.md`. Its presentation comes from the
theme: `prose-aligned` starts it at the body-text edge, while `centered-fit`
centers it and also limits its viewport height. Individual carousel blocks do
not choose a separate method or page width.

## Card lists {#card-lists}

Use cards for a short collection of comparable choices, resources or steps.
The block controls layout, flow and size while the root theme supplies the
normal maximum width.

```norna-card-list
layout: image-top
flow: grid
size: m

- title: Prepare source files
  text: Keep related content and images together before building the site.
  image: card-stack.svg
- title: Review presentation
  text: Check the result at wide and narrow browser widths.
  image: card-carousel.svg
- title: Publish the result
  text: Build validated static output when the site is ready.
  image: card-surfaces.svg
```

An individual card list may override its width with `text`, `narrow`, `normal`
or `wide`. That exception applies only to the list; omitting it preserves the
coordinated preset default.

## Configuration boundary {#configuration-boundary}

| Concern | Source | Scope |
| --- | --- | --- |
| Images, captions, order and block options | Norna block in `content.md` | One block |
| Default card-list width | Root `theme.yaml` | Complete site |
| Managed-image presentation and size | Root or page `theme.yaml` | Site or page subtree |
| Responsive variants and carousel behavior | Norna engine | Not configurable per block |

Open the complete [media and surfaces test site](https://janga.github.io/norna/examples/feature-demos/media-and-surfaces/),
go directly to its [media page](https://janga.github.io/norna/examples/feature-demos/media-and-surfaces/media/),
or read the [content block reference](https://github.com/janga/norna/blob/main/docs/content.md#norna-blocks)
and [image presentation reference](https://github.com/janga/norna/blob/main/docs/theme.md#image-sizing).
