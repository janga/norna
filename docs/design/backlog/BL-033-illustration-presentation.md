# BL-033: Illustration-Aware Managed Image Presentation

## Outcome

Norna can present explanatory images according to their reading purpose instead
of applying geometry intended for photographs and artwork. A diagram, annotated
screenshot, file-tree map, or chart should align predictably with the document,
keep its text readable, and remain usable on a small screen without requiring
author CSS or arbitrary pixel values.

Artistic images retain their existing behavior. They may use the available
media width, preserve their intrinsic proportions, stay within a useful portion
of the viewport, and remain centered when narrower than their image frame.

## Evidence

`BL-032` provides the first concrete case. Its portrait file-tree diagram is
rendered inside a media frame that starts at the prose edge and is wider than
the prose column. The existing viewport-height limit makes the image narrower
than that frame, after which the normal centering rule makes it appear shifted
to the right.

Changing the SVG to a landscape format would conceal the product-level issue.
The relationship being explained naturally benefits from a taller diagram, and
its text should determine whether it remains useful rather than its aspect
ratio determining how it is aligned.

## Model To Evaluate

Use an explicit semantic purpose on a managed image. Do not infer it from SVG,
PNG, JPEG, filename, dimensions, or aspect ratio. Each of those formats and
shapes can contain either artwork or explanatory material.

The working syntax for design discussion is:

```yaml
- image: getting-started-file-map.svg
  purpose: explanatory
  alt: The Getting Started file tree mapped to the rendered navigation.
  caption: Page directories become the navigation and page shown below.
```

`purpose: explanatory` is a candidate name, not an approved public field. It is
preferable to `illustration` as a first working term because illustrations can
also be artistic. A terminology review must confirm the final field and value.

The purpose belongs to the Markdown reference rather than the source file. The
same image could legitimately be used as explanatory material in one context
and as decorative or editorial media in another.

## Recommended First Contract

The first implementation should remain narrow:

- support one explicit explanatory purpose in `norna-image-stack` entries;
- preserve the existing behavior when the purpose is omitted;
- align explanatory images with the start of the reading column;
- size them from available inline width rather than the artwork-oriented
  viewport-height limit;
- never crop or distort them;
- use the full available content width on small screens;
- keep captions on the same inline axis as the image;
- require useful alt text for an explanatory image;
- require no client-side JavaScript for rendering;
- apply the rule consistently to supported raster images and SVG.

The initial preset decision should be semantic rather than numeric. A
documentation-oriented preset can default explanatory images to the reading
column, while an explicit bounded choice may allow a complex diagram to use the
wider media column. Do not expose raw widths solely to repair one diagram.

Support in carousels and cards should follow only after the stack behavior has
been tested. A carousel can contain a sequence of instructional diagrams, but
adding the purpose everywhere at once would enlarge the first implementation
and blur component-specific accessibility requirements.

## Decisions Required

1. **Public terminology.** Decide whether the syntax should express
   `purpose: explanatory` or another semantic term. Avoid format-oriented names
   such as `svg`, visual instructions such as `align: left`, and ambiguous
   labels such as `illustration`.
2. **Default explanatory width.** Choose between the reading column and the
   wider media column. The reading column gives the strongest alignment and
   mobile predictability; wider diagrams may need one named exception.
3. **Original-size access.** Decide whether Norna should provide an ordinary
   link for opening a complex image at its intrinsic size. This can improve
   access without introducing a JavaScript lightbox, but requires localized UI
   text and a clear keyboard contract.
4. **Scope.** Confirm that the first release applies only to image stacks, with
   carousel and card behavior evaluated separately.
5. **Accessibility threshold.** Define what Norna can validate automatically
   and what remains an authoring rule. Norna can require alt text and test
   clipping, but cannot reliably determine whether text drawn inside an image is
   legible or fully represented in nearby prose.

## Alternatives

### Keep One Image Model

Authors could redesign every explanatory image to fit the existing image
geometry or add page-level image-width overrides. This keeps the product small,
but makes document layout depend on artificial canvas proportions and changes
all images on the page rather than the image whose purpose differs.

### Infer From File Format Or Ratio

Treating SVG or portrait media as explanatory would require no new Markdown.
It is not reliable: logos and artwork are often SVG, screenshots are often PNG,
and diagrams can be landscape. The inference would eventually need exceptions.

### Add A Separate Diagram Block

A `norna-diagram` block could own its layout directly. It would duplicate image
references, captions, alt text, validation, sync, and responsive output already
provided by managed images. A semantic image purpose is the smaller model unless
future diagram behavior becomes substantially richer.

### Add Arbitrary Alignment And Width

Fields such as `align`, `width`, and `maxHeight` would solve the immediate case.
They expose implementation details, increase combinations across presets and
reader widths, and ask authors to design layouts manually. They conflict with
Norna's opinionated model and should not be the normal solution.

## Architecture Impact

A first implementation would affect:

- Norna image-block parsing and diagnostics;
- the resolved managed-image model;
- image stack markup and semantic CSS classes;
- theme or preset resolution if a named explanatory width is introduced;
- Markdown and editor completions for the new field;
- content checks for required explanatory alt text;
- browser tests across navigation, reader-width, and focus-reading states;
- canonical image and theme documentation.

It should not require changes to raster generation, cache-busting, image sync,
or SVG copying. Those systems operate on the source asset; this feature changes
how the resulting image is laid out.

## Acceptance Criteria

- Explanatory and artistic images can coexist on one page without page-wide
  overrides.
- A portrait explanatory image does not appear accidentally right-shifted
  because of an artwork-oriented height limit.
- Explanatory media, its caption, and adjacent prose use documented alignment
  axes at Narrow, Standard, and Wide reader widths.
- The image remains inside the viewport at 320 CSS pixels and at 200 percent
  text zoom.
- Tree, top, section, and no-navigation layouts produce predictable geometry.
- Focus reading does not change the image's semantic width or move the current
  reading position unexpectedly.
- Light, Dark, forced-colors, reduced-motion, keyboard-only, and no-JavaScript
  behavior remain usable.
- Meaning is available in surrounding text or alt text and never depends only
  on labels, arrows, or color inside the image.
- Existing photographs and artwork retain their current rendering.
- `BL-032` uses the resulting contract without aspect-ratio padding or a
  one-off CSS selector.

## Test Plan

Create one representative page containing:

- a portrait explanatory SVG;
- a landscape explanatory raster screenshot;
- a portrait photograph;
- a landscape artwork image;
- captions and surrounding prose;
- tree navigation and reader Display controls.

Verify computed inline origins and widths in browser tests rather than relying
only on screenshots. Capture desktop and mobile reference images for human
review, and retain a no-JavaScript rendering assertion.
