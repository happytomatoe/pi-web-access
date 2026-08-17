import { existsSync, readFileSync } from "node:fs";
import { getWebSearchConfigPath } from "./utils.ts";
import { loadConfig } from "./utils.ts";

const CONFIG_PATH = getWebSearchConfigPath();

interface GeminiWebConfig {
	chromeProfile?: string;
	allowBrowserCookies?: boolean;
}


export function normalizeChromeProfile(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const normalized = value.trim();
	return normalized.length > 0 ? normalized : undefined;
}


export function getChromeProfileFromConfig(): string | undefined {
	const value = loadConfig().chromeProfile;
	return typeof value === "string" ? value : undefined;
}

export function isBrowserCookieAccessAllowed(): boolean {
	if (process.env.PI_ALLOW_BROWSER_COOKIES === "1" || process.env.FEYNMAN_ALLOW_BROWSER_COOKIES === "1") {
		return true;
	}
	return loadConfig().allowBrowserCookies === true;
}
