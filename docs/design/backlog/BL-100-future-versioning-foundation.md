# BL-100: Future Versioning Foundation

## Purpose And Status

Define the minimum shared model that lets future Norna documentation identify
which instructions, configuration, commands, and migration guidance belong to
which product version.

**Needs design; not implementation-ready.** This is the prerequisite design
record for versioned documentation and version-aware lifecycle features.

## Scope And Boundaries

This item decides version identity and lifecycle boundaries. It does not build
a selector, copy documentation trees, or introduce a release process.

## Decisions Made

- Documentation versions represent meaningful differences in instructions or
  behavior, not every patch release or editorial correction.
- A versioned documentation branch can coexist with a shared site home and
  product content; the whole site does not need to be copied per version.
- A reader remains in the selected documentation version for navigation,
  search, and ordinary internal links.
- A version switch opens the corresponding page when it exists. Otherwise it
  opens the destination version's start page with clear fallback feedback.
- Historical documentation must not be silently changed by a move or other
  structural command targeting another version.

## Preliminary Proposals

- A version may be represented by an ordinary source directory containing a
  documentation page tree. This needs comparison against the final URL and
  author workflow before it becomes an author contract.

## Open Questions

1. What stable version identifier, display label, and supported-version policy
   does Norna use?
2. What source and URL boundaries distinguish the shared site, the
   documentation branch, and individual versions?
3. How are search, sitemap, canonical metadata, redirects, and assets
   partitioned by version?
4. How do version identity and page identity compose with future language
   variants?
5. Which operations create, retire, correct, move, or alias content within a
   version, and which must refuse an ambiguous target?

## Dependencies

[`BL-025` Versioned Documentation](BL-025-versioned-documentation.md) turns
this foundation into a user-facing authoring and reader model. `BL-101`
Deprecation Status depends on both records.

## Ready For Implementation When

- The open questions have approved first-scope answers.
- `BL-025` can specify a minimal two-version fixture without inventing source
  or URL rules.
- The model states how it will compose with, or deliberately precede,
  `BL-023` multilingual page trees.
