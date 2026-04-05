// ═══════════════════════════════════════════════════════════════
// Page Clients — Gestion complète des clients du cabinet
// Inclut : CRUD, détail tiroir (dossiers, finances, documents,
// communications, statistiques), création dossier/facture
// depuis un client, export CSV/PDF, recherche et filtres
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Plus, Download, X, User, Building2, Search, Users, CheckCircle2, Edit, Trash2, FileText, FolderPlus, Receipt, BarChart3, MessageSquare, FileDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PROFESSIONS } from "@/data/constants";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useAnnouncer } from "@/hooks/useAnnouncer";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteClients } from "@/hooks/useInfiniteClients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient, updateClient, deleteClient, getStatistiquesGlobales, getClientHistorique, getClientStatistiques, exportClientsCsv, exportClientsExcel, toggleClientStatus, getClientContacts, addClientContact, deleteClientContact, setContactPrincipal, getClientById, validateEmail, validateRccm, validateNif, getClientsByType, getClientsByStatus, getRecentClients, getInactiveClients, getVipClients, mergeClients, getClientDuplicates } from "@/api/clients";
import { ClientTable } from "@/components/clients/ClientTable";
import { ClientModals } from "@/components/clients/ClientModals";
import type { DossierForm } from "@/components/clients/ClientModals";
import type { ClientType } from "@/components/clients/ClientTable";
import type { Client } from "@/types/client";

// Alias locaux pour les constantes centralisées (rétrocompatibilité)
const professions = PROFESSIONS;

const PAGE_SIZE = 20;

/** Convertit un Client API en ClientType pour l'affichage */
function toClientType(c: Client): ClientType {
  return {
    id: String(c.id),
    code: c.codeClient ?? `C-${c.id}`,
    nom: c.typeClient === 'MORALE' ? (c.denominationSociale || c.nom || '') : (c.nom || ''),
    prenom: c.typeClient === 'PHYSIQUE' ? (c.prenom ?? '') : '',
    type: c.typeClient === 'PHYSIQUE' ? 'Physique' : 'Morale',
    telephone: c.telephone ?? '',
    email: c.email ?? '',
    profession: c.typeClient === 'PHYSIQUE' ? (c.profession ?? '') : (c.secteurActivite ?? ''),
    statut: c.actif ? 'Actif' : 'Inactif',
    dateInscription: c.datePremiereVisite ?? c.createdAt?.slice(0, 10) ?? '',
    adresse: c.adresse,
    description: c.noteDescriptive,
  };
}


export default function Clients() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const { announce } = useAnnouncer();
  const queryClient = useQueryClient();

  // Statistiques globales depuis l'API
  const { data: globalStats } = useQuery({
    queryKey: ['clients', 'statistiques-globales'],
    queryFn: getStatistiquesGlobales,
    staleTime: 60_000,
  });

  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientType | null>(null);
  const [drawerTab, setDrawerTab] = useState("infos");

  // Données du tiroir client (historique + statistiques)
  const { data: clientHistorique = [], isLoading: isLoadingHistorique } = useQuery({
    queryKey: ['clients', selectedClient?.id, 'historique'],
    queryFn: () => getClientHistorique(selectedClient!.id),
    enabled: !!selectedClient && drawerTab === 'historique',
  });

  const { data: clientStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['clients', selectedClient?.id, 'statistiques'],
    queryFn: () => getClientStatistiques(selectedClient!.id),
    enabled: !!selectedClient && drawerTab === 'statistiques',
  });

  const [customProfession, setCustomProfession] = useState(false);
  const [customRaison, setCustomRaison] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paramètre typeClient pour l'API
  const typeClientParam = filter === 'Physique' ? 'PHYSIQUE' : filter === 'Morale' ? 'MORALE' : undefined;

  // Chargement des clients depuis l'API
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteClients({
    search: debouncedSearch || undefined,
    typeClient: typeClientParam,
    size: PAGE_SIZE,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const allClients = useMemo(
    () => (data?.pages.flatMap(p => p.content) ?? []).map(toClientType),
    [data],
  );
  const totalCount = data?.pages[0]?.totalElements ?? 0;

  // Mutations CRUD
  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateClient>[1] }) =>
      updateClient(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  // Toggle statut actif/inactif
  const toggleStatusMutation = useMutation({
    mutationFn: toggleClientStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(fr ? "Statut du client mis à jour" : "Client status updated");
    },
    onError: () => toast.error(fr ? "Erreur lors du changement de statut" : "Error toggling status"),
  });

  // Contacts du client sélectionné
  const { data: clientContacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['clients', selectedClient?.id, 'contacts'],
    queryFn: () => getClientContacts(selectedClient!.id),
    enabled: !!selectedClient && drawerTab === 'communications',
  });

  const addContactMutation = useMutation({
    mutationFn: ({ clientId, payload }: { clientId: string | number; payload: Record<string, unknown> }) =>
      addClientContact(clientId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', selectedClient?.id, 'contacts'] }),
  });

  const deleteContactMutation = useMutation({
    mutationFn: ({ clientId, contactId }: { clientId: string | number; contactId: string | number }) =>
      deleteClientContact(clientId, contactId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', selectedClient?.id, 'contacts'] }),
  });

  const setContactPrincipalMutation = useMutation({
    mutationFn: ({ clientId, contactId }: { clientId: string | number; contactId: string | number }) =>
      setContactPrincipal(clientId, contactId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', selectedClient?.id, 'contacts'] }),
  });

  // Doublons éventuels
  const { data: clientDuplicates = [] } = useQuery({
    queryKey: ['clients', selectedClient?.id, 'duplicates'],
    queryFn: () => getClientDuplicates(selectedClient!.id),
    enabled: !!selectedClient && drawerTab === 'infos',
  });

  // Détail complet du client sélectionné
  const { data: clientDetail } = useQuery({
    queryKey: ['clients', selectedClient?.id, 'detail'],
    queryFn: () => getClientById(selectedClient!.id),
    enabled: !!selectedClient,
  });

  // Quick filters (presets)
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const { data: quickFilterClients } = useQuery({
    queryKey: ['clients', 'quick-filter', quickFilter],
    queryFn: () => {
      if (quickFilter === 'recent') return getRecentClients();
      if (quickFilter === 'inactive') return getInactiveClients(90);
      if (quickFilter === 'vip') return getVipClients();
      if (quickFilter === 'PHYSIQUE') return getClientsByType('PHYSIQUE');
      if (quickFilter === 'MORALE') return getClientsByType('MORALE');
      if (quickFilter === 'actif') return getClientsByStatus(true);
      if (quickFilter === 'inactif') return getClientsByStatus(false);
      return Promise.resolve([]);
    },
    enabled: !!quickFilter,
  });

  // Validation email en temps réel (debounced)
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const validateClientEmail = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailValid(null); return; }
    try {
      await validateEmail(email);
      setEmailValid(true);
    } catch {
      setEmailValid(false);
    }
  }, []);

  // Validation RCCM
  const _validateClientRccm = useCallback(async (rccm: string) => {
    if (!rccm) return;
    try { await validateRccm(rccm); } catch { /* silencieux */ }
  }, []);

  // Validation NIF
  const _validateClientNif = useCallback(async (nif: string) => {
    if (!nif) return;
    try { await validateNif(nif); } catch { /* silencieux */ }
  }, []);

  // Merge clients
  const mergeMutation = useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: string | number; targetId: string | number }) =>
      mergeClients(sourceId, targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(fr ? "Clients fusionnés" : "Clients merged");
    },
    onError: () => toast.error(fr ? "Erreur lors de la fusion" : "Error merging clients"),
  });

  // Création de dossier depuis une action client
  const [showCreateDossierModal, setShowCreateDossierModal] = useState(false);
  const [dossierClient, setDossierClient] = useState<ClientType | null>(null);
  const [dossierForm, setDossierForm] = useState<DossierForm>({
    typeActe: "", objet: "", montant: "", priorite: "Normale", notaire: "", notes: "",
  });

  // Création de facture depuis une action client
  const [showCreateFactureModal, setShowCreateFactureModal] = useState(false);
  const [factureClient, setFactureClient] = useState<ClientType | null>(null);
  const [factureForm, setFactureForm] = useState({
    dossier: "", montant: "", description: "", echeance: "",
  });


  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteClient, setInviteClient] = useState<ClientType | null>(null);
  const inscriptionLink = `${window.location.origin}/inscription-client?cabinet=${encodeURIComponent("Cabinet Maître Sylla")}`;

  const handleSendInvite = (method: "email" | "sms") => {
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

  const resetForm = useCallback(() => {
    setForm({ nom: "", prenom: "", type: "Physique", telephone: "", email: "", profession: "", statut: "Actif", adresse: "", description: "" });
    setCustomProfession(false);
    setCustomRaison(false);
  }, []);

  // Les données viennent de l'API (filtre type + recherche server-side)
  // allClients et totalCount définis plus haut via useInfiniteClients

  // Statistiques globales depuis l'API, avec fallback local
  const stats = useMemo(() => {
    if (globalStats) return globalStats;
    return {
      total: totalCount,
      physiques: filter === 'Physique' ? totalCount : allClients.filter(c => c.type === 'Physique').length,
      morales: filter === 'Morale' ? totalCount : allClients.filter(c => c.type === 'Morale').length,
      actifs: allClients.filter(c => c.statut === 'Actif').length,
    };
  }, [globalStats, totalCount, allClients, filter]);

  // Création d'un nouveau client via l'API
  const handleCreate = useCallback(() => {
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
    if (emailValid === false) {
      toast.error(fr ? "L'adresse email est déjà utilisée." : "Email address is already in use.");
      return;
    }
    // Server-side validations
    if (form.email) validateClientEmail(form.email);
    setIsSubmitting(true);
    createMutation.mutate(
      {
        typeClient: form.type === 'Physique' ? 'PHYSIQUE' : 'MORALE',
        nom: form.type === 'Physique' ? form.nom : undefined,
        prenom: form.type === 'Physique' ? form.prenom : undefined,
        denominationSociale: form.type === 'Morale' ? form.nom : undefined,
        email: form.email || undefined,
        telephone: form.telephone || undefined,
        profession: form.type === 'Physique' ? form.profession || undefined : undefined,
        secteurActivite: form.type === 'Morale' ? form.profession || undefined : undefined,
        adresse: form.adresse || undefined,
        noteDescriptive: form.description || undefined,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          resetForm();
          toast.success(fr ? "Client ajouté avec succès" : "Client added successfully");
          announce(fr ? "Client créé avec succès" : "Client created successfully");
        },
        onError: (err) => {
          toast.error(err.message || (fr ? "Erreur lors de la création" : "Error creating client"));
          console.error(err);
        },
        onSettled: () => setIsSubmitting(false),
      },
    );
  }, [form, fr, announce, resetForm, createMutation, emailValid, validateClientEmail]);

  // Modification d'un client via l'API
  const handleEdit = useCallback(() => {
    if (!editingClient) return;
    updateMutation.mutate(
      {
        id: editingClient.id,
        data: {
          typeClient: form.type === 'Physique' ? 'PHYSIQUE' : 'MORALE',
          nom: form.type === 'Physique' ? form.nom || editingClient.nom : undefined,
          prenom: form.type === 'Physique' ? form.prenom || editingClient.prenom || undefined : undefined,
          denominationSociale: form.type === 'Morale' ? form.nom || editingClient.nom : undefined,
          email: form.email || editingClient.email || undefined,
          telephone: form.telephone || editingClient.telephone || undefined,
          profession: form.type === 'Physique' ? form.profession || undefined : undefined,
          secteurActivite: form.type === 'Morale' ? form.profession || undefined : undefined,
          adresse: form.adresse || undefined,
          noteDescriptive: form.description || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setSelectedClient(null);
          toast.success(fr ? "Client modifié" : "Client updated");
          announce(fr ? "Client mis à jour" : "Client updated");
        },
        onError: (err) => {
          toast.error(fr ? "Erreur lors de la modification" : "Error updating client");
          console.error(err);
        },
      },
    );
  }, [editingClient, form, fr, announce, updateMutation]);

  // Suppression d'un client via l'API
  const handleDelete = useCallback(() => {
    if (!editingClient) return;
    deleteMutation.mutate(editingClient.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        setSelectedClient(null);
        setEditingClient(null);
        toast.success(fr ? "Client supprimé" : "Client deleted");
        announce(fr ? "Client supprimé" : "Client deleted");
      },
      onError: (err) => {
        toast.error(fr ? "Erreur lors de la suppression" : "Error deleting client");
        console.error(err);
      },
    });
  }, [editingClient, fr, announce, deleteMutation]);

  const openEdit = useCallback((c: ClientType) => {
    setEditingClient(c);
    setForm({ nom: c.nom, prenom: c.prenom, type: c.type, telephone: c.telephone, email: c.email, profession: c.profession, statut: c.statut, adresse: c.adresse || "", description: c.description || "" });
    setCustomProfession(!professions.includes(c.profession));
    setShowEditModal(true);
  }, []);

  const openDelete = useCallback((c: ClientType) => {
    setEditingClient(c);
    setShowDeleteDialog(true);
  }, []);

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

  // Export CSV via l'API backend
  const exportCSV = async () => {
    try {
      const blob = await exportClientsCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "clients.csv"; a.click();
      URL.revokeObjectURL(url);
      toast.success(fr ? "Export CSV téléchargé" : "CSV export downloaded");
    } catch {
      toast.error(fr ? "Erreur lors de l'export CSV" : "CSV export error");
    }
  };

  // Export Excel via l'API backend
  const exportExcel = async () => {
    try {
      const blob = await exportClientsExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "clients.xlsx"; a.click();
      URL.revokeObjectURL(url);
      toast.success(fr ? "Export Excel téléchargé" : "Excel export downloaded");
    } catch {
      toast.error(fr ? "Erreur lors de l'export Excel" : "Excel export error");
    }
  };



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
              <DropdownMenuItem onClick={exportExcel}><FileDown className="mr-2 h-4 w-4" /> {fr ? "Exporter Excel" : "Export Excel"}</DropdownMenuItem>
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
          <Input aria-label={fr ? "Rechercher un client" : "Search a client"} placeholder={fr ? "Rechercher par nom, code, email ou téléphone..." : "Search by name, code, email or phone..."} value={search} onChange={e => { setSearch(e.target.value); }} className="pl-10" />
        </div>
        <Select value={filter} onValueChange={v => { setFilter(v); setQuickFilter(null); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder={fr ? "Tous les types" : "All types"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{fr ? "Tous les types" : "All types"}</SelectItem>
            <SelectItem value="Physique">{fr ? "Personnes physiques" : "Individuals"}</SelectItem>
            <SelectItem value="Morale">{fr ? "Personnes morales" : "Legal entities"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtres rapides */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: null, label: fr ? "Tous" : "All" },
          { key: 'recent', label: fr ? "Récents" : "Recent" },
          { key: 'vip', label: "VIP" },
          { key: 'actif', label: fr ? "Actifs" : "Active" },
          { key: 'inactif', label: fr ? "Inactifs" : "Inactive" },
          { key: 'inactive', label: fr ? "Sans activité (90j)" : "Idle (90d)" },
        ].map((f) => (
          <Button key={f.key ?? 'all'} variant={quickFilter === f.key ? "default" : "outline"} size="sm"
            onClick={() => setQuickFilter(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>

      {/* Tableau des clients */}
      <ClientTable
        visibleClients={quickFilter && quickFilterClients ? quickFilterClients.map(toClientType) : allClients}
        filtered={quickFilter && quickFilterClients ? quickFilterClients.map(toClientType) : allClients}
        totalCount={quickFilter && quickFilterClients ? quickFilterClients.length : totalCount}
        hasMore={!!hasNextPage}
        fr={fr}
        search={search}
        loadMore={fetchNextPage}
        isFetchingMore={isFetchingNextPage}
        onView={(client) => { setSelectedClient(client); setDrawerTab("infos"); }}
        onEdit={openEdit}
        onDelete={openDelete}
        onOpenCreateDossier={openCreateDossier}
        onOpenCreateFacture={openCreateFacture}
        onOpenInvite={(client) => { setInviteClient(client); setShowInviteModal(true); }}
      />

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
                    { key: "historique", label: fr ? "Historique" : "History" },
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
                          ...(clientDetail ? [
                            { label: fr ? "Adresse" : "Address", value: clientDetail.adresse || "-" },
                            { label: fr ? "Ville" : "City", value: clientDetail.ville || "-" },
                            { label: fr ? "Pays" : "Country", value: clientDetail.pays || "-" },
                            ...(clientDetail.typeClient === 'MORALE' ? [
                              { label: "RCCM", value: clientDetail.numeroRccm || "-" },
                              { label: "NIF", value: clientDetail.nif || "-" },
                              { label: fr ? "Forme juridique" : "Legal form", value: clientDetail.formeJuridique || "-" },
                            ] : []),
                          ] : []),
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
                        {/* Bouton toggle statut */}
                        <div className="pt-3 border-t border-border">
                          <Button variant="outline" size="sm" onClick={() => toggleStatusMutation.mutate(selectedClient.id)} disabled={toggleStatusMutation.isPending}>
                            {selectedClient.statut === "Actif" ? (fr ? "Désactiver le client" : "Deactivate client") : (fr ? "Activer le client" : "Activate client")}
                          </Button>
                        </div>
                        {/* Doublons potentiels */}
                        {clientDuplicates.length > 0 && (
                          <div className="pt-3 border-t border-border">
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">{fr ? "Doublons potentiels détectés" : "Potential duplicates detected"}</p>
                            {clientDuplicates.map((dup: Record<string, unknown>) => (
                              <div key={String(dup.id)} className="flex items-center justify-between text-xs border-b border-border pb-2 mb-2 last:border-0">
                                <div>
                                  <span className="text-foreground">{String(dup.nomComplet || dup.nom || dup.denominationSociale || '')}</span>
                                  <span className="text-muted-foreground ml-2">{String(dup.email || '')}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 text-xs text-primary"
                                  onClick={() => mergeMutation.mutate({ sourceId: dup.id as string | number, targetId: selectedClient!.id })}>
                                  {fr ? "Fusionner" : "Merge"}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Onglet Dossiers */}
                    {drawerTab === "dossiers" && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FolderPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{fr ? "Aucun dossier pour ce client" : "No cases for this client"}</p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={() => openCreateDossier(selectedClient)}>
                          <FolderPlus className="mr-2 h-4 w-4" /> {fr ? "Créer un dossier" : "Create case"}
                        </Button>
                      </div>
                    )}

                    {/* Onglet Finances */}
                    {drawerTab === "finances" && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{fr ? "Aucune donnée financière disponible" : "No financial data available"}</p>
                      </div>
                    )}

                    {/* Onglet Documents */}
                    {drawerTab === "documents" && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{fr ? "Aucun document pour ce client" : "No documents for this client"}</p>
                      </div>
                    )}

                    {/* Onglet Historique */}
                    {drawerTab === "historique" && (
                      <div className="space-y-3">
                        {isLoadingHistorique ? (
                          <p className="text-sm text-muted-foreground text-center py-4">{fr ? "Chargement..." : "Loading..."}</p>
                        ) : clientHistorique.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{fr ? "Aucun historique pour ce client" : "No history for this client"}</p>
                          </div>
                        ) : (
                          clientHistorique.map((entry, i) => (
                            <div key={entry.id ?? i} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">{entry.type}</p>
                                <p className="text-xs text-muted-foreground">{entry.description}</p>
                                {entry.date && <p className="text-xs text-muted-foreground mt-1">{new Date(entry.date).toLocaleDateString(fr ? "fr-FR" : "en-US")}</p>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Onglet Communications — Contacts du client */}
                    {drawerTab === "communications" && (
                      <div className="space-y-3">
                        {isLoadingContacts ? (
                          <p className="text-sm text-muted-foreground text-center py-4">{fr ? "Chargement..." : "Loading..."}</p>
                        ) : clientContacts.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{fr ? "Aucun contact enregistré" : "No contacts recorded"}</p>
                          </div>
                        ) : (
                          clientContacts.map((contact: Record<string, unknown>) => (
                            <div key={String(contact.id)} className="flex items-start justify-between gap-2 border-b border-border pb-3 last:border-0">
                              <div>
                                <p className="text-sm font-medium text-foreground">{String(contact.nom || '')} {String(contact.prenom || '')}</p>
                                <p className="text-xs text-muted-foreground">{String(contact.email || '')} {contact.telephone ? `· ${String(contact.telephone)}` : ''}</p>
                                {contact.fonction && <p className="text-xs text-muted-foreground">{String(contact.fonction)}</p>}
                              </div>
                              <div className="flex items-center gap-1">
                                {!contact.principal && (
                                  <Button variant="ghost" size="sm" className="text-xs h-7"
                                    onClick={() => setContactPrincipalMutation.mutate({ clientId: selectedClient!.id, contactId: contact.id })}>
                                    {fr ? "Principal" : "Set primary"}
                                  </Button>
                                )}
                                {contact.principal && <span className="text-xs text-primary font-medium px-2">★</span>}
                                <Button variant="ghost" size="sm" className="h-7 text-destructive"
                                  onClick={() => deleteContactMutation.mutate({ clientId: selectedClient!.id, contactId: contact.id })}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                        {/* Ajout rapide de contact */}
                        <Button variant="outline" size="sm" className="w-full mt-2"
                          onClick={() => {
                            const nom = prompt(fr ? "Nom du contact :" : "Contact name:");
                            if (nom) addContactMutation.mutate({ clientId: selectedClient!.id, payload: { nom } });
                          }}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> {fr ? "Ajouter un contact" : "Add contact"}
                        </Button>
                      </div>
                    )}

                    {/* Onglet Statistiques */}
                    {drawerTab === "statistiques" && (
                      <div className="space-y-4">
                        {isLoadingStats ? (
                          <p className="text-sm text-muted-foreground text-center py-4">{fr ? "Chargement..." : "Loading..."}</p>
                        ) : !clientStats || Object.keys(clientStats).length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{fr ? "Statistiques non disponibles" : "Statistics not available"}</p>
                          </div>
                        ) : (
                          Object.entries(clientStats).map(([key, value]) => (
                            <div key={key} className="flex justify-between border-b border-border pb-3 last:border-0">
                              <span className="text-sm text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}</span>
                              <span className="text-sm font-medium text-foreground">{typeof value === 'number' ? value.toLocaleString(fr ? 'fr-FR' : 'en-US') : String(value ?? '-')}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Modaux clients ═══ */}
      <ClientModals
        fr={fr}
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        form={form}
        setForm={setForm}
        customProfession={customProfession}
        setCustomProfession={setCustomProfession}
        customRaison={customRaison}
        setCustomRaison={setCustomRaison}
        isSubmitting={isSubmitting}
        handleCreate={handleCreate}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        editingClient={editingClient}
        handleEdit={handleEdit}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        handleDelete={handleDelete}
        showCreateDossierModal={showCreateDossierModal}
        setShowCreateDossierModal={setShowCreateDossierModal}
        dossierClient={dossierClient}
        dossierForm={dossierForm}
        setDossierForm={setDossierForm}
        handleCreateDossier={handleCreateDossier}
        showCreateFactureModal={showCreateFactureModal}
        setShowCreateFactureModal={setShowCreateFactureModal}
        factureClient={factureClient}
        factureForm={factureForm}
        setFactureForm={setFactureForm}
        handleCreateFacture={handleCreateFacture}
        showInviteModal={showInviteModal}
        setShowInviteModal={setShowInviteModal}
        inviteClient={inviteClient}
        inscriptionLink={inscriptionLink}
        handleSendInvite={handleSendInvite}
        handleCopyLink={handleCopyLink}
      />


    </div>
  );
}