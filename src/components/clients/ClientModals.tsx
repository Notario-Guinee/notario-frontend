// ═══════════════════════════════════════════════════════════════
// ClientModals — Tous les Dialog / AlertDialog de la page Clients
// Props : états de modaux + handlers fournis par Clients.tsx
// ═══════════════════════════════════════════════════════════════

import { X, User, UserPlus, Mail, Smartphone, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { mockDossiers, type Dossier } from "@/data/mockData";
import { PROFESSIONS, RAISONS_SOCIALES, TYPES_ACTE } from "@/data/constants";
import type { ClientType } from "./ClientTable";

const professions = PROFESSIONS;
const raisonsSociales = RAISONS_SOCIALES;
const typesActe = TYPES_ACTE;
const prioritesDossier: Dossier["priorite"][] = ["Basse", "Normale", "Haute", "Urgente"];

export interface ClientForm {
  nom: string;
  prenom: string;
  type: "Physique" | "Morale";
  telephone: string;
  email: string;
  profession: string;
  statut: string;
  adresse: string;
  description: string;
}

export interface DossierForm {
  typeActe: string;
  objet: string;
  montant: string;
  priorite: Dossier["priorite"];
  notaire: string;
  notes: string;
}

export interface FactureForm {
  dossier: string;
  montant: string;
  description: string;
  echeance: string;
}

interface ClientModalsProps {
  fr: boolean;

  // Create client
  showCreateModal: boolean;
  setShowCreateModal: (v: boolean) => void;
  form: ClientForm;
  setForm: React.Dispatch<React.SetStateAction<ClientForm>>;
  customProfession: boolean;
  setCustomProfession: (v: boolean) => void;
  customRaison: boolean;
  setCustomRaison: (v: boolean) => void;
  isSubmitting: boolean;
  handleCreate: () => void;

  // Edit client
  showEditModal: boolean;
  setShowEditModal: (v: boolean) => void;
  editingClient: ClientType | null;
  handleEdit: () => void;

  // Delete client
  showDeleteDialog: boolean;
  setShowDeleteDialog: (v: boolean) => void;
  handleDelete: () => void;

  // Create dossier from client
  showCreateDossierModal: boolean;
  setShowCreateDossierModal: (v: boolean) => void;
  dossierClient: ClientType | null;
  dossierForm: DossierForm;
  setDossierForm: React.Dispatch<React.SetStateAction<DossierForm>>;
  handleCreateDossier: () => void;

  // Create facture from client
  showCreateFactureModal: boolean;
  setShowCreateFactureModal: (v: boolean) => void;
  factureClient: ClientType | null;
  factureForm: FactureForm;
  setFactureForm: React.Dispatch<React.SetStateAction<FactureForm>>;
  handleCreateFacture: () => void;

  // Invite client
  showInviteModal: boolean;
  setShowInviteModal: (v: boolean) => void;
  inviteClient: ClientType | null;
  inscriptionLink: string;
  handleSendInvite: (method: "email" | "sms") => void;
  handleCopyLink: () => void;
}

export function ClientModals({
  fr,
  showCreateModal, setShowCreateModal,
  form, setForm,
  customProfession, setCustomProfession,
  customRaison, setCustomRaison,
  isSubmitting, handleCreate,
  showEditModal, setShowEditModal,
  editingClient, handleEdit,
  showDeleteDialog, setShowDeleteDialog, handleDelete,
  showCreateDossierModal, setShowCreateDossierModal,
  dossierClient, dossierForm, setDossierForm, handleCreateDossier,
  showCreateFactureModal, setShowCreateFactureModal,
  factureClient, factureForm, setFactureForm, handleCreateFacture,
  showInviteModal, setShowInviteModal,
  inviteClient, inscriptionLink, handleSendInvite, handleCopyLink,
}: ClientModalsProps) {
  return (
    <>
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
    </>
  );
}
