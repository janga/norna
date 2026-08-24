---
page:
  description: Compare Norna's managed image stacks, carousels and card lists.
---

# Media blocks


## Image stack {#stack}

An image stack places one or more managed images in the normal Markdown flow.
Each source file belongs in the section's image folder, and Norna creates the
responsive output used by the browser.{note-ref}

{note: Local image references are validated against the image folder for this section before the site is built.}

```norna-image-stack
- image: stack-one.svg
  alt: A pale panel with a single large circle.
  caption: One image can introduce a visual idea.
- image: stack-two.svg
  alt: A dark panel with three aligned blocks.
  caption: A stack can contain several related images.
```

## Image carousel {#carousel}

A carousel keeps a related group together while showing one image at a time.
The controls, keyboard interaction and current position are provided by
Norna.{note-ref}

{note: The carousel provides controls, keyboard interaction and readable position status without page-specific components.}

```norna-image-carousel
- image: carousel-one.svg
  alt: A green panel with a diagonal line.
  caption: First frame: a broad direction.
- image: carousel-two.svg
  alt: A blue panel with two overlapping circles.
  caption: Second frame: a closer relationship.
- image: carousel-three.svg
  alt: A red panel with a compact grid.
  caption: Third frame: a denser detail.
```

## Card list {#cards}

Cards are useful when several short items need the same visual treatment. The
block controls the layout and size without requiring a component for each
card.{note-ref}

{note: Card layout stays within named options, so the same content remains predictable at narrow widths.}

```norna-card-list
layout: image-top
flow: grid
size: m
width: normal

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

Each example is an ordinary Markdown block with a bounded presentation model.
