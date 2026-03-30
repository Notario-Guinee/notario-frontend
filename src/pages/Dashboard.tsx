// ═══════════════════════════════════════════════════════════════
// Page Tableau de bord — Vue d'ensemble du cabinet
// Affiche les KPI financiers, le graphique de revenus, l'agenda
// du jour, les dossiers récents, les tâches et l'activité
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Receipt, CheckCircle, AlertTriangle, FolderOpen, Clock, Users, FileText, Activity, Loader2 } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { currentUser, mockDossiers, mockClients, mockActivities, mockTasks, mockAgendaToday, mockRevenueData, formatGNF } from "@/data/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { getGlobalStats, getRecentNotifications, type GlobalStats, type Notification } from "@/services/dashboardService";
import { useEffect } from "react";
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>(mockRevenueData);
  
  const storageUsed = 15.5;
  const storageTotal = 20;
  const storagePercent = (storageUsed / storageTotal) * 100;

  const dateLocale = lang === "FR" ? "fr-FR" : "en-US";

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [globalStats, notes] = await Promise.all([
          getGlobalStats(),
          user?.id ? getRecentNotifications(Number(user.id)) : Promise.resolve([])
        ]);
        
        setStats(globalStats);
        setNotifications(notes);
        
        // Mapping du graphique si disponible
        if (globalStats.evolutionMensuelle) {
          const mappedChart = Object.entries(globalStats.evolutionMensuelle).map(([mois, data]: [string, any]) => ({
            mois,
            revenus: data.revenus || 0,
            depenses: data.depenses || 0
          }));
          if (mappedChart.length > 0) setRevenueData(mappedChart);
        }
      } catch (err) {
        console.error("Erreur chargement dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

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
          {t("dashboard.welcome")} {user?.prenom || "Utilisateur"} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date().toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — {user?.cabinet || "Cabinet Notarial"}
        </p>
      </motion.div>

      {/* Cartes KPI — indicateurs financiers clés */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard 
          title={t("dashboard.totalInvoices")} 
          value={formatGNF(stats?.chiffreAffairesMois || 0)} 
          trend={stats?.evolutionCA || 0} 
          subtitle={t("dashboard.thisMonth")} 
          icon={Receipt} 
          accentColor="blue" 
        />
        <KpiCard 
          title={t("dashboard.paidInvoices")} 
          value={formatGNF(stats?.honorairesEncaisses || 0)} 
          trend={0} 
          subtitle={t("dashboard.thisMonth")} 
          icon={CheckCircle} 
          accentColor="green" 
        />
        <KpiCard 
          title={t("dashboard.unpaidInvoices")} 
          value={formatGNF(stats?.montantFacturesPendantes || 0)} 
          trend={0} 
          subtitle={t("dashboard.overdue")} 
          icon={AlertTriangle} 
          accentColor="red" 
        />
        <KpiCard 
          title={t("dashboard.activeCases")} 
          value={String(stats?.nombreDossiersActifs || 0)} 
          trend={stats?.evolutionDossiers || 0} 
          subtitle={t("dashboard.activeCount")} 
          icon={FolderOpen} 
          accentColor="purple" 
        />
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
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((a) => {
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
              })
            ) : (
              mockActivities.slice(0, 5).map((a) => {
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
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Widget de stockage */}
      <motion.div {...fadeUp} transition={{ delay: 0.22 }} className="max-w-sm rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("dashboard.storage")}</h2>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={storagePercent > 90 ? "hsl(0 72% 51%)" : storagePercent > 70 ? "hsl(211 55% 48%)" : "hsl(87 52% 49%)"}
                strokeWidth="3"
                strokeDasharray={`${storagePercent}, 100`}
                strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-heading text-sm font-bold text-foreground">
              {Math.round(storagePercent)}%
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{storageUsed} Go</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.usedOf")} {storageTotal} Go {t("dashboard.used")}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
