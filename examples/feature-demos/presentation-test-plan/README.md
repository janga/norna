# Presentation test plan

This Norna site turns recent presentation work into a short manual review path.
It covers sidenotes, image inspection, persistent captions, adaptive tables,
sticky code context, and navigation markers in Light and Dark appearances.

Run it from the repository root:

```sh
NORNA_DEV_PORT=4372 node bin/norna.mjs --site-dir examples/feature-demos/presentation-test-plan/site dev:local --kill
```

Then open `http://127.0.0.1:4372/`.
