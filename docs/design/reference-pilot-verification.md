# Reference pilot verification

First delivery for [BL-117: Canonical web reference](backlog/BL-117-canonical-web-reference.md),
checked on 2026-09-15 against engine commit `828f70f`, package version 0.7.26.
This record covers the draft pilots, not the eventual complete reference.

## Automated checks

| Check | Result and scope |
| --- | --- |
| `node bin/norna.mjs --site-dir fixtures/reference-documentation/site check` | Passed configuration and content validation. |
| `npm run test:documentation` | Passed, including new pilot checks: four pages, single H1s, valid positive YAML and Markdown examples, and agreement between displayed sources and three rendered note definitions. |
| `node scripts/test-page-move.mjs` | Passed the existing move regression suite. This supports the command pilot, not a claim that every sentence has an individual test. |
| `node bin/norna.mjs --site-dir /Users/jangarefelt/Projects/webbhack/norna/.local/test-sites/scratch/site build` | Passed after the pilot-directory correction described below. Generated ten routes and a search index covering five pages. |

The complete release suite was not run: no engine behavior was changed.
Generating the search index does not verify the search dialog or the
findability of a larger reference.

## Visual inspection of the earlier draft

All three texts were subsequently rewritten using the
[reader-understanding plan](reference-pilot-editorial-plan.md). The captures
below describe the earlier draft, not the rewritten pages.

Captured with `npm run review:capture -- scratch <path> --viewport <size>
--appearance <mode>` and inspected as screenshots:

| Pilot and section | Viewport and appearance | Observation |
| --- | --- | --- |
| Appearance, `#precedence` | Desktop, light | Diagram, caption and precedence table are readable and do not overlap the navigation. |
| Appearance, `#precedence` | Mobile, dark | Diagram fits and exposes image inspection. The table uses horizontal scrolling; diagram text benefits from enlargement. |
| Sidenotes, `#several-notes` | Desktop, light | Both notes appear beside their paragraph; the next paragraph starts below them. |
| Sidenotes, `#several-notes` | Mobile, light | Both notes move below their paragraph. The source example requires horizontal scrolling. |
| page:move, `#options` | Mobile, light | The options table fits through wrapping; some option names wrap. No page-level overlap was visible. |

Captures are ignored local artifacts under `.local/review-captures/scratch/`.
These are visual spot checks, not exhaustive browser regression tests.
Focus reading, search interaction, keyboard navigation and no-JavaScript
behavior were not newly exercised in a browser for this documentation draft.

## Findings and boundaries

The rewritten Appearance page was subsequently captured at desktop/light and
the rewritten Sidenotes page at mobile/dark during the code-typography trial.
Both screenshots were inspected. Browser measurements on Appearance at 1440
and 390 pixels confirmed code at 14px with 20.02px line height, using the same
explicit monospace family as its title. Body text remains 16px and 15.36px
respectively. Code-block regression tests await visual approval of this trial.
The rewritten page:move visual check remains outstanding.

- npm reported 0.7.25 as latest, whereas the inspected local code is 0.7.26.
  The pilots identify that difference and must not be advertised as a complete
  description of the current npm release.
- A valid pilot directory named `010-page-move` passed content validation but
  failed the Astro build. Page-ID decoding takes the last `-page-` marker and
  misreads that substring inside the slug. Renaming the pilot to `010-move`
  allowed the final build to pass. The engine defect remains recorded in the
  [inventory](reference-inventory.md); it was not fixed as a documentation edit.
- Existing user reference files remain canonical. The proposed 42-page
  structure and these three drafts have not replaced them.

## Human review gate

Review the proposed grouping and the three lookup tasks in the
[information structure](reference-information-structure.md#review-and-finding-information).
Decide whether these pilots provide the right balance of exact reference,
brief explanation and examples before expanding the rest of the reference.
The full site's navigation and search findability require a later review with
the complete information set.
