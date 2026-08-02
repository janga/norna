---
title: Local Dog Gallery
description: A small cli-gallery example with free dog images.
defaultPresentation:
  backgroundColor: "#000000"
  textColor: "#ffffff"
  heading:
    align:
      desktop: left
      mobile: left
    size: medium
  body:
    align:
      desktop: left
      mobile: left
    size: medium
notices:
  - id: summer-demo-notice
    title: "Temporary dog note"
    text: "This notice links to a temporary section and disappears after August."
    href: "#summer-dogs"
    visible:
      from: "2026-08-01"
      until: "2026-09-01"
sections:
  - id: black-dogs
    presentation:
      heading:
        size: large
    gallery:
      - image: photo-of-a-black-dog.jpg
        alt: "A black dog sitting outdoors and looking at the camera."
        caption: "Photo of a dog. ContaDeletada2906, CC0 1.0, via Wikimedia Commons."
      - image: black-puppy-meadow.png
        alt: "A black puppy standing in a grassy meadow and looking at the camera."
        caption: "AI-generated image."
  - id: summer-dogs
    visible:
      from: "2026-08-01"
      until: "2026-09-01"
    presentation:
      backgroundColor: "#181818"
    gallery: []
  - id: brown-dogs
    gallery:
      - image: brown-dog.jpg
        alt: "A brown dog looking directly at the camera."
        caption: "DogBrown. Frank-3, CC0 1.0, via Wikimedia Commons."
      - image: dog-accompanies-master.jpg
        alt: "A man walks outdoors with a dog at his side."
        caption: "Dog accompanies his master. Steve Hillebrand, U.S. Fish and Wildlife Service, public domain."
  - id: golden-dogs
    gallery:
      - image: golden-retriever.jpg
        alt: "A golden retriever standing outdoors."
        caption: "Golden Retriever. Ribo, public domain, via Wikimedia Commons."
      - image: toller-puppy.jpg
        alt: "A young Nova Scotia Duck Tolling Retriever puppy sitting on grass."
        caption: "Nova Scotia Duck Tolling Retriever puppy. RM, public domain, via Wikimedia Commons."
  - id: white-dogs
    gallery:
      - carousel:
          - image: white-cute-dog.jpg
            alt: "A white dog looking toward the camera."
            caption: "White cute dog. Neal Ziring, public domain, via Wikimedia Commons."
          - image: white-puppy-garden.png
            alt: "A fluffy white puppy standing on grass in a garden."
            caption: "AI-generated image."
  - id: sources
    presentation:
      backgroundColor: "#000000"
---

## Black Dogs {#black-dogs}

Black-coated dogs from the local cli-gallery development collection.

## Summer Dogs {#summer-dogs}

This temporary section is visible during August 2026. It is here to demonstrate
date-controlled sections and notices in the local dog gallery.

## Brown Dogs {#brown-dogs}

Brown dogs provide a second gallery section for local navigation checks.

## Golden Dogs {#golden-dogs}

Golden-coated retrievers add a third gallery section and more scrolling depth.

## White Dogs {#white-dogs}

A white dog completes the colour-based gallery sequence.

## Sources {#sources}

Most images are sourced from Wikimedia Commons pages that list CC0 or public-domain licensing:

- [Photo of a dog](https://commons.wikimedia.org/wiki/File:Photo_of_a_dog.jpg)
- [Smiling dog](https://commons.wikimedia.org/wiki/File:Smiling_dog.jpg)
- [DogBrown](https://commons.wikimedia.org/wiki/File:DogBrown.jpg)
- [Dog accompanies his master](https://commons.wikimedia.org/wiki/File:Dog_accompanies_his_master.jpg)
- [Golden Retriever](https://commons.wikimedia.org/wiki/File:Golden_Retriever.jpg)
- [Toller pup7wks2](https://commons.wikimedia.org/wiki/File:Toller_pup7wks2.JPG)
- [White cute dog](https://commons.wikimedia.org/wiki/File:White_cute_dog.jpg)

The black and white puppy images are AI-generated.
