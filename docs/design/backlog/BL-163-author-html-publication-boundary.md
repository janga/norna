# BL-163: Author HTML Publication Boundary

## Purpose

Decide and document Norna's trust boundary for HTML authored in `content.md`.
BL-161 found that a production build retains an authored `<script>`, form,
custom element and arbitrary attributes in its static output. This is a
publication and security question, separate from choosing authoring syntax.

**Status: Needs evidence and decision.** Norna currently permits useful HTML,
including native `<details>`. The owner has not requested an HTML ban. Do not
change the parser or promise sanitization as part of this brief.

## Questions To Resolve

1. Which sources may be treated as trusted authorship in Norna's intended
   workflow? Are imported or third-party Markdown files in scope?
2. Which authored HTML is emitted by content checking, local preview and a
   production build? Test scripts, event-handler attributes, URL-bearing
   attributes, forms and custom elements in representative contexts.
3. What risks arise when a site owner publishes untrusted Markdown or accepts
   contributions, and which safeguards or warnings belong to Norna rather
   than the deployment host?
4. How can any chosen boundary preserve useful HTML such as `<details>` and
   the owner's preference against a blanket ban?

## Ready For Implementation When

- The intended trust model and affected author workflows are explicit.
- Current behavior and risks are verified independently of an assumed fix.
- The owner approves a scoped policy and its consequences for existing sites,
  documentation and tests.
