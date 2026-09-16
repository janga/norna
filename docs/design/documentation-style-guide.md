# Documentation Style Guide

This guide defines how Norna documentation names, introduces, and describes
the product. It applies to human-facing Markdown and HTML documentation,
schemas and IntelliSense text, CLI diagnostics, UI help, and explanatory
examples.

The goal is not stylistic uniformity for its own sake. The goal is that a new
reader can understand Norna's model without already knowing Norna's vocabulary,
and that an experienced reader can find an exact answer without reconciling
multiple descriptions.

## Audience And Assumptions

State or infer the intended audience before writing. Norna documentation may
assume ordinary Markdown, Git, npm, and command-line familiarity only when the
surrounding document has established that expectation. Do not assume that a
reader knows Norna-specific meanings.

Read from the audience's position:

- introduce a concept before using it to explain another concept;
- define a project-specific term at first use or link directly to its
  canonical definition;
- do not rely on a reader having followed the documentation in order;
- prefer a familiar term when it expresses the exact concept;
- keep examples realistic, minimal, and consistent with current behavior.

## Plan What The Reader Must Understand

Before drafting or substantially revising a reference page, make a short
working note answering these questions. Keep it outside the published prose;
for a small edit, a few lines are enough.

1. **Question:** What exact answer is the reader looking up?
2. **Starting knowledge:** What can this audience reasonably already know?
   Familiarity with Markdown does not imply familiarity with Norna's file tree.
3. **Missing understanding:** Which concepts must the reader understand to
   interpret this answer correctly?
4. **Order:** In what order must those concepts appear? For each unfamiliar
   term, identify what must be established before using it.
5. **Boundary:** Which details answer this question, and which belong on a
   linked page? State the principal answer in one or two sentences.

Use this plan to choose the order of the published text, not merely its topics.
Put the principal answer first when it is understandable on its own. Otherwise
precede it with only the essential definition or context. Put the concrete
file location and smallest useful example early when they make the rule clear.
Introduce qualifications beside the rule they qualify, after establishing the
concepts needed to interpret them.

Reference remains a lookup resource, not a compulsory learning sequence.
Use predictable headings within related reference pages. Give enough local
context to answer a direct arrival; link to a focused explanation when the
underlying model needs more than a brief definition. A bare link does not
justify an otherwise incomprehensible sentence.

For example, do not open an Appearance entry with restrictions on "page-local
themes". First identify the site-wide `site/theme.yaml` file, show the
`appearance.default` setting, and state how a reader's choice affects it. A
description of configuration at several file-tree levels belongs in the
configuration model, introduced before its detailed restrictions are used.

Keep a separate completeness check against code, schemas and tests. That check
may enumerate every constraint; the published page must not mechanically
enumerate those checks as sections or troubleshooting rows.

## Documentation Types

Use the Diataxis distinction to keep each document focused.

### Introduction And Tutorial

Help a reader form a useful mental model and reach a successful result. Present
only the terminology needed for the current step. Link to reference material
for complete syntax, defaults, interactions, and edge cases.

### How-To Guide

Help a reader complete one concrete task. State prerequisites, give an ordered
procedure, verify the result, and link to reference material. Do not turn the
procedure into a general product tour.

### Reference

Describe the current product precisely, using its public concepts and their
relationships to organize lookup. Do not mirror internal modules or validation
branches. Allowed values, defaults, scope and relevant constraints must be
findable, but they do not each require a heading or table. Brief factual
context makes a rule interpretable; extended rationale belongs in an
explanation or design guide. Completeness and clarity are both required:
brevity must not hide a condition that changes the result.

### Explanation And Design Guidance

Explain why the model exists, the trade-offs it makes, and how its concepts
relate. Keep the topic bounded and link back to the authoritative reference for
exact behavior.

### Capability Overview

Help a reader evaluate the current product without reconstructing it from the
reference. Group capabilities by user outcome rather than source filename,
internal module, or implementation history. Give every item a short,
concrete effect, link each group to canonical reference material, and identify
experimental or unavailable behavior explicitly. Include current product
boundaries so omission cannot be mistaken for support. Do not reproduce full
syntax, defaults, or command options.

## Pages And Navigation Categories

Give a page its own URL only when it serves an independent reader need. A useful
parent page may introduce a subject, provide an overview that adds understanding,
or help the reader complete a task before choosing a child page.

Use a navigation category when a collection needs a shared label but no useful
content of its own. If a proposed parent page would only repeat the names,
descriptions, or links already present in the navigation tree, replace it with a
category. Do not add generic introductory prose merely to justify a parent URL.

Do not reproduce child-page navigation as a list of links on an overview page.
Link to a child page only when the surrounding text explains why the reader
should open it or establishes a recommended sequence. If a parent would
otherwise only summarize or link to its children, use a navigation category
instead.

Do not remove a useful parent page simply to shorten the navigation. The test is
whether the page remains worth opening independently, not how many children it
has or how long its content is.

## Terminology Contract

Public names are part of the product interface. This includes configuration
keys and values, commands, file and directory names, content-block names,
navigation labels supplied by Norna, diagnostics, and documented concepts.

Apply these rules:

1. Use one term for one concept and one concept for one term.
2. Do not use the same public word for unrelated concepts.
3. Prefer established technical or interface terminology when it accurately
   describes the behavior.
4. Do not give a common word a restricted Norna meaning merely because the word
   sounds attractive. If no clearer name exists, define the restricted meaning
   before relying on it.
5. Name a choice after what it controls or produces, not after an internal
   implementation detail.
6. Avoid names that depend only on color, position, shape, or another sensory
   characteristic when a semantic name is available.
7. Use the exact same name in code, schemas, IntelliSense, diagnostics,
   documentation, and examples. Deliberate display labels may differ only when
   the relationship is explicit.
8. Do not introduce synonyms for variety. Repetition is preferable to making a
   reader infer whether two words mean different things.

When several unfamiliar terms are needed together, introduce their
relationship first. Then define each term in a short list or table. A glossary
is useful only when definitions are numerous or used across unrelated
documents; it does not replace definitions at the point where readers need
them.

## Configuration Reference Pattern

Use the reader-understanding plan, not a fixed eight-section template.
A simple setting may need only its purpose, file location, minimal example,
accepted values and default, followed by a short interaction rule. Highlight
the line that carries the example's main point. Omit unrelated settings such
as a preset when they are not needed for a valid example or its interpretation.

For completeness, verify purpose, syntax, accepted values, default, scope,
inheritance, reader overrides, constraints and failure behavior. Publish the
applicable facts in the shortest form that preserves their meaning. Combine
them where natural. Explain what a setting does not control only when the
distinction resolves a likely misunderstanding.

Use tables for genuine comparisons or repeated fields, not to give a simple
rule the appearance of rigor. A partial set of scenarios must be labelled as
examples, not presented as a complete decision matrix. Prefer a short rule
over enumerating its obvious consequences. Format literal keys and values as
code.

Do not describe an enum only by paraphrasing its name. For example, a value
named `accented` still needs the exact surface sequence, where that sequence
appears, when it repeats, and where the value is unavailable.

## Constraints And Error Guidance

State constraints positively beside the relevant syntax: for example,
"Accepted values: `system`, `light`, `dark`." Do not repeat this as a generic
error-table row saying that all other values are invalid.

Add error guidance when it helps with an evidenced or non-obvious failure,
explains a misleading symptom, or prevents a consequential mistake. Describe
the situation in the reader's vocabulary, identify the cause, and give a
concrete correction. Establish any prerequisite concepts first. Do not copy
parser terminology or list hypothetical mistakes merely because validation
can detect them. Preserve important refusal and recovery limits for commands
that change files, even when those cases are uncommon.

## Source Of Truth And Duplication

Inspect current implementation, schemas, and tests before changing behavioral
documentation. If they disagree, report the discrepancy rather than choosing
the most convenient description.

Keep one canonical reference definition for each public concept:

- introductory HTML content summarizes and links to it;
- tutorials and how-to guides use it without restating every edge case;
- schemas and IntelliSense provide concise local help and link to the exact
  reference anchor;
- examples demonstrate supported behavior but are not the normative
  specification;
- design guides explain rationale without redefining behavior.

The canonical user reference is authored once as Norna Markdown under
`site/pages/032-reference/` and read on the documentation website. Contributor
and design material stays under `docs/`. Documentation type, not file format,
distinguishes reference from tutorials and explanations.

Introductory pages, schemas and editor help link to the exact reference page
or section. Reference may link to a demonstration, visual comparison or guided
workflow when it supplies distinct reader value. Do not add reciprocal links
merely because two pages discuss the same subject.

The website describes current development. Package/editor help also identifies
the source reference for the installed release. Release tags through 0.7.26
retain `docs/` references; subsequent releases use the reference page tree.
Keep these destinations in `scripts/lib/documentation-routes.json` and validate
its paths/anchors when moving reference pages.

Duplication is justified only when the reader needs enough local context to
continue. Keep duplicated statements short and ensure automated link or schema
tests cover them where practical.

## Examples And Explanations

- Introduce an example with the question it answers.
- Use a diagram only when a relationship is easier to understand visually than
  in a short rule or example. Do not repeat the same simple rule in prose, a
  diagram and a table. Inspect whether removing the illustration improves the
  answer before retaining it.
- Use current, valid syntax that can be copied without removing invented
  product behavior.
- When showing source beside a rendered result, keep the data identical.
  Label an excerpt and identify the surrounding file or settings it omits.
  Keep table cells and sample data concise before considering smaller text.
- Distinguish ordinary Markdown, specific extensions such as GFM tables,
  GitHub-style alerts, and Norna-only syntax. A feature used on GitHub is not
  necessarily part of the GFM specification.
- Use actual captures from maintained sources when illustrating generated
  interfaces. Keep hand-drawn diagrams for explanatory relationships, not
  as evidence of the current rendered interface.
- Show one concept at a time unless interaction between concepts is the point.
- Explain the relevant result immediately after the example.
- Avoid placeholder prose that obscures the feature being demonstrated.
- When a visual distinction matters, describe its structural meaning as well
  as its appearance.

## Accessibility And Global Readability

- Define unusual, invented, or restricted uses of words.
- Do not make color, relative position, or visual shape the only way to identify
  a choice or result.
- Use descriptive headings and link text that remains meaningful out of
  context.
- Prefer short sentences with one central idea when explaining unfamiliar
  concepts.
- Keep terminology stable for readers using translation, magnification, search,
  or screen readers, where surrounding visual context may be reduced.

## Review Checklist

Before completing a documentation change, check:

- Can the intended reader answer the page's main question from its opening,
  without reconstructing the rule from scattered details?
- Does each sentence rely only on assumed knowledge or concepts already
  introduced? Read the draft without the implementation open to find hidden
  prerequisites.
- Does the order help understanding, rather than follow the coverage checklist?
- Can each section, table and illustration justify its place by helping the
  reader interpret or look up the answer? Remove repetitions and unrelated
  qualifications, not necessary constraints.
- Can a reader arriving at a subsection understand it with its local context
  and a clearly named link to any necessary model?
- Are all Norna-specific terms introduced before they are relied upon?
- Does every public term have one unambiguous meaning?
- Could a more familiar and equally precise term replace a new one?
- Do enum descriptions state concrete effects rather than echoing their names?
- Are defaults, scope, inheritance, interactions, and invalid combinations
  visible where readers choose a value?
- Is detail located in reference while introductions remain readable?
- Does a capability overview describe only current behavior, group it by user
  outcome, and distinguish evaluation features and product boundaries?
- Does every parent page add value beyond repeating its child-page navigation?
- Do schemas, IntelliSense, diagnostics, examples, and canonical reference use
  the same terminology?
- Are links directed to the exact canonical section?
- Does every link from canonical reference to HTML documentation provide
  distinct visual, interactive, or instructional value?
- Does the wording remain understandable without relying on color or layout
  alone?

## Reusable Reference Prompt

This is a Norna working prompt adapted from the sources below, not an official
Diataxis or Google prompt. Replace the bracketed inputs. It complements the
full guide; it does not certify quality or replace review.

```text
Write reference documentation for [public feature] for [audience].
Use [implementation, schemas and tests] as evidence for [version].
Follow docs/design/documentation-style-guide.md.

Before drafting, record the reader's exact question, reasonable prior
knowledge, missing concepts, and the order needed to understand the answer.
State the main rule briefly. Separate this understanding plan from the
implementation-coverage checklist; neither is published boilerplate.

Write for direct lookup. Establish essential context, give the answer and
show a minimal valid example early when useful. Name its file and highlight
the relevant line. Define unfamiliar concepts before relying on them.
Keep necessary conditions next to their rules. Use consistent headings, but
do not invent sections to fill a template. Link to longer explanations.

Verify all applicable values, defaults, scope and restrictions. Do not turn
every validation branch into an error table. Do not add unrelated settings,
exceptions or illustrations. Distinguish verified behavior from open gaps;
report gaps separately rather than invent behavior or silently omit a rule.

Review twice: first as the intended reader, for hidden prerequisites,
ordering and unnecessary material; then against the evidence for correctness
and completeness. Deliver the page and a short separate verification note.
```

## Sources

This guide adapts established guidance rather than defining a separate theory
of technical writing:

- [Google Technical Writing: Audience](https://developers.google.com/tech-writing/one/audience)
  connects needed knowledge to existing knowledge and identifies the risk of
  assuming that readers share the writer's expertise.
- [Google Technical Writing: Documents](https://developers.google.com/tech-writing/one/documents)
  covers scope, key points near the beginning, and organization based on the
  audience's goals and prior knowledge.
- [Google Technical Writing: Words](https://developers.google.com/tech-writing/one/words)
  recommends defining unfamiliar terms and using terminology consistently.
- [Microsoft Writing Style Guide: Don't use common words in new ways](https://learn.microsoft.com/en-us/style-guide/word-choice/dont-use-common-words-in-new-ways)
  recommends familiar meanings or an in-context definition when a restricted
  meaning is unavoidable.
- [W3C WCAG Technique G101](https://www.w3.org/WAI/WCAG22/Techniques/general/G101)
  covers definitions for invented, unusual, restricted, and specialist terms.
- [Diataxis: Reference](https://www.diataxis.fr/reference/) and
  [Reference and explanation](https://www.diataxis.fr/reference-explanation/)
  distinguish precise product description from background and rationale.
