
Set `provider: "all"` on `web_search` or `source_check`, or configure `"provider": "all"` as the default, to run the same query against every eligible search provider simultaneously. DuckDuckGo, AnySearch, xAI, Bright Data, and SerpBase are always excluded because they are explicit-only; Bright Data and SerpBase are paid Google SERP providers, so `all` never spends on them. Exa remains eligible through its zero-config MCP path, OpenAI can use Pi auth, and other API-backed search providers participate when their API key, local endpoint, or gateway makes them available. Browser-cookie access alone does not opt Gemini into `all`; select Gemini explicitly or configure its API/gateway.

Successful provider answers are preserved separately while source URLs and inline content are deduplicated, and one provider failure does not discard the other results. If every participating provider fails, the tool returns per-provider diagnostics. Configured Firecrawl participates in `all` like other eligible providers. In the Curator, **All** can also be selected like the other provider buttons. Each participating provider gets its own result card, including a provider badge and independent selection checkbox; failed providers get their own disabled error card. The final summary is generated from the selected provider cards and is what Pi receives. Outside the Curator, the same provider answers remain available as labeled sections in one tool response.

### Jina Search

`jinaApiKey` enables [Jina Search](https://s.jina.ai); alternatively, set `JINA_API_KEY`. The key may be a literal, an environment-variable reference, or a trusted command credential source:

```toml
jinaApiKey = "$JINA_API_KEY"
provider = "jina"
```

Setting `provider` is optional. In `auto` mode, Jina is tried after Firecrawl and before SERPdive. It can also be selected per request with `provider: "jina"`, included in provider arrays or `provider: "all"`, or placed in `searchRouting.providers`.

Jina Search maps `numResults` to its bounded `count` parameter, sends included domains as `site` filters, and adds excluded domains and recency constraints to the search query. Without `includeContent`, it requests SERP metadata only. With `includeContent: true`, Jina visits matching pages and returns their Markdown inline, so requests can take longer and consume more Jina tokens. The fixed hosted endpoint is `https://s.jina.ai`; no custom endpoint is configured by this extension.

### TinyFish

`tinyfishApiKey` enables the TinyFish Search and Fetch APIs; alternatively, set `TINYFISH_API_KEY`. Get an API key from the [TinyFish API Keys](https://agent.tinyfish.ai/api-keys) page. Like the other provider keys, `tinyfishApiKey` can contain a literal key, an environment-variable reference, or a trusted command credential source:

```toml
tinyfishApiKey = "$TINYFISH_API_KEY"
provider = "tinyfish"
```

Setting `provider` is optional. In `auto` mode, an available TinyFish provider is tried after Parallel and before Search1API. You can also select it per request with `provider: "tinyfish"` or place `"tinyfish"` in `searchRouting.providers`.

TinyFish Search supports the shared `numResults`, `recencyFilter`, and include/exclude `domainFilter` options. Requests above 10 results use TinyFish pagination. When `includeContent` is true, result URLs are sent to TinyFish Fetch in batches of up to 10 and returned as inline Markdown content. TinyFish Fetch is also used as a hosted `fetch_content` fallback after Jina Reader and before Search1API.

The stable Search (`https://api.search.tinyfish.ai`) and Fetch (`https://api.fetch.tinyfish.ai`) endpoints are built in, so no base URL setting is required. TinyFish currently documents both APIs as credit-free, with Free-plan limits of 30 search requests per minute and 150 fetched URLs per minute; an API key is still required. See the [TinyFish Search reference](https://docs.tinyfish.ai/search-api/reference) and [TinyFish Fetch reference](https://docs.tinyfish.ai/fetch-api/reference).

### Search1API

`search1apiApiKey` enables [Search1API](https://www.search1api.com) Search and Crawl; alternatively, set `SEARCH1API_KEY`. Create a key in the [Search1API dashboard](https://dashboard.search1api.com). Like the other provider keys, `search1apiApiKey` can contain a literal key, an environment-variable reference, or a trusted command credential source:

```toml
search1apiApiKey = "$SEARCH1API_KEY"
provider = "search1api"
```

Setting `provider` is optional. In `auto` mode, an available Search1API provider is tried after TinyFish and before Searchinfinity. You can also select it per request with `provider: "search1api"`, include it in provider arrays or `provider: "all"`, or place `"search1api"` in `searchRouting.providers`.

Search1API Search supports the shared `numResults`, `recencyFilter`, and include/exclude `domainFilter` options. When `includeContent` is true, it maps to Search1API Deep Search and returns successfully crawled result content inline. The Search1API Crawl endpoint is also used as a hosted `fetch_content` fallback after Jina Reader and TinyFish, before Parallel.

Search1API is credit-based. A basic search costs 1 credit; Deep Search adds 1 credit for each result page crawled successfully, and a Crawl request costs 1 credit. The extension never enables Deep Search unless `includeContent` is true. See the [Search API guide](https://www.search1api.com/docs/basic/search), [Crawl API guide](https://www.search1api.com/docs/basic/crawl), and [credit rules](https://www.search1api.com/docs/essentials/credits-and-limits).

### Searchinfinity

`searchinfinityApiKey` enables [Byteplus Searchinfinity](https://docs.byteplus.com/en/docs/searchinfinity/) web search (the Global edition of Volcengine 豆包搜索); alternatively, set `SEARCHINFINITY_API_KEY`. Create a key in the [Searchinfinity console](https://console.byteplus.com/search-infinity/api-key). Like the other provider keys, `searchinfinityApiKey` can contain a literal key, an environment-variable reference, or a trusted command credential source:

```toml
searchinfinityApiKey = "$SEARCHINFINITY_API_KEY"
provider = "searchinfinity"
```

Setting `provider` is optional. In `auto` mode, an available Searchinfinity provider is tried after Search1API and before Querit. You can also select it per request with `provider: "searchinfinity"`, include it in provider arrays or `provider: "all"`, or place `"searchinfinity"` in `searchRouting.providers`.

Searchinfinity Search supports the shared `numResults` (max 20 per request), `recencyFilter`, and include/exclude `domainFilter` options (up to 5 domains each). Answers are assembled from the model-generated per-result summaries when present, falling back to plain snippets. Accounts include a monthly free search quota shared with the Custom edition; API Key requests are limited to 5 QPS and a 30-second server-side timeout. See the [Searchinfinity API reference](https://docs.byteplus.com/api/docs/searchinfinity/Searchinfinity_API_Reference).

### Querit

`queritApiKey` enables Querit Search and Contents; alternatively, set `QUERIT_API_KEY`. Create a key in the [Querit dashboard](https://www.querit.ai/en/dashboard/api-keys). Like the other provider keys, `queritApiKey` can contain a literal key, an environment-variable reference, or a trusted command credential source:

```toml
queritApiKey = "$QUERIT_API_KEY"
provider = "querit"
```

Setting `provider` is optional. In `auto` mode, an available Querit provider is tried after Searchinfinity and before Tavily. You can also select it per request with `provider: "querit"`, include it in provider arrays or `provider: "all"`, or place `"querit"` in `searchRouting.providers`.

Search requests follow the official [`querit-python`](https://github.com/querit-ai/querit-python) models: `numResults` maps to `count`, include/exclude `domainFilter` values map to `filters.sites`, and recency maps to `filters.timeRange.date` (`d1`, `w1`, `m1`, or `y1`). When `includeContent` is true, result URLs are sent to `POST /v1/contents` in batches of up to 10 and returned as inline Markdown. The same Contents endpoint is used as a hosted `fetch_content` fallback after Search1API and before Parallel. Querit Search and Contents subscriptions are independent; an API key can search successfully while `/v1/contents` returns `403 No active contents subscription`.

### AnySearch

AnySearch is an explicit-only provider: it is never included in zero-config `auto` fallback or in `provider: "all"`, but it can be selected with `provider: "anysearch"`, configured as the named provider, or placed in `searchRouting`. It supports anonymous requests and optional `anysearchApiKey` / `ANYSEARCH_API_KEY` credentials. Requests intentionally send only `{ query, max_results }`; `recencyFilter`, `domainFilter`, and `includeContent` do not add API request parameters. When `includeContent` is true, returned `content` fields are exposed as inline content.

### xAI (Grok)

xAI is an explicit-only provider: it is never included in zero-config `auto` fallback or in `provider: "all"`, but it can be selected with `provider: "xai"`, configured as the named provider, or placed in `searchRouting`.

It calls xAI's Agent Tools API — the hosted `web_search` tool on `https://api.x.ai/v1/responses` — so the search runs inside Grok's own inference rather than here. Auth resolves through Pi's model registry first, which means a **SuperGrok or X Premium subscription pays for its own searches** and no `xaiApiKey` has to be configured at all; `xaiApiKey` / `XAI_API_KEY` are the fallback for pay-as-you-go API keys.

Explicit-only is deliberate. A single question typically fans out to roughly a dozen `web_search` tool calls, billed at xAI's per-call tool rate on top of tokens and drawn from the same allowance the account uses for chatting. Letting `auto` or `all` reach for it would spend a subscription the user only meant to talk to.

The model is chosen for you: the registry path walks a best-first candidate list and uses the first id Pi actually knows, so a retired model is skipped rather than sent. The API-key path has no registry to consult and starts at `grok-4.5`. `xaiSearchModel` pins the id explicitly on either path, which is the escape hatch if xAI retires a model before a release ships.

Requests send only `{ model, input, tools }`, the shape verified against a live subscription account. `recencyFilter`, `domainFilter`, and `numResults` are folded into the prompt text rather than sent as tool parameters, so an unrecognized field can never turn a search into a 400. Sources are read from `url_citation` annotations on the answer and from each `web_search_call`'s own sources; there is no top-level `citations` array on this API.

xAI's older Live Search (`search_parameters` on `/v1/chat/completions`) is deprecated and now answers HTTP 410.

### Bright Data

Bright Data SERP is a **paid, third-party search proxy**: your query, its filters, and the result URLs
it turns up all pass through Bright Data's network. It is explicit-only — never included in zero-config
`auto` fallback and never in `provider: "all"` — so adding a token never starts spending on your
behalf, and one `all` search can never bill you for a Bright Data request. Select it with
`provider: "brightdata"`, set it as the named `provider`, or place `"brightdata"` in
`searchRouting.providers`. Naming it as the provider is never quietly redirected: if the Bright Data
settings are incomplete, the search reports that rather than curating through a different provider
under Bright Data's name. A `searchRouting` list is the exception, and it behaves there exactly as it
does for every other provider in the list: an unavailable entry is skipped and the next candidate
answers the query.

It needs two settings, and it reports itself unavailable until both are present — as does a zone name
it cannot use, so a typo makes Bright Data unavailable rather than breaking `web_search` for the
providers that are configured correctly:

```toml
brightdataApiKey = "$BRIGHTDATA_API_KEY"
brightdataSerpZone = "pi_serp"
provider = "brightdata"
```

`brightdataApiKey` (or `BRIGHTDATA_API_KEY`) is your account API token from
[Bright Data → API tokens](https://brightdata.com/cp/setting/users). This extension uses one name per
field, matching every other provider here, so if you already export that token under a different
variable name, point at it explicitly rather than expecting an alias:
`"brightdataApiKey": "$BRIGHTDATA_API_TOKEN"`. Like the other provider keys it also accepts a
`!command` credential source, resolved once per request.

**Zones.** A Bright Data zone is a named, per-product configuration on your account; requests are made
against a zone and billed to it. `brightdataSerpZone` (or `BRIGHTDATA_SERP_ZONE`) must name a zone of
type **`serp`**, created at
[Bright Data → proxies and scraping infrastructure](https://brightdata.com/cp/zones). A Web Unlocker
zone (type `unblocker`) is a different Bright Data product, priced differently, and it does not return
SERP JSON: point this setting at one and the request is still made and billed, and whatever comes back
is reported as an error rather than as zero results — an envelope with no `organic` array names the
wrong zone type as the likely cause. The two zone types are never substituted for one another. There
is deliberately no default, and no fallback to any other Bright Data zone setting you may have
configured: guessing a zone name would bill the wrong product. Every request carries the zone, and
every error about a request that was billed names it, because "which zone did I pay on" is the first
question a paid failure has to answer. The messages that name no zone are the ones with nothing to
attribute — a missing token, a rejected zone value, a config file that could not be read, or a
connection that never returned a response.

**Getting a token and a zone.** Sign up at [brightdata.com](https://brightdata.com); no credit card is
required, and adding one is a verification step only. Connecting Bright Data's MCP server to your agent
is the shortest path to a working setup: it provisions the zones for you and they draw on the same
monthly free credits. Then put the SERP zone's name in `brightdataSerpZone`. This extension does not
know or guess those names — a zone must be configured explicitly, so a stray `BRIGHTDATA_API_KEY` in
your environment cannot make Bright Data available, and nothing can be billed against a zone that may
not exist on your account.

**Cost.** One search is one billable Bright Data request against that zone, charged whether or not the
results are useful. `numResults` does not change that: one query is one request no matter how many
results come back, so a slightly larger page size is requested to leave room for local filtering.
Bright Data's free tier is 5,000 credits per month with no credit card required, and it covers the SERP
API this provider uses; credits reset to 5,000 on the first of each month and unused credits are
forfeited. Billing is a pre-paid wallet model — you are only ever charged for funds you have
explicitly deposited, and when the free credits are exhausted requests return an error rather than
incurring a charge — so accidental spend is not possible without a deliberate deposit. Two caveats:
the free credits do not cover proxy products (Datacenter / ISP / Residential) or the Browser API, none
of which this provider uses; and accounts already on custom pay-as-you-go pricing or a pre-commit plan
are not eligible for the monthly credits. An account that has never deposited funds is also capped at
1,000 requests per minute. See
[free tier](https://docs.brightdata.com/general/account/billing-and-pricing/free-tier) and
[brightdata.com/pricing](https://brightdata.com/pricing).

**Privacy.** Your query text, your `domainFilter` and `recencyFilter` values, and the ranked URLs the
search turns up are all visible to Bright Data, which runs the Google search from its own network on
your behalf. Use SearXNG instead if queries must not leave infrastructure you control. Bright Data
holds ISO/IEC 27001, 27017 and 27018 certification, SOC 2 Type II and SOC 3, states that it does not
sell or license customer data to any third party, and will delete customer data on request; traffic is
TLS 1.3 in transit and AES-256 at rest. Its published security documentation does not state a retention
period for request data itself — the queries and URLs sent — and nothing here claims one:
[security and privacy overview](https://docs.brightdata.com/general/security/security-overview#privacy-&-regulatory-compliance).

**What the request looks like.** A Google search URL — carrying your query, `site:` operators, Google's
`tbs` time filter, and `brd_json=1` — is submitted to `https://api.brightdata.com/request` with
`{ zone, format: "raw", data_format: "parsed_light" }`. Bright Data returns the SERP as JSON and this
extension reads its `organic` array.

**Filters reach the engine.** Unlike providers with no filter parameters, both shared filters are
expressed to Google itself:

- **Recency is a real filter.** `recencyFilter` maps to Google's `tbs=qdr:d|w|m|y`, so pages outside the
  window are not returned at all — not a ranking hint.
- **Domain filters are `site:` operators.** Includes become `site:example.com` (multiple includes are
  OR-ed), excludes become `-site:example.com`. Google honours these loosely, so the same filter is
  applied again to the results that come back; a host you excluded never reaches the caller.

**Output contract.** A SERP zone returns ranked links, so results are `{ title, url, snippet }` mapped
from `organic[].{title, link, description}` and the `answer` is assembled from those sources, the same
way Brave and SearXNG answers are assembled. There is no API-side answer synthesis. `includeContent` is
accepted and has no effect: `parsed_light` carries no page bodies, so `inlineContent` is never returned
and no second billable request is made behind your back. Entries with no link, and hosts your filters
exclude, are skipped.

**Failures are never silent.** A non-2xx response throws
`Bright Data API error <status> for zone <zone>` with the response body redacted of your token, so
`402`/`429` classify as `quota` and `401`/`403` as `auth` for `searchRouting.fallbackOn`. Every billed
`200` this extension cannot read throws as well, because the request was paid for and an empty result
list would report it as "the web had no answer":

- **not JSON at all** — Google's "unusual traffic" interstitial reaches you as the raw proxied body,
  quoted to the first 300 characters rather than reduced to `Unexpected token <`;
- **JSON, but Bright Data's own error envelope** — `format: "raw"` means failures like
  `{"error":"zone not found","code":"zone_missing"}` arrive with HTTP 200, and the reported message
  repeats what Bright Data said and the code it said it with;
- **JSON, but not a SERP** — an envelope with no `organic` array is reported as such, naming the
  likeliest cause (a zone that is not of type `serp`), rather than as zero results.

Quoted upstream text cannot impersonate this extension's own diagnostics, in either of the two ways
routing reads them. It cannot impersonate a status: a proxied page mentioning "Error 503" is quoted as
`upstream 503`, and because the quoted text is truncated before it is rewritten, a body engineered so
that the length cut turns a longer number into a three-digit one cannot manufacture a status either.
It cannot impersonate a rate-limit phrase: those are quoted as `upstream rate-limit notice`, so a page
saying "you have exceeded your rate limit" cannot make a billed request look like a quota failure. The
number and the wording still reach you; only this extension's own text decides how the failure is
classified. A billed `200` therefore surfaces as an unreadable-response error. It is not retried by
default; it only falls through a configured route when you explicitly include
`"invalid-response"` in `searchRouting.fallbackOn`.

Your token is removed from every quoted response body, error message and activity log line before it
is shown, and no prefix of it survives either: the parser's own message, which quotes the first
characters of a body back inside itself, is dropped rather than filtered. `web-search.json` gets the
same treatment from the other direction: if the file is not valid JSON, the error names the file, and
the parse position where the parser reports one, but repeats none of the file's own text, since that
text is where your credentials live.

A missing or malformed zone, and a missing token, all fail before any request is made. A malformed
zone is a request-path error only — it makes Bright Data report itself unavailable, and never
propagates out of provider availability into an unrelated provider's search.

Searches use a 60-second timeout and honour cancellation: aborting a `web_search` aborts the in-flight
Bright Data request rather than waiting for it.

### SERPdive

`serpdiveApiKey` enables the SERPdive provider; get a key at [serpdive.com](https://serpdive.com/dashboard/keys). `serpdiveModel` (or `SERPDIVE_MODEL`) picks the retrieval depth:

| Model | Cost | What comes back |
| --- | --- | --- |
| `krill` (default) | free, fair use | Extracted page content. No API-side answer synthesis — the answer is assembled from the sources, as for Brave and SearXNG. |
| `mako` | 1 credit | The fact-carrying sentences of each page, plus a synthesized answer. |
| `moby` | 1.5 credits | The full readable content of every page, plus a cited answer. |

The model is the only thing that decides retrieval depth: `includeContent` controls whether that content is also returned inline, it never changes the model. For full page text, set `serpdiveModel` to `moby` yourself. The default is the free tier on purpose: installing this provider never starts spending on your behalf. An unrecognised value falls back to `krill` rather than failing, so a typo cannot cost money. Current pricing: [serpdive.com/pricing](https://serpdive.com/pricing).

Two behaviours worth knowing, both consequences of the API surface:

- **Recency is a hint, not a filter.** SERPdive exposes no time-range parameter. `recencyFilter` is appended to the question ("past week"), which biases ranking toward recent pages; results outside the window can still come back.
- **Domain filters are applied locally.** SERPdive has no include/exclude domain parameter, so `domainFilter` is applied to the results that come back. It can narrow a page of results, not ask the engine for more from a given domain.

`numResults` maps to `max_results`, which the API treats as a cap between 1 and 10 — never a minimum. Values above 10 are clamped; the engine returns what it judges relevant, which is often fewer.

