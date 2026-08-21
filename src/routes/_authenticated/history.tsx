import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listScans } from "@/lib/dashboard.functions";
import { SeverityBadge } from "@/components/security/severity-badge";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Scan history — CyberVault" },
      { name: "description", content: "Every website security scan you have run, with score and risk level." },
      { property: "og:title", content: "Scan history — CyberVault" },
      { property: "og:description", content: "Review past CyberVault website scans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const listFn = useServerFn(listScans);
  const scans = useQuery({ queryKey: ["scans"], queryFn: () => listFn() });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Scan history</h1>
      <ul className="space-y-3">
        {(scans.data ?? []).length === 0 && (
          <li className="text-sm text-muted-foreground">No scans recorded yet.</li>
        )}
        {(scans.data ?? []).map((scan) => (
          <li key={scan.id} className="glass-panel flex items-center justify-between gap-4 rounded-2xl p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{scan.domain}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(scan.created_at).toLocaleString()} · TLS {scan.ssl_status ?? "—"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {scan.risk_level && <SeverityBadge value={scan.risk_level} />}
              <span className="text-sm tabular-nums">{scan.security_score ?? "—"}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
