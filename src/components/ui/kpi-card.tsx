// ═══════════════════════════════════════════════════════════════
// Composant KpiCard — Carte d'indicateur clé de performance (KPI)
// Affiche une valeur principale, un titre, une tendance (+/-%)
// et une icône colorée selon la catégorie (bleu, vert, rouge…)
// ═══════════════════════════════════════════════════════════════

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: React.ElementType;
  accentColor?: "blue" | "green" | "red" | "teal" | "amber" | "purple" | "rose";
}

const iconBgMap: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-rose-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  purple: "bg-purple-500",
  rose: "bg-rose-500",
};

const cardBgMap: Record<string, string> = {
  blue: "bg-blue-50 dark:bg-blue-900/20",
  green: "bg-emerald-50 dark:bg-emerald-900/20",
  red: "bg-rose-50 dark:bg-rose-900/20",
  teal: "bg-teal-50 dark:bg-teal-900/20",
  amber: "bg-amber-50 dark:bg-amber-900/20",
  purple: "bg-purple-50 dark:bg-purple-900/20",
  rose: "bg-rose-50 dark:bg-rose-900/20",
};

const trendColors = {
  positive: "text-success",
  negative: "text-destructive",
};

export function KpiCard({ title, value, subtitle, trend, icon: Icon, accentColor = "blue" }: KpiCardProps) {
  return (
    <div className={cn("rounded-xl border border-border p-5 flex items-center gap-4", cardBgMap[accentColor])}>
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white", iconBgMap[accentColor])}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
        {(subtitle || trend !== undefined) && (
          <div className="mt-0.5 flex items-center gap-2">
            {trend !== undefined && (
              <span className={cn("flex items-center gap-0.5 text-xs font-medium", trend >= 0 ? trendColors.positive : trendColors.negative)}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend >= 0 ? "+" : ""}{trend}%
              </span>
            )}
            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
