---
page:
  description: Inspect presets and resolved typography, or export a protected reference without changing the active theme.
---

# Theme inspection

Inspect the definitions supplied by the installed engine before choosing
overrides. These commands use the selected site and do not change its active
`theme.yaml`.

## List and export presets

```sh
npm exec -- norna theme:presets
npm exec -- norna theme:export documentation
```

`theme:presets` prints the built-in names and intended uses.
`theme:export <preset>` accepts `portfolio`, `documentation`, `project` or
`statement` and writes a commented `orig-<preset>-theme.yaml` in the selected
site directory. An existing export is never overwritten.

The export is a reference file, not a second active theme. Norna continues to
read only `theme.yaml`. Copy only the settings you intend to override; see
the [theme model](/reference/configuration/theme/) and
[preset values](/reference/configuration/presets/).

## Inspect typography

```sh
npm exec -- norna typography profiles
npm exec -- norna typography show
```

`profiles` prints exact built-in typography profile and rhythm values.
`show` prints resolved typography for the root theme, each page and each
section, identifying the profile, rhythm or root override that supplied it.
Both write to the terminal, not to source files.

The equivalent colon commands are `typography:profiles` and `typography:show`.
[Typography](/reference/configuration/typography/) defines the fields and
their scope.
