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

### 1. Stabilize The Page Tree - Complete

Finish and test nested page discovery independently of final navigation
presentation. Establish deterministic rules for:

- directory parsing, page ids, URL paths, and presentation order;
- parent and ancestor relationships;
- collisions and invalid nesting;
- page-local content, images, and themes;
- breadcrumbs and current-branch discovery.

Commit this foundation separately before broad theme or preset changes.

The page tree now supports nested pages with deterministic directory parsing,
URLs, ordering, ancestry, breadcrumbs, inherited page resources, and collision
diagnostics.

The current breaking page-container proof of concept removes the special root
page. Every page now uses the same physical model:

```text
site/pages/NNN-page-id/
  content.md
  theme.yaml       # optional page-local presentation
  images/          # optional managed page images
  pages/           # optional child pages
```

`site/pages/000-home/content.md` is required and maps to `/`. The `000` prefix
is reserved for this page. Other top-level page directories are its siblings,
not its children. The homepage cannot contain a `pages/` hierarchy; place each
top-level area beside `000-home` and nest further pages below that area.

The root `site/` directory now contains only site-wide files and the page
container. Removed root-level page and image locations produce a migration
error instead of being interpreted as a second page model.

### 2. Define The Navigation Contract - Complete

The accepted information architecture is:

- a small global navigation for the site's top-level areas;
- a larger local page tree for the selected area;
- breadcrumbs for location and ancestry;
- a separate contents rail for the current page's H2 and H3 headings;
- one unified mobile navigation containing the whole page hierarchy and the
  current page headings.

Navigation modes follow the site structure:

- a single-page site uses section navigation;
- Home and independent top-level pages use top navigation;
- pages inside a top-level branch with listed children or categories use tree
  navigation.

The tree contract is:

- top-level areas remain available in the sticky global navigation;
- the selected top-level area supplies the desktop local tree;
- breadcrumbs show page ancestry without changing the vertical position of
  the page heading;
- a closed expandable page title expands the node without navigating;
- an open expandable page title links to that page, while its chevron can
  collapse the node;
- a page without headings or child pages is always a direct link;
- the left rail contains only pages and categories from the active top-level
  branch;
- a separate right rail contains the current page's H2 and H3 headings when
  there are enough to aid orientation;
- opening one branch does not implicitly close another branch;
- long desktop trees scroll independently of short page content;
- mobile uses one drawer for the complete hierarchy instead of requiring a
  separate page-selection and section-selection sequence.

Real links and native disclosure elements provide the fallback. JavaScript
preserves explicitly opened branches, restores navigation scroll position,
enhances focus handling, and keeps measured sticky offsets stable. Without
JavaScript, navigation remains usable but manually opened branches are not
preserved across page loads.

The contract should also define the fallback and override behavior for the
supported navigation modes. Structural behavior belongs to site-level engine
configuration or deterministic automatic selection, not to presentation
presets.

The contract was evaluated with the nested-pages fixture and focused desktop,
mobile, no-JavaScript, spatial-stability, and long-navigation tests.

### 3. Implement Navigation In Layers - Complete

Implement and verify the navigation model in this order:

1. page-tree data and validation;
2. desktop global navigation, page rail, contents rail, and breadcrumbs;
3. unified mobile navigation;
4. keyboard, focus, current-page, and progressive-enhancement behavior;
5. visual evaluation at representative viewport sizes.

Real links remain the foundation. Client-side JavaScript is limited to
interaction and state that cannot be retained adequately with HTML and CSS.

### 4. Refine Theme And Preset Responsibilities - Proof Of Concept

The detailed preset model and remaining work are defined in the
[Preset Design Guide](preset-design-guide.md) and
[Preset Development Plan](preset-development-plan.md). Those records refine
this section with internal profile recipes, safe site-owner choices, and
reader-controlled display preferences.

Presets should control visual presentation, including:

- color system;
- typography;
- spacing and density;
- page and content widths;
- the visual treatment of global navigation, local navigation, breadcrumbs,
  and the contents rail.

Presets must not determine page hierarchy, link membership, or semantic
navigation structure. Those must remain stable when a preset changes.

Site-wide color, typography, and navigation treatment should normally remain
consistent. Page-local theme variation should be limited to properties such as
content width, density, and media presentation when variation does not weaken
site identity or navigation clarity.

The proof-of-concept contract is:

- `config.yaml` owns the site-wide navigation mode;
- the root `theme.yaml` owns presets, palette, corners, typography, the page
  frame, global spacing primitives, and default page presentation;
- a page-local `theme.yaml` may set only `layout.textWidth`,
  `layout.contentSpacing`, managed-image sizing, and
  `sections.backgroundPattern`;
- `sections.backgroundPattern` may be non-uniform only when the resolved
  navigation mode is `sections` or `top`; tree navigation always uses one
  continuous `uniform` reading surface;
- non-uniform section surfaces span the viewport while their text and media
  remain constrained by the normal page geometry;
- page-local values are inherited by descendant pages and merged field by
  field, while global visual identity is never replaced;
- `layout.contentSpacing` replaces the ambiguous `layout.density` name;
- `sections.backgroundPattern` replaces the low-level `sectionSurfaces` list
  with `uniform`, `alternating`, and `accented` choices;
- custom presets and custom font definitions are deferred until the built-in
  contract has been tested in real sites.

The nested-pages fixture is the current proof of concept. The engine-owned
basic init starter follows the new page contract so newly created sites remain
valid. Documentation, other starters, and broad examples should be migrated
only after manual approval.

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

The nested navigation contract has been evaluated and committed. The unified
page-container and theme-scope proof of concepts are now ready for manual
evaluation against the nested-pages fixture before broad migration begins.
