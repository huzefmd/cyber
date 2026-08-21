import { sanitizeText } from "./validation";
import { guardOutboundUrl } from "./security.server";
import type { PhishingResult } from "@/types/security";

/**
 * Configurable AI provider abstraction for phishing analysis.
 * Order of preference: OpenAI → Gemini → Lovable AI → heuristic fallback.
 */
export interface PhishingProvider {
  name: string;
  analyze(url: string): Promise<PhishingResult>;
}

interface ModelJson {
  classification?: string;
  confidence_score?: number;
  explanation?: string;
  threat_indicators?: unknown;
  recommendations?: unknown;
}

const SYSTEM_PROMPT = `You are a phishing-analysis engine. Given a single URL, judge how likely it is to be a phishing or credential-harvesting page based on its structure alone (domain, TLD, subdomain depth, look-alike brand tokens, hyphens, digits, punycode, path keywords, ports, raw IPs, URL shorteners).
Reply ONLY with minified JSON of the shape:
{"classification":"Safe|Suspicious|Malicious","confidence_score":0-100,"explanation":"2-3 sentences","threat_indicators":["..."],"recommendations":["..."]}
Never include markdown fences.`;

function coerceStringArray(value: unknown, max = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => sanitizeText(item, 240))
    .filter(Boolean)
    .slice(0, max);
}

function parseModelJson(raw: string, provider: string): PhishingResult {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  const parsed = JSON.parse(slice) as ModelJson;

  const raw_class = String(parsed.classification ?? "Suspicious");
  const classification =
    raw_class === "Safe" || raw_class === "Malicious" ? raw_class : "Suspicious";
  const confidence = Number(parsed.confidence_score);

  return {
    classification,
    confidenceScore: Number.isFinite(confidence) ? Math.max(0, Math.min(100, confidence)) : 50,
    explanation: sanitizeText(String(parsed.explanation ?? "No explanation returned."), 1200),
    threatIndicators: coerceStringArray(parsed.threat_indicators),
    recommendations: coerceStringArray(parsed.recommendations),
    provider,
    simulated: false,
  };
}

async function chatCompletion(
  endpoint: string,
  headers: Record<string, string>,
  model: string,
  url: string,
): Promise<string> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this URL: ${url}` },
      ],
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error("RATE_LIMIT");
    if (status === 402) throw new Error("CREDITS");
    throw new Error(`Provider request failed with status ${status}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return payload.choices?.[0]?.message?.content ?? "";
}

function openAiProvider(apiKey: string): PhishingProvider {
  return {
    name: "openai",
    async analyze(url) {
      const content = await chatCompletion(
        "https://api.openai.com/v1/chat/completions",
        { authorization: `Bearer ${apiKey}` },
        "gpt-4o-mini",
        url,
      );
      return parseModelJson(content, "OpenAI");
    },
  };
}

function geminiProvider(apiKey: string): PhishingProvider {
  return {
    name: "gemini",
    async analyze(url) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: AbortSignal.timeout(30_000),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: `Analyze this URL: ${url}` }] }],
          }),
        },
      );
      if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      return parseModelJson(
        payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
        "Google Gemini",
      );
    },
  };
}

function lovableProvider(apiKey: string): PhishingProvider {
  return {
    name: "lovable-ai",
    async analyze(url) {
      const content = await chatCompletion(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        { "Lovable-API-Key": apiKey },
        "google/gemini-3.5-flash",
        url,
      );
      return parseModelJson(content, "Lovable AI");
    },
  };
}

const SUSPICIOUS_TOKENS = [
  "login", "verify", "secure", "account", "update", "confirm", "wallet",
  "signin", "banking", "invoice", "password", "recovery", "gift",
];
const LOOKALIKE_BRANDS = [
  "paypal", "apple", "microsoft", "google", "amazon", "netflix", "binance", "meta", "outlook",
];
const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "cutt.ly"];
const RISKY_TLDS = [".zip", ".mov", ".top", ".xyz", ".click", ".country", ".gq", ".tk"];

/** Deterministic structural heuristics — used only when no AI provider is configured. */
export const heuristicProvider: PhishingProvider = {
  name: "heuristic",
  async analyze(url) {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const indicators: string[] = [];
    let score = 0;

    if (parsed.protocol !== "https:") {
      indicators.push("The URL is served over plain HTTP, not HTTPS.");
      score += 20;
    }
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      indicators.push("The host is a raw IP address instead of a domain name.");
      score += 30;
    }
    if (host.startsWith("xn--") || host.includes(".xn--")) {
      indicators.push("The domain uses punycode, a common homograph-attack technique.");
      score += 25;
    }
    const labels = host.split(".");
    if (labels.length > 4) {
      indicators.push(`The hostname has ${labels.length} labels — deep subdomain nesting is a common disguise.`);
      score += 15;
    }
    const hyphens = (host.match(/-/g) ?? []).length;
    if (hyphens >= 2) {
      indicators.push(`The domain contains ${hyphens} hyphens.`);
      score += 10;
    }
    const brand = LOOKALIKE_BRANDS.find((b) => host.includes(b));
    if (brand && !host.endsWith(`${brand}.com`)) {
      indicators.push(`The hostname references the brand "${brand}" without being its official domain.`);
      score += 30;
    }
    if (SHORTENERS.some((s) => host.endsWith(s))) {
      indicators.push("A URL shortener is used, hiding the real destination.");
      score += 20;
    }
    const tld = RISKY_TLDS.find((t) => host.endsWith(t));
    if (tld) {
      indicators.push(`The "${tld}" TLD is frequently abused in phishing campaigns.`);
      score += 15;
    }
    const pathTokens = SUSPICIOUS_TOKENS.filter((t) =>
      `${parsed.pathname}${parsed.search}`.toLowerCase().includes(t),
    );
    if (pathTokens.length > 0) {
      indicators.push(`Credential-related keywords in the path: ${pathTokens.join(", ")}.`);
      score += Math.min(20, pathTokens.length * 8);
    }
    if (parsed.port && !["80", "443"].includes(parsed.port)) {
      indicators.push(`A non-standard port (${parsed.port}) is used.`);
      score += 10;
    }

    const classification = score >= 55 ? "Malicious" : score >= 25 ? "Suspicious" : "Safe";
    if (indicators.length === 0) {
      indicators.push("No structural phishing indicators were detected in this URL.");
    }

    return {
      classification,
      confidenceScore: Math.max(35, Math.min(95, score === 0 ? 78 : 45 + score / 2)),
      explanation:
        `No AI provider is configured, so CyberVault ran a deterministic structural rules engine instead of a language model. ` +
        `${indicators.length} signal(s) were evaluated against the URL's domain, TLD, path and transport. ` +
        `This is a rules-based estimate, not an AI verdict.`,
      threatIndicators: indicators.slice(0, 8),
      recommendations: [
        "Never enter credentials on a page reached from an unsolicited link.",
        "Verify the domain character by character against the brand's official site.",
        "Report the URL to your security team or to Google Safe Browsing if in doubt.",
      ],
      provider: "Rules engine (no AI key configured)",
      simulated: true,
    };
  },
};

export function selectProvider(): PhishingProvider {
  const openAiKey = process.env["OPENAI_API_KEY"];
  if (openAiKey) return openAiProvider(openAiKey);
  const geminiKey = process.env["GEMINI_API_KEY"];
  if (geminiKey) return geminiProvider(geminiKey);
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (lovableKey) return lovableProvider(lovableKey);
  return heuristicProvider;
}

export async function analyzeUrl(url: string): Promise<PhishingResult> {
  const guard = guardOutboundUrl(url);
  if (!guard.ok) throw new Error(guard.reason);

  const provider = selectProvider();
  try {
    return await provider.analyze(guard.url.toString());
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "RATE_LIMIT") {
      throw new Error("The AI provider is rate limited right now. Please retry in a moment.");
    }
    if (message === "CREDITS") {
      throw new Error("AI credits are exhausted. Add credits to continue using AI analysis.");
    }
    console.error("Phishing provider failed", { provider: provider.name });
    return heuristicProvider.analyze(guard.url.toString());
  }
}
