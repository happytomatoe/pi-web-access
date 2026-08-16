
### GitHub repos

GitHub URLs are cloned locally instead of scraped. The agent gets real file contents and a local path to explore with `read` and `bash`. Root URLs return the repo tree + README, `/tree/` paths return directory listings, `/blob/` paths return file contents.

Repos over 350MB get a lightweight API-based view instead of a full clone (override with `forceClone: true`). Commit SHA URLs are handled via the API. Clones are cached for the session and wiped on session change. Private repos require the `gh` CLI. Set `githubClone.enabled` to `false` to skip this GitHub-specific clone/API handling; `fetch_content` remains available, so the URL can continue through the normal HTTP extraction path.

### YouTube videos

YouTube URLs are processed via Gemini for full video understanding — visual descriptions, transcripts with timestamps, and chapter markers. Pass a `prompt` to ask specific questions about the video. Results include the video thumbnail so the agent gets visual context alongside the transcript.

Fallback: Gemini Web when browser cookies are enabled → Gemini API → Perplexity (text summary only). Handles all URL formats: `/watch?v=`, `youtu.be/`, `/shorts/`, `/live/`, `/embed/`, `/v/`.

### Local video files

Pass a file path (`/`, `./`, `../`, or `file://` prefix) to analyze video content via Gemini. Supports MP4, MOV, WebM, AVI, and other common formats up to 50MB for Gemini analysis. Pass a `prompt` to ask about specific content. If ffmpeg is installed, a thumbnail frame is included alongside the analysis. Timestamp/frame extraction uses ffmpeg directly and can still operate on larger local files.

Fallback: Gemini API (Files API upload) → Gemini Web when browser cookies are enabled.

### Video frame extraction

Use `timestamp` and/or `frames` on any YouTube URL or local video file to extract visual frames as images.

```typescript
fetch_content({ url: "...", timestamp: "23:41" })                       // single frame
fetch_content({ url: "...", timestamp: "23:41-25:00" })                 // range, 6 frames
fetch_content({ url: "...", timestamp: "23:41-25:00", frames: 3 })      // range, custom count
fetch_content({ url: "...", timestamp: "23:41", frames: 5 })            // 5 frames at 5s intervals
fetch_content({ url: "...", frames: 6 })                                // sample whole video
```

Requires `ffmpeg` (and `yt-dlp` for YouTube). Timestamps accept `H:MM:SS`, `MM:SS`, or bare seconds.

### PDFs

PDF URLs are converted to Markdown and saved under the temporary `pi-web-pdf` directory by default so the agent can `read` specific sections without loading the full document into context. Three engines are available, selected with `pdf.provider` (`"auto"` is the default):

| Provider | Engine | Trade-offs |
| --- | --- | --- |
| `datalab` | Datalab hosted conversion (Marker) | Deterministic layout-aware output — tables, multi-column reading order, headings, math; `accurate` mode handles scanned pages; may return a `parse_quality_score`; requires a Datalab key, billed per page with a free monthly credit |
| `gemini` | Gemini API (vision LLM) | Best on scanned/complex pages; LLM transcription can occasionally drift or truncate; requires a Gemini key |
| `unpdf` | Local pdf.js text extraction | Free, offline, no key; flattened text only — no layout, no tables, no OCR |

`auto` order: Datalab (when a key is configured) → Gemini (when a key is configured) → local `unpdf`. Datalab runs first for layout-aware conversion. If its request fails — including after free-tier credit is exhausted — the chain continues to Gemini, then `unpdf`, automatically. Setting `pdf.provider` to `gemini`, `datalab`, or `unpdf` pins that engine and skips the other remote tiers (an explicit engine still falls back to `unpdf` when it errors, except for credential/config errors and caller cancellation). No Datalab key means the `datalab` tier is simply skipped — behavior is unchanged for existing users.

**Why Datalab.** The hosted converter uses a dedicated extraction engine (Marker) intended to retain document structure such as tables, multi-column reading order, headings, links, and math, where local `unpdf` extraction only yields flattened text. It is deterministic rather than LLM-based. Completed responses may include a `parse_quality_score` (0–5) for optional quality gating. Pricing is per processed page: **fast / balanced** $4 / 1,000 pages; **accurate** $10 / 1,000 pages. The free tier gives a **$10 monthly credit** (personal email; $20 with a work email) at **25 requests/minute** — roughly **2,500 pages/month free in `fast` mode** or 1,000 in `accurate` mode. Processing defaults to the **US region**. EU data residency uses **1.25× usage**; opt in with `DATALAB_PROCESSING_LOCATION=eu`.

Configure Datalab via the web-search config:

```toml
datalabApiKey = "$DATALAB_API_KEY"

[pdf]
maxSizeMB = 20
provider = "auto"        # "auto" | "gemini" | "datalab" | "unpdf"
datalabMode = "balanced" # "fast" | "balanced" | "accurate"
datalabTimeoutMs = 120000
```

Env vars: `DATALAB_API_KEY` (or `datalabApiKey` in config), `DATALAB_PROCESSING_LOCATION` (`us` default; `eu` enables EU data residency at 1.25× usage), `DATALAB_MODE` (`fast` / `balanced` / `accurate`), and `DATALAB_API_BASE` (custom gateway). `pdf.datalabMode` overrides `DATALAB_MODE`. The default `datalabTimeoutMs` is 120s and is capped at 300s.

> Privacy note: like the Gemini tier, the PDF bytes are sent to the Datalab cloud for conversion. Files are uploaded to the selected region's storage and deleted best-effort after conversion.

### Blocked pages

Raw and direct-image HTTP requests use the same SSRF validation, hostname domain policy, redirect checks, timeout, and 5MB streamed response bound as normal extraction. Raw mode returns textual bodies even for non-2xx responses and exposes the HTTP status in tool details; it does not run readability or hosted extraction fallbacks.

`fetch_content` can opt into local browser-cookie auth with `auth: "profile"`, or `auth: true` when exactly one `authFetch` profile exists. Configure profiles in `~/.pi/web-search.json`, for example `{ "authFetch": { "social": ["x.com", "instagram.com"], "work": { "hosts": ["docs.company.com"], "chromeProfile": "Profile 2", "cache": "off" } } }`. Auth fetch uses only the local direct HTTP path, requires HTTPS, allows only configured hosts and their subdomains, refuses cross-origin redirects, and never sends cookies or authenticated content to hosted extraction providers. Browser cookie extraction remains opt-in through `allowBrowserCookies: true` or `PI_ALLOW_BROWSER_COOKIES=1`.

When Readability fails or returns only a cookie notice, the extension can retry configured Firecrawl extraction, Jina Reader (handles JS rendering server-side, no API key needed), TinyFish, Search1API, Querit, Kagi Extract, Ollama Web Fetch, Parallel, Bright Data Web Unlocker, Gemini URL Context API, and Gemini Web extraction when browser cookies are enabled. Configure `fetchRouting.providers` to change the order or set of `fetch_content` providers. Supported values are `http`, `firecrawl`, `jina`, `tinyfish`, `search1api`, `querit`, `kagi`, `ollama`, `parallel`, `brightdata`, and `gemini`; when absent, the default order is unchanged. For remote HTTP(S) targets, third-party hosted providers are disabled unless `fetchRouting.allowRemoteHostedProviders` is `true`, because hosted services perform their own fetch and can see a different redirect chain than the local safety gate. Firecrawl stays available as a configured extraction service. Firecrawl requests are cache-only by default and require an explicit fresh-scrape opt-in before the Firecrawl server can fetch target URLs. Bright Data Web Unlocker runs last of the remote scraping providers, ahead of only the Gemini fallbacks, because it is billed per request against a paid account; it is skipped unless both a key and an `unblocker` zone are configured. It applies no minimum-length check, so any non-empty body it returns — including a short consent or paywall stub — is the final answer for that URL and the Gemini fallbacks are not tried. Handles SPAs, JS-heavy pages, and anti-bot protections transparently. Also parses Next.js RSC flight data when present. HTML extraction also surfaces registered discovery relations (`service-desc`, `service-doc`, `service-meta`, `api-catalog`, `describedby`) from the HTTP `Link` header and matching `link`/`a[rel]` markup. Readable or rendered content remains primary; on an empty shell, the normal extraction fallbacks run before declared links are returned on their own.

