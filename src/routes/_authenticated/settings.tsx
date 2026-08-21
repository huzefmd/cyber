import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — CyberVault" },
      { name: "description", content: "Your CyberVault account details and scanning safeguards." },
      { property: "og:title", content: "Settings — CyberVault" },
      { property: "og:description", content: "Manage your CyberVault account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <section className="glass-panel shadow-card space-y-2 rounded-2xl p-6 text-sm">
        <p className="text-muted-foreground">Signed in as</p>
        <p className="font-medium">{user?.email ?? "—"}</p>
      </section>
      <section className="glass-panel shadow-card space-y-2 rounded-2xl p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Scanning safeguards</p>
        <p>Scans are read-only GET requests with timeouts, size caps and redirect limits.</p>
        <p>Private, loopback and cloud-metadata addresses are blocked to prevent internal probing.</p>
        <p>Only scan properties you are authorized to test.</p>
      </section>
    </div>
  );
}
