// ═══════════════════════════════════════════════════════════════
// Page Administration — Paramètres du gérant (cabinet)
// Inclut : profil cabinet, journal d'audit, sécurité, paramètres
// avec contrôle de taille de police et durée de session
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Building2, Shield, Settings, FileText, Search, Upload, LogIn, Edit, Trash2, Download, Eye, HardDrive, Users, Type, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currentUser } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useRole } from "@/context/RoleContext";

// Onglets de navigation — uniquement les onglets du gérant
const tabs = [
  { id: "cabinet", label: "Cabinet (profil)", icon: Building2 },
  { id: "audit", label: "Journal d'audit", icon: FileText },
  { id: "securite", label: "Sécurité & Accès", icon: Shield },
  { id: "parametres", label: "Paramètres", icon: Settings },
] as const;
type TabId = (typeof tabs)[number]["id"];

// Données fictives pour le journal d'audit
const auditLog = [
  { id: "1", action: "Connexion", user: "Me Diallo", detail: "Connexion depuis Conakry", date: "2026-03-09 08:15", icon: LogIn, color: "text-emerald-600 bg-emerald-500/15" },
  { id: "2", action: "Modification dossier", user: "Me Keita", detail: "DOS-2026-001 — Statut → En cours", date: "2026-03-09 09:30", icon: Edit, color: "text-blue-600 bg-blue-500/15" },
  { id: "3", action: "Suppression document", user: "Me Diallo", detail: "Brouillon facture supprimé", date: "2026-03-08 16:45", icon: Trash2, color: "text-red-500 bg-red-500/15" },
  { id: "4", action: "Export données", user: "Comptable", detail: "Export CSV factures mars 2026", date: "2026-03-08 14:20", icon: Download, color: "text-primary bg-primary/15" },
  { id: "5", action: "Consultation dossier", user: "Me Keita", detail: "DOS-2026-003 consulté", date: "2026-03-08 11:00", icon: Eye, color: "text-muted-foreground bg-muted" },
  { id: "6", action: "Connexion", user: "Comptable", detail: "Connexion depuis Conakry", date: "2026-03-08 08:05", icon: LogIn, color: "text-emerald-600 bg-emerald-500/15" },
  { id: "7", action: "Modification client", user: "Me Diallo", detail: "Mise à jour fiche Camara Fatoumata", date: "2026-03-07 17:30", icon: Edit, color: "text-blue-600 bg-blue-500/15" },
];

// Données pour le graphique de répartition du stockage
const pieData = [
  { name: "Documents", value: 8.2, color: "hsl(211 55% 48%)" },
  { name: "Archives", value: 4.1, color: "hsl(200 67% 50%)" },
  { name: "Photos", value: 2.3, color: "hsl(87 52% 49%)" },
  { name: "Autres", value: 0.9, color: "hsl(220 24% 64%)" },
];

export default function Administration() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl || "cabinet");
  const { lang } = useLanguage();
  const { isAdminGlobal } = useRole();
  const fr = lang === "FR";

  // Synchroniser l'onglet actif avec l'URL
  useEffect(() => {
    if (tabFromUrl && tabs.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Bascules pour les notifications
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifReminder, setNotifReminder] = useState(false);
  // Notification quand un employé termine une formation
  const [notifFormation, setNotifFormation] = useState(true);

  // Stockage
  const [storageUsed] = useState(15.5);
  const [storageTotal] = useState(20);

  // ═══ Taille de police de l'application ═══
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("app-font-size");
    return saved ? Number(saved) : 16;
  });

  // Appliquer la taille de police sur le document HTML
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("app-font-size", String(fontSize));
  }, [fontSize]);

  // ═══ Durée de session et déconnexion automatique ═══
  const [sessionTimeout, setSessionTimeout] = useState(() => {
    const saved = localStorage.getItem("session-timeout");
    return saved || "30";
  });
  const [autoLogout, setAutoLogout] = useState(() => {
    const saved = localStorage.getItem("auto-logout");
    return saved !== "false";
  });

  // Persister les paramètres de session
  useEffect(() => {
    localStorage.setItem("session-timeout", sessionTimeout);
    localStorage.setItem("auto-logout", String(autoLogout));
  }, [sessionTimeout, autoLogout]);

  return (
    <div className="h-full min-h-[calc(100vh-4rem)]">
      {/* ═══ Navigation par onglets ═══ */}
      <div className="sticky top-16 z-20 border-b border-border bg-card/80 backdrop-blur-md px-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin -mb-px">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const label = fr
              ? tab.label
              : tab.id === "cabinet" ? "Office (profile)"
              : tab.id === "audit" ? "Audit Log"
              : tab.id === "securite" ? "Security & Access"
              : "Settings";
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* ═══════════════ CABINET (PROFIL) — Gérant uniquement ═══════════════ */}
            {activeTab === "cabinet" && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h1 className="font-heading text-2xl font-bold text-foreground">{fr ? "Cabinet (profil)" : "Office (profile)"}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{fr ? "Informations de votre étude notariale" : "Your notarial office information"}</p>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Informations du cabinet */}
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                        <Building2 className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <p className="font-heading text-lg font-bold text-foreground">{currentUser.cabinet}</p>
                        <p className="text-xs text-muted-foreground">Conakry, Guinée</p>
                      </div>
                    </div>
                    {[
                      { l: fr ? "Nom du cabinet" : "Office name", v: currentUser.cabinet },
                      { l: "Email", v: "contact@diallo-notaires.gn" },
                      { l: fr ? "Téléphone" : "Phone", v: "+224 622 00 11 22" },
                      { l: fr ? "Adresse" : "Address", v: "Quartier Almamya, Commune de Kaloum, Conakry" },
                      { l: "RCCM", v: "GN-CKY-2020-B-12345" },
                      { l: "NIF", v: "NIF-2020-001234" },
                    ].map(f => (
                      <div key={f.l}>
                        <label className="text-xs font-medium text-muted-foreground">{f.l}</label>
                        <Input defaultValue={f.v} className="mt-1" />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">{fr ? "Logo du cabinet" : "Office logo"}</label>
                      <div className="mt-1 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Button variant="outline" size="sm">{fr ? "Changer le logo" : "Change logo"}</Button>
                      </div>
                    </div>
                    <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 w-full">{fr ? "Enregistrer les modifications" : "Save changes"}</Button>
                  </div>

                  {/* Configuration facturation + stockage */}
                  <div className="space-y-6">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                      <h2 className="font-heading text-sm font-semibold text-foreground">{fr ? "Configuration facturation" : "Billing configuration"}</h2>
                      {[
                        { l: fr ? "Devise" : "Currency", v: "GNF — Franc Guinéen" },
                        { l: fr ? "Format factures" : "Invoice format", v: "FAC-{ANNEE}-{SEQ}" },
                        { l: fr ? "TVA par défaut" : "Default VAT", v: "18%" },
                        { l: fr ? "Mentions légales" : "Legal mentions", v: fr ? "Payable à réception" : "Payable upon receipt" },
                      ].map(f => (
                        <div key={f.l}>
                          <label className="text-xs font-medium text-muted-foreground">{f.l}</label>
                          <Input defaultValue={f.v} className="mt-1" />
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                      <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{fr ? "Stockage" : "Storage"}</h2>
                      <div className="flex items-center gap-4">
                        <div className="relative h-20 w-20">
                          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(211 55% 48%)" strokeWidth="3" strokeDasharray={`${Math.round(storageUsed / storageTotal * 100)}, 100`} strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center font-heading text-sm font-bold text-foreground">{Math.round(storageUsed / storageTotal * 100)}%</span>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground">{storageUsed} Go</p>
                          <p className="text-xs text-muted-foreground">{fr ? "sur" : "of"} {storageTotal} Go {fr ? "utilisés" : "used"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════ JOURNAL D'AUDIT ═══════════════ */}
            {activeTab === "audit" && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-heading text-2xl font-bold text-foreground">{fr ? "Journal d'audit" : "Audit Log"}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{fr ? `Traçabilité des actions — ${currentUser.cabinet}` : `Activity log — ${currentUser.cabinet}`}</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { l: fr ? "Événements aujourd'hui" : "Today's events", v: "12", color: "bg-blue-50 dark:bg-blue-900/20" },
                    { l: fr ? "Utilisateurs actifs" : "Active users", v: "4", color: "bg-emerald-50 dark:bg-emerald-900/20" },
                    { l: fr ? "Alertes" : "Alerts", v: "0", color: "bg-rose-50 dark:bg-rose-900/20" },
                  ].map(s => (
                    <div key={s.l} className={cn("rounded-xl border border-border p-5 text-center", s.color)}>
                      <p className="font-heading text-3xl font-bold text-foreground">{s.v}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={fr ? "Rechercher une action..." : "Search an action..."} className="pl-9" />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> {fr ? "Exporter" : "Export"}</Button>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="space-y-3">
                    {auditLog.map((a, i) => (
                      <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="flex items-start gap-4 rounded-lg bg-muted/30 p-3.5 hover:bg-muted/50 transition-colors">
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", a.color)}>
                          <a.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{a.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-muted-foreground">{a.user}</p>
                          <p className="text-[10px] text-muted-foreground">{a.date}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════ SÉCURITÉ & ACCÈS ═══════════════ */}
            {activeTab === "securite" && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-heading text-2xl font-bold text-foreground">{fr ? "Sécurité & Accès" : "Security & Access"}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{fr ? "MFA et politiques d'accès pour votre cabinet" : "MFA and access policies for your office"}</p>
                </div>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {/* Carte MFA */}
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="font-heading text-base font-semibold text-foreground mb-4">{fr ? "MFA & Politique" : "MFA & Policy"}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium text-foreground">{fr ? "Authentification à deux facteurs" : "Two-factor authentication"}</p>
                      <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-3 py-1 text-xs font-semibold">{fr ? "Activé" : "Enabled"}</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">{fr ? "Méthodes autorisées" : "Allowed methods"}</p>
                        <div className="flex gap-3">
                          {[{ icon: "📱", label: "SMS" }, { icon: "📧", label: "Email" }, { icon: "📱", label: "App" }].map(m => (
                            <label key={m.label} className="flex items-center gap-1.5 text-sm">
                              <input type="checkbox" defaultChecked className="rounded border-border" />
                              <span>{m.icon}</span><span className="text-foreground">{m.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Carte politiques de sécurité */}
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="font-heading text-base font-semibold text-foreground mb-4">{fr ? "Politiques de sécurité" : "Security policies"}</h3>
                    <div className="space-y-3">
                      {[
                        { icon: "🔐", label: fr ? "Authentification MFA" : "MFA", actif: true },
                        { icon: "🔑", label: fr ? "Complexité mots de passe" : "Password complexity", actif: true },
                        { icon: "⏰", label: fr ? "Durée de session" : "Session duration", actif: autoLogout },
                      ].map(pol => (
                        <div key={pol.label} className="flex items-center gap-3 rounded-lg border border-border p-3">
                          <span className="text-xl shrink-0">{pol.icon}</span>
                          <span className="text-sm font-medium text-foreground flex-1">{pol.label}</span>
                          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", pol.actif ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>{pol.actif ? (fr ? "Actif" : "Active") : (fr ? "Inactif" : "Inactive")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ═══ Durée de session et déconnexion automatique ═══ */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Timer className="h-5 w-5 text-primary" />
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      {fr ? "⏰ Durée de session" : "⏰ Session Duration"}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {fr
                      ? "Déconnexion automatique après une période d'inactivité pour protéger les données sensibles du cabinet."
                      : "Automatic logout after a period of inactivity to protect sensitive office data."}
                  </p>

                  {/* Activer/Désactiver la déconnexion automatique */}
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{fr ? "Déconnexion automatique" : "Auto logout"}</p>
                      <p className="text-xs text-muted-foreground">{fr ? "Déconnecter après inactivité" : "Disconnect after inactivity"}</p>
                    </div>
                    <Switch checked={autoLogout} onCheckedChange={v => { setAutoLogout(v); toast.success(fr ? (v ? "Déconnexion automatique activée" : "Déconnexion automatique désactivée") : (v ? "Auto logout enabled" : "Auto logout disabled")); }} />
                  </div>

                  {/* Sélection de la durée */}
                  {autoLogout && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{fr ? "Délai d'inactivité" : "Inactivity timeout"}</p>
                        <span className="text-sm font-bold text-primary">{sessionTimeout} min</span>
                      </div>
                      <Select value={sessionTimeout} onValueChange={v => { setSessionTimeout(v); toast.success(fr ? `Durée de session : ${v} minutes` : `Session timeout: ${v} minutes`); }}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { v: "5", l: "5 minutes" },
                            { v: "10", l: "10 minutes" },
                            { v: "15", l: "15 minutes" },
                            { v: "30", l: "30 minutes" },
                            { v: "60", l: fr ? "1 heure" : "1 hour" },
                            { v: "120", l: fr ? "2 heures" : "2 hours" },
                            { v: "480", l: fr ? "8 heures" : "8 hours" },
                          ].map(o => (
                            <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground italic">
                        {fr
                          ? "⚠️ Les sessions inactives seront automatiquement fermées après ce délai."
                          : "⚠️ Inactive sessions will be automatically closed after this delay."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════ PARAMÈTRES ═══════════════ */}
            {activeTab === "parametres" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h1 className="font-heading text-2xl font-bold text-foreground">{fr ? "Paramètres" : "Settings"}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{fr ? "Configuration de votre cabinet" : "Your office configuration"}</p>
                </div>

                {/* ═══ Taille de police ═══ */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <Type className="h-5 w-5 text-primary" />
                    <h2 className="font-heading text-sm font-semibold text-foreground">{fr ? "Taille de police" : "Font Size"}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {fr ? "Ajustez la taille du texte dans toute l'application." : "Adjust text size across the entire application."}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">A</span>
                    <Slider
                      value={[fontSize]}
                      onValueChange={([v]) => setFontSize(v)}
                      min={12}
                      max={22}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold text-muted-foreground">A</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-foreground">{fr ? "Aperçu" : "Preview"}: <span style={{ fontSize: `${fontSize}px` }}>{fr ? "Texte d'exemple" : "Sample text"}</span></p>
                    <span className="text-xs font-mono text-muted-foreground">{fontSize}px</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setFontSize(14)}>
                      {fr ? "Petit" : "Small"} (14)
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setFontSize(16)}>
                      {fr ? "Normal" : "Normal"} (16)
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setFontSize(18)}>
                      {fr ? "Grand" : "Large"} (18)
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setFontSize(20)}>
                      {fr ? "Très grand" : "Extra Large"} (20)
                    </Button>
                  </div>
                </div>

                {/* Notifications */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <h2 className="font-heading text-sm font-semibold text-foreground">Notifications</h2>
                  {[
                    { l: fr ? "Notifications par email" : "Email notifications", desc: fr ? "Recevoir un résumé quotidien par email" : "Receive a daily summary by email", checked: notifEmail, onChange: setNotifEmail },
                    { l: fr ? "Notifications push" : "Push notifications", desc: fr ? "Alertes en temps réel dans le navigateur" : "Real-time browser alerts", checked: notifPush, onChange: setNotifPush },
                    { l: fr ? "Rappels d'échéances" : "Deadline reminders", desc: fr ? "Notifications avant les échéances des dossiers" : "Notifications before case deadlines", checked: notifReminder, onChange: setNotifReminder },
                    { l: fr ? "🎓 Formation terminée" : "🎓 Training completed", desc: fr ? "Recevoir une notification quand un employé termine une formation" : "Get notified when an employee completes a training", checked: notifFormation, onChange: setNotifFormation },
                  ].map(n => (
                    <div key={n.l} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{n.l}</p>
                        <p className="text-xs text-muted-foreground">{n.desc}</p>
                      </div>
                      <Switch checked={n.checked} onCheckedChange={n.onChange} />
                    </div>
                  ))}
                </div>

                {/* Sauvegarde & Export */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <h2 className="font-heading text-sm font-semibold text-foreground">{fr ? "Sauvegarde & Export" : "Backup & Export"}</h2>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{fr ? "Sauvegarde automatique" : "Automatic backup"}</p>
                      <p className="text-xs text-muted-foreground">{fr ? "Dernière sauvegarde : 09/03/2026 à 02:00" : "Last backup: 09/03/2026 at 02:00"}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.success(fr ? "Sauvegarde lancée" : "Backup started")}>{fr ? "Sauvegarder maintenant" : "Backup now"}</Button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{fr ? "Exporter toutes les données" : "Export all data"}</p>
                      <p className="text-xs text-muted-foreground">{fr ? "Format JSON ou CSV" : "JSON or CSV format"}</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success(fr ? "Export en cours..." : "Exporting...")}>
                      <Download className="h-4 w-4" /> {fr ? "Exporter" : "Export"}
                    </Button>
                  </div>
                </div>

                {/* Répartition du stockage */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{fr ? "Répartition du stockage" : "Storage breakdown"}</h2>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                          {pieData.map(e => <Cell key={e.name} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col justify-center space-y-3">
                      {pieData.map(d => (
                        <div key={d.name} className="flex items-center gap-3">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-sm text-foreground flex-1">{d.name}</span>
                          <span className="text-sm font-medium text-foreground">{d.value} Go</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Zone dangereuse — uniquement visible pour l'administrateur global */}
                {isAdminGlobal && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
                    <h2 className="font-heading text-sm font-semibold text-destructive">{fr ? "Zone dangereuse" : "Danger zone"}</h2>
                    <p className="text-xs text-muted-foreground">{fr ? "Ces actions sont irréversibles." : "These actions are irreversible."}</p>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10">{fr ? "Réinitialiser les paramètres" : "Reset settings"}</Button>
                      <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10">{fr ? "Supprimer le cabinet" : "Delete office"}</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
