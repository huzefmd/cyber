import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { credentialsSchema, registerSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    mode: z.enum(["login", "register"]).optional(),
    redirect: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — CyberVault" },
      {
        name: "description",
        content:
          "Sign in or create a CyberVault account to scan websites and detect phishing URLs.",
      },
      { property: "og:title", content: "Sign in — CyberVault" },
      { property: "og:description", content: "Access your CyberVault security dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [pending, setPending] = useState(false);

  const destination = safePath(search.redirect);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      if (mode === "register") {
        const parsed = registerSchema.safeParse({ email, password, fullName });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Check your details");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            data: { full_name: parsed.data.fullName },
          },
        });
        if (error) throw error;
        // No email verification step — if signUp returned no session (project
        // has email confirmation enabled), immediately sign in with the same
        // credentials so the user lands on the dashboard.
        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: parsed.data.email,
            password: parsed.data.password,
          });
          if (signInError) throw signInError;
        }
        navigate({ to: destination });
      } else {
        const parsed = credentialsSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Check your details");
          return;
        }
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        navigate({ to: destination });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setPending(false);
    }
  }

  async function handleGoogle() {
    setPending(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed. Please try again.");
        return;
      }
      if (result.redirected) return;
      navigate({ to: destination });
    } finally {
      setPending(false);
    }
  }

  async function handleReset() {
    const parsed = credentialsSchema.shape.email.safeParse(email);
    if (!parsed.success) {
      toast.error("Enter your email address first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  }

  return (
    <div className="grid min-h-screen grid-backdrop place-items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass-panel shadow-card w-full max-w-md rounded-2xl p-8"
      >
        <Link to="/" className="inline-block">
          <Logo />
        </Link>
        <h1 className="mt-7 text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Sign in to CyberVault" : "Create your CyberVault account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login"
            ? "Continue to your security dashboard."
            : "Start scanning your web properties in under a minute."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1">
          {(["login", "register"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                mode === value
                  ? "bg-background text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "login" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                maxLength={80}
                autoComplete="name"
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Ada Lovelace"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              maxLength={255}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              maxLength={128}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="secondary" className="w-full" onClick={handleGoogle} disabled={pending}>
          Continue with Google
        </Button>

        {mode === "login" && (
          <button
            type="button"
            onClick={handleReset}
            className="mt-5 block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot your password?
          </button>
        )}
      </motion.div>
    </div>
  );
}
