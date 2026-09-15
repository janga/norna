# BL-117: Canonical web reference

## Outcome

Publish one reliable, searchable user reference on Norna's own documentation
site, authored in Norna Markdown. Make its quality demonstrate Norna's ability
to handle substantial information without turning reference into marketing.

Status: first delivery ready for combined human review. The full reference
rewrite has not started.

Review material:

- [Coverage inventory](../reference-inventory.md)
- [Information structure and lookup tasks](../reference-information-structure.md)
- [Pilot site and local review commands](../../../fixtures/reference-documentation/README.md)
- [Verification record](../reference-pilot-verification.md)

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
- Three rendered pilots with minimal valid examples, complete field/option
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
