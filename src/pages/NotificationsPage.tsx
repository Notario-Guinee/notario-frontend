// ═══════════════════════════════════════════════════════════════
// Page Notifications — Centre de notifications de l'application
// Inclut : fil des alertes (dossiers, paiements, RDV, sécurité),
// marquage lu/non-lu, filtres par catégorie et préférences
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { Bell, Check, FolderOpen, Receipt, User, Calendar, Shield, CheckCheck, Clock, FileText, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { notificationService } from "@/services/notificationService";
import type { Notification as ApiNotification } from "@/types/api";

type NotifType = "dossier" | "paiement" | "client" | "rdv" | "securite" | "document" | "action";

interface Notification {
  id: string; type: NotifType; titre: string; message: string; time: string; lu: boolean;
  icon: React.ElementType; color: string; scheduledAt?: string;
}

const baseNotifs: Notification[] = [
  { id: "1", type: "dossier", titre: "Nouveau dossier créé", message: "DOS-2026-004 — Donation entre Condé Mariama et Sylla Mohamed a été créé.", time: "Il y a 2h", lu: false, icon: FolderOpen, color: "text-secondary bg-secondary/15" },
  { id: "2", type: "paiement", titre: "Paiement reçu", message: "Paiement Orange Money de 3 500 000 GNF reçu pour FAC-2026-001.", time: "Il y a 3h", lu: false, icon: Receipt, color: "text-success bg-success/15" },
  { id: "3", type: "client", titre: "Nouveau client enregistré", message: "Condé Mariama a été ajoutée comme nouvelle cliente.", time: "Il y a 5h", lu: false, icon: User, color: "text-primary bg-primary/15" },
  { id: "4", type: "rdv", titre: "Rappel rendez-vous — dans 1h", message: "RDV avec Camara Fatoumata à 09h00 — Bureau 1. Préparation recommandée.", time: "Il y a 8h", lu: false, icon: Calendar, color: "text-warning bg-warning/15", scheduledAt: "2026-03-12T09:00:00" },
  { id: "5", type: "securite", titre: "Connexion depuis un nouvel appareil", message: "Connexion détectée depuis un nouvel appareil — Conakry, Guinée.", time: "Hier", lu: true, icon: Shield, color: "text-destructive bg-destructive/15" },
  { id: "6", type: "dossier", titre: "Dossier signé", message: "L'acte DOS-2026-002 a été signé par toutes les parties.", time: "Hier", lu: true, icon: CheckCheck, color: "text-success bg-success/15" },
  { id: "7", type: "paiement", titre: "Facture en retard", message: "FAC-2026-003 — 950 000 GNF est en retard de paiement.", time: "Il y a 2j", lu: true, icon: Receipt, color: "text-destructive bg-destructive/15" },
  // Advanced notifications
  { id: "8", type: "rdv", titre: "Rappel rendez-vous — demain", message: "RDV avec Barry Ousmane demain à 09h30 — Bureau 2. Durée: 30min.", time: "Il y a 1h", lu: false, icon: Calendar, color: "text-warning bg-warning/15", scheduledAt: "2026-03-13T09:30:00" },
  { id: "9", type: "dossier", titre: "Progression dossier", message: "Le dossier N-2025-101 est passé à l'étape 'Rédaction de l'acte'. Client notifié.", time: "Il y a 4h", lu: false, icon: FolderOpen, color: "text-primary bg-primary/15" },
  { id: "10", type: "document", titre: "Document disponible", message: "Un nouveau document a été partagé avec Soumah Aissatou — Copie succession.", time: "Il y a 6h", lu: true, icon: FileText, color: "text-secondary bg-secondary/15" },
  { id: "11", type: "action", titre: "Action requise", message: "Camara Fatoumata doit fournir sa carte d'identité pour finaliser le dossier.", time: "Il y a 1j", lu: true, icon: AlertTriangle, color: "text-warning bg-warning/15" },
  { id: "12", type: "paiement", titre: "Facture émise", message: "FAC-2026-005 de 4 200 000 GNF a été émise pour SCI Les Palmiers.", time: "Il y a 1j", lu: true, icon: Send, color: "text-primary bg-primary/15" },
];

const initialEventTypes = [
  { key: "dossier_cree", label: "dossier_cree", active: true },
  { key: "dossier_signe", label: "dossier_signe", active: true },
  { key: "paiement_recu", label: "paiement_recu", active: true },
  { key: "facture_retard", label: "facture_retard", active: true },
  { key: "rdv_rappel", label: "rdv_rappel", active: true },
  { key: "progression_dossier", label: "progression_dossier", active: true },
  { key: "document_disponible", label: "document_disponible", active: true },
  { key: "action_requise", label: "action_requise", active: true },
  { key: "connexion_nouvel", label: "connexion_nouvel", active: false },
  { key: "quota_stockage", label: "quota_stockage", active: true },
];

const initialCanaux = [
  { key: "email", label: "Email", active: true },
  { key: "sms", label: "SMS", active: false },
  { key: "inapp", label: "In-app", active: true },
  { key: "push", label: "Push", active: false },
];

const eventLabels: Record<string, Record<string, string>> = {
  FR: {
    dossier_cree: "Nouveau dossier",
    dossier_signe: "Dossier signé",
    paiement_recu: "Paiement reçu",
    facture_retard: "Facture en retard",
    rdv_rappel: "Rappel RDV",
    progression_dossier: "Progression dossier",
    document_disponible: "Document disponible",
    action_requise: "Action requise",
    connexion_nouvel: "Nouvelle connexion",
    quota_stockage: "Alerte stockage",
  },
  EN: {
    dossier_cree: "New case",
    dossier_signe: "Case signed",
    paiement_recu: "Payment received",
    facture_retard: "Overdue invoice",
    rdv_rappel: "Appointment reminder",
    progression_dossier: "Case progress",
    document_disponible: "Document available",
    action_requise: "Action required",
    connexion_nouvel: "New connection",
    quota_stockage: "Storage alert",
  },
};

// Helper: map API Notification to local Notification shape
const iconForType = (type: string): React.ElementType => {
  const map: Record<string, React.ElementType> = {
    dossier: FolderOpen, paiement: Receipt, client: User, rdv: Calendar,
    securite: Shield, document: FileText, action: AlertTriangle,
  };
  return map[type.toLowerCase()] ?? Bell;
};

const colorForType = (type: string): string => {
  const map: Record<string, string> = {
    dossier: "text-secondary bg-secondary/15",
    paiement: "text-success bg-success/15",
    client: "text-primary bg-primary/15",
    rdv: "text-warning bg-warning/15",
    securite: "text-destructive bg-destructive/15",
    document: "text-secondary bg-secondary/15",
    action: "text-warning bg-warning/15",
  };
  return map[type.toLowerCase()] ?? "text-muted-foreground bg-muted";
};

const mapApiNotif = (n: ApiNotification): Notification => ({
  id: String(n.id),
  type: (n.type?.toLowerCase() as NotifType) ?? "dossier",
  titre: n.titre,
  message: n.message,
  time: n.createdAt ? new Date(n.createdAt).toLocaleString("fr-FR") : "",
  lu: n.lu,
  icon: iconForType(n.type ?? ""),
  color: colorForType(n.type ?? ""),
});

export default function NotificationsPage() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<"centre" | "config">("centre");
  const [notifications, setNotifications] = useState(baseNotifs);
  const [eventTypes, setEventTypes] = useState(initialEventTypes);
  const [canaux, setCanaux] = useState(initialCanaux);
  const [filterType, setFilterType] = useState<string>("all");

  // Load notifications from API on mount
  useEffect(() => {
    let cancelled = false;
    notificationService.getAll().then(data => {
      if (!cancelled && data.length > 0) setNotifications(data.map(mapApiNotif));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const nonLues = notifications.filter(n => !n.lu).length;
  const marquerToutLu = () => {
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    notificationService.markAllAsRead().catch(() => {});
  };

  const toggleEvent = (key: string) => {
    setEventTypes(prev => prev.map(e => e.key === key ? { ...e, active: !e.active } : e));
  };

  const toggleCanal = (key: string) => {
    setCanaux(prev => prev.map(c => c.key === key ? { ...c, active: !c.active } : c));
  };

  // Countdown for scheduled RDV notifications
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newCountdowns: Record<string, string> = {};
      notifications.filter(n => n.scheduledAt).forEach(n => {
        const target = new Date(n.scheduledAt!);
        const diff = target.getTime() - now.getTime();
        if (diff > 0) {
          const hours = Math.floor(diff / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          newCountdowns[n.id] = `${hours}h ${mins}min`;
        } else {
          newCountdowns[n.id] = lang === "FR" ? "Maintenant" : "Now";
        }
      });
      setCountdowns(newCountdowns);
    }, 30000);
    // Initial compute
    const now = new Date();
    const initial: Record<string, string> = {};
    notifications.filter(n => n.scheduledAt).forEach(n => {
      const target = new Date(n.scheduledAt!);
      const diff = target.getTime() - now.getTime();
      if (diff > 0) {
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        initial[n.id] = `${hours}h ${mins}min`;
      } else {
        initial[n.id] = lang === "FR" ? "Maintenant" : "Now";
      }
    });
    setCountdowns(initial);
    return () => clearInterval(interval);
  }, [notifications, lang]);

  const filteredNotifs = filterType === "all" ? notifications : notifications.filter(n => n.type === filterType);

  const typeFilters = [
    { key: "all", label: t("notif.filterAll") },
    { key: "rdv", label: t("notif.filterRdv") },
    { key: "dossier", label: t("notif.filterDossier") },
    { key: "paiement", label: t("notif.filterPaiement") },
    { key: "document", label: t("notif.filterDocument") },
    { key: "action", label: t("notif.filterAction") },
    { key: "securite", label: t("notif.filterSecurite") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-foreground">{t("notif.title")}</h1>
        {nonLues > 0 && (
          <span className="flex h-6 items-center rounded-full bg-primary/15 px-2.5 text-xs font-bold text-primary">{nonLues} {t("notif.unread")}</span>
        )}
        <div className="ml-auto flex gap-2">
          <div className="flex rounded-lg bg-muted p-1">
            {[{ key: "centre", label: t("notif.center") }, { key: "config", label: t("notif.settings") }].map(tb => (
              <button key={tb.key} onClick={() => setTab(tb.key as typeof tab)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === tb.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {tb.label}
              </button>
            ))}
          </div>
          {tab === "centre" && nonLues > 0 && (
            <Button variant="outline" size="sm" onClick={marquerToutLu}><Check className="mr-1 h-3 w-3" /> {t("notif.markAllRead")}</Button>
          )}
        </div>
      </div>

      {tab === "centre" && (
        <>
          {/* Type filters */}
          <div className="flex flex-wrap gap-2">
            {typeFilters.map(f => (
              <button key={f.key} onClick={() => setFilterType(f.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${filterType === f.key ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filteredNotifs.map((n, i) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => {
                  setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, lu: true } : x));
                  if (!n.lu) notificationService.markAsRead(Number(n.id)).catch(() => {});
                }}
                className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${!n.lu ? "border-primary/20 bg-primary/5" : "border-border bg-card hover:bg-muted/20"}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${n.color}`}>
                  <n.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.lu ? "text-foreground" : "text-muted-foreground"}`}>{n.titre}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  {/* Countdown for RDV */}
                  {n.scheduledAt && countdowns[n.id] && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-warning" />
                      <span className="text-[11px] font-medium text-warning">
                        ⏱ {countdowns[n.id]}
                      </span>
                    </div>
                  )}
                </div>
                {!n.lu && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
              </motion.div>
            ))}
          </div>
        </>
      )}

      {tab === "config" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("notif.eventTriggers")}</h2>
            <div className="space-y-3">
              {eventTypes.map(e => (
                <div key={e.key} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                  <span className="text-sm text-foreground">{eventLabels[lang]?.[e.key] || e.label}</span>
                  <Switch checked={e.active} onCheckedChange={() => toggleEvent(e.key)} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("notif.channels")}</h2>
            <div className="space-y-3">
              {canaux.map(c => (
                <div key={c.key} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{c.label}</span>
                  </div>
                  <Switch checked={c.active} onCheckedChange={() => toggleCanal(c.key)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}