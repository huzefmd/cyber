import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Radar,
  Settings,
  ShieldAlert,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/scanner", label: "Website scanner", icon: Radar },
  { to: "/phishing", label: "Phishing detector", icon: ShieldAlert },
  { to: "/websites", label: "Monitored sites", icon: Globe },
  { to: "/history", label: "Scan history", icon: Activity },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-primary/12 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <item.icon className={cn("size-4", active && "text-primary")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen grid-backdrop">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl lg:flex">
        <div className="px-5 py-6">
          <Link to="/dashboard">
            <Logo />
          </Link>
        </div>
        {nav}
        <div className="p-3">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-6">
                <Logo />
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="size-4" />
                </Button>
              </div>
              {nav}
              <div className="p-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={handleSignOut}
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
          <p className="text-sm text-muted-foreground">
            {NAV.find((item) => item.to === pathname)?.label ?? "CyberVault"}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link to="/scanner">New scan</Link>
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
