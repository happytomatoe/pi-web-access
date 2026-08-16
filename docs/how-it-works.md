
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

