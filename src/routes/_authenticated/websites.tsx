import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { addWebsite, listWebsites, removeWebsite, toggleMonitoring } from "@/lib/websites.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/websites")({
  head: () => ({
    meta: [
      { title: "Monitored sites — CyberVault" },
      { name: "description", content: "Save web properties and keep their security posture under review." },
      { property: "og:title", content: "Monitored sites — CyberVault" },
      { property: "og:description", content: "Manage the websites CyberVault watches for you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WebsitesPage,
});

function WebsitesPage() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();
  const listFn = useServerFn(listWebsites);
  const addFn = useServerFn(addWebsite);
  const removeFn = useServerFn(removeWebsite);
  const toggleFn = useServerFn(toggleMonitoring);

  const sites = useQuery({ queryKey: ["websites"], queryFn: () => listFn() });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["websites"] });

  const add = useMutation({
    mutationFn: () => addFn({ data: { name, url, monitoringEnabled: true } }),
    onSuccess: () => {
      setName("");
      setUrl("");
      invalidate();
      toast.success("Website saved");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Monitored sites</h1>
        <p className="mt-1 text-sm text-muted-foreground">Properties you own or manage.</p>
      </div>

      <form
        className="glass-panel shadow-card grid gap-3 rounded-2xl p-5 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          add.mutate();
        }}
      >
        <Input value={name} maxLength={80} placeholder="Marketing site" onChange={(e) => setName(e.target.value)} />
        <Input value={url} maxLength={2048} placeholder="example.com" onChange={(e) => setUrl(e.target.value)} />
        <Button type="submit" disabled={add.isPending || !name || !url}>
          Add website
        </Button>
      </form>

      <ul className="space-y-3">
        {(sites.data ?? []).length === 0 && (
          <li className="text-sm text-muted-foreground">No websites saved yet.</li>
        )}
        {(sites.data ?? []).map((site) => (
          <li key={site.id} className="glass-panel flex items-center gap-4 rounded-2xl p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{site.name}</p>
              <p className="truncate text-xs text-muted-foreground">{site.url}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              Monitoring
              <Switch
                checked={site.monitoring_enabled}
                onCheckedChange={(checked) =>
                  toggleFn({ data: { id: site.id, enabled: checked } }).then(invalidate)
                }
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove website"
              onClick={() => removeFn({ data: { id: site.id } }).then(invalidate)}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
