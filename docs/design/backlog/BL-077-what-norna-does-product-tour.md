# BL-077: What Norna Does Product Tour

## Editorial Guidance And Later Decision

Reusable writing and demonstration principles are now maintained in the
[Product Presentation Guide](../product-presentation-guide.md), extracted on
2026-10-11. The original assignment below remains as historical context, not a
second maintained style guide.

On 2026-10-11 the owner approved developing the homepage and product
demonstration as one coherent presentation first. A later split must be
justified by the content's scope and reader need. This supersedes the fixed
separate-page requirement below for that redesign.

The owner subsequently approved retiring the separate page on 2026-10-11.
The homepage introduces Norna; Examples demonstrates it. `/features/` is now
an alias of `/examples/`, preserving entry from the old address without
retaining duplicate product prose or a navigation item. Former section links
lead to the Examples overview; the destinations below hold the detailed material.

### Content Preservation

Compared against the product tour at commit `468c733`. All eight subjects
already had maintained destinations; no full section needed copying:

| Former section | Retained destination and disposition |
| --- | --- |
| Write With Markdown | [Standard Markdown](../../../site/root/pages/examples/pages/standard-markdown/content.md) already pairs syntax and result. Remove the duplicate. |
| Let Files Become A Site | [Automatic navigation](../../../site/root/pages/examples/pages/building-a-site/content.md#automatic-navigation) includes desktop/mobile captures and all four maintained source examples. The three former tour images are byte-identical copies; keep the Examples originals. |
| Change Structure Safely | [Moving pages](../../../site/root/pages/examples/pages/building-a-site/content.md#page-move) demonstrates preview and application. [Page creation](../../../site/root/pages/reference/pages/commands/pages/create/content.md) and [manual moves](../../../site/root/pages/reference/pages/commands/pages/move/content.md#after-a-manual-folder-move) retain the other command details. |
| Extend Markdown Only Where It Helps | [Common extensions](../../../site/root/pages/examples/pages/common-markdown-extensions/content.md) and [Norna extensions](../../../site/root/pages/examples/pages/norna-extensions/content.md) retain source, result and supported behavior. The homepage explains the coordinated built-ins. |
| Start With A Coherent Presentation | [Presets and palettes](../../../site/root/pages/examples/pages/building-a-site/content.md#presets) already covers defaults, overrides and the Theme explorer. |
| Keep Difficult Content Readable | Existing table, code, image and sidenote examples retain the behavior. Add short image-inspection and window-width instructions to [Norna extensions](../../../site/root/pages/examples/pages/norna-extensions/content.md), without duplicating the overview table. |
| Useful Before JavaScript | Link the [Examples overview](../../../site/root/pages/examples/content.md) to [JavaScript and accessibility](../../../site/root/pages/reference/pages/reader/pages/accessibility/content.md#without-javascript); keep feature-specific explanations beside their examples. |
| Build Ordinary Static Output | [Checks and generated files](../../../site/root/pages/examples/pages/building-a-site/content.md#source-checks), [publishing](../../../site/root/pages/reference/pages/workflows/pages/publishing/content.md) and [build output](../../../site/root/pages/reference/pages/commands/pages/build/content.md) retain the details. Getting Started remains unchanged pending BL-180. |

The navigation capture script now writes only the maintained Examples images.
The historical VS Code sketch generator reads the same retained image; its
illustrated page labels remain historical. Documentation checks cover the
retained navigation captures, source examples and old-address alias instead of
requiring the retired page's headings and prose. Browser checks use current
documentation destinations; the standalone-page case moves to the existing
preset fixture so removal of the product tour does not remove that coverage.

### Retirement Verification

Verified on 2026-10-11 against `468c733` plus this retirement change:

- Documentation checks and capture/sketch script syntax checks passed.
- An isolated documentation build produced 86 HTML pages, including the old-URL
  redirect, and an index of 82 searchable pages. The built `/features/` document
  points to `/norna/examples/`; navigation, sitemap and `llms.txt` use current
  destinations. The image manifest removes only the three duplicate sources.
- All 74 cases in the registered documentation browser suite passed across
  runs: 62 initially, then the 11 previously failing cases and the build-dependent
  case. The initial failures exposed old expectations for category redirects,
  parent-page menus, tree structure and an edited page title. These expectations
  were reconciled with the current parent-page model; runtime behavior was not
  changed. Only affected cases were rerun after their corrections.
- The standalone-page regression passed separately in WebKit against the
  existing preset fixture. The old documentation address was checked with
  JavaScript enabled and disabled.
- Inspected Examples and the image/sidenote instructions at desktop and mobile
  widths, including Light and Dark appearance. The owner authorized the
  consolidation and additions; this records agent inspection of their rendering.

No full engine release chain was needed: changes affect documentation content,
its asset consumers and its browser checks, not shared engine contracts.

## Outcome

The documentation site has one evidence-led page between `Norna` and `Getting
Started` that helps a prospective user understand how Norna works and what it
can produce before following an installation tutorial.

Use `/features/` as the stable URL and `What Norna Does` as the page title and
navigation label. Treat this page as a new presentation model for later
documentation-site improvements rather than copying the current homepage,
Examples, or Resources layouts.

## Reader Need

Norna combines familiar Markdown with an opinionated file model, purpose-built
content patterns, coordinated presets, automatic navigation, safe maintenance,
and progressively enhanced static output. A raw feature list does not explain
how those parts relate, while Getting Started should remain a task rather than
a product catalogue.

The page must therefore sell through working evidence. A reader should see an
effect, its small source representation, and the relevant Norna decision close
together instead of accepting unsupported adjectives or reconstructing the
model from reference pages.

## Information Architecture

Keep the documentation roles distinct:

- the homepage answers why Norna exists and who it suits;
- `What Norna Does` demonstrates the product model and selected capabilities;
- Getting Started guides the first successful task;
- Examples presents complete sites and focused demonstrations;
- canonical Markdown reference specifies exact syntax, defaults, constraints,
  and edge cases.

The new page may reuse facts and maintained assets from those sources, but it
must not duplicate their complete prose or turn into an exhaustive capability
inventory.

## Page Structure

Organize the page by reader outcomes rather than source files, internal modules,
or syntax families:

1. **Write with Markdown.** Show a concise source-and-result example using
   ordinary headings, prose, links, lists, emphasis, code, and a table. Explain
   that knowing ordinary Markdown covers most day-to-day writing.
2. **Let files become a site.** Show how page directories, `content.md`, and
   adjacent `images/` form URLs, pages, and navigation without a separately
   maintained menu model.
3. **Change the structure safely.** Demonstrate page creation or movement,
   automatic internal-link rewriting, old-URL aliases, checks, and image
   reconciliation as benefits of following Norna's file conventions.
4. **Use purpose-built content patterns.** Show small real examples of a
   semantic callout, sidenote, image stack or carousel, and card list. State
   that Norna extends Markdown only where ordinary Markdown cannot express a
   bounded site pattern clearly.
5. **Start with a coherent presentation.** Keep representative content fixed
   while demonstrating what a preset coordinates and how one deliberate theme
   override fits the model.
6. **Keep difficult content readable.** Let the page or a directly adjacent
   maintained demonstration show responsive navigation, wide-table handling,
   long-code context, detailed-image inspection, image-caption placement, and
   sidenote fallback.
7. **Remain useful without optional JavaScript.** Distinguish semantic HTML,
   CSS presentation, and optional JavaScript enhancement with verified examples
   such as navigation and table handling. Do not imply that JavaScript-dependent
   enhancements exist in the no-JavaScript baseline.
8. **Build ordinary static output.** Connect checks and source maintenance to
   the generated pages, search index, sitemap, social metadata, 404 page, URL
   aliases, and deployment before leading to Getting Started.

Shorten or combine sections if the rendered page becomes repetitive. Preserve
the progression from familiar writing to Norna-specific structure, richer
presentation, resilient output, and the next practical step.

## Automatic Navigation Demonstration

The page must explicitly demonstrate that `navigation.mode: automatic` derives
one stable site-wide navigation model from the listed page structure:

- one listed page produces navigation to its H1 and H2 sections;
- several top-level pages produce top navigation on wide screens and compact
  navigation on small screens;
- adding a listed child page or navigation category changes the entire site to
  a persistent page tree on wide screens and the corresponding compact menu on
  small screens.

Show at least the source trees and corresponding navigation outcomes. Use a
maintained illustration or captured real output when it communicates the
relationship better than prose. Make clear that authors do not maintain a
second sidebar definition.

## Demonstration Pattern

For each selected capability, keep this sequence together:

1. the visible effect or user outcome;
2. a working result or representative maintained capture;
3. the smallest source fragment that explains it;
4. one or two sentences describing Norna's relevant decision;
5. one precise link to canonical reference material when more detail is useful.

Prefer live Norna output over screenshots. Use captures for states that cannot
be compared honestly on one live page, such as desktop and compact navigation
or JavaScript and no-JavaScript behavior. On wide screens, place source and
result near enough for direct comparison; preserve one logical source order and
stack them on small screens.

## Editorial Constraints

- Do not lead with the word `opinionated`. Let the repeated source-to-result
  relationship establish that model before naming its trade-off.
- Do not use unsupported superlatives or planned capabilities as product proof.
- Do not reproduce complete command, content, theme, or file reference.
- Do not put every capability in a same-weight card grid. Give the strongest
  relationships enough space to be understood.
- Keep the pre-1.0 status in the existing site-wide notice instead of repeating
  it in ordinary page prose.
- Keep every visual claim understandable from accompanying text, semantics, or
  alternative text.

## Acceptance Criteria

- `What Norna Does` appears after `Norna` and before `Getting Started` in the
  generated site navigation and builds at `/features/`.
- The first viewport identifies the page as a concise product demonstration and
  starts with familiar authoring rather than internal architecture.
- The page contains working, current examples of ordinary Markdown and at least
  three distinct Norna-owned outcomes.
- A reader can predict where page content and images belong and understand why
  following the file conventions enables safer maintenance.
- The automatic navigation example accurately covers single-page, flat
  multi-page, and hierarchical sites on wide and small screens.
- The page distinguishes standard Markdown, Norna-specific content patterns,
  site configuration, reader controls, and generated behavior.
- Progressive enhancement is demonstrated without hiding any baseline content
  or claiming that optional controls work without JavaScript.
- The final action leads into Getting Started; detailed syntax links lead to
  canonical Markdown reference rather than duplicating it.
- The page remains coherent with tree navigation, Light and Dark appearance,
  all reader widths, keyboard navigation, a small screen, and no JavaScript.
- Existing homepage, Getting Started, Examples, Resources, and capability
  content is not removed until its unique reader value has been accounted for.

## Verification

- Run documentation links, content validation, the documentation-site build,
  and the relevant navigation and no-JavaScript regression tests.
- Inspect desktop and mobile output in Light and Dark appearance.
- Confirm every shown source fragment against current parsers, schemas,
  commands, and generated output.
- After the new pattern is approved, use it as evidence for separate homepage,
  Examples, and Resources consolidation rather than expanding this item.

## Foundations

The structure applies Diataxis separation of explanation, tutorial, and
reference; progressive disclosure of central before specialized capabilities;
worked examples that keep source and result together; semantic heading
structure; and HTML-first progressive enhancement. The project's
[documentation style guide](../documentation-style-guide.md) remains the
writing contract.
