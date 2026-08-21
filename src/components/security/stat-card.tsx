import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  delay = 0,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn("glass-panel shadow-card rounded-2xl p-5", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        {icon && <span className="text-primary">{icon}</span>}
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </motion.div>
  );
}
