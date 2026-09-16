# Reference documentation pilots

Temporary review inputs for [BL-117: Canonical web reference](../../docs/design/backlog/BL-117-canonical-web-reference.md).
These are not deployed with public examples and are not yet canonical docs.

- [Coverage inventory](../../docs/design/reference-inventory.md)
- [Information structure and review tasks](../../docs/design/reference-information-structure.md)
- [Verification record](../../docs/design/reference-pilot-verification.md)
- [Reader-understanding plan](../../docs/design/reference-pilot-editorial-plan.md)

The four pilot pages describe local engine commit `828f70f`, package 0.7.26.
The npm latest version was 0.7.25 when checked on 2026-09-15. Do not claim that
the current npm release implements this entire syntax.

From the repository root, prepare a disposable review copy:

```sh
npm run review:scratch -- prepare --from fixtures/reference-documentation/site
npm run review:start -- scratch
```

If scratch is already prepared, inspect its status and preserve any independent
edits before explicitly using `--replace`. The fixed review address is
`http://127.0.0.1:4399/reference-review/`.

Open the individual pilots at:

- [Appearance](http://127.0.0.1:4399/reference-review/appearance/)
- [Sidenotes](http://127.0.0.1:4399/reference-review/sidenotes/)
- [page:move](http://127.0.0.1:4399/reference-review/move/)
- [URLs and links](http://127.0.0.1:4399/reference-review/urls-and-links/)

The site uses only Norna's existing components and the documentation preset.
Appearance uses a short rule and a highlighted configuration line instead of
a diagram. Sidenotes are demonstrated with actual rendering rather than a
screenshot.

After approval, move the accepted prose to the documentation site and remove
the duplicate draft source. Retain only useful, independently scoped test data.
