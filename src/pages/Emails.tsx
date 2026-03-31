// ═══════════════════════════════════════════════════════════════
// Page Emails — Gestionnaire de messagerie inspiré d'Outlook
// Sidebar dossiers + liste emails + volet lecture + composition
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useMemo } from "react";
import {
  Inbox,
  Send,
  FileText,
  Trash2,
  AlertTriangle,
  Star,
  Archive,
  ChevronDown,
  ChevronRight,
  Search,
  RefreshCw,
  Pencil,
  Reply,
  ReplyAll,
  Forward,
  MoreHorizontal,
  Paperclip,
  Tag,
  MoveRight,
  BellOff,
  Flag,
  Printer,
  X,
  Plus,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Link2,
  ImageIcon,
  CheckCheck,
  Clock,
  Circle,
  Folder,
  FolderOpen,
  SlidersHorizontal,
  MailOpen,
  Mail,
  ChevronLeft,
  Filter,
  Maximize2,
  Minimize2,
  CornerUpRight,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ─────────────────────────────────────────────────────

type EmailFolder =
  | "inbox"
  | "sent"
  | "drafts"
  | "archive"
  | "trash"
  | "spam"
  | "starred"
  | string;

interface EmailAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

interface Email {
  id: string;
  folder: EmailFolder;
  from: { name: string; email: string; initials: string };
  to: string[];
  cc?: string[];
  subject: string;
  preview: string;
  body: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  isFlagged: boolean;
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
  labels?: string[];
  isDeleted?: boolean;
}

interface ComposeData {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  attachments: File[];
  showCc: boolean;
  showBcc: boolean;
}

// ─── Données mock ───────────────────────────────────────────────

const MOCK_EMAILS: Email[] = [
  {
    id: "e1",
    folder: "inbox",
    from: { name: "Tribunal de Première Instance", email: "greffe@tpi-conakry.gn", initials: "TI" },
    to: ["m.diallo@notario.gn"],
    subject: "Convocation — Affaire N-2025-101 (Vente Villa)",
    preview: "Maître Diallo, vous êtes convoqué le 15 avril 2026 à 9h00 pour l'audience concernant...",
    body: `<p>Maître Diallo,</p><p>Vous êtes convoqué le <strong>15 avril 2026 à 9h00</strong> pour l'audience concernant l'affaire N-2025-101 relative à la vente de la Villa sise à Kipé, Conakry.</p><p>Veuillez vous munir de tous les actes afférents à ce dossier.</p><p>Cordialement,<br>Le Greffier en Chef</p>`,
    date: new Date("2026-03-31T08:15:00"),
    isRead: false,
    isStarred: true,
    isFlagged: true,
    hasAttachments: true,
    attachments: [
      { id: "a1", name: "convocation_N2025101.pdf", size: "142 Ko", type: "pdf" },
    ],
    labels: ["Urgent", "Juridique"],
  },
  {
    id: "e2",
    folder: "inbox",
    from: { name: "Bah Oumar", email: "bah.oumar@email.com", initials: "BO" },
    to: ["m.diallo@notario.gn"],
    subject: "Documents complémentaires — Dossier N-2025-101",
    preview: "Bonjour Maître, veuillez trouver ci-joint les pièces manquantes pour la finalisation de la vente...",
    body: `<p>Bonjour Maître,</p><p>Veuillez trouver ci-joint les pièces manquantes pour la finalisation de la vente de la Villa :</p><ul><li>Titre foncier original</li><li>Copie CNI certifiée conforme</li><li>Attestation de non-hypothèque</li></ul><p>Je reste disponible pour tout renseignement complémentaire.</p><p>Cordialement,<br>Bah Oumar</p>`,
    date: new Date("2026-03-30T14:32:00"),
    isRead: false,
    isStarred: false,
    isFlagged: false,
    hasAttachments: true,
    attachments: [
      { id: "a2", name: "titre_foncier.pdf", size: "2.1 Mo", type: "pdf" },
      { id: "a3", name: "CNI_certifiee.jpg", size: "540 Ko", type: "image" },
      { id: "a4", name: "attestation_hypotheque.pdf", size: "287 Ko", type: "pdf" },
    ],
    labels: ["Client"],
  },
  {
    id: "e3",
    folder: "inbox",
    from: { name: "SARL Nimba", email: "contact@sarlnimba.gn", initials: "SN" },
    to: ["m.diallo@notario.gn"],
    subject: "RE: Statuts de constitution — Observations",
    preview: "Maître Keïta, nous avons bien reçu les statuts en version définitive et nous n'avons pas...",
    body: `<p>Maître Keïta,</p><p>Nous avons bien reçu les statuts en version définitive et nous n'avons pas d'observations supplémentaires à formuler. Vous pouvez procéder à la signature.</p><p>Nous serons disponibles le <strong>3 avril 2026</strong> à partir de 10h.</p><p>Bien cordialement,<br>Direction SARL Nimba</p>`,
    date: new Date("2026-03-29T10:05:00"),
    isRead: true,
    isStarred: false,
    isFlagged: false,
    hasAttachments: false,
    labels: ["Client"],
  },
  {
    id: "e4",
    folder: "inbox",
    from: { name: "Banque Populaire de Guinée", email: "corporatif@bpg.gn", initials: "BP" },
    to: ["m.diallo@notario.gn"],
    subject: "Relevé de compte — Mars 2026",
    preview: "Veuillez trouver ci-joint votre relevé de compte pour le mois de mars 2026 concernant le compte...",
    body: `<p>Monsieur le Notaire,</p><p>Veuillez trouver ci-joint votre relevé de compte pour le mois de <strong>mars 2026</strong>.</p><p>Solde créditeur : <strong>47 250 000 GNF</strong></p><p>Cordialement,<br>Service Clientèle Entreprises</p>`,
    date: new Date("2026-03-28T09:00:00"),
    isRead: true,
    isStarred: false,
    isFlagged: false,
    hasAttachments: true,
    attachments: [
      { id: "a5", name: "releve_mars2026.pdf", size: "198 Ko", type: "pdf" },
    ],
    labels: ["Finance"],
  },
  {
    id: "e5",
    folder: "inbox",
    from: { name: "Ordre des Notaires de Guinée", email: "secretariat@ong.gn", initials: "ON" },
    to: ["m.diallo@notario.gn"],
    subject: "Assemblée générale — Convocation officielle",
    preview: "Cher Confrère, vous êtes convoqué à l'Assemblée Générale ordinaire de l'Ordre des Notaires...",
    body: `<p>Cher Confrère,</p><p>Vous êtes convoqué à l'<strong>Assemblée Générale ordinaire</strong> de l'Ordre des Notaires de Guinée qui se tiendra le :</p><p><strong>Vendredi 10 avril 2026 à 10h00</strong><br>Siège de l'Ordre, Avenue de la République, Conakry</p><p>Ordre du jour : Rapport moral, rapport financier, élections du bureau.</p><p>Confraternellement,<br>Le Président de l'Ordre</p>`,
    date: new Date("2026-03-27T16:20:00"),
    isRead: true,
    isStarred: true,
    isFlagged: false,
    hasAttachments: false,
    labels: ["Ordre"],
  },
  {
    id: "e6",
    folder: "inbox",
    from: { name: "Fatoumata Soumah", email: "f.soumah@email.gn", initials: "FS" },
    to: ["m.diallo@notario.gn"],
    subject: "Demande de renseignements — Succession",
    preview: "Bonjour Maître, je vous contacte suite au décès de mon père Abdoulaye Soumah survenu le...",
    body: `<p>Bonjour Maître,</p><p>Je vous contacte suite au décès de mon père Abdoulaye Soumah survenu le 15 mars 2026 à Conakry. Nous sommes 4 héritiers et souhaitons engager la procédure de succession.</p><p>Pourriez-vous nous indiquer les démarches à suivre et les honoraires pratiqués ?</p><p>Merci d'avance,<br>Fatoumata Soumah<br>+224 62 33 22 11</p>`,
    date: new Date("2026-03-26T11:45:00"),
    isRead: false,
    isStarred: false,
    isFlagged: false,
    hasAttachments: false,
    labels: ["Prospect"],
  },
  {
    id: "e7",
    folder: "sent",
    from: { name: "Maître Mamadou Diallo", email: "m.diallo@notario.gn", initials: "MD" },
    to: ["bah.oumar@email.com"],
    subject: "RE: Dossier N-2025-101 — Pièces requises",
    preview: "Monsieur Bah, je vous confirme la bonne réception de votre dossier et vous rappelle la liste...",
    body: `<p>Monsieur Bah,</p><p>Je vous confirme la bonne réception de votre dossier N-2025-101. Voici la liste des pièces encore requises pour finaliser votre acte :</p><ol><li>Certificat de résidence</li><li>Quittance de loyer récente</li></ol><p>Merci de nous les faire parvenir avant le 5 avril 2026.</p><p>Cordialement,<br>Maître Mamadou Diallo<br>Étude Notariale Diallo & Associés</p>`,
    date: new Date("2026-03-30T16:00:00"),
    isRead: true,
    isStarred: false,
    isFlagged: false,
    hasAttachments: false,
  },
  {
    id: "e8",
    folder: "sent",
    from: { name: "Maître Mamadou Diallo", email: "m.diallo@notario.gn", initials: "MD" },
    to: ["contact@sarlnimba.gn"],
    subject: "Statuts SARL Nimba — Version finale",
    preview: "Messieurs, veuillez trouver en pièce jointe la version finale des statuts de votre société...",
    body: `<p>Messieurs,</p><p>Veuillez trouver en pièce jointe la version finale des statuts de votre société, intégrant toutes vos observations.</p><p>Je vous invite à en prendre connaissance et à me confirmer votre accord pour procéder à la signature.</p><p>Cordialement,<br>Maître Mamadou Diallo</p>`,
    date: new Date("2026-03-28T15:30:00"),
    isRead: true,
    isStarred: false,
    isFlagged: false,
    hasAttachments: true,
    attachments: [
      { id: "a6", name: "statuts_SARL_Nimba_v3.pdf", size: "320 Ko", type: "pdf" },
    ],
  },
  {
    id: "e9",
    folder: "drafts",
    from: { name: "Maître Mamadou Diallo", email: "m.diallo@notario.gn", initials: "MD" },
    to: ["secretariat@ong.gn"],
    subject: "Rapport annuel 2025 — Contributions à l'Ordre",
    preview: "Monsieur le Président, suite à votre demande, veuillez trouver ci-dessous le rapport...",
    body: `<p>Monsieur le Président,</p><p>Suite à votre demande, veuillez trouver ci-dessous le rapport sur nos activités de l'année 2025...</p><p><em>[À compléter]</em></p>`,
    date: new Date("2026-03-25T17:10:00"),
    isRead: true,
    isStarred: false,
    isFlagged: false,
    hasAttachments: false,
  },
  {
    id: "e10",
    folder: "trash",
    from: { name: "Newsletter Juridique", email: "newsletter@droitgn.com", initials: "NJ" },
    to: ["m.diallo@notario.gn"],
    subject: "Actualités juridiques — Semaine 12/2026",
    preview: "Cette semaine dans le droit guinéen : nouvelles réformes foncières, jurisprudence récente...",
    body: `<p>Actualités de la semaine...</p>`,
    date: new Date("2026-03-24T08:00:00"),
    isRead: true,
    isStarred: false,
    isFlagged: false,
    hasAttachments: false,
    isDeleted: true,
  },
  {
    id: "e11",
    folder: "spam",
    from: { name: "Promotions", email: "promo@offres-gn.com", initials: "PR" },
    to: ["m.diallo@notario.gn"],
    subject: "Offre exceptionnelle sur les logiciels juridiques !",
    preview: "Ne manquez pas notre offre exclusive : -50% sur toute notre gamme de logiciels...",
    body: `<p>Offre promotionnelle...</p>`,
    date: new Date("2026-03-23T12:00:00"),
    isRead: true,
    isStarred: false,
    isFlagged: false,
    hasAttachments: false,
  },
];

// ─── Constantes ─────────────────────────────────────────────────

const FOLDERS = [
  { id: "inbox", label: "Boîte de réception", icon: Inbox, color: "text-blue-500" },
  { id: "starred", label: "Favoris", icon: Star, color: "text-amber-500" },
  { id: "sent", label: "Envoyés", icon: Send, color: "text-emerald-500" },
  { id: "drafts", label: "Brouillons", icon: FileText, color: "text-orange-400" },
  { id: "archive", label: "Archivés", icon: Archive, color: "text-gray-500" },
  { id: "spam", label: "Courrier indésirable", icon: AlertTriangle, color: "text-red-400" },
  { id: "trash", label: "Corbeille", icon: Trash2, color: "text-red-500" },
];

const LABEL_COLORS: Record<string, string> = {
  Urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Juridique: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Client: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Finance: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Ordre: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Prospect: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

// ─── Helpers ────────────────────────────────────────────────────

function formatEmailDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) {
    return date.toLocaleDateString("fr-FR", { weekday: "short" });
  }
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitialsColor(initials: string): string {
  const colors = [
    "bg-blue-500", "bg-emerald-500", "bg-violet-500",
    "bg-amber-500", "bg-rose-500", "bg-cyan-500",
    "bg-orange-500", "bg-teal-500",
  ];
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length;
  return colors[idx];
}

// ─── Composant avatar ────────────────────────────────────────────

function EmailAvatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-10 w-10 text-sm" : "h-9 w-9 text-xs";
  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-bold shrink-0", sz, getInitialsColor(initials))}>
      {initials}
    </div>
  );
}

// ─── Composant pièce jointe ──────────────────────────────────────

function AttachmentChip({ att }: { att: EmailAttachment }) {
  const icon = att.type === "pdf" ? "📄" : att.type === "image" ? "🖼️" : "📎";
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-xs">
      <span>{icon}</span>
      <span className="font-medium text-foreground">{att.name}</span>
      <span className="text-muted-foreground">— {att.size}</span>
    </button>
  );
}

// ─── Composant principale ────────────────────────────────────────

export default function Emails() {
  const [emails, setEmails] = useState<Email[]>(MOCK_EMAILS);
  const [activeFolder, setActiveFolder] = useState<EmailFolder>("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "starred" | "attachments">("all");
  const [showCompose, setShowCompose] = useState(false);
  const [composeMaximized, setComposeMaximized] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [composeMode, setComposeMode] = useState<"new" | "reply" | "replyAll" | "forward">("new");
  const [compose, setCompose] = useState<ComposeData>({
    to: "", cc: "", bcc: "", subject: "", body: "",
    attachments: [], showCc: false, showBcc: false,
  });
  const composeAttachRef = useRef<HTMLInputElement>(null);

  // ─── Dossiers avec compteurs ─────────────────────────────────

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    FOLDERS.forEach(({ id }) => {
      const folderEmails = id === "starred"
        ? emails.filter(e => e.isStarred && !e.isDeleted)
        : emails.filter(e => e.folder === id && !e.isDeleted);
      counts[id] = folderEmails.filter(e => !e.isRead).length;
    });
    return counts;
  }, [emails]);

  // ─── Emails filtrés ──────────────────────────────────────────

  const filteredEmails = useMemo(() => {
    let list = activeFolder === "starred"
      ? emails.filter(e => e.isStarred && !e.isDeleted)
      : emails.filter(e => e.folder === activeFolder && !e.isDeleted);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        e.subject.toLowerCase().includes(q) ||
        e.from.name.toLowerCase().includes(q) ||
        e.preview.toLowerCase().includes(q)
      );
    }

    if (filterTab === "unread") list = list.filter(e => !e.isRead);
    if (filterTab === "starred") list = list.filter(e => e.isStarred);
    if (filterTab === "attachments") list = list.filter(e => e.hasAttachments);

    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [emails, activeFolder, searchQuery, filterTab]);

  // ─── Actions emails ──────────────────────────────────────────

  const markRead = (id: string, read: boolean) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: read } : e));
  };

  const toggleStar = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isStarred: !e.isStarred } : e));
  };

  const toggleFlag = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isFlagged: !e.isFlagged } : e));
  };

  const moveToTrash = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: "trash", isDeleted: false } : e));
    if (selectedEmail?.id === id) setSelectedEmail(null);
    toast.success("Email déplacé vers la corbeille");
  };

  const archiveEmail = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: "archive" } : e));
    if (selectedEmail?.id === id) setSelectedEmail(null);
    toast.success("Email archivé");
  };

  const permanentDelete = (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
    if (selectedEmail?.id === id) setSelectedEmail(null);
    toast.success("Email supprimé définitivement");
  };

  const restoreEmail = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: "inbox" } : e));
    toast.success("Email restauré");
  };

  const markSpam = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: "spam" } : e));
    if (selectedEmail?.id === id) setSelectedEmail(null);
    toast.info("Email signalé comme spam");
  };

  const selectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) markRead(email.id, true);
  };

  const openCompose = (mode: "new" | "reply" | "replyAll" | "forward", email?: Email) => {
    setComposeMode(mode);
    if (mode === "new") {
      setCompose({ to: "", cc: "", bcc: "", subject: "", body: "", attachments: [], showCc: false, showBcc: false });
    } else if (email) {
      const prefix = mode === "forward" ? "Tr : " : "Re : ";
      const replyBody = `<br><br><hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"><p style="color:#6b7280;font-size:12px">De : ${email.from.name} &lt;${email.from.email}&gt;<br>Date : ${formatFullDate(email.date)}<br>Objet : ${email.subject}</p>${email.body}`;
      setCompose({
        to: mode === "forward" ? "" : email.from.email,
        cc: mode === "replyAll" ? (email.cc?.join(", ") ?? "") : "",
        bcc: "",
        subject: `${prefix}${email.subject}`,
        body: replyBody,
        attachments: [],
        showCc: mode === "replyAll",
        showBcc: false,
      });
    }
    setShowCompose(true);
  };

  const handleSend = () => {
    if (!compose.to.trim()) { toast.error("Veuillez renseigner le destinataire"); return; }
    if (!compose.subject.trim()) { toast.error("Objet manquant"); return; }
    const newSent: Email = {
      id: `e-sent-${Date.now()}`,
      folder: "sent",
      from: { name: "Maître Mamadou Diallo", email: "m.diallo@notario.gn", initials: "MD" },
      to: compose.to.split(",").map(t => t.trim()),
      cc: compose.cc ? compose.cc.split(",").map(t => t.trim()) : undefined,
      subject: compose.subject,
      preview: compose.body.replace(/<[^>]*>/g, "").slice(0, 100),
      body: compose.body,
      date: new Date(),
      isRead: true,
      isStarred: false,
      isFlagged: false,
      hasAttachments: compose.attachments.length > 0,
    };
    setEmails(prev => [newSent, ...prev]);
    setShowCompose(false);
    toast.success("Message envoyé");
  };

  const handleSaveDraft = () => {
    toast.success("Brouillon enregistré");
    setShowCompose(false);
  };

  // ─── Folder actif label ──────────────────────────────────────

  const activeFolderMeta = FOLDERS.find(f => f.id === activeFolder);

  // ─── Rendu ──────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* ══ Toolbar principale ═══════════════════════════════════ */}
      <div className="h-12 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-blue-500 flex items-center justify-center shrink-0">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-foreground hidden sm:block">Messagerie</span>
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Recherche globale */}
        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher dans tous les dossiers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-sm bg-muted/50 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-colors placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            className="gap-2 h-8 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => openCompose("new")}
          >
            <Pencil className="h-3.5 w-3.5" />
            Nouveau message
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => toast.info("Synchronisation...")}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {}}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ══ Corps principal ══════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ Sidebar dossiers ═════════════════════════════════ */}
        <div className={cn(
          "border-r border-border bg-card flex flex-col shrink-0 transition-all duration-200",
          isSidebarCollapsed ? "w-14" : "w-56"
        )}>
          {/* Toggle collapse */}
          <div className="h-10 flex items-center px-3 border-b border-border">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto"
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Liste dossiers */}
          <nav className="flex-1 overflow-y-auto py-2">
            {FOLDERS.map(({ id, label, icon: Icon, color }) => {
              const count = folderCounts[id] ?? 0;
              const isActive = activeFolder === id;
              return (
                <button
                  key={id}
                  onClick={() => { setActiveFolder(id); setSelectedEmail(null); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 transition-colors rounded-lg mx-1 text-sm",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  style={{ width: "calc(100% - 8px)" }}
                  title={isSidebarCollapsed ? label : undefined}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : color)} />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{label}</span>
                      {count > 0 && (
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                          isActive ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                        )}>
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </>
                  )}
                  {isSidebarCollapsed && count > 0 && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}

            {/* Séparateur + Étiquettes */}
            {!isSidebarCollapsed && (
              <div className="mt-3 px-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Étiquettes</span>
                  <button className="text-muted-foreground hover:text-foreground">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                {Object.keys(LABEL_COLORS).map(label => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <span className={cn("h-2 w-2 rounded-full shrink-0", LABEL_COLORS[label].split(" ")[0])} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </nav>

          {/* Quota */}
          {!isSidebarCollapsed && (
            <div className="border-t border-border p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Stockage utilisé</p>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-2/5 rounded-full bg-blue-500" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">8.4 Go / 20 Go</p>
            </div>
          )}
        </div>

        {/* ══ Liste emails ════════════════════════════════════ */}
        <div className={cn(
          "border-r border-border bg-background flex flex-col shrink-0 overflow-hidden",
          selectedEmail ? "w-80" : "flex-1"
        )}>
          {/* En-tête liste */}
          <div className="border-b border-border px-4 py-2 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeFolderMeta && (
                  <activeFolderMeta.icon className={cn("h-4 w-4", activeFolderMeta.color)} />
                )}
                <h2 className="font-semibold text-sm text-foreground">
                  {activeFolderMeta?.label ?? activeFolder}
                </h2>
                <span className="text-xs text-muted-foreground">({filteredEmails.length})</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Filter className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setEmails(prev => prev.map(e => e.folder === activeFolder ? { ...e, isRead: true } : e));
                    toast.success("Tous marqués comme lus");
                  }}>
                    <MailOpen className="mr-2 h-4 w-4" /> Tout marquer comme lu
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    filteredEmails.forEach(e => archiveEmail(e.id));
                  }}>
                    <Archive className="mr-2 h-4 w-4" /> Tout archiver
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Onglets filtre */}
            <div className="flex gap-1">
              {[
                { id: "all", label: "Tous" },
                { id: "unread", label: "Non lus" },
                { id: "starred", label: "Favoris" },
                { id: "attachments", label: "Pièces jointes" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as typeof filterTab)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full transition-colors",
                    filterTab === tab.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
                <Mail className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  {searchQuery ? "Aucun résultat" : "Dossier vide"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery ? "Essayez avec d'autres mots-clés" : "Aucun message dans ce dossier"}
                </p>
              </div>
            ) : (
              filteredEmails.map(email => (
                <button
                  key={email.id}
                  onClick={() => selectEmail(email)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border/50 transition-colors hover:bg-muted/40 relative",
                    selectedEmail?.id === email.id && "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-500",
                    !email.isRead && "bg-blue-50/50 dark:bg-blue-950/10"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Indicateur non-lu */}
                    <div className="mt-1 shrink-0">
                      {!email.isRead
                        ? <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
                        : <div className="h-2 w-2" />
                      }
                    </div>

                    {/* Avatar */}
                    <EmailAvatar initials={email.from.initials} size="sm" />

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={cn("text-sm truncate", !email.isRead ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                          {email.folder === "sent" || email.folder === "drafts"
                            ? `À : ${email.to[0]}`
                            : email.from.name
                          }
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatEmailDate(email.date)}
                        </span>
                      </div>
                      <p className={cn("text-xs mb-1 truncate", !email.isRead ? "font-medium text-foreground" : "text-foreground/80")}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {email.preview}
                      </p>
                      {/* Badges */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {email.hasAttachments && (
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                        )}
                        {email.isFlagged && (
                          <Flag className="h-3 w-3 text-red-400 fill-red-400" />
                        )}
                        {email.labels?.map(l => (
                          <span key={l} className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", LABEL_COLORS[l] ?? "bg-gray-100 text-gray-600")}>
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Star */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleStar(email.id); }}
                      className="shrink-0 mt-0.5 text-muted-foreground hover:text-amber-500 transition-colors"
                    >
                      <Star className={cn("h-3.5 w-3.5", email.isStarred && "fill-amber-400 text-amber-400")} />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ══ Volet de lecture ════════════════════════════════ */}
        {selectedEmail ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {/* Barre d'actions */}
            <div className="h-12 border-b border-border flex items-center px-4 gap-2 shrink-0 bg-card">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedEmail(null)} title="Fermer">
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="w-px h-5 bg-border" />

              <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => openCompose("reply", selectedEmail)}>
                <Reply className="h-3.5 w-3.5" /> Répondre
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => openCompose("replyAll", selectedEmail)}>
                <ReplyAll className="h-3.5 w-3.5" /> Rép. à tous
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => openCompose("forward", selectedEmail)}>
                <Forward className="h-3.5 w-3.5" /> Transférer
              </Button>

              <div className="w-px h-5 bg-border mx-1" />

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title={selectedEmail.isStarred ? "Retirer des favoris" : "Ajouter aux favoris"}
                onClick={() => toggleStar(selectedEmail.id)}
              >
                <Star className={cn("h-4 w-4", selectedEmail.isStarred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title={selectedEmail.isFlagged ? "Retirer le drapeau" : "Marquer d'un drapeau"}
                onClick={() => toggleFlag(selectedEmail.id)}
              >
                <Flag className={cn("h-4 w-4", selectedEmail.isFlagged ? "fill-red-400 text-red-400" : "text-muted-foreground")} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground"
                title="Archiver"
                onClick={() => archiveEmail(selectedEmail.id)}
              >
                <Archive className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                title={activeFolder === "trash" ? "Supprimer définitivement" : "Supprimer"}
                onClick={() => activeFolder === "trash" ? permanentDelete(selectedEmail.id) : moveToTrash(selectedEmail.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => markRead(selectedEmail.id, !selectedEmail.isRead)}>
                      {selectedEmail.isRead
                        ? <><Mail className="mr-2 h-4 w-4" /> Marquer comme non lu</>
                        : <><MailOpen className="mr-2 h-4 w-4" /> Marquer comme lu</>
                      }
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => markSpam(selectedEmail.id)}>
                      <AlertTriangle className="mr-2 h-4 w-4" /> Signaler comme spam
                    </DropdownMenuItem>
                    {activeFolder === "trash" && (
                      <DropdownMenuItem onClick={() => restoreEmail(selectedEmail.id)}>
                        <CornerUpRight className="mr-2 h-4 w-4" /> Restaurer
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      toast.success("En-tête copié");
                    }}>
                      <MoveRight className="mr-2 h-4 w-4" /> Déplacer vers...
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.print()}>
                      <Printer className="mr-2 h-4 w-4" /> Imprimer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => permanentDelete(selectedEmail.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Supprimer définitivement
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Corps email */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-8 py-6">
                {/* Objet */}
                <h1 className="text-xl font-semibold text-foreground mb-4">
                  {selectedEmail.subject}
                </h1>

                {/* Métadonnées expéditeur */}
                <div className="flex items-start gap-3 mb-6 p-4 rounded-lg bg-muted/30 border border-border">
                  <EmailAvatar initials={selectedEmail.from.initials} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="font-semibold text-foreground">{selectedEmail.from.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">&lt;{selectedEmail.from.email}&gt;</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatFullDate(selectedEmail.date)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      À : {selectedEmail.to.join(", ")}
                      {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                        <span> · CC : {selectedEmail.cc.join(", ")}</span>
                      )}
                    </p>
                    {selectedEmail.labels && selectedEmail.labels.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {selectedEmail.labels.map(l => (
                          <span key={l} className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", LABEL_COLORS[l] ?? "bg-gray-100 text-gray-600")}>
                            {l}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Corps du message */}
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                />

                {/* Pièces jointes */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5" />
                      {selectedEmail.attachments.length} pièce{selectedEmail.attachments.length > 1 ? "s" : ""} jointe{selectedEmail.attachments.length > 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmail.attachments.map(att => (
                        <AttachmentChip key={att.id} att={att} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions réponse rapide */}
                <div className="mt-8 flex gap-3">
                  <Button variant="outline" className="gap-2" onClick={() => openCompose("reply", selectedEmail)}>
                    <Reply className="h-4 w-4" /> Répondre
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => openCompose("replyAll", selectedEmail)}>
                    <ReplyAll className="h-4 w-4" /> Répondre à tous
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => openCompose("forward", selectedEmail)}>
                    <Forward className="h-4 w-4" /> Transférer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Placeholder volet vide */
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/10 text-center px-8">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Mail className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-1">Sélectionnez un message</h3>
            <p className="text-sm text-muted-foreground">Cliquez sur un email dans la liste pour le lire</p>
            <Button className="mt-6 gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => openCompose("new")}>
              <Pencil className="h-4 w-4" />
              Rédiger un nouveau message
            </Button>
          </div>
        )}
      </div>

      {/* ══ Fenêtre de composition ════════════════════════════════ */}
      {showCompose && (
        <div className={cn(
          "fixed z-50 bg-card border border-border rounded-t-xl shadow-2xl flex flex-col",
          composeMaximized
            ? "inset-4 rounded-xl"
            : "bottom-0 right-6 w-[560px] h-[520px]"
        )}>
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 dark:bg-gray-900 rounded-t-xl shrink-0">
            <span className="text-sm font-medium text-white">
              {composeMode === "new" ? "Nouveau message"
                : composeMode === "reply" ? "Répondre"
                : composeMode === "replyAll" ? "Répondre à tous"
                : "Transférer"}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setComposeMaximized(!composeMaximized)}
                className="h-7 w-7 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                {composeMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setShowCompose(false)}
                className="h-7 w-7 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Champs destinataires */}
          <div className="border-b border-border shrink-0">
            {/* À */}
            <div className="flex items-center border-b border-border/50 px-4">
              <span className="text-xs font-medium text-muted-foreground w-10 shrink-0">À</span>
              <input
                type="email"
                value={compose.to}
                onChange={e => setCompose(c => ({ ...c, to: e.target.value }))}
                placeholder="destinataire@email.com"
                className="flex-1 py-2.5 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex items-center gap-1 shrink-0">
                {!compose.showCc && (
                  <button onClick={() => setCompose(c => ({ ...c, showCc: true }))} className="text-xs text-muted-foreground hover:text-foreground px-1">Cc</button>
                )}
                {!compose.showBcc && (
                  <button onClick={() => setCompose(c => ({ ...c, showBcc: true }))} className="text-xs text-muted-foreground hover:text-foreground px-1">Cci</button>
                )}
              </div>
            </div>
            {/* Cc */}
            {compose.showCc && (
              <div className="flex items-center border-b border-border/50 px-4">
                <span className="text-xs font-medium text-muted-foreground w-10 shrink-0">Cc</span>
                <input
                  type="email"
                  value={compose.cc}
                  onChange={e => setCompose(c => ({ ...c, cc: e.target.value }))}
                  placeholder="copie@email.com"
                  className="flex-1 py-2.5 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}
            {/* Bcc */}
            {compose.showBcc && (
              <div className="flex items-center border-b border-border/50 px-4">
                <span className="text-xs font-medium text-muted-foreground w-10 shrink-0">Cci</span>
                <input
                  type="email"
                  value={compose.bcc}
                  onChange={e => setCompose(c => ({ ...c, bcc: e.target.value }))}
                  placeholder="copie-cachée@email.com"
                  className="flex-1 py-2.5 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}
            {/* Objet */}
            <div className="flex items-center px-4">
              <span className="text-xs font-medium text-muted-foreground w-10 shrink-0">Objet</span>
              <input
                type="text"
                value={compose.subject}
                onChange={e => setCompose(c => ({ ...c, subject: e.target.value }))}
                placeholder="Objet du message"
                className="flex-1 py-2.5 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground font-medium"
              />
            </div>
          </div>

          {/* Toolbar mise en forme */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border shrink-0 overflow-x-auto">
            {[
              { icon: Bold, title: "Gras", cmd: "bold" },
              { icon: Italic, title: "Italique", cmd: "italic" },
              { icon: Underline, title: "Souligné", cmd: "underline" },
            ].map(({ icon: Icon, title, cmd }) => (
              <button
                key={cmd}
                title={title}
                onMouseDown={e => { e.preventDefault(); document.execCommand(cmd, false); }}
                className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
            <div className="w-px h-5 bg-border mx-1" />
            {[
              { icon: AlignLeft, title: "Gauche", cmd: "justifyLeft" },
              { icon: AlignCenter, title: "Centre", cmd: "justifyCenter" },
              { icon: AlignRight, title: "Droite", cmd: "justifyRight" },
            ].map(({ icon: Icon, title, cmd }) => (
              <button
                key={cmd}
                title={title}
                onMouseDown={e => { e.preventDefault(); document.execCommand(cmd, false); }}
                className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
            <div className="w-px h-5 bg-border mx-1" />
            <button
              title="Liste"
              onMouseDown={e => { e.preventDefault(); document.execCommand("insertUnorderedList", false); }}
              className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              title="Lien"
              onMouseDown={e => {
                e.preventDefault();
                const url = window.prompt("URL :");
                if (url) document.execCommand("createLink", false, url);
              }}
              className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Zone de texte */}
          <div
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: compose.body }}
            onInput={e => setCompose(c => ({ ...c, body: (e.target as HTMLDivElement).innerHTML }))}
            className="flex-1 overflow-y-auto px-4 py-3 text-sm text-foreground outline-none leading-relaxed min-h-0"
            style={{ fontFamily: "Arial, sans-serif" }}
          />

          {/* Pièces jointes */}
          {compose.attachments.length > 0 && (
            <div className="px-4 py-2 border-t border-border flex flex-wrap gap-2 shrink-0">
              {compose.attachments.map((file, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-xs">
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                  <span className="text-foreground">{file.name}</span>
                  <button
                    onClick={() => setCompose(c => ({ ...c, attachments: c.attachments.filter((_, j) => j !== i) }))}
                    className="text-muted-foreground hover:text-destructive ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pied — actions */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border shrink-0">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-2 bg-blue-600 hover:bg-blue-700 h-8"
                onClick={handleSend}
              >
                <Send className="h-3.5 w-3.5" />
                Envoyer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground"
                onClick={handleSaveDraft}
              >
                Enregistrer
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <button
                title="Joindre un fichier"
                onClick={() => composeAttachRef.current?.click()}
                className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                ref={composeAttachRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => {
                  const files = Array.from(e.target.files ?? []);
                  setCompose(c => ({ ...c, attachments: [...c.attachments, ...files] }));
                  e.target.value = "";
                }}
              />
              <button
                title="Étiquette"
                className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Tag className="h-4 w-4" />
              </button>
              <button
                title="Supprimer le brouillon"
                onClick={() => setShowCompose(false)}
                className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
