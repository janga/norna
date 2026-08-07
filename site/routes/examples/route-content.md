---
title: Examples
description: Runnable examples included with Norna.
navigation:
  label: Examples
  order: 30
sections:
  - id: dog-gallery
    presentation:
      typography:
        preset: statement
  - id: starter
---

## Dog example {#dog-gallery}

The local visual demo lives in:

```text
examples/dog-gallery/site/
```

It demonstrates a small multi-page Norna site with:

- route navigation;
- section navigation;
- image rows;
- a carousel;
- temporary section visibility;
- theme and typography overrides;
- public static files.

From the engine repository, the demo commands point at this example:

```sh
npm run dev:local
npm run demo:build
```

## Starter {#starter}

The starter copied by `norna init` lives in:

```text
starters/basic/
```

It is intentionally smaller than the demo. Use the starter for a new real site;
use examples when you want to inspect a feature in context.
