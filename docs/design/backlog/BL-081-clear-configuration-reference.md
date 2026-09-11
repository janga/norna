# BL-081: Clear Configuration Reference

## Status

Implemented on 2026-09-11. The canonical reference and generated editor help
now introduce configuration through user decisions, defaults, concrete
outcomes, and explicit boundaries without changing configuration behavior.

## Problem

The canonical configuration reference often starts with configuration terms
and internal model distinctions before establishing the decision a site author
needs to make. A reader can find accepted values without necessarily
understanding which value fits the site.

`navigation.mode` is the clearest example. Its value table describes generated
structures, but does not give a sufficiently direct mental model for choosing
between `automatic`, `sections`, `top`, and `tree`. The `language` section also
needs a clearer progression from the common choice to regional and
script-qualified cases.

## Outcome

A first-time Norna author can read each setting in
`docs/configuration.md`, understand whether it needs to be configured, choose a
valid value from a concrete example, and predict the visible or generated
result. The reference remains precise enough to settle edge cases.

## Editorial Approach

- Begin each setting with the user decision or problem it controls.
- Present the recommended or default path before optional variants.
- Define Norna-specific terms before using them to distinguish values.
- Pair abstract values with small, concrete site structures or configuration
  examples where the result is otherwise difficult to predict.
- Separate common use from constraints, invalid combinations, and advanced
  cases.
- State explicitly what a setting does not control when a nearby concept is
  easy to confuse with it.
- Keep canonical behavior in this reference and link to narrower page or
  navigation references for exhaustive structural rules.

## `language` Scope

- Lead with the common single-language case and its minimal YAML.
- Explain in plain language which generated text and metadata change.
- Distinguish editorial content from Norna-owned interface text.
- Introduce regional tags only after primary language tags, and script tags
  only where an explicit script is required.
- Make the single-language boundary and the absence of automatic content
  translation unambiguous.
- Keep the supported values easy to scan without obscuring the basic choice.

## `navigation.mode` Scope

- Explain first that Norna discovers pages and headings from files; the setting
  chooses how that discovered structure is presented.
- Establish `automatic` as the normal choice and describe the structural cues
  that make it resolve to section, top, or tree navigation.
- Show one minimal tree and the resulting navigation for each effective mode.
- Distinguish site-page navigation from navigation within the current page.
- Explain what changes between wide and narrow screens without making the
  responsive implementation the reader's first concern.
- Explain why an explicit mode can be rejected when the site structure cannot
  be represented by it.
- Link to the pages and navigation reference for the complete hierarchy and
  fallback contracts.

## Acceptance Criteria

- Every top-level setting in `docs/configuration.md` is reviewed for undefined
  Norna terminology, unclear defaults, and missing decision context.
- The `language` section follows the progression primary language, optional
  region, required script cases, then limits.
- A reader can choose `navigation.mode` without understanding Norna's internal
  navigation-model implementation.
- `automatic`, `sections`, `top`, and `tree` each have a concrete input and
  outcome example.
- The relationship between desktop navigation, mobile navigation, pages, and
  H2/H3 headings is accurate but does not dominate the initial explanation.
- Schema and IntelliSense help are checked against the revised canonical terms
  and updated only where they repeat an unclear explanation.
- No configuration key, accepted value, default, or runtime behavior changes
  as part of this item.
- Documentation link tests pass.
