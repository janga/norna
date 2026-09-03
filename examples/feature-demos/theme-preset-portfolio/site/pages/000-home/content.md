---
page:
  description: Shared source content rendered with each complete Norna theme preset.
---

# Theme preset comparison

Every preset example renders this same content and the same images. Differences
between the examples therefore come from the selected preset rather than from
different editorial material or page structure.

## Preset purpose {#preset-purpose}

A theme preset coordinates typography, spacing, colors, corners, image sizing,
section backgrounds, and reader controls. The source below uses no visual
overrides, so the preset remains responsible for the complete presentation.

The comparison includes prose, hierarchy, notes, code, images, captions,
carousel controls, and cards.{note-ref}

{note: Presets also coordinate margin-note width, alignment, and the narrow-screen fallback.}

## Reading rhythm {#reading-rhythm}

Comfortable reading depends on more than font choice. Text width, line height,
heading scale, and vertical spacing need to work together at both wide and
narrow viewports.

### A smaller heading

This subsection shows how a preset distinguishes the page title, section
heading, smaller heading, and body text. It also includes a few common inline
elements: a [normal link](https://example.com/), `inline code`, and **strong
text**.

#### Practical details

- A concise list item.
- A longer item that wraps when the reading width becomes narrow.
- A command shown in a code block.

```sh
npm run norna:check
npm run norna:build
```

## Images and captions {#images-and-captions}

The same image stack reveals how much room a preset gives to media, how it
spaces consecutive images, and how captions relate to the surrounding prose.
The selected preset supplies either `prose-aligned`, which starts media at the
body-text edge, or `centered-fit`, which centers and height-limits the media.

```norna-image-stack
- image: grass-puppy.jpg
  alt: A puppy standing in green grass.
  caption: Puppy in grass. Photo by Bicanski, CC0, via Pixnio.
- image: grey-street-dog.jpg
  alt: A grey dog standing on a paved street.
  caption: Grey dog on pavement. Photo by Bicanski, CC0, via Pixnio.
- image: boxer-portrait.jpg
  alt: A brown boxer-type dog looking at the camera.
  caption: Brown dog portrait. Photo by Bicanski, CC0, via Pixnio.
```

## Carousel controls {#carousel-controls}

These simple diagrams keep the source constant while exposing the preset's
media constraints, caption styling, and carousel chrome.

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

## Cards and surfaces {#cards-and-surfaces}

Cards combine typography, spacing, corners, links, and bounded surfaces. This
list also makes the preset's relationship between prose width and structured
content visible.

```norna-card-list
layout: image-left
flow: grid
size: m
width: normal

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
