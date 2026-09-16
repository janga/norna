# Reference information structure

Implementation for [BL-117: Canonical web reference](backlog/BL-117-canonical-web-reference.md).
The owner approved the pilot approach on 2026-09-16. This records the resulting
navigation and reader tasks, not a second approval gate.

## Organization and reader prerequisites

Reference is a top-level category between Examples and FAQ. Its six categories
need no introductory index essays: Norna supplies their destination lists.
Getting Started remains a short first-success tutorial; Examples remains the
maintained source/result demonstration. Working on a site holds task procedures
beside, but clearly separate from, syntax and command reference.

Site model assumes ordinary files and folders; configuration assumes YAML;
content syntax assumes basic Markdown; commands assume a terminal and npm.
Each page introduces Norna-specific concepts needed on direct arrival. Reader
experience needs no authoring knowledge. The working notes in
[the completion plan](reference-completion-plan.md) record missing concepts and
reading order separately from implementation coverage.

The canonical source is `site/pages/032-reference/`. The website and Git source
share one authored Markdown tree. `docs/` retains contributor/design material.

## Page contracts

Each row states the independent task served by one page. Use sections for
parts of that same task rather than mechanically splitting at every H2.

| Page | This page helps a site author to… |
| --- | --- |
| [Site files](https://janga.github.io/norna/reference/site/files/) | find editable source files, generated output and the files to keep in Git. |
| [Pages and categories](https://janga.github.io/norna/reference/site/pages/) | organize pages and categories, order siblings and understand category URLs. |
| [URLs and links](https://janga.github.io/norna/reference/site/urls/) | link to pages, headings and files, and keep an old address working with an alias. |
| [Page metadata](https://janga.github.io/norna/reference/site/metadata/) | set descriptions, aliases and navigation visibility in content.md. |
| [Managed images](https://janga.github.io/norna/reference/site/images/) | store images with their page and understand variants, cache state and image metadata. |
| [Public files and output](https://janga.github.io/norna/reference/site/public-files/) | add logos, icons and downloads, and understand social previews, sitemaps and 404 output. |
| [Requirements and limits](https://janga.github.io/norna/reference/site/requirements/) | check build prerequisites and the boundaries of the current Norna release. |
| [Site configuration](https://janga.github.io/norna/reference/configuration/site/) | set the public URL and find the site-wide technical settings in config.yaml. |
| [Language](https://janga.github.io/norna/reference/configuration/language/) | choose a content language and built-in interface translation without adding a multilingual site. |
| [Automatic navigation](https://janga.github.io/norna/reference/configuration/navigation/) | understand which navigation Norna builds from the page tree and how it adapts on narrower screens. |
| [Search](https://janga.github.io/norna/reference/configuration/search/) | enable static search, refresh the local index and understand indexed content and return navigation. |
| [Source links](https://janga.github.io/norna/reference/configuration/source-links/) | link rendered pages to VS Code locally or to the repository's remote edit interface. |
| [Theme configuration](https://janga.github.io/norna/reference/configuration/theme/) | choose a preset and understand site-wide overrides and inherited page themes. |
| [Preset values](https://janga.github.io/norna/reference/configuration/presets/) | look up the public values supplied by each built-in preset and export the installed definition. |
| [Palettes](https://janga.github.io/norna/reference/configuration/palettes/) | choose coordinated light and dark colors without changing layout or typography. |
| [Appearance](https://janga.github.io/norna/reference/configuration/appearance/) | set the site's default light or dark appearance and see when a reader's choice overrides it. |
| [Layout and spacing](https://janga.github.io/norna/reference/configuration/layout/) | control the site frame, prose width, gutters and spacing without confusing them with reader choices. |
| [Image presentation](https://janga.github.io/norna/reference/configuration/images/) | align standalone images with prose or center them, and control width and viewport-height fitting. |
| [Typography](https://janga.github.io/norna/reference/configuration/typography/) | choose font, typography profile and rhythm, and look up supported text-role overrides. |
| [Section backgrounds](https://janga.github.io/norna/reference/configuration/sections/) | choose uniform or repeating H2 background surfaces and understand the tree-navigation restriction. |
| [Shared site content](https://janga.github.io/norna/reference/configuration/shared-content/) | configure shared logo height, timed notices and footer text in sitewide-content.yaml. |
| [Markdown and headings](https://janga.github.io/norna/reference/content/markdown/) | write page headings and ordinary Markdown, and distinguish standard syntax from Norna extensions. |
| [Structured block syntax](https://janga.github.io/norna/reference/content/structured-blocks/) | use the shared YAML rules for image stacks, carousels and card lists. |
| [Image blocks](https://janga.github.io/norna/reference/content/images/) | write an image stack or carousel using page-local images, alternative text and captions. |
| [Card lists](https://janga.github.io/norna/reference/content/cards/) | create linked cards with text, optional images and badges, and control list layout and width. |
| [Child-page lists](https://janga.github.io/norna/reference/content/child-lists/) | add a generated list of direct child pages when descriptions help readers choose. |
| [Semantic callouts](https://janga.github.io/norna/reference/content/callouts/) | give notes, tips and warnings a defined meaning using GitHub-style blockquote markers. |
| [Tabs](https://janga.github.io/norna/reference/content/tabs/) | present short alternatives without changing the page's heading structure. |
| [Details disclosures](https://janga.github.io/norna/reference/content/details/) | put optional context in a native disclosure while keeping headings visible. |
| [Tables](https://janga.github.io/norna/reference/content/tables/) | write GFM tables and understand automatic width, sticky headings, row headings and locale-aware sorting. |
| [Code blocks](https://janga.github.io/norna/reference/content/code/) | add code languages, titles and line emphasis, and understand copying and long-example behavior. |
| [Sidenotes](https://janga.github.io/norna/reference/content/sidenotes/) | add one or more short notes to a paragraph and understand where they appear. |
| [Footnotes](https://janga.github.io/norna/reference/content/footnotes/) | add numbered citations and endnotes, reuse a definition and return to references in tabs. |
| [Command invocation](https://janga.github.io/norna/reference/commands/invocation/) | select the Norna installation and site directory, and find commands by their effects. |
| [Project creation](https://janga.github.io/norna/reference/commands/init/) | know what init creates in standalone and embedded projects and which existing files it refuses to replace. |
| [Page and category creation](https://janga.github.io/norna/reference/commands/create/) | add a page or category with predictable parent selection, folder naming and preview controls. |
| [page:move](https://janga.github.io/norna/reference/commands/move/) | move a page with its files and child pages, update internal links, and retain old addresses. |
| [Validation and image sync](https://janga.github.io/norna/reference/commands/validate/) | distinguish read-only checks, managed-image moves and generated image output. |
| [Navigation review](https://janga.github.io/norna/reference/commands/navigation/) | read the derived page-tree report and distinguish content errors from editorial recommendations. |
| [Development and preview](https://janga.github.io/norna/reference/commands/development/) | start, inspect and stop local or LAN development, and distinguish dev output from a static build preview. |
| [Build and public output](https://janga.github.io/norna/reference/commands/build/) | understand the build sequence, generated public output and the boundary of direct Astro commands. |
| [Publishing commands](https://janga.github.io/norna/reference/commands/publishing/) | know what deploy helpers build, commit, push and monitor, including their refusal conditions. |
| [Theme inspection](https://janga.github.io/norna/reference/commands/theme/) | inspect presets and resolved typography, or export a protected reference without changing the active theme. |
| [Engine maintenance](https://janga.github.io/norna/reference/commands/engine/) | inspect the selected installation and paths, or update the exact project dependency and lockfile. |
| [Experimental migration audit](https://janga.github.io/norna/reference/commands/migration-audit/) | understand the experimental Docusaurus inventory command and the limits of its generated report. |
| [Display and preferences](https://janga.github.io/norna/reference/reader/display/) | understand reader-controlled appearance, reading width, Focus reading and saved preferences. |
| [JavaScript and accessibility](https://janga.github.io/norna/reference/reader/accessibility/) | check what remains usable without JavaScript and where engine presentation safeguards end and author responsibility begins. |
| [VS Code editor support](https://janga.github.io/norna/reference/workflows/editor/) | install optional VS Code help, recognize supported files and troubleshoot suggestions, diagnostics and formatting. |
| [Separate AI suggestions from IntelliSense](https://janga.github.io/norna/reference/workflows/editor-ai-suggestions/) | disable optional AI editing suggestions while retaining schema-based Norna and YAML completion. |
| [Publish to GitHub Pages](https://janga.github.io/norna/reference/workflows/publishing/) | configure and verify a standalone site's GitHub Pages deployment using its generated workflow. |
| [Publish beside another static build](https://janga.github.io/norna/reference/workflows/embedded-publishing/) | combine an embedded Norna site and another static build at the configured URL prefix. |
| [Upgrade a site](https://janga.github.io/norna/reference/workflows/upgrading/) | preserve a working baseline while updating the engine, source format and lockfile together. |
| [Convert legacy site sources](https://janga.github.io/norna/reference/workflows/legacy-source/) | recognize obsolete source filenames and settings when bringing an older site to the current file model. |

## Lookup and visual review

Find these answers through both navigation and the built search index:

1. Whether page:move writes by default, what --no-aliases preserves, and what
   can be repaired after a manual move.
2. Why a saved Light choice overrides a site's Dark default, and how Reset works.
3. Whether two sidenotes can share one paragraph and whether they can be in a table.
4. Which category child determines its URL destination.
5. Whether content:sync rolls back completed image moves after a failure.
6. Where to refresh a stale search index.
7. Which paths and providers receive VS Code help and how formatting is owned.
8. Whether an unlisted page is excluded from output, search or the sitemap.

Inspect representative long pages, tables, source/result pairs and navigation
at desktop/mobile sizes and in light/dark appearances. Search-source headings
alone do not establish index findability. Record checks and any gaps in the
verification record rather than in public prose.

The approved pilots demonstrate that short rules, valid examples and focused
cross-references are often sufficient. Use an illustration only for a named
question that benefits from it. No new rendering engine or presentation styles
are needed for this reference.
