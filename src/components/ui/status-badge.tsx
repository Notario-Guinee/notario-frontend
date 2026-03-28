// ═══════════════════════════════════════════════════════════════
// Composant StatusBadge — Badge coloré d'état/statut
// Affiche le statut d'un dossier, d'une facture ou d'une tâche
// sous forme d'un badge arrondi avec couleur sémantique
// ═══════════════════════════════════════════════════════════════

import { cn } from "@/lib/utils";

type StatusType = "En cours" | "Signé" | "Archivé" | "Annulé" | "Actif" | "Inactif" |
  "Payée" | "Émise" | "En retard" | "Brouillon" | "Haute" | "Moyenne" | "Basse" |
  "En signature" | "En attente pièces" | "Terminé" | "Suspendu" | "Normale" | "Urgente" | "Prospect" | string;

const statusStyles: Record<string, string> = {
  // ── Statuts dossier ──────────────────────────────────────────
  "Brouillon":                "bg-[#9E9E9E]/15 text-[#9E9E9E] border-[#9E9E9E]/30",
  "En Cours":                 "bg-[#2196F3]/15 text-[#2196F3] border-[#2196F3]/30",
  "En Attente":               "bg-[#FF9800]/15 text-[#FF9800] border-[#FF9800]/30",
  "En Attente de Signature":  "bg-[#FFC107]/15 text-[#FFC107] border-[#FFC107]/30",
  "En Attente de Validation": "bg-[#FF5722]/15 text-[#FF5722] border-[#FF5722]/30",
  "Prêt pour Signature":      "bg-[#00BCD4]/15 text-[#00BCD4] border-[#00BCD4]/30",
  "Signé":                    "bg-[#009688]/15 text-[#009688] border-[#009688]/30",
  "Enregistré":               "bg-[#8BC34A]/15 text-[#8BC34A] border-[#8BC34A]/30",
  "Suspendu":                 "bg-[#795548]/15 text-[#795548] border-[#795548]/30",
  "Clôturé":                  "bg-[#4CAF50]/15 text-[#4CAF50] border-[#4CAF50]/30",
  "Annulé":                   "bg-[#F44336]/15 text-[#F44336] border-[#F44336]/30",
  "Archivé":                  "bg-[#607D8B]/15 text-[#607D8B] border-[#607D8B]/30",
  // ── Autres badges (factures, clients, priorités) ─────────────
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
