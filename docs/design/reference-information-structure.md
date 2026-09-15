# Reference information structure

Proposal for [BL-117: Canonical web reference](backlog/BL-117-canonical-web-reference.md).
Read alongside the [coverage inventory](reference-inventory.md). This is the
first review gate, not an approved final navigation tree.

## Editorial decision

Add **Reference** as a top-level category between Examples and FAQ. It contains
product contracts, not another introduction. Keep Getting Started as the short
first-success route, Examples as source/result demonstrations, and FAQ as
symptom-led troubleshooting. Move substantial procedures into task pages under
Resources rather than stretching reference into tutorials.

Reference source will live under `site/pages/032-reference/`. A category uses
`category.yaml`; a page uses `content.md`. Source is still reviewable Markdown
in Git, but the canonical reading destination is the website. No HTML-only
copy or new documentation engine is needed.

Use five category branches. Their labels identify public product areas, not
internal source modules. This depth supports meaningful grouping and Norna's
separate page-contents navigation without adding artificial levels merely to
demonstrate it.

```text
Norna
What Norna Does
Getting Started
Examples
Reference                         category, not an index essay
|-- Site model                    category
|   |-- Site files
|   |-- Pages and categories
|   |-- URLs and links
|   |-- Page metadata
|   |-- Managed images
|   `-- Public assets and generated output
|-- Configuration                 category
|   |-- Site configuration
|   |-- Language
|   |-- Navigation
|   |-- Search
|   |-- Source links
|   |-- Theme model
|   |-- Palettes
|   |-- Appearance                pilot
|   |-- Layout and reading width
|   |-- Image presentation
|   |-- Typography
|   |-- Section backgrounds
|   `-- Shared site content
|-- Content syntax                category
|   |-- Markdown and headings
|   |-- Image blocks
|   |-- Card lists
|   |-- Page lists
|   |-- Semantic callouts
|   |-- Tabs
|   |-- Details
|   |-- Tables
|   |-- Code blocks
|   |-- Sidenotes                 pilot
|   `-- Footnotes
|-- Commands                      category
|   |-- CLI invocation
|   |-- Project creation
|   |-- Page creation
|   |-- page:move                 pilot
|   |-- Validation and image sync
|   |-- Development and preview
|   |-- Build and public output
|   |-- Publishing commands
|   |-- Theme inspection
|   `-- Engine maintenance
`-- Reader behavior               category
    |-- Display and preferences
    `-- JavaScript and accessibility boundaries
FAQ
Resources
```

These 42 reference pages are an initial scope, not a page-count target. Merge
small adjacent topics when a pilot shows that separation creates more hopping
than useful lookup. Split a command family only when its full contract makes
individual command lookup materially harder. Do not divide by word count.

## Page contracts

Each row answers "This page helps a Norna site author to ...". The section
outline is the intended H2 structure; repeated reference patterns are useful,
not a reason to manufacture irrelevant sections.

### Site model

Prerequisite: ordinary files and directories. Explain page/category/site source
terminology here; do not assume readers know the engine's directory convention.

| Page | Independent need and H2 outline | Excludes |
| --- | --- | --- |
| Site files | Locate owned inputs versus generated files. Required files; page directories; site discovery; files to commit; generated state. | Engine module layout |
| Pages and categories | Understand which node to create. Home; pages; categories; category destinations; children and listing constraints. | Full add/move flags |
| URLs and links | Predict destinations and link safely. Directory paths; base path; relative links; fragments; aliases; validation boundaries. | Hosting tutorial |
| Page metadata | Set optional page facts. Frontmatter shape; description and consumers; listed state; aliases; errors. | Theme values |
| Managed images | Understand ownership and processing. File placement; lookup; variants; SVG; inspection; metadata; failures. | Repeated block schemas |
| Public assets and generated output | Place unprocessed assets and understand generated files. Logo/icons; social image; copied files; sitemap; 404; collisions. | Deployment procedure |

### Configuration

Prerequisite: basic YAML mapping/list syntax, with one shared primer linked
when needed. Always identify the file and scope before giving a value.

| Page | Independent need and H2 outline | Excludes |
| --- | --- | --- |
| Site configuration | Know accepted config roots. File and minimum; url; setting map; defaults; validation. | Duplicated language list and navigation rules |
| Language | Select one site's language correctly. Accepted tags; affected labels/collation; content responsibility; translation quality; limits. | Future multilingual site model |
| Navigation | Predict menus from structure. Automatic selection; explicit modes; outline placement; resizing; listing; incompatible combinations. | Styling implementation |
| Search | Enable a usable static index. Setting; indexed content; generation; local freshness; reader behavior; limitations. | Search-service comparison |
| Source links | Choose local or remote edit destinations. Fields; environment selection; paths; safety boundaries; failures. | VSIX installation |
| Theme model | Understand setting ownership and precedence. Presets; root overrides; inherited local themes; block overrides; reader choices; invalid combinations. | Complete typography field list |
| Palettes | Select a coordinated color family. Accepted names; light/dark variants; semantic colors; scope; examples. | Repeated appearance persistence |
| Appearance | Select initial light/dark behavior. Site file and example; values and default; reader choice and reset; no-JavaScript behavior. | Palette selection, detailed cookie attributes and generic error tables |
| Layout and reading width | Control available space without confusing measures. Page/prose width; spacing; gutters; local scope; reader overrides. | Media-specific size rules |
| Image presentation | Control managed-image geometry. Methods; width; height; preset defaults; inheritance; invalid combinations. | File processing |
| Typography | Configure supported typography choices. Profiles; rhythm; body; headings; captions; overrides; limits. | Font hosting wishlist |
| Section backgrounds | Predict section grouping. Patterns; sequence; coverage; tree constraint; inheritance. | Arbitrary user colors |
| Shared site content | Set recurring site material. Logo display; banners and date windows; dismissal; footer; errors. | Logo filename rules repeated in full |

### Content syntax

Prerequisite: ordinary Markdown paragraphs and fences. Name extensions
explicitly. Give every construct a complete local syntax contract and a minimal
valid example, not a giant sample with every optional field enabled.

| Page | Independent need and H2 outline | Excludes |
| --- | --- | --- |
| Markdown and headings | Know the accepted foundation. Markdown/GFM; H1/H2/H3; anchors; text/lists/links; HTML limits. | Recreating a complete Markdown textbook |
| Image blocks | Author stacks and carousels. YAML shape; shared item fields; stack versus carousel; captions/alt; errors. | Variant generation internals |
| Card lists | Author linked comparable items. Container fields; item fields; defaults; links/images; errors. | Marketing advice |
| Page lists | Add contextual child choices. Placement; syntax; discovery; descriptions; empty/invalid cases. | Duplicate site tree |
| Semantic callouts | Mark information by meaning. Closed types; two accepted forms; labels; unknown-type fallback; content limits. | Custom CSS recipes |
| Tabs | Present short alternatives. Grammar; labels; permitted blocks; keyboard/no-JS; errors. | Heading-based alternative documentation trees |
| Details | Disclose optional content. Syntax; summary; permitted content; forbidden headings; no-JS behavior. | Hidden essential instructions |
| Tables | Author tabular data. Markdown; row headers; sort typing/locale; wide layout; sticky behavior; container limits. | Full data-grid API |
| Code blocks | Present usable source. Languages; titles; line emphasis; copy; sticky context; limits. | Running code in browser |
| Sidenotes | Attach short paragraph-local context. One-note source/result; several notes; names and note text; allowed locations; placement and reading. | General citation style guide |
| Footnotes | Cite reusable supporting material. Definitions; references; numbering; permitted nesting; backlinks; errors. | Duplicated sidenote syntax |

### Commands

Prerequisite: a terminal and an installed local Norna package. Use
`npm exec -- norna` for copyable reference examples; explain the optional
`norna` launcher once. Preserve project-specific npm wrappers where their
site selection matters. A command reference states side effects and defaults.

| Page | Independent need and H2 outline | Excludes |
| --- | --- | --- |
| CLI invocation | Select the executable and site. Syntax; global options; cwd/env; launcher; exit behavior; command map. | Global-install tutorial |
| Project creation | Know what init creates. Forms; standalone/embedded; options; files; refusal cases. | First-success walkthrough |
| Page creation | Know add defaults. page:add/category:add; parent selection; slug/order; files; dry-run; errors. | Full site-organization essay |
| page:move | Predict and review a structural edit. Preview/apply example; addresses and options; changed files; manual moves; limits and recovery; alias insertion. | Interactive editor workflow |
| Validation and image sync | Distinguish read-only and writing commands. check/config/content; diagnostics; content:sync; images; limits. | Cache implementation |
| Development and preview | Control preview lifecycle. Local/LAN; ports; kill/restart; status/logs; static preview; failures. | Phone troubleshooting tutorial |
| Build and public output | Know generated outputs. build/build:local; site:public; paths; prerequisites; failures. | Hosting-service setup |
| Publishing commands | Know deploy effects and monitoring. deploy; deploy:commit; watch options; authentication assumptions; failures. | Engine npm release |
| Theme inspection | Inspect defaults without guessing. theme:presets/export; typography profiles/show; output/files; flags. | Typography values repeated |
| Engine maintenance | Inspect or change local dependency. version; update; doctor; prerequisites; changed files; errors. | Publishing Norna itself |

The exposed `migrate:check` command remains an explicit inventory decision,
not a recommended migration section added silently after the project was
archived. Decide its status before completing the CLI map.

### Reader behavior

Prerequisite: none beyond using the rendered site. These pages explain the
author's delivery contract; they are not a mandatory manual before reading.

| Page | Independent need and H2 outline | Excludes |
| --- | --- | --- |
| Display and preferences | Understand reader-controlled presentation. Available controls; width; Focus reading; navigation; reset; cookie names, attributes and persistence limits. | Duplicated Appearance setting reference |
| JavaScript and accessibility boundaries | Know what survives without scripts and what authors own. Feature matrix; keyboard/semantic support; source order; alt/link text; limits. | Claim of whole-site accessibility certification |

## Concepts that need a relationship before a field table

- Project directory, selected site directory, page directory and build output.
- Folder order and URL slug versus heading text and anchor ID.
- Site navigation mode versus page-contents placement versus responsive fallback.
- Preset, root override, inherited local setting and reader preference.
- Source image, managed reference, generated variant and unprocessed public file.

Short factual maps belong beside reference. Longer discussions of why Norna
chooses these constraints belong in explanation material, linked only where
that background prevents likely misuse.

## Illustration plan

| Reader question | Useful form | Avoid |
| --- | --- | --- |
| Which Appearance wins? | Short rule and highlighted `default` line; pilot supplied | A diagram or partial decision matrix for a simple rule |
| What moves with a page? | Before/after file trees with the same names as the command example | Screenshot of a terminal full of unrelated output |
| Where will my note go? | Actual rendered two-note paragraph and exact Markdown; pilot supplied | Mock screenshot promising a fixed breakpoint |
| Why did navigation change? | Captures from one maintained page tree at chosen widths, plus a selection table | Separate hand-drawn interfaces that differ from code |
| Where does a setting apply? | Small scope matrix and one nested directory example | A diagram for every key |

Use Norna's existing layout and tightly bounded SVG for conceptual diagrams.
Do not add CSS just to polish the draft. Keep essential constraints in normal
text. Captions identify what an illustration explains, and alt text states its
meaning; neither should merely repeat a filename.

## Review and finding information

The pilots represent three needs: exact command behavior, configuration
precedence, and content syntax with a live result. Their full-depth category
paths exercise the same tree shape proposed for the public reference.

Review with these tasks, not only by reading from the top:

1. Find whether page:move writes by default, what --no-aliases leaves intact,
   and what to do after an ambiguous manual move.
2. Find where to set the site's appearance, why dark does not replace a saved
   Light choice, and what System means when chosen by the reader.
3. Find whether two sidenotes can share a paragraph, whether one can occur in
   a table, and why the following paragraph may have extra space.

After approval, repeat a lookup set across all branches using both tree
navigation and the generated search index. The three-page pilot cannot prove
findability of the eventual 42-page reference; record that as later validation.

## Source guidance and deliberate adaptations

[Diataxis reference guidance](https://diataxis.fr/reference/) supports product-
aligned structure, consistent patterns and factual examples. It does not
prescribe these five categories or 42 pages: those are this proposal.
[Google headings guidance](https://developers.google.com/style/headings)
supports descriptive, hierarchical, sentence-case headings; literal command
and field names retain their spelling. [Google image guidance](https://developers.google.com/style/images)
supports explanatory images with appropriate text alternatives.

Existing Norna rules keep introductions and normative reference separate by
file format. At cutover, revise that rule to distinguish **documentation type**
instead: a reference remains a reference when Norna renders its Markdown.
Do not change the authority rule while the pilots are still under review.
