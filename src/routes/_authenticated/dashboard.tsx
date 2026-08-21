import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Activity, Globe, Radar, ShieldAlert } from "lucide-react";
import { getOverview } from "@/lib/dashboard.functions";
import { StatCard } from "@/components/security/stat-card";
import { ScoreRing } from "@/components/security/score-ring";
import { SeverityBadge } from "@/components/security/severity-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Security overview — CyberVault" },
      {
        name: "description",
        content: "Average security score, risk distribution and recent scan activity across your monitored web properties.",
      },
      { property: "og:title", content: "Security overview — CyberVault" },
      { property: "og:description", content: "Your live web security posture at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchOverview = useServerFn(getOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: () => fetchOverview(),
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const maxRisk = Math.max(1, ...Object.values(data.riskDistribution));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Security overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aggregated posture across every scan you have run.
          </p>
        </div>
        <Button asChild>
          <Link to="/scanner">Run a scan</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total scans"
          value={data.totalScans}
          icon={<Radar className="size-4" />}
          hint="Last 50 scans considered"
        />
        <StatCard
          label="Average score"
          value={data.averageScore ?? "—"}
          delay={0.05}
          icon={<Activity className="size-4" />}
          hint="Across completed scans"
        />
        <StatCard
          label="Monitored sites"
          value={data.savedWebsites}
          delay={0.1}
          icon={<Globe className="size-4" />}
          hint="Saved properties"
        />
        <StatCard
          label="Phishing checks"
          value={data.phishingChecks}
          delay={0.15}
          icon={<ShieldAlert className="size-4" />}
          hint="Recent URL analyses"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel shadow-card flex flex-col items-center justify-center rounded-2xl p-8"
        >
          <ScoreRing score={data.averageScore ?? 0} label="Average" />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {data.averageScore == null
              ? "Run your first scan to establish a baseline."
              : "Composite score across all scanned properties."}
          </p>
        </motion.section>

        <section className="glass-panel shadow-card rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold">Risk distribution</h2>
          <div className="mt-5 space-y-3">
            {Object.entries(data.riskDistribution).map(([level, count]) => (
              <div key={level} className="flex items-center gap-3">
                <span className="w-20 text-xs text-muted-foreground">{level}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxRisk) * 100}%` }}
                    transition={{ duration: 0.7 }}
                    className="h-full rounded-full bg-gradient-brand"
                  />
                </div>
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                  {count}
                </span>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-sm font-semibold">Score trend</h2>
          <div className="mt-4 flex h-28 items-end gap-1.5">
            {data.trend.length === 0 && (
              <p className="text-sm text-muted-foreground">No scans yet.</p>
            )}
            {data.trend.map((point, index) => (
              <motion.div
                key={`${point.date}-${index}`}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(6, point.score)}%` }}
                transition={{ duration: 0.5, delay: index * 0.03 }}
                title={`${point.domain}: ${point.score}`}
                className="flex-1 rounded-t bg-primary/70"
              />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-panel shadow-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent scans</h2>
            <Link to="/history" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {data.recentScans.length === 0 && (
              <li className="text-sm text-muted-foreground">Nothing scanned yet.</li>
            )}
            {data.recentScans.map((scan) => (
              <li key={scan.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{scan.domain}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(scan.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {scan.risk_level && <SeverityBadge value={scan.risk_level} />}
                  <span className="w-8 text-right text-sm tabular-nums">
                    {scan.security_score ?? "—"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-panel shadow-card rounded-2xl p-6">
          <h2 className="text-sm font-semibold">Top remediation tasks</h2>
          <ul className="mt-4 space-y-3">
            {data.recommendations.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No open tasks — run a scan to generate recommendations.
              </li>
            )}
            {data.recommendations.map((rec) => (
              <li key={rec.id} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{rec.title}</p>
                  <SeverityBadge value={rec.priority} />
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {rec.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
