---
page:
  description: Choose a content language and built-in interface translation without adding a multilingual site.
---

# Language

Set `language` to the language of the site's editorial content. Norna uses it
for HTML language metadata, its interface labels and locale-sensitive behavior.
It does **not** translate your Markdown.

```yaml title="site/config.yaml: a Swedish site" {2}
url: https://example.com/
language: sv
```

Omitting the setting uses `en`. It applies to the whole site, including table
text sorting, generated dates and the search interface. Captions, banners and
other author-written text stay as written.

## Language tags

Use a primary value such as `sv`, or add a region such as `en-GB` or `pt-BR`.
Norna preserves the full tag in HTML and locale-sensitive formatting while
selecting labels from the primary language pack. Two-letter and three-digit
region subtags are accepted.

Serbian needs `sr-Cyrl` or `sr-Latn`; `sr` alone is ambiguous. Azerbaijani
requires `az-Latn`, the supported script. Unsupported languages or scripts
fail configuration validation rather than silently using English.

## Supported languages

The supported packs use left-to-right Latin, Greek or Cyrillic scripts with
ordinary system-font fallback. Norna does not supply font files.

> [!WARNING]
> Non-English interface translations were generated and machine-checked, but
> have not been human language-reviewed. Ask a fluent speaker to review the
> generated labels before publishing.

| Language | Primary value |
| --- | --- |
| Albanian | `sq` |
| Azerbaijani, Latin | `az-Latn` |
| Belarusian | `be` |
| Bosnian | `bs` |
| Bulgarian | `bg` |
| Catalan | `ca` |
| Croatian | `hr` |
| Czech | `cs` |
| Danish | `da` |
| Dutch | `nl` |
| English | `en` |
| Estonian | `et` |
| Filipino | `fil` |
| Finnish | `fi` |
| French | `fr` |
| German | `de` |
| Greek | `el` |
| Hausa | `ha` |
| Hungarian | `hu` |
| Icelandic | `is` |
| Indonesian | `id` |
| Irish | `ga` |
| Italian | `it` |
| Javanese | `jv` |
| Latvian | `lv` |
| Lithuanian | `lt` |
| Luxembourgish | `lb` |
| Macedonian | `mk` |
| Maltese | `mt` |
| Montenegrin | `cnr` |
| Nigerian Pidgin | `pcm` |
| Norwegian Bokmål | `nb` |
| Norwegian Nynorsk | `nn` |
| Polish | `pl` |
| Portuguese | `pt` |
| Romanian | `ro` |
| Russian | `ru` |
| Serbian, Cyrillic | `sr-Cyrl` |
| Serbian, Latin | `sr-Latn` |
| Slovak | `sk` |
| Slovenian | `sl` |
| Spanish | `es` |
| Swahili | `sw` |
| Swedish | `sv` |
| Turkish | `tr` |
| Ukrainian | `uk` |
| Vietnamese | `vi` |

## Search and translation limits

Search is available for every accepted language. Pagefind has language-specific
stemming only for [its supported languages](https://pagefind.app/docs/multilingual/);
other packs use generic indexing with translated controls.

Interface labels are engine-owned, not configurable one by one. This setting
does not create translated routes, a language selector, fallback translations
or `hreflang` metadata. Those are not current Norna features.
