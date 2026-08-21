import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function toneFor(score: number): string {
  if (score >= 90) return "var(--success)";
  if (score >= 75) return "var(--primary)";
  if (score >= 60) return "var(--chart-4)";
  if (score >= 40) return "var(--warning)";
  return "var(--destructive)";
}

export function ScoreRing({
  score,
  size = 168,
  label = "Security score",
  className,
}: {
  score: number;
  size?: number;
  label?: string;
  className?: string;
}) {
  const stroke = size / 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  const color = toneFor(score);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke="var(--border)"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 10px color-mix(in oklab, ${color} 55%, transparent))` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tabular-nums" style={{ color }}>
          {Math.round(score)}
        </span>
        <span className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
