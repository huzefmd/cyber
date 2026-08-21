import { cn } from "@/lib/utils";
import type { RiskLevel, Severity } from "@/types/security";

const TONE: Record<string, string> = {
  Critical: "border-destructive/40 bg-destructive/15 text-destructive",
  High: "border-warning/40 bg-warning/15 text-warning",
  Medium: "border-chart-4/40 bg-chart-4/15 text-chart-4",
  Low: "border-primary/40 bg-primary/15 text-primary",
  Minimal: "border-success/40 bg-success/15 text-success",
  Informational: "border-border bg-muted/40 text-muted-foreground",
  Safe: "border-success/40 bg-success/15 text-success",
  Suspicious: "border-warning/40 bg-warning/15 text-warning",
  Malicious: "border-destructive/40 bg-destructive/15 text-destructive",
};

export function SeverityBadge({
  value,
  className,
}: {
  value: Severity | RiskLevel | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE[value] ?? TONE["Informational"],
        className,
      )}
    >
      {value}
    </span>
  );
}
