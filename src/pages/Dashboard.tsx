// ═══════════════════════════════════════════════════════════════
// Page Tableau de bord — Vue d'ensemble du cabinet
// Affiche les KPI financiers, le graphique de revenus, l'agenda
// du jour, les dossiers récents, les tâches et l'activité
// Connecté au backend via /api/dashboard
// ═══════════════════════════════════════════════════════════════

import { useMemo, useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, CheckCircle, AlertTriangle, FolderOpen, Clock, Users, FileText, Activity, HardDrive, Send, RefreshCw, Download, Settings, Trash2 } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatGNF } from "@/lib/formatters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalStats, useDashboardUser, useRecentNotifications, useActiveAlerts, useKPIs } from "@/hooks/useDashboard";
import { getWidgetData, refreshWidget as apiRefreshWidget, marquerNotificationsLues, refreshDashboard, resetDashboard, getStatistiquesPeriode, analyserTendances, calculerPrevisions, comparerPerformances, exporterDonneesDashboard, actualiserToutesLesDonnees, nettoyerDonneesObsoletes, recalculerStatistiques } from "@/api/dashboard";
import type { Notification as DashNotification, DashboardWidget } from "@/api/dashboard";
import { useQueryClient } from "@tanstack/react-query";

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
  const { user } = useAuth();

  const userId = user?.id ? Number(user.id) : undefined;
  const queryClient = useQueryClient();

  // ─── Requêtes API via React Query ───
  const { data: stats, isLoading: statsLoading } = useGlobalStats();
  const { data: dashUser, isLoading: dashLoading } = useDashboardUser(userId);
  const { data: notifications = [] } = useRecentNotifications(userId);
  const { data: alerts = [] } = useActiveAlerts(userId);
  const { data: _kpis } = useKPIs();

  // ─── Prévisions & Tendances ───
  const [forecasts, setForecasts] = useState<Record<string, unknown> | null>(null);
  const [_periodStats, setPeriodStats] = useState<Record<string, unknown> | null>(null);
  const [trends, setTrends] = useState<Record<string, unknown> | null>(null);
  const [performances, setPerformances] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    calculerPrevisions().then(setForecasts).catch(() => {});
    // Tendances des 30 derniers jours
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    analyserTendances(fmt(monthAgo), fmt(now)).then(setTrends).catch(() => {});
    comparerPerformances(fmt(monthAgo), fmt(now)).then(setPerformances).catch(() => {});
    getStatistiquesPeriode(fmt(monthAgo), fmt(now)).then(setPeriodStats).catch(() => {});
  }, []);

  // ─── Actions admin dashboard ───
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshDashboard = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      await refreshDashboard(userId);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success("Dashboard rafraîchi");
    } catch { /* silencieux */ }
    finally { setRefreshing(false); }
  }, [userId, queryClient]);

  const _handleResetDashboard = useCallback(async () => {
    if (!userId) return;
    try {
      await resetDashboard(userId);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success("Dashboard réinitialisé");
    } catch { /* silencieux */ }
  }, [userId, queryClient]);

  const handleExportDashboard = useCallback(async () => {
    if (!userId) return;
    try {
      const blob = await exporterDonneesDashboard(userId, 'PDF');
      const url = URL.createObjectURL(blob as unknown as Blob);
      const a = document.createElement("a");
      a.href = url; a.download = "dashboard.pdf"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé");
    } catch { toast.error("Erreur export"); }
  }, [userId]);

  const handleMaintenanceRefresh = useCallback(async () => {
    try {
      await actualiserToutesLesDonnees();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success("Données actualisées");
    } catch { toast.error("Erreur actualisation"); }
  }, [queryClient]);

  const handleMaintenanceCleanup = useCallback(async () => {
    try {
      await nettoyerDonneesObsoletes();
      toast.success("Nettoyage terminé");
    } catch { toast.error("Erreur nettoyage"); }
  }, []);

  const handleMaintenanceRecalculate = useCallback(async () => {
    try {
      await recalculerStatistiques();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success("Statistiques recalculées");
    } catch { toast.error("Erreur recalcul"); }
  }, [queryClient]);

  // ─── Données des widgets (chargées après réception du dashboard user) ───
  const [revenueData, setRevenueData] = useState<Record<string, unknown>[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<Record<string, unknown>[]>([]);
  const [recentDossiers, setRecentDossiers] = useState<Record<string, unknown>[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Record<string, unknown>[]>([]);
  const [storage, setStorage] = useState({ used: 0, total: 20 });

  useEffect(() => {
    if (!dashUser?.widgets?.length) return;

    const loadWidgets = async () => {
      const results = await Promise.allSettled(
        dashUser.widgets.map(async (w: DashboardWidget) => {
          const data = await getWidgetData(w.id);
          return { ...w, donnees: data };
        })
      );

      results.forEach((r) => {
        if (r.status !== "fulfilled") return;
        const w = r.value;
        const data = w.donnees;
        if (!data) return;

        switch (w.typeWidget) {
          case "CHART":
            if (data.revenueData) setRevenueData(data.revenueData);
            break;
          case "CALENDAR":
            if (data.events) setAgendaEvents(data.events);
            break;
          case "LIST":
            if (w.titre?.toLowerCase().includes("dossier")) setRecentDossiers(data.items || []);
            else if (w.titre?.toLowerCase().includes("tâche")) setUpcomingTasks(data.items || []);
            break;
          case "KPI":
            if (w.titre?.toLowerCase().includes("stockage") && data.used !== undefined) {
              setStorage({ used: data.used, total: data.total || 20 });
            }
            break;
        }
      });
    };

    loadWidgets();
  }, [dashUser]);

  const loading = statsLoading || dashLoading;

  const storageUsed = storage.used;
  const storageTotal = storage.total;

  const storagePercent = useMemo(
    () => (storageUsed / storageTotal) * 100,
    [storageUsed, storageTotal]
  );

  const dateLocale = lang === "FR" ? "fr-FR" : "en-US";

  const handleNavigateStorage = useCallback(() => {
    navigate('/stockage');
  }, [navigate]);

  // Marquer une notification comme lue puis rafraîchir la liste
  const handleMarkNotificationRead = useCallback(async (notifId: number) => {
    try {
      await marquerNotificationsLues([notifId]);
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'notifications', userId] });
    } catch { /* silencieux */ }
  }, [queryClient, userId]);

  // Rafraîchir un widget individuel
  const _handleRefreshWidget = useCallback(async (widgetId: number) => {
    try {
      await apiRefreshWidget(widgetId);
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'user', userId] });
    } catch { /* silencieux */ }
  }, [queryClient, userId]);

  // Catégories de stockage — recalculées seulement si la langue change
  const storageCategories = useMemo(() => [
    { label: t("dashboard.catNotarialDeeds"), go: 9.3, pct: 60, color: "hsl(211 55% 48%)" },
    { label: t("dashboard.catDigitalArchives"), go: 4.0, pct: 26, color: "hsl(160 60% 42%)" },
    { label: t("dashboard.catClientDocs"), go: 1.3, pct: 8, color: "hsl(258 60% 56%)" },
    { label: t("dashboard.catInvoices"), go: 0.9, pct: 6, color: "hsl(38 92% 50%)" },
  ], [t]);

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {t("dashboard.welcome")} {user?.prenom || "Utilisateur"} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date().toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — Cabinet Notarial
            </p>
          </div>
          {/* Actions rapides */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefreshDashboard} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} /> {lang === "FR" ? "Actualiser" : "Refresh"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportDashboard}>
              <Download className="h-4 w-4 mr-1" /> {lang === "FR" ? "Exporter" : "Export"}
            </Button>
            {user?.role === "ADMIN" && (
              <>
                <Button variant="outline" size="sm" onClick={handleMaintenanceRefresh} title="Actualiser toutes les données">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleMaintenanceCleanup} title="Nettoyage données obsolètes">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleMaintenanceRecalculate} title="Recalculer statistiques">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Alertes actives */}
      {alerts.length > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.03 }} className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-semibold text-destructive">{t("dashboard.alerts") || "Alertes"} ({alerts.length})</h2>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert: Record<string, unknown>, i: number) => (
              <p key={i} className="text-xs text-destructive/80">
                • {String(alert.message || alert.titre || JSON.stringify(alert))}
              </p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cartes KPI — indicateurs financiers clés */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title={t("dashboard.totalInvoices")} value={formatGNF(stats?.chiffreAffairesMois || 0)} trend={stats?.evolutionCA || 0} subtitle={t("dashboard.thisMonth")} icon={Receipt} accentColor="blue" />
        <KpiCard title={t("dashboard.paidInvoices")} value={formatGNF(stats?.honorairesEncaisses || 0)} trend={0} subtitle={t("dashboard.thisMonth")} icon={CheckCircle} accentColor="green" />
        <KpiCard title={t("dashboard.unpaidInvoices")} value={formatGNF(stats?.montantFacturesPendantes || 0)} trend={0} subtitle={t("dashboard.overdue")} icon={AlertTriangle} accentColor="red" />
        <KpiCard title={t("dashboard.activeCases")} value={String(stats?.nombreDossiersActifs || 0)} trend={stats?.evolutionDossiers || 0} subtitle={t("dashboard.activeCount")} icon={FolderOpen} accentColor="purple" />
      </motion.div>

      {/* Graphique de revenus + Agenda du jour */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Graphique des revenus mensuels */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="xl:col-span-2 rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("dashboard.revenueChart")}</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData}>
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
            {agendaEvents.length > 0 ? (
              agendaEvents.map((event: Record<string, unknown>) => (
                <div key={String(event.id)} className="flex gap-3 rounded-lg bg-muted/50 p-3">
                  <div className="text-center">
                    <p className="font-heading text-sm font-bold text-primary">{String(event.heure)}</p>
                    <p className="text-[10px] text-muted-foreground">{String(event.duree)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{String(event.titre)}</p>
                    <p className="text-xs text-muted-foreground">{String(event.lieu)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4 italic">Aucun rendez-vous aujourd'hui</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Widgets du bas — Dossiers récents, Tâches, Activité */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Dossiers récents */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("dashboard.recentCases")}</h2>
          <div className="space-y-3">
            {recentDossiers.length > 0 ? (
              recentDossiers.slice(0, 5).map((d: Record<string, unknown>) => (
                <div key={String(d.id)} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{String(d.code || d.numeroDossier)}</p>
                    <p className="text-xs text-muted-foreground truncate">{String(d.typeActe || d.objet)}</p>
                  </div>
                  <StatusBadge status={String(d.statut)} />
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4 italic">Aucun dossier récent</p>
            )}
          </div>
        </motion.div>

        {/* Tâches à venir */}
        <motion.div {...fadeUp} transition={{ delay: 0.17 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("dashboard.upcomingTasks")}</h2>
          <div className="space-y-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((tsk: Record<string, unknown>) => (
                <div key={String(tsk.id)} className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{String(tsk.titre)}</p>
                    <StatusBadge status={String(tsk.priorite)} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{String(tsk.assignee || tsk.responsable)}</span>
                    <span>•</span>
                    <span>{String(tsk.deadline || tsk.dateEcheance)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4 italic">Aucune tâche en attente</p>
            )}
          </div>
        </motion.div>

        {/* Journal d'activité */}
        <motion.div {...fadeUp} transition={{ delay: 0.19 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("dashboard.activityLog")}</h2>
          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((a: DashNotification) => {
                const Icon = activityIcons[a.type] || Activity;
                return (
                  <div
                    key={a.id}
                    className={`flex gap-3 cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-muted/60 ${!a.lu ? 'bg-primary/5' : ''}`}
                    onClick={() => !a.lu && handleMarkNotificationRead(a.id)}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{a.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.detail} · {a.time}</p>
                    </div>
                    {!a.lu && <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4 italic">Aucune activité récente</p>
            )}
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
            onClick={handleNavigateStorage}
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
            {storageCategories.map((cat) => (
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

      {/* ═══ Prévisions, Tendances et Performances (données API) ═══ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Prévisions */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{lang === "FR" ? "Prévisions" : "Forecasts"}</h2>
          {forecasts ? (
            <div className="space-y-2">
              {Object.entries(forecasts).slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-border pb-2 last:border-0">
                  <span className="text-xs text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}</span>
                  <span className="text-xs font-medium text-foreground">{typeof value === 'number' ? value.toLocaleString() : String(value ?? '-')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-4">{lang === "FR" ? "Aucune prévision disponible" : "No forecasts available"}</p>
          )}
        </motion.div>

        {/* Tendances */}
        <motion.div {...fadeUp} transition={{ delay: 0.27 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{lang === "FR" ? "Tendances (30j)" : "Trends (30d)"}</h2>
          {trends ? (
            <div className="space-y-2">
              {Object.entries(trends).slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-border pb-2 last:border-0">
                  <span className="text-xs text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}</span>
                  <span className="text-xs font-medium text-foreground">{typeof value === 'number' ? value.toLocaleString() : String(value ?? '-')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-4">{lang === "FR" ? "Aucune tendance disponible" : "No trends available"}</p>
          )}
        </motion.div>

        {/* Performances comparées */}
        <motion.div {...fadeUp} transition={{ delay: 0.29 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{lang === "FR" ? "Performances" : "Performance"}</h2>
          {performances ? (
            <div className="space-y-2">
              {Object.entries(performances).slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-border pb-2 last:border-0">
                  <span className="text-xs text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}</span>
                  <span className="text-xs font-medium text-foreground">{typeof value === 'number' ? value.toLocaleString() : String(value ?? '-')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-4">{lang === "FR" ? "Aucune donnée disponible" : "No data available"}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
