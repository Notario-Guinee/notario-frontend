// ═══════════════════════════════════════════════════════════════
// Page Portail Client — Configuration de l'espace client en ligne
// Permet au gérant d'activer/désactiver les fonctionnalités du
// portail, de partager des documents et d'envoyer des invitations
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Globe, FileText, Send, Bell, FolderOpen, Share2, MessageSquare, Settings, CheckCircle, XCircle, Clock, Plus, Upload, AlertTriangle, FileUp, Search } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { mockClients, mockDossiers } from "@/data/mockData";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { searchMatch } from "@/lib/utils";

type PortailClientData = {
  clientId: string;
  actif: boolean;
  documentsPartages: number;
  notifEmail: boolean;
  notifSms: boolean;
  derniereConnexion: string;
};

const portailData: PortailClientData[] = [
  { clientId: "1", actif: true, documentsPartages: 3, notifEmail: true, notifSms: false, derniereConnexion: "2026-03-08" },
  { clientId: "2", actif: true, documentsPartages: 1, notifEmail: true, notifSms: true, derniereConnexion: "2026-02-28" },
  { clientId: "3", actif: false, documentsPartages: 0, notifEmail: true, notifSms: false, derniereConnexion: "—" },
  { clientId: "4", actif: true, documentsPartages: 5, notifEmail: true, notifSms: true, derniereConnexion: "2026-03-09" },
  { clientId: "5", actif: false, documentsPartages: 0, notifEmail: false, notifSms: false, derniereConnexion: "—" },
];

const docsPartages = [
  { id: "1", clientId: "1", clientName: "Camara Fatoumata", nom: "Acte de vente DOS-2026-001.pdf", datePartage: "2026-02-20", statut: "Lu", type: "Acte" },
  { id: "2", clientId: "1", clientName: "Camara Fatoumata", nom: "Facture FAC-2026-001.pdf", datePartage: "2026-02-22", statut: "Lu", type: "Facture" },
  { id: "3", clientId: "4", clientName: "Soumah Aissatou", nom: "Acte DOS-2025-048.pdf", datePartage: "2025-12-16", statut: "Non lu", type: "Acte" },
  { id: "4", clientId: "2", clientName: "SCI Les Palmiers", nom: "Reçu PAI-2026-002.pdf", datePartage: "2026-02-26", statut: "Lu", type: "Reçu" },
  { id: "5", clientId: "4", clientName: "Soumah Aissatou", nom: "Copie succession DOS-2026-003.pdf", datePartage: "2026-03-01", statut: "Non lu", type: "Acte" },
];

type SharedCase = { id: string; dossierCode: string; clientId: string; clientName: string; dateShared: string; };
type SecureMessage = { id: string; clientId: string; clientName: string; message: string; date: string; direction: "sent" | "received"; };
type NotifLog = { id: string; clientName: string; event: string; channel: "Email" | "SMS" | "Email + SMS"; status: "delivered" | "pending" | "failed"; date: string; };
type DocRequest = { id: string; clientId: string; clientName: string; dossierCode: string; document: string; description: string; statut: "pending" | "submitted" | "accepted" | "rejected"; dateRequest: string; dateSubmitted: string | null; fileName: string | null; };

const initialSharedCases: SharedCase[] = [
  { id: "1", dossierCode: "N-2025-101", clientId: "1", clientName: "Camara Fatoumata", dateShared: "2026-02-15" },
  { id: "2", dossierCode: "N-2025-104", clientId: "4", clientName: "Soumah Aissatou", dateShared: "2026-01-10" },
];

const initialMessages: SecureMessage[] = [
  { id: "1", clientId: "1", clientName: "Camara Fatoumata", message: "Votre dossier N-2025-101 progresse. L'acte de vente est en cours de rédaction.", date: "2026-03-08", direction: "sent" },
  { id: "2", clientId: "4", clientName: "Soumah Aissatou", message: "Merci de nous fournir les documents complémentaires pour votre dossier de succession.", date: "2026-03-05", direction: "sent" },
  { id: "3", clientId: "1", clientName: "Camara Fatoumata", message: "Bien reçu, je vous remercie pour la mise à jour.", date: "2026-03-09", direction: "received" },
];

const initialNotifLogs: NotifLog[] = [
  { id: "1", clientName: "Camara Fatoumata", event: "Progression dossier N-2025-101", channel: "Email", status: "delivered", date: "2026-03-08" },
  { id: "2", clientName: "Soumah Aissatou", event: "Nouveau document disponible", channel: "Email + SMS", status: "delivered", date: "2026-03-05" },
  { id: "3", clientName: "SCI Les Palmiers", event: "Facture émise FAC-2026-002", channel: "Email", status: "delivered", date: "2026-02-26" },
  { id: "4", clientName: "Camara Fatoumata", event: "Action requise — signature", channel: "SMS", status: "pending", date: "2026-03-10" },
  { id: "5", clientName: "Barry Ousmane", event: "Changement statut dossier", channel: "Email", status: "failed", date: "2026-03-01" },
];

const initialDocRequests: DocRequest[] = [
  { id: "1", clientId: "4", clientName: "Soumah Aissatou", dossierCode: "N-2025-104", document: "Certificat de décès", description: "Copie intégrale du certificat de décès du défunt", statut: "pending", dateRequest: "2026-03-04", dateSubmitted: null, fileName: null },
  { id: "2", clientId: "4", clientName: "Soumah Aissatou", dossierCode: "N-2025-104", document: "Acte de naissance", description: "Acte de naissance de chaque héritier", statut: "pending", dateRequest: "2026-03-04", dateSubmitted: null, fileName: null },
  { id: "3", clientId: "1", clientName: "Camara Fatoumata", dossierCode: "N-2025-101", document: "Titre foncier", description: "Copie certifiée du titre foncier du terrain", statut: "submitted", dateRequest: "2026-02-18", dateSubmitted: "2026-02-20", fileName: "titre_foncier_kipe.pdf" },
];

type Tab = "overview" | "cases" | "documents" | "communication" | "notifications" | "preferences" | "doc-requests";

export default function PortailClient() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("overview");
  const [portail, setPortail] = useState(portailData);
  const [sharedCases, setSharedCases] = useState(initialSharedCases);
  const [messages, setMessages] = useState(initialMessages);
  const [notifLogs] = useState(initialNotifLogs);
  const [docRequests, setDocRequests] = useState(initialDocRequests);

  // Share dossier modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareForm, setShareForm] = useState({ clientId: "", dossierCode: "" });

  // Send message modal
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgForm, setMsgForm] = useState({ clientId: "", message: "" });

  // Doc request modal
  const [showDocRequestModal, setShowDocRequestModal] = useState(false);
  const [docRequestForm, setDocRequestForm] = useState({ clientId: "", dossierCode: "", document: "", description: "" });
  const [docClientSearch, setDocClientSearch] = useState("");

  // Notification preferences
  const [notifEvents, setNotifEvents] = useState([
    { key: "case_progress", label: t("portail.caseProgress_event"), active: true },
    { key: "new_document", label: t("portail.newDocument_event"), active: true },
    { key: "action_required", label: t("portail.actionRequired_event"), active: true },
    { key: "invoice_issued", label: t("portail.invoiceIssued_event"), active: true },
    { key: "payment_confirmed", label: t("portail.paymentConfirmed_event"), active: true },
    { key: "status_change", label: t("portail.statusChange_event"), active: true },
  ]);

  const toggleAcces = (clientId: string) => {
    setPortail(prev => prev.map(p => p.clientId === clientId ? { ...p, actif: !p.actif } : p));
  };

  const toggleNotifEmail = (clientId: string) => {
    setPortail(prev => prev.map(p => p.clientId === clientId ? { ...p, notifEmail: !p.notifEmail } : p));
  };

  const toggleNotifSms = (clientId: string) => {
    setPortail(prev => prev.map(p => p.clientId === clientId ? { ...p, notifSms: !p.notifSms } : p));
  };

  const handleShareCase = () => {
    const client = mockClients.find(c => c.id === shareForm.clientId);
    if (!client || !shareForm.dossierCode) return;
    setSharedCases(prev => [...prev, {
      id: String(Date.now()), dossierCode: shareForm.dossierCode,
      clientId: shareForm.clientId, clientName: `${client.nom} ${client.prenom}`,
      dateShared: new Date().toISOString().slice(0, 10),
    }]);
    setShowShareModal(false);
    setShareForm({ clientId: "", dossierCode: "" });
    toast.success(t("portail.shareDossier") + " ✓");
  };

  const handleSendMessage = () => {
    const client = mockClients.find(c => c.id === msgForm.clientId);
    if (!client || !msgForm.message) return;
    setMessages(prev => [...prev, {
      id: String(Date.now()), clientId: msgForm.clientId,
      clientName: `${client.nom} ${client.prenom}`, message: msgForm.message,
      date: new Date().toISOString().slice(0, 10), direction: "sent",
    }]);
    setShowMsgModal(false);
    setMsgForm({ clientId: "", message: "" });
    toast.success(t("portail.sendMessage") + " ✓");
  };

  const handleDocRequest = () => {
    const client = mockClients.find(c => c.id === docRequestForm.clientId);
    if (!client || !docRequestForm.dossierCode || !docRequestForm.document) return;
    setDocRequests(prev => [...prev, {
      id: String(Date.now()),
      clientId: docRequestForm.clientId,
      clientName: `${client.nom} ${client.prenom}`,
      dossierCode: docRequestForm.dossierCode,
      document: docRequestForm.document,
      description: docRequestForm.description,
      statut: "pending",
      dateRequest: new Date().toISOString().slice(0, 10),
      dateSubmitted: null,
      fileName: null,
    }]);
    setShowDocRequestModal(false);
    setDocRequestForm({ clientId: "", dossierCode: "", document: "", description: "" });
    toast.success(t("portail.toastDocRequestSent"));
  };

  const handleAcceptDoc = (id: string) => {
    setDocRequests(prev => prev.map(r => r.id === id ? { ...r, statut: "accepted" } : r));
    toast.success(t("portail.toastDocAccepted"));
  };

  const handleRejectDoc = (id: string) => {
    setDocRequests(prev => prev.map(r => r.id === id ? { ...r, statut: "rejected" } : r));
    toast.info(t("portail.toastDocRejected"));
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: "overview", label: t("portail.tabOverview"), icon: Globe },
    { key: "cases", label: t("portail.tabCases"), icon: FolderOpen },
    { key: "documents", label: t("portail.tabDocuments"), icon: FileText },
    { key: "doc-requests", label: t("portail.docRequestsTab"), icon: FileUp, badge: docRequests.filter(r => r.statut === "submitted").length },
    { key: "communication", label: t("portail.tabCommunication"), icon: MessageSquare },
    { key: "notifications", label: t("portail.tabNotifications"), icon: Bell },
    { key: "preferences", label: t("portail.tabPreferences"), icon: Settings },
  ];

  const statusIcon = (status: string) => {
    if (status === "delivered") return <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />;
    if (status === "pending") return <Clock className="h-3.5 w-3.5 text-amber-500" />;
    return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  };

  const activeClients = portail.filter(p => p.actif);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/15">
          <Globe className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">{t("portail.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("portail.subtitle")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === tb.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <tb.icon className="h-3.5 w-3.5" />
            {tb.label}
            {tb.badge ? <span className="ml-1 text-[10px] font-bold bg-primary/15 text-primary rounded-full px-1.5 py-0.5">{tb.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: activeClients.length, label: t("portail.activeAccess"), color: "bg-emerald-50 dark:bg-emerald-900/20" },
              { value: portail.reduce((s, p) => s + p.documentsPartages, 0), label: t("portail.sharedDocs"), color: "bg-blue-50 dark:bg-blue-900/20" },
              { value: docRequests.filter(r => r.statut === "submitted").length, label: t("portail.submittedDocs"), color: "bg-purple-50 dark:bg-purple-900/20" },
              { value: docRequests.filter(r => r.statut === "pending").length, label: t("portail.awaitingClient"), color: "bg-amber-50 dark:bg-amber-900/20" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`rounded-xl border border-border p-4 text-center shadow-card ${s.color}`}>
                <p className="font-heading text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-heading text-sm font-semibold text-foreground">{t("portail.clientAccess")}</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[t("label.client"), t("portail.accessPortal"), t("portail.documents"), t("portail.notifEmail"), t("portail.notifSms"), t("portail.lastConnection")].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockClients.map(client => {
                  const p = portail.find(x => x.clientId === client.id);
                  if (!p) return null;
                  return (
                    <motion.tr key={client.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{client.nom} {client.prenom}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </td>
                      <td className="px-4 py-3"><Switch checked={p.actif} onCheckedChange={() => toggleAcces(client.id)} /></td>
                      <td className="px-4 py-3 text-sm text-foreground">{p.documentsPartages}</td>
                      <td className="px-4 py-3"><Switch checked={p.notifEmail} onCheckedChange={() => toggleNotifEmail(client.id)} /></td>
                      <td className="px-4 py-3"><Switch checked={p.notifSms} onCheckedChange={() => toggleNotifSms(client.id)} /></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{p.derniereConnexion !== "—" ? new Date(p.derniereConnexion).toLocaleDateString('fr-FR') : "—"}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== CASES TAB ===== */}
      {tab === "cases" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t("portail.sharedCases")}</h2>
            <Button size="sm" onClick={() => { setShareForm({ clientId: "", dossierCode: "" }); setShowShareModal(true); }}>
              <Share2 className="mr-1 h-4 w-4" /> {t("portail.shareNewCase")}
            </Button>
          </div>
          {sharedCases.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">{t("portail.noSharedCases")}</div>
          ) : (
            <div className="space-y-3">
              {sharedCases.map(sc => {
                const dossier = mockDossiers.find(d => d.code === sc.dossierCode);
                return (
                  <motion.div key={sc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-4 shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FolderOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{sc.dossierCode}</p>
                          <p className="text-xs text-muted-foreground">{dossier?.typeActe} — {dossier?.objet}</p>
                        </div>
                      </div>
                      <StatusBadge status={dossier?.statut || "En cours"} />
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{t("portail.sharedWith")}: <span className="font-medium text-foreground">{sc.clientName}</span></span>
                      <span>{t("portail.caseProgress")}: <span className="font-medium text-foreground">{dossier?.avancement || 0}%</span></span>
                      <span>{new Date(sc.dateShared).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== DOCUMENTS TAB ===== */}
      {tab === "documents" && (
        <div className="space-y-4">
          <h2 className="font-heading text-sm font-semibold text-foreground">{t("portail.recentSharedDocs")}</h2>
          <div className="space-y-3">
            {docsPartages.map((doc, i) => (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.nom}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span>{doc.clientName}</span>
                    <span>•</span>
                    <span>{t("portail.sharedOn")} {new Date(doc.datePartage).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{doc.type}</span>
                <StatusBadge status={doc.statut} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ===== DOC REQUESTS TAB ===== */}
      {tab === "doc-requests" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t("portail.docRequestsTitle")}</h2>
            <Button size="sm" onClick={() => { setDocRequestForm({ clientId: "", dossierCode: "", document: "", description: "" }); setShowDocRequestModal(true); }}>
              <Plus className="mr-1 h-4 w-4" /> {t("portail.requestDoc")}
            </Button>
          </div>

          {/* Submitted - needs attention */}
          {docRequests.filter(r => r.statut === "submitted").length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{t("portail.submittedByClients")}</p>
              </div>
              <div className="space-y-2">
                {docRequests.filter(r => r.statut === "submitted").map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-card rounded-lg border border-border px-4 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{req.document}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.clientName} — {t("portail.caseLabel")} {req.dossierCode} — {t("portail.submittedOn")} {req.dateSubmitted ? new Date(req.dateSubmitted).toLocaleDateString('fr-FR') : ""}
                      </p>
                      {req.fileName && <p className="text-xs text-primary mt-0.5">📎 {req.fileName}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-300 hover:bg-emerald-100" onClick={() => handleAcceptDoc(req.id)}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> {t("portail.accept")}
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleRejectDoc(req.id)}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> {t("portail.reject")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending requests */}
          {docRequests.filter(r => r.statut === "pending").length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("portail.awaitingClientSection")}</h3>
              <div className="space-y-2">
                {docRequests.filter(r => r.statut === "pending").map(req => (
                  <div key={req.id} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800 p-4">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{req.document}</p>
                      <p className="text-xs text-muted-foreground">{req.clientName} — {t("portail.caseLabel")} {req.dossierCode} — {new Date(req.dateRequest).toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs text-muted-foreground italic mt-0.5">{req.description}</p>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{t("portail.pending")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted/Rejected */}
          {docRequests.filter(r => r.statut === "accepted" || r.statut === "rejected").length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("portail.history")}</h3>
              <div className="space-y-2">
                {docRequests.filter(r => r.statut === "accepted" || r.statut === "rejected").map(req => (
                  <div key={req.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                    {req.statut === "accepted" ? <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{req.document}</p>
                      <p className="text-xs text-muted-foreground">{req.clientName} — {t("portail.caseLabel")} {req.dossierCode}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${req.statut === "accepted" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                      {req.statut === "accepted" ? t("portail.accepted") : t("portail.rejected")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== COMMUNICATION TAB ===== */}
      {tab === "communication" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold text-foreground">{t("portail.secureCommunication")}</h2>
            <Button size="sm" onClick={() => { setMsgForm({ clientId: "", message: "" }); setShowMsgModal(true); }}>
              <Send className="mr-1 h-4 w-4" /> {t("portail.sendMessage")}
            </Button>
          </div>
          {messages.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">{t("portail.noMessages")}</div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`rounded-xl border bg-card p-4 ${msg.direction === "sent" ? "border-primary/20" : "border-border"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">{msg.clientName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${msg.direction === "sent" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {msg.direction === "sent" ? t("portail.directionSent") : t("portail.directionReceived")}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{new Date(msg.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-sm text-foreground">{msg.message}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== NOTIFICATIONS TAB ===== */}
      {tab === "notifications" && (
        <div className="space-y-4">
          <h2 className="font-heading text-sm font-semibold text-foreground">{t("portail.notifHistory")}</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[t("label.date"), t("portail.notifSentTo"), t("portail.notifEvent"), t("portail.notifChannel"), t("label.statut")].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notifLogs.map(log => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(log.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{log.clientName}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{log.event}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{log.channel}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(log.status)}
                        <span className="text-xs text-foreground capitalize">
                          {log.status === "delivered" ? t("portail.notifDelivered") : log.status === "pending" ? t("portail.notifPending") : t("portail.notifFailed")}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== PREFERENCES TAB ===== */}
      {tab === "preferences" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("portail.notifEvents")}</h2>
            <div className="space-y-3">
              {notifEvents.map(e => (
                <div key={e.key} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                  <span className="text-sm text-foreground">{e.label}</span>
                  <Switch checked={e.active} onCheckedChange={() => setNotifEvents(prev => prev.map(x => x.key === e.key ? { ...x, active: !x.active } : x))} />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-heading text-sm font-semibold text-foreground mb-4">{t("portail.channels")}</h2>
            <p className="text-xs text-muted-foreground mb-4">{t("portail.customizable")}</p>
            <div className="space-y-3">
              {mockClients.slice(0, 5).map(client => {
                const p = portail.find(x => x.clientId === client.id);
                if (!p) return null;
                return (
                  <div key={client.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                    <span className="text-sm text-foreground">{client.nom} {client.prenom}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.notifEmail && p.notifSms ? t("portail.both") : p.notifEmail ? t("portail.emailOnly") : p.notifSms ? t("portail.smsOnly") : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Share Case Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{t("portail.shareDossier")}</DialogTitle>
            <DialogDescription>{t("portail.selectClientShare")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("label.client")} *</Label>
              <Select value={shareForm.clientId} onValueChange={v => setShareForm(f => ({ ...f, clientId: v }))}>
                <SelectTrigger><SelectValue placeholder={t("factures.selectClient")} /></SelectTrigger>
                <SelectContent>
                  {mockClients.filter(c => portail.find(p => p.clientId === c.id)?.actif).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nom} {c.prenom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("portail.selectDossier")} *</Label>
              <Select value={shareForm.dossierCode} onValueChange={v => setShareForm(f => ({ ...f, dossierCode: v }))}>
                <SelectTrigger><SelectValue placeholder={t("factures.selectCase")} /></SelectTrigger>
                <SelectContent>
                  {mockDossiers.map(d => <SelectItem key={d.id} value={d.code}>{d.code} — {d.objet}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareModal(false)}>{t("action.cancel")}</Button>
            <Button onClick={handleShareCase} disabled={!shareForm.clientId || !shareForm.dossierCode}>{t("portail.shareWithClient")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Modal */}
      <Dialog open={showMsgModal} onOpenChange={setShowMsgModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{t("portail.sendMessage")}</DialogTitle>
            <DialogDescription>{t("portail.selectClientMsg")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("label.client")} *</Label>
              <Select value={msgForm.clientId} onValueChange={v => setMsgForm(f => ({ ...f, clientId: v }))}>
                <SelectTrigger><SelectValue placeholder={t("factures.selectClient")} /></SelectTrigger>
                <SelectContent>
                  {mockClients.filter(c => portail.find(p => p.clientId === c.id)?.actif).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nom} {c.prenom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("portail.messageContent")} *</Label>
              <Textarea value={msgForm.message} onChange={e => setMsgForm(f => ({ ...f, message: e.target.value }))} placeholder="..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMsgModal(false)}>{t("action.cancel")}</Button>
            <Button onClick={handleSendMessage} disabled={!msgForm.clientId || !msgForm.message}>
              <Send className="mr-1 h-4 w-4" /> {t("action.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doc Request Modal */}
      <Dialog open={showDocRequestModal} onOpenChange={setShowDocRequestModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{t("portail.requestDocTitle")}</DialogTitle>
            <DialogDescription>{t("portail.requestDocDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("label.client")} *</Label>
              <div className="relative">
                <Input
                  value={docClientSearch}
                  onChange={e => { setDocClientSearch(e.target.value); if (!e.target.value) setDocRequestForm(f => ({ ...f, clientId: "" })); }}
                  placeholder={t("portail.searchClientPlaceholder")}
                  className="pl-9"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {docClientSearch && !docRequestForm.clientId && (
                <div className="border border-border rounded-lg bg-card shadow-lg max-h-48 overflow-y-auto">
                  {mockClients.filter(c => portail.find(p => p.clientId === c.id)?.actif).filter(c =>
                    searchMatch(c.code, docClientSearch) || searchMatch(c.nom, docClientSearch) ||
                    searchMatch(c.prenom, docClientSearch) || searchMatch(c.telephone, docClientSearch)
                  ).map(c => (
                    <button key={c.id} onClick={() => { setDocRequestForm(f => ({ ...f, clientId: c.id })); setDocClientSearch(`${c.nom} ${c.prenom}`.trim()); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{c.nom} {c.prenom} <span className="text-xs font-mono text-primary ml-1">{c.code}</span></span>
                        <span className="text-xs text-muted-foreground">{c.telephone}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {docRequestForm.clientId && (
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-foreground">{mockClients.find(c => c.id === docRequestForm.clientId)?.nom} {mockClients.find(c => c.id === docRequestForm.clientId)?.prenom}</span>
                  <button onClick={() => { setDocRequestForm(f => ({ ...f, clientId: "" })); setDocClientSearch(""); }} className="ml-auto text-muted-foreground hover:text-foreground">✕</button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("label.dossier")} *</Label>
              <Select value={docRequestForm.dossierCode} onValueChange={v => setDocRequestForm(f => ({ ...f, dossierCode: v }))}>
                <SelectTrigger><SelectValue placeholder={t("portail.selectDossierPlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {mockDossiers.map(d => <SelectItem key={d.id} value={d.code}>{d.code} — {d.objet}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("portail.requestedDoc")} *</Label>
              <Input value={docRequestForm.document} onChange={e => setDocRequestForm(f => ({ ...f, document: e.target.value }))} placeholder={t("portail.requestedDocPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("portail.descInstructions")}</Label>
              <Textarea value={docRequestForm.description} onChange={e => setDocRequestForm(f => ({ ...f, description: e.target.value }))} placeholder={t("portail.instructionsPlaceholder")} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocRequestModal(false)}>{t("action.cancel")}</Button>
            <Button onClick={handleDocRequest} disabled={!docRequestForm.clientId || !docRequestForm.dossierCode || !docRequestForm.document}>
              <Send className="mr-1 h-4 w-4" /> {t("portail.sendRequest")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
