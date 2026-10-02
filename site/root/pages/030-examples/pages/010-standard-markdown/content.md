---
page:
  description: Learn the basics of Markdown with small examples of paragraphs, headings, emphasis, lists, links and code.
  aliases:
    - /examples/everyday-markdown/
---

# Standard Markdown

Markdown is plain text with a few markers for structure and formatting. You
write the source in a text file; Norna turns it into a web page. For example,
`**important**` becomes **important**. You do not need to write HTML.

In Norna, a page's text lives in `content.md`. Each example below shows the
result first and then the Markdown to type. Copy a small example into your
page and preview it to see the difference. This tour uses the basic syntax
specified by [CommonMark](https://spec.commonmark.org/0.31.2/).

## Paragraphs {#paragraphs}

We welcome visitors by appointment.
Tell us when you would like to come.

Bring your questions about the dogs.

```md
We welcome visitors by appointment.
Tell us when you would like to come.

Bring your questions about the dogs.
```

**Source:** Standard Markdown. Write ordinary sentences without extra markers.
Leave an empty line to start a new paragraph. A single line break in the
source stays within the same paragraph; the browser wraps the text to fit its
width. Repeated spaces or empty lines are not a way to position content.

## Headings {#headings-and-paragraphs}

### Arrange a visit

We can help you choose a suitable time.

```md
### Arrange a visit

We can help you choose a suitable time.
```

**Source:** Standard Markdown. Put hash signs (`#`) at the start of a line,
followed by a space and the heading text. In Norna, each page starts with one
H1 (`# Page title`). Use H2 (`## Main section`) for its main sections and
H3 (`### Subsection`) within those sections. The example above is H3 inside
this page's Headings section.

Choose levels to express the structure, rather than to change the font size.
H4 is not recommended for ordinary pages: aim for H1–H3. If you need more
levels, simplify the structure or give the topic a separate page. Norna uses
H2 headings in navigation. See the
[heading reference](/reference/content/markdown/#page-title-and-sections).

CommonMark also allows an H1 to be underlined with `=` or an H2 with `-`.
Norna supports these headings, though hash signs make the level easier to see
while editing.

## Bold and italic text {#emphasis-lists-and-quotations}

Tell us **who lives at home** and _when you can visit_.

```md
Tell us **who lives at home** and _when you can visit_.
```

**Source:** Standard Markdown. Put two asterisks on each side of text for
**bold**, or one underscore on each side for _italics_. A single asterisk also
produces italics: `*when you can visit*`. Keep the markers next to the words,
without spaces just inside them. Use emphasis sparingly so it remains useful.

## Lists {#lists}

Bring:

- Your questions
- Notes about your daily routine

Before your visit:

1. Read about the dogs.
2. Book a time.
3. Tell us about any accessibility needs.

```md
Bring:

- Your questions
- Notes about your daily routine

Before your visit:

1. Read about the dogs.
2. Book a time.
3. Tell us about any accessibility needs.
```

**Source:** Standard Markdown. Use a hyphen and a space for each bullet. Use
a number, a period and a space for a numbered list. Bullets collect related
items; numbers suit steps whose order matters. Put each item on its own line,
and leave an empty line before and after the list.

Indent a list item to put it under the main item it belongs to. For example,
each part of a visit can have its own details:

- Before the visit
    - Read about the dogs.
    - Write down your questions.
- On the day
    - Bring your notes.
    - Arrive at the agreed time.

```md
- Before the visit
    - Read about the dogs.
    - Write down your questions.
- On the day
    - Bring your notes.
    - Arrive at the agreed time.
```

Indent nested markers by four spaces. Keep nesting shallow so readers can scan
the list.

## Quotations {#quotations}

> Visits are by appointment.
>
> Please contact us before travelling.

```md
> Visits are by appointment.
>
> Please contact us before travelling.
```

**Source:** Standard Markdown. Start quoted lines with `>` and a space.
A line containing only `>` separates paragraphs within the quotation. Use a
quote for someone else's words or a quoted passage. For a tip or warning,
see [GitHub-style alerts](/examples/common-markdown-extensions/#semantic-callouts).

## Links {#links}

Read [Getting started](/getting-started/), explore the
[complete sites](/examples/complete-sites/), or visit
[CommonMark](https://commonmark.org/).

```md
Read [Getting started](/getting-started/), explore the
[complete sites](/examples/complete-sites/), or visit
[CommonMark](https://commonmark.org/).
```

**Source:** Standard Markdown. Put the visible link text in square brackets
and the destination immediately after it in parentheses: `[text](address)`.
Use text that tells the reader where the link goes, such as "Getting started",
instead of "click here". An external address includes `https://`.

For pages in this site, use their page URL, such as `/getting-started/`.
Norna adds any deployment prefix, so do not add `/norna/` to source links.
A link such as `[Lists](#lists)` jumps to a heading on the same page. See
[URLs and links](/reference/site/urls/) for more examples.

### Reference-style links

You can put the destination in a definition instead of the sentence. This is
useful when the same address appears more than once or when a long address
would make the paragraph hard to read.

Read [Getting started][guide] before your first build.

[guide]: /getting-started/ "Install Norna"

```md
Read [Getting started][guide] before your first build.

[guide]: /getting-started/ "Install Norna"
```

The label connects the reference to its definition. The optional title may be
shown by a browser on hover; it does not replace clear link text.

## Code within a sentence {#inline-code}

Edit `content.md` and save the file.

```md
Edit `content.md` and save the file.
```

**Source:** Standard Markdown. A backtick on each side marks a short piece of
code, a filename or a command. Formatting markers inside it stay literal:
`**bold**` shows the asterisks. Backticks are different from quotation marks.

## Code blocks {#plain-code-blocks}

```sh
npm run norna:dev
```

````md
```sh
npm run norna:dev
```
````

**Source:** Standard fenced Markdown. Put three backticks on a line before
the code and three on a line after it. The lines between them retain their
spacing. The optional language name after the opening backticks, here `sh`
for shell commands, tells the renderer how to highlight the code. Leave it
out for plain text. A code block displays a command; it does not run it.

Norna adds a copy control when JavaScript is available.
[Titles and highlighted lines](/examples/norna-extensions/#code-blocks) use
additional Norna syntax.

If the code itself contains three backticks, use a longer fence around the
example:

````md
```sh
npm run norna:dev
```
````

## Literal punctuation {#literal-punctuation}

Write \*these asterisks\* as ordinary text.

```md
Write \*these asterisks\* as ordinary text.
```

**Source:** Standard Markdown. If a punctuation mark would be treated as
formatting, put a backslash (`\`) before it. The backslash tells Markdown to
show the mark itself. For a code fragment or filename, backticks are usually
clearer.

## Line breaks and dividers {#line-breaks-and-dividers}

This sentence ends here.\
This sentence starts on the next line, in the same paragraph.

---

The divider separates these paragraphs.

```md
This sentence ends here.\
This sentence starts on the next line, in the same paragraph.

---

The divider separates these paragraphs.
```

**Source:** Standard Markdown. A backslash at the end of a source line makes
a hard line break. A blank line starts a new paragraph. A line with three
hyphens creates a thematic divider; use a heading when the next part has a
name, because a divider alone does not describe the new section.

## Images and tables {#images-and-tables}

Ordinary Markdown has image syntax: an exclamation mark followed by alternative
text in brackets and an image address in parentheses.

```md
![A dog resting on a blanket](https://example.com/dog.jpg)
```

This is an illustrative address. Alternative text describes what matters in
the image for a reader who cannot see it. In Norna, use
[managed image blocks](/examples/norna-extensions/#image-stacks) for a page's
own images, so Norna can process and move them with the page. Read
[External images and files](/examples/external-images-and-files/) for the other
choices.

Tables are a common Markdown extension, included in GitHub Flavored Markdown
(GFM) rather than core CommonMark. You can use them in Norna without special
Norna syntax. Norna keeps the column headings visible while you scroll through
the rows and lets wide tables scroll horizontally. Continue with the
[table example](/examples/common-markdown-extensions/#tables), or explore
[checklists and footnotes](/examples/common-markdown-extensions/).

## HTML in Markdown {#html-in-markdown}

CommonMark also lets you write HTML in `content.md` when you need it. Norna
does not prohibit HTML. For ordinary text, images, tables and notices, start
with the Markdown or Norna examples above: their documented presentation and
file handling are built for the site. An HTML image, for example, does not
enter Norna's managed-image pipeline just because its file is local.

Some HTML is useful as it is. A native `<details>` element can hide optional
context; see the [details reference](/reference/content/details/) for a working
example and its Norna constraints. Other HTML may require you to check its
layout and accessibility yourself. See the
[Markdown reference](/reference/content/markdown/#html-in-markdown) for the
support boundary.
