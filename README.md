<p>
  <img src="banner.png" alt="pi-web-access" width="1100">
</p>

# Pi Web Access

**Web search, content extraction, and video understanding for Pi agent. OpenAI/Codex search, zero-config Exa search, Brave, Parallel, TinyFish, Search1API, Searchinfinity, Querit, Tavily, Firecrawl, Jina, SERPdive, Kagi, Bocha, Ollama, AnySearch, xAI/Grok, Bright Data SERP, SerpBase, self-hosted SearXNG, keyless DuckDuckGo, optional browser-cookie Gemini Web, or bring your own API keys.**

[![npm version](https://img.shields.io/npm/v/pi-web-access?style=for-the-badge)](https://www.npmjs.com/package/pi-web-access)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows*-blue?style=for-the-badge)]()

<https://github.com/user-attachments/assets/cac6a17a-1eeb-4dde-9818-cdf85d8ea98f>

## Why Pi Web Access

**Zero Config** — Works out of the box with Exa MCP (no API key needed). If you're signed into Pi with a Codex subscription, OpenAI web search can reuse that auth. Add API keys or endpoints for OpenAI, Brave, Parallel, TinyFish, Search1API, Searchinfinity, Querit, Tavily, Firecrawl, Jina, SERPdive, Kagi, Bocha, Ollama, SerpBase, Exa, Perplexity, or Gemini API for more control; configure a self-hosted SearXNG endpoint for private search; or opt into browser-cookie access for Gemini Web.

**Video Understanding** — Point it at a YouTube video or local screen recording and ask questions about what's on screen. Full transcripts, visual descriptions, and frame extraction at exact timestamps.

**Smart Fallbacks** — Every capability has a fallback chain. Search tries configured SearXNG first for local/private search, then OpenAI when suitable and available, Exa, Brave, Parallel, TinyFish, Search1API, Searchinfinity, Querit, Tavily, Firecrawl, Jina, SERPdive, Kagi, Bocha, Ollama, Perplexity, Gemini API, and Gemini Web when browser cookies are enabled. With no SearXNG configured, the existing zero-config order is unchanged. YouTube tries Gemini Web when enabled, then API, then Perplexity. Blocked pages try configured self-hosted Firecrawl first. Third-party hosted page fetchers require explicit `fetchRouting.allowRemoteHostedProviders` opt-in for remote HTTP(S) targets.

**GitHub Cloning** — GitHub URLs are cloned locally instead of scraped. The agent gets real file contents and a local path to explore, not rendered HTML.

## Install

```bash
pi install npm:pi-web-access
```

Works immediately with no API keys — Exa MCP provides zero-config search. If Pi has Codex auth from `/login`, OpenAI search can also work without a separate key. For more providers or direct API access, add keys to `~/.pi/web-search.toml`:

```toml
# API Keys
openaiApiKey = "sk-..."
braveApiKey = "BSA_..."
exaApiKey = "exa-..."
tinyfishApiKey = "sk-tinyfish-..."
search1apiApiKey = "..."
searchinfinityApiKey = "..."
queritApiKey = "..."
jinaApiKey = "jina_..."
bochaApiKey = "sk-..."
perplexityApiKey = "pplx-..."
geminiApiKey = "AIza..."
```

Run **`/web-access:settings`** to show the config path (and create the file from the template if it doesn't exist yet). See [`config-template.toml`](config-template.toml) for the full reference with every field documented and commented.

Requires Pi v0.37.3+.

Optional dependencies for video frame extraction:

```bash
brew install ffmpeg   # frame extraction, video thumbnails, local video duration
brew install yt-dlp   # YouTube stream URLs for frame extraction
```

Without these, video content analysis (transcripts, visual descriptions via Gemini) still works. The binaries are only needed for extracting individual frames as images.

## Quick Start

```typescript
// Search the web
web_search({ query: "TypeScript best practices 2025" })

// Fetch a page
fetch_content({ url: "https://docs.example.com/guide" })

// Clone a GitHub repo
fetch_content({ url: "https://github.com/owner/repo" })

// Understand a YouTube video
fetch_content({ url: "https://youtube.com/watch?v=abc", prompt: "What libraries are shown?" })

// Analyze a screen recording
fetch_content({ url: "/path/to/recording.mp4", prompt: "What error appears on screen?" })
```

## How It Works

```
web_search(query)
  → SearXNG (if configured) → OpenAI (when suitable) → Exa → Brave → Parallel → TinyFish → Search1API → Searchinfinity → Querit → Tavily → Firecrawl → Jina → SERPdive → Perplexity → Gemini

fetch_content(url)
  → Video file?  Gemini API (Files API) → Gemini Web (if browser cookies enabled)
  → GitHub URL?  Clone repo, return file contents + local path
  → YouTube URL? Gemini Web (if browser cookies enabled) → Gemini API → Perplexity
  → HTTP fetch → PDF? Datalab → Gemini API → local text extraction, save to temp pi-web-pdf
               → HTML? Readability (+ declared Link/rel discovery) → RSC parser → Firecrawl (if configured) → third-party hosted fallbacks only when fetchRouting.allowRemoteHostedProviders is enabled
               → Text/JSON/Markdown? Return directly
```

## Documentation

| Topic | Description |
| ----- | ----------- |
| [**Tools**](docs/tools.md) | `web_search`, `fetch_content`, `get_search_content`, `source_check` — parameters, examples, and behavior |
| [**Capabilities**](docs/capabilities.md) | GitHub cloning, YouTube videos, local video analysis, video frame extraction, PDFs, blocked pages |
| [**Commands**](docs/commands.md) | `/websearch`, `/curator`, `/search`, `/google-account`, shortcuts, activity monitor |
| [**Configuration**](docs/configuration.md) | Config file, credential sources, auth fetch, domain policy, SearXNG, Firecrawl, SSRF, remote curator, feature toggles |
| [**Providers**](docs/providers.md) | Per-provider setup — All providers, Jina, TinyFish, Search1API, Searchinfinity, Querit, AnySearch, xAI, Bright Data, SERPdive |
| [**Limitations**](docs/limitations.md) | Known constraints and edge cases |
