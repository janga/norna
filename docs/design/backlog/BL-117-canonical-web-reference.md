# BL-117: Canonical web reference

## Outcome

Publish one reliable, searchable user reference on Norna's own documentation
site, authored in Norna Markdown. Make its quality demonstrate Norna's ability
to handle substantial information without turning reference into marketing.

Status: completed on 2026-09-16. The owner approved the pilot writing and
authorized the full reference earlier that day. The canonical source now
contains 53 pages in six categories, with current web links and separate
release-specific source links in package/editor help. Superseded user
references and duplicate pilot material were retired.

Content, documentation, schema, package, editor and complete Pages-artifact
checks passed. Representative desktop/mobile light/dark screenshots and eight
search/navigation lookup tasks were inspected; exact scope and intentionally
unrepeated checks are in the verification record. No publication was performed.
The independently reproduced slug-decoding issue is tracked as
[BL-118: Page ID decoding for valid slugs](BL-118-page-id-decoding.md).

The checkpoint below is historical and does not describe the completed tree.

Review material:

- [Coverage inventory](../reference-inventory.md)
- [Information structure and lookup tasks](../reference-information-structure.md)
- [Reference source](../../../site/pages/032-reference/)
- [Completion plan](../reference-completion-plan.md)
- [Verification record](../reference-pilot-verification.md)

## Restart checkpoint: 2026-09-16

The owner requested a written handoff before pausing because the weekly usage
allowance was nearly exhausted. This checkpoint does not approve unfinished
text, declare tests passed, or authorize publishing.

### Committed baseline

- Repository: `/Users/jangarefelt/Projects/webbhack/norna`.
- Latest commit: `f19a48a`, `docs(BL-117): approve reference pilots and add URL
  alias guidance`.
- That commit contains the approved pilot arrangement, URL-alias guidance and
  updated inventory/editorial/verification notes. It does not contain the full
  web reference now being written.
- `package.json` declares 0.7.26. Publication evidence in the inventory is dated
  2026-09-15 and must not be presented as a fresh npm check.

### Work saved on disk

The new, entirely untracked reference tree is
`site/pages/032-reference/`. It currently contains 23 content pages and the
root category plus six group categories. These are working drafts, not a
completed migration:

| Source group below `032-reference/pages/` | Current content |
| --- | --- |
| `010-site/` | Seven pages: files, pages/categories, URLs/links, metadata, managed images, public files/output, requirements/limits |
| `020-configuration/` | Fourteen pages: site settings, language, navigation, search, source links, theme model, preset values, palettes, Appearance, layout, image presentation, typography, section backgrounds, shared content |
| `030-content/` | Sidenotes only, at `pages/100-sidenotes/content.md` |
| `040-commands/` | `page:move` only, at `pages/040-move/content.md` |
| `050-reader/` | Category only; no pages yet |
| `060-workflows/` | Category only; no pages yet |

Three approved pilot files were moved from
`fixtures/reference-documentation/site/pages/` into this tree: Appearance,
Sidenotes and page:move. Git currently shows their old paths as deleted and
their new paths inside the untracked tree. This is an intentional unfinished
move, not lost content. Their explicit H2 IDs were removed in favor of normal
derived heading anchors. The move pilot's alias link points to the new URLs
page. The remaining pilot Home and URLs pages still exist at the old location.

The new URLs page expands the pilot into folder-derived addresses, deployment
prefixes, heading anchors, relative links, public files, aliases and checking.
Preset tables and the supported-language table were transferred mechanically
from the old reference; their correctness still needs checking against current
code. Newly written prose also needs the final evidence and editorial passes.

The old `docs/*.md` user references are still present. No link cutover, schema
regeneration, editor-help migration or old-document removal has happened.

### Known incomplete state

- New pages link to content, command, reader and workflow destinations that
  have not been written. Empty reader/workflow categories also remain. The
  documentation site must not be assumed buildable in this intermediate state.
- The pilot fixture no longer has its full source set; its old links and
  `scripts/test-documentation.mjs` pilot assertions require replacement during
  cutover. Any existing scratch preview is a separate copy and may still show
  the older pilots. It is not evidence that the current worktree builds.
- No automated tests, full-site build, search check or browser captures have
  been run against these new reference drafts. Earlier pilot results in the
  verification record apply only to their explicitly recorded state.
- The information-structure document still contains proposal/review wording
  and some superseded terminology. Update it to the final tree, not vice versa.

### Continue in this order

1. Read this checkpoint, the style guide, inventory and information-structure
   plan. Inspect the current diff; preserve unrelated work listed below. The
   owner has already authorized the full rewrite: do not restart the pilot
   approval process or implement multilingual/versioning features first.
2. Complete Content syntax: Markdown/headings, shared structured-YAML rules,
   image blocks, cards, child lists, semantic callouts, tabs, details, tables,
   code and footnotes. Keep the approved Sidenotes page. Establish the reader's
   question and missing concepts before drafting, separately from coverage.
3. Complete Commands: invocation/site selection, init, page/category creation,
   validation/image sync, development/preview, builds, publishing/watch and
   theme inspection. Inventory every exposed command, including engine-only
   operations and the experimental migration audit, before deciding location.
   Preserve the approved move page's refusal and recovery limits.
4. Complete Reader experience and Working on a site: Display/cookies, no-JS
   and accessibility boundaries, editor recognition/install/formatting,
   publishing workflows and upgrades. Keep tutorials separate from reference.
5. Audit draft claims against implementation/schema/tests, especially inherited
   defaults, navigation placement, source-link path construction, image limits
   and language/preset tables. Finish the coverage/disposition and maintenance
   maps before removing any old source with unique information.
6. Perform the link cutover in README, public site text, examples/starters,
   editor help, schemas, command help and `site/public/llms.txt`. Preserve the
   distinction between current web documentation and documentation for an
   installed package version. Then remove superseded user references and the
   duplicate pilot material; retain internal contributor/design documentation.
7. Update canonical-source instructions in `AGENTS.md`, the documentation style
   guide and `docs/README.md`. Replace tests coupled to the old document layout
   with coverage of the new reference, its links and representative examples.
8. Validate and build the complete documentation artifact, inspect representative
   desktop/mobile pages and verify search. Record exact results and remaining
   gaps. Commit coherent groups after their relevant checks, and start/reuse
   the registered docs preview for the final handoff.

### Integration notes and unresolved choices

The following are implementation leads, not additional owner-approved product
requirements:

- `scripts/lib/documentation-links.mjs` currently constructs tag-pinned GitHub
  links to `docs/`. Its callers in `schema-editor-metadata.mjs` and
  `norna-markdown-blocks.mjs` need new destinations. A shared route-to-source
  registry is a possible way to keep web links and tagged source links aligned;
  it has not been implemented or selected as mandatory architecture.
- `editors/vscode/extension.cjs` also constructs documentation links using the
  detected engine version. Do not silently send older installations to new
  source paths that do not exist in their release tags.
- Likely affected checks include `scripts/test-documentation.mjs`,
  `scripts/test-schemas.mjs`, `scripts/test-editor-language-service.mjs` and
  `editors/vscode/test/suite/index.cjs`. Update assertions deliberately; do not
  weaken behavior checks merely to accommodate new wording.
- The public `migrate:check` command remains exposed, but its larger product
  initiative is archived. Decide how to describe its experimental limits;
  do not revive or remove the feature as a side effect of this rewrite.
- The inventory records a reproduced page-ID decoding defect for a valid slug
  such as `page-move`. New draft routes avoid that spelling. This is not a
  public naming restriction and must not become one in the reference. Any
  engine correction requires its own focused regression evidence.

### Verification and restart commands

After missing destinations and the test cutover are complete, select checks
according to the actual changed contracts:

```sh
npm run content:check
npm run test:documentation
npm run test:schemas
npm run build:pages
npm run review:start -- docs
npm run review:capture -- docs reference/site/urls/ --viewport desktop --appearance light
npm run review:capture -- docs reference/configuration/appearance/ --viewport mobile --appearance dark
```

Use focused editor-help tests if those links change and `package:check` if
packaged helpers or starter behavior change. Check lookup tasks in the built
search index, not just source headings. Avoid redundant full-suite runs.
The registered docs address is `http://127.0.0.1:4321/norna/`; use the review
wrappers and existing approvals rather than ad hoc ports or capture scripts.

### Unrelated work to preserve

At this checkpoint, these pre-existing changes are outside the reference
implementation and must not be swept into its commits or reverted:

- `BACKLOG.md`
- `docs/design/backlog/README.md`
- `docs/design/backlog/BL-023-multilingual-sites-shared-page-tree.md`
- `docs/design/backlog/BL-100-future-versioning-foundation.md`
- Untracked `docs/design/backlog/BL-025-versioned-documentation.md`

If updating the BL-117 index entry later, stage only that change when the same
file still contains unrelated edits. Do not use a blanket `git add .`.

## Agreed boundaries

- Use current code, schemas, CLI help and tests as evidence. Existing reference
  files are inventory inputs, not a template or unquestioned authority.
- Write user-facing reference in English. Discuss decisions with the owner in
  Swedish. Define the assumed knowledge of each documentation type.
- Keep one canonical definition per public concept. Ultimately replace the
  superseded user reference files in `docs/`; retain contributor and design
  material separately. Do not maintain two editable copies of the reference.
- Old URLs and redirects are not required. Update our own live links in README,
  the website, CLI help, schemas, IntelliSense and AI indexes during cutover.
- Record the inspected commit and package version. Check publication evidence
  separately; do not equate a local package version with npm availability.
- Do not change product behavior or public names to make prose convenient.
  Record suspected defects and unresolved contracts explicitly.
- BL-116 Authoring Guidelines is advice for people writing their own sites,
  not this reference-replacement project. Future multilingual or versioned
  documentation support is not a prerequisite.

## Working method

Follow [Documentation Style Guide](../documentation-style-guide.md), including
its distinctions between tutorial, how-to, reference and explanation. Use
[Diataxis reference guidance](https://diataxis.fr/reference/),
[Google headings guidance](https://developers.google.com/style/headings), and
[Google illustration guidance](https://developers.google.com/style/images).
Apply their principles; do not claim that a Norna-specific proposal is a rule
from those sources.

1. Inventory the complete public surface at area level, independently of the
   existing documents. Compare implementation to documentation and vice versa.
   Classify correct, incomplete, incorrect, missing and unimplemented claims;
   distinguish verified findings from details not yet audited. Include defaults,
   interactions, validation, reader behavior and no-JavaScript boundaries.
2. Propose categories, pages and H2 sections. State each page's independent
   reader need, scope and prerequisites. Do not mirror internal modules, split
   every H2 into a page, or invent prose to justify a category landing page.
3. Prepare command, configuration and content-construction pilots in
   `fixtures/reference-documentation/site/`, reviewed through the registered
   scratch environment. They are drafts, not a second published reference.
4. Stop for one review of coverage, information structure and pilot writing.
5. After approval, rewrite in bounded groups: site model, configuration,
   content, commands, operation/editor workflows and reader behavior. Adjust
   order if verified dependencies require it. Commit logical groups separately.
6. Update current references, remove superseded user documents, and update
   source-of-truth instructions. Do not remove unique information without a
   recorded destination or explicit reason for excluding it.

## First delivery

- A coverage matrix with public area, implementation/test evidence, existing
  documentation location, status, user consequence and proposed destination.
- A proposed page tree and page contracts, including necessary conceptual
  relationships and destinations for how-to and explanation material.
- An explicit inventory of internal information kept outside user reference.
- Four rendered pilots with minimal valid examples, complete field/option
  boundaries for their scope, and justified illustrations where useful.
- A verification record and a short, concrete review request. Do not present
  an area-level inventory as exhaustive field-by-field certification.

## Acceptance criteria for completion

- An experienced reader can locate exact syntax, accepted values, defaults,
  scope, inheritance, reader overrides, constraints and failure behavior.
- Readers arriving directly can understand the page without reading earlier
  pages. Norna-specific terms are introduced or linked at first relevant use.
- Ordinary Markdown, GFM features, Norna extensions and external tools are
  distinguished. External manuals are linked rather than reimplemented.
- Minimal examples are labelled as such; they do not substitute for a complete
  option or field reference. Rendered results match their displayed source.
- Destructive/file-changing commands describe affected files, preview controls,
  refusal cases and recovery limits, without overstating transaction safety.
- Illustrations answer a named question. Technical diagrams use tightly fitted
  canvases and accessible text; actual UI behavior uses actual rendering.
- Essential rules remain visible, not hidden inside tabs or disclosures.
- Concrete lookup tasks work through both navigation and search. Representative
  long pages work on desktop/mobile and light/dark presentations.
- Relevant examples, links and schemas are checked automatically where feasible;
  existing evidence is reused without unnecessary full test-suite runs.
- Every scoped public area has a destination or an explained exclusion. Open
  gaps, publication differences and unverified claims are visible to maintainers.
- A maintenance map associates reference areas with their code/schema/tests,
  so later feature changes identify the documentation that must be reviewed.

## Not part of this delivery

New engine features, documentation-version selectors, automatic migration,
Marketplace publication, general website redesign and preserving old URLs.
