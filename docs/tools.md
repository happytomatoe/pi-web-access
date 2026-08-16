
### web_search

Search the web via OpenAI, Brave, Parallel, TinyFish, Search1API, Searchinfinity, Querit, Tavily, Firecrawl, Jina, SERPdive, Kagi, Bocha, Ollama, AnySearch, xAI, Bright Data SERP, SerpBase, self-hosted SearXNG, keyless DuckDuckGo, Exa, Perplexity AI, or Gemini. Returns a synthesized answer with source citations.

```typescript
web_search({ query: "rust async programming" })
web_search({ queries: ["query 1", "query 2"] })
web_search({ query: "latest news", numResults: 10, recencyFilter: "week" })
web_search({ query: "...", domainFilter: ["github.com"] })
web_search({ query: "...", provider: "openai" })
web_search({ query: "...", provider: "all" })
web_search({ query: "...", includeContent: true })
web_search({ queries: ["query 1", "query 2"], workflow: "none" })
web_search({ queries: ["query 1", "query 2"], workflow: "summary-review" })
web_search({ queries: ["query 1", "query 2"], workflow: "auto-summary" })
```

| Parameter | Description |
| ----------- | ------------- |
| `query` / `queries` | Single query or batch of queries |
| `numResults` | Results per query (default: 5, max: 20) |
| `recencyFilter` | `day`, `week`, `month`, or `year` |
| `domainFilter` | Limit to domains (prefix with `-` to exclude) |
| `provider` | Configured provider when omitted or set to `auto`; `all` searches every eligible provider except DuckDuckGo, AnySearch, xAI, Bright Data, and SerpBase simultaneously; otherwise `openai`, `brave`, `parallel`, `tinyfish`, `search1api`, `searchinfinity`, `querit`, `tavily`, `firecrawl`, `jina`, `serpdive`, `kagi`, `bocha`, `ollama`, `anysearch`, `xai`, `brightdata`, `serpbase`, `searxng`, `duckduckgo`, `exa`, `perplexity`, or `gemini` (auto-selects when no provider or routing is configured; DuckDuckGo, AnySearch, xAI, Bright Data, and SerpBase are explicit-only) |
| `includeContent` | Fetch full page content from sources in background |
| `workflow` | `none` (skip curator), `summary-review` (open curator and auto-generate a summary draft, default), or `auto-summary` (generate a summary without opening the curator) |

### fetch_content

Fetch URL(s) as readable markdown, exact textual HTTP bodies, direct images, or page-grounded answers. Automatically detects and handles GitHub repos, YouTube videos, PDFs, local video files, images, and regular web pages.

```typescript
fetch_content({ url: "https://example.com/article" })
fetch_content({ urls: ["url1", "url2", "url3"] })
fetch_content({ url: "https://github.com/owner/repo" })
fetch_content({ url: "https://youtube.com/watch?v=abc", prompt: "What libraries are shown?" })
fetch_content({ url: "/path/to/recording.mp4", prompt: "What error appears on screen?" })
fetch_content({ url: "https://youtube.com/watch?v=abc", timestamp: "23:41-25:00", frames: 4 })
fetch_content({ url: "https://example.com/api", mode: "raw" })
fetch_content({ url: "https://example.com/guide", mode: "answer", prompt: "What are the installation steps?" })
fetch_content({ url: "https://example.com/account", auth: "work", mode: "raw" })
fetch_content({ url: "https://example.com/diagram.png" })
```

| Parameter | Description |
| ----------- | ------------- |
| `url` / `urls` | Single URL/path or multiple URLs |
| `prompt` | Question for video analysis, or the page-local question required by `mode: "answer"` |
| `mode` | `readable` (default), `raw` for exact textual HTTP bodies, or `answer` for a grounded answer from fetched content |
| `answerModel` | Optional `provider/model-id` override for answer mode; defaults to the current enabled Pi model |
| `timestamp` | Extract frame(s) — single (`"23:41"`), range (`"23:41-25:00"`), or seconds (`"85"`) |
| `frames` | Number of frames to extract (max 12) |
| `forceClone` | Clone GitHub repos that exceed the 350MB size threshold |

### get_search_content

Retrieve stored content from previous searches or fetches. Fetched URL content is stored in full in a private `web-search-cache` directory under the Pi config directory, not in the session JSONL. This includes `fetch_content` answer mode, which stores the original page content. The cache has a one-hour lifetime and fixed limits of 128 entries and 128 MiB; when either limit is reached, the oldest entries are removed first. On macOS and Linux the cache directory and files are kept at permissions `0700` and `0600`, respectively. Use `findText` to locate bounded matching passages without paging through a large page, or use `offset` and `limit` to retrieve slices intentionally.

```typescript
get_search_content({ responseId: "abc123", urlIndex: 0 })
get_search_content({ responseId: "abc123", url: "https://...", offset: 30000 })
get_search_content({ responseId: "abc123", query: "original query" })
get_search_content({ responseId: "abc123", urlIndex: 0, findText: "installation" })
get_search_content({ responseId: "abc123", urlIndex: 0, findText: ["timeout", "retry"], findMode: "fuzzy" })
```

`findMode` supports `exact`, `case-insensitive` (default), and `fuzzy`. Finder output is capped at 20,000 characters with match counts and nearby context. `findText` cannot be combined with `offset` or `limit`. The default `limit` and maximum permitted `limit` use `maxInlineContentChars`.

### source_check

Check a claim and return a machine-readable artifact with exact passage citations. Search results are deduplicated and capped at 20 sources; `fetchContent` fetches at most 5 pages, while stored and retrieved content remains subject to the configured `maxInlineContentChars` `offset`/`limit` bounds.

```typescript
source_check({ claim: "The API supports streaming responses" })
source_check({
  claim: "The API supports streaming responses",
  queries: ["API streaming responses documentation", "API streaming limitations"],
  fetchContent: true,
  domainFilter: ["docs.example.com", "-old.example.com"]
})
```

The artifact includes `supported`, `contradicted`, `unclear`, or `missing-evidence` claim status, source quality hints, SHA-256 content hashes, and passage IDs with exact source offsets. Search and fetch errors remain in the artifact instead of being silently discarded. Artifacts are stored with the session and retrieved through `get_search_content` using the returned `responseId`; paged artifact responses are JSON slices, so request the next `offset` when needed.

