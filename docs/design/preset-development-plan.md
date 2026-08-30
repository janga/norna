# Preset Development Plan

This document plans the transition from repeated complete theme definitions to
profile-based preset recipes. It applies the principles in
[Preset Design Guide](preset-design-guide.md).

It is an implementation plan, not a description of released behavior.

## Goals

- Make `preset: <purpose>` sufficient for a coherent, accessible site.
- Give site owners a small set of understandable direction choices.
- Give readers useful personal display choices without weakening site identity.
- Make built-in presets visually distinct through purpose-driven decisions.
- Reduce repeated definition, testing, and visual-tuning work.
- Organize implementation into long, self-contained work packages with few
  product-owner interruptions.

## Constraints

- Backward compatibility is not a goal when it conflicts with a simpler model.
- Navigation semantics and information architecture do not belong to presets.
- Core accessibility cannot be disabled by a theme or reader preference.
- Raw public overrides are exceptional, not the normal customization model.
- Custom fonts and user-defined presets remain deferred until the built-in
  profile contract is stable.
- Broad example and public-documentation migration follows manual
  proof-of-concept approval.

## Decision Ownership

Work should be divided so the product owner retains meaningful control without
having to make low-level design decisions.

### Product-Owner Decisions

The product owner decides:

- which common site purposes deserve a built-in preset;
- the public preset name;
- the audience and primary task;
- no more than three desired identity words;
- which of two or three rendered directions best fits that purpose;
- whether the proof of concept is ready for migration.

### Implementation Decisions

The implementation may determine autonomously:

- numeric type, spacing, width, and radius scales;
- semantic color-role values and contrast corrections;
- responsive collapse behavior;
- component state derivation;
- accessible Display-panel behavior;
- test fixtures, automated assertions, and diagnostic wording;
- internal refactoring and profile representation.

Raise a new product decision only when alternatives materially change a
preset's purpose, identity, or public control surface.

## Target Architecture

Theme resolution should become a deterministic pipeline:

```text
engine contract
    + internal profile library
    + built-in preset recipe
    + safe site-owner overrides
    + reader display preferences
    -> resolved semantic tokens and layout values
```

Reader preferences are applied at runtime within bounds supplied by the
resolved theme. They do not rewrite `theme.yaml`.

## Work Phases

Progress:

- Phase 0 completed in commits `5e84890` and `8a6bed7`.
- Phase 1 completed in August 2026. Its implemented invariants are recorded in
  [Presentation Engine Contract](presentation-engine-contract.md).
- Phase 2 completed in August 2026. Built-in presets now resolve from internal
  profiles while retaining the previously captured theme values and rendered
  output.
- Phase 3 is the next implementation phase and requires approval of its public
  reader-control syntax before implementation.

### Phase 0: Record And Protect The Baseline

Historical audit: [Historical Preset Inventory](preset-current-inventory.md) and
[Preset Visual Baselines](../../tests/preset-baselines/README.md).

Before changing resolution behavior:

1. commit or otherwise isolate the current working state;
2. inventory every current preset value and its consumers;
3. identify duplicated values and values that differ without an intentional
   design reason;
4. record existing screenshots for representative desktop and mobile pages;
5. record current light/dark and component-state behavior;
6. classify every public override as retain, replace with a named choice,
   internalize, or remove.

Deliverables:

- a machine-readable or tabular preset-value inventory;
- a mapping from current fields to target profile categories;
- baseline screenshots and test results;
- no intended visual change.

This phase can be completed as one uninterrupted analysis pass.

### Phase 1: Define The Engine Contract

Implement and test the invariant layer before redesigning a preset:

- semantic color roles;
- shared component states;
- universal focus treatment;
- typography ordering and safe line-length bounds;
- spacing-scale rules;
- target-size, zoom, reflow, reduced-motion, and forced-color behavior;
- rules for reader-preference overlays.

Add automatic checks for every allowed semantic color pairing rather than only
checking a small number of rendered pages.

Deliverable: an engine-owned accessibility and derivation contract that is
independent of preset identity.

This is a long autonomous implementation pass. Product input is required only
if enforcing the contract removes a currently desired visual behavior.

### Phase 2: Extract The Internal Profile Library

Create internal definitions for:

- color systems;
- typography systems;
- rhythm;
- geometry;
- media emphasis;
- corner treatment;
- surface patterns.

Initially express the current presets through these profiles while preserving
their current output as closely as practical. This separates architectural
refactoring from deliberate redesign.

The resolver should:

1. select a built-in recipe;
2. expand its profiles;
3. apply safe root overrides;
4. apply permitted page-local overrides;
5. validate the final combination;
6. expose resolved values to rendering and diagnostics.

Deliverables:

- profile definitions and resolver;
- compact recipes for all current presets;
- tests proving complete resolution for root and page themes;
- an updated reference export generated from resolved values.

Commit the resolver separately from later visual tuning.

Implementation:

- `scripts/lib/theme-profiles.mjs` owns immutable color, typography, rhythm,
  geometry, media, corner, and surface profiles;
- `scripts/lib/theme-presets.mjs` expresses each built-in preset as a compact
  recipe and expands it before applying public overrides;
- `tests/preset-baselines/resolved-themes.json` locks every resolved preset
  value independently of the implementation;
- the existing screenshot baselines remain unchanged after the refactor.

### Phase 3: Implement Reader Display Preferences

Implement one Display control with these initial settings:

- color mode: System, Light, Dark;
- reading width: Narrow, Standard, Wide;
- focus reading: Off, On;
- reset to defaults.

Decide the exact root-theme syntax for enabling controls only after the profile
bounds exist. The likely conceptual grouping is:

```yaml
preset: documentation
readerControls:
  colorMode: true
  readingWidth: true
  focusReading: true
```

The final names may change after schema review.

Implementation requirements:

- one discoverable navigation control rather than several permanent buttons;
- native grouped controls and explicit labels;
- keyboard open, close, focus, and reset behavior;
- persistent preferences scoped to the site's base path;
- no assistive-technology detection;
- no hidden focusable navigation in focus-reading mode;
- a clear route back to normal navigation;
- a usable configured default without JavaScript.

Test the Display control against every profile category before final tuning of
the first preset. This avoids designing a preset around only one reader state.

Implementation checkpoint (2026-08-29): the reader-preference overlay and
accessible Display panel are implemented as a proof of concept. `documentation`
and `project` offer all three controls by default; `portfolio` and `statement`
offer color mode only. Browser tests cover persistence, reset, focus-reading,
text-width changes, keyboard closing, reflow, and the no-JavaScript default.
Public reference documentation and the runnable presentation example use the
approved theme terminology.

### Phase 4: Design The Documentation Preset

Use `documentation` as the first complete proof of concept because it exercises
long prose, code, navigation, notes, diagrams, cards, and nested pages.

#### Decision 1: Purpose And Audience

Confirm a short brief covering:

- developer and technical-documentation readers;
- sustained reading and quick reference lookup;
- desktop use with strong mobile support;
- shallow and nested page structures;
- prose, code, diagrams, notes, and media.

Proposed identity words for discussion:

- clear;
- calm;
- precise.

#### Decision 2: Typography Direction

Prepare at most three rendered alternatives using identical content. Compare:

- sans-serif body and headings;
- serif body with sans-serif interface and headings;
- a restrained system-serif treatment if it provides a meaningful advantage.

Evaluate hierarchy, code contrast, notes, long reading, and zoom. The product
owner chooses the direction; the implementation derives the complete scale.

#### Decision 3: Geometry And Rhythm

Prepare alternatives that vary only meaningful relationships:

- prose measure;
- navigation/content balance;
- note-column allowance;
- compact versus normal rhythm;
- code and diagram width.

Do not ask the product owner to choose pixel values. Present the result as
realistic pages at desktop, tablet, and mobile widths.

The first review harness builds three alternatives from the same representative
fixture and preloads them in one local comparison page. Its selector changes
the visible candidate without navigating away or rebuilding the alternatives.
Run `npm run preset:documentation:review` and review the URL printed by the
command.

#### Decision 4: Color, Surfaces, And Shape

Prepare coordinated light and dark variants for two or at most three candidate
directions. Evaluate:

- prolonged reading comfort;
- navigation orientation;
- links, code, cards, banners, and captions;
- uniform versus restrained alternating sections on sites without tree navigation;
- focus and selected states;
- whether corner treatment supports technical clarity.

Accessibility corrections are automatic constraints, not separate aesthetic
options.

#### Decision 5: Media And Structured Content

Confirm how documentation handles:

- diagrams wider than prose;
- portrait and landscape images;
- code blocks and wrapping;
- sidenotes at wide viewports;
- cards and carousel controls;
- captions and image enlargement.

The preset should favor reading while allowing technical material to use the
space it genuinely needs.

#### Decision 6: Reader Controls

Review the final preset in all combinations of:

- light and dark;
- narrow, standard, and wide reading width;
- focus-reading mode on and off;
- desktop and mobile navigation.

Reader settings must adapt the preset without making it look like another
preset.

#### Documentation Preset Approval

Provide one proof-of-concept site and a focused comparison sheet. Approval
means:

- its purpose is immediately recognizable;
- its identity is distinct but not distracting;
- the default requires no design expertise;
- reader choices are useful and understandable;
- accessibility and behavior checks pass;
- no unexplained visual problem remains in representative content.

Do not migrate public examples or documentation before this checkpoint.

### Phase 5: Harden The Model

After the documentation proof of concept is approved:

- remove profile boundaries that did not reduce work;
- combine categories that cannot vary independently;
- remove public overrides that bypass the model;
- improve diagnostics and exported reference comments;
- finalize schema and IntelliSense descriptions;
- add regression screenshots for the approved identity;
- document the internal recipe format for future work.

This phase prevents the first preset's accidental implementation details from
becoming permanent architecture.

### Phase 6: Design And Migrate Remaining Presets

Process one purpose at a time using the same decision sequence.

Recommended naming review:

| Current name | Initial recommendation | Decision needed |
| --- | --- | --- |
| `documentation` | Keep | Confirm final identity. |
| `project` | Keep | Define the boundary between project and product sites. |
| `portfolio` | Keep | Ensure it remains useful beyond galleries. |
| `statement` | Reconsider | Replace with `article` only if long-form editorial content is the actual purpose; otherwise define the intended site type first. |

Do not add another preset only to provide a different color or font. Add one
when a common site purpose requires a meaningfully different combination of
reading, geometry, media, and hierarchy.

Each migrated preset gets its own implementation and approval commit where
practical.

### Phase 7: Finalize Safe Site-Owner Controls

Review the public theme surface after several presets exist. Retain only values
that satisfy all of these conditions:

1. a non-designer can understand the choice;
2. the choice represents a real site need;
3. the engine can preserve accessibility and coherence;
4. IntelliSense can explain it succinctly;
5. it does not require retesting an uncontrolled number of combinations.

Expected normal controls include named reading width, rhythm, media emphasis,
surface pattern, color-mode default, and reader-control availability. Exact
lengths should remain limited to demonstrated cases such as a necessary image
or page-width adjustment.

### Phase 8: Migrate Examples And Documentation

Only after manual approval:

1. migrate focused fixtures;
2. migrate demonstration sites;
3. migrate starters;
4. update schemas and editor completions;
5. update Markdown reference documentation;
6. update the rendered Norna site;
7. remove old terminology, obsolete fields, and compatibility paths;
8. run the complete test, build, example, and package checks.

Documentation should teach the one-line preset path first, named overrides
second, reader preferences separately, and resolved internals only as reference.

## Representative Test Content

Use one stable stress site throughout development. It should include:

- H1 through H4 and several paragraphs;
- short and long links;
- inline code and fenced code;
- nested navigation and breadcrumbs;
- sidenotes;
- image stack and carousel with portrait and landscape images;
- SVG diagram;
- cards with and without images;
- banner and footer;
- captions and secondary text;
- long words and narrow-screen content;
- focus, current, hover, selected, and disabled control states where relevant.

Purpose-specific examples supplement this stress site but do not replace it.
Comparisons must use identical content so visual differences come from the
preset rather than editorial variation.

## Automated Verification

At minimum, add tests for:

- complete profile and recipe resolution;
- unknown and unsafe profile combinations;
- all required semantic color-pair contrast ratios;
- heading-level ordering;
- safe text-width bounds;
- every preset in light and dark;
- every reader preference independently and in representative combinations;
- cookie or other preference persistence and reset;
- keyboard behavior and accessible control state;
- 200% text resizing and 400% reflow;
- mobile and desktop navigation interaction;
- no-JavaScript baseline;
- forced colors and reduced motion;
- representative screenshots at stable viewports.

Use automated accessibility tooling as a guard, not as the sole acceptance
criterion.

## Work Packages And Checkpoints

To support long uninterrupted work, group implementation as follows:

1. **Inventory pass:** no product decisions or visual changes.
2. **Engine-contract pass:** autonomous implementation and tests.
3. **Profile-resolver pass:** autonomous refactor preserving output.
4. **Reader-controls pass:** implementation against agreed categories.
5. **Preset options pass:** produce a small number of rendered alternatives.
6. **Product checkpoint:** select direction and record reasons.
7. **Preset completion pass:** autonomous tuning and full verification.
8. **Manual approval:** product-owner testing.
9. **Migration pass:** examples, schemas, editor help, and documentation.

Avoid requesting approval for individual colors, spacing values, breakpoints,
or component states. Stop for product input when a choice changes purpose,
identity, reader control, or public configuration.

## Commit Strategy

Keep these concerns separately recoverable:

1. design records and inventories;
2. engine accessibility contract;
3. internal profile resolver;
4. reader Display controls;
5. each preset proof of concept;
6. safe public override schema;
7. fixtures and examples;
8. public documentation and editor support.

Before each visual experiment, keep a committed baseline. Do not mix broad
documentation migration into proof-of-concept commits.

## Immediate Next Step

Review and approve the public root-theme syntax proposed in Phase 3 for reader
display preferences. Confirm which controls are enabled by default for each
preset before implementation begins.

Do not redesign presets or replace their published examples until the Display
control works across all profile categories. The shared baseline fixture should
then become the source for the replacement public preset examples after each
preset has been visually reviewed.
