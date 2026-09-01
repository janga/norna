# Local Development

Use the local preview commands when editing a site or the engine demo.

## Start Preview

```sh
npm run norna:dev
```

The wrapper:

1. syncs `site/public/` and generates `site/.norna/public/sitemap.xml`,
2. prepares new or changed managed images,
3. starts Astro in background mode,
4. waits until the site responds,
5. opens `http://localhost:4321/` unless `NORNA_NO_OPEN=1` is set.

The default address is:

```text
localhost:4321
```

Before starting, Norna asks Astro to stop any background server tracked for the
selected site. This uses the same Astro process lifecycle on macOS, Linux, and
Windows.

Norna never switches to another port automatically. If port 4321 is occupied
by another process, the command stops with an error. Pass `--kill` when Norna
should explicitly stop that process and reuse the same port:

```sh
npm run norna:dev -- --kill
```

Set `NORNA_DEV_PORT` when the site should consistently use a different port.
The same strict behavior applies to that port.

## Test On A Phone

To make the local dev server available to devices on the same Wi-Fi network:

```sh
npm run norna:dev:lan
```

Pass `--kill` after `--` to reclaim the configured port before LAN startup:

```sh
npm run norna:dev:lan -- --kill
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

The local server state, logs, generated types, and Astro cache live under
`site/.norna/.astro/`. Keeping this state inside the selected site directory
prevents another Norna site in the same project from affecting the server.

## Rebuild Stale Preview

Use this when generated content or image state looks stale:

```sh
npm run norna:build:local
```

It runs the full build and restarts the local dev server without opening a new
browser window.
