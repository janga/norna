---
name: norna-terminology-review
description: Review ambiguous or overloaded Norna product terminology before changing public names, configuration values, or their documentation. Use only when explicitly invoked.
---

# Norna Terminology Review

Use this workflow when the user explicitly asks for a terminology-first review
or invokes `$norna-terminology-review`. It is for public names whose meaning may
be ambiguous, overloaded, invented, or difficult to document. It is not the
normal workflow for small editorial corrections.

Read `docs/design/documentation-style-guide.md` and the relevant implementation,
schemas, tests, reference documentation, HTML documentation, and examples
before making a recommendation.

## Phase 1: Proposal Only

Do not edit files during this phase.

1. Inventory every affected public term and where it appears: configuration,
   CLI, Markdown syntax, schemas, IntelliSense, diagnostics, documentation, and
   examples.
2. Describe each term's current exact behavior, default, scope, inheritance,
   interactions, and invalid combinations from the implementation.
3. Identify collisions, synonyms, common words used in restricted ways, names
   that expose internal implementation, and names that rely on unexplained
   visual metaphors.
4. Recommend one coherent terminology model. Include at most two alternatives
   only when they represent materially different trade-offs.
5. Show the proposed public contract as documentation, including concise value
   definitions and representative configuration or Markdown examples.
6. List the code, schemas, tests, editor support, diagnostics, documentation,
   examples, and migration notes that implementation would affect.

End Phase 1 with a clear approval question and stop. Do not make preparatory
edits, update generated schemas, alter examples, or begin implementation.

## Phase 2: Product Implementation

Begin only after the user explicitly approves the Phase 1 terminology model.

1. Update the implementation, validation, schemas, IntelliSense, diagnostics,
   and focused automated tests as one public contract.
2. Prefer a clean breaking change when the user has said compatibility is not
   required. Do not add aliases or migration layers without a concrete need.
3. Add or update the corresponding documentation item in `BACKLOG.md` as
   required by `AGENTS.md`.
4. Do not perform the wider documentation and example migration until the user
   has tested the implementation and approved that next phase.
5. Tell the user exactly where and how to test the changed terminology.

## Phase 3: Documentation Migration

Begin only after the user approves the tested implementation.

1. Update the canonical reference first.
2. Update HTML introductions with only the local context needed there and link
   to the reference.
3. Update schemas, IntelliSense links, examples, exported references, and
   remaining occurrences so the old public terminology is not left behind.
4. Run documentation, schema, example, and relevant product tests.
5. Report any intentionally retained historical or migration terminology.

