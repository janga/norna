# VS Code Authoring Review

Local visual discussion material for
[BL-133 VS Code Page Files](../backlog/BL-133-vscode-page-files.md). The page
helps the owner understand and choose how to find/open page files in VS Code.
It assumes familiarity with Norna page names, explains VS Code view terms,
and puts an overview and concrete image-opening journey before the remaining
scope and control choices.

`site/` is the maintained source for the local Norna review site. Run a physical
copy through the registered scratch target; preserve existing scratch work
before replacing it. Do not publish this site as current product documentation.

```sh
node docs/design/vscode-authoring-review/generate-sketches.mjs
npm run review:scratch -- prepare --from docs/design/vscode-authoring-review/site --replace
npm run review:start -- scratch
```

Review address: `http://127.0.0.1:4399/vscode-review/bl-133/`.

When checking a build while this review server is running, give the build its
own generated-state directory and use the absolute source path:

```sh
NORNA_INTERNAL_STATE_DIR="$PWD/.local/review-builds/vscode-authoring" \
  node bin/norna.mjs --site-dir "$PWD/.local/test-sites/scratch/site" build
```

This keeps the build's Astro content store and output separate from the live
review server. On 2026-09-20 a build with the relative scratch path rewrote
the live cache with `local-test-sites-scratch-site-page-...` identifiers while
the registered server expected `site-page-...`. The next page request failed
with “has no valid page directory”. The server was stopped and its failed
cache preserved before restarting with a clean cache. The broader recovery
case is recorded under BL-015 Local dev-server recovery in `BACKLOG.md`.
Check actual HTML pages after a build; successful image requests alone do
not establish that page rendering still works.

The editable SVG generator produces schematic full-window VS Code proposals,
including light/dark and compact examples. They are not actual screenshots of
implemented behavior. The embedded image preview comes from the existing
`site/pages/010-features/images/navigation-single-desktop.png`; the homepage
theme, local theme, deep-tree and shared-file scenes identify illustrative
files or structures. YAML and Markdown editor text is schematic.

The drawing frame reaches all canvas edges. Every generated SVG is used in
the review page. Reusable walkthrough text and final real screenshots move to
canonical user documentation after the corresponding behavior is approved
and verified, following the [track method](../vscode-authoring-track.md).

The reference is VS Code's native views and file editors, observed in the
owner's running VS Code window on 2026-09-20 and documented in its
[view guidance](https://code.visualstudio.com/api/ux-guidelines/views).
The design baseline placed **Norna: Site Tree** inside Explorer.
The owner approved the dedicated Norna entry on 2026-09-20 for discoverability.
Proposal 2 reflects the agreed filesystem mapping: the homepage is the root,
resources stay beneath their owner, and configuration precedes `pages/`.
It shows the shared root theme, homepage-only theme, inherited branch themes,
and Add page at each represented `pages/`. Earlier layout alternatives remain
in Git history. The owner approved implementation, including existing public
files, on 2026-09-20. The accepted delivery contract is
[BL-140 VS Code Page Files Implementation](../backlog/BL-140-vscode-page-files-implementation.md).
That implementation is complete and verified in the owner's Default profile.
The drawings remain design history; use the
[editor reference](../../../site/pages/032-reference/pages/060-workflows/pages/010-editor/content.md)
for the delivered controls and current scope.

Generated-state directories belong to the scratch copy, not this source.
