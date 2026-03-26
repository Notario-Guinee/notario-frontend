// ═══════════════════════════════════════════════════════════════
// Page Demandes de Congés — Deux vues distinctes et complètes
//   • Vue Employé  : solde, soumettre, suivre, annuler
//   • Vue Gérant   : tout voir, approuver, rejeter, récapitulatif
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Plus, Search, CalendarDays, CheckCircle2, XCircle, Clock,
  CalendarCheck, CalendarX, Trash2, Users, BarChart3, FileText,
  ChevronDown, ChevronUp, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────

type TypeConge =
  | "Congé annuel"
  | "Congé maladie"
  | "Congé sans solde"
  | "Congé maternité/paternité"
  | "Autre";

type StatutConge = "En attente" | "Approuvé" | "Rejeté";

interface Employe {
  id: string;
  nom: string;
  prenom: string;
  code: string;
  role: string;
  soldeAnnuel: number; // jours accordés / an
}

interface DemandeConge {
  id: string;
  employeId: string;
  employeNom: string;  // "Prénom Nom"
  employeCode: string;
  employeRole: string;
  type: TypeConge;
  dateDebut: string;
  dateFin: string;
  nombreJours: number;
  motif: string;
  statut: StatutConge;
  motifRejet?: string;
  dateCreation: string;
  dateDecision?: string;
}

// ─── Mock ─────────────────────────────────────────────────────────

const EMPLOYES: Employe[] = [
  { id: "1", prenom: "Mamadou",  nom: "Diallo",   code: "USR-001", role: "Gérant",     soldeAnnuel: 30 },
  { id: "2", prenom: "Aissata",  nom: "Keita",    code: "USR-002", role: "Notaire",    soldeAnnuel: 25 },
  { id: "3", prenom: "Boubacar", nom: "Diallo",   code: "USR-003", role: "Comptable",  soldeAnnuel: 25 },
  { id: "4", prenom: "Fatoumata",nom: "Bah",      code: "USR-004", role: "Standard",   soldeAnnuel: 20 },
  { id: "5", prenom: "Sékou",    nom: "Camara",   code: "USR-005", role: "Standard",   soldeAnnuel: 20 },
];

const INITIAL_DEMANDES: DemandeConge[] = [
  {
    id: "D-001", employeId: "2", employeNom: "Aissata Keita",
    employeCode: "USR-002", employeRole: "Notaire",
    type: "Congé annuel", dateDebut: "2026-04-07", dateFin: "2026-04-11",
    nombreJours: 5, motif: "Vacances en famille",
    statut: "En attente", dateCreation: "2026-03-20",
  },
  {
    id: "D-002", employeId: "3", employeNom: "Boubacar Diallo",
    employeCode: "USR-003", employeRole: "Comptable",
    type: "Congé maladie", dateDebut: "2026-03-18", dateFin: "2026-03-20",
    nombreJours: 3, motif: "Indisposition médicale",
    statut: "Approuvé", dateCreation: "2026-03-17", dateDecision: "2026-03-17",
  },
  {
    id: "D-003", employeId: "4", employeNom: "Fatoumata Bah",
    employeCode: "USR-004", employeRole: "Standard",
    type: "Congé annuel", dateDebut: "2026-03-25", dateFin: "2026-03-28",
    nombreJours: 4, motif: "Déplacement personnel",
    statut: "Rejeté",
    motifRejet: "Période chargée — report recommandé après le 15 avril.",
    dateCreation: "2026-03-10", dateDecision: "2026-03-12",
  },
  {
    id: "D-004", employeId: "2", employeNom: "Aissata Keita",
    employeCode: "USR-002", employeRole: "Notaire",
    type: "Congé sans solde", dateDebut: "2026-05-01", dateFin: "2026-05-05",
    nombreJours: 5, motif: "Formation personnelle à l'étranger",
    statut: "En attente", dateCreation: "2026-03-22",
  },
  {
    id: "D-005", employeId: "1", employeNom: "Mamadou Diallo",
    employeCode: "USR-001", employeRole: "Gérant",
    type: "Congé annuel", dateDebut: "2026-06-02", dateFin: "2026-06-06",
    nombreJours: 5, motif: "Repos annuel",
    statut: "Approuvé", dateCreation: "2026-03-01", dateDecision: "2026-03-01",
  },
  {
    id: "D-006", employeId: "5", employeNom: "Sékou Camara",
    employeCode: "USR-005", employeRole: "Standard",
    type: "Congé annuel", dateDebut: "2026-04-14", dateFin: "2026-04-18",
    nombreJours: 5, motif: "Événement familial",
    statut: "En attente", dateCreation: "2026-03-24",
  },
];

// ─── Utilitaires ──────────────────────────────────────────────────

function joursOuvres(debut: string, fin: string): number {
  if (!debut || !fin) return 0;
  const d1 = new Date(debut), d2 = new Date(fin);
  if (d2 < d1) return 0;
  let count = 0;
  const cur = new Date(d1);
  while (cur <= d2) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function initiales(nom: string) {
  return nom.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Badge statut ─────────────────────────────────────────────────

function BadgeStatut({ statut }: { statut: StatutConge }) {
  const cfg: Record<StatutConge, { cls: string; Icon: typeof Clock }> = {
    "En attente": { cls: "bg-warning/15 text-warning border-warning/30",            Icon: Clock        },
    "Approuvé":   { cls: "bg-success/15 text-success border-success/30",            Icon: CheckCircle2 },
    "Rejeté":     { cls: "bg-destructive/15 text-destructive border-destructive/30", Icon: XCircle     },
  };
  const { cls, Icon } = cfg[statut];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", cls)}>
      <Icon className="h-3 w-3" /> {statut}
    </span>
  );
}

// ─── Carte KPI mini ───────────────────────────────────────────────

function KpiMini({
  label, value, sub, Icon, color, delay = 0,
}: {
  label: string; value: number | string; sub?: string;
  Icon: React.ElementType; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════
// Page principale
// ═════════════════════════════════════════════════════════════════

export default function Conges() {
  const { lang } = useLanguage();
  const fr = lang === "FR";

  // Vue active : "employe" ou "gerant"
  const [view, setView] = useState<"employe" | "gerant">("employe");

  // Employé courant sélectionné (vue employé)
  const [currentEmployeId, setCurrentEmployeId] = useState("2"); // Aissata Keita par défaut
  const currentEmploye = EMPLOYES.find(e => e.id === currentEmployeId)!;

  const [demandes, setDemandes] = useState<DemandeConge[]>(INITIAL_DEMANDES);

  // ─── Modales partagées ───────────────────────────────────────────
  const [detailing,  setDetailing]  = useState<DemandeConge | null>(null);
  const [approving,  setApproving]  = useState<DemandeConge | null>(null);
  const [rejecting,  setRejecting]  = useState<DemandeConge | null>(null);
  const [motifRejet, setMotifRejet] = useState("");
  const [canceling,  setCanceling]  = useState<DemandeConge | null>(null);

  // ─── Handlers décision ───────────────────────────────────────────
  const handleApprove = () => {
    if (!approving) return;
    setDemandes(prev => prev.map(d =>
      d.id === approving.id
        ? { ...d, statut: "Approuvé" as const, dateDecision: new Date().toISOString().slice(0, 10) }
        : d,
    ));
    toast.success(fr ? `Demande de ${approving.employeNom} approuvée.` : `${approving.employeNom}'s request approved.`);
    setApproving(null);
  };

  const handleReject = () => {
    if (!rejecting || !motifRejet.trim()) return;
    setDemandes(prev => prev.map(d =>
      d.id === rejecting.id
        ? { ...d, statut: "Rejeté" as const, motifRejet, dateDecision: new Date().toISOString().slice(0, 10) }
        : d,
    ));
    toast.success(fr ? `Demande de ${rejecting.employeNom} rejetée.` : `${rejecting.employeNom}'s request rejected.`);
    setRejecting(null);
    setMotifRejet("");
  };

  const handleCancel = () => {
    if (!canceling) return;
    setDemandes(prev => prev.filter(d => d.id !== canceling.id));
    toast.success(fr ? "Demande annulée." : "Request cancelled.");
    setCanceling(null);
  };

  return (
    <div className="space-y-6">

      {/* ── Sélecteur de vue ─────────────────────────────────────── */}
      <div>
        <h1 className="font-heading text-xl font-bold text-foreground mb-4">
          {fr ? "Demandes de congés" : "Leave Requests"}
        </h1>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          {(["employe", "gerant"] as const).map(v => {
            const isActive = view === v;
            const Icon = v === "employe" ? User : Users;
            return (
              <button key={v} onClick={() => setView(v)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}>
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted",
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    {v === "employe" ? (fr ? "Vue Employé" : "Employee View") : (fr ? "Vue Gérant" : "Manager View")}
                  </p>
                  <p className="text-[11px] opacity-70">
                    {v === "employe"
                      ? (fr ? "Mes demandes" : "My requests")
                      : (fr ? "Gérer l'équipe" : "Manage team")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VUE EMPLOYÉ
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {view === "employe" && (
          <motion.div key="employe"
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
            className="space-y-6">
            <VueEmploye
              employes={EMPLOYES}
              currentEmployeId={currentEmployeId}
              setCurrentEmployeId={setCurrentEmployeId}
              currentEmploye={currentEmploye}
              demandes={demandes}
              setDemandes={setDemandes}
              onDetail={setDetailing}
              onCancel={setCanceling}
              fr={fr}
            />
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VUE GÉRANT
        ══════════════════════════════════════════════════════════ */}
        {view === "gerant" && (
          <motion.div key="gerant"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }}
            className="space-y-6">
            <VueGerant
              employes={EMPLOYES}
              demandes={demandes}
              onApprove={setApproving}
              onReject={(d) => { setRejecting(d); setMotifRejet(""); }}
              onDetail={setDetailing}
              fr={fr}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          Modales partagées
      ══════════════════════════════════════════════════════════ */}

      {/* Détail */}
      <Dialog open={!!detailing} onOpenChange={o => !o && setDetailing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{fr ? "Détail de la demande" : "Request details"}</DialogTitle>
          </DialogHeader>
          {detailing && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {([
                  [fr ? "Employé"      : "Employee",     detailing.employeNom ],
                  ["Code",                                detailing.employeCode],
                  [fr ? "Rôle"         : "Role",         detailing.employeRole],
                  ["Type",                                detailing.type       ],
                  [fr ? "Début"        : "Start",        detailing.dateDebut  ],
                  [fr ? "Fin"          : "End",          detailing.dateFin    ],
                  [fr ? "Jours ouvrés" : "Working days", `${detailing.nombreJours} j`],
                  [fr ? "Soumis le"    : "Submitted",    detailing.dateCreation],
                ] as [string, string][]).map(([lbl, val]) => (
                  <div key={lbl}>
                    <p className="text-xs text-muted-foreground">{lbl}</p>
                    <p className="font-medium text-foreground">{val}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{fr ? "Motif" : "Reason"}</p>
                <p className="bg-muted/30 rounded-lg p-2.5">{detailing.motif}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{fr ? "Statut" : "Status"} :</p>
                <BadgeStatut statut={detailing.statut} />
              </div>
              {detailing.statut === "Rejeté" && detailing.motifRejet && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-xs font-semibold text-destructive mb-1">
                    {fr ? "Motif du rejet" : "Rejection reason"}
                  </p>
                  <p className="text-sm text-destructive/90">{detailing.motifRejet}</p>
                </div>
              )}
              {detailing.dateDecision && (
                <p className="text-xs text-muted-foreground">
                  {fr ? `Décision rendue le ${detailing.dateDecision}` : `Decision on ${detailing.dateDecision}`}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDetailing(null)}>
              {fr ? "Fermer" : "Close"}
            </Button>
            {detailing?.statut === "En attente" && view === "gerant" && (
              <>
                <Button className="bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => { setApproving(detailing); setDetailing(null); }}>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> {fr ? "Approuver" : "Approve"}
                </Button>
                <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => { setRejecting(detailing); setMotifRejet(""); setDetailing(null); }}>
                  <XCircle className="mr-1.5 h-4 w-4" /> {fr ? "Rejeter" : "Reject"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approbation */}
      <AlertDialog open={!!approving} onOpenChange={o => !o && setApproving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fr ? "Approuver cette demande ?" : "Approve this request?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {approving && (fr
                ? `Vous allez approuver ${approving.nombreJours} jour(s) de "${approving.type}" pour ${approving.employeNom} (${approving.dateDebut} → ${approving.dateFin}).`
                : `Approving ${approving.nombreJours} day(s) of "${approving.type}" for ${approving.employeNom}.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr ? "Annuler" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} className="bg-success text-success-foreground hover:bg-success/90">
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> {fr ? "Approuver" : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejet avec motif */}
      <Dialog open={!!rejecting} onOpenChange={o => !o && setRejecting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">{fr ? "Rejeter la demande" : "Reject request"}</DialogTitle>
            <DialogDescription>
              {rejecting && `${rejecting.employeNom} — ${rejecting.nombreJours}j (${rejecting.dateDebut} → ${rejecting.dateFin})`}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              {fr ? "Motif du rejet" : "Rejection reason"} *
            </Label>
            <textarea value={motifRejet} onChange={e => setMotifRejet(e.target.value)}
              placeholder={fr ? "Expliquez pourquoi cette demande est rejetée…" : "Explain why this request is rejected…"}
              rows={4}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-destructive/30" />
            {!motifRejet.trim() && (
              <p className="text-xs text-destructive mt-1">{fr ? "Le motif est obligatoire." : "Reason is required."}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button onClick={handleReject} disabled={!motifRejet.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <CalendarX className="mr-1.5 h-4 w-4" /> {fr ? "Confirmer le rejet" : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Annulation employé */}
      <AlertDialog open={!!canceling} onOpenChange={o => !o && setCanceling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fr ? "Annuler cette demande ?" : "Cancel this request?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {canceling && (fr
                ? `Votre demande de "${canceling.type}" (${canceling.dateDebut} → ${canceling.dateFin}) sera définitivement supprimée.`
                : `Your "${canceling.type}" request (${canceling.dateDebut} → ${canceling.dateFin}) will be permanently removed.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr ? "Retour" : "Back"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {fr ? "Annuler la demande" : "Cancel request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// Sous-composant : Vue Employé
// ═════════════════════════════════════════════════════════════════

function VueEmploye({
  employes, currentEmployeId, setCurrentEmployeId, currentEmploye,
  demandes, setDemandes, onDetail, onCancel, fr,
}: {
  employes: Employe[];
  currentEmployeId: string;
  setCurrentEmployeId: (id: string) => void;
  currentEmploye: Employe;
  demandes: DemandeConge[];
  setDemandes: React.Dispatch<React.SetStateAction<DemandeConge[]>>;
  onDetail: (d: DemandeConge) => void;
  onCancel: (d: DemandeConge) => void;
  fr: boolean;
}) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<{ type: TypeConge; dateDebut: string; dateFin: string; motif: string }>({
    type: "Congé annuel", dateDebut: "", dateFin: "", motif: "",
  });
  const formJours = useMemo(() => joursOuvres(form.dateDebut, form.dateFin), [form.dateDebut, form.dateFin]);

  const mesDemandes = useMemo(
    () => demandes.filter(d => d.employeId === currentEmployeId),
    [demandes, currentEmployeId],
  );

  const joursPris    = mesDemandes.filter(d => d.statut === "Approuvé").reduce((s, d) => s + d.nombreJours, 0);
  const joursEnCours = mesDemandes.filter(d => d.statut === "En attente").reduce((s, d) => s + d.nombreJours, 0);
  const joursRestants = Math.max(0, currentEmploye.soldeAnnuel - joursPris);

  const handleSubmit = () => {
    if (!form.dateDebut || !form.dateFin || !form.motif.trim() || formJours <= 0) return;
    const id = `D-${String(demandes.length + 1).padStart(3, "0")}`;
    setDemandes(prev => [{
      id,
      employeId: currentEmploye.id,
      employeNom: `${currentEmploye.prenom} ${currentEmploye.nom}`,
      employeCode: currentEmploye.code,
      employeRole: currentEmploye.role,
      type: form.type,
      dateDebut: form.dateDebut,
      dateFin: form.dateFin,
      nombreJours: formJours,
      motif: form.motif,
      statut: "En attente",
      dateCreation: new Date().toISOString().slice(0, 10),
    }, ...prev]);
    setShowNew(false);
    setForm({ type: "Congé annuel", dateDebut: "", dateFin: "", motif: "" });
    toast.success(fr ? "Demande soumise avec succès." : "Request submitted successfully.");
  };

  return (
    <>
      {/* Sélecteur employé (demo) + en-tête */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            {initiales(`${currentEmploye.prenom} ${currentEmploye.nom}`)}
          </div>
          <div>
            <p className="font-semibold text-foreground">{currentEmploye.prenom} {currentEmploye.nom}</p>
            <p className="text-xs text-muted-foreground">{currentEmploye.code} · {currentEmploye.role}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <select value={currentEmployeId} onChange={e => setCurrentEmployeId(e.target.value)}
            className="h-8 rounded-lg border border-primary/30 bg-background px-2 text-xs text-foreground">
            {employes.map(e => (
              <option key={e.id} value={e.id}>{e.prenom} {e.nom} ({e.role})</option>
            ))}
          </select>
          <Button size="sm" onClick={() => setShowNew(true)}
            className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            {fr ? "Nouvelle demande" : "New request"}
          </Button>
        </div>
      </div>

      {/* KPI solde */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiMini label={fr ? "Solde annuel"   : "Annual balance"}  value={currentEmploye.soldeAnnuel} sub={fr ? "jours accordés" : "days granted"}   Icon={CalendarDays}  color="text-primary"      delay={0}    />
        <KpiMini label={fr ? "Jours restants" : "Days remaining"}  value={joursRestants}              sub={fr ? "disponibles"   : "available"}        Icon={CalendarCheck} color="text-success"      delay={0.06} />
        <KpiMini label={fr ? "Jours pris"     : "Days taken"}      value={joursPris}                  sub={fr ? "approuvés"     : "approved"}         Icon={CheckCircle2}  color="text-muted-foreground" delay={0.12} />
        <KpiMini label={fr ? "En attente"     : "Pending"}         value={joursEnCours}               sub={fr ? "jours en cours": "days pending"}     Icon={Clock}         color="text-warning"      delay={0.18} />
      </div>

      {/* Barre de progression solde */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">
            {fr ? "Utilisation du solde de congés" : "Leave balance usage"}
          </p>
          <p className="text-xs text-muted-foreground">
            {joursPris} / {currentEmploye.soldeAnnuel} {fr ? "jours" : "days"}
          </p>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              joursPris / currentEmploye.soldeAnnuel > 0.8 ? "bg-destructive" :
              joursPris / currentEmploye.soldeAnnuel > 0.5 ? "bg-warning" : "bg-success",
            )}
            style={{ width: `${Math.min(100, (joursPris / currentEmploye.soldeAnnuel) * 100)}%` }}
          />
        </div>
        {joursRestants <= 3 && joursRestants > 0 && (
          <p className="text-xs text-warning mt-1.5">
            {fr ? `⚠ Plus que ${joursRestants} jour(s) disponible(s).` : `⚠ Only ${joursRestants} day(s) left.`}
          </p>
        )}
        {joursRestants === 0 && (
          <p className="text-xs text-destructive mt-1.5">
            {fr ? "Solde de congés épuisé pour cette année." : "Leave balance exhausted for this year."}
          </p>
        )}
      </div>

      {/* Tableau des demandes */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">
            {fr ? "Mes demandes" : "My requests"}
            <span className="ml-2 text-xs font-normal text-muted-foreground">({mesDemandes.length})</span>
          </h3>
        </div>

        {mesDemandes.length === 0 ? (
          <div className="py-14 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{fr ? "Aucune demande pour l'instant." : "No requests yet."}</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={() => setShowNew(true)}>
              <Plus className="mr-2 h-4 w-4" /> {fr ? "Faire une demande" : "Submit a request"}
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[fr ? "Type" : "Type", fr ? "Période" : "Period", fr ? "Jours" : "Days",
                  fr ? "Motif" : "Reason", fr ? "Statut" : "Status", fr ? "Actions" : "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mesDemandes.map((d, i) => (
                <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{d.type}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {d.dateDebut} → {d.dateFin}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-foreground">{d.nombreJours}j</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-[180px] truncate">{d.motif}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <BadgeStatut statut={d.statut} />
                      {d.statut === "Rejeté" && d.motifRejet && (
                        <p className="text-[11px] text-destructive/80 max-w-[160px] truncate" title={d.motifRejet}>
                          {d.motifRejet}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onDetail(d)} className="text-xs text-primary hover:underline">
                        {fr ? "Voir" : "View"}
                      </button>
                      {d.statut === "En attente" && (
                        <button onClick={() => onCancel(d)}
                          className="text-xs text-destructive hover:underline">
                          {fr ? "Annuler" : "Cancel"}
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modale nouvelle demande */}
      <Dialog open={showNew} onOpenChange={o => !o && setShowNew(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{fr ? "Nouvelle demande de congé" : "New leave request"}</DialogTitle>
            <DialogDescription>
              {fr
                ? `Solde disponible : ${joursRestants} jour(s) sur ${currentEmploye.soldeAnnuel}`
                : `Available balance: ${joursRestants} day(s) of ${currentEmploye.soldeAnnuel}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{fr ? "Type de congé" : "Leave type"}</Label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TypeConge }))}
                className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                {(["Congé annuel", "Congé maladie", "Congé sans solde", "Congé maternité/paternité", "Autre"] as TypeConge[])
                  .map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">{fr ? "Date de début" : "Start date"} *</Label>
                <Input type="date" value={form.dateDebut}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">{fr ? "Date de fin" : "End date"} *</Label>
                <Input type="date" value={form.dateFin}
                  min={form.dateDebut || new Date().toISOString().slice(0, 10)}
                  onChange={e => setForm(f => ({ ...f, dateFin: e.target.value }))} className="mt-1" />
              </div>
            </div>
            {form.dateDebut && form.dateFin && formJours > 0 && (
              <div className={cn(
                "rounded-lg border px-3 py-2 flex items-center gap-2",
                formJours > joursRestants
                  ? "bg-destructive/10 border-destructive/20"
                  : "bg-primary/5 border-primary/20",
              )}>
                <CalendarDays className={cn("h-4 w-4 shrink-0", formJours > joursRestants ? "text-destructive" : "text-primary")} />
                <p className="text-sm">
                  <span className={cn("font-semibold", formJours > joursRestants ? "text-destructive" : "text-primary")}>
                    {formJours}
                  </span>{" "}
                  {fr ? "jour(s) ouvré(s)" : "working day(s)"}
                  {formJours > joursRestants && (
                    <span className="text-destructive text-xs ml-2">
                      {fr ? `— dépasse votre solde (${joursRestants}j)` : `— exceeds your balance (${joursRestants}d)`}
                    </span>
                  )}
                </p>
              </div>
            )}
            {form.dateDebut && form.dateFin && formJours <= 0 && (
              <p className="text-xs text-destructive">
                {fr ? "La date de fin doit être après la date de début." : "End date must be after start date."}
              </p>
            )}
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{fr ? "Motif" : "Reason"} *</Label>
              <textarea value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))}
                placeholder={fr ? "Décrivez brièvement le motif…" : "Briefly describe the reason…"}
                rows={3}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSubmit}
              disabled={!form.dateDebut || !form.dateFin || !form.motif.trim() || formJours <= 0}>
              {fr ? "Soumettre" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════
// Sous-composant : Vue Gérant
// ═════════════════════════════════════════════════════════════════

function VueGerant({
  employes, demandes, onApprove, onReject, onDetail, fr,
}: {
  employes: Employe[];
  demandes: DemandeConge[];
  onApprove: (d: DemandeConge) => void;
  onReject: (d: DemandeConge) => void;
  onDetail: (d: DemandeConge) => void;
  fr: boolean;
}) {
  const [search, setSearch]               = useState("");
  const [filterStatut, setFilterStatut]   = useState<"Tous" | StatutConge>("Tous");
  const [filterType, setFilterType]       = useState<"Tous" | TypeConge>("Tous");
  const [filterEmploye, setFilterEmploye] = useState("Tous");
  const [showRecap, setShowRecap]         = useState(false);

  const pending  = demandes.filter(d => d.statut === "En attente").length;
  const approved = demandes.filter(d => d.statut === "Approuvé").length;
  const rejected = demandes.filter(d => d.statut === "Rejeté").length;
  const totalJoursApprouves = demandes.filter(d => d.statut === "Approuvé").reduce((s, d) => s + d.nombreJours, 0);

  const filtered = useMemo(() =>
    demandes.filter(d => {
      const matchSearch = !search ||
        d.employeNom.toLowerCase().includes(search.toLowerCase()) ||
        d.employeCode.toLowerCase().includes(search.toLowerCase());
      const matchStatut   = filterStatut   === "Tous" || d.statut    === filterStatut;
      const matchType     = filterType     === "Tous" || d.type      === filterType;
      const matchEmploye  = filterEmploye  === "Tous" || d.employeId === filterEmploye;
      return matchSearch && matchStatut && matchType && matchEmploye;
    }),
  [demandes, search, filterStatut, filterType, filterEmploye]);

  // Récapitulatif par employé
  const recapParEmploye = useMemo(() =>
    employes.map(e => {
      const dems = demandes.filter(d => d.employeId === e.id);
      const pris = dems.filter(d => d.statut === "Approuvé").reduce((s, d) => s + d.nombreJours, 0);
      return {
        employe: e,
        total: dems.length,
        enAttente: dems.filter(d => d.statut === "En attente").length,
        approuve: dems.filter(d => d.statut === "Approuvé").length,
        rejete: dems.filter(d => d.statut === "Rejeté").length,
        joursPris: pris,
        joursRestants: Math.max(0, e.soldeAnnuel - pris),
      };
    }),
  [employes, demandes]);

  return (
    <>
      {/* KPI globaux */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiMini label={fr ? "En attente"         : "Pending"}          value={pending}              Icon={Clock}        color="text-warning"          delay={0}    />
        <KpiMini label={fr ? "Approuvées"          : "Approved"}         value={approved}             Icon={CheckCircle2} color="text-success"          delay={0.06} />
        <KpiMini label={fr ? "Rejetées"            : "Rejected"}         value={rejected}             Icon={XCircle}      color="text-destructive"      delay={0.12} />
        <KpiMini label={fr ? "Jours accordés"      : "Days granted"}     value={totalJoursApprouves}  Icon={CalendarDays} color="text-primary"          delay={0.18} />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={fr ? "Rechercher…" : "Search…"} value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={filterEmploye} onChange={e => setFilterEmploye(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="Tous">{fr ? "Tous les employés" : "All employees"}</option>
          {employes.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as typeof filterStatut)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="Tous">{fr ? "Tous statuts" : "All statuses"}</option>
          <option value="En attente">{fr ? "En attente" : "Pending"}</option>
          <option value="Approuvé">{fr ? "Approuvé" : "Approved"}</option>
          <option value="Rejeté">{fr ? "Rejeté" : "Rejected"}</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value as typeof filterType)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="Tous">{fr ? "Tous types" : "All types"}</option>
          {(["Congé annuel", "Congé maladie", "Congé sans solde", "Congé maternité/paternité", "Autre"] as TypeConge[])
            .map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <Button variant="outline" size="sm" className="ml-auto gap-2" onClick={() => setShowRecap(v => !v)}>
          <BarChart3 className="h-4 w-4" />
          {fr ? "Récapitulatif" : "Summary"}
          {showRecap ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Récapitulatif par employé */}
      <AnimatePresence>
        {showRecap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-muted/30">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  {fr ? "Récapitulatif par employé" : "Per-employee summary"}
                </h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      fr ? "Employé"      : "Employee",
                      fr ? "Solde annuel" : "Annual",
                      fr ? "Pris"         : "Taken",
                      fr ? "Restant"      : "Left",
                      fr ? "En attente"   : "Pending",
                      fr ? "Rejeté"       : "Rejected",
                    ].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recapParEmploye.map(r => (
                    <tr key={r.employe.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                            {initiales(`${r.employe.prenom} ${r.employe.nom}`)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{r.employe.prenom} {r.employe.nom}</p>
                            <p className="text-[11px] text-muted-foreground">{r.employe.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-sm font-mono text-foreground">{r.employe.soldeAnnuel}j</td>
                      <td className="px-4 py-2.5 text-sm font-mono font-semibold text-foreground">{r.joursPris}j</td>
                      <td className="px-4 py-2.5">
                        <span className={cn("text-sm font-mono font-semibold",
                          r.joursRestants <= 3 ? "text-destructive" :
                          r.joursRestants <= 8 ? "text-warning" : "text-success")}>
                          {r.joursRestants}j
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm font-mono text-warning">{r.enAttente}</td>
                      <td className="px-4 py-2.5 text-sm font-mono text-destructive">{r.rejete}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tableau principal */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {fr ? "Toutes les demandes" : "All requests"}
            <span className="ml-2 text-xs font-normal text-muted-foreground">({filtered.length})</span>
          </h3>
          {pending > 0 && (
            <span className="rounded-full bg-warning/20 text-warning border border-warning/30 text-[11px] font-semibold px-2.5 py-0.5">
              {pending} {fr ? "en attente" : "pending"}
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <CalendarCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{fr ? "Aucune demande trouvée." : "No requests found."}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  fr ? "Employé"  : "Employee",
                  fr ? "Type"     : "Type",
                  fr ? "Période"  : "Period",
                  fr ? "Jours"    : "Days",
                  fr ? "Statut"   : "Status",
                  fr ? "Actions"  : "Actions",
                ].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-muted/20 transition-colors",
                    d.statut === "En attente" && "bg-warning/5",
                  )}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {initiales(d.employeNom)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.employeNom}</p>
                        <p className="text-[11px] text-muted-foreground">{d.employeCode} · {d.employeRole}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{d.type}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {d.dateDebut} → {d.dateFin}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-foreground">{d.nombreJours}j</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <BadgeStatut statut={d.statut} />
                      {d.statut === "Rejeté" && d.motifRejet && (
                        <p className="text-[11px] text-destructive/80 max-w-[180px] truncate" title={d.motifRejet}>
                          {d.motifRejet}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button onClick={() => onDetail(d)} className="text-xs text-primary hover:underline mr-1">
                        {fr ? "Détail" : "Detail"}
                      </button>
                      {d.statut === "En attente" && (
                        <>
                          <Button size="sm" variant="outline"
                            className="h-7 px-2.5 text-xs text-success border-success/30 hover:bg-success/10"
                            onClick={() => onApprove(d)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            {fr ? "Approuver" : "Approve"}
                          </Button>
                          <Button size="sm" variant="outline"
                            className="h-7 px-2.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => onReject(d)}>
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            {fr ? "Rejeter" : "Reject"}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
