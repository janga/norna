---
page:
  description: Install Norna, create a site, and run its first checked local preview.
---

# Install Norna

Install Norna into a new site project, start its local preview, make the first
edit, and validate the result. This is the normal standalone setup.

## Create a site {#create}

You need:

- Node.js 22.12 or later and npm.
- ImageMagick before adding JPEG or PNG images through Norna image blocks.

Norna uses ImageMagick to prepare raster images for responsive layouts. Install
it separately for your operating system when the site uses those formats.
Managed SVG images do not require it.{note-ref}

{note: [How to install ImageMagick.](/faq/#install-imagemagick)}

```sh
# Create a new site project in my-site/
npx @janga/norna@latest init my-site
cd my-site

# Install the Norna version recorded by the project
npm install
```

The first command uses the latest Norna release to create the project.
`package.json` records the project's Norna version, and `npm install` installs
that version locally. The generated `package-lock.json` records the exact
dependency versions; keep it in Git so contributors and automated builds use
the same installation.

See
[Requirements and limitations](https://github.com/janga/norna/blob/main/docs/requirements.md)
for exact runtime and external-tool requirements.

## Preview and make the first edit {#preview}

Start the development server from the project directory:

```sh
# Start local preview
npm run norna:dev
```

Open the address printed by the command. Then edit
`site/pages/000-home/content.md` and save the file:

```md
# Dog Shelter

We help dogs find permanent homes.

## Our dogs

Meet the dogs currently waiting for a family.

### Meet Rover

Rover enjoys long walks and quiet afternoons.
```

`#` is the page title, `##` starts a section, and `###` creates a subsection. On
a one-page site, Norna builds local navigation from the page title and its `##`
sections. The preview updates as you edit the source files.

See [Content](https://github.com/janga/norna/blob/main/docs/content.md#page-title-and-frontmatter)
for the complete heading, generated-id, note, and Norna-block syntax.

## Choose a visual starting point {#theme}

The generated site uses the `project` preset. A preset supplies a complete,
coordinated starting point for typography, spacing, colors, navigation styling,
media, and structured content such as card lists. Change the single value in
`site/theme.yaml` to choose another preset:

```yaml
preset: project
```

Norna includes four presets:

- `portfolio` for image-led sites with restrained typography;
- `documentation` for guides and sustained reading;
- `project` for project and product sites that combine text, code, cards, and images;
- `statement` for short sites with a stronger editorial voice.

List the presets and their intended uses from the installed Norna version:

```sh
npm run norna:theme:presets
```

Start with the preset alone and review it with real content before adding
overrides. The [Theme explorer](https://janga.github.io/norna/examples/theme-presets/)
shows identical content with every preset and lets you try a different
site-wide palette without changing the other preset choices.

See [Theme presets and overrides](https://github.com/janga/norna/blob/main/docs/theme.md#theme-presets)
when you need exact defaults, page-theme scope, reader Display controls, or an
override.

## Check the first result {#check}

Ask Norna to validate the site before continuing:

```sh
# Validate the site without changing source files
npm run norna:check
```

The check reports problems together so you can correct them in the source. Use
the focused `norna:config:check` and `norna:content:check` scripts only when you
need to narrow down a problem.

### Optional shorter commands

The `norna:*` npm scripts use the Norna version installed in the project and
work without a global installation. If you prefer shorter direct commands,
install the cross-platform launcher once:

```sh
npm install --global @janga/norna@latest
```

You can then replace the two commands used so far with:

```sh
norna dev
norna check
```

Inside a project, the launcher delegates to that project's locally installed
Norna version. See [Commands](https://github.com/janga/norna/blob/main/docs/commands.md)
for all npm scripts, direct CLI forms, options, and side effects.

## Continue {#continue}

You now have a locally running, edited, and checked Norna site.

- [Grow your site](/getting-started/grow-your-site/) when the content needs
  more sections, pages, or a navigation category.
- [Build and publish](/getting-started/build-and-publish/) when the site is
  ready for a public URL and GitHub Pages.
- Open [Resources](/resources/) when you need the complete file, content,
  theme, command, or publishing reference.
