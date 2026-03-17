// ═══════════════════════════════════════════════════════════════
// Page Clients — Gestion complète des clients du cabinet
// Inclut : CRUD, détail tiroir (dossiers, finances, documents,
// communications, statistiques), création dossier/facture
// depuis un client, export CSV/PDF, recherche et filtres
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from "react";
import { searchMatch, cn } from "@/lib/utils";
import { Plus, Download, X, User, Building2, Search, Users, CheckCircle2, Phone, Edit, Trash2, MoreHorizontal, Eye, FileText, Archive, UserPlus, FolderPlus, Receipt, Calendar, BarChart3, MessageSquare, FileDown, Filter, Mail, Smartphone, Copy, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { mockClients, mockDossiers, mockFactures, formatGNF, type Dossier } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useAnnouncer } from "@/hooks/useAnnouncer";

type ClientType = (typeof mockClients)[0] & { adresse?: string; description?: string };

// Listes de professions et raisons sociales pour les formulaires
const professions = [
  "Commerçant", "Médecin", "Avocat(e)", "Ingénieur", "Enseignant(e)",
  "Fonctionnaire", "Entrepreneur(e)", "Pharmacien(ne)", "Architecte",
  "Comptable", "Notaire", "Agriculteur", "Banquier", "Consultant(e)",
  "Journaliste", "Informaticien(ne)", "Propriétaire", "Militaire",
  "Diplomate", "Artisan", "Transporteur", "Importateur/Exportateur",
  "Agent immobilier", "Retraité(e)", "Étudiant(e)", "Sans emploi",
];

const raisonsSociales = [
  "SARL", "SA", "SNC", "SCS", "GIE", "EURL", "SAS",
  "Association", "ONG", "Coopérative", "Fondation",
  "Établissement public", "Entreprise individuelle",
];

const typesActe = ["Vente immobilière", "Succession", "Constitution société", "Donation", "Bail commercial", "Hypothèque", "Procuration"];
const prioritesDossier: Dossier["priorite"][] = ["Basse", "Normale", "Haute", "Urgente"];

const PAGE_SIZE = 20;

// Données simulées pour l'historique client
const mockCommunications = [
  { id: "1", type: "email", objet: "Confirmation RDV", date: "2025-03-01", statut: "Envoyé" },
  { id: "2", type: "sms", objet: "Rappel paiement", date: "2025-02-15", statut: "Délivré" },
  { id: "3", type: "appel", objet: "Consultation initiale", date: "2025-01-20", statut: "Effectué" },
  { id: "4", type: "email", objet: "Envoi documents", date: "2024-12-10", statut: "Envoyé" },
];

const mockDocumentsClient = [
  { id: "1", nom: "Carte d'identité", type: "Identité", dossier: "N-2025-101", date: "2024-03-15" },
  { id: "2", nom: "Titre foncier", type: "Propriété", dossier: "N-2025-101", date: "2024-03-20" },
  { id: "3", nom: "Contrat de vente", type: "Acte", dossier: "N-2025-104", date: "2024-08-15" },
  { id: "4", nom: "Procuration notariée", type: "Acte", dossier: "N-2025-101", date: "2024-04-02" },
];

export default function Clients() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const { announce } = useAnnouncer();
  const [clients, setClients] = useState<ClientType[]>(mockClients);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientType | null>(null);
  const [drawerTab, setDrawerTab] = useState("infos");
  const [customProfession, setCustomProfession] = useState(false);
  const [customRaison, setCustomRaison] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Création de dossier depuis une action client
  const [showCreateDossierModal, setShowCreateDossierModal] = useState(false);
  const [dossierClient, setDossierClient] = useState<ClientType | null>(null);
  const [dossierForm, setDossierForm] = useState({
    typeActe: "", objet: "", montant: "", priorite: "Normale" as Dossier["priorite"], notaire: "Maître Notario", notes: "",
  });

  // Création de facture depuis une action client
  const [showCreateFactureModal, setShowCreateFactureModal] = useState(false);
  const [factureClient, setFactureClient] = useState<ClientType | null>(null);
  const [factureForm, setFactureForm] = useState({
    dossier: "", montant: "", description: "", echeance: "",
  });

  // Filtres d'historique dans le détail client
  const [historyPeriod, setHistoryPeriod] = useState("all");
  const [historyTypeActe, setHistoryTypeActe] = useState("all");

  // Invitation client
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteClient, setInviteClient] = useState<ClientType | null>(null);
  const [inviteMethod, setInviteMethod] = useState<"email" | "sms" | null>(null);

  const inscriptionLink = `${window.location.origin}/inscription-client?cabinet=${encodeURIComponent("Cabinet Maître Sylla")}`;

  const handleSendInvite = (method: "email" | "sms") => {
    setInviteMethod(method);
    toast.success(fr
      ? `Lien d'inscription envoyé par ${method === "email" ? "e-mail" : "SMS"} à ${inviteClient?.prenom} ${inviteClient?.nom}`
      : `Registration link sent via ${method === "email" ? "email" : "SMS"} to ${inviteClient?.prenom} ${inviteClient?.nom}`
    );
    setShowInviteModal(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inscriptionLink);
    toast.success(fr ? "Lien copié dans le presse-papiers !" : "Link copied to clipboard!");
  };

  const [form, setForm] = useState({
    nom: "", prenom: "", type: "Physique" as "Physique" | "Morale",
    telephone: "", email: "", profession: "", statut: "Actif" as string,
    adresse: "", description: "",
  });

  const resetForm = () => {
    setForm({ nom: "", prenom: "", type: "Physique", telephone: "", email: "", profession: "", statut: "Actif", adresse: "", description: "" });
    setCustomProfession(false);
    setCustomRaison(false);
  };

  // Filtrage des clients par type et recherche
  const filtered = useMemo(() => clients.filter((c) => {
    if (filter === "Physique" && c.type !== "Physique") return false;
    if (filter === "Morale" && c.type !== "Morale") return false;
    if (search) {
      const fields = [c.nom, c.prenom, c.email, c.code, c.telephone, c.profession || ""];
      return fields.some(f => searchMatch(f, search));
    }
    return true;
  }), [clients, filter, search]);

  const visibleClients = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Statistiques globales
  const stats = {
    total: clients.length,
    physiques: clients.filter(c => c.type === "Physique").length,
    morales: clients.filter(c => c.type === "Morale").length,
    actifs: clients.filter(c => c.statut === "Actif").length,
  };

  // Création d'un nouveau client
  const handleCreate = () => {
    if (!form.nom?.trim()) {
      toast.error(fr ? "Le nom est obligatoire." : "Last name is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      toast.error(fr ? "Adresse email invalide." : "Invalid email address.");
      return;
    }
    if (form.telephone && form.telephone.replace(/\D/g, "").length < 8) {
      toast.error(fr ? "Numéro de téléphone invalide." : "Invalid phone number.");
      return;
    }
    setIsSubmitting(true);
    try {
      const newClient: ClientType = {
        id: String(Date.now()),
        code: `C-${1209 + clients.length - mockClients.length}`,
        nom: form.nom, prenom: form.prenom, type: form.type,
        telephone: form.telephone, email: form.email,
        profession: form.profession, statut: form.statut as ClientType["statut"],
        adresse: form.adresse,
        description: form.description,
        dateInscription: new Date().toISOString().slice(0, 10),
      };
      setClients(prev => [newClient, ...prev]);
      setShowCreateModal(false);
      resetForm();
      toast.success(fr ? "Client ajouté avec succès" : "Client added successfully");
      announce(fr ? "Client créé avec succès" : "Client created successfully");
    } catch (err) {
      toast.error(fr ? "Erreur lors de la création" : "Error creating client");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modification d'un client existant
  const handleEdit = () => {
    if (!editingClient) return;
    try {
      setClients(prev => prev.map(c => c.id === editingClient.id ? {
        ...editingClient,
        nom: form.nom || editingClient.nom,
        prenom: form.prenom ?? editingClient.prenom,
        type: form.type,
        telephone: form.telephone || editingClient.telephone,
        email: form.email || editingClient.email,
        profession: form.profession || editingClient.profession,
        statut: form.statut as ClientType["statut"],
        adresse: form.adresse,
        description: form.description,
      } : c));
      setShowEditModal(false);
      setSelectedClient(null);
      toast.success(fr ? "Client modifié" : "Client updated");
      announce(fr ? "Client mis à jour" : "Client updated");
    } catch (err) {
      toast.error(fr ? "Erreur lors de la modification" : "Error updating client");
      console.error(err);
    }
  };

  // Suppression d'un client
  const handleDelete = () => {
    if (!editingClient) return;
    setClients(prev => prev.filter(c => c.id !== editingClient.id));
    setShowDeleteDialog(false);
    setSelectedClient(null);
    setEditingClient(null);
    toast.success(fr ? "Client supprimé" : "Client deleted");
    announce(fr ? "Client supprimé" : "Client deleted");
  };

  const openEdit = (c: ClientType) => {
    setEditingClient(c);
    setForm({ nom: c.nom, prenom: c.prenom, type: c.type, telephone: c.telephone, email: c.email, profession: c.profession, statut: c.statut, adresse: c.adresse || "", description: c.description || "" });
    setCustomProfession(!professions.includes(c.profession));
    setShowEditModal(true);
  };

  const openDelete = (c: ClientType) => {
    setEditingClient(c);
    setShowDeleteDialog(true);
  };

  const openCreateDossier = (c: ClientType) => {
    setDossierClient(c);
    setDossierForm({ typeActe: "", objet: "", montant: "", priorite: "Normale", notaire: "Maître Notario", notes: "" });
    setShowCreateDossierModal(true);
  };

  const handleCreateDossier = () => {
    if (!dossierClient) return;
    toast.success(fr ? `Dossier créé pour ${dossierClient.nom} ${dossierClient.prenom}` : `Case created for ${dossierClient.nom} ${dossierClient.prenom}`);
    setShowCreateDossierModal(false);
  };

  const openCreateFacture = (c: ClientType) => {
    setFactureClient(c);
    setFactureForm({ dossier: "", montant: "", description: "", echeance: "" });
    setShowCreateFactureModal(true);
  };

  const handleCreateFacture = () => {
    if (!factureClient) return;
    toast.success(fr ? `Facture créée pour ${factureClient.nom} ${factureClient.prenom}` : `Invoice created for ${factureClient.nom} ${factureClient.prenom}`);
    setShowCreateFactureModal(false);
  };

  // Export CSV de la liste filtrée
  const exportCSV = () => {
    const headers = ["Code", fr ? "Nom" : "Name", fr ? "Prénom" : "First name", "Type", fr ? "Téléphone" : "Phone", "Email", "Profession", fr ? "Statut" : "Status", fr ? "Date inscription" : "Registration date"];
    const rows = filtered.map(c => [c.code, c.nom, c.prenom, c.type, c.telephone, c.email, c.profession, c.statut, c.dateInscription]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "clients.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(fr ? "Export CSV téléchargé" : "CSV export downloaded");
  };

  const exportPDF = () => {
    toast.info(fr ? "Export PDF en cours de génération..." : "PDF export generating...");
    setTimeout(() => toast.success(fr ? "PDF généré avec succès" : "PDF generated successfully"), 1000);
  };

  // Récupérer les dossiers/factures associés à un client
  const getClientDossiers = useCallback((client: ClientType) => {
    return mockDossiers.filter(d =>
      d.clients.some(c => c.toLowerCase().includes(client.nom.toLowerCase()))
    );
  }, []);

  const getClientFactures = useCallback((client: ClientType) => {
    return mockFactures.filter(f =>
      f.client.toLowerCase().includes(client.nom.toLowerCase())
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{fr ? "Clients" : "Clients"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{fr ? "Base clients du cabinet" : "Office client database"}</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> {fr ? "Exporter" : "Export"}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportCSV}><FileDown className="mr-2 h-4 w-4" /> {fr ? "Exporter CSV" : "Export CSV"}</DropdownMenuItem>
              <DropdownMenuItem onClick={exportPDF}><FileText className="mr-2 h-4 w-4" /> {fr ? "Exporter PDF" : "Export PDF"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <Plus className="h-4 w-4" /> {fr ? "Nouveau client" : "New client"}
          </Button>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, value: stats.total, label: fr ? "Total clients" : "Total clients", bg: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-500" },
          { icon: User, value: stats.physiques, label: fr ? "Personnes physiques" : "Individuals", bg: "bg-emerald-50 dark:bg-emerald-900/20", iconBg: "bg-emerald-500" },
          { icon: Building2, value: stats.morales, label: fr ? "Personnes morales" : "Legal entities", bg: "bg-purple-50 dark:bg-purple-900/20", iconBg: "bg-purple-500" },
          { icon: CheckCircle2, value: stats.actifs, label: fr ? "Clients actifs" : "Active clients", bg: "bg-amber-50 dark:bg-amber-900/20", iconBg: "bg-amber-500" },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={cn("rounded-xl border border-border p-5 flex items-center gap-4", kpi.bg)}>
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white", kpi.iconBg)}>
              <kpi.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recherche et filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input aria-label={fr ? "Rechercher un client" : "Search a client"} placeholder={fr ? "Rechercher par nom, code, email ou téléphone..." : "Search by name, code, email or phone..."} value={search} onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} className="pl-10" />
        </div>
        <Select value={filter} onValueChange={v => { setFilter(v); setVisibleCount(PAGE_SIZE); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder={fr ? "Tous les types" : "All types"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{fr ? "Tous les types" : "All types"}</SelectItem>
            <SelectItem value="Physique">{fr ? "Personnes physiques" : "Individuals"}</SelectItem>
            <SelectItem value="Morale">{fr ? "Personnes morales" : "Legal entities"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau des clients */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Photo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Nom & Prénom" : "Name"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Profession</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">{fr ? "Téléphone" : "Phone"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Statut" : "Status"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleClients.map((client, i) => (
                <motion.tr key={client.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-sm font-mono font-medium text-primary">{client.code}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      {client.type === "Morale" ? (
                        <Building2 className="h-4 w-4 text-primary" />
                      ) : (
                        <span className="font-heading text-xs font-bold text-primary">
                          {client.nom.charAt(0)}{client.prenom.charAt(0)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{client.nom} {client.prenom}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-sm text-foreground">{client.profession}</span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {client.telephone}
                    </div>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={client.statut} /></td>
                  <td className="px-4 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedClient(client); setDrawerTab("infos"); }}>
                          <Eye className="mr-2 h-4 w-4" /> {fr ? "Voir détails" : "View details"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(client)}>
                          <Edit className="mr-2 h-4 w-4" /> {fr ? "Modifier" : "Edit"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openCreateDossier(client)}>
                          <FolderPlus className="mr-2 h-4 w-4" /> {fr ? "Créer un dossier" : "Create case"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openCreateFacture(client)}>
                          <Receipt className="mr-2 h-4 w-4" /> {fr ? "Générer facture" : "Generate invoice"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info(fr ? "Client archivé" : "Client archived")}>
                          <Archive className="mr-2 h-4 w-4" /> {fr ? "Archiver" : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setInviteClient(client); setShowInviteModal(true); }}>
                          <Link className="mr-2 h-4 w-4" /> {fr ? "Inviter (espace client)" : "Invite (client portal)"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => openDelete(client)}>
                          <Trash2 className="mr-2 h-4 w-4" /> {fr ? "Supprimer" : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState
              icon={Users}
              title={fr ? "Aucun client trouvé" : "No client found"}
              description={search ? (fr ? "Aucun client ne correspond à votre recherche." : "No client matches your search.") : (fr ? "Ajoutez votre premier client." : "Add your first client.")}
            />
          )}
        </div>
        {/* Chargement progressif */}
        {hasMore && (
          <div className="flex justify-center py-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
              {fr ? `Charger plus (${filtered.length - visibleCount} restants)` : `Load more (${filtered.length - visibleCount} remaining)`}
            </Button>
          </div>
        )}
        {!hasMore && filtered.length > 0 && (
          <div aria-live="polite" className="text-center py-3 text-xs text-muted-foreground border-t border-border">
            {filtered.length} client{filtered.length > 1 ? "s" : ""} {fr ? "affiché" : "displayed"}{filtered.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ═══ Tiroir de détail client ═══ */}
      <AnimatePresence>
        {selectedClient && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedClient(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl border-l border-border bg-card shadow-2xl overflow-y-auto scrollbar-thin">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      {selectedClient.type === "Morale" ? <Building2 className="h-7 w-7 text-primary" /> : <User className="h-7 w-7 text-primary" />}
                    </div>
                    <div>
                      <h2 className="font-heading text-lg font-bold text-foreground">{selectedClient.nom} {selectedClient.prenom}</h2>
                      <p className="text-sm text-muted-foreground">{selectedClient.code} · {selectedClient.type} · {selectedClient.profession}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(selectedClient)}><Edit className="mr-1 h-3.5 w-3.5" /> {fr ? "Modifier" : "Edit"}</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" aria-label={fr ? "Supprimer le client" : "Delete client"} onClick={() => openDelete(selectedClient)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    <button aria-label={fr ? "Fermer" : "Close"} onClick={() => setSelectedClient(null)} className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
                  </div>
                </div>

                {/* Onglets du tiroir */}
                <div className="flex gap-1 rounded-lg bg-muted p-1 mb-6 overflow-x-auto">
                  {[
                    { key: "infos", label: "Infos" },
                    { key: "dossiers", label: fr ? "Dossiers" : "Cases" },
                    { key: "finances", label: "Finances" },
                    { key: "documents", label: "Documents" },
                    { key: "communications", label: "Communications" },
                    { key: "statistiques", label: fr ? "Statistiques" : "Statistics" },
                  ].map((tab) => (
                    <button key={tab.key} onClick={() => setDrawerTab(tab.key)}
                      className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                        drawerTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={drawerTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

                    {/* Onglet Informations */}
                    {drawerTab === "infos" && (
                      <div className="space-y-4">
                        {[
                          { label: "Email", value: selectedClient.email },
                          { label: fr ? "Téléphone" : "Phone", value: selectedClient.telephone },
                          { label: "Profession", value: selectedClient.profession },
                          { label: "Type", value: selectedClient.type },
                          { label: fr ? "Statut" : "Status", value: selectedClient.statut },
                          { label: fr ? "Date d'inscription" : "Registration date", value: new Date(selectedClient.dateInscription).toLocaleDateString(fr ? "fr-FR" : "en-US") },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between border-b border-border pb-3 last:border-0">
                            <span className="text-sm text-muted-foreground">{item.label}</span>
                            <span className="text-sm font-medium text-foreground">{item.value}</span>
                          </div>
                        ))}
                        {selectedClient.description && (
                          <div className="pt-2 border-t border-border">
                            <span className="text-sm text-muted-foreground block mb-1">{fr ? "Description" : "Description"}</span>
                            <p className="text-sm text-foreground whitespace-pre-line">{selectedClient.description}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Onglet Dossiers — Chronologie */}
                    {drawerTab === "dossiers" && (() => {
                      const clientDossiers = getClientDossiers(selectedClient);
                      return (
                        <div className="space-y-4">
                          <div className="flex gap-2 flex-wrap">
                            <Select value={historyPeriod} onValueChange={setHistoryPeriod}>
                              <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder={fr ? "Période" : "Period"} /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{fr ? "Toutes périodes" : "All periods"}</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2023">2023</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select value={historyTypeActe} onValueChange={setHistoryTypeActe}>
                              <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder={fr ? "Type d'acte" : "Deed type"} /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{fr ? "Tous types" : "All types"}</SelectItem>
                                {typesActe.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => toast.info(fr ? "Export historique en cours..." : "Exporting history...")}>
                              <FileDown className="h-3.5 w-3.5" /> {fr ? "Exporter" : "Export"}
                            </Button>
                          </div>

                          {clientDossiers.length > 0 ? (
                            <div className="relative pl-4 border-l-2 border-primary/20 space-y-4">
                              {clientDossiers.map((d) => (
                                <div key={d.id} className="relative">
                                  <div className="absolute -left-[1.35rem] top-2 h-3 w-3 rounded-full bg-primary border-2 border-card" />
                                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <span className="text-xs font-mono text-primary">{d.code}</span>
                                        <h4 className="text-sm font-medium text-foreground">{d.objet}</h4>
                                      </div>
                                      <StatusBadge status={d.statut} />
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                      <span>📅 {d.clientDate}</span>
                                      <span>📄 {d.typeActe}</span>
                                      <span>💰 {formatGNF(d.montant)}</span>
                                      <span>📊 {d.avancement}%</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <FolderPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">{fr ? "Aucun dossier pour ce client" : "No cases for this client"}</p>
                              <Button variant="outline" size="sm" className="mt-3" onClick={() => openCreateDossier(selectedClient)}>
                                <FolderPlus className="mr-2 h-4 w-4" /> {fr ? "Créer un dossier" : "Create case"}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Onglet Finances */}
                    {drawerTab === "finances" && (() => {
                      const clientDossiers = getClientDossiers(selectedClient);
                      const clientFactures = getClientFactures(selectedClient);
                      const totalFacture = clientFactures.reduce((s, f) => s + f.montant, 0) || clientDossiers.reduce((s, d) => s + d.montant, 0);
                      const totalPaye = clientFactures.filter(f => f.statut === "Payée").reduce((s, f) => s + f.montant, 0);
                      const totalDebours = Math.round(totalFacture * 0.15);
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 rounded-lg bg-muted/30 border border-border">
                              <p className="text-xs text-muted-foreground">{fr ? "Total facturé" : "Total invoiced"}</p>
                              <p className="text-lg font-bold text-foreground font-mono">{formatGNF(totalFacture)}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30 border border-border">
                              <p className="text-xs text-muted-foreground">{fr ? "Total payé" : "Total paid"}</p>
                              <p className="text-lg font-bold text-success font-mono">{formatGNF(totalPaye)}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30 border border-border">
                              <p className="text-xs text-muted-foreground">{fr ? "Débours" : "Disbursements"}</p>
                              <p className="text-lg font-bold text-warning font-mono">{formatGNF(totalDebours)}</p>
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-muted/30 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">{fr ? "Reste à payer" : "Outstanding"}</p>
                            <p className="text-xl font-bold text-destructive font-mono">{formatGNF(totalFacture - totalPaye)}</p>
                          </div>
                          <h4 className="text-sm font-medium text-foreground mt-4">{fr ? "Factures" : "Invoices"}</h4>
                          {clientFactures.length > 0 ? clientFactures.map(f => (
                            <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                              <div>
                                <p className="text-sm font-mono font-medium text-foreground">{f.numero}</p>
                                <p className="text-xs text-muted-foreground">{new Date(f.dateEmission).toLocaleDateString(fr ? "fr-FR" : "en-US")} · {f.dossier}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-mono font-medium text-foreground">{formatGNF(f.montant)}</p>
                                <StatusBadge status={f.statut} />
                              </div>
                            </div>
                          )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">{fr ? "Aucune facture" : "No invoices"}</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Onglet Documents */}
                    {drawerTab === "documents" && (
                      <div className="space-y-3">
                        {mockDocumentsClient.map(doc => (
                          <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                            <FileText className="h-5 w-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{doc.nom}</p>
                              <p className="text-xs text-muted-foreground">{doc.type} · {doc.dossier} · {new Date(doc.date).toLocaleDateString(fr ? "fr-FR" : "en-US")}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs shrink-0">{fr ? "Voir" : "View"}</Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Onglet Communications */}
                    {drawerTab === "communications" && (
                      <div className="space-y-3">
                        {mockCommunications.map(comm => (
                          <div key={comm.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-white shrink-0",
                              comm.type === "email" ? "bg-blue-500" : comm.type === "sms" ? "bg-emerald-500" : "bg-amber-500"
                            )}>
                              <MessageSquare className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{comm.objet}</p>
                              <p className="text-xs text-muted-foreground capitalize">{comm.type} · {new Date(comm.date).toLocaleDateString(fr ? "fr-FR" : "en-US")}</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{comm.statut}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Onglet Statistiques */}
                    {drawerTab === "statistiques" && (() => {
                      const clientDossiers = getClientDossiers(selectedClient);
                      const clientFactures = getClientFactures(selectedClient);
                      const ca = clientFactures.reduce((s, f) => s + f.montant, 0) || clientDossiers.reduce((s, d) => s + d.montant, 0);
                      const nbDossiers = clientDossiers.length;
                      const avgAvancement = nbDossiers > 0 ? Math.round(clientDossiers.reduce((s, d) => s + d.avancement, 0) / nbDossiers) : 0;
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-border text-center">
                              <BarChart3 className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                              <p className="text-2xl font-bold text-foreground">{nbDossiers}</p>
                              <p className="text-xs text-muted-foreground">{fr ? "Dossiers" : "Cases"}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-border text-center">
                              <Receipt className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                              <p className="text-lg font-bold text-foreground font-mono">{formatGNF(ca)}</p>
                              <p className="text-xs text-muted-foreground">{fr ? "CA généré" : "Revenue"}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-border text-center">
                              <Calendar className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                              <p className="text-2xl font-bold text-foreground">{avgAvancement}%</p>
                              <p className="text-xs text-muted-foreground">{fr ? "Avancement moyen" : "Avg. progress"}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-border text-center">
                              <FileText className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                              <p className="text-2xl font-bold text-foreground">{clientFactures.length}</p>
                              <p className="text-xs text-muted-foreground">{fr ? "Factures" : "Invoices"}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => toast.info(fr ? "Export historique client..." : "Exporting client history...")}>
                            <FileDown className="h-4 w-4" /> {fr ? "Exporter l'historique complet" : "Export full history"}
                          </Button>
                        </div>
                      );
                    })()}

                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Modal de création de client ═══ */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Nouveau client" : "New client"}</DialogTitle>
            <DialogDescription>{fr ? "Ajoutez un nouveau client au cabinet" : "Add a new client to the office"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{fr ? "Type de client" : "Client type"}</Label>
              <Select value={form.type} onValueChange={v => { setForm(f => ({ ...f, type: v as "Physique" | "Morale", nom: "" })); setCustomRaison(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Physique">{fr ? "Personne physique" : "Individual"}</SelectItem>
                  <SelectItem value="Morale">{fr ? "Personne morale" : "Legal entity"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{form.type === "Morale" ? (fr ? "Raison sociale *" : "Company name *") : (fr ? "Nom *" : "Last name *")}</Label>
                {form.type === "Morale" && !customRaison ? (
                  <Select value={form.nom} onValueChange={v => {
                    if (v === "__custom__") { setCustomRaison(true); setForm(f => ({ ...f, nom: "" })); }
                    else setForm(f => ({ ...f, nom: v }));
                  }}>
                    <SelectTrigger><SelectValue placeholder={fr ? "Choisir un type..." : "Choose a type..."} /></SelectTrigger>
                    <SelectContent>
                      {raisonsSociales.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      <SelectItem value="__custom__">✏️ {fr ? "Saisir manuellement" : "Enter manually"}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder={form.type === "Morale" ? (fr ? "Raison sociale..." : "Company name...") : (fr ? "Nom" : "Last name")} className="flex-1" />
                    {form.type === "Morale" && customRaison && (
                      <Button variant="outline" size="icon" className="shrink-0" onClick={() => { setCustomRaison(false); setForm(f => ({ ...f, nom: "" })); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {form.type === "Physique" && (
                <div className="space-y-2">
                  <Label>{fr ? "Prénom" : "First name"}</Label>
                  <Input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder={fr ? "Prénom" : "First name"} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Téléphone" : "Phone"}</Label>
                <Input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="+224 6X XX XX XX" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemple.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Profession / Activité" : "Profession / Activity"}</Label>
              {!customProfession ? (
                <Select value={form.profession} onValueChange={v => {
                  if (v === "__custom__") { setCustomProfession(true); setForm(f => ({ ...f, profession: "" })); }
                  else setForm(f => ({ ...f, profession: v }));
                }}>
                  <SelectTrigger><SelectValue placeholder={fr ? "Choisir une profession..." : "Choose a profession..."} /></SelectTrigger>
                  <SelectContent>
                    {professions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    <SelectItem value="__custom__">✏️ {fr ? "Saisir manuellement" : "Enter manually"}</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input value={form.profession} onChange={e => setForm(f => ({ ...f, profession: e.target.value }))} placeholder={fr ? "Saisir la profession..." : "Enter profession..."} className="flex-1" />
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => { setCustomProfession(false); setForm(f => ({ ...f, profession: "" })); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Adresse" : "Address"}</Label>
              <Input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder={fr ? "Quartier, Commune, Ville..." : "District, City..."} />
            </div>
            {/* Champ facultatif de description du client */}
            <div className="space-y-2">
              <Label>{fr ? "Description (facultatif)" : "Description (optional)"}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={fr ? "Notes ou informations complémentaires sur le client..." : "Additional notes or information about the client..."} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={isSubmitting || !form.nom?.trim()}>{isSubmitting ? (fr ? "Création..." : "Creating...") : (fr ? "Créer le client" : "Create client")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Modal de modification de client ═══ */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Modifier le client" : "Edit client"}</DialogTitle>
            <DialogDescription>{fr ? "Modifiez les informations de" : "Edit information for"} {editingClient?.nom} {editingClient?.prenom}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Nom" : "Last name"}</Label>
                <Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Prénom" : "First name"}</Label>
                <Input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Téléphone" : "Phone"}</Label>
                <Input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Profession / Activité" : "Profession"}</Label>
                {!customProfession ? (
                  <Select value={professions.includes(form.profession) ? form.profession : ""} onValueChange={v => {
                    if (v === "__custom__") { setCustomProfession(true); setForm(f => ({ ...f, profession: "" })); }
                    else setForm(f => ({ ...f, profession: v }));
                  }}>
                    <SelectTrigger><SelectValue placeholder={fr ? "Choisir..." : "Choose..."} /></SelectTrigger>
                    <SelectContent>
                      {professions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      <SelectItem value="__custom__">✏️ {fr ? "Saisir manuellement" : "Enter manually"}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input value={form.profession} onChange={e => setForm(f => ({ ...f, profession: e.target.value }))} placeholder={fr ? "Saisir la profession..." : "Enter profession..."} className="flex-1" />
                    <Button variant="outline" size="icon" className="shrink-0" onClick={() => { setCustomProfession(false); setForm(f => ({ ...f, profession: "" })); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Statut" : "Status"}</Label>
                <Select value={form.statut} onValueChange={v => setForm(f => ({ ...f, statut: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">{fr ? "Actif" : "Active"}</SelectItem>
                    <SelectItem value="Inactif">{fr ? "Inactif" : "Inactive"}</SelectItem>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Adresse" : "Address"}</Label>
              <Input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder={fr ? "Quartier, Commune, Ville..." : "District, City..."} />
            </div>
            {/* Champ facultatif de description du client */}
            <div className="space-y-2">
              <Label>{fr ? "Description (facultatif)" : "Description (optional)"}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={fr ? "Notes ou informations complémentaires sur le client..." : "Additional notes or information about the client..."} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleEdit}>{fr ? "Enregistrer" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Confirmation de suppression ═══ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fr ? "Supprimer ce client ?" : "Delete this client?"}</AlertDialogTitle>
            <AlertDialogDescription>{fr ? "Le client" : "Client"} <strong>{editingClient?.nom} {editingClient?.prenom}</strong> {fr ? "sera supprimé définitivement." : "will be permanently deleted."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr ? "Annuler" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{fr ? "Supprimer" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ Modal de création de dossier depuis un client ═══ */}
      <Dialog open={showCreateDossierModal} onOpenChange={setShowCreateDossierModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Nouveau dossier" : "New case"}</DialogTitle>
            <DialogDescription>{fr ? "Créer un dossier pour" : "Create a case for"} <strong>{dossierClient?.nom} {dossierClient?.prenom}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{dossierClient?.nom} {dossierClient?.prenom}</p>
                <p className="text-xs text-muted-foreground">{dossierClient?.code}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Type d'acte *" : "Deed type *"}</Label>
                <Select value={dossierForm.typeActe} onValueChange={v => setDossierForm(f => ({ ...f, typeActe: v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner" : "Select"} /></SelectTrigger>
                  <SelectContent>{typesActe.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Priorité" : "Priority"}</Label>
                <Select value={dossierForm.priorite} onValueChange={v => setDossierForm(f => ({ ...f, priorite: v as Dossier["priorite"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{prioritesDossier.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Objet du dossier" : "Case subject"}</Label>
              <Input value={dossierForm.objet} onChange={e => setDossierForm(f => ({ ...f, objet: e.target.value }))} placeholder={fr ? "Ex: Vente villa Kipé" : "e.g. Villa sale Kipé"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Montant (GNF)" : "Amount (GNF)"}</Label>
                <Input type="number" value={dossierForm.montant} onChange={e => setDossierForm(f => ({ ...f, montant: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Notaire responsable" : "Responsible notary"}</Label>
                <Input value={dossierForm.notaire} onChange={e => setDossierForm(f => ({ ...f, notaire: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={dossierForm.notes} onChange={e => setDossierForm(f => ({ ...f, notes: e.target.value }))} placeholder={fr ? "Notes internes..." : "Internal notes..."} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDossierModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreateDossier} disabled={!dossierForm.typeActe}>
              {fr ? "Créer le dossier" : "Create case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Modal de création de facture depuis un client ═══ */}
      <Dialog open={showCreateFactureModal} onOpenChange={setShowCreateFactureModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Nouvelle facture" : "New invoice"}</DialogTitle>
            <DialogDescription>{fr ? "Générer une facture pour" : "Generate an invoice for"} <strong>{factureClient?.nom} {factureClient?.prenom}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{factureClient?.nom} {factureClient?.prenom}</p>
                <p className="text-xs text-muted-foreground">{factureClient?.code}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Dossier associé" : "Associated case"}</Label>
              <Select value={factureForm.dossier} onValueChange={v => setFactureForm(f => ({ ...f, dossier: v }))}>
                <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner un dossier..." : "Select a case..."} /></SelectTrigger>
                <SelectContent>
                  {mockDossiers.map(d => <SelectItem key={d.id} value={d.code}>{d.code} — {d.objet}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Montant (GNF) *" : "Amount (GNF) *"}</Label>
                <Input type="number" value={factureForm.montant} onChange={e => setFactureForm(f => ({ ...f, montant: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Date d'échéance" : "Due date"}</Label>
                <Input type="date" value={factureForm.echeance} onChange={e => setFactureForm(f => ({ ...f, echeance: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={factureForm.description} onChange={e => setFactureForm(f => ({ ...f, description: e.target.value }))} placeholder={fr ? "Détails de la facture..." : "Invoice details..."} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFactureModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreateFacture} disabled={!factureForm.montant}>
              {fr ? "Créer la facture" : "Create invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'invitation client */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              {fr ? "Inviter le client" : "Invite client"}
            </DialogTitle>
            <DialogDescription>
              {fr
                ? `Envoyez un lien d'inscription à ${inviteClient?.prenom} ${inviteClient?.nom} pour qu'il crée son espace client.`
                : `Send a registration link to ${inviteClient?.prenom} ${inviteClient?.nom} so they can create their client portal account.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {/* Lien */}
            <div className="rounded-lg bg-muted/50 p-3">
              <Label className="text-xs text-muted-foreground mb-1.5 block">{fr ? "Lien d'inscription" : "Registration link"}</Label>
              <div className="flex items-center gap-2">
                <Input value={inscriptionLink} readOnly className="text-xs bg-background" />
                <Button variant="outline" size="icon" onClick={handleCopyLink} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Boutons d'envoi */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="gap-2" onClick={() => handleSendInvite("email")} disabled={!inviteClient?.email}>
                <Mail className="h-4 w-4" /> {fr ? "Envoyer par e-mail" : "Send by email"}
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => handleSendInvite("sms")} disabled={!inviteClient?.telephone}>
                <Smartphone className="h-4 w-4" /> {fr ? "Envoyer par SMS" : "Send by SMS"}
              </Button>
            </div>

            {inviteClient?.email && (
              <p className="text-xs text-muted-foreground">📧 {inviteClient.email}</p>
            )}
            {inviteClient?.telephone && (
              <p className="text-xs text-muted-foreground">📱 {inviteClient.telephone}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}