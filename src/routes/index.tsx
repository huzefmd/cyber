import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Lock,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CyberVault — AI Website Security & Phishing Detection" },
      {
        name: "description",
        content:
          "CyberVault scans websites for TLS, header and cookie weaknesses, detects phishing URLs with AI, and turns findings into prioritized fixes and PDF reports.",
      },
      { property: "og:title", content: "CyberVault — AI Website Security Platform" },
      {
        property: "og:description",
        content:
          "Continuous website security scanning, AI phishing detection and executive-ready PDF reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Radar,
    title: "Website security scanner",
    body: "Live, read-only probes check TLS reachability, security headers, cookie flags, redirect chains and exposed technology banners — then score the result out of 100.",
  },
  {
    icon: Lock,
    title: "SSL & transport audit",
    body: "Verify that HTTPS terminates cleanly, HSTS is enforced and no plain-HTTP entry point is left open to downgrade attacks.",
  },
  {
    icon: ShieldAlert,
    title: "AI phishing detection",
    body: "Classify any URL as Safe, Suspicious or Malicious with a confidence score, threat indicators and a plain-language explanation.",
  },
  {
    icon: Sparkles,
    title: "Prioritized remediation",
    body: "Every scan produces a ranked task list so teams fix the highest-impact issues first instead of guessing.",
  },
  {
    icon: FileText,
    title: "PDF reporting",
    body: "Export branded, multi-page security reports and keep them in private, owner-only storage for audits and clients.",
  },
  {
    icon: BarChart3,
    title: "Posture analytics",
    body: "Track average score, risk distribution and score trends across every property you monitor.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen grid-backdrop">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth" search={{ mode: "register" }}>
              Get started
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pt-14 pb-24 text-center sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3.5 py-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Enterprise-grade security intelligence
          </span>
          <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            Know exactly how exposed
            <br className="hidden sm:block" /> your <span className="text-gradient">web surface</span> is.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            CyberVault runs real security probes against your sites, detects phishing URLs with AI,
            and turns everything into a score, a fix list and a report you can hand to a client.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="glow-primary">
              <Link to="/auth" search={{ mode: "register" }}>
                Start scanning free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </motion.div>

        <div className="mt-20 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="glass-panel shadow-card rounded-2xl p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <feature.icon className="size-5" />
              </span>
              <h2 className="mt-4 text-base font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Logo compact className="sm:hidden" />
          <p>© {new Date().getFullYear()} CyberVault. Scans are read-only and rate-limited.</p>
          <p>Only scan properties you are authorized to test.</p>
        </div>
      </footer>
    </div>
  );
}
