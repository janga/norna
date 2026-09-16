# BL-025: Versioned Documentation

## Purpose And Status

Let a documentation site publish a small set of materially different document
versions without duplicating unrelated site content or sending readers and
search across versions unexpectedly.

**Deferred; design not complete.** This record captures decisions already
made about the reader model. It does not yet define source paths, URL syntax,
or implementation work.

## Scope And Boundaries

Versioning applies to a documentation branch of a Norna site. The shared site
home, product pages, and other non-versioned content remain common rather than
being copied into every documentation version.

Create a version for significant differences in instructions, behavior, or
supported product capability. Do not create a documentation version for every
patch release or ordinary wording correction. Keep maintained versions few.

This item does not introduce multilingual editorial content, arbitrary release
automation, automatic source migration, or a new general content model.

## Decisions Made

- A selected version is a reader context. Internal documentation links and
  search must remain within that version unless an author deliberately links
  elsewhere.
- When a reader changes version, Norna opens the corresponding page when that
  page exists in the destination version. Otherwise it opens that version's
  documentation start page and makes the fallback clear.
- `page:move` and related structural commands must not silently rewrite a
  historical documentation version while operating on another version.
- Versioned documentation concerns meaningful instruction and behavior
  differences, not a release-by-release archive.
- Future language publishing and versioning must share a coherent page identity
  model. Neither capability may make a reader fall into another language or
  version without an explicit documented fallback.

## Preliminary Proposals

- Represent a documentation version as an ordinary, self-contained copy of a
  documentation page tree in the source directory. This is a possible simpler
  model than generator-specific version copies, but the directory and URL
  conventions are undecided.
- Keep version-specific assets with the version that owns them. Shared asset
  lookup, if any, must be explicit rather than inferred from a different
  version.
- Use a visible version selector only when more than one documentation version
  is published. Its placement and mobile behavior are not decided.

## Open Questions

1. What source directory and URL structure identify the documentation branch,
   each version, and its start page?
2. What version identity does an author configure: a release string, a human
   label, both, or another stable identifier?
3. Which version is the default reader destination, and how are unversioned
   documentation URLs handled?
4. How are version-specific category labels, site-wide elements, redirects,
   search indexes, sitemaps, canonical metadata, and `hreflang` alternatives
   represented?
5. Which version-specific links may intentionally cross to another version,
   and how are accidental cross-version links diagnosed?
6. What operational workflow creates, retires, and corrects a version without
   requiring every correction to be copied to all versions?
7. How do source-editing commands identify the intended version and refuse an
   ambiguous operation?

## Dependencies

- [`BL-100` Future Versioning Foundation](BL-100-future-versioning-foundation.md)
  must settle version identity, lifecycle policy, and source/URL boundaries.
- [`BL-023` Multilingual Sites With A Shared Page Tree](BL-023-multilingual-sites-shared-page-tree.md)
  is a coordination dependency, not a delivery-order dependency: both models
  must agree on how language and version identify the same logical page.
- [`BL-101` Deprecation Status](BL-101-deprecation-status.md) depends on this
  model for meaningful replacement and lifecycle context.

## Ready For Implementation When

- Every open question has an approved first-scope answer or explicit
  exclusion.
- A minimal two-version fixture proves direct URLs, version-local navigation,
  search isolation, version switching, fallback to a version start page, and
  `page:move` isolation.
- The public documentation explains the author workflow and reader behavior
  without treating versioning as a general release archive.
