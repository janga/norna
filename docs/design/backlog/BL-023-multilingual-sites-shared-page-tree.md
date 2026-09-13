# BL-023: Multilingual Sites With A Shared Page Tree

## Outcome And Status

Let a site owner maintain one page tree and publish it in several languages.
Keep translations beside the page they belong to instead of maintaining a
separate directory tree for each language.

**Deferred; not ready for implementation.** This brief records the agreed
direction, not current Norna behavior or a complete syntax specification.
Resolve the open decisions before scheduling development.

## Agreed Direction

### One Structure, Several Languages

- All languages share page order and parent relationships. Independently
  organized content belongs to separate Norna sites, not translation variants.
  Separate sites may share a domain under different base paths; they do not
  require separate DNS configuration.
- Use the same filename convention for every language, including the default:
  for example, `content.sv.md` and `content.en.md` in one page directory.
  The default language is a site choice, not a special source filename or a
  requirement that every translation originate in that language.
- Translate each page's H1, description, headings, and body. Also support
  translated category labels and site-wide content without duplicating the
  page tree. Their storage syntax remains to be decided.

### URLs And Reader Navigation

- Give every language version its own static URL. The proposed convention is
  a language prefix for every language, including the default, such as
  `/sv/installation/` and `/en/installation/` beneath the site's base path.
- Continue deriving page slugs from directory names. Translated slugs and
  automatic URL changes when H1 changes are outside the initial scope.
- Language switching opens the corresponding page. Preserving an exact
  section or scroll position across translations is not an initial requirement.
- Navigation, internal page links, interface text, and search follow the chosen
  language. Resolve internal destinations through the shared page model.
- Generate the correct HTML language, reciprocal `hreflang` links for actual
  translations, canonical URLs, and language-aware sitemap output. Do not
  canonicalize all translations to the default-language page.

### Images And Missing Translations

- Share images by default and allow language-specific replacements, such as
  translated screenshots. A missing replacement uses the shared image.
- Alt text and captions belong to the translated content, not to the shared
  image file. Exact replacement lookup and naming conventions remain open.
- Do not silently present fallback text as though it were translated. Decide
  explicitly what a reader sees when the requested page translation is missing,
  including navigation, search, language metadata, and language-switch feedback.

### Author Workflow

- `page:move` moves all language variants and page-owned images together and
  repairs affected internal links across languages.
- Keep automatic H2/H3 anchors with optional explicit stable ids. Do not require
  matching heading ids across languages; a changed heading can change its
  automatic anchor without changing the page URL.
- Validate language identifiers and internal links for each published language.
  Define reporting for incomplete translations without assuming that every
  missing translation must be a build error.

## Boundaries And Related Work

- Coordinate the architecture with
  [BL-100: Future Versioning Foundation](BL-100-future-versioning-foundation.md)
  and the deferred BL-025: Versioned Documentation. Neither must be implemented
  first or in the same change. A future move within one version should not
  silently restructure historical versions.
- Existing interface translations are not multilingual page publishing. Reuse
  those language packs where appropriate, but do not confuse their availability
  with translated author content or reviewed translation quality.
- RTL layout and supplying fonts are separate capabilities, not implied by this
  brief. Do not promise arbitrary language support without defining those limits.
- Cross-site market selectors and coordinated publishing of independent sites
  are outside the initial multilingual page model.

## Decisions Before Implementation

1. Site-level language configuration, supported languages, and the default.
2. Root URL behavior and compatibility for existing `content.md` files and
   published URLs when a monolingual site gains translations.
3. Storage for translated category labels, site-wide content, and image variants.
4. Missing-translation behavior, including partially translated branches and
   which destinations language switching offers.
5. Language-aware link resolution, creation commands, move recovery, and aliases.
6. Interaction boundaries with future versioning, including identifying the
   corresponding page after historical moves.

## Future Acceptance Scenarios

Before declaring the eventual implementation complete, demonstrate that:

- A two-language site uses one page tree with consistent order and translated
  page/category labels, metadata, and shared content.
- Each published language has directly accessible static pages and ordinary
  language links; content does not require JavaScript or a cookie to select it.
- A missing translation follows the chosen policy without misleading language
  metadata; shared and language-specific images follow the documented fallback.
- Internal links and search remain within the selected language except where
  an explicit link or the documented fallback intentionally leaves it.
- A page move preserves all variants and images and checks links and URL
  collisions for every affected language.
- Existing monolingual sites remain supported through an explicit compatibility
  or migration policy, with no accidental URL changes from editing H1.

## Background

- [Google: Managing multilingual and multi-regional sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
  recommends separate URLs for language versions and distinguishes languages
  from regional audiences.
- [Google: Localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)
  describes how to connect published language alternatives.
- [W3C: International and multilingual sites](https://www.w3.org/International/questions/qa-international-multilingual)
  explains why market selection and language selection are separate concerns.
