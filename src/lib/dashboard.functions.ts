import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const idSchema = z.object({ id: z.string().uuid() });

export const getOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const [scansRes, phishingRes, sitesRes, recsRes] = await Promise.all([
      supabase
        .from("website_scans")
        .select("id, url, domain, security_score, risk_level, ssl_status, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("phishing_scans")
        .select("id, url, classification, confidence_score, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("saved_websites").select("id", { count: "exact", head: true }),
      supabase
        .from("ai_recommendations")
        .select("id, title, description, priority, is_completed, created_at")
        .eq("is_completed", false)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const scans = scansRes.data ?? [];
    const scores = scans
      .map((s) => s.security_score)
      .filter((s): s is number => typeof s === "number");

    const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0, Minimal: 0 };
    for (const scan of scans) {
      if (scan.risk_level && scan.risk_level in severityCounts) {
        severityCounts[scan.risk_level as keyof typeof severityCounts] += 1;
      }
    }

    return {
      totalScans: scans.length,
      savedWebsites: sitesRes.count ?? 0,
      phishingChecks: (phishingRes.data ?? []).length,
      averageScore: scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null,
      riskDistribution: severityCounts,
      trend: scans
        .slice(0, 12)
        .reverse()
        .map((s) => ({ date: s.created_at, score: s.security_score ?? 0, domain: s.domain })),
      recentScans: scans.slice(0, 8),
      recentPhishing: (phishingRes.data ?? []).slice(0, 6),
      recommendations: recsRes.data ?? [],
    };
  });

export const listScans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("website_scans")
      .select("id, url, domain, security_score, risk_level, ssl_status, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error("Could not load scan history.");
    return data ?? [];
  });

export const getScanDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [scanRes, findingsRes, eventsRes] = await Promise.all([
      supabase.from("website_scans").select("*").eq("id", data.id).maybeSingle(),
      supabase
        .from("security_findings")
        .select("id, category, title, description, severity, evidence, recommendation")
        .eq("scan_id", data.id),
      supabase
        .from("scan_events")
        .select("id, event_type, message, created_at")
        .eq("scan_id", data.id)
        .order("created_at", { ascending: true }),
    ]);

    if (!scanRes.data) throw new Error("Scan not found.");
    return {
      scan: scanRes.data,
      findings: findingsRes.data ?? [],
      events: eventsRes.data ?? [],
    };
  });

export const listPhishingScans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("phishing_scans")
      .select(
        "id, url, classification, confidence_score, ai_explanation, threat_indicators, recommendations, provider, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error("Could not load phishing history.");
    return data ?? [];
  });

export const completeRecommendation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.extend({ completed: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_recommendations")
      .update({ is_completed: data.completed })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error("Could not update the task.");
    return { ok: true };
  });
