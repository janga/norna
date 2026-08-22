# Local Development

Use the local preview commands when editing a site or the engine demo.

## Start Preview

```sh
npm run norna:dev
```

The wrapper:

1. syncs `site/public/` into `site/.norna/public/`,
2. starts Astro in background mode,
3. waits until the site responds,
4. opens `http://localhost:4321/` unless `WALDE_NO_OPEN=1` is set.

The host and port are currently fixed in the script:

```text
localhost:4321
```

If the port is already in use, the command fails and asks you to stop the
process using it.

To stop any process that is blocking the standard port before starting, pass
`--kill`:

```sh
npm run norna:dev -- --kill
```

The standalone starter also provides this shorter alias:

```sh
npm run dev -- --kill
```

With the optional global launcher installed, the direct form is:

```sh
norna dev --kill
```

The launcher selects the current project's locally installed Norna version.

## Test On A Phone

To make the local dev server available to devices on the same Wi-Fi network:

```sh
npm run norna:dev:lan
```

The command prints one or more local IPv4 URLs. Open one of them on the phone.
The phone and computer must use the same network, and macOS may ask to allow
incoming connections for Node. Stop the server after testing with
`npm run norna:dev:stop` because it is accessible from the local network.

## Manage Preview

```sh
npm run norna:dev:status
npm run norna:dev:logs
npm run norna:dev:logs -- --follow
npm run norna:dev:restart
npm run norna:dev:stop
```

The local server state and logs live under `.astro/`.

## Rebuild Stale Preview

Use this when generated content or image state looks stale:

```sh
npm run norna:build:local
```

It runs the full build and restarts the local dev server without opening a new
browser window.
