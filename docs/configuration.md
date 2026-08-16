
By default the curator HTTP server binds to `127.0.0.1` and hands out a `http://localhost:<port>/?session=<token>` URL, so it is reachable only from the machine running Pi. That is the right default and nothing below changes it unless you opt in.

Opt in when Pi runs somewhere other than where your browser is — a dev box you SSH into, a container, a remote workstation on a Tailscale/WireGuard network:

```toml
curatorRemote = true
```

`true` derives both values: the URL host becomes `os.hostname()` and the server binds `0.0.0.0`. Either can be overridden, and you should usually override `bind`:

```toml
[curatorRemote]
host = "my-box.tailnet.ts.net"
bind = "100.101.102.103"
```

| Value | URL host | Bind address |
| --- | --- | --- |
| omitted or `false` | `localhost` | `127.0.0.1` |
| `true` | `os.hostname()` | `0.0.0.0` |
| `{ "host": "h" }` | `h` | `0.0.0.0` |
| `{ "bind": "b" }` | `os.hostname()` | `b` |
| `{ "host": "h", "bind": "b" }` | `h` | `b` |

Anything else — a string, `null`, an array — is treated as not configured and stays local.

`host` only changes the URL that gets printed; `bind` is what actually determines who can reach the server. Set them to a matching pair — a `host` that does not resolve to the interface you bound produces a link that looks right and does not load.

**Security.** Enabling this exposes the curator beyond the local machine, and `bind: "0.0.0.0"` exposes it on every interface, including untrusted networks. The only access control is the unguessable session token in the URL, carried over plain HTTP with no TLS — so the token and everything you curate are readable by anyone able to observe that traffic. Anyone who reaches the port with the token can run searches against your configured providers (spending your API credits) and edit the summary that gets returned into the agent's context. Prefer binding to one private-network interface, as in the example above, over `0.0.0.0`, and treat the curator URL as a secret. The server is short-lived — it exists only for the duration of a curation session — but it is unauthenticated apart from that token.

Remote curator sessions print the URL instead of trying to open a browser by default. Turning remote access on also raises the default curator idle timeout from 20 to 60 seconds, giving you time to notice and click that link; set `curatorTimeoutSeconds` explicitly to override. If you do want Pi to launch a browser on the remote host anyway, set `autoOpenBrowser: true` explicitly.

#### Disabling browser auto-open

`autoOpenBrowser` is also useful on its own for local sessions:

```toml
autoOpenBrowser = false
```

When `false`, the extension never tries to open a Glimpse window or a browser and always prints the URL for you to open manually. For local-only sessions it defaults to `true`; remote curator sessions print the URL unless you set `autoOpenBrowser: true` explicitly. This is worth setting locally when you would rather paste the link into a specific browser than have one launched for you. It changes nothing about where the server binds; that is `curatorRemote`'s job alone.

### Shortcuts

Both shortcuts are configurable via `~/.pi/web-search.toml`:

```toml
[shortcuts]
curate = "ctrl+shift+s"
activity = "ctrl+shift+w"
```

Values use the same format as pi keybindings (e.g. `ctrl+s`, `ctrl+shift+s`, `alt+r`). Changes take effect on next pi restart.

Set `"enabled": false` under `tools`, `commands`, `image`, or `pdf` to disable that feature. Tool-specific settings override the legacy `webSearch.enabled` shorthand; without an override, it still disables `web_search` and `source_check`. `image.enabled: false` blocks direct image fetches and video frame extraction, and prevents video thumbnails. `pdf.enabled: false` blocks PDF extraction. For GitHub specifically, `githubClone.enabled: false` only skips clone/API specialization; it does not unregister `fetch_content` or block generic URL extraction. Pi restart is required for tool and command registration changes.

Rate limits: Perplexity is capped at 10 requests/minute (client-side). Jina Search, TinyFish, Search1API, and Searchinfinity apply the plan limits documented by their APIs. Querit Search and Contents subscriptions are independent. Content fetches run 3 concurrent with a 30s timeout for the direct HTTP fetch of each URL. Remote extraction fallbacks carry their own budgets and are not covered by that number: Jina Reader 30s, Firecrawl 60s, Kagi Extract 60s, Ollama Web Fetch 60s, Bright Data Web Unlocker 60s, TinyFish up to 150s, Gemini 120s, Datalab 120s (capped at 300s, rate-limited to 25 requests/minute on the free tier). `pdf.maxSizeMB` defaults to 20 and is capped at 50.

