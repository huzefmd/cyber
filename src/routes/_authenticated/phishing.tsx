import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { analyzePhishing } from "@/lib/phishing.functions";
import { listPhishingScans } from "@/lib/dashboard.functions";
import { SeverityBadge } from "@/components/security/severity-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/phishing")({
  head: () => ({
    meta: [
      { title: "Phishing detector — CyberVault" },
      {
        name: "description",
        content: "Classify any URL as Safe, Suspicious or Malicious with AI-backed confidence scoring.",
      },
      { property: "og:title", content: "Phishing detector — CyberVault" },
      { property: "og:description", content: "AI URL analysis with threat indicators and guidance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PhishingPage,
});

function PhishingPage() {
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();
  const analyzeFn = useServerFn(analyzePhishing);
  const listFn = useServerFn(listPhishingScans);

  const history = useQuery({ queryKey: ["phishing"], queryFn: () => listFn() });

  const analyze = useMutation({
    mutationFn: (target: string) => analyzeFn({ data: { url: target } }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["phishing"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      toast.success(`Classified as ${result.classification}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Analysis failed"),
  });

  const result = analyze.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Phishing detector</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Structural and AI analysis of a URL. Never enter credentials on a suspicious page.
        </p>
      </div>

      <form
        className="glass-panel shadow-card flex flex-col gap-3 rounded-2xl p-5 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          analyze.mutate(url);
        }}
      >
        <Input
          value={url}
          maxLength={2048}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://secure-login.example-verify.top/account"
          className="flex-1"
        />
        <Button type="submit" disabled={analyze.isPending || url.trim().length < 4}>
          {analyze.isPending && <Loader2 className="size-4 animate-spin" />}
          Analyze URL
        </Button>
      </form>

      {result && (
        <section className="glass-panel shadow-card space-y-4 rounded-2xl p-6">
          <div className="flex flex-wrap items-center gap-3">
            <SeverityBadge value={result.classification} />
            <span className="text-sm text-muted-foreground">
              {Math.round(result.confidenceScore)}% confidence · {result.provider}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{result.explanation}</p>
          {result.threatIndicators.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold">Threat indicators</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.threatIndicators.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {result.recommendations.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold">Recommended actions</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="glass-panel shadow-card rounded-2xl p-6">
        <h2 className="text-sm font-semibold">Recent analyses</h2>
        <ul className="mt-4 space-y-3">
          {(history.data ?? []).length === 0 && (
            <li className="text-sm text-muted-foreground">No URLs analyzed yet.</li>
          )}
          {(history.data ?? []).map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3">
              <span className="truncate text-sm">{row.url}</span>
              <SeverityBadge value={row.classification} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
