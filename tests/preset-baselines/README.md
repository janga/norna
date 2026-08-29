# Preset Visual Baselines

These images record Norna's existing preset output before the profile resolver
is reorganized. Every image uses the same source fixture:

`fixtures/preset-baseline/site`

The captured page contains nested navigation, H1 through H4, prose, links,
inline and fenced code, a sidenote, an image stack, a carousel, cards, a banner,
and a footer.

## Reference Matrix

| Preset | Desktop light | Desktop dark | Mobile light | Mobile dark |
| --- | --- | --- | --- | --- |
| `portfolio` | [View](images/portfolio-desktop-light.jpg) | [View](images/portfolio-desktop-dark.jpg) | [View](images/portfolio-mobile-light.jpg) | [View](images/portfolio-mobile-dark.jpg) |
| `documentation` | [View](images/documentation-desktop-light.jpg) | [View](images/documentation-desktop-dark.jpg) | [View](images/documentation-mobile-light.jpg) | [View](images/documentation-mobile-dark.jpg) |
| `project` | [View](images/project-desktop-light.jpg) | [View](images/project-desktop-dark.jpg) | [View](images/project-mobile-light.jpg) | [View](images/project-mobile-dark.jpg) |
| `statement` | [View](images/statement-desktop-light.jpg) | [View](images/statement-desktop-dark.jpg) | [View](images/statement-mobile-light.jpg) | [View](images/statement-mobile-dark.jpg) |

Desktop captures use a `1440 x 1000` viewport. Mobile captures use
`390 x 844`. Both are full-page JPEG references.

The mobile source deliberately contains one long unbroken inline-code token.
Current rendering lets that token widen the document, so the recorded mobile
images are `564` or `565` pixels wide despite the `390` pixel viewport. This is
a baseline finding for the engine-contract phase, not intended target behavior.

## Reproduce

Run:

```sh
npm run preset:baselines:capture
```

The command builds an isolated copy of the fixture for every preset, verifies
the characterized output, and replaces the files under `images/`.

These images are review references, not pixel-perfect CI assertions. The
presets currently use operating-system font stacks, so glyph metrics and
anti-aliasing can differ across platforms. The accompanying
`npm run test:preset-baselines` command checks stable resolved values and
rendered structure instead.
