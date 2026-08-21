/**
 * Server-side SSRF protections for outbound scan requests.
 * Only http(s) is allowed, and private/loopback/link-local targets are rejected.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  "metadata",
  "metadata.google.internal",
  "instance-data",
]);

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa", ".onion"];

function isPrivateIPv4(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = nums as [number, number, number, number];
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIPv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "::1" || h === "::") return true;
  return h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80") || h.startsWith("::ffff:");
}

export type UrlGuardResult =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

export function guardOutboundUrl(rawUrl: string): UrlGuardResult {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "The URL could not be parsed." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, reason: "Only http and https URLs can be scanned." };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "URLs with embedded credentials are not allowed." };
  }

  const host = parsed.hostname.toLowerCase();
  if (!host || host.length > 253) {
    return { ok: false, reason: "The hostname is invalid." };
  }
  if (BLOCKED_HOSTNAMES.has(host) || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    return { ok: false, reason: "Internal and loopback hosts cannot be scanned." };
  }
  if (isPrivateIPv4(host) || isPrivateIPv6(host)) {
    return { ok: false, reason: "Private network addresses cannot be scanned." };
  }
  if (!host.includes(".") && !host.includes(":")) {
    return { ok: false, reason: "Enter a fully qualified public hostname." };
  }
  if (parsed.port && !["", "80", "443", "8080", "8443"].includes(parsed.port)) {
    return { ok: false, reason: "Only standard web ports can be scanned." };
  }

  return { ok: true, url: parsed };
}

export const SCAN_TIMEOUT_MS = 12_000;
export const MAX_RESPONSE_BYTES = 512_000;
export const MAX_REDIRECTS = 3;

export interface SafeFetchResult {
  status: number;
  headers: Headers;
  body: string;
  finalUrl: string;
  redirects: string[];
}

/** Fetch with manual redirect validation, a hard timeout and a response size cap. */
export async function safeFetch(
  target: string,
  init?: { method?: "GET" | "HEAD" },
): Promise<SafeFetchResult> {
  let current = target;
  const redirects: string[] = [];

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const guard = guardOutboundUrl(current);
    if (!guard.ok) throw new Error(guard.reason);

    const response = await fetch(guard.url.toString(), {
      method: init?.method ?? "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(SCAN_TIMEOUT_MS),
      headers: { "user-agent": "CyberVaultScanner/1.0 (+authorized-scan)" },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { status: response.status, headers: response.headers, body: "", finalUrl: current, redirects };
      current = new URL(location, current).toString();
      redirects.push(current);
      continue;
    }

    let body = "";
    if (init?.method !== "HEAD" && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        body += decoder.decode(value, { stream: true });
        if (received >= MAX_RESPONSE_BYTES) {
          await reader.cancel();
          break;
        }
      }
    }

    return { status: response.status, headers: response.headers, body, finalUrl: current, redirects };
  }

  throw new Error("Too many redirects while scanning this URL.");
}
