# BL-042: Examples Audit And Teaching Structure

## Outcome

The Examples area gives readers a clear, attractive overview of what Norna can
produce and lets them choose a complete site or focused demonstration for a
specific question. Every example has a distinct teaching purpose, uses current
behavior, and leads to source and reference material without becoming a second
reference manual.

## Dependency

Complete [`BL-041` Beginner-First Getting Started Audit](BL-041-getting-started-audit.md)
first. Examples should reinforce the beginner path and take over demonstrations
that would otherwise make Getting Started long or repetitive.

## Required Inventory

Before editing, inventory and compare:

- the complete documentation-site Examples subtree and every example linked or
  embedded elsewhere on that site;
- all complete sites, feature demos, their READMEs, configuration files,
  content, media, and published-example links under `examples/`;
- starter projects and their sample content where they overlap with examples;
- every canonical Markdown reference and root-level introduction that contains
  example syntax, screenshots, diagrams, or links to demonstrations;
- local or intentionally excluded Norna-format demonstration and analysis
  sites present in the working tree, including useful material that is not
  reproducible from a fresh clone;
- current implementation, schemas, and tests when an example's claimed result
  or supported syntax is uncertain.

Create a matrix that maps each example to its audience, question, Norna
capabilities, source directory, rendered destination, canonical reference, and
automated coverage. Mark duplicate demonstrations, uncovered capabilities,
stale syntax, broken destinations, and examples that mix too many unrelated
ideas.

## Teaching Structure

Keep these roles distinct:

- **Complete sites** show coherent outcomes and how several features work
  together in a realistic small site.
- **Feature demonstrations** isolate one bounded capability or an interaction
  that benefits from direct visual comparison.
- **Getting Started examples** are the minimum copyable steps needed to finish
  the introductory path.
- **Reference examples** specify syntax and constraints; they are authoritative
  but need not be visually promotional.
- **Analysis prototypes** may supply ideas or assets, but are not presented as
  supported examples unless they are maintained and tested like the others.

Prefer one strong example for each reader question. Retain multiple examples
only when their contrast teaches something explicit, such as single-page and
hierarchical navigation or the same representative content under different
presets.

## Review Questions

- Can a visitor tell from the Examples landing page what each destination will
  demonstrate and whether it is a complete site or a focused feature demo?
- Are the range and limits of current Norna capabilities visible without
  presenting a raw feature inventory?
- Can a reader move from rendered result to relevant source and exact reference
  documentation with descriptive links?
- Do examples distinguish preset-owned defaults, site or page overrides,
  Markdown content, site-wide content, and generated behavior?
- Do screenshots and illustrations still match the generated sites, and does
  each visual remain legible and useful on desktop and mobile?
- Are important nonvisual behaviors explained in prose rather than implied by
  an image alone?

## Acceptance Criteria

- The inventory covers every tracked example, documentation example, starter,
  and relevant local Norna-format demonstration available during the audit.
- Every retained example has one stated teaching purpose, intended audience,
  maintained source location, and clear classification.
- The Examples hierarchy exposes the important demonstrations directly enough
  that readers do not have to inspect repository directories to discover them.
- Complete-site and feature-demo introductions explain what to notice without
  repeating canonical configuration or syntax reference.
- Every public rendered-example link resolves, and every source link identifies
  the maintained example rather than generated output.
- Examples use current file names, commands, Markdown blocks, page structure,
  presets, and configuration. Any intentional edge case is labelled as such.
- Duplicate or obsolete examples and assets are removed or given a distinct,
  documented purpose; useful unique information is relocated before removal.
- Each tracked example passes the example build suite, documentation links pass,
  and representative desktop and mobile output receives human visual review.
- Accessibility-relevant meaning remains available in text when a demonstration
  relies on layout, color, interaction, or imagery.

If the inventory exposes a missing engine feature, record it separately rather
than simulating it in an example.
