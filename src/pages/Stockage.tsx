// ═══════════════════════════════════════════════════════════════
// Page Stockage — Gestion de l'espace de stockage du cabinet
// Affiche la répartition par type de fichier, l'utilisation
// totale et les alertes de capacité via un graphique camembert
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HardDrive, FileText, AlertTriangle, Send } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

/** Fichiers les plus volumineux du cabinet */
const fichiers = [
  { nom: "Titre foncier Soumah.pdf",  taille: "6.2 Mo", date: "2025-12-10" },
  { nom: "Statuts SCI Palmiers.pdf",  taille: "4.8 Mo", date: "2026-02-28" },
  { nom: "Plan cadastral.png",         taille: "3.3 Mo", date: "2026-03-05" },
  { nom: "Acte vente Camara.pdf",     taille: "2.4 Mo", date: "2026-02-15" },
  { nom: "Factures export.zip",        taille: "1.8 Mo", date: "2026-03-01" },
];

export default function Stockage() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const isEN = lang === "EN";

  const categories = [
    { labelFR: "Actes notariés",      labelEN: t("storage.cat.acts"),     go: 9.3, pct: 60, color: "hsl(211 55% 48%)" },
    { labelFR: "Archives numériques", labelEN: t("storage.cat.archives"), go: 4.0, pct: 26, color: "hsl(160 60% 42%)" },
    { labelFR: "Documents clients",   labelEN: t("storage.cat.clients"),  go: 1.3, pct:  8, color: "hsl(258 60% 56%)" },
    { labelFR: "Factures",            labelEN: t("storage.cat.invoices"), go: 0.9, pct:  6, color: "hsl(38 92% 50%)"  },
  ];

  const pieData = [
    { name: isEN ? t("storage.pie.docs")     : "Documents", value: 8.2, color: "hsl(211 55% 48%)" },
    { name: isEN ? t("storage.pie.archives") : "Archives",  value: 4.1, color: "hsl(200 67% 50%)" },
    { name: isEN ? t("storage.pie.photos")   : "Photos",    value: 2.3, color: "hsl(87 52% 49%)"  },
    { name: isEN ? t("storage.pie.other")    : "Autres",    value: 0.9, color: "hsl(220 24% 64%)" },
  ];

  const used = 15.5, total = 20;
  const pct = Math.round(used / total * 100);
  const remaining = total - used;
  // Alerte critique si moins de 2 Go disponibles
  const lowStorage = remaining <= 2;
  const criticalStorage = remaining <= 0.5;

  // Couleur de la barre selon le seuil d'utilisation
  const barColor = pct > 90
    ? "hsl(0 72% 51%)"
    : pct > 70
      ? "hsl(38 92% 50%)"
      : "hsl(87 52% 49%)";

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-foreground">{t("storage.title")}</h1>

      {/* ── Bannière d'alerte critique ── */}
      {lowStorage && (
        <div className={cn(
          "flex items-center gap-3 rounded-xl border p-4",
          criticalStorage
            ? "border-destructive/30 bg-destructive/10"
            : "border-warning/30 bg-warning/10"
        )}>
          <AlertTriangle className={cn("h-5 w-5 shrink-0", criticalStorage ? "text-destructive" : "text-warning")} />
          <div>
            <p className={cn("text-sm font-semibold", criticalStorage ? "text-destructive" : "text-warning")}>
              {criticalStorage ? t("storage.critical") : t("storage.low")}
            </p>
            <p className={cn("text-xs", criticalStorage ? "text-destructive/80" : "text-warning/80")}>
              {isEN
                ? `Only ${remaining.toFixed(1)} GB remaining. Contact the administrator to extend your storage.`
                : `Il ne reste que ${remaining.toFixed(1)} Go. Contactez l'administrateur pour étendre votre espace.`}
            </p>
          </div>
        </div>
      )}

      {/* ── Grille principale : résumé + catégories ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Widget résumé avec barre de progression */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-heading text-sm font-semibold text-foreground">{t("storage.globalUsage")}</h2>
          </div>

          {/* Valeur principale */}
          <p className="font-heading text-3xl font-bold text-foreground mb-1">
            {used} Go <span className="text-base font-normal text-muted-foreground">/ {total} Go</span>
          </p>
          <p className="text-xs text-muted-foreground mb-4">{t("storage.used")}</p>

          {/* Barre de progression horizontale */}
          <div className="h-4 w-full rounded-full bg-muted overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: barColor }}
            />
          </div>

          {/* Détail chiffré */}
          <p className="text-xs text-muted-foreground">
            {used} Go {isEN ? t("storage.usedOf") : "utilisés sur"} {total} Go {isEN ? t("storage.allocated") : "alloués"}
          </p>
          <p className={cn("text-xs mt-0.5 font-medium", pct > 90 ? "text-destructive" : "text-warning")}>
            {remaining.toFixed(1)} Go {isEN ? t("storage.available") : "disponibles"} — {pct}% {isEN ? "used" : "utilisé"}
          </p>

          {/* Bouton de demande d'extension */}
          <button
            onClick={() => navigate('/stockage')}
            className={cn(
              "mt-5 w-full rounded-lg border px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-2",
              pct > 90
                ? "border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "border-warning/50 bg-warning/10 text-warning hover:bg-warning/20"
            )}
          >
            <Send className="h-3.5 w-3.5" />
            {pct > 90 ? t("storage.urgentExtension") : t("storage.requestExtension")}
          </button>
        </div>

        {/* Détail par catégorie avec barres individuelles */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-5">{t("storage.categoryBreakdown")}</h2>
          <div className="space-y-5">
            {categories.map((cat) => (
              <div key={cat.labelFR}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{isEN ? cat.labelEN : cat.labelFR}</span>
                  <span className="text-muted-foreground font-medium">{cat.go} Go — {cat.pct}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.pct}%`, background: cat.color  }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Ligne de total */}
          <div className="mt-5 border-t border-border pt-4 flex justify-between">
            <span className="text-sm font-semibold text-foreground">{t("storage.total")}</span>
            <span className="text-sm font-bold text-foreground">{used} Go / {total} Go</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {t("storage.lastUpdate")} : {new Date().toLocaleDateString(isEN ? "en-GB" : "fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {/* ── Répartition par type de fichier (camembert) + fichiers volumineux ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("storage.fileTypeBreakdown")}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map(e => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                {d.name} ({d.value} Go)
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("storage.largestFiles")}</h2>
          <div className="space-y-3">
            {fichiers.map(f => (
              <div key={f.nom} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.nom}</p>
                  <p className="text-xs text-muted-foreground">{f.date}</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{f.taille}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
