// ═══════════════════════════════════════════════════════════════
// Page Tableau de bord — Vue d'ensemble du cabinet
// Affiche les KPI financiers, le graphique de revenus, l'agenda
// du jour, les dossiers récents, les tâches et l'activité
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, CheckCircle, AlertTriangle, FolderOpen, Clock, Users, FileText, Activity, Loader2, HardDrive, Send } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { currentUser, mockDossiers, mockClients, mockActivities, mockTasks, mockAgendaToday, mockRevenueData, formatGNF } from "@/data/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

// Animation d'apparition progressive
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 },
};

// Icônes par type d'activité
const activityIcons: Record<string, React.ElementType> = {
  dossier: FolderOpen,
  paiement: Receipt,
  client: Users,
  signature: FileText,
  rdv: Clock,
};

export default function Dashboard() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [loading] = useState(false); // État de chargement (prêt pour connexion API)
  const storageUsed = 15.5;
  const storageTotal = 20;
  const storagePercent = (storageUsed / storageTotal) * 100;

  const dateLocale = lang === "FR" ? "fr-FR" : "en-US";

  // ═══ Squelettes de chargement ═══
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Skeleton className="xl:col-span-2 h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bannière de bienvenue */}
      <motion.div {...fadeUp} className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("dashboard.welcome")} {currentUser.firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date().toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — {currentUser.cabinet}
        </p>
      </motion.div>

      {/* Cartes KPI — indicateurs financiers clés */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title={t("dashboard.totalInvoices")} value={formatGNF(15050000)} trend={12.5} subtitle={t("dashboard.thisMonth")} icon={Receipt} accentColor="blue" />
        <KpiCard title={t("dashboard.paidInvoices")} value={formatGNF(9200000)} trend={8.3} subtitle={t("dashboard.thisMonth")} icon={CheckCircle} accentColor="green" />
        <KpiCard title={t("dashboard.unpaidInvoices")} value={formatGNF(950000)} trend={-15} subtitle={t("dashboard.overdue")} icon={AlertTriangle} accentColor="red" />
        <KpiCard title={t("dashboard.activeCases")} value="3" trend={5} subtitle={t("dashboard.activeCount")} icon={FolderOpen} accentColor="purple" />
      </motion.div>

      {/* Graphique de revenus + Agenda du jour */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Graphique des revenus mensuels */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="xl:col-span-2 rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("dashboard.revenueChart")}</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={mockRevenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mois" className="fill-muted-foreground" fontSize={11} />
              <YAxis className="fill-muted-foreground" fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [formatGNF(value)]}
              />
              <Line type="monotone" dataKey="revenus" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="depenses" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Agenda du jour */}
        <motion.div {...fadeUp} transition={{ delay: 0.12 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("dashboard.todayAgenda")}</h2>
          <div className="space-y-3">
            {mockAgendaToday.map((event) => (
              <div key={event.id} className="flex gap-3 rounded-lg bg-muted/50 p-3">
                <div className="text-center">
                  <p className="font-heading text-sm font-bold text-primary">{event.heure}</p>
                  <p className="text-[10px] text-muted-foreground">{event.duree}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{event.titre}</p>
                  <p className="text-xs text-muted-foreground">{event.lieu}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Widgets du bas — Dossiers récents, Tâches, Activité */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Dossiers récents */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("dashboard.recentCases")}</h2>
          <div className="space-y-3">
            {mockDossiers.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{d.code}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.typeActe}</p>
                </div>
                <StatusBadge status={d.statut} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tâches à venir */}
        <motion.div {...fadeUp} transition={{ delay: 0.17 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("dashboard.upcomingTasks")}</h2>
          <div className="space-y-3">
            {mockTasks.map((tsk) => (
              <div key={tsk.id} className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{tsk.titre}</p>
                  <StatusBadge status={tsk.priorite} />
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{tsk.assignee}</span>
                  <span>•</span>
                  <span>{tsk.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Journal d'activité */}
        <motion.div {...fadeUp} transition={{ delay: 0.19 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("dashboard.activityLog")}</h2>
          <div className="space-y-3">
            {mockActivities.map((a) => {
              const Icon = activityIcons[a.type] || Activity;
              return (
                <div key={a.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{a.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.detail} · {a.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ═══ Widget de stockage enrichi — barre de progression + catégories ═══ */}
      <motion.div {...fadeUp} transition={{ delay: 0.22 }} className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* ── Résumé d'utilisation ── */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-heading text-sm font-semibold text-foreground">{t("dashboard.storage")}</h2>
          </div>

          {/* Texte "Espace utilisé" */}
          <p className="text-xs text-muted-foreground mb-2">
            {t("dashboard.storageUsed")}
          </p>

          {/* Barre de progression horizontale */}
          <div className="h-4 w-full rounded-full bg-muted overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${storagePercent}%`,
                background: storagePercent > 90
                  ? "hsl(0 72% 51%)"
                  : storagePercent > 70
                    ? "hsl(38 92% 50%)"
                    : "hsl(87 52% 49%)",
              }}
            />
          </div>

          {/* Détail chiffré */}
          <p className="text-xs text-muted-foreground">
            {storageUsed} Go {t("dashboard.usedOn")} {storageTotal} Go {t("dashboard.allocated")}
          </p>
          <p className={`text-xs mt-0.5 font-medium ${storagePercent > 90 ? "text-destructive" : "text-warning"}`}>
            {(storageTotal - storageUsed).toFixed(1)} Go {t("dashboard.available")} — {Math.round(storagePercent)}% {t("dashboard.usedSingle")}
          </p>

          {/* Bouton d'action selon le niveau */}
          <button
            onClick={() => navigate('/stockage')}
            className={`mt-4 w-full rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
              storagePercent > 90
                ? "border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "border-warning/50 bg-warning/10 text-warning hover:bg-warning/20"
            }`}
          >
            <Send className="inline h-3 w-3 mr-1.5" />
            {storagePercent > 90
              ? t("dashboard.urgentExtension")
              : t("dashboard.requestStorage")}
          </button>
        </div>

        {/* ── Détail par catégorie ── */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">
            {t("dashboard.categoryBreakdown")}
          </h2>
          <div className="space-y-4">
            {[
              { label: t("dashboard.catNotarialDeeds"), go: 9.3, pct: 60, color: "hsl(211 55% 48%)" },
              { label: t("dashboard.catDigitalArchives"), go: 4.0, pct: 26, color: "hsl(160 60% 42%)" },
              { label: t("dashboard.catClientDocs"), go: 1.3, pct: 8, color: "hsl(258 60% 56%)" },
              { label: t("dashboard.catInvoices"), go: 0.9, pct: 6, color: "hsl(38 92% 50%)" },
            ].map((cat) => (
              <div key={cat.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{cat.label}</span>
                  <span className="text-muted-foreground font-medium">{cat.go} Go — {cat.pct}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.pct}%`, background: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="mt-4 border-t border-border pt-3 flex justify-between text-sm">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold text-foreground">{storageUsed} Go / {storageTotal} Go</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {t("dashboard.lastUpdated")} : {new Date().toLocaleDateString(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" })}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
