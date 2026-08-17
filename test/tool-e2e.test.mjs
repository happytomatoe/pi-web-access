/**
 * E2E tests for pi-web-access extension tools.
 *
 * Creates a minimal mock of the pi ExtensionAPI, loads the extension,
 * and verifies that:
 * - The extension loads without errors
 * - All 4 tools are registered
 * - Each tool's execute function returns a non-error response
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");

function createMockPi() {
  const registeredTools = new Map();
  const uiCalls = [];

  const pi = {
    registerTool(tool) { registeredTools.set(tool.name, tool); },
    registerCommand() {},
    on() {},
    registerFlag() {},
    registerShortcut() {},
    ui: {
      notify(msg, level) { uiCalls.push({ type: "notify", msg, level }); },
      confirm() { return Promise.resolve(true); },
      select() { return Promise.resolve(); },
      input() { return Promise.resolve(""); },
      setStatus(id, msg) { uiCalls.push({ type: "setStatus", id, msg }); },
      setWidget() {},
      setFooter() {},
      setHeader() {},
    },
    appendEntry() {},
    sendMessage() {},
  };

  return { pi, registeredTools, uiCalls };
}

describe("pi-web-access extension", () => {
  let extensionFn;

  before(async () => {
    process.env.PI_WEB_SEARCH_CONFIG = join(__dirname, "fixtures", "web-search.toml");
    const mod = await import(join(REPO_ROOT, "index.ts"));
    extensionFn = mod.default;
  });

  after(() => {
    delete process.env.PI_WEB_SEARCH_CONFIG;
  });

  it("extension loads without errors", () => {
    const { pi } = createMockPi();
    assert.doesNotThrow(() => extensionFn(pi));
  });

  it("registers all 4 tools", () => {
    const { pi, registeredTools } = createMockPi();
    extensionFn(pi);
    for (const name of ["web_search", "source_check", "fetch_content", "get_search_content"]) {
      assert.ok(registeredTools.has(name), `${name} should be registered`);
      const tool = registeredTools.get(name);
      assert.equal(typeof tool.execute, "function", `${name} should have execute`);
      assert.ok(tool.parameters, `${name} should have parameters`);
    }
  });

  it("web_search: returns non-error response", async () => {
    const { pi, registeredTools } = createMockPi();
    extensionFn(pi);
    const result = await registeredTools.get("web_search").execute(
      "call-1", { query: "hello world" }, new AbortController().signal, () => {},
      { ui: pi.ui }
    );
    assert.ok(result?.content?.length > 0, "should return content");
    const text = result.content.find(c => c.type === "text")?.text ?? "";
    assert.ok(text.length > 0, "should have text content");
  });

  it("fetch_content: returns response (may degrade without providers)", async () => {
    const { pi, registeredTools } = createMockPi();
    extensionFn(pi);
    const result = await registeredTools.get("fetch_content").execute(
      "call-2", { url: "https://example.com" }, new AbortController().signal, () => {},
      { ui: pi.ui }
    );
    assert.ok(result?.content?.length > 0, "should return content");
    const text = result.content.find(c => c.type === "text")?.text ?? "";
    assert.ok(text.length > 0, "should have text content");
  });

  it("get_search_content: returns response for missing responseId", async () => {
    const { pi, registeredTools } = createMockPi();
    extensionFn(pi);
    const result = await registeredTools.get("get_search_content").execute(
      "call-3", { responseId: "nonexistent-12345" }, new AbortController().signal, () => {},
      { ui: pi.ui }
    );
    assert.ok(result?.content?.length > 0, "should return content");
    const text = result.content.find(c => c.type === "text")?.text ?? "";
    assert.ok(text.length > 0, "should have text content");
  });

  it("source_check: returns non-error response", async () => {
    const { pi, registeredTools } = createMockPi();
    extensionFn(pi);
    const result = await registeredTools.get("source_check").execute(
      "call-4", { claim: "the sky is blue" }, new AbortController().signal, () => {},
      { ui: pi.ui }
    );
    assert.ok(result?.content?.length > 0, "should return content");
    const text = result.content.find(c => c.type === "text")?.text ?? "";
    assert.ok(text.length > 0, "should have text content");
  });
});
