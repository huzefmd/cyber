import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-brand glow-primary">
        <ShieldCheck className="size-5 text-primary-foreground" strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="text-lg font-semibold tracking-tight">
          Cyber<span className="text-gradient">Vault</span>
        </span>
      )}
    </span>
  );
}
