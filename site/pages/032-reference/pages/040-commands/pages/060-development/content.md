---
page:
  description: Start, inspect and stop local or LAN development, and distinguish dev output from a static build preview.
---

# Development and preview

`dev:local` prepares public files and managed images, starts Astro in the
background, waits for it to respond and opens the local URL:

```sh
npm exec -- norna dev:local
```

`dev` is an alias. The normal host is `127.0.0.1`, port `4321`; the configured
public URL's pathname remains part of the local address. For example, a site
published under `/project/` opens locally at `http://127.0.0.1:4321/project/`.

## Port and browser behavior

`NORNA_DEV_PORT` selects another port from 1 through 65535. Norna keeps the
chosen port rather than silently moving to another one. Startup stops the
selected site's previously tracked server. If an unrelated process occupies
the port, startup fails.

`--kill` explicitly permits stopping the process occupying that port:

```sh
npm exec -- norna dev:local --kill
```

If the platform's process tools cannot identify or stop the listener, stop it
manually. `NORNA_NO_OPEN=1` suppresses automatic browser opening. These are
environment variables, not `config.yaml` settings.

## LAN preview

`dev:lan` binds to `0.0.0.0` and prints local IPv4 URLs for another device on
the same network. It accepts the same `--kill` option and configured port.
The host firewall must allow incoming connections. Stop it after testing when
network access is no longer needed.

## Lifecycle commands

| Command | Effect |
| --- | --- |
| `dev:status` | Report whether the selected site's server responds and is tracked |
| `dev:logs` | Print the last 80 Astro log lines |
| `dev:logs --follow` | Follow Astro log output |
| `dev:restart` | Prepare and restart, preserving local/LAN mode without opening another browser window |
| `dev:stop` | Stop the selected site's tracked server |

State lives under the selected site's `.norna/dev/`; Astro state and logs live
under `.norna/.astro/`. Different site directories have separate process state,
but still need different ports to run simultaneously.

## Preparation failures and stale output

Public-file or image preparation failures stop startup before Astro starts.
The terminal reports the problem and preparation log, normally
`site/.norna/dev/preparation.log`. Correct the reported source, then rerun
startup. An older Astro log may describe a different attempt.

If Astro fails after preparation, Norna instead prints an excerpt and the path
to its full startup log. Use the log named by the current failure.

`build:local` builds the complete site and restarts development without opening
a new browser window. Use it to refresh stale generated output, particularly
the [search index](/reference/configuration/search/), which ordinary dev
startup does not rebuild.

## Preview a static build

`preview` serves the existing `dist/` through Astro; it does not build first.
Run `build` before inspecting production output. It is separate from the
managed dev server and accepts Astro preview options, such as `--port` and
`--host`. Stop its foreground process with Ctrl+C.
