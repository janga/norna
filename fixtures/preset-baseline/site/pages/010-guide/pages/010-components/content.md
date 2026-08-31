---
page:
  description: Representative content used for visual and structural preset baselines.
---

# Components

This page combines sustained prose with common Norna blocks. It includes a
[normal link](https://example.com/), `inline code`, and a deliberately long
token:
`configurationvaluewithanunusuallylongnamewithoutbreakpoints`.

## Reading and hierarchy {#reading-and-hierarchy}

Clear hierarchy helps readers scan before they settle into a longer passage.
The body text should remain comfortable at wide and narrow viewports, while
headings should preserve an obvious order.{note-ref}

{note: This margin note checks note width, alignment, contrast, and the narrow-screen fallback.}

### A level-three heading

This subsection checks the relationship between section headings, prose, and
smaller headings. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
do eiusmod tempor incididunt ut labore et dolore magna aliqua.

#### A level-four heading

Lists, links, and code should remain legible without requiring component-level
theme overrides:

- one concise item;
- one longer item that wraps at narrower reading widths;
- one item containing `npm run norna:check`.

```sh
npm run norna:check
npm run norna:build
```

## Image stack {#image-stack}

An image stack exercises media width, spacing, intrinsic aspect ratio, captions,
and section-surface contrast.

```norna-image-stack
- image: stack-one.svg
  alt: A pale panel with a circle and two horizontal lines.
  caption: A concise caption below the first image.
- image: stack-two.svg
  alt: A dark panel with three aligned blocks.
  caption: A second caption tests rhythm between consecutive images.
```

## Image carousel {#image-carousel}

The carousel checks the relationship between image constraints, controls,
position status, and captions.

```norna-image-carousel
- image: carousel-one.svg
  alt: A green panel with a diagonal line.
  caption: First frame with a broad diagonal.
- image: carousel-two.svg
  alt: A blue panel with overlapping circles.
  caption: Second frame with overlapping forms.
- image: carousel-three.svg
  alt: A red panel with a compact grid.
  caption: Third frame with denser detail.
```

## Card list {#card-list}

Cards combine shape, surface, spacing, type hierarchy, links, and optional
images.

```norna-card-list
layout: image-left
flow: grid
size: m

- title: Prepare the source
  text: Keep ordinary content and related images together.
  image: card-stack.svg
  link: https://example.com/source
  badge-text: First
- title: Review the result
  text: Compare hierarchy, spacing, and media at several widths.
  image: card-carousel.svg
- title: Publish deliberately
  text: A card without an image checks alignment within the same list.
```
