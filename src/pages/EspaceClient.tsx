// ═══════════════════════════════════════════════════════════════
// Page Espace Client — Interface du portail client personnel
// Permet au client de consulter ses dossiers, documents, messages
// et de gérer son profil et son mot de passe
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, FileText, MessageSquare, Bell, Settings, LogOut, Upload, CheckCircle, Clock, XCircle, AlertTriangle, Send, User, ChevronRight, Eye, EyeOff, Save, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const currentClient = {
  id: "1", nom: "Camara", prenom: "Fatoumata", email: "fatoumata.camara@email.com", telephone: "620 24 26 15", cabinet: "Cabinet Maître Sylla",
};

const clientDossiers = [
  { id: "1", code: "N-2025-101", typeActe: "Vente immobilière", objet: "Vente terrain Kipé", statut: "En cours" as const, avancement: 65, notaire: "Me Sylla", derniereMAJ: "2026-03-08", etapes: [
    { nom: "Réception du dossier", nomEN: "Case reception", statut: "completed" },
    { nom: "Vérification des pièces", nomEN: "Document verification", statut: "completed" },
    { nom: "Rédaction de l'acte", nomEN: "Deed drafting", statut: "active" },
    { nom: "Signature", nomEN: "Signature", statut: "pending" },
    { nom: "Enregistrement", nomEN: "Registration", statut: "pending" },
  ]},
  { id: "2", code: "N-2025-104", typeActe: "Succession", objet: "Succession Barry", statut: "En attente pièces" as const, avancement: 30, notaire: "Me Sylla", derniereMAJ: "2026-03-05", etapes: [
    { nom: "Réception du dossier", nomEN: "Case reception", statut: "completed" },
    { nom: "Collecte des pièces", nomEN: "Document collection", statut: "active" },
    { nom: "Analyse juridique", nomEN: "Legal analysis", statut: "pending" },
    { nom: "Rédaction", nomEN: "Drafting", statut: "pending" },
    { nom: "Signature", nomEN: "Signature", statut: "pending" },
  ]},
];

const clientDocuments = [
  { id: "1", nom: "Acte de vente DOS-2026-001.pdf", type: "Acte", date: "2026-02-20", statut: "Lu", taille: "2.4 MB" },
  { id: "2", nom: "Facture FAC-2026-001.pdf", type: "Facture", date: "2026-02-22", statut: "Lu", taille: "156 KB" },
  { id: "3", nom: "Reçu de paiement PAI-2026-001.pdf", type: "Reçu", date: "2026-03-01", statut: "Non lu", taille: "98 KB" },
  { id: "4", nom: "Copie succession DOS-2026-003.pdf", type: "Acte", date: "2026-03-05", statut: "Non lu", taille: "3.1 MB" },
];

const clientMessages = [
  { id: "1", from: "Cabinet", message: "Votre dossier N-2025-101 progresse. L'acte de vente est en cours de rédaction.", date: "2026-03-08 14:30", direction: "received" as const },
  { id: "2", from: "Vous", message: "Bien reçu, je vous remercie pour la mise à jour.", date: "2026-03-09 09:15", direction: "sent" as const },
  { id: "3", from: "Cabinet", message: "Merci de nous fournir les documents complémentaires pour votre dossier de succession.", date: "2026-03-05 11:00", direction: "received" as const },
];

const clientNotifications = [
  { id: "1", event: "Progression dossier N-2025-101 — Rédaction de l'acte en cours", eventEN: "Case N-2025-101 progress — Deed drafting in progress", channel: "Email", status: "delivered", date: "2026-03-08 14:30", read: true },
  { id: "2", event: "Nouveau document disponible — Copie succession DOS-2026-003.pdf", eventEN: "New document available — Succession copy DOS-2026-003.pdf", channel: "Email + SMS", status: "delivered", date: "2026-03-05 11:00", read: true },
  { id: "3", event: "Action requise — Documents manquants pour dossier N-2025-104", eventEN: "Action required — Missing documents for case N-2025-104", channel: "Email + SMS", status: "delivered", date: "2026-03-04 16:45", read: false },
  { id: "4", event: "Facture émise — FAC-2026-001 d'un montant de 1 500 000 GNF", eventEN: "Invoice issued — FAC-2026-001 for 1,500,000 GNF", channel: "Email", status: "delivered", date: "2026-02-22 10:00", read: true },
  { id: "5", event: "Statut de votre dossier N-2025-101 mis à jour — En cours", eventEN: "Case N-2025-101 status updated — In progress", channel: "SMS", status: "delivered", date: "2026-02-20 08:30", read: true },
];

const documentRequests = [
  { id: "1", dossierId: "2", dossierCode: "N-2025-104", document: "Certificat de décès", documentEN: "Death certificate", description: "Copie intégrale du certificat de décès du défunt", descriptionEN: "Full copy of the deceased's death certificate", statut: "pending" as const, dateRequest: "2026-03-04", dateSubmitted: null as string | null },
  { id: "2", dossierId: "2", dossierCode: "N-2025-104", document: "Acte de naissance", documentEN: "Birth certificate", description: "Acte de naissance de chaque héritier", descriptionEN: "Birth certificate of each heir", statut: "pending" as const, dateRequest: "2026-03-04", dateSubmitted: null as string | null },
  { id: "3", dossierId: "1", dossierCode: "N-2025-101", document: "Titre foncier", documentEN: "Land title", description: "Copie certifiée du titre foncier du terrain", descriptionEN: "Certified copy of the land title", statut: "submitted" as const, dateRequest: "2026-02-18", dateSubmitted: "2026-02-20" },
];

type Tab = "dossiers" | "documents" | "messages" | "notifications" | "preferences";

export default function EspaceClient() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<Tab>("dossiers");
  const [selectedDossier, setSelectedDossier] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(clientMessages);
  const [docRequests, setDocRequests] = useState(documentRequests);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadRequestId, setUploadRequestId] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");

  const pendingRequests = docRequests.filter(r => r.statut === "pending");
  const isEN = lang === "EN";
  const dateLocale = isEN ? "en-US" : "fr-FR";

  // Profil éditable
  const [profileForm, setProfileForm] = useState({
    prenom: currentClient.prenom,
    nom: currentClient.nom,
    email: currentClient.email,
    telephone: currentClient.telephone,
    adresse: "",
  });
  const [editingProfile, setEditingProfile] = useState(false);

  // Changement mot de passe
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", newPwd: "", confirm: "" });
  const [showPwdCurrent, setShowPwdCurrent] = useState(false);
  const [showPwdNew, setShowPwdNew] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);

  const passwordChecks = [
    { label: isEN ? "8 characters minimum" : "8 caractères minimum", valid: passwordForm.newPwd.length >= 8 },
    { label: isEN ? "One uppercase" : "Une majuscule", valid: /[A-Z]/.test(passwordForm.newPwd) },
    { label: isEN ? "One lowercase" : "Une minuscule", valid: /[a-z]/.test(passwordForm.newPwd) },
    { label: isEN ? "One number" : "Un chiffre", valid: /[0-9]/.test(passwordForm.newPwd) },
    { label: isEN ? "One special character" : "Un caractère spécial", valid: /[^A-Za-z0-9]/.test(passwordForm.newPwd) },
  ];
  const allPwdValid = passwordChecks.every(c => c.valid);

  const handleSaveProfile = () => {
    toast.success(isEN ? "Profile updated successfully!" : "Profil mis à jour avec succès !");
    setEditingProfile(false);
  };

  const handleChangePassword = () => {
    if (!allPwdValid) { toast.error(isEN ? "Password does not meet requirements" : "Le mot de passe ne respecte pas les critères"); return; }
    if (passwordForm.newPwd !== passwordForm.confirm) { toast.error(isEN ? "Passwords do not match" : "Les mots de passe ne correspondent pas"); return; }
    toast.success(isEN ? "Password changed successfully!" : "Mot de passe modifié avec succès !");
    setPasswordForm({ current: "", newPwd: "", confirm: "" });
    setShowPasswordSection(false);
  };

  const [notifPrefs, setNotifPrefs] = useState({
    email: true, sms: true, caseProgress: true, newDocument: true, actionRequired: true, invoiceIssued: true, paymentConfirmed: true, statusChange: true,
  });

  const statusIcon = (s: string) => {
    if (s === "delivered") return <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />;
    if (s === "pending") return <Clock className="h-3.5 w-3.5 text-amber-500" />;
    return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, {
      id: String(Date.now()), from: isEN ? "You" : "Vous", message: newMessage,
      date: new Date().toISOString().slice(0, 16).replace("T", " "), direction: "sent",
    }]);
    setNewMessage("");
    toast.success(t("espace.messageSent"));
  };

  const handleUploadDocument = () => {
    if (!uploadRequestId || !uploadFileName.trim()) return;
    setDocRequests(prev => prev.map(r => r.id === uploadRequestId ? { ...r, statut: "submitted" as const, dateSubmitted: new Date().toISOString().slice(0, 10) } : r));
    setShowUploadModal(false);
    setUploadFileName("");
    toast.success(t("espace.docSubmitted"));
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: "dossiers", label: t("espace.tabDossiers"), icon: FolderOpen },
    { key: "documents", label: t("espace.tabDocuments"), icon: FileText, badge: clientDocuments.filter(d => d.statut === "Non lu").length },
    { key: "messages", label: t("espace.tabMessages"), icon: MessageSquare },
    { key: "notifications", label: t("espace.tabNotifications"), icon: Bell, badge: clientNotifications.filter(n => !n.read).length },
    { key: "preferences", label: t("espace.tabPreferences"), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1B6B93] flex items-center justify-center text-white font-bold text-sm">N</div>
            <div>
              <p className="text-sm font-semibold text-foreground">{currentClient.cabinet}</p>
              <p className="text-[10px] text-muted-foreground">{t("login.clientPortal")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingRequests.length > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-[11px] font-medium text-amber-700">{pendingRequests.length} {t("espace.docsRequired")}</span>
              </div>
            )}
            <LanguageSwitcher />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#1B6B93]/10 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-[#1B6B93]" />
              </div>
              <span className="text-xs font-medium text-foreground hidden sm:block">{currentClient.prenom} {currentClient.nom}</span>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground text-xs" onClick={() => navigate("/client/login")}>
              <LogOut className="h-3.5 w-3.5 mr-1" /> {t("espace.logout")}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">{t("espace.hello")}, {currentClient.prenom} 👋</h1>
          <p className="text-sm text-muted-foreground">{t("espace.welcome")}</p>
        </motion.div>

        {pendingRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">{t("espace.docsRequiredTitle")}</p>
                <p className="text-xs text-amber-700 mt-1">{t("espace.docsRequiredDesc")} {pendingRequests.length} {t("espace.docsRequiredSuffix")}</p>
                <div className="mt-3 space-y-2">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between bg-white rounded-lg border border-amber-200 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{isEN ? req.documentEN : req.document}</p>
                        <p className="text-xs text-muted-foreground">{t("espace.case")} {req.dossierCode} — {isEN ? req.descriptionEN : req.description}</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => { setUploadRequestId(req.id); setShowUploadModal(true); }}>
                        <Upload className="h-3.5 w-3.5 mr-1" /> {t("espace.submit")}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 rounded-xl bg-white border border-border p-1 mb-6 shadow-sm">
          {tabs.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${tab === tb.key ? "bg-[#1B6B93] text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
              <tb.icon className="h-3.5 w-3.5" />
              {tb.label}
              {tb.badge ? <span className={`ml-1 text-[10px] font-bold rounded-full px-1.5 py-0.5 ${tab === tb.key ? "bg-white/20" : "bg-red-100 text-red-600"}`}>{tb.badge}</span> : null}
            </button>
          ))}
        </div>

        {/* DOSSIERS */}
        {tab === "dossiers" && (
          <div className="space-y-4">
            {clientDossiers.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-white p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedDossier(selectedDossier === d.id ? null : d.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1B6B93]/10 flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-[#1B6B93]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{d.code}</p>
                      <p className="text-xs text-muted-foreground">{d.typeActe} — {d.objet}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.statut} />
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${selectedDossier === d.id ? "rotate-90" : ""}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{t("espace.progress")}</span>
                    <span className="font-semibold text-foreground">{d.avancement}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${d.avancement}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-[#1B6B93]" />
                  </div>
                </div>
                {selectedDossier === d.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-5 pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-foreground mb-3">{t("espace.caseSteps")}</p>
                    <div className="space-y-2.5">
                      {d.etapes.map((etape, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            etape.statut === "completed" ? "bg-emerald-100 text-emerald-600" :
                            etape.statut === "active" ? "bg-[#1B6B93]/15 text-[#1B6B93]" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {etape.statut === "completed" ? <CheckCircle className="h-3.5 w-3.5" /> :
                             etape.statut === "active" ? <Clock className="h-3.5 w-3.5" /> :
                             <span className="text-[10px] font-bold">{idx + 1}</span>}
                          </div>
                          <span className={`text-sm ${etape.statut === "completed" ? "text-muted-foreground line-through" : etape.statut === "active" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {isEN ? etape.nomEN : etape.nom}
                          </span>
                          {etape.statut === "active" && <span className="text-[10px] bg-[#1B6B93]/10 text-[#1B6B93] px-2 py-0.5 rounded-full font-medium">{t("espace.inProgress")}</span>}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{t("espace.notaryResponsible")} : <strong className="text-foreground">{d.notaire}</strong></span>
                      <span>•</span>
                      <span>{t("espace.lastUpdate")} : {new Date(d.derniereMAJ).toLocaleDateString(dateLocale)}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* DOCUMENTS */}
        {tab === "documents" && (
          <div className="space-y-4">
            {pendingRequests.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-2">
                <p className="text-xs font-semibold text-amber-800 mb-2">📎 {t("espace.docsToSubmit")}</p>
                {pendingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-white rounded-lg border border-amber-200 px-3 py-2 mb-2 last:mb-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{isEN ? req.documentEN : req.document}</p>
                      <p className="text-xs text-muted-foreground">{req.dossierCode} — {isEN ? req.descriptionEN : req.description}</p>
                    </div>
                    <Button size="sm" onClick={() => { setUploadRequestId(req.id); setShowUploadModal(true); }}>
                      <Upload className="h-3.5 w-3.5 mr-1" /> {t("espace.submit")}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-sm font-semibold text-foreground">{t("espace.sharedDocs")}</h3>
            {clientDocuments.map((doc, i) => (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.nom}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{new Date(doc.date).toLocaleDateString(dateLocale)}</span>
                    <span>•</span>
                    <span>{doc.taille}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{doc.type}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${doc.statut === "Non lu" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                  {doc.statut === "Non lu" ? t("espace.unread") : t("espace.read")}
                </span>
                <Button variant="ghost" size="sm" className="text-xs">{t("espace.download")}</Button>
              </motion.div>
            ))}

            {docRequests.filter(r => r.statut === "submitted").length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-foreground mt-6">{t("espace.submittedDocs")}</h3>
                {docRequests.filter(r => r.statut === "submitted").map(req => (
                  <div key={req.id} className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{isEN ? req.documentEN : req.document}</p>
                      <p className="text-xs text-muted-foreground">{t("espace.case")} {req.dossierCode} — {t("espace.submittedOn")} {req.dateSubmitted ? new Date(req.dateSubmitted).toLocaleDateString(dateLocale) : ""}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{t("espace.submitted")}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* MESSAGES */}
        {tab === "messages" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className={`flex ${msg.direction === "sent" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-xl p-3 ${msg.direction === "sent" ? "bg-[#1B6B93] text-white" : "bg-muted"}`}>
                      <p className={`text-sm ${msg.direction === "sent" ? "text-white" : "text-foreground"}`}>{msg.message}</p>
                      <p className={`text-[10px] mt-1.5 ${msg.direction === "sent" ? "text-white/60" : "text-muted-foreground"}`}>
                        {msg.from} • {msg.date}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="border-t border-border p-4 flex gap-2">
                <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t("espace.writeMessage")} className="flex-1 min-h-[40px] max-h-[100px] resize-none" rows={1}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="bg-[#1B6B93] hover:bg-[#155A7A]">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <div className="space-y-3">
            {clientNotifications.map((notif, i) => (
              <motion.div key={notif.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`rounded-xl border bg-white p-4 shadow-sm flex items-start gap-3 ${!notif.read ? "border-[#1B6B93]/30 bg-[#1B6B93]/[0.02]" : "border-border"}`}>
                <div className="mt-0.5">{statusIcon(notif.status)}</div>
                <div className="flex-1">
                  <p className={`text-sm ${!notif.read ? "font-semibold text-foreground" : "text-foreground"}`}>{isEN ? notif.eventEN : notif.event}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{notif.date}</span>
                    <span>•</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{notif.channel}</span>
                    <span>•</span>
                    <span className="capitalize">{notif.status === "delivered" ? t("espace.delivered") : notif.status === "pending" ? t("espace.pending") : t("espace.failed")}</span>
                  </div>
                </div>
                {!notif.read && <span className="w-2 h-2 rounded-full bg-[#1B6B93] shrink-0 mt-1.5" />}
              </motion.div>
            ))}
          </div>
        )}

        {/* PREFERENCES */}
        {tab === "preferences" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">{t("espace.notifChannels")}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                  <span className="text-sm text-foreground">📧 {t("espace.emailNotifs")}</span>
                  <Switch checked={notifPrefs.email} onCheckedChange={(v) => setNotifPrefs(p => ({ ...p, email: v }))} />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                  <span className="text-sm text-foreground">📱 {t("espace.smsNotifs")}</span>
                  <Switch checked={notifPrefs.sms} onCheckedChange={(v) => setNotifPrefs(p => ({ ...p, sms: v }))} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">{t("espace.notifEvents")}</h3>
              <div className="space-y-3">
                {[
                  { key: "caseProgress" as const, label: t("espace.caseProgressEvent") },
                  { key: "newDocument" as const, label: t("espace.newDocEvent") },
                  { key: "actionRequired" as const, label: t("espace.actionRequiredEvent") },
                  { key: "invoiceIssued" as const, label: t("espace.invoiceEvent") },
                  { key: "paymentConfirmed" as const, label: t("espace.paymentEvent") },
                  { key: "statusChange" as const, label: t("espace.statusChangeEvent") },
                ].map(e => (
                  <div key={e.key} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                    <span className="text-sm text-foreground">{e.label}</span>
                    <Switch checked={notifPrefs[e.key]} onCheckedChange={(v) => setNotifPrefs(p => ({ ...p, [e.key]: v }))} />
                  </div>
                ))}
              </div>
            </div>

            {/* Mes informations — éditable */}
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">{t("espace.myInfo")}</h3>
                {!editingProfile ? (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingProfile(true)}>
                    <User className="h-3.5 w-3.5" /> {isEN ? "Edit" : "Modifier"}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingProfile(false)}>{isEN ? "Cancel" : "Annuler"}</Button>
                    <Button size="sm" className="gap-1.5 bg-[#1B6B93] hover:bg-[#155A7A]" onClick={handleSaveProfile}>
                      <Save className="h-3.5 w-3.5" /> {isEN ? "Save" : "Enregistrer"}
                    </Button>
                  </div>
                )}
              </div>
              {!editingProfile ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">{isEN ? "First name" : "Prénom"} :</span> <strong className="text-foreground">{profileForm.prenom}</strong></div>
                  <div><span className="text-muted-foreground">{isEN ? "Last name" : "Nom"} :</span> <strong className="text-foreground">{profileForm.nom}</strong></div>
                  <div><span className="text-muted-foreground">{t("label.email")} :</span> <strong className="text-foreground">{profileForm.email}</strong></div>
                  <div><span className="text-muted-foreground">{t("espace.phone")} :</span> <strong className="text-foreground">{profileForm.telephone}</strong></div>
                  <div><span className="text-muted-foreground">{isEN ? "Address" : "Adresse"} :</span> <strong className="text-foreground">{profileForm.adresse || (isEN ? "Not specified" : "Non renseignée")}</strong></div>
                  <div><span className="text-muted-foreground">{t("espace.office")} :</span> <strong className="text-foreground">{currentClient.cabinet}</strong></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isEN ? "First name" : "Prénom"}</Label>
                    <Input value={profileForm.prenom} onChange={e => setProfileForm(p => ({ ...p, prenom: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isEN ? "Last name" : "Nom"}</Label>
                    <Input value={profileForm.nom} onChange={e => setProfileForm(p => ({ ...p, nom: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("label.email")}</Label>
                    <Input type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("espace.phone")}</Label>
                    <Input value={profileForm.telephone} onChange={e => setProfileForm(p => ({ ...p, telephone: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">{isEN ? "Address" : "Adresse"}</Label>
                    <Input value={profileForm.adresse} onChange={e => setProfileForm(p => ({ ...p, adresse: e.target.value }))} placeholder={isEN ? "Your address" : "Votre adresse"} />
                  </div>
                </div>
              )}
            </div>

            {/* Changement de mot de passe */}
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <KeyRound className="h-4 w-4" /> {isEN ? "Change password" : "Changer le mot de passe"}
                </h3>
                {!showPasswordSection && (
                  <Button variant="outline" size="sm" onClick={() => setShowPasswordSection(true)}>
                    {isEN ? "Change" : "Modifier"}
                  </Button>
                )}
              </div>
              {showPasswordSection && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isEN ? "Current password" : "Mot de passe actuel"}</Label>
                    <div className="relative">
                      <Input type={showPwdCurrent ? "text" : "password"} value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} />
                      <button type="button" onClick={() => setShowPwdCurrent(!showPwdCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPwdCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isEN ? "New password" : "Nouveau mot de passe"}</Label>
                      <div className="relative">
                        <Input type={showPwdNew ? "text" : "password"} value={passwordForm.newPwd} onChange={e => setPasswordForm(p => ({ ...p, newPwd: e.target.value }))} />
                        <button type="button" onClick={() => setShowPwdNew(!showPwdNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPwdNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{isEN ? "Confirm new password" : "Confirmer le nouveau mot de passe"}</Label>
                      <div className="relative">
                        <Input type={showPwdConfirm ? "text" : "password"} value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} />
                        <button type="button" onClick={() => setShowPwdConfirm(!showPwdConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPwdConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {passwordForm.newPwd && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {passwordChecks.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          <CheckCircle className={`h-3.5 w-3.5 ${c.valid ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                          <span className={c.valid ? "text-emerald-600" : "text-muted-foreground"}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => { setShowPasswordSection(false); setPasswordForm({ current: "", newPwd: "", confirm: "" }); }}>
                      {isEN ? "Cancel" : "Annuler"}
                    </Button>
                    <Button size="sm" className="bg-[#1B6B93] hover:bg-[#155A7A]" onClick={handleChangePassword} disabled={!passwordForm.current || !allPwdValid || passwordForm.newPwd !== passwordForm.confirm}>
                      {isEN ? "Update password" : "Mettre à jour"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("espace.submitDoc")}</DialogTitle>
            <DialogDescription>
              {uploadRequestId && (isEN ? docRequests.find(r => r.id === uploadRequestId)?.descriptionEN : docRequests.find(r => r.id === uploadRequestId)?.description)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("espace.fileToSubmit")} *</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-[#1B6B93]/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("espace.dragDrop")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("espace.fileFormats")}</p>
                <Input type="text" placeholder={t("espace.fileNamePlaceholder")} value={uploadFileName} onChange={(e) => setUploadFileName(e.target.value)} className="mt-3" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>{t("action.cancel")}</Button>
            <Button onClick={handleUploadDocument} disabled={!uploadFileName.trim()} className="bg-[#1B6B93] hover:bg-[#155A7A]">
              <Upload className="h-3.5 w-3.5 mr-1" /> {t("espace.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
