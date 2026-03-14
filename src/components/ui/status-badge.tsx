import { cn } from "@/lib/utils";

type StatusType = "En cours" | "Signé" | "Archivé" | "Annulé" | "Actif" | "Inactif" |
  "Payée" | "Émise" | "En retard" | "Brouillon" | "Haute" | "Moyenne" | "Basse" |
  "En signature" | "En attente pièces" | "Terminé" | "Suspendu" | "Normale" | "Urgente" | "Prospect" | string;

const statusStyles: Record<string, string> = {
  "En cours": "bg-secondary/15 text-secondary border-secondary/30",
  "En signature": "bg-primary/15 text-primary border-primary/30",
  "En attente pièces": "bg-warning/15 text-warning border-warning/30",
  "Terminé": "bg-success/15 text-success border-success/30",
  "Suspendu": "bg-muted text-muted-foreground border-border",
  "Signé": "bg-success/15 text-success border-success/30",
  "Archivé": "bg-muted text-muted-foreground border-border",
  "Annulé": "bg-destructive/15 text-destructive border-destructive/30",
  "Actif": "bg-success/15 text-success border-success/30",
  "Inactif": "bg-muted text-muted-foreground border-border",
  "Prospect": "bg-secondary/15 text-secondary border-secondary/30",
  "Payée": "bg-success/15 text-success border-success/30",
  "Émise": "bg-secondary/15 text-secondary border-secondary/30",
  "En retard": "bg-destructive/15 text-destructive border-destructive/30",
  "Brouillon": "bg-muted text-muted-foreground border-border",
  "Haute": "bg-destructive/15 text-destructive border-destructive/30",
  "Moyenne": "bg-primary/15 text-primary border-primary/30",
  "Normale": "bg-secondary/15 text-secondary border-secondary/30",
  "Basse": "bg-success/15 text-success border-success/30",
  "Urgente": "bg-destructive/15 text-destructive border-destructive/30",
};

const prioriteIcons: Record<string, string> = {
  "Haute": "⬆️",
  "Urgente": "🚨",
  "Normale": "➡️",
  "Basse": "⬇️",
};

export function StatusBadge({ status, showIcon = false }: { status: StatusType; showIcon?: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
      statusStyles[status] || "bg-muted text-muted-foreground border-border"
    )}>
      {showIcon && prioriteIcons[status] && <span>{prioriteIcons[status]}</span>}
      {status}
    </span>
  );
}
