// ═══════════════════════════════════════════════════════════════
// Page Collaborateurs — /documents/:documentId/collaborateurs
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, UserPlus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { mockDocuments } from "@/data/documentsData";
import type { DocumentCollaborator, DocumentRole, DocumentStatus } from "@/types/documents";
import InviteCollaboratorModal from "@/components/documents/InviteCollaboratorModal";
import { useLanguage } from "@/context/LanguageContext";

// ─── Helpers ───────────────────────────────────────────────────

function statusClasses(status: DocumentStatus): string {
  const map: Record<DocumentStatus, string> = {
    brouillon: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    en_revision: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    valide: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    archive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return map[status];
}

function roleBadgeClass(role: DocumentRole): string {
  const map: Record<DocumentRole, string> = {
    lecteur: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    commentateur: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    editeur: "bg-primary/10 text-primary",
    proprietaire: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return map[role];
}

function formatDate(date: Date | undefined, locale: string): string {
  if (!date) return "—";
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Invitation en attente (mock) ──────────────────────────────

interface PendingInvite {
  id: string;
  email: string;
  role: DocumentRole;
  expiresAt: Date;
}

const PENDING_MOCK: PendingInvite[] = [
  {
    id: "pi1",
    email: "alpha.bah@external.gn",
    role: "lecteur",
    expiresAt: new Date("2026-04-15"),
  },
];

// ─── Page ──────────────────────────────────────────────────────

export default function DocumentCollaboratorsPage() {
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();
  const { t, lang } = useLanguage();
  const locale = lang === "EN" ? "en-GB" : "fr-FR";

  const doc = mockDocuments.find((d) => d.id === documentId);

  if (!doc) {
    navigate("/documents");
    return null;
  }

  const statusLabel = (status: DocumentStatus): string => {
    const map: Record<DocumentStatus, string> = {
      brouillon: t("collab.statusBrouillon"),
      en_revision: t("collab.statusEnRevision"),
      valide: t("collab.statusValide"),
      archive: t("collab.statusArchive"),
    };
    return map[status];
  };

  const roleLabel = (role: DocumentRole): string => {
    const map: Record<DocumentRole, string> = {
      lecteur: t("collab.roleLecteur"),
      commentateur: t("collab.roleCommentateur"),
      editeur: t("collab.roleEditeur"),
      proprietaire: t("collab.roleProprietaire"),
    };
    return map[role];
  };

  // ── États
  const [collaborators, setCollaborators] = useState<DocumentCollaborator[]>(
    doc.collaborators
  );
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>(PENDING_MOCK);
  const [inviteOpen, setInviteOpen] = useState(false);

  // ── Handlers
  const handleChangeRole = (collaboratorId: string, newRole: DocumentRole) => {
    setCollaborators((prev) =>
      prev.map((c) => (c.id === collaboratorId ? { ...c, role: newRole } : c))
    );
    toast.success(t("collab.toastRoleUpdated"));
  };

  const handleRevoke = (collaboratorId: string) => {
    setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
    toast.success(t("collab.toastRevoked"));
  };

  const handleResend = (invite: PendingInvite) => {
    toast.success(`${invite.email}`);
  };

  const handleCancelInvite = (inviteId: string) => {
    setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
    toast.info(t("collab.toastCancelled"));
  };

  // ── KPIs
  const totalCollaborators = collaborators.length;
  const online = collaborators.filter((c) => c.isOnline).length;
  const pendingCount = pendingInvites.length;

  return (
    <div className="min-h-screen bg-background">
      {/* ═══ Header ═══════════════════════════════════════════ */}
      <div className="border-b border-border bg-card px-6 py-4">
        <button
          onClick={() => navigate(`/documents/${documentId}`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("collab.backToDoc")}
        </button>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-xl text-foreground font-semibold">
                {t("collab.pageTitle")} — {doc.title}
              </h1>
              <span
                className={cn(
                  "text-xs rounded px-2 py-0.5 font-medium",
                  statusClasses(doc.status)
                )}
              >
                {statusLabel(doc.status)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("collab.pageDesc")}
            </p>
          </div>

          <Button
            size="sm"
            className="gap-2"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            {t("collab.invite")}
          </Button>
        </div>
      </div>

      {/* ═══ Contenu ══════════════════════════════════════════ */}
      <div className="px-6 py-6 space-y-8 max-w-6xl mx-auto">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">{totalCollaborators}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("collab.totalCollaborators")}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-heading font-bold text-emerald-600">{online}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("collab.online")}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-heading font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("collab.pendingInvites")}</p>
          </div>
        </div>

        {/* Table collaborateurs */}
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground mb-3">
            {t("collab.activeCollaborators")}
          </h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("collab.colCollaborator")}</TableHead>
                  <TableHead>{t("collab.colRole")}</TableHead>
                  <TableHead>{t("collab.colInvitedBy")}</TableHead>
                  <TableHead>{t("collab.colInvitedAt")}</TableHead>
                  <TableHead>{t("collab.colLastView")}</TableHead>
                  <TableHead>{t("collab.colLastEdit")}</TableHead>
                  <TableHead>{t("collab.colStatus")}</TableHead>
                  <TableHead className="w-[60px]">{t("collab.colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collaborators.map((collab) => (
                  <TableRow key={collab.id}>
                    {/* Collaborateur */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="relative h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: collab.cursorColor }}
                        >
                          {collab.user.initiales}
                          {collab.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {collab.user.prenom} {collab.user.nom}
                          </p>
                          <p className="text-xs text-muted-foreground">{collab.user.role}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Rôle */}
                    <TableCell>
                      <span
                        className={cn(
                          "text-xs rounded px-2 py-0.5 font-medium",
                          roleBadgeClass(collab.role)
                        )}
                      >
                        {roleLabel(collab.role)}
                      </span>
                    </TableCell>

                    {/* Invité par */}
                    <TableCell className="text-xs text-muted-foreground">
                      {collab.invitedBy.prenom} {collab.invitedBy.nom}
                    </TableCell>

                    {/* Invité le */}
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(collab.invitedAt, locale)}
                    </TableCell>

                    {/* Dernier accès */}
                    <TableCell className="text-xs text-muted-foreground">
                      {collab.lastViewedAt?.toLocaleDateString(locale) ?? "—"}
                    </TableCell>

                    {/* Dernière modif */}
                    <TableCell className="text-xs text-muted-foreground">
                      {collab.lastEditAt?.toLocaleDateString(locale) ?? "—"}
                    </TableCell>

                    {/* Statut */}
                    <TableCell>
                      {collab.isOnline ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {t("collab.statusOnline")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("collab.statusOffline")}</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground"
                          >
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>{t("collab.editRole")}</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {(["lecteur", "commentateur", "editeur"] as DocumentRole[]).map(
                                (r) => (
                                  <DropdownMenuItem
                                    key={r}
                                    onClick={() => handleChangeRole(collab.id, r)}
                                    className={cn(collab.role === r && "font-semibold")}
                                  >
                                    {roleLabel(r)}
                                  </DropdownMenuItem>
                                )
                              )}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info(`${t("collab.activityOf")} ${collab.user.prenom} ${collab.user.nom}`)
                            }
                          >
                            {t("collab.viewActivity")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRevoke(collab.id)}
                          >
                            {t("collab.revokeAccess")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Invitations en attente */}
        {pendingInvites.length > 0 && (
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground mb-3">
              {t("collab.pendingInvites")}
            </h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("collab.colEmail")}</TableHead>
                    <TableHead>{t("collab.colRole")}</TableHead>
                    <TableHead>{t("collab.colExpires")}</TableHead>
                    <TableHead>{t("collab.colActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="text-sm text-foreground">{invite.email}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs rounded px-2 py-0.5 font-medium",
                            roleBadgeClass(invite.role)
                          )}
                        >
                          {roleLabel(invite.role)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(invite.expiresAt, locale)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => handleResend(invite)}
                          >
                            <RefreshCw className="h-3 w-3" />
                            {t("collab.resend")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleCancelInvite(invite.id)}
                          >
                            {t("collab.cancel")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Modal invitation */}
      <InviteCollaboratorModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        documentTitle={doc.title}
        documentId={doc.id}
      />
    </div>
  );
}
