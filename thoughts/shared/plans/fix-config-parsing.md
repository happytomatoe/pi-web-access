# Fix Config Parsing: Replace JSON.parse with Shared TOML Loader

## Overview

Replace 27 duplicate `loadConfig()` functions (each using `JSON.parse`) with a single shared `loadConfig()` from `utils.ts` that uses `parseToml`. This fixes the `Failed to parse web-search.toml: Unexpected token '#'` error.

## Current State Analysis

- 27 provider files each define their own `loadConfig()` function
- Each uses `JSON.parse(readFileSync(CONFIG_PATH, "utf-8"))` 
- Config file is TOML format (`web-search.toml`) with `#` comments
- `JSON.parse` fails on TOML syntax
- `utils.ts` already has a working `loadConfig()` using `parseToml`

### Key Discoveries:
- `utils.ts:39` - `loadConfig()` already exported with TOML parsing
- `brave.ts:22-35` - Example of local `loadConfig()` with `JSON.parse`
- Error occurs in all provider files that read config

## Desired End State

All provider files import `loadConfig` from `./utils.ts` instead of defining their own. Web search works with TOML config.

### Verification:
1. Run `PI_WEB_ACCESS_DEBUG=1 pi` in herdr pane
2. Ask agent to search the web
3. Check `/tmp/pi-web-access.log` for debug entries
4. Verify search results appear (no JSON parse errors)

## What We're NOT Doing

- Not adding caching to shared `loadConfig()` (TOML parsing is fast, YAGNI)
- Not changing `WebSearchConfig` interfaces (type casting stays local)
- Not changing provider API (usage stays `loadConfig().someProperty`)

## Implementation Approach

Single phase: Update all 27 files to import shared `loadConfig()`.

## Phase 1: Replace Local loadConfig with Shared Import

### Overview
Remove duplicate `loadConfig()` functions and import from `utils.ts`.

### Changes Required:

#### 1. All Provider Files (27 files)

**Files**: `anysearch.ts`, `bocha.ts`, `brave.ts`, `brightdata.ts`, `brightdata-unlocker.ts`, `datalab-pdf-extract.ts`, `exa.ts`, `firecrawl.ts`, `gemini-api.ts`, `gemini-web-config.ts`, `index.ts`, `jina-search.ts`, `kagi.ts`, `ollama.ts`, `openai-search.ts`, `parallel.ts`, `perplexity.ts`, `querit.ts`, `search1api.ts`, `searchinfinity.ts`, `searxng.ts`, `serpdive.ts`, `serpbase.ts`, `ssrf-protection.ts`, `tavily.ts`, `tinyfish.ts`, `xai-search.ts`

**Changes**:
1. Add `loadConfig` to import from `./utils.ts`
2. Remove local `loadConfig()` function
3. Remove `cachedConfig` variable
4. Keep local `WebSearchConfig` interface

**Before** (brave.ts example):
```typescript
import { getWebSearchConfigPath } from "./utils.ts";

interface WebSearchConfig {
    braveApiKey?: unknown;
}

let cachedConfig: WebSearchConfig | null = null;

function loadConfig(): WebSearchConfig {
    if (cachedConfig) return cachedConfig;
    if (!existsSync(CONFIG_PATH)) {
        cachedConfig = {};
        return cachedConfig;
    }
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    try {
        cachedConfig = JSON.parse(raw) as WebSearchConfig;
        return cachedConfig;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to parse ${CONFIG_PATH}: ${message}`);
    }
}
```

**After**:
```typescript
import { loadConfig, getWebSearchConfigPath } from "./utils.ts";

interface WebSearchConfig {
    braveApiKey?: unknown;
}
```

### Success Criteria:

#### Automated Verification:
- [ ] No `JSON.parse` calls for config files: `grep -r "JSON.parse.*raw\|JSON.parse.*readFileSync" *.ts | grep -v test`
- [ ] All providers import from utils: `grep -l "from.*utils" *.ts | wc -l` should be ~30
- [ ] No duplicate `loadConfig` definitions: `grep -l "function loadConfig" *.ts | wc -l` should be 1 (utils.ts only)

#### Manual Verification:
- [ ] Run `PI_WEB_ACCESS_DEBUG=1 pi` in herdr pane
- [ ] Ask agent to search the web for "history of Rastafarianism"
- [ ] Verify search results appear (no parse errors)
- [ ] Check `/tmp/pi-web-access.log` has debug entries

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:
- Verify `loadConfig()` returns parsed TOML object
- Verify `loadConfig()` returns null when file missing
- Verify `loadConfig()` handles malformed TOML gracefully

### Manual Testing Steps:
1. Run `PI_WEB_ACCESS_DEBUG=1 pi` in herdr pane
2. Ask agent to search the web
3. Verify results appear
4. Check debug log for entries

## Performance Considerations

- No caching in shared `loadConfig()` (TOML parsing is fast)
- File read on every call (acceptable for config that rarely changes)
- Could add caching later if profiling shows bottleneck

## References

- `utils.ts:39` - Shared `loadConfig()` implementation
- `brave.ts:22-35` - Example local `loadConfig()` to remove
- `smol-toml` package - TOML parser used
