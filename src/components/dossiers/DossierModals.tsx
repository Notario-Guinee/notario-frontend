// ═══════════════════════════════════════════════════════════════
// DossierModals — Tous les Dialog / AlertDialog de la page Dossiers
// Props : états de modaux + handlers fournis par Dossiers.tsx
// ═══════════════════════════════════════════════════════════════

import { X, Receipt, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatGNF, mockClients, rolesParties, type Dossier, type PartiePrenanteEntry } from "@/data/mockData";
import { TYPES_ACTE } from "@/data/constants";

const typesActe = TYPES_ACTE;
const statuts: Dossier["statut"][] = ["En cours", "En signature", "En attente pièces", "Terminé", "Suspendu", "Archivé"];
const priorites: Dossier["priorite"][] = ["Basse", "Normale", "Haute", "Urgente"];

export interface DossierForm {
  typeActe: string;
  objet: string;
  clients: string;
  montant: string;
  statut: Dossier["statut"];
  priorite: Dossier["priorite"];
  notaire: string;
  notes: string;
}

export interface FactureForm {
  montant: string;
  description: string;
  echeance: string;
}

interface DossierModalsProps {
  fr: boolean;

  // Create dossier
  showCreateModal: boolean;
  setShowCreateModal: (v: boolean) => void;
  form: DossierForm;
  setForm: React.Dispatch<React.SetStateAction<DossierForm>>;
  isSubmitting: boolean;
  handleCreate: () => void;

  // Edit dossier
  showEditModal: boolean;
  setShowEditModal: (v: boolean) => void;
  editingDossier: Dossier | null;
  handleEdit: () => void;

  // Delete dossier
  showDeleteDialog: boolean;
  setShowDeleteDialog: (v: boolean) => void;
  handleDelete: () => void;

  // Parties prenantes
  showPartiesModal: boolean;
  setShowPartiesModal: (v: boolean) => void;
  partiesDossier: Dossier | null;
  partiesList: PartiePrenanteEntry[];
  newPartie: { clientSearch: string; role: PartiePrenanteEntry["role"] };
  setNewPartie: React.Dispatch<React.SetStateAction<{ clientSearch: string; role: PartiePrenanteEntry["role"] }>>;
  clientSuggestions: typeof mockClients;
  searchClients: (query: string) => void;
  addPartie: (client: typeof mockClients[0]) => void;
  removePartie: (code: string) => void;
  saveParties: () => void;

  // Generate facture
  showFactureModal: boolean;
  setShowFactureModal: (v: boolean) => void;
  factureDossier: Dossier | null;
  factureForm: FactureForm;
  setFactureForm: React.Dispatch<React.SetStateAction<FactureForm>>;
  handleCreateFacture: () => void;
}

export function DossierModals({
  fr,
  showCreateModal, setShowCreateModal,
  form, setForm,
  isSubmitting, handleCreate,
  showEditModal, setShowEditModal,
  editingDossier, handleEdit,
  showDeleteDialog, setShowDeleteDialog, handleDelete,
  showPartiesModal, setShowPartiesModal,
  partiesDossier, partiesList,
  newPartie, setNewPartie,
  clientSuggestions, searchClients, addPartie, removePartie, saveParties,
  showFactureModal, setShowFactureModal,
  factureDossier, factureForm, setFactureForm, handleCreateFacture,
}: DossierModalsProps) {
  return (
    <>
      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Nouveau dossier" : "New Case"}</DialogTitle>
            <DialogDescription>{fr ? "Remplissez les informations pour créer un nouveau dossier" : "Fill in the information to create a new case"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Type d'acte *" : "Deed type *"}</Label>
                <Select value={form.typeActe} onValueChange={v => setForm(f => ({ ...f, typeActe: v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? "Sélectionner" : "Select"} /></SelectTrigger>
                  <SelectContent>{typesActe.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Priorité" : "Priority"}</Label>
                <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v as Dossier["priorite"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{priorites.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Objet du dossier" : "Case subject"}</Label>
              <Input value={form.objet} onChange={e => setForm(f => ({ ...f, objet: e.target.value }))} placeholder={fr ? "Ex: Vente villa Kipé" : "E.g.: Villa sale Kipé"} />
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Client(s) *" : "Client(s) *"} <span className="text-xs text-muted-foreground">({fr ? "codes ou noms séparés par des virgules" : "codes or names separated by commas"})</span></Label>
              <Input value={form.clients} onChange={e => setForm(f => ({ ...f, clients: e.target.value }))} placeholder={fr ? "C-1201, C-1203 ou Bah Oumar, Diallo" : "C-1201, C-1203 or Bah Oumar, Diallo"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Montant (GNF)" : "Amount (GNF)"}</Label>
                <Input type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Notaire responsable" : "Responsible notary"}</Label>
                <Input value={form.notaire} onChange={e => setForm(f => ({ ...f, notaire: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={fr ? "Notes internes..." : "Internal notes..."} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={isSubmitting || !form.typeActe?.trim() || !form.clients?.trim()}>
              {isSubmitting ? (fr ? "Création..." : "Creating...") : (fr ? "Créer le dossier" : "Create case")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Modifier le dossier" : "Edit Case"}</DialogTitle>
            <DialogDescription>{fr ? `Modifiez les informations du dossier ${editingDossier?.code}` : `Edit case ${editingDossier?.code} information`}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Type d'acte" : "Deed type"}</Label>
                <Select value={form.typeActe} onValueChange={v => setForm(f => ({ ...f, typeActe: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{typesActe.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Statut" : "Status"}</Label>
                <Select value={form.statut} onValueChange={v => setForm(f => ({ ...f, statut: v as Dossier["statut"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statuts.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Objet" : "Subject"}</Label>
              <Input value={form.objet} onChange={e => setForm(f => ({ ...f, objet: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{fr ? "Client(s)" : "Client(s)"} <span className="text-xs text-muted-foreground">({fr ? "codes ou noms séparés par des virgules" : "codes or names separated by commas"})</span></Label>
              <Input value={form.clients} onChange={e => setForm(f => ({ ...f, clients: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Montant (GNF)" : "Amount (GNF)"}</Label>
                <Input type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Priorité" : "Priority"}</Label>
                <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v as Dossier["priorite"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{priorites.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleEdit}>{fr ? "Enregistrer" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fr ? "Supprimer ce dossier ?" : "Delete this case?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {fr
                ? <>Le dossier <strong>{editingDossier?.code}</strong> — {editingDossier?.objet} sera supprimé définitivement.</>
                : <>Case <strong>{editingDossier?.code}</strong> — {editingDossier?.objet} will be permanently deleted.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr ? "Annuler" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{fr ? "Supprimer" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Associer Parties Modal */}
      <Dialog open={showPartiesModal} onOpenChange={setShowPartiesModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Associer des parties prenantes" : "Link Stakeholders"}</DialogTitle>
            <DialogDescription>{fr ? "Dossier" : "Case"} <strong>{partiesDossier?.code}</strong> — {partiesDossier?.objet}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Current parties */}
            {partiesList.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{fr ? `Parties associées (${partiesList.length})` : `Linked stakeholders (${partiesList.length})`}</Label>
                {partiesList.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {p.nom.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{p.nom}</p>
                      <p className="text-xs text-muted-foreground">{p.clientCode} · {p.role}</p>
                    </div>
                    <button onClick={() => removePartie(p.clientCode)} className="text-destructive hover:text-destructive/80 p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new party */}
            <div className="space-y-3 p-4 rounded-lg border border-dashed border-border">
              <Label className="text-sm font-medium">{fr ? "Ajouter une partie" : "Add a stakeholder"}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">{fr ? "Rechercher client" : "Search client"}</Label>
                  <Input
                    value={newPartie.clientSearch}
                    onChange={e => searchClients(e.target.value)}
                    placeholder={fr ? "Code ou nom du client..." : "Client code or name..."}
                  />
                  {clientSuggestions.length > 0 && (
                    <div className="border border-border rounded-lg bg-card shadow-lg max-h-40 overflow-y-auto">
                      {clientSuggestions.map(c => (
                        <button key={c.id} onClick={() => addPartie(c)}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center gap-2 border-b border-border last:border-0">
                          <span className="text-xs font-mono text-primary">{c.code}</span>
                          <span className="text-sm text-foreground">{c.nom} {c.prenom}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{fr ? "Rôle" : "Role"}</Label>
                  <Select value={newPartie.role} onValueChange={v => setNewPartie(p => ({ ...p, role: v as PartiePrenanteEntry["role"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {rolesParties.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartiesModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={saveParties}>
              {fr ? "Enregistrer les parties" : "Save stakeholders"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Facture Modal */}
      <Dialog open={showFactureModal} onOpenChange={setShowFactureModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{fr ? "Générer une facture" : "Generate Invoice"}</DialogTitle>
            <DialogDescription>
              {fr ? "Facture pour le dossier" : "Invoice for case"} <strong>{factureDossier?.code}</strong> — {factureDossier?.clients.join(", ")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Pre-filled info */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{fr ? "Dossier" : "Case"}</span>
                <span className="font-mono font-medium text-foreground">{factureDossier?.code}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{fr ? "Type d'acte" : "Deed type"}</span>
                <span className="text-foreground">{factureDossier?.typeActe}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Client(s)</span>
                <span className="text-foreground">{factureDossier?.clients.join(", ")}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{fr ? "Montant (GNF) *" : "Amount (GNF) *"}</Label>
                <Input type="number" value={factureForm.montant} onChange={e => setFactureForm(f => ({ ...f, montant: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{fr ? "Date d'échéance" : "Due date"}</Label>
                <Input type="date" value={factureForm.echeance} onChange={e => setFactureForm(f => ({ ...f, echeance: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={factureForm.description} onChange={e => setFactureForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFactureModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleCreateFacture} disabled={!factureForm.montant}>
              {fr ? "Créer la facture" : "Create invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
