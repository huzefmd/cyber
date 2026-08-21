import { safeFetch, guardOutboundUrl } from "./security.server";
import {
  riskFromScore,
  SEVERITY_WEIGHT,
  type ScanFinding,
  type ScanResult,
} from "@/types/security";

/**
 * Scanner provider adapter. `liveScanner` performs real, read-only HTTP checks.
 * `mockScanner` is a clearly-labelled simulation used only when the live probe
 * cannot reach the target — its findings are never presented as real results.
 */
export interface ScannerProvider {
  name: string;
  scan(url: string): Promise<ScanResult>;
}

interface HeaderRule {
  header: string;
  title: string;
  category: string;
  severity: ScanFinding["severity"];
  description: string;
  recommendation: string;
}

const HEADER_RULES: HeaderRule[] = [
  {
    header: "content-security-policy",
    title: "Content Security Policy missing",
    category: "Security Headers",
    severity: "High",
    description:
      "No Content-Security-Policy header was returned, so the browser has no allow-list for scripts, styles or frames.",
    recommendation:
      "Add a Content-Security-Policy header, starting in report-only mode, with an explicit script-src and object-src 'none'.",
  },
  {
    header: "strict-transport-security",
    title: "HSTS not enforced",
    category: "Transport Security",
    severity: "High",
    description:
      "Strict-Transport-Security is absent, so browsers may still attempt an insecure first connection.",
    recommendation:
      "Send Strict-Transport-Security: max-age=31536000; includeSubDomains once HTTPS is stable across all subdomains.",
  },
  {
    header: "x-frame-options",
    title: "Clickjacking protection missing",
    category: "Security Headers",
    severity: "Medium",
    description:
      "Neither X-Frame-Options nor a CSP frame-ancestors directive was detected, so the page can be framed by third parties.",
    recommendation: "Send X-Frame-Options: DENY or a CSP frame-ancestors 'self' directive.",
  },
  {
    header: "referrer-policy",
    title: "Referrer-Policy not set",
    category: "Privacy",
    severity: "Low",
    description: "Without a Referrer-Policy, full URLs may leak to third-party destinations.",
    recommendation: "Send Referrer-Policy: strict-origin-when-cross-origin.",
  },
  {
    header: "permissions-policy",
    title: "Permissions-Policy not set",
    category: "Security Headers",
    severity: "Low",
    description:
      "No Permissions-Policy header was found, so powerful browser features are not explicitly restricted.",
    recommendation:
      "Send a Permissions-Policy header disabling unused features, e.g. camera=(), microphone=(), geolocation=().",
  },
  {
    header: "x-content-type-options",
    title: "MIME sniffing not disabled",
    category: "Security Headers",
    severity: "Low",
    description: "X-Content-Type-Options is missing, allowing browsers to MIME-sniff responses.",
    recommendation: "Send X-Content-Type-Options: nosniff.",
  },
];

function scoreFindings(findings: ScanFinding[]): number {
  const penalty = findings.reduce((total, f) => total + SEVERITY_WEIGHT[f.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

async function probePath(origin: string, path: string): Promise<boolean> {
  try {
    const result = await safeFetch(`${origin}${path}`);
    return result.status >= 200 && result.status < 300;
  } catch {
    return false;
  }
}

export const liveScanner: ScannerProvider = {
  name: "cybervault-http-probe",
  async scan(rawUrl: string): Promise<ScanResult> {
    const guard = guardOutboundUrl(rawUrl);
    if (!guard.ok) throw new Error(guard.reason);

    const target = guard.url;
    const findings: ScanFinding[] = [];
    const events: ScanResult["events"] = [
      { eventType: "started", message: `Scan started for ${target.hostname}` },
    ];

    const httpsUrl = `https://${target.host}${target.pathname}${target.search}`;
    let sslStatus = "Unknown";
    let response: Awaited<ReturnType<typeof safeFetch>> | null = null;

    try {
      response = await safeFetch(httpsUrl);
      sslStatus = "Valid";
      events.push({ eventType: "tls", message: "HTTPS connection established and certificate accepted" });
    } catch (error) {
      sslStatus = "Unreachable over HTTPS";
      findings.push({
        category: "Transport Security",
        title: "HTTPS connection failed",
        description:
          "The scanner could not complete a TLS connection to this host. This usually means HTTPS is unavailable, the certificate is invalid or the host blocked the request.",
        severity: "Critical",
        evidence: error instanceof Error ? error.message.slice(0, 300) : "Connection failed",
        recommendation:
          "Serve the site over HTTPS with a valid, unexpired certificate that matches the hostname.",
      });
      events.push({ eventType: "tls", message: "HTTPS probe failed" });
    }

    if (target.protocol === "http:") {
      findings.push({
        category: "Transport Security",
        title: "Site submitted over plain HTTP",
        description: "The provided URL used http://, which transmits traffic without encryption.",
        severity: "High",
        evidence: rawUrl,
        recommendation: "Redirect all HTTP traffic to HTTPS with a 301 response.",
      });
    }

    if (response) {
      const headers = response.headers;
      const csp = headers.get("content-security-policy") ?? "";
      events.push({
        eventType: "headers",
        message: `Response received with status ${response.status}`,
      });

      for (const rule of HEADER_RULES) {
        const value = headers.get(rule.header);
        if (value) {
          findings.push({
            category: rule.category,
            title: `${rule.header} present`,
            description: `The ${rule.header} header is configured.`,
            severity: "Informational",
            evidence: value.slice(0, 300),
            recommendation: "Review the directive values periodically as the site evolves.",
          });
          continue;
        }
        if (rule.header === "x-frame-options" && /frame-ancestors/i.test(csp)) {
          continue;
        }
        findings.push({
          category: rule.category,
          title: rule.title,
          description: rule.description,
          severity: rule.severity,
          evidence: `No ${rule.header} header in the response from ${response.finalUrl}`,
          recommendation: rule.recommendation,
        });
      }

      const setCookie = headers.get("set-cookie");
      if (setCookie) {
        const insecure: string[] = [];
        if (!/;\s*secure/i.test(setCookie)) insecure.push("Secure");
        if (!/;\s*httponly/i.test(setCookie)) insecure.push("HttpOnly");
        if (!/;\s*samesite/i.test(setCookie)) insecure.push("SameSite");
        if (insecure.length > 0) {
          findings.push({
            category: "Cookies",
            title: `Cookie flags missing: ${insecure.join(", ")}`,
            description:
              "At least one cookie was set without the full set of protective attributes, increasing exposure to theft or cross-site use.",
            severity: "Medium",
            evidence: setCookie.slice(0, 250),
            recommendation: "Set Secure, HttpOnly and SameSite=Lax (or Strict) on session cookies.",
          });
        }
      }

      const server = headers.get("server");
      const poweredBy = headers.get("x-powered-by");
      if (poweredBy) {
        findings.push({
          category: "Information Disclosure",
          title: "Technology stack disclosed",
          description: "The X-Powered-By header reveals server-side technology and version details.",
          severity: "Low",
          evidence: poweredBy.slice(0, 200),
          recommendation: "Remove or mask the X-Powered-By header at the web server or CDN layer.",
        });
      }
      findings.push({
        category: "Technology Detection",
        title: "Detected infrastructure",
        description: "Technology signals inferred from response headers.",
        severity: "Informational",
        evidence: [
          server ? `server: ${server}` : null,
          poweredBy ? `x-powered-by: ${poweredBy}` : null,
          headers.get("cf-ray") ? "Cloudflare edge detected" : null,
          `content-type: ${headers.get("content-type") ?? "unknown"}`,
        ]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 300),
        recommendation: "Keep detected components patched and remove unnecessary version banners.",
      });

      if (response.redirects.length > 0) {
        findings.push({
          category: "Transport Security",
          title: "Redirect chain observed",
          description: "The request was redirected before reaching the final response.",
          severity: "Informational",
          evidence: response.redirects.join(" → ").slice(0, 300),
          recommendation: "Keep redirect chains short and always terminate on an HTTPS origin.",
        });
      }
    }

    const origin = `https://${target.host}`;
    const [hasSecurityTxt, hasRobots] = await Promise.all([
      probePath(origin, "/.well-known/security.txt"),
      probePath(origin, "/robots.txt"),
    ]);
    events.push({ eventType: "discovery", message: "Well-known files checked" });

    findings.push(
      hasSecurityTxt
        ? {
            category: "Disclosure Policy",
            title: "security.txt published",
            description: "A security.txt file is available for vulnerability reporting.",
            severity: "Informational",
            evidence: `${origin}/.well-known/security.txt`,
            recommendation: "Keep the contact address and expiry date current.",
          }
        : {
            category: "Disclosure Policy",
            title: "No security.txt found",
            description:
              "Researchers have no documented channel to report vulnerabilities for this domain.",
            severity: "Low",
            evidence: `${origin}/.well-known/security.txt returned no successful response`,
            recommendation: "Publish /.well-known/security.txt with a contact and policy URL.",
          },
    );

    findings.push({
      category: "Crawler Policy",
      title: hasRobots ? "robots.txt present" : "No robots.txt found",
      description: hasRobots
        ? "A robots.txt file is served for this origin."
        : "No robots.txt was served; crawler behaviour is unconstrained.",
      severity: "Informational",
      evidence: `${origin}/robots.txt`,
      recommendation: hasRobots
        ? "Ensure robots.txt does not enumerate sensitive paths."
        : "Publish robots.txt to guide crawlers, without listing sensitive paths.",
    });

    findings.push({
      category: "DNS",
      title: "Hostname resolved by the edge network",
      description: "Basic hostname information collected during the scan.",
      severity: "Informational",
      evidence: `host: ${target.hostname} · port: ${target.port || (target.protocol === "https:" ? "443" : "80")}`,
      recommendation: "Enable DNSSEC and CAA records with your DNS provider where available.",
    });

    const securityScore = scoreFindings(findings);
    events.push({ eventType: "completed", message: `Scan completed with score ${securityScore}` });

    return {
      url: target.toString(),
      domain: target.hostname,
      securityScore,
      riskLevel: riskFromScore(securityScore),
      sslStatus,
      findings,
      events,
      simulated: false,
    };
  },
};

export const mockScanner: ScannerProvider = {
  name: "cybervault-simulated",
  async scan(rawUrl: string): Promise<ScanResult> {
    const domain = (() => {
      try {
        return new URL(rawUrl).hostname;
      } catch {
        return rawUrl;
      }
    })();

    const findings: ScanFinding[] = [
      {
        category: "Simulation",
        title: "Simulated result — target unreachable",
        description:
          "The live probe could not reach this host, so CyberVault returned a simulated placeholder. These are not real security findings for this website.",
        severity: "Informational",
        evidence: `Simulated scan for ${domain}`,
        recommendation: "Re-run the scan once the host is reachable from the public internet.",
      },
    ];

    return {
      url: rawUrl,
      domain,
      securityScore: 0,
      riskLevel: "Minimal",
      sslStatus: "Not measured (simulated)",
      findings,
      events: [{ eventType: "simulated", message: "Simulated scan produced placeholder output" }],
      simulated: true,
    };
  },
};

export async function runScan(url: string): Promise<ScanResult> {
  try {
    return await liveScanner.scan(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    if (/cannot be scanned|not allowed|invalid|Only /i.test(message)) {
      throw error;
    }
    return mockScanner.scan(url);
  }
}
