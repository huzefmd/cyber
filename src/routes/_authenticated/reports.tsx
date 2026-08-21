import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { deleteReport, listReports } from "@/lib/reports.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — CyberVault" },
      { name: "description", content: "Download branded PDF security reports generated from your scans." },
      { property: "og:title", content: "Reports — CyberVault" },
      { property: "og:description", content: "Your saved CyberVault PDF security reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listReports);
  const deleteFn = useServerFn(deleteReport);
  const reports = useQuery({ queryKey: ["reports"], queryFn: () => listFn() });

  async function download(path: string) {
    const { data, error } = await supabase.storage
      .from("security-reports")
      .createSignedUrl(path, 60);
    if (error || !data) {
      toast.error("Could not create a download link.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate reports from a scan result on the scanner page.
        </p>
      </div>
      <ul className="space-y-3">
        {(reports.data ?? []).length === 0 && (
          <li className="text-sm text-muted-foreground">No reports generated yet.</li>
        )}
        {(reports.data ?? []).map((report) => (
          <li key={report.id} className="glass-panel flex items-center gap-4 rounded-2xl p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{report.report_name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(report.created_at).toLocaleString()} ·{" "}
                {Math.max(1, Math.round((report.file_size ?? 0) / 1024))} KB
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => download(report.storage_path)}>
              <Download className="size-4" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete report"
              onClick={() =>
                deleteFn({ data: { id: report.id } }).then(() =>
                  queryClient.invalidateQueries({ queryKey: ["reports"] }),
                )
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
