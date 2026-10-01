---
page:
  description: Write headings, paragraphs, links, lists and code with ordinary Markdown.
---

# Everyday Markdown

Use ordinary Markdown for the main text of a page. These examples need no
Norna-specific syntax.

## Headings and paragraphs {#headings-and-paragraphs}

### Arrange a visit

We welcome visitors by appointment.

Tell us when you would like to come.

````md
### Arrange a visit

We welcome visitors by appointment.

Tell us when you would like to come.
````

**Source:** Standard Markdown. A page starts with one H1 (`#`); H2 (`##`)
introduces its main sections and H3 (`###`) subdivides them. H4 is not recommended for ordinary pages: keep the hierarchy
shallow and aim for H1–H3. If a topic
needs more levels, simplify its structure or give it a separate page. Read the
[heading reference](/reference/content/markdown/#page-title-and-sections).

## Emphasis, lists and quotations {#emphasis-lists-and-quotations}

Tell us **who lives at home** and _when you can visit_.

1. Read about the dogs.
2. Send us your questions.

> Visits are by appointment.

````md
Tell us **who lives at home** and _when you can visit_.

1. Read about the dogs.
2. Send us your questions.

> Visits are by appointment.
````

**Source:** Standard Markdown. Use emphasis, lists and quotations to make the
relationships in your text clear.

## Links {#links}

Read [Getting started](/getting-started/) or jump to the
[complete sites](/examples/complete-sites/).

````md
Read [Getting started](/getting-started/) or jump to the
[complete sites](/examples/complete-sites/).
````

**Source:** Standard Markdown. Use meaningful link text. Norna resolves local
page URLs for the site's deployment path; do not add `/norna/` to source links.
See [URLs and links](/reference/site/urls/).

## Code blocks {#plain-code-blocks}

```sh
npm run norna:dev
```

````md
```sh
npm run norna:dev
```
````

**Source:** Standard fenced Markdown. The language name enables syntax
highlighting. Norna supplies the presentation and a copy control when
JavaScript is available. [Titles and highlighted lines](/examples/norna-extensions/#code-blocks) use
additional Norna syntax.
