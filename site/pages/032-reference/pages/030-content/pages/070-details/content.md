---
page:
  description: Put optional context in a native disclosure while keeping headings visible.
---

# Details disclosures

A native HTML `details` block lets readers open optional context. It works
without JavaScript. Keep essential instructions visible instead of placing
them in a disclosure.

## Syntax and result

```html title="content.md: optional context"
<details>
<summary>Why keep the lockfile?</summary>

It records exact dependency versions for repeatable installations.

</details>
```

<details>
<summary>Why keep the lockfile?</summary>

It records exact dependency versions for repeatable installations.

</details>

The plain-text summary is the disclosure's visible control. Blank lines around
its Markdown body allow paragraphs to render. Norna supplies a neutral surface;
use a [semantic callout](/reference/content/callouts/) for a message whose
meaning should be visible immediately.

## Keep structure outside

Markdown and HTML headings H1-H6 are forbidden anywhere inside `details`,
including the summary and nested elements. Hidden content must not determine
page navigation. Use bold labels for internal distinctions or move the heading
outside. Literal heading examples inside code remain allowed.

Sidenotes cannot occur inside disclosures. Content checking, builds and local
preview report prohibited headings with their source location. This is a
Norna constraint on ordinary HTML disclosure syntax, not a separate colon
container construction.
