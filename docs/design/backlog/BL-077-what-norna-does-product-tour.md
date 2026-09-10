# BL-077: What Norna Does Product Tour

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
