# BL-061: Image Inspection For Detailed Media

## Outcome

A reader can inspect a detailed diagram, screenshot, or other managed image at
a useful size without losing their place in the page. Norna supplies the
behavior automatically when the inspection view can make the image materially
larger; authors do not add another Markdown option.

The first implementation applies only to images in `image-stack`. Card images
are supporting content rather than primary inspection targets, while carousel
slides already combine swipe, keyboard, and button interactions and require a
separate interaction decision.

## User Problem

Norna fits images to the available reading or media area. That protects the
page layout, but it can make labels in technical diagrams and screenshots too
small to read. Browser zoom enlarges the complete interface, and manually
opening a generated image URL is not discoverable.

The problem is analogous to a long table losing its headings: fitting the
content into the page removes information the reader needs for inspection.
The remedy should affect the exceptional content rather than make the whole
page wider or horizontally scrollable.

## Interaction Contract

- Keep the normal inline image, caption, responsive sources, and surrounding
  layout unchanged.
- Make the image a real link to its published original. This is the complete
  no-JavaScript fallback and allows normal browser features such as opening the
  target in another tab.
- With JavaScript, show a restrained inspection affordance only when the image
  can be rendered materially larger in the available viewport.
- Activating the image by pointer, touch, or keyboard opens a native modal
  `dialog` containing the image and its caption.
- Open in fit-to-viewport mode. Offer one control to switch between fitted and
  actual-size presentation; actual-size overflow remains inside the inspector.
- Keep an explicit Close control available, support `Escape`, and restore focus
  to the triggering image link after closing.
- Preserve browser zoom and touch magnification. Do not make the document
  itself scroll horizontally.
- Use existing palette, focus-indicator, corner, and control tokens. Do not add
  a theme option in the first implementation.
- Respect reduced-motion preferences and do not require an opening animation.

## Detection

Determine usefulness from rendered geometry after the image is available. The
affordance is justified when the inspection viewport can enlarge either image
dimension by a meaningful threshold. This works for raster screenshots and
scalable diagrams without guessing from filenames or alt text.

Detection controls only the enhanced affordance. The static original-image
link remains valid regardless of JavaScript or viewport size.

## Accessibility

- Give the image link and inspector controls localized accessible names.
- Retain the image's existing alternative text and associate the existing
  caption with the inspected image.
- Use `showModal()` rather than recreating modal semantics with generic
  elements.
- Verify keyboard opening, focus placement, focus containment, explicit and
  `Escape` closing, and focus restoration.
- At 320 CSS pixels and at browser zoom up to 400 percent, keep all controls
  reachable and confine any required two-dimensional movement to the image
  inspector.

## Acceptance Criteria

- A detailed `image-stack` image that becomes materially larger in the
  inspector exposes a visible pointer, touch, and keyboard affordance.
- An image that cannot become meaningfully larger does not gain decorative or
  misleading inspection chrome.
- Without JavaScript, activating the image opens its published original.
- With JavaScript, the image opens in a native modal inspector and supports
  fitted and actual-size viewing.
- The caption and alternative text remain correctly associated in both normal
  and inspected presentation.
- Closing by button or `Escape` returns focus to the image link.
- Neither mode creates document-level horizontal overflow.
- Raster and SVG examples pass desktop, mobile, keyboard, no-JavaScript, 200
  percent text zoom, and 400 percent browser zoom checks.
- Existing card and carousel behavior remains unchanged.

## Dependencies And Risks

Norna already publishes an original form of each managed image, so no image
pipeline or authoring-model change should be necessary. The feature adds
page-local client JavaScript only when an inspectable image exists.

The principal risks are an affordance that is too prominent for photographic
sites, focus errors in the modal, conflicts with linked images, and accidental
two-dimensional page scrolling. Keep the first scope automatic, visually
restrained, and limited to `image-stack`; expand it only after representative
sites demonstrate a need.

## References

- [Material for MkDocs: Images](https://squidfunk.github.io/mkdocs-material/reference/images/)
  presents lightbox enlargement as an established documentation-image pattern.
- [MDN: The dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
  documents native modal behavior and its focus and closing requirements.
- [W3C: Understanding Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow)
  explains why two-dimensional movement should remain confined to graphics or
  other content that requires it rather than affecting the complete page.
