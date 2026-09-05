# Changing the colors

As any proper Material Design implementation, Material for MkDocs supports
Google's original [color palette], which can be easily configured through
`mkdocs.yml`. Furthermore, colors can be customized with a few lines of CSS to
fit your brand's identity by using CSS variables.

## Configuration {#configuration}

### Color palette {#color-palette}

#### Color scheme

Material for MkDocs supports two color schemes: a __light mode__, which is just
called `default`, and a __dark mode__, which is called `slate`. The color scheme
can be set via `mkdocs.yml`:

```yaml
theme:
  palette:
    scheme: default
```

Click on a tile to change the color scheme:

  <button data-md-color-scheme="default"><code>default</code></button>
  <button data-md-color-scheme="slate"><code>slate</code></button>

#### Primary color

The primary color is used for the header, the sidebar, text links and several
other components. In order to change the primary color, set the following value
in `mkdocs.yml` to a valid color name:

```yaml
theme:
  palette:
    primary: indigo
```

Click on a tile to change the primary color:

  <button data-md-color-primary="red"><code>red</code></button>
  <button data-md-color-primary="pink"><code>pink</code></button>
  <button data-md-color-primary="purple"><code>purple</code></button>
  <button data-md-color-primary="deep-purple"><code>deep purple</code></button>
  <button data-md-color-primary="indigo"><code>indigo</code></button>
  <button data-md-color-primary="blue"><code>blue</code></button>
  <button data-md-color-primary="light-blue"><code>light blue</code></button>
  <button data-md-color-primary="cyan"><code>cyan</code></button>
  <button data-md-color-primary="teal"><code>teal</code></button>
  <button data-md-color-primary="green"><code>green</code></button>
  <button data-md-color-primary="light-green"><code>light green</code></button>
  <button data-md-color-primary="lime"><code>lime</code></button>
  <button data-md-color-primary="yellow"><code>yellow</code></button>
  <button data-md-color-primary="amber"><code>amber</code></button>
  <button data-md-color-primary="orange"><code>orange</code></button>
  <button data-md-color-primary="deep-orange"><code>deep orange</code></button>
  <button data-md-color-primary="brown"><code>brown</code></button>
  <button data-md-color-primary="grey"><code>grey</code></button>
  <button data-md-color-primary="blue-grey"><code>blue grey</code></button>
  <button data-md-color-primary="black"><code>black</code></button>
  <button data-md-color-primary="white"><code>white</code></button>

See our guide below to learn how to set [custom colors].

#### Accent color

The accent color is used to denote elements that can be interacted with, e.g.
hovered links, buttons and scrollbars. It can be changed in `mkdocs.yml` by
choosing a valid color name:

```yaml
theme:
  palette:
    accent: indigo
```

Click on a tile to change the accent color:

  .md-typeset button[data-md-color-accent] > code {
    background-color: var(--md-code-bg-color);
    color: var(--md-accent-fg-color);
  }

  <button data-md-color-accent="red"><code>red</code></button>
  <button data-md-color-accent="pink"><code>pink</code></button>
  <button data-md-color-accent="purple"><code>purple</code></button>
  <button data-md-color-accent="deep-purple"><code>deep purple</code></button>
  <button data-md-color-accent="indigo"><code>indigo</code></button>
  <button data-md-color-accent="blue"><code>blue</code></button>
  <button data-md-color-accent="light-blue"><code>light blue</code></button>
  <button data-md-color-accent="cyan"><code>cyan</code></button>
  <button data-md-color-accent="teal"><code>teal</code></button>
  <button data-md-color-accent="green"><code>green</code></button>
  <button data-md-color-accent="light-green"><code>light green</code></button>
  <button data-md-color-accent="lime"><code>lime</code></button>
  <button data-md-color-accent="yellow"><code>yellow</code></button>
  <button data-md-color-accent="amber"><code>amber</code></button>
  <button data-md-color-accent="orange"><code>orange</code></button>
  <button data-md-color-accent="deep-orange"><code>deep orange</code></button>

See our guide below to learn how to set [custom colors].

### Color palette toggle {#color-palette-toggle}

Offering a light _and_ dark color palette makes your documentation pleasant to
read at different times of the day, so the user can choose accordingly. Add the
following lines to `mkdocs.yml`:

```yaml
theme:
  palette: # (1)!

    # Palette toggle for light mode
    - scheme: default
      toggle:
        icon: material/brightness-7 # (2)!
        name: Switch to dark mode

    # Palette toggle for dark mode
    - scheme: slate
      toggle:
        icon: material/brightness-4
        name: Switch to light mode
```

1.  Note that the `theme.palette` setting is now defined as a list.

2.  Enter a few keywords to find the perfect icon using our [icon search] and
    click on the shortcode to copy it to your clipboard:

        <div class="mdx-iconsearch-result__meta"></div>
        <ol class="mdx-iconsearch-result__list"></ol>

This configuration will render a color palette toggle next to the search bar.
Note that you can also define separate settings for `primary`
and `accent` per color palette.

The following properties must be set for each toggle:

:
    This property must point to a valid icon path referencing any icon bundled
    with the theme, or the build will not succeed. Some popular combinations:

    *  +  – `material/brightness-7` + `material/brightness-4`
    *  +  – `material/toggle-switch` + `material/toggle-switch-off-outline`
    *  +  – `material/weather-night` + `material/weather-sunny`
    *  +  – `material/eye` + `material/eye-outline`
    *  +  – `material/lightbulb` + `material/lightbulb-outline`

:
    This property is used as the toggle's `title` attribute and should be set to
    a discernable name to improve accessibility. It's rendered as a [tooltip].

### System preference {#system-preference}

Each color palette can be linked to the user's system preference for light and
dark appearance by using a media query. Simply add a `media` property next to
the `scheme` definition in `mkdocs.yml`:

```yaml
theme:
  palette:

    # Palette toggle for light mode
    - media: "(prefers-color-scheme: light)"
      scheme: default
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode

    # Palette toggle for dark mode
    - media: "(prefers-color-scheme: dark)"
      scheme: slate
      toggle:
        icon: material/brightness-4
        name: Switch to light mode
```

When the user first visits your site, the media queries are evaluated in the
order of their definition. The first media query that matches selects the
default color palette.

#### Automatic light / dark mode

Newer operating systems allow to automatically switch between light and dark
appearance during day and night times. Material for MkDocs adds support for
automatic light / dark mode, delegating color palette selection to the user's
operating system. Add the following lines to `mkdocs.yml`:

```yaml
theme:
  palette:

    # Palette toggle for automatic mode
    - media: "(prefers-color-scheme)"
      toggle:
        icon: material/brightness-auto
        name: Switch to light mode

    # Palette toggle for light mode
    - media: "(prefers-color-scheme: light)"
      scheme: default # (1)!
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode

    # Palette toggle for dark mode
    - media: "(prefers-color-scheme: dark)"
      scheme: slate
      toggle:
        icon: material/brightness-4
        name: Switch to system preference
```

1.  You can also define separate settings for `primary` and
    `accent` per color palette, i.e. different colors for
    light and dark mode.

Material for MkDocs will now change the color palette each time the operating
system switches between light and dark appearance, even when the user doesn't
reload the site.

## Customization {#customization}

### Custom colors {#custom-colors}

Material for MkDocs implements colors using [CSS variables] (custom
properties). If you want to customize the colors beyond the palette (e.g. to
use your brand-specific colors), you can add an [additional style sheet] and
tweak the values of the CSS variables.

First, set the `primary` or `accent` values
in `mkdocs.yml` to `custom`, to signal to the theme that you want to define
custom colors, e.g., when you want to override the `primary` color:

```yaml
theme:
  palette:
    primary: custom
```

Let's say you're { style="color: #EE0F0F" }
__YouTube__, and want to set the primary color to your brand's palette. Just
add:

=== " `docs/stylesheets/extra.css`"

```css
    :root  > * {
      --md-primary-fg-color:        #EE0F0F;
      --md-primary-fg-color--light: #ECB7B7;
      --md-primary-fg-color--dark:  #90030C;
    }
```

=== " `mkdocs.yml`"

```yaml
    extra_css:
      - stylesheets/extra.css
```

See the file containing the [color definitions] for a list of all CSS variables.

### Custom color schemes {#custom-color-schemes}

Besides overriding specific colors, you can create your own, named color scheme
by wrapping the definitions in a `[data-md-color-scheme="..."]`
[attribute selector], which you can then set via `mkdocs.yml` as described
in the color schemes section:

=== " `docs/stylesheets/extra.css`"

```css
    [data-md-color-scheme="youtube"] {
      --md-primary-fg-color:        #EE0F0F;
      --md-primary-fg-color--light: #ECB7B7;
      --md-primary-fg-color--dark:  #90030C;
    }
```

=== " `mkdocs.yml`"

```yaml
    theme:
      palette:
        scheme: youtube
    extra_css:
      - stylesheets/extra.css
```

Additionally, the `slate` color scheme defines all of it's colors via `hsla`
color functions and deduces its colors from the `--md-hue` CSS variable. You
can tune the `slate` theme with:

```css
[data-md-color-scheme="slate"] {
  --md-hue: 210; /* (1)! */
}
```

1.  The `hue` value must be in the range of `[0, 360]`
