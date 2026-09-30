# BL-156: VS Code Local Site Preview

## Purpose And Status

Open the selected page or the whole site locally from the VS Code Site Tree,
without finding a terminal command or constructing its URL by hand.

**Status: Ready after BL-154 VS Code Site Tree Context Actions.** On 2026-09-30
the owner asked to finalize this brief and specified configured port first,
standard port second. The bounded delivery choices below complete the brief.
Implementation has not started. Queue after BL-155 Page Attachments to preserve
its agreed implementation position; this is a scheduling order, not a technical
dependency on attachments.

## Scope And Boundaries

Preview the selected site's saved source in the default browser, using its
project-local Norna engine and existing development-server lifecycle. No
publication, remote hosting, LAN exposure, embedded VS Code browser or second
rendering implementation. Keep this distinct from BL-132's linked-content
hover previews. Do not add a site-content schema field just for the local port.

## Entry Points And Visible Flow

Use the native menu model established by BL-154:

```text
Page context menu                  Site Tree view menu
  Preview Page                       Preview Site
                                     Stop Preview Server
                                     Show Preview Log
```

Preview Site opens the homepage. Preview Page opens that page's canonical
current route, including pages omitted from navigation. Opening a preview
must not select an alias or send the author to the production URL.

Show concise startup progress for the named site; open the browser only when
the intended server is ready. Open through VS Code's normal external-browser
API. If browser launch fails, keep the working server and offer its local URL
for copying/retry. No separate preview webview is needed in this version.

## Port Selection

Use the existing configuration sources in this order:

1. For a registered review site, use its registry target and fixed port through
   the registered review commands. This is site-specific configuration.
2. For other sites, use explicitly configured NORNA_DEV_PORT from the launch
   environment, matching the engine's current command contract.
3. If no port is configured, use 4321.

Document where each source is configured; do not imply that settings.yaml
currently provides a development-port field. Validate the entire configured
value as an integer in 1..65535; invalid configuration is an actionable error,
not permission to silently switch to 4321. Never pass through --kill.

An occupied port is not a trigger for fallback. Reuse it only after verifying
that the listening process belongs to this exact selected site's tracked
server. Otherwise explain the conflict and offer Show Preview Log or guidance
to change the port/stop the other process. Do not kill an unrelated process,
connect to another site, or silently choose the next free port. Two sites with
no explicit port cannot both use 4321 simultaneously; report this honestly.

Changing port configuration does not authorize stopping an existing server
on its old port. Explain the mismatch and allow an explicit stop of that site's
verified server before starting on the configured port.

## Site Identity, URLs And Lifecycle

- Honor the explicit selected siteRoot and its project-local engine. Resolve
  the canonical page route and deployment base path through shared engine APIs;
  compose them with the actual local server origin without duplicating the base.
  For example, Guide may open at http://127.0.0.1:4321/norna/guide/.
- Use registered review commands for registered sites. For other sites, reuse
  the engine's local background server commands. Suppress their automatic
  homepage browser opening so Preview Page opens only the intended target.
- A matching live server is reused without restarting. Current dev:local startup
  stops the tracked server first, so preview must check identity/readiness before
  deciding to start. A reachable port alone does not prove site identity.
- Serialize/coalesce startup requests per site; repeated clicks must not start
  competing processes. Carry the original site/page identity through async work
  even if the user selects a different site while startup is in progress.
- Keep the background server running when the VS Code window closes, matching
  the existing engine lifecycle. Stop Preview Server is explicit and affects
  only the verified selected-site server; it is unavailable when no such server
  is tracked. Show Preview Log opens that site's relevant output without
  requiring the user to find a hidden log path.
- Cancellation stops the preview request. Clean up a server newly started by
  that cancelled request, but never stop a pre-existing reused server. Report
  failed cleanup with the site's explicit stop action.
- Distinguish invalid configuration, occupied port, preparation/build failure,
  startup timeout, stale tracking and failed browser launch. Show the actionable
  cause and relevant log; do not make raw stack traces the primary UI.

## Unsaved Files

The server previews saved source. If text documents within the selected site
have unsaved changes, show their count/names and offer:

- **Save Site and Preview**: explicitly save those documents, then continue.
- **Preview Saved Files**: open the last saved state without changing buffers.
- **Cancel**: neither save nor start a server.

Never silently save unrelated workspace documents. If saving fails or new edits
leave the selected documents dirty during the operation, explain that and do
not pretend the preview contains the unsaved changes. Re-resolve the current
route and base path after saving, since configuration/frontmatter may change.

## Implementation Boundaries

Reuse engine site discovery, route and server ownership rules. Prefer a small
structured, capability-checked engine API for identity/status and local URLs
over scraping English CLI output or duplicating the server manager in the
extension. Older selected engines must receive a clear capability/update
message instead of falling back to another project's engine or a global CLI.

Evaluate BL-015 Local dev-server recovery only where it affects this flow.
Do not make a general server/cache rewrite a hidden prerequisite. Preserve
site/state-directory isolation and test that the preview opens the selected
site when several sites are available in the repository.

## Direct Acceptance Checks And Documentation

Check configured registry port, NORNA_DEV_PORT, default 4321, invalid values,
occupied/unrelated ports, stale state and changed port configuration. Verify
homepage/nested/unlisted page URLs with and without a deployment base, server
reuse without restart, initial startup, repeated clicks, cancellation, explicit
stop, window reload/close behavior and switching selected sites during startup.

Cover each unsaved-file choice, failed save and changed route after save.
Inject preparation/startup/browser-open failures and check clear recovery and
log access. Use disposable sites and the Default VS Code profile to inspect
actual menus, progress and browser destinations. Obtain local approval of the
implemented interaction before commit. Run directly affected checks, not an
unrelated release suite.

Update the extension README, canonical editor reference and relevant local
server guidance together: entry points, port precedence, saved-source preview,
background lifetime, stopping/logs and older-engine limitations.
