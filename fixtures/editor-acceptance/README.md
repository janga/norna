# Editor Acceptance Examples

Manual examples for the remaining review of BL-160 Standard Markdown For Local
Attachments, BL-154 VS Code Site Tree Context Actions, BL-155 Page Attachments
and BL-156 Local Site Preview.
Each review page contains its steps and expected result.

## Open The Disposable Copy

From the Norna repository root:

```sh
node fixtures/editor-acceptance/prepare.mjs
npm run review:start -- editor
```

Open `test-sites/editor-review/editor-review.code-workspace` in VS Code.
The editable site and import files are in this visible folder beneath the
repository root. The disposable `test-sites/` directory is ignored by Git.
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
| BL-160 Markdown files | Three path forms, shared definitions, incoming links and page move. |
| BL-154 Context actions | Page title, technical file/folder operations, public-file restrictions and optional themes. |
| BL-155 Import and replace | Single/batch import, collision, replacement, deletion and Trash. |
| BL-156 Local preview | Start/reuse/stop, nested page, saved edits and logs. |
| Incoming links | Verify attachment and public-file links after rename/move. |
| Move destination | Destination for the Markdown files page move. |

The pages can be reviewed independently. For name changes, try unsaved prose,
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

## Review Scope

The owner approved BL-159 Managed Local Markdown Images and BL-166 Page Order
In Frontmatter on 2026-10-11. Their manual pages and dependent links were removed
from this fixture and the active copy at the owner's request. Dedicated engine
regression tests remain in place.

Owner approval remains pending for BL-160 and the remaining BL-154–156
scenarios. The public-file exercise also covers the publication paths from
BL-177 Publication Path Ownership And Collision Checks and the restrictions
from BL-179 Simplify Public Site Resources. No individual manual result is
inferred from this fixture's preparation or automated checks.

Public-file moves use technical verification files under `public/.well-known/`.
Try creating `public/images/` to check its refusal before using the supported
technical folders. The matching import is `imports/verification.txt`.

The fixture contains nine source pages. After changes, run `content:check` for
both this fixture and the active copy; verify the live homepage and incoming
links. The active copy is updated in place so unrelated owner edits survive.
