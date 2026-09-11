# Navigation Illustration Sources

Three sites show the same subject as one page, flat top-level pages, and
nested pages. They use the `project` preset with automatic navigation and no
logo or search configuration. Display controls are real preset defaults.

A fourth site, `documentation/site`, uses the `documentation` preset and
shows a handbook excerpt: Guides contains Installation and Publishing, with
platform and hosting guides one level below. It demonstrates a page tree and
a separate current-page outline at 1440x850. Its Linux page is reproduced
verbatim in Examples. This fixture is not a complete installation tutorial.

Regenerate the published Features and Examples captures together:

```sh
node scripts/capture-navigation-examples.mjs
```

The script replaces the disposable scratch copy, uses its registered port
4399, and leaves the minimal top-navigation site running for inspection. It never edits
these sources. Images are captured at 1200x650 and 390x600; captions identify
desktop, closed compact menu, and open compact menu. The top example also
captures its desktop section disclosure. Getting Started's two mobile shelter
captures are refreshed from the complete public example in the same run.
The gallery's complete-site previews are refreshed from both public shelters
at 1200x800 as well.

Open `http://127.0.0.1:4399/dogs/` after the run to try the H2 menus shown in
the illustrations. The complete public multi-page shelter has no H2s and
therefore intentionally has no section-disclosure buttons.

To inspect the documentation branch interactively:

```sh
npm run review:scratch -- prepare --from fixtures/navigation-examples/documentation/site --replace
npm run review:start -- scratch
```

Open `http://127.0.0.1:4399/guides/installation/linux/`. At desktop width,
compare the left page tree and right outline; narrow the viewport to combine
them into one tree, then into the compact menu.

The focused automated check exercises the same transitions with and without
JavaScript:

```sh
node scripts/test-navigation.mjs --site-dir fixtures/navigation-examples/documentation/site tests/navigation-documentation-example.spec.ts
```

For an individual state:

```sh
npm run review:scratch -- prepare --from fixtures/navigation-examples/top/site --replace
npm run review:start -- scratch
npm run review:capture -- scratch dogs/ --viewport 1200x650 --menu Dogs
npm run review:capture -- scratch dogs/ --viewport 390x600 --menu compact
```

The HTML documentation displays the exact relevant `content.md` sources. The
final gallery audit checks those snippets against these files. Screenshots are
not mockups; regenerate them after navigation behavior changes.
