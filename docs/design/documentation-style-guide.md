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

Describe the current product precisely and in a structure that mirrors the
product. Reference material should make allowed values, defaults, scope,
inheritance, interactions, constraints, and errors easy to scan. Brief factual
context is appropriate when it prevents misuse; extended rationale belongs in
an explanation or design guide.

### Explanation And Design Guidance

Explain why the model exists, the trade-offs it makes, and how its concepts
relate. Keep the topic bounded and link back to the authoritative reference for
exact behavior.

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

Before listing values for a public setting, state what the setting controls and
what it does not control. For related settings, explain the independent axes
before describing their values.

A substantial configuration entry should answer, in this order:

1. **Purpose:** What visible or behavioral result does the setting control?
2. **Syntax:** Where is it written, and what type or shape does it accept?
3. **Values:** What does each accepted value do in concrete terms?
4. **Default:** What happens when it is omitted, including preset-derived or
   automatically resolved behavior?
5. **Scope:** Is it site-wide, page-local, inherited, or reader-controlled?
6. **Interactions:** Which other settings or site structures change, limit, or
   invalidate it?
7. **Example:** What is the smallest valid example that reveals its effect?
8. **Related material:** Where can the reader find a task-oriented guide or
   deeper rationale?

Use a table when comparing a closed set of values. Prefer columns such as
`Value`, `Effect`, and `Availability` over prose that forces readers to compare
separate paragraphs. Format literal keys and values as code.

Do not describe an enum only by paraphrasing its name. For example, a value
named `accented` still needs the exact surface sequence, where that sequence
appears, when it repeats, and where the value is unavailable.

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

Duplication is justified only when the reader needs enough local context to
continue. Keep duplicated statements short and ensure automated link or schema
tests cover them where practical.

## Examples And Explanations

- Introduce an example with the question it answers.
- Use current, valid syntax that can be copied without removing invented
  product behavior.
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

- Are all Norna-specific terms introduced before they are relied upon?
- Does every public term have one unambiguous meaning?
- Could a more familiar and equally precise term replace a new one?
- Do enum descriptions state concrete effects rather than echoing their names?
- Are defaults, scope, inheritance, interactions, and invalid combinations
  visible where readers choose a value?
- Is detail located in reference while introductions remain readable?
- Do schemas, IntelliSense, diagnostics, examples, and canonical reference use
  the same terminology?
- Are links directed to the exact canonical section?
- Does the wording remain understandable without relying on color or layout
  alone?

## Sources

This guide adapts established guidance rather than defining a separate theory
of technical writing:

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
