# BL-038: Selling Homepage And Product Positioning

## Outcome

Norna's front page helps a prospective user quickly understand what the product
does, why its opinionated model is useful, which sites it suits, and how to try
it. The page presents implemented strengths as evidence rather than leading
with architecture or a feature inventory.

## Dependencies

Complete `BL-028` Automatic Page Move And Reconciliation, `BL-003` Social
Sharing Metadata, and `BL-004` Default 404 Page first so the front page does not
present planned work as current behavior.

## Source Material

Treat the private Norna Product Research site as reusable source material,
including its positioning, product-boundary analysis, comparisons, diagrams,
and wording. Select by relevance to a prospective user rather than preserving
the analysis site's structure. Do not copy its roadmap or unimplemented
opportunities into product claims.

## First Scope

- Open with one concise product category, primary outcome, intended audience,
  and next action.
- Provide direct routes to installation and representative live examples.
- Demonstrate the value of Norna owning presentation, navigation, responsive
  media, validation, static output, and safe file maintenance.
- Explain the opinionated trade-off through user outcomes: fewer setup choices,
  coherent defaults, and less site implementation to maintain.
- Use the progression from one page to a deep hierarchy as proof that the same
  source model can grow without introducing a second authoring system.
- Keep Git and AI-assisted editing as supporting workflow benefits rather than
  the primary definition of the product.
- Retain an honest pre-1.0 warning once, without letting it compete with the
  primary value proposition.
- Remove repeated technical explanations from the front page. Link to Getting
  Started, examples, and canonical reference material for detail.
- Reuse or adapt an existing illustration only when it makes the source-to-site
  relationship easier to understand at normal desktop and mobile sizes.

## Acceptance Criteria

- The first viewport answers what Norna is, what outcome it provides, and what
  the reader can do next without relying on prior Norna terminology.
- Every capability claim is supported by released implementation at the time of
  the edit.
- The page contains one primary call to action and one clearly secondary path
  to examples or deeper evaluation.
- Product benefits appear before implementation details, limitations, and
  comparison language.
- No unique operational or reference information is deleted; displaced detail
  has a canonical destination and a focused link.
- The maturity warning is visible but is not repeated in ordinary front-page
  prose when a site-wide warning already communicates it.
- Headings, cards, links, and any illustration remain coherent in desktop and
  mobile layouts, Light and Dark appearances, keyboard navigation, and the
  no-JavaScript baseline.
- A human reviews the rendered desktop and mobile page before the item is
  completed.
