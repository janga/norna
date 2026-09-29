# BL-149 Separate Site And Root Page

## Purpose And Status

Completed and locally approved on 2026-09-29. Separate the site container from its
homepage directory, leaving a usable engine and VS Code extension at this
commit. BL-150 and BL-151 must not be required to keep authoring working.

## Approved Scope

```text
site/
  site-config/
    settings.yaml
    site-theme.yaml
    shared-content.yaml       optional
  public/                     optional site-wide published files
  root/
    content.md                required homepage
    theme.yaml                optional homepage-only overrides
    images/                   optional homepage images
    pages/                    optional child pages
      010-example/
        content.md
        theme.yaml            optional inherited branch overrides
```

`root/` is a fixed physical name, never a URL segment. The homepage remains
unique, required, and protected from ordinary page movement/removal. Child
ordering does not select a homepage. Page identifiers, public addresses,
aliases, content, image ownership and rendered presentation retain their meaning.

Centralize source path calculations where consumers need the same information;
reusable/editor APIs honor explicit siteRoot. Adapt discovery, rendering,
watching, page/image operations, source links, schemas and editor recognition.
Keep existing theme semantics: the shared theme stays in site-config and only
descendant theme.yaml files inherit. Full theme packages belong to BL-150.

Adapt the VS Code extension in the same item: source opening, IntelliSense,
creation/removal and refresh must work. Show site-config and public as siblings
before the homepage, matching disk; retain normal page icons, hidden owned
content.md and the existing editing actions. Show homepage images directly
under their page. Inspect and obtain local approval for the changed tree before
commit. Do not add new theme UI in this item.

## Conversion Boundary

There are no external users to support. Update maintained sites, fixtures,
starter and the owner's active exercise site directly. Use a bounded helper
only where it saves effort. No new general migration framework or historical
format compatibility matrix is required. Existing site:upgrade must not claim
to produce a current site when it only produces the former layout. Preserve
authored content and local exercise changes. Do not change public URLs merely
because source directories move.

## Verification And Documentation

Use existing page-model, source-path, image, editor and build checks that consume
the changed format; add focused tests for independent explicit site roots,
required root content, stable URLs, root/child creation and theme isolation.
Verify the packaged extension in the owner's Default profile, including actual
suggestion acceptance and dirty save/reopen/Undo for affected editing workflows.
Do not repeat unrelated navigation or complete browser matrices.

Update current reference, source diagrams, starter instructions, editor help
and agent boundaries together. Documentation question: where do site-wide
files and each page's source belong? Introduce the site container before its
root page; show real paths and distinguish filesystem paths from public URLs.

## Reuse And Follow-ups

Reuse BL-148 Content-backed child-page lists, BL-131 VS Code Site Tree,
BL-141 VS Code Active Site Scope, and existing schema/editor test infrastructure.
BL-150 and BL-151 are recorded separately; execution is not authorized by the
instruction to implement this stopping point. No push or release is included.

## Implementation And Verification — 2026-09-29

Source paths now distinguish the site container from its root page. Engine
schema version 5 and VS Code extension 0.8.0 agree on the layout. The extension
is installed locally in the owner's Default profile. No engine release or push
was performed, and BL-150/151 theme behavior remains unimplemented.

Converted 26 maintained sites (176 page nodes), plus the active local exercise,
instruction, extra and scratch sites. Local source backups are retained under
`.local/bl-149/source-backups/`. The exercise's remaining old category source
was converted to content with its original label, description and generated
child list. Page URLs and existing image output paths were preserved; source
links now identify the physical root/ location. The documentation's file-map
SVG was updated, so that asset receives a new content hash normally.

Direct checks covered page identities, creation/movement/aliases, link graphs,
image processing and relocation, homepage/branch themes, explicit site roots,
editor trees, source files, addresses/removal, schema/help references, CLI
initialization, scratch copying, development-server lifecycle and packaging.
The packaged engine installed, built and started its server successfully.
The documentation site built 78 pages; all eight example sites built. Dead-code
and documentation checks passed. No full npm release chain or unrelated browser
matrix was run.

Native VS Code 1.138.0 checks used the installed VSIX in the Default profile,
with a temporary helper in an Extension Development Host and disposable files.
Accepted actual suggestions for root and child content metadata, root theme
fields and the shared theme preset; verified Undo, Redo, Save, Close and Reopen
for all four. No profile settings were changed. Existing adapter tests cover
creation, form edits, removal and address actions; those complete native
interaction matrices were not repeated. Captures and per-case results remain
locally under `.local/bl-149/` and `/private/tmp/norna-bl149-*.png`.

Visual inspection confirms shared files precede the homepage and page images
precede theme and child pages. The owner approved the result in VS Code on
2026-09-29: “Trädet ser bra ut i VS Code.” BL-149 is complete as the approved,
independently usable stopping point.
