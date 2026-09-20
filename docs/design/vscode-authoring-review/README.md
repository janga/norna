# VS Code Authoring Review

Local visual discussion material for
[BL-133 VS Code Page Files](../backlog/BL-133-vscode-page-files.md). The page
helps the owner understand and choose how to find/open page files in VS Code.
It assumes familiarity with Norna page names, explains VS Code view terms,
and puts an overview and concrete image-opening journey before layout choices.

`site/` is the maintained source for the local Norna review site. Run a physical
copy through the registered scratch target; preserve existing scratch work
before replacing it. Do not publish this site as current product documentation.

```sh
node docs/design/vscode-authoring-review/generate-sketches.mjs
npm run review:scratch -- prepare --from docs/design/vscode-authoring-review/site --replace
npm run review:start -- scratch
```

Review address: `http://127.0.0.1:4399/vscode-review/bl-133/`.

The editable SVG generator produces schematic full-window VS Code proposals,
including light/dark and compact examples. They are not actual screenshots of
implemented behavior. The embedded image preview comes from the existing
`site/pages/010-features/images/navigation-single-desktop.png`; the local theme
and shared-file scenes explicitly identify added illustrative files.

The drawing frame reaches all canvas edges. Every generated SVG is used in
the review page. Reusable walkthrough text and final real screenshots move to
canonical user documentation after the corresponding behavior is approved
and verified, following the [track method](../vscode-authoring-track.md).

The reference is VS Code's native views and file editors, observed in the
owner's running VS Code window on 2026-09-20 and documented in its
[view guidance](https://code.visualstudio.com/api/ux-guidelines/views).
The extension source currently places **Norna: Site Tree** inside Explorer.
The owner approved the dedicated Norna entry on 2026-09-20 for discoverability.
The owner subsequently chose filesystem-based grouping with configuration
before `pages/`; see the decisions in BL-133 VS Code Page Files. These first
drawings retain the earlier synthetic groups as discussion history. Revise
them for the implemented root model before asking for final acceptance.

Generated-state directories belong to the scratch copy, not this source.
