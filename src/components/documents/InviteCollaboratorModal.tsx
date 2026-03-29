// ═══════════════════════════════════════════════════════════════
// InviteCollaboratorModal — Modal multi-étapes pour inviter
// un collaborateur sur un document notarial
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import {
  Eye,
  MessageSquare,
  Pencil,
  Crown,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DocumentRole } from "@/types/documents";

// ─── Types internes ────────────────────────────────────────────

interface KnownUser {
  id: string;
  nom: string;
  prenom: string;
  initiales: string;
  role: string;
  email: string;
}

interface RoleCard {
  value: DocumentRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  badgeColor: string;
}

// ─── Données mock ──────────────────────────────────────────────

const KNOWN_USERS: KnownUser[] = [
  {
    id: "u1",
    nom: "Diallo",
    prenom: "Mamadou",
    initiales: "MD",
    role: "Notaire Gérant",
    email: "mamadou.diallo@cabinet.gn",
  },
  {
    id: "u2",
    nom: "Keita",
    prenom: "Aïssatou",
    initiales: "AK",
    role: "Notaire Associée",
    email: "aissatou.keita@cabinet.gn",
  },
  {
    id: "u3",
    nom: "Diallo",
    prenom: "Boubacar",
    initiales: "BD",
    role: "Clerc",
    email: "boubacar.diallo@cabinet.gn",
  },
  {
    id: "u4",
    nom: "Bah",
    prenom: "Fatoumata",
    initiales: "FB",
    role: "Clerc",
    email: "fatoumata.bah@cabinet.gn",
  },
];

const ROLE_CARDS: RoleCard[] = [
  {
    value: "lecteur",
    label: "Lecteur",
    description: "Peut lire et télécharger",
    icon: <Eye className="h-5 w-5" />,
    badgeColor:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  {
    value: "commentateur",
    label: "Commentateur",
    description: "Peut lire et commenter",
    icon: <MessageSquare className="h-5 w-5" />,
    badgeColor:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    value: "editeur",
    label: "Éditeur",
    description: "Peut modifier le contenu",
    icon: <Pencil className="h-5 w-5" />,
    badgeColor:
      "bg-primary/10 text-primary",
  },
  {
    value: "proprietaire",
    label: "Co-propriétaire",
    description: "Accès complet sauf suppression",
    icon: <Crown className="h-5 w-5" />,
    badgeColor:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
];

// ─── Stepper ───────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  const steps = ["Recherche", "Configuration", "Confirmation"];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                  isActive && "bg-primary border-primary text-primary-foreground",
                  isDone &&
                    "bg-primary/20 border-primary text-primary",
                  !isActive && !isDone && "bg-background border-border text-muted-foreground"
                )}
              >
                {step}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-0.5 font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-12 mx-1 mb-4 transition-colors",
                  isDone ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────

interface InviteCollaboratorModalProps {
  open: boolean;
  onClose: () => void;
  documentTitle: string;
  documentId: string;
}

// ─── Composant ─────────────────────────────────────────────────

export default function InviteCollaboratorModal({
  open,
  onClose,
  documentTitle,
  documentId: _documentId,
}: InviteCollaboratorModalProps) {
  const [step, setStep] = useState(1);

  // Step 1
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<KnownUser | null>(null);
  const [externalEmail, setExternalEmail] = useState("");

  // Step 2
  const [selectedRole, setSelectedRole] = useState<DocumentRole>("lecteur");
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [limitedTime, setLimitedTime] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [message, setMessage] = useState("");

  const filteredUsers = KNOWN_USERS.filter((u) => {
    const q = search.toLowerCase();
    return (
      `${u.prenom} ${u.nom}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const isExternalEmail = search.includes("@") && !selectedUser;
  const canProceedStep1 = selectedUser !== null || isExternalEmail;

  const inviteeName = selectedUser
    ? `${selectedUser.prenom} ${selectedUser.nom}`
    : externalEmail || search;
  const inviteeEmail = selectedUser ? selectedUser.email : externalEmail || search;
  const inviteeInitiales = selectedUser
    ? selectedUser.initiales
    : inviteeName.split(" ").map((n) => n[0] ?? "").join("").toUpperCase().slice(0, 2);

  const roleCard = ROLE_CARDS.find((r) => r.value === selectedRole);

  const handleReset = () => {
    setStep(1);
    setSearch("");
    setSelectedUser(null);
    setExternalEmail("");
    setSelectedRole("lecteur");
    setNotifyByEmail(true);
    setRequireApproval(false);
    setLimitedTime(false);
    setExpiresAt("");
    setMessage("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSend = () => {
    toast.success(`Invitation envoyée à ${inviteeName}`);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Inviter un collaborateur</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Document : <span className="font-medium text-foreground">{documentTitle}</span>
          </p>
        </DialogHeader>

        <Stepper current={step} />

        {/* ── Step 1 : Recherche ─────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Rechercher un utilisateur ou saisir un email</Label>
              <Input
                placeholder="Nom, prénom ou adresse email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedUser(null);
                }}
              />
            </div>

            {/* Liste utilisateurs filtrés */}
            {filteredUsers.length > 0 && (
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(user);
                      setSearch(`${user.prenom} ${user.nom}`);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
                      selectedUser?.id === user.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                      {user.initiales}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {user.prenom} {user.nom}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.role} · {user.email}
                      </p>
                    </div>
                    {selectedUser?.id === user.id && (
                      <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Invitation email externe */}
            {isExternalEmail && (
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Cet email n'est pas dans Notario. Une invitation externe sera envoyée.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setExternalEmail(search)}
                >
                  <Send className="h-3.5 w-3.5" />
                  Inviter par email : {search}
                </Button>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="gap-2"
              >
                Suivant &gt;
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2 : Configuration ────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Rôles */}
            <div>
              <Label className="mb-2 block">Rôle du collaborateur</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_CARDS.map((card) => (
                  <button
                    key={card.value}
                    type="button"
                    onClick={() => setSelectedRole(card.value)}
                    className={cn(
                      "flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors",
                      selectedRole === card.value
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center h-7 w-7 rounded-md",
                        selectedRole === card.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{card.label}</p>
                      <p className="text-[10px] text-muted-foreground">{card.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {/* Notifier par email */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={notifyByEmail}
                  onClick={() => setNotifyByEmail((v) => !v)}
                  className={cn(
                    "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0",
                    notifyByEmail ? "bg-primary border-primary" : "border-border bg-background"
                  )}
                >
                  {notifyByEmail && (
                    <span className="block h-2 w-2 bg-primary-foreground rounded-sm" />
                  )}
                </button>
                <Label
                  className="cursor-pointer text-sm"
                  onClick={() => setNotifyByEmail((v) => !v)}
                >
                  Notifier par email
                </Label>
              </div>

              {/* Requiert approbation */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={requireApproval}
                  onClick={() => setRequireApproval((v) => !v)}
                  className={cn(
                    "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0",
                    requireApproval ? "bg-primary border-primary" : "border-border bg-background"
                  )}
                >
                  {requireApproval && (
                    <span className="block h-2 w-2 bg-primary-foreground rounded-sm" />
                  )}
                </button>
                <Label
                  className="cursor-pointer text-sm"
                  onClick={() => setRequireApproval((v) => !v)}
                >
                  Requiert approbation pour valider les modifications
                </Label>
              </div>

              {/* Accès limité dans le temps */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={limitedTime}
                    onClick={() => setLimitedTime((v) => !v)}
                    className={cn(
                      "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0",
                      limitedTime ? "bg-primary border-primary" : "border-border bg-background"
                    )}
                  >
                    {limitedTime && (
                      <span className="block h-2 w-2 bg-primary-foreground rounded-sm" />
                    )}
                  </button>
                  <Label
                    className="cursor-pointer text-sm"
                    onClick={() => setLimitedTime((v) => !v)}
                  >
                    Accès limité dans le temps
                  </Label>
                </div>
                {limitedTime && (
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="ml-7 w-auto"
                    min={new Date().toISOString().split("T")[0]}
                  />
                )}
              </div>
            </div>

            {/* Message personnalisé */}
            <div className="space-y-1.5">
              <Label>Message personnalisé (optionnel)</Label>
              <Textarea
                placeholder="Bonjour, je vous invite à collaborer sur ce document..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                &lt; Précédent
              </Button>
              <Button onClick={() => setStep(3)} className="gap-2">
                Suivant &gt;
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3 : Confirmation ─────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Récapitulatif */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              {/* Utilisateur */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                  {inviteeInitiales}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{inviteeName}</p>
                  <p className="text-xs text-muted-foreground">{inviteeEmail}</p>
                </div>
              </div>

              {/* Rôle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rôle :</span>
                <span
                  className={cn(
                    "text-xs rounded px-2 py-0.5 font-medium",
                    roleCard?.badgeColor
                  )}
                >
                  {roleCard?.label}
                </span>
              </div>

              {/* Options */}
              <div className="space-y-1 text-xs text-muted-foreground">
                {notifyByEmail && <p>• Notification par email activée</p>}
                {requireApproval && <p>• Approbation requise pour les modifications</p>}
                {limitedTime && expiresAt && (
                  <p>• Accès jusqu'au {new Date(expiresAt).toLocaleDateString("fr-FR")}</p>
                )}
                {message && (
                  <p className="italic">• Message : "{message.slice(0, 80)}{message.length > 80 ? "..." : ""}"</p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                &lt; Précédent
              </Button>
              <Button onClick={handleSend} className="gap-2">
                <Send className="h-4 w-4" />
                Envoyer l'invitation
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
