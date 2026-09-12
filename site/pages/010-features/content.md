---
page:
  description: >-
    See how Norna turns Markdown, page folders and a visual preset into a
    maintainable static website.
---

# What Norna Does

Norna starts with things you can inspect: Markdown, images, page folders and a
small theme file. It turns that source into a responsive site with navigation,
managed media, checks and static publishing output.

The examples below keep source and result together. They show where ordinary
Markdown is enough, where Norna adds a bounded convention, and what the engine
maintains for you.

## Write With Markdown {#write-with-markdown}

Most day-to-day writing uses ordinary Markdown. Headings give the document its
structure; paragraphs, emphasis, links, lists, code and tables retain their
familiar meaning.

```md
### Before publishing

Run the **source checks**, then:

1. preview the site;
2. review the changed pages;
3. commit when the result is ready.
```

### Before publishing

Run the **source checks**, then:

1. preview the site;
2. review the changed pages;
3. commit when the result is ready.

If you know Markdown, you already know the main writing interface. Norna uses
its heading hierarchy to structure each page instead of introducing a separate
document format. The [content reference](https://github.com/janga/norna/blob/main/docs/content.md#markdown-text)
defines the supported Markdown details.

## Let Files Become A Site {#files-become-a-site}

Each page is a directory containing `content.md` and, when needed, an adjacent
`images/` directory. Directory nesting defines page relationships. The H1 names
the page, H2 headings begin its sections, and the files remain the source of
truth for both URLs and navigation.

With `navigation.mode: automatic`, Norna chooses one navigation model for the
complete site. Move through the three illustrations to see the same convention
grow from one page into a hierarchy.

<!-- Captured by scripts/capture-navigation-examples.mjs from the maintained
single, top, and nested sites in fixtures/navigation-examples. -->

```image-carousel
- image: navigation-single-desktop.png
  alt: A rendered Dog Shelter page with its H1 and two H2 destinations in sticky navigation.
  caption: One page uses section navigation.
- image: navigation-top-desktop.png
  alt: The rendered Dogs page with global page links and separate section disclosures.
  caption: Top-level pages use top navigation, with direct access to their sections.
- image: navigation-nested-desktop.png
  alt: Adult dogs rendered with the Dogs branch in a persistent left tree.
  caption: Related child pages introduce a page tree; small screens use Menu.
```

There is no second sidebar file to keep synchronized. The documented
[navigation rules](https://github.com/janga/norna/blob/main/docs/pages.md#navigation)
also explain explicit modes and unlisted pages.

## Change Structure Safely {#change-structure-safely}

The same file model lets Norna understand structural edits. Create a page at a
known parent, or preview a move before changing anything:

```sh
norna page:add "Installation" --parent /guides/
norna page:move /guides/install/ /reference/install/
norna page:move /guides/install/ /reference/install/ --write
```

The preview reports the directory move, affected links and old URLs. The write
step moves the page subtree, updates internal links and records aliases for the
previous URLs. Validation stops ambiguous or conflicting operations instead of
guessing. Norna can also reconcile an equivalent directory move made by hand.

The [page command reference](https://github.com/janga/norna/blob/main/docs/pages.md#move-or-reconcile-a-page)
specifies ordering, redirects, rollback and collision handling.

## Extend Markdown Only Where It Helps {#purpose-built-patterns}

Some website patterns carry behavior or meaning that ordinary Markdown cannot
express precisely. Norna adds a small, named construction in those cases.

You may know similar blocks as *custom containers* or *admonitions* from other
documentation tools. Norna calls them semantic callouts and keeps their
meanings fixed, so the label, accessibility behavior, and presentation remain
consistent.

> [!TIP]
> A semantic callout states why text deserves attention; its meaning does not
> depend on a particular color.

The source remains understandable outside Norna:

```md
> [!TIP]
> Preview the site before publishing it.
```

A side note keeps supporting detail next to its reference when the layout has
room, then returns it to the reading flow when space is constrained.{note-ref}

{note: The note remains adjacent in source and reading order, so the information is not lost when no margin lane is available.}

```card-list
flow: grid
size: s

- title: Image stack
  text: Keep every image visible in a deliberate reading order.
  link: /examples/#image-stacks
- title: Image carousel
  text: Place a related sequence in one bounded, keyboard-operable position.
  link: /examples/#image-carousels
- title: Card list
  text: Present a short set of comparable choices without building a component.
  link: /examples/#card-lists
```

This page itself uses a carousel, a callout, a side note and a card list. The
[Norna block reference](https://github.com/janga/norna/blob/main/docs/content.md#norna-blocks)
documents their exact syntax and constraints.

## Start With A Coherent Presentation {#coherent-presentation}

A preset coordinates typography, spacing, page width, image placement, color,
corners and the site's starting presentation. A useful theme can therefore
begin with one line:

```yaml
preset: documentation
```

Choose a palette or override a named setting when the site needs a deliberate
change:

```yaml
preset: documentation
palette: clay-rose

layout:
  textWidth: wide
```

The preset still owns the remaining relationships, so a wider reading measure
does not require the author to redesign controls, captions or navigation. Use
the [theme explorer](/examples/#presets) to compare identical
content, then consult the [theme reference](https://github.com/janga/norna/blob/main/docs/theme.md)
for supported overrides.

## Keep Difficult Content Readable {#readable-content}

Norna treats wide data, long code, detailed images and marginal notes as
reading problems rather than isolated decorations. It preserves their semantic
HTML first, then uses available page lanes and reader choices where those
improve inspection.

| Content {row-header} | Normal space | When space narrows | Optional enhancement | Baseline that remains |
| --- | --- | --- | --- | --- |
| Wide table | Text measure, then free page lanes | Horizontal overflow is exposed | Sticky headings and scroll controls | Focusable native table frame |
| Side note | Free margin beside its reference | Returns to the reading flow | None required | Linked note and reference |
| Detailed image | Fits the reading or media area | Scales within the viewport | Fitted and actual-size inspection | Link to the published original |
| Long code | Uses the text or wide block lane | Scrolls horizontally when needed | Copy control | Selectable code and visible title |

The table above is live Norna output, not a screenshot. Narrow the window or
change Reading width in the Display panel to inspect its fallback. The
[presentation guarantees](https://github.com/janga/norna/blob/main/docs/presentation-guarantees.md)
separate engine rules from preset choices.

## Useful Before JavaScript {#static-first}

Norna generates ordinary static pages. Text, headings, links, responsive image
markup, cards, notes and the navigation destinations exist before optional
client-side JavaScript runs.

JavaScript is added only where a page uses behavior that needs it: this
carousel needs slide controls, wide tables can gain measured overflow cues, and
the Display panel persists reader choices. Remove JavaScript and the underlying
content and real links remain available wherever the feature has a meaningful
static form.

The [client-side JavaScript contract](https://github.com/janga/norna/blob/main/docs/client-javascript.md)
lists the baseline and enhancement for each feature.

## Build Ordinary Static Output {#static-output}

Before publishing, Norna can validate configuration, content, links and managed
images. A build then produces static HTML and assets together with the search
index, sitemap, social metadata, old-URL pages and a useful `404.html` when the
site uses those capabilities.

```sh
norna config:check
norna content:check
norna build
git push
```

The result can be served without a Norna process or application server. The
included GitHub Pages workflow builds again from the committed source, while
the [publishing reference](https://github.com/janga/norna/blob/main/docs/publishing.md)
defines the complete deployment contract.

**[Install Norna and create the first site](/getting-started/install-norna/).**
