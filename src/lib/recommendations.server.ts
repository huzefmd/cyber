import type { RecommendationPriority, ScanResult, Severity } from "@/types/security";

export interface GeneratedRecommendation {
  title: string;
  description: string;
  priority: RecommendationPriority;
}

const PRIORITY_BY_SEVERITY: Record<Severity, RecommendationPriority | null> = {
  Critical: "Critical",
  High: "High",
  Medium: "Medium",
  Low: "Low",
  Informational: null,
};

/**
 * Turns actionable findings into prioritised remediation tasks.
 * Deterministic by design so the task list is stable across identical scans.
 */
export function buildRecommendations(result: ScanResult): GeneratedRecommendation[] {
  if (result.simulated) return [];

  const recommendations: GeneratedRecommendation[] = [];

  for (const finding of result.findings) {
    const priority = PRIORITY_BY_SEVERITY[finding.severity];
    if (!priority || !finding.recommendation) continue;
    recommendations.push({
      title: `Fix: ${finding.title}`,
      description: `${finding.recommendation} (Detected on ${result.domain} during the ${new Date().toLocaleDateString()} scan.)`,
      priority,
    });
  }

  if (result.securityScore < 70) {
    recommendations.unshift({
      title: `Raise the security posture of ${result.domain}`,
      description: `This scan scored ${result.securityScore}/100 (${result.riskLevel} risk). Start with the transport-security and header findings below — they usually deliver the largest score improvement for the least effort.`,
      priority: result.securityScore < 45 ? "Critical" : "High",
    });
  }

  const order: RecommendationPriority[] = ["Critical", "High", "Medium", "Low"];
  return recommendations
    .sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority))
    .slice(0, 12);
}
