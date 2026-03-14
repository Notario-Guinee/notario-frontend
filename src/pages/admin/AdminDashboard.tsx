import { Building2, Users, Receipt, Activity, Package, Key, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const recentActivities = [
  { action: "Nouveau cabinet inscrit", detail: "Étude Camara — Plan Pro", time: "Il y a 2h", type: "tenant" },
  { action: "Module activé", detail: "Archives OCR — Cabinet Bah", time: "Il y a 4h", type: "module" },
  { action: "Licence générée", detail: "12 mois — SN Condé", time: "Hier", type: "license" },
  { action: "Lead reçu", detail: "Me Sylla — Demande de démo", time: "Hier", type: "lead" },
  { action: "Paiement reçu", detail: "Étude Diallo — 2 500 000 GNF", time: "Il y a 2j", type: "payment" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const fr = lang === "FR";

  const kpis = [
    { label: fr ? "Total cabinets" : "Total offices", value: "4", icon: Building2, bg: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-500", change: "+1" },
    { label: fr ? "Cabinets actifs" : "Active offices", value: "3", icon: Activity, bg: "bg-emerald-50 dark:bg-emerald-900/20", iconBg: "bg-emerald-500", change: "0" },
    { label: fr ? "Utilisateurs totaux" : "Total users", value: "28", icon: Users, bg: "bg-purple-50 dark:bg-purple-900/20", iconBg: "bg-purple-500", change: "+3" },
    { label: fr ? "Revenus mensuels" : "Monthly revenue", value: "12 500 000 GNF", icon: Receipt, bg: "bg-amber-50 dark:bg-amber-900/20", iconBg: "bg-amber-500", change: "+8%" },
    { label: fr ? "Modules actifs" : "Active modules", value: "18", icon: Package, bg: "bg-teal-50 dark:bg-teal-900/20", iconBg: "bg-teal-500", change: "+2" },
    { label: fr ? "Licences actives" : "Active licenses", value: "4", icon: Key, bg: "bg-rose-50 dark:bg-rose-900/20", iconBg: "bg-rose-500", change: "0" },
  ];

  const quickActions = [
    { label: fr ? "Gérer les tenants" : "Manage tenants", path: "/admin/tenants", icon: Building2 },
    { label: fr ? "Modules & Offres" : "Modules & Plans", path: "/admin/modules", icon: Package },
    { label: fr ? "Leads & Démos" : "Leads & Demos", path: "/admin/leads", icon: TrendingUp },
    { label: fr ? "Licences" : "Licenses", path: "/admin/licenses", icon: Key },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {fr ? "🛡️ Tableau de bord Admin Global" : "🛡️ Global Admin Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {fr ? "Vue d'ensemble de la plateforme Notario" : "Overview of the Notario platform"}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={cn("rounded-xl border border-border p-5 flex items-center gap-4", kpi.bg)}>
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white", kpi.iconBg)}>
              <kpi.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-heading text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
            {kpi.change !== "0" && (
              <span className="rounded-full bg-success/10 text-success px-2 py-0.5 text-[10px] font-bold">{kpi.change}</span>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,340px]">
        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">
            {fr ? "Activité récente" : "Recent Activity"}
          </h2>
          <div className="space-y-3">
            {recentActivities.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 rounded-lg bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{a.time}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-foreground mb-4">
              {fr ? "Actions rapides" : "Quick Actions"}
            </h2>
            <div className="space-y-2">
              {quickActions.map((qa) => (
                <button key={qa.path} onClick={() => navigate(qa.path)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors text-left">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <qa.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{qa.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="font-heading text-sm font-semibold text-foreground">{fr ? "Alertes" : "Alerts"}</h3>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• {fr ? "1 cabinet en statut suspendu (SN Condé)" : "1 office suspended (SN Condé)"}</p>
              <p>• {fr ? "2 licences expirent ce mois" : "2 licenses expiring this month"}</p>
              <p>• {fr ? "3 leads en attente de réponse" : "3 leads pending response"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
