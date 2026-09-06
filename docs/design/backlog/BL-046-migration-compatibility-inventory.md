# BL-046: Migration Compatibility Inventory

## Outcome

Norna has a dated, evidence-based inventory of documentation features that
need translation when content moves from established static documentation
systems into Norna.

## Scope

- Establish the current Norna baseline from repository code and canonical
  documentation rather than from the previous market comparison.
- Review Docusaurus, VitePress, MkDocs including Material for MkDocs, and Astro
  Starlight as the primary documentation systems.
- Include Hugo, Eleventy, Zola, Lume, and Jekyll only where their documented
  authoring or publishing models create a relevant migration case.
- Distinguish exact support, partial support, an alternative Norna model,
  missing support, and deliberately out-of-scope behavior.
- Separate a loss-minimizing migration rewrite from a possible native Norna
  feature. A common competitor feature is not automatically a Norna feature.

## Deliverable

Record a private `Documentation Migration Compatibility` study with:

- the Norna version and commit reviewed, review date, source boundaries, and
  representative official source links;
- a priority table covering migration loss, simple handling, better handling,
  Norna fit, migration priority, product priority, and implementation cost;
- concrete before-and-after syntax for every material Markdown construct;
- a minimum migration compatibility target and an ordered shortlist;
- explicit deferrals for capabilities that would require a different content
  or extension model.

Create separate backlog items only where the evidence supports a concrete
product feature, migration rule, or regression corpus.

## Acceptance Criteria

- Every claimed competitor capability links to current official documentation.
- Current Norna support is verified against code, tests, or canonical reference
  documentation.
- Simple handling preserves information even when interaction or visual
  presentation is reduced.
- Better handling states an author-facing contract rather than only naming a
  component to build.
- Priorities reflect migration frequency and loss, not feature-list parity.
- The inventory item is removed from `BACKLOG.md` when the report and justified
  follow-up items are complete.
