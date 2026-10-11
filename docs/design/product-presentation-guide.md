# Product Presentation Guide

Use this guide when writing or reviewing Norna's homepage, product
demonstrations, package descriptions, release announcements and other material
that helps someone evaluate and try the product. Its purpose is an informed
choice and a useful next action.

The [Documentation Style Guide](documentation-style-guide.md) owns shared
language, terminology, factual accuracy and accessibility rules. The
[Preset Design Guide](preset-design-guide.md) owns visual presentation.
This guide owns the editorial principles specific to product presentation.
Read the relevant sections; a small wording fix needs no new planning exercise.

These principles consolidate reusable guidance from
[BL-038: Selling Homepage And Product Positioning](backlog/BL-038-selling-homepage.md)
and [BL-077: What Norna Does Product Tour](backlog/BL-077-what-norna-does-product-tour.md).
Keep the current audience, message priorities, example project, page structure
and release decisions in the task's approved brief. Historical page layouts
and feature quotas are not general writing requirements.

## Establish The Reader And The Decision

For a new presentation or substantial rewrite, use the agreed brief to identify:

- the intended reader, their present workflow and the result they want;
- what they can reasonably know about Markdown, editors and publishing;
- the main reason to consider Norna and the few benefits that support it;
- the evidence available for those benefits and the release it represents;
- the action the reader should be ready to take after this material.

Keep this working note outside published prose. Resolve missing product
decisions with the owner; do not turn an attractive hypothesis into a settled
audience or release promise. Reuse an existing brief when it answers these
questions.

## Make The Offering Understandable Early

The opening should make the product category and useful result apparent to a
new visitor. Pair an outcome-oriented headline with enough concrete explanation
to identify what Norna does. Its name or a broad aspiration alone is insufficient.
This follows [NN/g's homepage guidance](https://www.nngroup.com/articles/homepage-design-principles/)
on explaining purpose, showing representative content and offering clear routes
forward.

Describe the author's task in familiar language before introducing Norna's
internal vocabulary. Establish the benefit of a coordinated presentation before
explaining a preset. Explain what a reader can accomplish before discussing
architecture or using the word "opinionated".

Select a small set of supporting benefits. Give the strongest relationship room
to be understood; a grid of equally prominent features can obscure priorities.
Judge the opening at both narrow and wide viewports. Keep the offering visible
without requiring an animation, carousel interaction or prior page visit.

## Connect Benefits To Evidence

A benefit names a useful effect for an author or reader. Explain the behavior
that produces it and show relevant evidence nearby. A feature inventory alone
does not establish why someone would choose Norna.

The following are examples of claim development, not approved final copy:

| Benefit to explain | Evidence to use | Boundary to preserve |
| --- | --- | --- |
| Keeping a growing site organized | A real page move, with its affected links and files | State the supported operation; do not imply every external address or manual edit is repaired. |
| Reducing plugin administration | The required content features work together as built-in engine capabilities | This does not mean there are no dependencies, updates or limits to customization. |
| Working with an AI assistant | The assistant changes real site sources, followed by checks and a preview | Identify the external assistant and the user's review; do not imply a built-in AI service or guaranteed correctness. |

Describe built-in Markdown extensions as a way to express supported content
within a maintained system. Name a few useful outcomes before linking to
Examples for syntax. Distinguish ordinary Markdown from Norna-specific
constructions; ownership of text files does not establish universal portability
of every extension.

Make the scope of "no plugins" clear: it concerns the website engine's plugin
model. The Norna VS Code extension and other tools have their own installation
and update responsibilities. Explain the reduced coordination and the supported
choices rather than promising maintenance-free software.

AI assistance can be a natural part of authoring. Attribute actions accurately
to the assistant, editor, extension or engine. Use an observed example for a
demonstrated workflow; qualify untested tool compatibility. Norna's checks cover
supported source rules, not the truth or quality of the authored content.

Verify product claims against the current reference and implementation for the
version being presented. Release copy must match the distributable package.
Development documentation may describe newer behavior if its availability is
clear. Do not imply that a Marketplace listing, installation route, update
mechanism or future feature is ready merely because it is planned or works in
the repository.

For performance, time-saving or superiority claims, state the comparison and
conditions supported by evidence. Otherwise describe the concrete work Norna
handles. Markdown, Git, static output and AI-editable files are shared with other
tools; a distinct benefit may lie in how capabilities work together.
Compare alternatives using the same reader task and current sources, including
where another tool fits better. Private research can inform a draft; published
claims need evidence that can be checked independently of that private copy.

## Demonstrate Work And Result Together

Use a small, coherent example to connect an author action to a visible result.
For each important claim, show enough of the working page, source or editor to
explain that connection. Include a short source fragment only when it helps the
reader understand; not every benefit needs a code block.

Use live output for behavior the page can demonstrate faithfully. Use real
captures from maintained sources for editor interactions and states that need
separate views. Keep the content in source and result consistent. Label excerpts
and explain what the reader should notice.

Choose images for explanatory value. Diagrams explain relationships; screenshots
show actual interfaces. An invented interface or decorative image cannot prove
an implemented capability. Keep captions, alternative text, provenance and
regeneration information according to the existing documentation and preset
guides.

The surrounding prose must still communicate the benefit when an image cannot
be seen. Inspect text and image together at their rendered size. Preserve a
logical reading order when side-by-side material stacks on a narrow screen.
If demonstrating operation without JavaScript, separate the content and links
that remain from enhancements that require it.

## Write With A Calm, Concrete Voice

Norna's voice is clear, warm and confident. Address a capable reader with limited
time. Prefer direct verbs and familiar words. Explain benefits without assuming
that every reader has the same technical background. Mailchimp's
[writing principles](https://styleguide.mailchimp.com/writing-principles/)
are useful here: give people relevant information, respect their situation and
keep claims grounded in the product.

Adapt tone to the reader's task. A product introduction can invite exploration;
an installation limitation needs direct, practical wording. The distinction
between a consistent voice and a situational tone follows Mailchimp's
[Voice and Tone](https://styleguide.mailchimp.com/voice-and-tone/). Its particular
brand humor is not a requirement for Norna.

Use descriptive headings that carry meaning when scanned, then connected prose
that develops the argument. Use lists for real alternatives or sequences.
Remove repeated promises and decorative emphasis. NN/g's
[web-writing study](https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/)
supports concise, scannable and factual wording. Its historical measurements
are not predictions of Norna's conversion rate or a fixed word limit.

Replace vague phrases such as "seamless experience", "effortless publishing"
and "unlimited possibilities" with the action and result that justify interest.
Warmth comes from useful guidance, not exaggerated enthusiasm. Avoid invented
testimonials, artificial urgency, forced humor and unsupported superlatives.
State what the product enables directly; use contrasts only when a real choice
or misunderstanding makes them useful.

## Put Detail And Next Steps Where They Help

Give the page one primary next action and a clearly secondary route for readers
who need more evidence. Use labels that identify the destination or result.
Check that the actual installation or example path delivers what the link
promises; an evaluation package and a public release are different offers.

Keep enough explanation to support the reader's decision, then link precisely
to Getting Started for the first task, Examples for demonstrations and Reference
for full rules. These are content roles; they do not require a separate page
for every role. A homepage can include a short product demonstration. Split
material when the new page answers a distinct need and has a clear place in
the reading path.

When simplifying an existing page, account for its unique reader value before
removing material. Preserve useful explanations, source examples and assets in
appropriate destinations, and maintain affected links and addresses.
Avoid creating parallel definitions that drift between pages.

State material product boundaries where they affect the reader's choice. A
clear site-wide maturity notice can serve the whole page; repeat it only when
a particular claim needs qualification. Neither an exhaustive warning list nor
a distant disclaimer should take the place of accurate wording.

## Review The Complete Presentation

Review once as a prospective user, then check the evidence:

- Can someone new explain what Norna does, why it may fit and how to try it
  after reading the opening?
- Does each main benefit have a concrete, supported explanation or demonstration?
- Are authorship, AI assistance, engine behavior and release availability clear?
- Do the headings, text and visuals form a useful sequence without repeated
  promises or unexplained terms?
- Are relevant trade-offs visible, and do the next-step links fulfill their labels?

Ask a representative reader to describe the offering and choose a next step
when practical. Record observed confusion and unperformed reviews separately;
editorial judgment or passing link checks do not establish user success.

For implemented pages, inspect the changed presentation at narrow and wide
viewports and relevant Light/Dark and interaction states. Follow
[AGENTS.md](../../AGENTS.md) for owner review and commit policy and
[Engine Development](../engine-development.md) for focused checks. A guide-only
change needs documentation checks, not a full release or browser suite.

External sources were consulted on 2026-10-11. They inform these Norna-specific
principles; they are not product evidence, endorsements or a mandatory page
template. Keep reusable rules here. Task-specific positioning and approved
copy remain in the relevant brief and authored pages. Any future editorial
skill should reference this guide rather than maintain another copy of it.
