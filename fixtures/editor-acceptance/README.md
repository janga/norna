# Editor Acceptance Examples

Manual examples for BL-166 Page Order In Frontmatter, BL-159 Managed Local
Markdown Images, BL-160 Standard Markdown For Local Attachments, BL-154 VS Code
Site Tree Context Actions, BL-155 Page Attachments and BL-156 Local Site Preview.
Each review page contains its steps and expected result.

## Open The Disposable Copy

From the Norna repository root:

```sh
node fixtures/editor-acceptance/prepare.mjs
npm run review:start -- editor
```

Open `.local/test-sites/editor-review/editor-review.code-workspace` in VS Code.
Use extension **0.15.0** or later and **Developer: Reload Window** to load the
working-tree engine. The workspace exposes the copied site and import files;
it uses the engine in the ancestor Norna repository without installing or linking
another package. The existing general scratch site is separate.

Review URL: <http://127.0.0.1:4398/review/>. The registered `editor` target gives
VS Code's **Preview Page/Site** the same port, independently of the docs server.
The fixture's configured site URL is this local address, so **Copy Link** also
produces usable local links. That action uses the configured publication URL.
The edit link at the bottom of each preview page opens that copied page's
`content.md` in VS Code.
Install the evaluation VSIX yourself if needed: `editors/vscode/norna-vscode.vsix`.

| Page | Review |
| --- | --- |
| BL-166 Create between pages | Create after Alpha with orders 1, 2, 3; cancel, then confirm renumbering. |
| BL-166 Move between pages | Move Move me after Alpha in a separate group; cancel, then confirm. |
| BL-159 Markdown images | Three path forms, shared definitions, title/alt text, rename and page move. |
| BL-160 Markdown files | Three path forms, shared definitions, incoming links and page move. |
| BL-154 Context actions | Page title, shared-image file/folder operations, public-file restrictions and optional themes. |
| BL-155 Import and replace | Single/batch import, collision, replacement, deletion and Trash. |
| BL-156 Local preview | Start/reuse/stop, nested page, saved edits and logs. |
| Incoming links | Verify attachment and public-file links after rename/move. |
| Move destination | Destination for the image and attachment page moves. |

Test the two BL-166 groups before changing their order manually. Creation in
one group does not consume the other group's renumbering case. The remaining
pages can be reviewed independently. For name changes, try unsaved prose,
text Undo/Redo, save, close and reopen. Text Undo does not reverse filesystem
transactions such as a resource rename or page move.

Cancel removal of referenced resources unless deliberately testing broken
links. Confirm deletion on an unreferenced file imported for that purpose.
The initial fixture is valid; deleting a referenced file deliberately changes
that condition. No manual acceptance is inferred from creating these examples.

## Start Again

Close or discard dirty editor buffers first. These commands deliberately
replace the disposable site's edits with the maintained source:

```sh
npm run review:stop -- editor
node fixtures/editor-acceptance/prepare.mjs --replace
npm run review:start -- editor
```

The source fixture under `fixtures/editor-acceptance/site/` stays unchanged.
Import files remain outside the site and are not published. For isolated
build verification, use a separate state directory while a preview runs:

```sh
NORNA_INTERNAL_STATE_DIR="$PWD/.local/editor-review-build/.norna" node bin/norna.mjs --site-dir fixtures/editor-acceptance/site build
```

## Preparation Checks

On 2026-10-04 the 19-page fixture build and review-registry checks passed.
Read-only engine plans confirmed the exact three sibling changes in each
renumbering case, reference-only image/file usage and incoming-link rename.
The extension's project discovery selected this repository's engine, and the
preview API selected the registered port 4398. A browser with JavaScript
disabled loaded all eight image instances, received the unchanged attachment
bytes and opened the nested preview target. The creation instructions and
order table were inspected at the compact viewport.

Native VS Code interactions and owner approval remain pending.

BL-177 Publication Path Ownership And Collision Checks updates the maintained
fixture's public-file operations to shared images and changes cross-page
attachment addresses to the reserved resource area. Its isolated build passed
on 2026-10-04 with 20 generated HTML pages. An existing disposable copy is not
updated automatically; retain any wanted edits before using **Start Again**.
