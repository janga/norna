# Reference completion plan

Working notes for [BL-117: Canonical web reference](backlog/BL-117-canonical-web-reference.md).
The approved pilots establish the writing approach. This records reader needs
for the remaining reference, separately from the implementation coverage map.

## Reader understanding

Command readers know terminal arguments and npm, but cannot be assumed to know
Norna's executable discovery, selected site, generated state or write defaults.
Each command page starts with its effect and smallest invocation, then explains
selection, options, changed files and consequential refusal/recovery limits.

| Page | Reader's question and principal answer | Missing concepts, in reading order | Boundary |
| --- | --- | --- | --- |
| Invocation | Which installation and source folder will this command use? The local project package and selected site are separate choices. | Local launcher; npm wrappers; project versus site; selection precedence | Command effects belong to their command pages |
| Project creation | What does init create or preserve? Standalone creates a project; embedded adds site sources and scripts to an existing project. | Target; source folder; dependency; scripts; workflow ownership | First-site tutorial stays in Getting Started |
| Page creation | Where and what does add write? It writes immediately unless dry-run is selected. | Logical parent; folder order and slug; generated page/category files | Moving existing material belongs to the approved move pilot |
| Validation | Which command checks, moves or generates files? Checks report; sync moves unambiguous images and then regenerates. | Selected site; errors versus warnings; image references; confirmation; partial failure | Full syntax belongs to content reference |
| Navigation review | What does the report measure? It describes derived structure and advisory thresholds without rewriting. | Listed tree; branches; page links; errors versus advice | Navigation rendering belongs to configuration |
| Development | Which preview is running and how do I recover? Managed dev state belongs to the selected site; build refreshes search. | Local/LAN; port; lifecycle; preparation and Astro logs | Publishing belongs to workflows |
| Build | Which outputs change? Build checks sources and prepares a complete static artifact. | Public sync; image generation; output; search | Host setup is a separate task |
| Publishing commands | What will these helpers commit or push? Deploy requires committed sources; deploy:commit has a restricted allowlist. | GitHub/default branch; clean tree; remote divergence; build; watch | Pages setup and combined artifacts stay in workflows |
| Theme inspection | How do I inspect installed defaults? Read resolved values or export a protected reference without replacing theme.yaml. | Preset; export file; profile/rhythm; resolution provenance | Full configuration field tables stay in configuration |
| Engine maintenance | How do I inspect or change the local engine? Version reads; update installs and checks, with no automatic rollback. | Installed versus published version; dependency and lockfile; CI verification | Historic format conversion is a separate workflow |
| Experimental audit | What does migrate:check actually do? It writes an inventory outside a Docusaurus source tree and does not migrate content. | Source tree; report directory; heuristic findings; unresolved cases | Archived migration initiative is not revived |
| Display | Which choices can readers override and remember? Appearance/width always exist; tree navigation also offers Focus reading. | Site defaults; reader overrides; width names; reset; cookies | Theme field syntax and search storage have their own pages |
| JavaScript/accessibility | What can a site deliver without scripts, and what must an author check? Static content remains; enhancement boundaries vary by feature. | Static HTML; interactive enhancements; engine constraints; author responsibility | Internal tests stay in contributor docs; no conformance certification |
| Editor support | How do I install, recognize and troubleshoot optional editing help? Extension and project-local engine must both be present and compatible. | VSIX; workspace; file recognition; providers; formatting; refresh | Extension development stays under editors/vscode |
| Publishing workflow | How do I publish the checked site? Configure its URL and use the starter's Pages workflow. | Static output; repository; Pages source; workflow; verification | CLI flags belong to command reference |
| Embedded publishing | How do I combine Norna with another build? Move the Norna output before the other build cleans dist, then merge at the URL prefix. | Embedded ownership; URL prefix; output collision; root files | No new host integration |
| Upgrading | How do I preserve a working site through an update? Commit the baseline, change engine and source together, then verify. | Exact dependency; lockfile; current model; obsolete formats | Old syntax is labelled historical and never presented as current |

The content pages saved after the restart checkpoint also survive. Their
reader order is syntax/example first, then field meanings and constraints,
then rendered or no-JavaScript behavior. Audit them before cutover; existence
on disk is not validation evidence.

## Evidence and disposition

Use the code/test columns of [the inventory](reference-inventory.md) as the
maintenance map. Keep old sources until each section has a destination or an
explicit exclusion. Preserve the approved Appearance, Sidenotes and page:move
prose. Do not treat tests recorded for those pilots as tests of the new tree.

Engine-repository commands (release, package, regression and registered review
wrappers) remain in Engine Development and package.json. The public CLI map
includes the experimental audit with its limits. Exposed product behavior is
documented without restarting its archived development initiative.
