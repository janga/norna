# Preset Design Guide

This document defines how Norna theme presets should be designed. It is an
internal product and engineering guide, not a description of released behavior.

The guide has four goals:

1. make a good site possible with a one-line `theme.yaml`;
2. give every built-in preset a clear identity tied to a recognizable purpose;
3. preserve accessibility and reader control across every preset;
4. minimize the amount of visual design work required to create and maintain
   presets.

## Intended Users

The normal site owner is not expected to be a graphic designer. Norna should
provide coherent choices, explain their effect in ordinary language, and
prevent combinations that are known to produce weak or inaccessible results.

The site owner should retain meaningful control without having to choose raw
colors, calculate spacing, tune component states, or understand responsive CSS.
Advanced configuration should remain deliberately narrow.

Readers have a different kind of control. They should be able to adapt the
finished site for their own reading needs without changing the site's authored
identity.

## Design Principle

A preset is a small recipe assembled from tested profiles. It is not an
independent collection of every CSS value used by the site.

Accessibility is an engine contract. A preset may change character, density,
proportion, and emphasis, but it must not weaken semantics, contrast, focus,
keyboard behavior, zoom, reflow, or component clarity.

## Configuration Layers

Resolve presentation in this order.

### 1. Engine Contract

The engine owns behavior and constraints that must remain dependable across
all sites:

- semantic structure and document order;
- navigation behavior and responsive navigation models;
- keyboard and focus behavior;
- minimum pointer target sizes;
- text, control, and focus contrast floors;
- responsive breakpoints selected from layout needs;
- support for zoom, text-spacing overrides, reflow, reduced motion, and forced
  colors;
- component layout, states, and progressive enhancement;
- intrinsic image sizing and safe viewport limits;
- the derivation and validation rules described below.

These properties are not theme overrides. The engine should reject unsafe
input instead of allowing a preset to weaken the contract.

### 2. Hard Internal Profiles

Internal profiles are named, complete, versioned engine definitions. They are
the main reusable design units and are not normally exposed as collections of
raw values.

Profiles should cover these categories:

| Category | Responsibility | Example names |
| --- | --- | --- |
| Color system | Coordinated light/dark palettes and semantic color roles | `paper`, `neutral`, `dark` |
| Typography | Font stack, type scale, weights, and heading relationships | `reading`, `project`, `restrained`, `editorial` |
| Rhythm | Prose and structural vertical spacing | `compact`, `normal`, `airy` |
| Geometry | Page frame, prose measure, navigation column, notes, and gutters | `documentation`, `balanced`, `wide` |
| Media | Image-area width and viewport constraints | `text-led`, `balanced`, `image-led` |
| Shape | Radius scale and component edge treatment | `square`, `soft` |
| Surfaces | Section background sequence and emphasis | `uniform`, `alternating`, `cycling` |

Profile names are internal implementation vocabulary. They may appear in
diagnostics or exported references, but site owners should normally start from
a complete public preset.

Profiles must be orthogonal enough to reuse, but Norna does not promise that
every theoretical combination is a supported design. Built-in presets select
the combinations that are tested together.

### 3. Built-In Preset Recipes

A public preset combines one profile from each relevant category:

```js
documentation: {
  color: 'paper',
  typography: 'reading',
  rhythm: 'compact',
  geometry: 'documentation',
  media: 'balanced',
  shape: 'soft',
  surfaces: 'uniform',
}
```

The recipe contains intent. The engine expands it into concrete values and
component tokens.

Every public preset must have:

- one common, recognizable site purpose;
- a short description of when to use it;
- no more than three visual-character words;
- a tested recipe;
- a realistic proof-of-concept site;
- light and dark coverage;
- automated and manual acceptance results.

### 4. Site-Owner Direction And Overrides

The normal root theme remains deliberately short:

```yaml
preset: documentation
```

When a site needs another direction, the owner should choose named values, not
construct a new design system. Public choices should be grouped by intent:

| Site-owner category | Appropriate choices |
| --- | --- |
| Appearance | Palette family, shape profile, and color-mode default |
| Reading | Default prose width and content rhythm |
| Media | Text-led, balanced, or image-led emphasis and a focused image-width override |
| Sections | Uniform, alternating, or cycling surfaces |
| Reader controls | Which personal display choices are offered to visitors |

The exact YAML schema is a separate implementation decision. The conceptual
grouping should remain stable even if field names change.

Prefer short enumerations such as `compact`, `normal`, and `airy`. Permit a raw
length only when a real site demonstrates that named choices cannot express a
legitimate need. Raw color, focus, control-state, breakpoint, and component
spacing overrides should not be public.

Page-local themes remain narrower than the root theme. They may vary reading
geometry, content rhythm, media emphasis, and section surfaces when that does
not weaken the site's shared identity. Color system, typography family, shape,
navigation treatment, and reader-control availability remain site-wide.

### 5. Reader Display Preferences

Reader choices are an overlay applied after the site preset and site-owner
overrides. They must not mutate source configuration or replace the authored
theme.

The first supported categories should be:

| Reader category | Values | Effect |
| --- | --- | --- |
| Appearance | `system`, `light`, `dark` | Select a coordinated mode from the active color system. |
| Reading width | `narrow`, `standard`, `wide` | Adjust prose measure within safe limits defined by the geometry profile. |
| Focus reading | `off`, `on` | Reduce surrounding navigation while keeping navigation and exit controls available. |

Do not call this an accessibility mode. Different visual, cognitive, and motor
needs require different combinations. Core accessibility remains active
regardless of reader choices.

The site owner may choose whether each reader control is offered, but every
built-in preset should provide useful defaults. Reader values must be named and
constrained; readers should not enter CSS values.

The Display panel should use one well-labeled control in the site navigation,
native grouped form controls, full keyboard support, clear checked states, and
a reset action. Its semantics and default site remain usable without its
enhancement script. Preferences should be scoped to the site's base path and
must not be used to infer disability or assistive-technology use.

High-contrast choices may be added later, after every color system has a tested
high-contrast variant. Support for operating-system contrast and forced-color
preferences belongs in the engine contract and must not wait for that control.

## Values The Engine Should Derive

### Color

Curate a small number of attractive source palettes manually. Store colors by
semantic role rather than by component:

- page and frame background;
- primary and secondary text;
- links and accents;
- base, soft, and emphasis surfaces;
- borders and separators;
- control chrome;
- focus, selection, warning, error, and success states.

The engine should derive repeated component values and verify every permitted
foreground/background pair. Light and dark modes are coordinated variants, not
a blind inversion. Muted content is still content and must retain sufficient
contrast.

### Typography

A typography profile should define a coherent scale from a small set of
decisions:

- font stack;
- body size and line height;
- heading scale ratio;
- heading and body weights;
- caption relationship;
- prose measure targets.

The engine derives level-specific sizes and spacing while preserving
`H1 > H2 > H3 > H4`. Avoid very thin weights and justified prose. Normal
reading measures should remain within approximately 60–75 characters and never
exceed 80 characters in the standard reader setting.

### Spacing

Use two coordinated scales:

- `rem`-based values for site frame, navigation, controls, and component
  geometry;
- `em`-based values for prose rhythm and spacing that should follow text size.

A rhythm profile supplies multipliers and relationships. It should not repeat
every final margin. This keeps heading, paragraph, card, image, and section
spacing proportional when typography changes.

### Geometry And Responsive Behavior

A geometry profile should define relationships rather than a set of unrelated
widths. It coordinates:

- maximum page width;
- prose measure;
- optional local-navigation and note columns;
- gaps between columns;
- viewport gutters;
- media space.

The engine chooses responsive collapse points from the space required by these
parts. Breakpoints are not preset identity and should not be copied into every
preset.

### Components

Cards, banners, code blocks, notes, carousel controls, navigation, and future
components consume semantic tokens and shared spacing scales. A preset should
not define component-specific hover or focus colors.

Component identity can follow the selected typography, shape, palette, and
rhythm profiles automatically. This lets a new preset cover existing and future
components without adding a separate definition for each one.

## Accessibility And Quality Contract

Every built-in preset and supported override combination must meet at least:

- WCAG AA contrast for normal and large text;
- non-text contrast for controls and meaningful boundaries;
- a strong focus indicator visible on every surface;
- information and state that are not communicated by color alone;
- complete keyboard operation;
- no hidden focusable controls;
- usable reflow at 400% zoom and text resizing at 200%;
- tolerance for WCAG text-spacing overrides;
- stable semantic order in all reader modes;
- reduced-motion and forced-color compatibility;
- a no-JavaScript baseline for content and ordinary navigation.

Automated checks are necessary but not sufficient. Each preset also needs
visual review across representative content, modes, widths, and interaction
states.

## Giving Presets A Distinct Identity

Identity should come from a coordinated combination of a few strong signals:

- typography character and hierarchy;
- palette temperature and accent;
- rhythm and whitespace;
- prose and media proportions;
- shape and line treatment;
- surface sequence.

Do not make identity depend on low contrast, unusual interaction, excessive
decoration, or a layout that competes with the content. At least two major
signals should differ between presets, but every difference must support the
preset's purpose.

Preset names describe purpose, not mood or implementation. Prefer singular,
familiar nouns:

- `documentation` for guides and references;
- `project` for project and product presentation;
- `portfolio` for presenting visual work;
- `article` if a preset is specifically intended for long-form editorial
  material.

Avoid names such as `modern`, `elegant`, `quiet-gallery`, or compound names that
do not clarify the intended site type. Review the current `statement` name
before treating it as stable.

## Supporting A Non-Designer Site Owner

Norna should reduce uncertainty through:

- one recommended preset for each common purpose;
- concise descriptions based on content and task, not style terminology;
- visual previews using the same representative content;
- named, quality-assured overrides;
- IntelliSense descriptions that explain effects and tradeoffs;
- `theme:export` output that shows resolved values and safe alternatives;
- diagnostics that identify the invalid choice and suggest a valid direction;
- no requirement to understand raw spacing, responsive breakpoints, or color
  mathematics.

The interface should make the safe path the shortest path. Expert escape
hatches should be rare, documented, and justified by tested use cases.

## Preset Design Workflow

For each preset:

1. define its audience, content, primary reading task, and navigation needs;
2. choose no more than three identity words;
3. select candidate profiles before tuning numeric values;
4. render the candidates with identical representative content;
5. compare two or at most three meaningful alternatives per open design
   decision;
6. let the product owner select direction and record the reason;
7. derive and tune concrete values in one uninterrupted implementation pass;
8. run automated contrast, structure, interaction, responsive, and build tests;
9. perform manual desktop, mobile, light, dark, zoom, and keyboard review;
10. obtain proof-of-concept approval before migrating examples or public
    documentation.

The product owner should decide purpose and choose between rendered directions.
The implementation should determine numeric scales, responsive details,
semantic tokens, component states, and test coverage without requiring repeated
micro-decisions.

## Definition Of Done

A preset is complete when:

- its purpose and name are immediately understandable;
- its recipe uses shared profiles rather than duplicated raw values;
- it has a distinct but content-supporting identity;
- its one-line configuration produces a complete site;
- supported site-owner overrides remain coherent;
- every enabled reader preference works with it;
- automated accessibility and behavior tests pass;
- realistic content has been reviewed on desktop and mobile;
- the product owner has approved the proof of concept;
- examples and documentation accurately describe the approved behavior.
