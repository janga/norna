# BL-155: Page Attachments

## Purpose And Status

Let authors keep PDFs, archives, spreadsheets and other files with the page
that owns them, and insert links without manually writing paths.

**Status: Implemented; commit authorized on 2026-09-30.** The owner approved the product
decisions and form sketch on 2026-09-30. Engine, editor integration and reference
documentation are implemented. The owner handles further interface review and
error reports. Commit authorization does not claim that all manual checks passed.

## Scope And Boundaries

Cover the engine's page-owned files, static publication, Markdown links and
VS Code Site Tree operations. Extract this bounded delivery from
[BL-142 Page-local Files And Explicit Sharing](BL-142-page-local-files-explicit-sharing.md).
It does not require that item's general image/sharing repair workflow.

No remote upload, subfolders inside downloads/, conversion, custom viewer,
attachment redirects, persistent modification-date metadata, language/version
variants or automatic migration of public/ files. Existing public links stay
supported. BL-115 retains the later language/version follow-up.

## Approved Storage And Display Rules

- Store attachments directly in downloads/ beside the owning content.md,
  including site/root/downloads/ for the homepage. public/ remains for shared
  site files such as robots.txt, icons and verification files.
- Allow all file types, including HTML, SVG and other images. Publish bytes
  unchanged. Importing an image as an attachment does not classify it as a
  managed image or insert it visually; it stays in downloads/ with a text link.
  Add Images remains the separate images/ workflow.
- Follow normal browser handling: a PDF, image or HTML file may open for viewing;
  other files may download. Do not force download or promise behavior independent
  of browser settings and hosting headers.
- In Site Tree, show downloads/ only when it contains attachments; apply the
  same rule to images/. A page always retains Add Attachments and Add Images,
  even when those directories are absent or empty. Refresh visibility after
  import and deletion, including external filesystem changes. Hiding an empty
  directory is a presentation rule, not an instruction to delete it from disk.

## Approved Links And Published Addresses

A bare filename refers to the current page's downloads/ only:

```markdown
[Checklist](checklist.pdf)
```

Identical filenames on different pages are allowed. A missing local attachment
is an error, never a reason to select a same-named file elsewhere. Explicit
sharing uses a path from the site's root:

```markdown
[Checklist](/guide/downloads/checklist.pdf)
```

Norna adds the deployment prefix, such as /norna/. The author does not include
that prefix in the site-relative source link. Sharing does not copy the file
or change its owning page.

| Owning page URL | Attachment | Published URL |
| --- | --- | --- |
| / | checklist.pdf | /downloads/checklist.pdf |
| /guide/ | checklist.pdf | /guide/downloads/checklist.pdf |
| /norna/guide/ | checklist.pdf | /norna/guide/downloads/checklist.pdf |

Moving the owning page carries downloads/ with it and changes these addresses.
Update known internal references through the shared engine rules. Old external
attachment URLs do not require redirects. Reuse BL-154's reference-analysis,
dirty-buffer and recovery contracts for rename and supported move operations.
Ordinary cut/paste of Markdown does not transfer files or infer their old owner;
local links resolve in their new page, with diagnostics for missing targets.

Implementation must preserve ordinary page/public links, anchors and external
URLs. Integrate attachment targets into the shared link graph, rather than
adding competing editor-only resolution. Preserve query strings/fragments;
encode filename characters in URLs once, supporting spaces and Unicode through
valid Markdown destinations. Reject ambiguous resolution and published-path
collisions with actionable diagnostics rather than silently changing targets.

## Approved Import And Insertion Flow

Use one form for one or several files. Add Attachments copies files from the
computer to the owning page; create downloads/ only when import proceeds.
For each selected file, offer:

- **Import and insert link** (default), with editable link text initialized
  from the filename.
- **Import**, without inserting a link.
- **Ignore**, leaving that file untouched.

Show source filename, editable destination filename, file type, size and the
source file's filesystem last-modified date in the import form. That date is
not the site's push/publication time and is not independently persisted. Do
not claim it proves when the contents were edited; copies can change filesystem
timestamps. Show available filesystem dates for existing files in conflict
comparisons, without implying preservation of their original import dates.

Insertion uses the cursor if the owning content.md was active when the action
started; otherwise append to that owning page. The form names both the page
and placement before applying. Another active page must never receive the link
implicitly. Capture the intended position before opening the form and detect
stale content before applying; do not insert into invalid Markdown locations.

Insert one attachment as an ordinary Markdown link. Insert multiple attachments
as a bullet list, with user-controlled order in the form. Files set to Import
or Ignore do not appear in that list. Attachments have no image alt-text,
caption or decorative fields. Existing attachments offer **Insert Link in
Page…**, using the same destination and link-text rules. Edits stay unsaved and
support editor Undo; verify dirty save/reopen behavior.

## Approved Collision Handling

- Distinguish the existing file from the incoming file, showing name, size,
  type and available modification date for each.
- For an initial name collision, preselect Replace but require explicit
  confirmation before replacing any file. Alternatively choose a free
  destination filename or Ignore.
- If an edited filename collides with a different existing file, require a
  new active Replace choice for that target. An earlier replacement choice
  does not authorize replacing this other file.
- Two files in one batch must never overwrite one another. Rename or ignore
  one before proceeding. Validate collisions as the user edits names.
- Replacement keeps the target filename and existing links; move the previous
  file to the operating system's Trash. Preflight the batch and reuse explicit
  recovery reporting when a later operation fails. Cancel before applying
  must not create directories, copy files or edit pages.

## Menu And Failure Handling

Follow BL-154's context-menu grouping: Add Attachments on the owning page and
folder; Insert Link in Page, Rename, Replace, References, Copy Link and Delete
on an attachment. The optional downloads/ folder supports confirmed deletion.
Opening files uses the normal VS Code file handling.

Reuse engine filename/path validation, containment checks, reserved-output and
route/alias collision checks, reference-aware confirmation and Trash handling.
Incomplete analysis must be identified, not reported as no references. Reuse
BL-154's refusal of unsafe rename/reference rewrites and its stale-plan checks.
Warn about incoming references before deletion; do not silently rewrite text
or promise that editor Undo restores filesystem operations. Keep diagnostics
for missing attachments distinct from missing pages.

## Dependencies And Delivery

The approved first form (layout approved on 2026-09-30):

```text
Add attachments to Guide
Insert links: at cursor in Guide

1  checklist.pdf                 PDF · 240 KB · Modified 29 Sep 2026 14:32
   File name: [checklist.pdf                                  ]
   Action:    [Import and insert link                       v]
   Link text: [checklist                                      ]
   [Move up] [Move down]

2  examples.zip                  ZIP · 1.2 MB · Modified 28 Sep 2026 09:15
   File name: [examples.zip                                   ]
   Action:    [Import                                        v]

[Add more files]                                 [Cancel] [Import]
```

Keep link text and ordering controls relevant to inserted rows. A collision
expands a comparison within that file's row, labelled Existing file and New
file, with Replace, rename or Ignore choices. Import with replacements adds
the agreed explicit replacement confirmation; it never silently overwrites.

- [BL-154 VS Code Site Tree Context Actions](BL-154-vscode-site-tree-context-actions.md)
  provides the shared menu and mutation foundation and precedes implementation.
- Reuse BL-134 VS Code Image File Operations for import concepts and the engine
  link graph and page-move APIs for ownership/reference handling.
- BL-135 VS Code Image Block Insertion may inform insertion but does not block
  this work; no broader redesign of image insertion is included.

The empty-images-folder rule is an explicit part of this delivery as well as
empty-downloads-folder visibility. Do not let that cross-cutting requirement
fall between BL-154 and BL-155.

The design review is complete. Implementation details follow the existing
engine contracts. The owner handles further review of the functioning
interaction after commit; the approved sketch is not evidence that every
implemented interaction has passed manual review.

## Direct Acceptance Checks

Verify local lookup with duplicate names elsewhere, missing/ambiguous targets,
page/public/external links, spaces/Unicode and query/fragment handling, deployment
prefixes, unchanged published bytes, address collisions, shared references,
page moves and renames. Check PDFs, an archive, an image attachment and HTML/SVG
without asserting browser settings the site cannot control.

Verify empty/missing folder visibility and persistent Add entry points for both
images and attachments. Cover single/batch import, all three per-file actions,
reordering, destination names, source dates, initial and edited-name collisions,
replacement, deletion warnings, cancellation and partial-failure recovery.
Check cursor versus end insertion and stale buffers. Test any new IntelliSense
in the real suggestion widget, and source edits with Undo and dirty save/reopen
in the Default profile. Update author documentation with delivered behavior;
run directly affected tests, not an unrelated full release suite.

## Delivery Evidence: 2026-09-30

- Earlier passing checks are retained: six attachment engine cases, five
  attachment adapter cases, six resource-action cases, page-move and public-file
  checks. They cover ownership, ambiguous/missing links, collisions, dirty-source
  planning, cancellation and partial replacement recovery. They were not repeated
  merely because work resumed.
- A new focused browser test passes for form focus/selection after validation,
  Action changes, replacement checkbox and reordering. The native form uses the
  same generated HTML. Run `npm --prefix editors/vscode run test:attachment-form`.
- A new build case passes for card/Markdown attachment links, Unicode, spaces,
  deployment prefix, query/fragment and unchanged output bytes. It is included
  in `scripts/test-page-attachments.mjs`; only this new case was run on resume.
- VSIX 0.12.0 was built, package-checked and installed in the owner's Default
  profile. Native Add > Add Attachments, form fields, import, unsaved insertion,
  Undo/Redo, save, close/reopen and a second edit/save were checked using the
  disposable `.local/bl155-review/site`. Imported bytes remained after text Undo.
  Batch failure/cancellation permutations use adapter tests, not a claim that
  every permutation was manually repeated.
- Canonical rules: `/reference/site/attachments/`. Editor procedure:
  `/reference/workflows/editor/#add-and-use-page-attachments`.

Review by opening `.local/bl155-review/site` in the Default VS Code profile.
Guide contains disposable attachments; Empty Page demonstrates absent resource
folders with Add actions still available. Further manual review is owner-managed
and does not block commit, as agreed on 2026-09-30.
