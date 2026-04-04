// ═══════════════════════════════════════════════════════════════
// AuditLog — Journal d'audit complet avec filtres, timeline, pagination
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import {
  Eye,
  Pencil,
  MessageSquare,
  GitBranch,
  UserPlus,
  UserMinus,
  RefreshCw,
  Lock,
  LockOpen,
  Download,
  RotateCcw,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import type { DocumentChange, DocumentCollaborator } from "@/types/documents";

// ─── Types ─────────────────────────────────────────────────────

type AuditEventType =
  | "view"
  | "edit"
  | "comment"
  | "version_create"
  | "collaborator_add"
  | "collaborator_remove"
  | "status_change"
  | "lock"
  | "unlock"
  | "export"
  | "restore";

interface AuditEntry {
  id: string;
  type: AuditEventType;
  userId: string;
  userName: string;
  userInitiales: string;
  description: string;
  timestamp: Date;
  ip: string;
  device: string;
}

// ─── Config événements (sans labels — computed inside component) ────────────

interface EventMeta {
  icon: React.ReactNode;
  colorClass: string;
}

const EVENT_META: Record<AuditEventType, EventMeta> = {
  view:                { icon: <Eye className="h-4 w-4" />,          colorClass: "text-muted-foreground" },
  edit:                { icon: <Pencil className="h-4 w-4" />,       colorClass: "text-primary" },
  comment:             { icon: <MessageSquare className="h-4 w-4" />, colorClass: "text-blue-500" },
  version_create:      { icon: <GitBranch className="h-4 w-4" />,    colorClass: "text-amber-500" },
  collaborator_add:    { icon: <UserPlus className="h-4 w-4" />,     colorClass: "text-emerald-500" },
  collaborator_remove: { icon: <UserMinus className="h-4 w-4" />,    colorClass: "text-destructive" },
  status_change:       { icon: <RefreshCw className="h-4 w-4" />,    colorClass: "text-amber-400" },
  lock:                { icon: <Lock className="h-4 w-4" />,         colorClass: "text-destructive" },
  unlock:              { icon: <LockOpen className="h-4 w-4" />,     colorClass: "text-emerald-500" },
  export:              { icon: <Download className="h-4 w-4" />,     colorClass: "text-muted-foreground" },
  restore:             { icon: <RotateCcw className="h-4 w-4" />,    colorClass: "text-primary" },
};

// ─── IP et Device simulés ──────────────────────────────────────

const DEVICES = ["Chrome · Windows", "Firefox · macOS", "Safari · iOS", "Chrome · Android"];
const IPS = ["197.149.12.34", "197.149.55.10", "197.149.8.201", "41.202.114.5"];

function fakeIp(seed: number): string {
  return IPS[seed % IPS.length];
}

function fakeDevice(seed: number): string {
  return DEVICES[seed % DEVICES.length];
}

// ─── Génération des entrées mock ───────────────────────────────

function buildAuditEntries(
  documentId: string,
  changes: DocumentChange[],
  collaborators: DocumentCollaborator[]
): AuditEntry[] {
  const entries: AuditEntry[] = [];

  changes.forEach((change, i) => {
    const typeMap: Record<string, AuditEventType> = {
      insertion: "edit",
      suppression: "edit",
      modification: "edit",
      formatage: "edit",
      commentaire: "comment",
    };
    entries.push({
      id: `audit-change-${change.id}`,
      type: typeMap[change.changeType] ?? "edit",
      userId: change.userId,
      userName: `${change.user.prenom} ${change.user.nom}`,
      userInitiales: change.user.initiales,
      description: change.description,
      timestamp: change.timestamp,
      ip: fakeIp(i),
      device: fakeDevice(i),
    });
  });

  collaborators.forEach((c, i) => {
    entries.push({
      id: `audit-collab-add-${c.id}`,
      type: "collaborator_add",
      userId: c.invitedBy.id,
      userName: `${c.invitedBy.prenom} ${c.invitedBy.nom}`,
      userInitiales: c.invitedBy.initiales,
      description: `${c.user.prenom} ${c.user.nom} ajouté comme ${c.role}`,
      timestamp: c.invitedAt,
      ip: fakeIp(i + 10),
      device: fakeDevice(i + 10),
    });
  });

  const fictiveUsers = [
    { id: "u1", name: "Mamadou Diallo", initiales: "MD" },
    { id: "u2", name: "Aïssatou Keita", initiales: "AK" },
    { id: "u3", name: "Boubacar Diallo", initiales: "BD" },
  ];

  const fictiveEvents: Omit<AuditEntry, "id">[] = [
    {
      type: "view",
      userId: fictiveUsers[0].id,
      userName: fictiveUsers[0].name,
      userInitiales: fictiveUsers[0].initiales,
      description: "Consultation du document",
      timestamp: new Date(Date.now() - 3600000 * 2),
      ip: fakeIp(20),
      device: fakeDevice(20),
    },
    {
      type: "version_create",
      userId: fictiveUsers[1].id,
      userName: fictiveUsers[1].name,
      userInitiales: fictiveUsers[1].initiales,
      description: "Création de la version v2.0 — Après relecture",
      timestamp: new Date(Date.now() - 3600000 * 5),
      ip: fakeIp(21),
      device: fakeDevice(21),
    },
    {
      type: "export",
      userId: fictiveUsers[0].id,
      userName: fictiveUsers[0].name,
      userInitiales: fictiveUsers[0].initiales,
      description: "Export PDF du document",
      timestamp: new Date(Date.now() - 3600000 * 8),
      ip: fakeIp(22),
      device: fakeDevice(22),
    },
    {
      type: "lock",
      userId: fictiveUsers[0].id,
      userName: fictiveUsers[0].name,
      userInitiales: fictiveUsers[0].initiales,
      description: "Document verrouillé pour signature",
      timestamp: new Date(Date.now() - 3600000 * 24),
      ip: fakeIp(23),
      device: fakeDevice(23),
    },
    {
      type: "unlock",
      userId: fictiveUsers[0].id,
      userName: fictiveUsers[0].name,
      userInitiales: fictiveUsers[0].initiales,
      description: "Document déverrouillé",
      timestamp: new Date(Date.now() - 3600000 * 23),
      ip: fakeIp(24),
      device: fakeDevice(24),
    },
    {
      type: "status_change",
      userId: fictiveUsers[1].id,
      userName: fictiveUsers[1].name,
      userInitiales: fictiveUsers[1].initiales,
      description: "Statut changé : Brouillon → En révision",
      timestamp: new Date(Date.now() - 3600000 * 48),
      ip: fakeIp(25),
      device: fakeDevice(25),
    },
    {
      type: "restore",
      userId: fictiveUsers[2].id,
      userName: fictiveUsers[2].name,
      userInitiales: fictiveUsers[2].initiales,
      description: "Restauration de la version v1.2",
      timestamp: new Date(Date.now() - 3600000 * 72),
      ip: fakeIp(26),
      device: fakeDevice(26),
    },
    {
      type: "view",
      userId: fictiveUsers[2].id,
      userName: fictiveUsers[2].name,
      userInitiales: fictiveUsers[2].initiales,
      description: "Consultation du document",
      timestamp: new Date(Date.now() - 3600000 * 1),
      ip: fakeIp(27),
      device: fakeDevice(27),
    },
  ];

  fictiveEvents.forEach((ev, i) => {
    entries.push({ ...ev, id: `audit-fictive-${i}-${documentId}` });
  });

  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// ─── Props ─────────────────────────────────────────────────────

interface AuditLogProps {
  documentId: string;
  changes: DocumentChange[];
  collaborators: DocumentCollaborator[];
}

// ─── Constantes ────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── Composant ─────────────────────────────────────────────────

export default function AuditLog({ documentId, changes, collaborators }: AuditLogProps) {
  const { t } = useLanguage();

  const allEntries = useMemo(
    () => buildAuditEntries(documentId, changes, collaborators),
    [documentId, changes, collaborators]
  );

  // ── Event labels (translated)
  const eventLabels: Record<AuditEventType, string> = {
    view:                t("audit.eventView"),
    edit:                t("audit.eventEdit"),
    comment:             t("audit.eventComment"),
    version_create:      t("audit.eventVersionCreate"),
    collaborator_add:    t("audit.eventCollaboratorAdd"),
    collaborator_remove: t("audit.eventCollaboratorRemove"),
    status_change:       t("audit.eventStatusChange"),
    lock:                t("audit.eventLock"),
    unlock:              t("audit.eventUnlock"),
    export:              t("audit.eventExport"),
    restore:             t("audit.eventRestore"),
  };

  // ── Relative time (translated)
  function formatRelative(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t("audit.now");
    if (diffMin < 60) return `${t("audit.minutesAgo")} ${diffMin} ${t("audit.min")}`.trim();
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${t("audit.hoursAgo")} ${diffH}${t("audit.hour")}`.trim();
    return `${t("audit.daysAgo")} ${Math.floor(diffH / 24)}${t("audit.day")}`.trim();
  }

  // ── Filtres
  const [search, setSearch] = useState("");
  const [filterUser, setFilterUser] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");

  // ── Pagination
  const [page, setPage] = useState(1);

  // ── Utilisateurs uniques
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    allEntries.forEach((e) => {
      if (!map.has(e.userId)) map.set(e.userId, { id: e.userId, name: e.userName });
    });
    return Array.from(map.values());
  }, [allEntries]);

  // ── Types uniques
  const uniqueTypes = Object.keys(EVENT_META) as AuditEventType[];

  // ── Filtrage
  const now = Date.now();

  const filtered = useMemo(() => {
    return allEntries.filter((entry) => {
      if (
        search &&
        !entry.userName.toLowerCase().includes(search.toLowerCase()) &&
        !entry.description.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (filterUser !== "all" && entry.userId !== filterUser) return false;
      if (filterType !== "all" && entry.type !== filterType) return false;
      if (filterPeriod !== "all") {
        const diffH = (now - entry.timestamp.getTime()) / 3600000;
        if (filterPeriod === "today" && diffH > 24) return false;
        if (filterPeriod === "7days" && diffH > 168) return false;
        if (filterPeriod === "30days" && diffH > 720) return false;
      }
      return true;
    });
  }, [allEntries, search, filterUser, filterType, filterPeriod, now]);

  // ── Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeePage = Math.min(page, totalPages);
  const pageEntries = filtered.slice((safeePage - 1) * PAGE_SIZE, safeePage * PAGE_SIZE);

  const handleExport = () => {
    toast.info(t("audit.exportInProgress"));
  };

  return (
    <div className="space-y-4">
      {/* ── Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-base font-semibold text-foreground">
            {t("audit.title")}
          </h2>
          <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
            {filtered.length} {filtered.length > 1 ? t("audit.entries") : t("audit.entry")}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleExport}
        >
          <FileDown className="h-4 w-4" />
          {t("audit.exportPdf")}
        </Button>
      </div>

      {/* ── Filtres */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("audit.searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-8 text-xs w-48"
        />

        <Select
          value={filterUser}
          onValueChange={(v) => {
            setFilterUser(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs w-44">
            <SelectValue placeholder={t("audit.filterAllUsers")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("audit.filterAllUsers")}</SelectItem>
            {uniqueUsers.map((u) => (
              <SelectItem key={u.id} value={u.id} className="text-xs">
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterType}
          onValueChange={(v) => {
            setFilterType(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs w-44">
            <SelectValue placeholder={t("audit.filterAllTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("audit.filterAllTypes")}</SelectItem>
            {uniqueTypes.map((type) => (
              <SelectItem key={type} value={type} className="text-xs">
                {eventLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterPeriod}
          onValueChange={(v) => {
            setFilterPeriod(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue placeholder={t("audit.filterPeriod")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("audit.filterAll")}</SelectItem>
            <SelectItem value="today">{t("audit.filterToday")}</SelectItem>
            <SelectItem value="7days">{t("audit.filter7days")}</SelectItem>
            <SelectItem value="30days">{t("audit.filter30days")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Timeline */}
      <div className="space-y-2">
        {pageEntries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("audit.noEvents")}
          </p>
        )}
        {pageEntries.map((entry) => {
          const meta = EVENT_META[entry.type];
          return (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted/30 transition-colors"
            >
              {/* Icône type */}
              <div
                className={cn(
                  "h-7 w-7 rounded-md bg-muted/50 flex items-center justify-center shrink-0 mt-0.5",
                  meta.colorClass
                )}
              >
                {meta.icon}
              </div>

              {/* Avatar utilisateur */}
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold shrink-0 mt-0.5">
                {entry.userInitiales}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-snug">
                  <span className="font-medium">{entry.userName}</span>
                  {" — "}
                  <span className="text-muted-foreground">{entry.description}</span>
                  {" — "}
                  <span className="text-muted-foreground">{formatRelative(entry.timestamp)}</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {entry.device} · {entry.ip}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={safeePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("audit.prev")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("list.item") !== "item" ? "Page" : "Page"} {safeePage} {t("audit.pageOf")} {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={safeePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("audit.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
