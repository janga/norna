# Reader understanding for the reference pilots

Working notes for [BL-117: Canonical web reference](backlog/BL-117-canonical-web-reference.md),
using the revised [reference prompt](documentation-style-guide.md#reusable-reference-prompt).
These notes are not part of the public reference.

## Appearance

- Question: Where do I set light/dark appearance, and when does it apply?
- Assumed knowledge: editing a YAML file in a Norna site, not theme inheritance.
- Missing concepts, in order: site-wide file; `appearance.default`; three
  values; the reader's independent choice in Display; persistence and reset.
- Main rule: the reader's choice wins; System follows the device; otherwise
  the site default applies.
- Boundary: no preset discussion, palette matrix or generic invalid-value
  table. The no-JavaScript limit stays because it changes the result.

## Sidenotes

- Question: How do I attach notes to a paragraph, and where will they appear?
- Assumed knowledge: ordinary Markdown in `content.md`, not footnote syntax.
- Missing concepts, in order: paired reference and definition; matching name;
  visible letters; multiple notes; allowed content; responsive placement.
- Main rule: short paragraph notes appear in the margin when there is room,
  otherwise after their paragraph.
- Boundary: exact valid syntax, one-reference constraint and layout effects
  remain. Repetitive diagnostic rows are replaced by positive rules and a
  brief check-command description.

## page:move

- Question: What will a move change, and how can I inspect it before writing?
- Assumed knowledge: terminal use and page folders, not aliases or repair of
  relative links after a manual move.
- Missing concepts, in order: preview default; aliases; concrete old/new paths;
  `--write`; options and ordering; link coverage; manual moves; recovery limits.
- Main rule: the command previews a folder move and link updates; `--write`
  applies a newly checked plan.
- Boundary: retain consequential refusal and recovery cases. Explain the
  metadata layout with a concrete example before describing alias-insertion
  constraints. Do not offer a general YAML lesson or duplicate creation help.

## URLs and links

- Question: How do I link to a page and keep an old URL working without moving
  its page directory?
- Assumed knowledge: ordinary Markdown links, not Norna's site-relative paths,
  base path, or page metadata.
- Missing concepts, in order: page directory URL; site-relative link; section
  fragment; base-path omission; alias target; alias limits; host behavior;
  when a page move is the better operation.
- Main rule: an alias is an old site-relative URL attached to the current page;
  use `page:move` when the page directory itself must change.
- Boundary: this page does not repeat move preview, recovery, or structural
  validation rules. It links to `page:move` for those details.

## Completeness and destinations

Checked against `scripts/lib/schema-definitions.mjs`,
`src/lib/readerPreferencesScript.mjs`, `scripts/lib/markdown-notes.mjs`,
`scripts/move-site-page.mjs` and `scripts/lib/page-move-plan.mjs`.

The Appearance entry no longer carries cookie implementation attributes.
Preserve these in the planned Display and preferences reference: cookie
`norna-appearance`; accepted values; one-year lifetime; `SameSite=Lax`; base-path
scope; `Secure` on HTTPS; invalid values fall back to the default; browser
policy can prevent persistence; overlapping paths do not provide isolation.
Semantic callout color ownership belongs with callouts/palettes, not Appearance.
These facts are deferred to their named destinations, not withdrawn contracts.

The owner subsequently approved the full rewrite. These notes preserve the
reasoning behind the moved pilots; their prose now belongs to the canonical
reference tree. Technical example tests do not establish editorial usability.
