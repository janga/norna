# BL-031: System Appearance As The Universal Default

## Outcome

Norna uses `system` as the initial Appearance whenever a site does not set
`appearance.default` explicitly. This applies consistently with or without a
theme preset and regardless of the selected palette.

Sites can still select `light` or `dark` explicitly. A reader's stored
Appearance choice continues to take precedence over the configured default.

## Current Discrepancy

The `documentation`, `project`, and `statement` presets default to `system`.
The `portfolio` preset defaults to `dark`, and a theme without a preset inherits
the selected palette's default, which can also be `dark`.

## Acceptance Criteria

- Every built-in preset resolves to `appearance.default: system`.
- A theme without a preset or explicit Appearance also resolves to `system`.
- Changing only `palette` does not change the initial Appearance.
- Explicit `appearance.default: light` and `appearance.default: dark` remain
  supported.
- Stored reader choices continue to override the configured initial Appearance.
- Preset baselines, generated reference files, schemas, tests, and canonical
  documentation describe the same behavior.
