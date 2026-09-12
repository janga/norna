# BL-080: System-Font Left-To-Right Site Languages

## Status

Technical implementation is complete and was approved by the user on
2026-09-12. Automated checks cover registry completeness, placeholders, locale
resolution, schemas, generated output, and representative Latin, Greek, and
Cyrillic paths. The non-English interface packs have not been human language-
reviewed; the user-facing documentation keeps an explicit warning before
publication.

## Outcome

A site author can select a language from two complementary coverage sets
through the existing `language` field in `site/config.yaml`: fifteen common
global left-to-right languages and a bounded set of European LTR languages.
Every included language uses Latin, Greek, or Cyrillic in its supported form
and works with tested system font stacks. Neither Norna nor the site author
needs to provide a font file.

Norna emits the complete BCP 47 language tag and provides a complete built-in
interface translation for each selected language. Translation completeness is
machine-validated; linguistic correctness remains subject to the review gate
described below.

The target is fifteen supported common LTR languages in total. English counts
toward that target because it is already supported. Swedish remains supported
in addition to the selected fifteen; this change must not remove or weaken an
existing language pack.

European coverage begins with all 24 official EU languages and then adds LTR
languages that are nationally official in other European states when their
supported form uses Latin, Greek, or Cyrillic. Languages already present in the
global set or current Norna support count once. Regional and minority languages
are valuable, but remain a later evidence-based extension so this item retains
a finite completion boundary.

This item extends the current single-language site model. It does not add
translated page variants, language selectors, locale-specific routes,
`hreflang`, or fallback content. Those remain part of the explicitly deferred
[`BL-023` multilingual page trees](../../../BACKLOG.md).

## Author Contract

Use an ordinary language tag when the standard form is sufficient:

```yaml
language: es
```

Use a regional tag when locale-sensitive output should identify a region:

```yaml
language: pt-BR
```

Use a script tag when more than one supported written form exists:

```yaml
language: sr-Cyrl
```

The complete configured tag is preserved in the generated HTML:

```html
<html lang="sr-Cyrl">
```

The setting selects Nornas built-in interface labels and locale-sensitive
formatting. It does not translate editorial Markdown.

## Global Fifteen-Language Set

The implemented set was checked against current
[Unicode CLDR language population data](https://github.com/unicode-org/cldr-json/blob/main/cldr-json/cldr-core/supplemental/territoryInfo.json)
and [CLDR likely-subtag data](https://unicode.org/cldr/charts/latest/supplemental/likely_subtags.html).
Count a standard written language once rather than treating regional variants
or closely related varieties as separate interface translations.

The bounded product-oriented set is:

| Language | Primary accepted tag | Writing system | Current state |
| --- | --- | --- | --- |
| English | `en` | Latin | Existing pack |
| Spanish | `es` | Latin | Implemented; human review recommended |
| French | `fr` | Latin | Implemented; human review recommended |
| Portuguese | `pt` | Latin | Implemented; human review recommended |
| Russian | `ru` | Cyrillic | Implemented; human review recommended |
| Swahili | `sw` | Latin | Implemented; human review recommended |
| Indonesian | `id` | Latin | Implemented; human review recommended |
| German | `de` | Latin | Implemented; human review recommended |
| Javanese | `jv` | Latin | Implemented; human review recommended |
| Vietnamese | `vi` | Latin | Implemented; human review recommended |
| Turkish | `tr` | Latin | Implemented; human review recommended |
| Filipino | `fil` | Latin | Implemented; human review recommended |
| Italian | `it` | Latin | Implemented; human review recommended |
| Nigerian Pidgin | `pcm` | Latin | Implemented; human review recommended |
| Hausa | `ha` | Latin | Implemented; human review recommended |

This list is not a claim that language populations can be ranked with exact
precision. CLDR populations overlap, second-language use changes the order,
and practical website demand differs from total speaker count. Replace a
language only through a documented comparison using the same criteria.

## European Coverage

Use the European Union's maintained list of
[24 official EU languages](https://european-union.europa.eu/principles-countries-history/languages_en)
as the first stable boundary. All use left-to-right writing systems in their
standard official forms. English, French, German, Portuguese, Spanish, and
Swedish are already covered by the global candidate or existing Norna support.

The implementation adds these EU language packs:

| Language | Primary accepted tag | Writing system |
| --- | --- | --- |
| Bulgarian | `bg` | Cyrillic |
| Croatian | `hr` | Latin |
| Czech | `cs` | Latin |
| Danish | `da` | Latin |
| Dutch | `nl` | Latin |
| Estonian | `et` | Latin |
| Finnish | `fi` | Latin |
| Greek | `el` | Greek |
| Hungarian | `hu` | Latin |
| Irish | `ga` | Latin |
| Italian | `it` | Latin |
| Latvian | `lv` | Latin |
| Lithuanian | `lt` | Latin |
| Maltese | `mt` | Latin |
| Polish | `pl` | Latin |
| Romanian | `ro` | Latin |
| Slovak | `sk` | Latin |
| Slovenian | `sl` | Latin |

The European national-language set also contains the following LTR languages
and script forms used outside the EU set:

| Language configuration | Primary accepted tag | Writing system |
| --- | --- | --- |
| Albanian | `sq` | Latin |
| Azerbaijani, Latin script | `az-Latn` | Latin |
| Belarusian | `be` | Cyrillic |
| Bosnian | `bs` | Latin |
| Catalan | `ca` | Latin |
| Icelandic | `is` | Latin |
| Luxembourgish | `lb` | Latin |
| Macedonian | `mk` | Cyrillic |
| Montenegrin | `cnr` | Latin |
| Norwegian Bokmal | `nb` | Latin |
| Norwegian Nynorsk | `nn` | Latin |
| Serbian, Cyrillic script | `sr-Cyrl` | Cyrillic |
| Serbian, Latin script | `sr-Latn` | Latin |
| Turkish | `tr` | Latin |
| Ukrainian | `uk` | Cyrillic |

The first European delivery does not claim every language spoken in Europe.
Regional, minority, non-territorial, and additional sign-language metadata need
their own demand, qualified review, and explicit scope. The locale registry
must remain extensible so adding such packs later does not require another
configuration model.

Armenian and Georgian are deliberately outside this item despite their use in
Europe because their scripts would expand the tested font-coverage contract.
They can be added later with evidence that the required glyphs, weights, and
metrics are reliably available without site-supplied fonts.

## Font Boundary

Inclusion requires all of the following on Nornas supported desktop and mobile
browser platforms:

- ordinary system installations provide the complete script without a Norna
  download, remote font request, or author-provided font file;
- the built-in preset stacks resolve readable regular, emphasized, and heading
  text without missing glyphs;
- diacritics, combining marks, uppercase and lowercase forms where applicable,
  punctuation, and numerals remain legible;
- line boxes, buttons, badges, sticky navigation, tables, notes, and captions do
  not clip the scripts normal glyph extents;
- a clean system using the documented baseline can render the site without an
  optional font package installed by the author.

System-font support does not promise pixel-identical typography across
platforms. It promises complete, readable, layout-safe text. A language that
fails this baseline is removed from BL-080 rather than making local-font
support an implicit dependency.

## Configuration And Locale Model

- Keep `language` as the only author-facing language field.
- Replace the current two-entry language-to-label lookup with a shared locale
  registry containing canonical tags, accepted regional variants, script
  identity, labels, and formatting locale.
- Preserve regional and script subtags in the rendered `lang` value.
- Resolve a supported regional tag such as `es-MX` to the appropriate Spanish
  UI pack while retaining the complete tag for HTML and formatting.
- Do not cross scripts silently. For example, `sr-Cyrl` must not be rewritten
  to `sr-Latn`, even when both forms select the same Serbian terminology.
- Continue to reject languages for which Norna has no complete built-in UI
  pack. Editorial content must not be silently paired with English controls.
- Generate schema and IntelliSense choices from the same locale registry used
  at runtime.
- Keep individual UI labels engine-owned rather than exposing dozens of
  translation fields in `config.yaml`.

## Language-Pack Quality Contract

- Every existing engine label has a value in every shipped language pack.
- Placeholders such as `{count}`, `{reference}`, and `{description}` are
  preserved and tested.
- Terminology is reviewed in context, not translated as an isolated key list.
- A qualified reader of each target language reviews navigation, controls,
  errors, empty states, the generated 404 page, search, notes, callouts, image
  controls, table controls, and screen-reader labels.
- Norna does not publish a language pack assembled solely from unreviewed
  machine translation.
- Labels must fit compact controls and mobile navigation. A translation may be
  shortened only when its meaning and accessible name remain clear.

## Script And Presentation Contract

- Built-in font stacks must provide usable system fallbacks for Latin,
  Cyrillic, and Greek text without asking the author to install a web font.
- Navigation, breadcrumbs, controls, tables, notes, captions, callouts, code
  examples, search results, and generated status pages must remain legible when
  labels use the selected script.
- Diacritics and combining marks must not be clipped by line height, buttons,
  badges, or sticky navigation. Long translated words must wrap or resize
  within compact controls without producing page-level overflow.
- Case conversion must not be required for labels or identifiers because the
  represented scripts do not share one casing model.
- Paths, URLs, command lines, and code remain readable within non-Latin prose.
- Keyboard order and the accessibility tree must follow semantic document
  order.
- The generated site remains useful without client-side JavaScript.

## Search And Generated Output

- Verify the actual indexing and query behavior of Nornas search dependency for
  every selected language rather than assuming that translated search controls
  imply language-aware search.
- Document any absence of stemming, word segmentation, or normalization that
  materially changes search results. Do not call a language fully supported if
  ordinary queries in that language cannot find matching content reliably.
- Locale-sensitive build timestamps use the complete configured language tag.
- Generated 404 pages, redirect pages, search pages, metadata, and accessible
  labels use the selected language pack consistently.

## Acceptance Criteria

- `config.yaml` accepts the approved global fifteen-language set, the bounded
  European set, and suitable regional variants while retaining current `en`,
  `sv`, and Swedish regional behavior.
- Each accepted form resolves through one locale registry to a canonical
  language identity, script, formatting locale, and complete reviewed label
  set.
- Every generated page, search page, redirect page, and generated 404 page
  carries the complete correct `lang` value.
- Unsupported languages and unsupported script variants produce a focused
  diagnostic listing valid alternatives.
- Schema descriptions and IntelliSense show the available languages, explain
  regional and script tags, and identify what `language` does not translate.
- All controls remain usable at desktop, compact, and mobile widths with each
  language packs longest representative labels.
- Automated tests cover locale resolution, regional fallback, script
  preservation, validation, placeholders, generated HTML, date formatting,
  search behavior, and no-JavaScript output.
- Browser fixtures cover Latin, Cyrillic, and Greek scripts in representative
  navigation modes and operating-system font environments.
- Human language review is recorded for every new pack before the feature is
  documented as supported.

## Dependencies And Risks

This work does not depend on multilingual routing or on
`BL-040` convention-based local fonts, but it affects every engine-generated
string and several typography and search assumptions. The main risks are
inaccurate translations, incomplete label registries, unexpected system-font
gaps, clipped controls, inappropriate regional fallback, and overstating
search support.

The implementation was structured around one shared registry, followed by
representative Latin, Cyrillic, and Greek paths and then the remaining packs.
This keeps script, layout, font, and search contracts testable independently
of the qualitative translation review.

## Implementation Record

- `scripts/lib/locale-registry.mjs` is the runtime source of truth for accepted
  tags, scripts, interface packs, schema choices, and locale-sensitive output.
- `scripts/lib/locales/` contains one complete Norna interface pack per primary
  language or supported script form.
- `scripts/lib/pagefind-translations.mjs` supplies complete search-interface
  translations where Pagefind has no matching built-in pack.
- `scripts/test-locales.mjs` verifies all 47 configurations, keys,
  placeholders, scripts, regional resolution, and date-formatting support.
- Generated-page tests exercise Greek and Bulgarian output in the 404 page,
  notes, callouts, and static search.

The unresolved release gate is qualitative rather than structural: every new
translation must be reviewed in its rendered context by a fluent speaker. The
same review should sample compact and mobile navigation and the supported
desktop and mobile system-font environments.
