import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const REPO_ROOT = join(import.meta.dirname, "..");

function run(cmd) {
  return execSync(cmd, { cwd: REPO_ROOT, encoding: "utf-8", timeout: 5000 }).trim();
}

describe("TOML config: no direct file reads remain", () => {
  it("no readFileSync on config path outside loadConfig", () => {
    const files = run(
      `grep -rn "readFileSync.*CONFIG_PATH\\|readFileSync.*WEB_SEARCH_CONFIG" --include="*.ts" . | grep -v "node_modules" || true`
    );
    assert.equal(files, "", `Files still directly reading config: ${files}`);
  });

  it("no stale loadConfigRoot references", () => {
    const result = run(`grep -rn "loadConfigRoot" --include="*.ts" . || true`);
    assert.equal(result, "", `Stale loadConfigRoot references: ${result}`);
  });

  it("no web-search.json in non-comment code", () => {
    // Allow comments (brightdata.ts has historical docs referencing json)
    const result = run(
      `grep -rn "web-search.json" --include="*.ts" . | grep -v "//" || true`
    );
    assert.equal(result, "", `web-search.json in non-comment code: ${result}`);
  });

  it("no parseToml imports outside utils.ts and index.ts", () => {
    // index.ts needs stringifyToml for writing config back
    const result = run(
      `grep -rn 'from "smol-toml"' --include="*.ts" . | grep -v utils.ts | grep -v index.ts || true`
    );
    assert.equal(result, "", `smol-toml imported outside utils.ts/index.ts: ${result}`);
  });
});

describe("TOML config: all modules use loadConfig", () => {
  const filesToCheck = [
    "video-extract.ts",
    "pdf-extract.ts",
    "auth-fetch.ts",
    "ssrf-protection.ts",
  ];

  for (const file of filesToCheck) {
    it(`${file} imports loadConfig from utils`, () => {
      const src = run(`cat ${file}`);
      assert.ok(src.includes("loadConfig"), `${file} should import loadConfig`);
    });

    it(`${file} does not import parseToml directly`, () => {
      const src = run(`cat ${file}`);
      assert.ok(!src.includes('from "smol-toml"'), `${file} should not import smol-toml directly`);
    });
  }

  it("ssrf-protection.ts has no custom caching", () => {
    const src = run(`cat ssrf-protection.ts`);
    assert.ok(!src.includes("cachedConfigRoot"), "ssrf-protection.ts should not have custom caching");
  });

  it("index.ts saveConfig uses loadConfig", () => {
    const src = run(`cat index.ts`);
    assert.ok(src.includes("loadConfig()"), "index.ts saveConfig should use loadConfig()");
    assert.ok(!src.includes("parseConfigRoot"), "index.ts should not have parseConfigRoot");
  });
});
