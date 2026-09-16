---
page:
  description: Link rendered pages to VS Code locally or to the repository's remote edit interface.
---

# Source links

`editLink` adds a link from a rendered page to its `content.md`. It does not
grant repository access, save edits or publish them. Omit it for no source link.

```yaml title="site/config.yaml" {3,4}
url: https://example.com/
editLink:
  localEditor: vscode
  baseUrl: https://github.com/owner/repository/edit/main/
```

## Destination rules

| Viewing context | Link |
| --- | --- |
| Development through a loopback address such as `localhost` | Local editor when configured, otherwise remote |
| Development through a LAN hostname or address | Remote when configured, otherwise none |
| Static production build | Remote when configured, otherwise none |

Local links only make sense on the computer holding the source. They use the
`vscode://file/` protocol with an absolute file path. VS Code and a browser
willing to open that protocol are required; the browser may ask permission.
Local paths are not emitted into published builds.

## Fields

`localEditor` accepts only `vscode`. `baseUrl` accepts an absolute HTTP/HTTPS
edit-prefix URL without credentials, query or fragment. Supply either or both;
an empty `editLink: {}` is invalid.

The remote prefix must identify the repository branch and any repository
subdirectory needed before the source path. Norna appends the source file's
project-relative path. For GitHub, use `/edit/<branch>/`, not `/blob/<branch>/`.
The source host decides whether the visitor may edit or propose a change.

Source links do not configure [deployment](/reference/workflows/publishing/).
A local edit still needs saving, committing and publishing through the normal
project workflow.
