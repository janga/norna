---
page:
  description: Disable optional AI editing suggestions while retaining schema-based Norna and YAML completion.
---

# Separate AI suggestions from IntelliSense

AI suggestions and Norna IntelliSense are separate sources of editing help.
Norna and Red Hat YAML use the project's schemas and editor contract. An AI
extension can propose plausible text that does not follow that contract, even
when the file contains a correct `yaml-language-server` schema directive.
For example, `palette:` accepts a built-in palette name, not a group of RGB
values named `primary`, `secondary`, and `accent`.

Inline suggestions appear directly in the document before you accept them.
Copilot can also suggest a next edit elsewhere in the document. Neither is
the schema-based completion list opened with **Trigger Suggest** (`Ctrl+Space`).
Some VS Code releases include Copilot as a built-in extension; absence from
the ordinary installed-extension list does not prove that AI suggestions are
disabled.

## Change the appropriate settings

To turn off these suggestions for YAML and Markdown in your current VS Code
profile:

1. Open the Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows
   or Linux).
2. Run **Preferences: Open User Settings (JSON)**.
3. Add the following settings. If either language block already exists, merge
   the entries into it instead of adding a duplicate block.

```json
{
  "[yaml]": {
    "editor.inlineSuggest.enabled": false,
    "github.copilot.nextEditSuggestions.enabled": false
  },
  "[markdown]": {
    "editor.inlineSuggest.enabled": false,
    "github.copilot.nextEditSuggestions.enabled": false
  }
}
```

## Verify the result

Save the settings and press `Escape` to dismiss an existing suggestion. In a
recognized `theme.yaml`, place the cursor after `palette: ` and run
**Trigger Suggest**. The schema suggestions should include palette names such
as `warm-paper` and `near-monochrome`, without an inline AI proposal.

## Scope and other providers

These settings affect all YAML and Markdown files in projects using this
profile, not only Norna files. Other languages keep their existing settings.
They do not disable Copilot Chat, ordinary completion lists, or formatting.
To restrict the change to one project, use **Preferences: Open Workspace
Settings (JSON)** instead. Workspace settings for the same language can
override your user settings. A setting in a separate test profile does not
change your everyday profile.

If unrelated entries remain in the completion list, investigate word-based
suggestions, snippets, and schema associations separately; disabling inline
suggestions does not remove those providers. See the
[VS Code inline suggestions guide](https://code.visualstudio.com/docs/editing/ai-powered-suggestions)
and [AI settings reference](https://code.visualstudio.com/docs/agents/reference/ai-settings)
for controls supplied by VS Code and Copilot rather than Norna.
