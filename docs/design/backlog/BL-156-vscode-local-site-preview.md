# BL-156: VS Code Local Site Preview

## Purpose And Status

Open the selected page or the whole site locally from the VS Code Site Tree,
without finding a terminal command or constructing its URL by hand.

**Status: Implemented; commit authorized on 2026-09-30.** Completed after BL-155 Page
Attachments on 2026-09-30. The owner approved configured port first and standard
port second. The implementation and documentation below are available in the
local 0.12.0 VSIX. The owner handles further interface review and error reports;
commit authorization does not claim that all manual checks passed.

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
actual menus, progress and browser destinations. The owner handles remaining
manual review after commit. Run directly affected checks, not an
unrelated release suite.

Update the extension README, canonical editor reference and relevant local
server guidance together: entry points, port precedence, saved-source preview,
background lifetime, stopping/logs and older-engine limitations.

## Implementation And Verification

The engine's capability-checked preview API resolves saved page addresses,
validates ports and verifies a live server using its canonical site root,
startup token and process ID. The dev-only identity endpoint accepts loopback
requests; it is not part of the published site. A ready identity is not enough:
the requested page must also render successfully before opening the browser.
Failed rendering cleans up a newly created server but retains a reused one.
Startup failure also cleans up the verified new process if writing its state
record fails. No unrelated process is terminated.

Direct checks on 2026-09-30:

- Port precedence, invalid values, unrelated occupied ports and stale identity
  were already checked before the restart and were not repeated without cause.
- Engine lifecycle checks exercised real startup, queued repeated requests,
  nested/unlisted and homepage URLs, reuse, changed ports, cancellation, log
  access and explicit stop. The initial combined test reached all these
  assertions, then failed in its newly added render-error fixture. That fixture
  was corrected and passed as a separate targeted test; the already passing
  lifecycle assertions were not rerun just to repeat coverage.
- New targeted cases passed for render failure, invalid theme, keeping a reused
  server after HTTP 500, URLs without a deployment prefix, failed state-record
  writing and the loopback-only identity endpoint.
- Five extension adapter cases passed: selected-site saves, saved-only/cancel,
  failed or newly dirty saves, old engines, request coalescing and site changes,
  browser failure, logs and explicit stop. A focused follow-up also checked that
  the modal relies on VS Code's own Cancel button rather than duplicating it.
- The site-tree contract and VSIX package contract passed. VSIX 0.12.0 was built
  and installed in the owner's Default profile without changing profile settings.
- Native review opened Preview Page from its context menu, chose Preview Saved
  Files with an unsaved title, and confirmed that Brave displayed the saved
  page at http://127.0.0.1:4399/theme-inheritance/. After leaving and reopening
  the scratch workspace, Preview Site reused the same server PID. Show Preview
  Log opened the Norna Preview output, and Stop Preview Server removed that
  server's record. The owner's occupied port 4321 was not stopped or replaced.
- Canonical editor documentation and its links passed `content:check`.

The full release suite and repeated editor-version matrices were not run.
Native review covered macOS; other operating systems were not manually tested.

### Owner Review

Open `.local/test-sites/scratch/site` in the Default VS Code profile. This is a
physical disposable site with registered port 4399, not the maintained source.
In Norna Site Tree, try **Preview Page** on a nested page and **Preview Site**
from the view menu. Edit a page without saving to inspect the saved/unsaved
choice. Check **Show Preview Log** and **Stop Preview Server** in the same menu.
The verification server was stopped; Preview starts it again when requested.
Further manual review is owner-managed and does not block commit, as agreed
on 2026-09-30.
