# Navigation And Theme Plan

This document records the intended order of work for page hierarchy,
navigation, and theme presets. It is an implementation plan, not a description
of released behavior.

## Goal

Norna should support sites with limited global navigation and a larger local
page hierarchy without making mobile navigation harder to understand. Theme
presets should provide a coherent visual system without changing the site's
information architecture.

## Working Principles

- The file structure defines the page hierarchy and presentation order.
- Navigation behavior and navigation styling are separate concerns.
- Global site navigation, local page navigation, and headings on the current
  page have distinct roles.
- Changing a theme preset must not change which pages are available or how the
  page hierarchy is interpreted.
- Site-wide visual identity should remain coherent while individual pages may
  vary where that does not disrupt navigation or orientation.
- Documentation and broad example migration should follow implementation and
  manual evaluation, not precede them.

## Order Of Work

### 1. Stabilize The Page Tree

Finish and test nested page discovery independently of final navigation
presentation. Establish deterministic rules for:

- directory parsing, page ids, URL paths, and presentation order;
- parent and ancestor relationships;
- collisions and invalid nesting;
- page-local content, images, and themes;
- breadcrumbs and current-branch discovery.

Commit this foundation separately before broad theme or preset changes.

### 2. Define The Navigation Contract

The intended information architecture is:

- a small global navigation for the site's top-level areas;
- a larger local page tree for the selected area;
- a separate `On this page` list for headings on the current page;
- breadcrumbs for location and ancestry;
- one unified mobile navigation containing the whole page hierarchy, with the
  current branch expanded and current page marked.

The exact contract is potentially difficult to evaluate at an abstract level.
The maintainer therefore expects this phase to use executable test sites,
focused automated tests, or clear illustrative examples. These artifacts
should demonstrate short single-page sites, ordinary two-level sites, and
deeper documentation-style hierarchies on both desktop and mobile before the
contract is considered stable.

The contract should also define the fallback and override behavior for the
supported navigation modes. Structural behavior belongs to site-level engine
configuration or deterministic automatic selection, not to presentation
presets.

### 3. Implement Navigation In Layers

Implement and verify the navigation model in this order:

1. page-tree data and validation;
2. desktop global navigation, local tree, breadcrumbs, and `On this page`;
3. unified mobile navigation;
4. keyboard, focus, current-page, and progressive-enhancement behavior;
5. visual evaluation at representative viewport sizes.

Keep real links as the foundation. Client-side JavaScript should only enhance
interaction that cannot be expressed adequately with HTML and CSS.

### 4. Refine Theme And Preset Responsibilities

Presets should control visual presentation, including:

- color system;
- typography;
- spacing and density;
- page and content widths;
- the visual treatment of global navigation, local navigation, breadcrumbs,
  and `On this page`.

Presets must not determine page hierarchy, link membership, or semantic
navigation structure. Those must remain stable when a preset changes.

Site-wide color, typography, and navigation treatment should normally remain
consistent. Page-local theme variation should be limited to properties such as
content width, density, and media presentation when variation does not weaken
site identity or navigation clarity.

### 5. Migrate After Evaluation

After the page tree, navigation contract, and preset boundaries have been
manually evaluated:

- migrate fixtures and examples;
- update schemas and editor assistance;
- update Markdown reference documentation;
- update the rendered documentation site;
- remove obsolete navigation and preset behavior rather than retaining
  compatibility layers.

Keep foundation, navigation, preset, migration, and documentation changes in
separate commits where practical.

## Immediate Checkpoint

The current nested-page implementation should be reviewed, tested, and secured
before work continues on the final navigation contract or preset model.
