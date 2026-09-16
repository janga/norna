---
page:
  description: Add a generated list of direct child pages when descriptions help readers choose.
---

# Child-page lists

An empty `page-list` block inserts links and descriptions for a page's listed
direct child pages. Use it when the descriptions explain a choice that page
names alone cannot. Omit it when it merely repeats the navigation tree.

## Syntax and entries

````md title="content.md: place a child list after useful introductory text"
```page-list
```
````

There are no options or manually supplied items. Norna derives membership,
order and titles from the page tree. A child H1 supplies its link title;
`page.description` supplies the text below it.

For a child titled **Install**, a helpful description could be:

```yaml title="Frontmatter excerpt in the child content.md"
page:
  description: Install Norna locally and check that your first preview works.
```

This explains the destination rather than repeating "Install". Norna assembles
the list but does not write its descriptions.

## Boundaries

Only listed direct **content pages** are included, in numeric folder order.
The block neither recurses nor includes or passes through categories. This
differs from a [generated category list](/reference/site/pages/#opening-a-category-url),
which can link to direct child categories as well.

Missing or whitespace-only descriptions warn without stopping the build.
An explicitly empty `description: ""` fails frontmatter validation. A page-list
with no listed direct child pages is an error.

Adding, moving or removing a child updates the list automatically. The output
is ordinary links and requires no JavaScript. Use a page with `content.md`
when a collection needs real introductory content; use a category when it
only needs a navigation label.
