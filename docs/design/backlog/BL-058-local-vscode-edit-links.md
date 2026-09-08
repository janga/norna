# BL-058: Local Source Links In VS Code

## Outcome

A site author who opts into VS Code can open the current page's `content.md`
directly from a preview running on the same computer. The published site keeps
using its configured remote source link, and generated static output never
contains an absolute local filesystem path.

## User Contract

- `editLink.localEditor: vscode` enables the local editor destination.
- `editLink.baseUrl` independently enables the remote source destination.
- An `editLink` object must contain at least one of `localEditor` or `baseUrl`.
- A development request through `localhost`, an IPv4 loopback address, or the
  IPv6 loopback address uses the configured local editor.
- A development request through a LAN hostname or address uses `baseUrl` when
  available and otherwise omits the link.
- A production build uses `baseUrl` when available and otherwise omits the
  link.
- The local destination uses VS Code's documented `vscode://file/` URL format
  and a localized **Open in VS Code** label.
- The feature opens a registered editor URL. It does not add an HTTP endpoint
  that executes editor or shell commands.

## Migration

- Enable the option for the Norna documentation site and maintained example
  sites so their local previews demonstrate the workflow.
- Exercise both local and published destinations in fixtures and tests.
- Keep general-purpose starters editor-neutral; choosing an editor remains an
  explicit site-owner decision.

## Acceptance Criteria

- Configuration parsing, generated schema, IntelliSense help, and canonical
  reference documentation describe both independent destinations and their
  precedence.
- Local same-computer development renders a correctly encoded VS Code URL for
  the current page source.
- LAN development and production output never render `vscode://` or expose an
  absolute local source path.
- A configured remote destination remains unchanged in production output.
- Invalid editor names, empty `editLink` objects, malformed remote URLs, and
  unknown keys produce focused diagnostics.
- Unit, site-build, package, and representative browser tests cover the
  routing and non-leakage contract.

## Dependencies And Risks

- VS Code must be installed and registered as the handler for `vscode://` on
  the reader's computer. The browser may ask for confirmation before opening
  the external application.
- A loopback URL is the reliable signal that the browser and source files are
  on the same computer. A LAN request must not assume that its client can read
  paths on the server.
- VS Code Insiders uses another URL scheme and is outside this first closed
  editor set.
