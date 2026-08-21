export const SEVERITIES = ["Critical", "High", "Medium", "Low", "Informational"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const RISK_LEVELS = ["Critical", "High", "Medium", "Low", "Minimal"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const SCAN_STATUSES = ["queued", "running", "completed", "failed", "cancelled"] as const;
export type ScanStatus = (typeof SCAN_STATUSES)[number];

export type PhishingClassification = "Safe" | "Suspicious" | "Malicious";
export type RecommendationPriority = "Critical" | "High" | "Medium" | "Low";

export interface ScanFinding {
  category: string;
  title: string;
  description: string;
  severity: Severity;
  evidence: string | null;
  recommendation: string | null;
}

export interface ScanResult {
  url: string;
  domain: string;
  securityScore: number;
  riskLevel: RiskLevel;
  sslStatus: string;
  findings: ScanFinding[];
  events: { eventType: string; message: string }[];
  simulated: boolean;
}

export interface PhishingResult {
  classification: PhishingClassification;
  confidenceScore: number;
  explanation: string;
  threatIndicators: string[];
  recommendations: string[];
  provider: string;
  simulated: boolean;
}

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  Critical: 25,
  High: 15,
  Medium: 8,
  Low: 3,
  Informational: 0,
};

export function riskFromScore(score: number): RiskLevel {
  if (score < 40) return "Critical";
  if (score < 60) return "High";
  if (score < 75) return "Medium";
  if (score < 90) return "Low";
  return "Minimal";
}
