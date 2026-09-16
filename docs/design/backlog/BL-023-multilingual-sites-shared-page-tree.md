# BL-023: Multilingual Sites With A Shared Page Tree

## Purpose And Status

Let a site owner maintain one page tree and publish it in several languages.
Keep translations beside the page they belong to instead of maintaining a
separate directory tree for each language.

**Deferred; not ready for implementation.** This is a design record, not
current Norna behavior or a complete syntax specification. It describes the
future authoring model needed before multilingual publishing can be scheduled.

## Scope And Boundaries

This item covers one site with one page hierarchy and several translations of
that hierarchy. It does not cover regional sites with different page trees:
those are separate Norna sites, even when they share a domain or are published
under separate base paths.

It also excludes RTL layout, author-provided fonts, cross-site market
selection, and coordinated publication of independent sites. Existing
interface-language packs are not translated editorial content.

## Decisions Made

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
  page tree.

### URLs And Reader Navigation

- Continue deriving page slugs from directory names. Translated slugs and
  automatic URL changes when H1 changes are outside the initial scope.
- Language switching opens the corresponding page. Preserving an exact
  section or scroll position across translations is not an initial requirement.
- Navigation, internal page links, interface text, and search follow the chosen
  language. Resolve internal destinations through the shared page model.

### Images And Missing Translations

- Share images by default and allow language-specific replacements, such as
  translated screenshots. A missing replacement uses the shared image.
- Alt text and captions belong to the translated content, not to the shared
  image file. Exact replacement lookup and naming conventions remain open.
- Do not silently present fallback text as though it were translated. Decide
  explicitly what a reader sees when the requested page translation is missing.

### Author Workflow

- `page:move` moves all language variants and page-owned images together and
  repairs affected internal links across languages.
- Keep automatic H2/H3 anchors with optional explicit stable ids. Do not require
  matching heading ids across languages; a changed heading can change its
  automatic anchor without changing the page URL.
- Validate language identifiers and internal links for each published language.

## Preliminary Proposals

These proposals are compatible with the decisions above, but are not approved
author contracts yet.

- Publish every language at a distinct URL, possibly with a language prefix
  for every language including the default, for example
  `/sv/installation/` and `/en/installation/` beneath the site's base path.
- Store translated category labels, site-wide content, and image replacements
  beside their shared counterparts. The exact filenames and lookup order are
  not decided.
- Let a missing language-specific image use an explicitly shared image. Keep
  alt text and captions in the translated Markdown rather than on the shared
  file.
- Generate `hreflang`, canonical metadata, and language-aware sitemap output
  only for published translations. Do not canonicalize every translation to
  the default-language page.
- Report incomplete translations without making every missing page a build
  error. The report format and whether any absence must fail a build are open.

## Open Questions

1. What site-level configuration declares the published languages and default
   language?
2. How are translated category labels, site-wide content, and image variants
   named and located?
3. What exact URL model applies to the default language, and how does an
   existing monolingual site adopt it without accidental URL changes?
4. What does a language switcher offer when the corresponding translation is
   absent, and what language metadata, navigation, and search behavior follows?
5. How do page creation, link resolution, `page:move`, recovery, and aliases
   identify a language variant without changing another variant by mistake?
6. How must language and documentation-version selection compose when both
   future capabilities exist?

## Dependencies

- Coordinate the architecture with
  [BL-100: Future Versioning Foundation](BL-100-future-versioning-foundation.md)
  and [BL-025: Versioned Documentation](BL-025-versioned-documentation.md).
  This is a coordination dependency, not a delivery order: neither feature
  needs implementation first, but the models must agree before either feature
  introduces persistent paths or source layout. A move in one documentation
  version must not silently rewrite historical versions.
- Reuse relevant engine interface-language packs, but do not confuse their
  existence with reviewed editorial translations.

## Ready For Implementation When

- Every open question above has an approved answer or an explicit first-scope
  exclusion.
- The chosen source layout has a migration policy for an existing monolingual
  `content.md` site.
- The language/version interaction has a documented boundary, even if one of
  the features is delivered later.
- A small representative site can serve as a fixture for shared content,
  absent translations, language switching, links, search, and `page:move`.

## Eventual Feature Acceptance

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
