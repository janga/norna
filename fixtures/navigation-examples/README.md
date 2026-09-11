# Navigation Illustration Sources

These three sites show the same subject as one page, flat top-level pages, and
nested pages. They use the `project` preset with automatic navigation and no
logo or search configuration. Display controls are real preset defaults.

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
