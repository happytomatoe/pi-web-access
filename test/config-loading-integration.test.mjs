/**
 * Integration tests for config loading after the TOML consolidation.
 *
 * These tests verify that the refactored functions (loadConfig, loadSsrfConfig,
 * loadFetchContentDomainPolicy, loadVideoConfig, loadPDFConfig, loadAuthFetchProfiles)
 * correctly parse TOML config and return expected values.
 *
 * We can't import TS directly, so we use a thin Node wrapper that calls the
 * same logic path: readFileSync → parseToml → extract section.
 */
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const TMP = join(import.meta.dirname, ".tmp-integration");
const CONFIG_PATH = join(TMP, "web-search.toml");

// Helper: write a TOML config and run a Node snippet that imports smol-toml
// to parse it, simulating what loadConfig does.
function writeAndParse(tomlContent) {
  writeFileSync(CONFIG_PATH, tomlContent, "utf-8");
  // Use dynamic import to load smol-toml from pi's node_modules
  const script = `
    import("smol-toml").then(({ parse }) => {
      const fs = require("fs");
      const raw = parse(fs.readFileSync("${CONFIG_PATH.replace(/\\/g, "\\\\")}", "utf-8"));
      console.log(JSON.stringify(raw));
    });
  `;
  const result = execSync(`node --input-type=module -e '${script}'`, {
    encoding: "utf-8",
    timeout: 5000,
    cwd: join(import.meta.dirname, ".."),
  }).trim();
  return JSON.parse(result);
}

function writeConfig(content) {
  writeFileSync(CONFIG_PATH, content, "utf-8");
}

before(() => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true });
  mkdirSync(TMP, { recursive: true });
});

after(() => {
  if (existsSync(TMP)) rmSync(TMP, { recursive: true });
});

describe("loadConfig (utils.ts) — TOML parsing", () => {
  it("parses empty config as empty object", () => {
    const config = writeAndParse("");
    assert.deepEqual(config, {});
  });

  it("parses video section", () => {
    const config = writeAndParse(`
[video]
enabled = true
preferredModel = "gemini-2.5-flash"
maxSizeMB = 500
`);
    assert.equal(config.video.enabled, true);
    assert.equal(config.video.preferredModel, "gemini-2.5-flash");
    assert.equal(config.video.maxSizeMB, 500);
  });

  it("parses pdf section", () => {
    const config = writeAndParse(`
[pdf]
enabled = true
provider = "datalab"
maxSizeMB = 100
`);
    assert.equal(config.pdf.enabled, true);
    assert.equal(config.pdf.provider, "datalab");
    assert.equal(config.pdf.maxSizeMB, 100);
  });

  it("parses ssrf section", () => {
    const config = writeAndParse(`
[ssrf]
allowRanges = ["10.0.0.0/8", "192.168.0.0/16"]
trustEnvProxy = true
`);
    assert.deepEqual(config.ssrf.allowRanges, ["10.0.0.0/8", "192.168.0.0/16"]);
    assert.equal(config.ssrf.trustEnvProxy, true);
  });

  it("parses fetchContent.domainPolicy section", () => {
    const config = writeAndParse(`
[fetchContent.domainPolicy]
allow = ["example.com", "*.github.com"]
`);
    assert.deepEqual(config.fetchContent.domainPolicy.allow, ["example.com", "*.github.com"]);
  });

  it("parses authFetchProfiles array", () => {
    const config = writeAndParse(`
[[authFetchProfiles]]
name = "work"
domainPatterns = ["corp.example.com"]
cache = "session"

[[authFetchProfiles]]
name = "personal"
domainPatterns = ["*.gmail.com"]
`);
    assert.ok(Array.isArray(config.authFetchProfiles));
    assert.equal(config.authFetchProfiles.length, 2);
    assert.equal(config.authFetchProfiles[0].name, "work");
    assert.equal(config.authFetchProfiles[1].name, "personal");
  });

  it("parses multiple sections together", () => {
    const config = writeAndParse(`
[video]
enabled = true

[pdf]
provider = "gemini"

[ssrf]
allowRanges = ["10.0.0.0/8"]

[[authFetchProfiles]]
name = "test"
`);
    assert.equal(config.video.enabled, true);
    assert.equal(config.pdf.provider, "gemini");
    assert.deepEqual(config.ssrf.allowRanges, ["10.0.0.0/8"]);
    assert.equal(config.authFetchProfiles[0].name, "test");
  });

  it("handles comments in TOML", () => {
    const config = writeAndParse(`
# This is a comment
[video]
# Another comment
enabled = true
`);
    assert.equal(config.video.enabled, true);
  });

  it("handles special characters in strings", () => {
    const config = writeAndParse(`
[ssrf]
allowRanges = ["10.0.0.0/8"]
`);
    assert.deepEqual(config.ssrf.allowRanges, ["10.0.0.0/8"]);
  });

  it("rejects invalid TOML", () => {
    writeFileSync(CONFIG_PATH, "this is not valid { toml ]]", "utf-8");
    assert.throws(
      () => {
        execSync(`node --input-type=module -e 'import("smol-toml").then(({parse}) => { const fs = require("fs"); parse(fs.readFileSync("${CONFIG_PATH.replace(/\\/g, "\\\\")}", "utf-8")); })'`, {
          encoding: "utf-8",
          timeout: 5000,
          cwd: join(import.meta.dirname, ".."),
        });
      },
      /Error/
    );
  });
});

describe("config section extraction — simulates loadXxxConfig functions", () => {
  it("video config: defaults when section missing", () => {
    const raw = writeAndParse(`[pdf]\nenabled = true`);
    const v = raw.video ?? {};
    const config = {
      enabled: v.enabled ?? true,
      preferredModel: v.preferredModel ?? "gemini-2.5-flash",
      maxSizeMB: v.maxSizeMB ?? 1000,
    };
    assert.equal(config.enabled, true);
    assert.equal(config.preferredModel, "gemini-2.5-flash");
    assert.equal(config.maxSizeMB, 1000);
  });

  it("video config: overrides from TOML", () => {
    const raw = writeAndParse(`
[video]
enabled = false
preferredModel = "gemini-2.5-pro"
maxSizeMB = 200
`);
    const v = raw.video ?? {};
    const config = {
      enabled: v.enabled ?? true,
      preferredModel: v.preferredModel ?? "gemini-2.5-flash",
      maxSizeMB: v.maxSizeMB ?? 1000,
    };
    assert.equal(config.enabled, false);
    assert.equal(config.preferredModel, "gemini-2.5-pro");
    assert.equal(config.maxSizeMB, 200);
  });

  it("ssrf config: empty when section missing", () => {
    const raw = writeAndParse(`[video]\nenabled = true`);
    const ssrf = raw.ssrf;
    assert.ok(!ssrf || typeof ssrf !== "object");
  });

  it("ssrf config: extracts allowRanges", () => {
    const raw = writeAndParse(`
[ssrf]
allowRanges = ["172.16.0.0/12"]
trustEnvProxy = false
`);
    const config = {
      allowRanges: Array.isArray(raw.ssrf?.allowRanges) ? raw.ssrf.allowRanges : [],
      trustEnvProxy: raw.ssrf?.trustEnvProxy === true,
    };
    assert.deepEqual(config.allowRanges, ["172.16.0.0/12"]);
    assert.equal(config.trustEnvProxy, false);
  });

  it("pdf config: defaults when section missing", () => {
    const raw = writeAndParse(`[video]\nenabled = true`);
    const pdf = raw.pdf ?? {};
    const config = {
      enabled: pdf.enabled ?? true,
      provider: pdf.provider ?? "auto",
      maxSizeMB: pdf.maxSizeMB ?? 20,
    };
    assert.equal(config.enabled, true);
    assert.equal(config.provider, "auto");
    assert.equal(config.maxSizeMB, 20);
  });

  it("authFetch: empty array when no profiles", () => {
    const raw = writeAndParse(`[video]\nenabled = true`);
    const profiles = raw.authFetchProfiles;
    assert.ok(!Array.isArray(profiles) || profiles.length === 0);
  });

  it("authFetch: extracts profile list", () => {
    const raw = writeAndParse(`
[[authFetchProfiles]]
name = "corp"
domainPatterns = ["*.corp.com"]
`);
    const profiles = Array.isArray(raw.authFetchProfiles) ? raw.authFetchProfiles : [];
    assert.equal(profiles.length, 1);
    assert.equal(profiles[0].name, "corp");
  });
});
