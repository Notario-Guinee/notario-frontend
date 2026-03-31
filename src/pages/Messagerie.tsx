// ═══════════════════════════════════════════════════════════════
// Page Messagerie — Communication interne style WhatsApp
// Onglets : Toutes, Non lues, Favoris, Groupes
// Appel : vocal, vidéo, groupe, planifier
// ═══════════════════════════════════════════════════════════════

import { useState, useRef } from "react";
import { sanitizeInput } from "@/lib/sanitize";
import {
  Phone, Video, Paperclip, Send, Search, Plus, MessageCircle,
  MessageSquare, Smile, Users, X, Trash2, MoreVertical,
  Star, StarOff, ChevronDown, Calendar, UserPlus,
  CheckCheck, Check,
} from "lucide-react";
import { currentUser } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { searchMatch, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

// ─── Types ──────────────────────────────────────────────────────

type Presence = "online" | "busy" | "offline";
type MessagePriority = "urgente" | "importante" | null;
type ConvTab = "all" | "unread" | "starred" | "groups";

interface Conversation {
  id: string;
  nom: string;
  avatar: string;
  presence: Presence;
  lastMsg: string;
  time: string;
  unread: number;
  dossier: string | null;
  isGroup?: boolean;
  members?: string[];
  starred?: boolean;
}

interface ChatMessage {
  id: string;
  from: string;
  text: string;
  time: string;
  mine: boolean;
  dossier?: string;
  priority?: MessagePriority;
  read?: boolean;
}

// ─── Données initiales ──────────────────────────────────────────

const initialConversations: Conversation[] = [
  {
    id: "1", nom: "Aïssatou Conté", avatar: "AC", presence: "online",
    lastMsg: "J'ai terminé la préparation de l'acte A-8842. Il est prêt pour signature.",
    time: "11:42", unread: 2, dossier: "N-2025-101", starred: true,
  },
  {
    id: "2", nom: "Système Notario", avatar: "SN", presence: "online",
    lastMsg: "Nouveau client enregistré : Fam. Diallo - Dossier N-2025-105",
    time: "10:15", unread: 1, dossier: null,
  },
  {
    id: "3", nom: "Boubacar Diallo", avatar: "BD", presence: "busy",
    lastMsg: "Facture FAC-2026-003 relancée par email.",
    time: "Hier", unread: 0, dossier: "N-2025-042",
  },
  {
    id: "4", nom: "Fatoumata Bah", avatar: "FB", presence: "offline",
    lastMsg: "Merci pour les documents transmis.",
    time: "Lun.", unread: 0, dossier: null,
  },
  {
    id: "g1", nom: "Équipe Contentieux", avatar: "EC", presence: "online",
    lastMsg: "Réunion confirmée pour demain 14h.",
    time: "09:30", unread: 3, dossier: null, isGroup: true,
    members: ["Aïssatou Conté", "Boubacar Diallo", "Sékou Camara"],
  },
  {
    id: "g2", nom: "Cabinet — Général", avatar: "CG", presence: "online",
    lastMsg: "Rappel : clôture des dossiers 2025 le 31 mars.",
    time: "Mer.", unread: 0, dossier: null, isGroup: true,
    members: ["Aïssatou Conté", "Boubacar Diallo", "Fatoumata Bah", "Sékou Camara", "Mariama Condé"],
    starred: true,
  },
];

const messagesData: Record<string, ChatMessage[]> = {
  "1": [
    { id: "1", from: "Aïssatou Conté", text: "Bonjour Maître, j'ai bien reçu les instructions pour le dossier N-2025-101.", time: "10:00", mine: false, dossier: "N-2025-101", read: true },
    { id: "2", from: "Moi", text: "Parfait Aïssatou. Pouvez-vous préparer l'acte de vente pour signature ce vendredi ?", time: "10:05", mine: true, read: true },
    { id: "3", from: "Aïssatou Conté", text: "Bien sûr, je m'en occupe en priorité.", time: "10:06", mine: false, priority: "importante", read: true },
    { id: "4", from: "Moi", text: "N'oubliez pas la réunion de 14h sur les nouveaux modèles de documents.", time: "11:00", mine: true, read: true },
    { id: "5", from: "Aïssatou Conté", text: "J'ai terminé la préparation de l'acte A-8842. Il est prêt pour signature.", time: "11:42", mine: false, dossier: "N-2025-101", read: false },
  ],
  "2": [
    { id: "1", from: "Système", text: "Nouveau client enregistré : Fam. Diallo - Dossier N-2025-105", time: "10:15", mine: false, dossier: "N-2025-105", read: false },
  ],
  "3": [
    { id: "1", from: "Boubacar Diallo", text: "Bonjour, j'ai relancé la facture FAC-2026-003 par email.", time: "Hier 14:20", mine: false, read: true },
  ],
  "4": [
    { id: "1", from: "Fatoumata Bah", text: "Merci pour les documents transmis.", time: "Lun. 09:15", mine: false, read: true },
  ],
  "g1": [
    { id: "1", from: "Sékou Camara", text: "L'audience est reportée au 15 avril.", time: "Hier 16:00", mine: false, read: true },
    { id: "2", from: "Aïssatou Conté", text: "Réunion confirmée pour demain 14h.", time: "09:30", mine: false, read: false },
  ],
  "g2": [
    { id: "1", from: "Boubacar Diallo", text: "Rappel : clôture des dossiers 2025 le 31 mars.", time: "Mer. 08:45", mine: false, read: true },
  ],
};

// ─── Constantes ─────────────────────────────────────────────────

const presenceColor: Record<Presence, string> = {
  online: "bg-green-500",
  busy: "bg-amber-500",
  offline: "bg-muted-foreground",
};

const presenceLabel: Record<Presence, string> = {
  online: "En ligne",
  busy: "Occupé",
  offline: "Hors ligne",
};

const priorityStyles: Record<string, string> = {
  urgente: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  importante: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const EMOJI_LIST = ["😀","😂","😊","😍","🥰","😎","🤔","😅","👍","👎","❤️","🎉","🙏","👋","✅","⚠️","🔥","💡","📎","📄","📅","🗂️","⚖️","🏛️","✍️","📝","💬","📞","📧","🕐"];

const cabinetEmployees = [
  { id: "e1", nom: "Aïssatou Conté",   initiales: "AC" },
  { id: "e2", nom: "Boubacar Diallo",  initiales: "BD" },
  { id: "e3", nom: "Fatoumata Bah",    initiales: "FB" },
  { id: "e4", nom: "Sékou Camara",     initiales: "SC" },
  { id: "e5", nom: "Mariama Condé",    initiales: "MC" },
  { id: "e6", nom: "Ibrahim Soumah",   initiales: "IS" },
];

// ─── Composant avatar initiales ─────────────────────────────────

function ConvAvatar({ conv, size = "md" }: { conv: Conversation; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div className="relative shrink-0">
      <div className={cn(
        "flex items-center justify-center rounded-full font-semibold",
        conv.isGroup ? "bg-primary/20 text-primary" : "bg-primary/15 text-primary",
        dim,
      )}>
        {conv.isGroup ? <Users className="h-4 w-4" /> : conv.avatar}
      </div>
      {!conv.isGroup && (
        <span className={cn(
          "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-card",
          size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
          presenceColor[conv.presence],
        )} />
      )}
    </div>
  );
}

// ─── Onglets ────────────────────────────────────────────────────

const TABS: { id: ConvTab; label: string }[] = [
  { id: "all",     label: "Toutes"   },
  { id: "unread",  label: "Non lues" },
  { id: "starred", label: "Favoris"  },
  { id: "groups",  label: "Groupes"  },
];

// ═══════════════════════════════════════════════════════════════

export default function Messagerie() {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConv, setSelectedConv]   = useState(conversations[0]);
  const [message, setMessage]             = useState("");
  const [messages, setMessages]           = useState(messagesData);
  const [searchQuery, setSearchQuery]     = useState("");
  const [activeTab, setActiveTab]         = useState<ConvTab>("all");

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments]         = useState<string[]>([]);

  const [deleteConvId, setDeleteConvId]   = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [groupName, setGroupName]         = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // ─── Filtrage par onglet ────────────────────────────────────

  const filteredConversations = conversations.filter(c => {
    const matchSearch = !searchQuery || [c.nom, c.lastMsg, c.dossier].some(f => searchMatch(f, searchQuery));
    if (!matchSearch) return false;
    if (activeTab === "unread")  return c.unread > 0;
    if (activeTab === "starred") return !!c.starred;
    if (activeTab === "groups")  return !!c.isGroup;
    return true;
  });

  const tabCount = (tab: ConvTab) => {
    if (tab === "all")     return conversations.reduce((a, c) => a + c.unread, 0);
    if (tab === "unread")  return conversations.filter(c => c.unread > 0).length;
    if (tab === "starred") return conversations.filter(c => c.starred).length;
    if (tab === "groups")  return conversations.filter(c => c.isGroup).length;
    return 0;
  };

  // ─── Handlers ───────────────────────────────────────────────

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAttachments(prev => [...prev, ...files.map(f => f.name)]);
    toast.success(files.length === 1 ? `Fichier joint : ${files[0].name}` : `${files.length} fichiers joints`);
    e.target.value = "";
  };

  const handleDeleteConversation = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (selectedConv.id === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) setSelectedConv(remaining[0]);
    }
    toast.success(`Conversation « ${conv?.nom} » supprimée.`);
  };

  const toggleStarred = (id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, starred: !c.starred } : c));
  };

  const envoyer = () => {
    if (!message.trim() && !attachments.length) return;
    const text = [sanitizeInput(message), ...attachments.map(a => `📎 ${sanitizeInput(a)}`)].filter(Boolean).join("\n");
    const newMsg: ChatMessage = {
      id: Date.now().toString(), from: currentUser.firstName,
      text, time: "à l'instant", mine: true, read: false,
    };
    setMessages(prev => ({ ...prev, [selectedConv.id]: [...(prev[selectedConv.id] || []), newMsg] }));
    setConversations(prev => prev.map(c =>
      c.id === selectedConv.id ? { ...c, lastMsg: text.slice(0, 60), time: "à l'instant" } : c
    ));
    setMessage(""); setAttachments([]); setShowEmojiPicker(false);
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || !selectedMembers.length) return;
    const newGroup: Conversation = {
      id: `group-${Date.now()}`, nom: groupName,
      avatar: groupName.slice(0, 2).toUpperCase(),
      presence: "online", lastMsg: `Groupe créé — ${selectedMembers.length} membres`,
      time: "à l'instant", unread: 0, dossier: null,
      isGroup: true, members: selectedMembers,
    };
    setConversations(prev => [newGroup, ...prev]);
    setMessages(prev => ({
      ...prev,
      [newGroup.id]: [{ id: "1", from: "Système", text: `Groupe « ${groupName} » créé. Membres : ${selectedMembers.join(", ")}`, time: "à l'instant", mine: false, read: false }],
    }));
    setSelectedConv(newGroup);
    setShowGroupModal(false); setGroupName(""); setSelectedMembers([]);
    toast.success(`Groupe « ${groupName} » créé`);
  };

  const toggleMember = (name: string) =>
    setSelectedMembers(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const selectConv = (conv: Conversation) => {
    setSelectedConv(conv);
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c));
  };

  // ─── Indicateurs d'onglet ───────────────────────────────────

  const currentMsgs = messages[selectedConv.id] || [];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* En-tête page */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-heading font-bold text-foreground">{t("msg.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("msg.subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setGroupName(""); setSelectedMembers([]); setShowGroupModal(true); }}>
            <Users className="h-4 w-4" /> {t("msg.createGroup")}
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setShowNewConvModal(true)}>
            <Plus className="h-4 w-4" /> {t("msg.newConversation")}
          </Button>
        </div>
      </div>

      {/* Corps principal */}
      <div className="flex flex-1 rounded-xl border border-border overflow-hidden shadow-card min-h-0">

        {/* ── Colonne gauche ── */}
        <div className="w-80 border-r border-border bg-card flex flex-col shrink-0">

          {/* Recherche */}
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          {/* Onglets WhatsApp */}
          <div className="flex border-b border-border shrink-0">
            {TABS.map(tab => {
              const count = tabCount(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors relative",
                    activeTab === tab.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={cn(
                      "inline-flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold px-1",
                      activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}>
                      {count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">Aucune conversation</p>
                <p className="text-xs text-muted-foreground mt-1">Aucun résultat pour cet onglet.</p>
              </div>
            )}
            <AnimatePresence initial={false}>
              {filteredConversations.map(conv => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "group relative flex items-start gap-3 px-3 py-3 border-b border-border/60 transition-colors cursor-pointer",
                    selectedConv.id === conv.id ? "bg-primary/8 border-l-2 border-l-primary" : "hover:bg-muted/40",
                  )}
                  onClick={() => selectConv(conv)}
                >
                  <ConvAvatar conv={conv} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={cn("text-sm truncate", conv.unread > 0 ? "font-bold text-foreground" : "font-medium text-foreground")}>
                        {conv.nom}
                      </p>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {conv.starred && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                        <span className="text-[10px] text-muted-foreground">{conv.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <p className={cn("text-xs truncate flex-1", conv.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                        {conv.lastMsg}
                      </p>
                      {conv.unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    {conv.dossier && (
                      <Badge variant="outline" className="mt-1 text-[10px] text-primary border-primary/30 bg-primary/5">
                        {conv.dossier}
                      </Badge>
                    )}
                    {conv.isGroup && conv.members && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{conv.members.length} membres</p>
                    )}
                  </div>

                  {/* Menu contextuel */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <button className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 hover:bg-muted mt-0.5">
                        <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); toggleStarred(conv.id); }}>
                        {conv.starred
                          ? <><StarOff className="mr-2 h-4 w-4" /> Retirer des favoris</>
                          : <><Star className="mr-2 h-4 w-4" /> Ajouter aux favoris</>
                        }
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={e => { e.stopPropagation(); setDeleteConvId(conv.id); }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Zone de chat ── */}
        <div className="flex flex-1 flex-col bg-background min-w-0">

          {/* En-tête du chat */}
          <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shrink-0">
            <ConvAvatar conv={selectedConv} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{selectedConv.nom}</p>
              <p className="text-xs text-muted-foreground">
                {selectedConv.isGroup
                  ? `${selectedConv.members?.length ?? 0} membres`
                  : presenceLabel[selectedConv.presence]
                }
              </p>
            </div>

            {/* Bouton Appeler avec dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Phone className="h-3.5 w-3.5" />
                  Appeler
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                {/* Identité */}
                <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg bg-muted/50">
                  <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                    {selectedConv.avatar}
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">{selectedConv.nom}</span>
                </div>
                {/* Appels principaux */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => toast.info(`Appel vocal avec ${selectedConv.nom}...`)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-2.5 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" /> Vocal
                  </button>
                  <button
                    onClick={() => toast.info(`Appel vidéo avec ${selectedConv.nom}...`)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-2.5 transition-colors"
                  >
                    <Video className="h-3.5 w-3.5" /> Vidéo
                  </button>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setGroupName(""); setSelectedMembers([]); setShowGroupModal(true); }}>
                  <UserPlus className="mr-2 h-4 w-4" /> Nouvel appel de groupe
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Planification d'appel — bientôt disponible")}>
                  <Calendar className="mr-2 h-4 w-4" /> Planifier un appel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu contextuel conversation */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-lg p-2 hover:bg-muted transition-colors">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toggleStarred(selectedConv.id)}>
                  {selectedConv.starred ? <><StarOff className="mr-2 h-4 w-4" /> Retirer des favoris</> : <><Star className="mr-2 h-4 w-4" /> Ajouter aux favoris</>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConvId(selectedConv.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer la conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Fond de chat style WhatsApp (subtil) */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-muted/20">
            {currentMsgs.map((msg, idx) => {
              const isFirst = idx === 0 || currentMsgs[idx - 1].mine !== msg.mine;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex flex-col", msg.mine ? "items-end" : "items-start")}
                >
                  {isFirst && !msg.mine && (
                    <span className="text-[11px] text-muted-foreground mb-1 ml-1">{msg.from}</span>
                  )}
                  <div className={cn(
                    "relative rounded-2xl px-3.5 py-2.5 max-w-[75%] shadow-sm",
                    msg.mine
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border text-foreground rounded-tl-sm",
                  )}>
                    {msg.priority && (
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium mr-1 inline-block mb-1", priorityStyles[msg.priority])}>
                        {msg.priority}
                      </span>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className={cn("text-[10px]", msg.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {msg.time}
                      </span>
                      {msg.mine && (
                        msg.read
                          ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                          : <Check className="h-3 w-3 text-primary-foreground/50" />
                      )}
                    </div>
                    {msg.dossier && (
                      <Badge variant={msg.mine ? "outline" : "outline"} className={cn(
                        "mt-1.5 text-[10px] border",
                        msg.mine ? "border-primary-foreground/30 text-primary-foreground/80 bg-primary-foreground/10" : "text-primary border-primary/30 bg-primary/5",
                      )}>
                        {msg.dossier}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Zone de saisie */}
          <div className="border-t border-border bg-card px-4 py-3 shrink-0 space-y-2">
            {/* Pièces jointes en attente */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attachments.map((name, i) => (
                  <span key={i} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    {name}
                    <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Emoji picker */}
            {showEmojiPicker && (
              <div className="rounded-xl border border-border bg-card shadow-lg p-3">
                <div className="grid grid-cols-10 gap-1">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} onClick={() => handleEmojiSelect(emoji)}
                      className="flex items-center justify-center h-8 w-8 rounded-md text-lg hover:bg-muted transition-colors">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmojiPicker(v => !v)}
                className={cn("rounded-full p-2 hover:bg-muted transition-colors", showEmojiPicker && "bg-muted")}
              >
                <Smile className="h-5 w-5 text-muted-foreground" />
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="rounded-full p-2 hover:bg-muted transition-colors">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </button>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && envoyer()}
                placeholder={t("msg.writeMessage")}
                className="flex-1 rounded-full bg-muted px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                onClick={envoyer}
                disabled={!message.trim() && !attachments.length}
                className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Confirmation suppression ─────────────────────────────── */}
      <AlertDialog open={!!deleteConvId} onOpenChange={open => !open && setDeleteConvId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tous les messages seront supprimés définitivement. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { handleDeleteConversation(deleteConvId!); setDeleteConvId(null); }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Modal nouvelle conversation ──────────────────────────── */}
      <Dialog open={showNewConvModal} onOpenChange={setShowNewConvModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("msg.newConversation")}</DialogTitle>
            <DialogDescription>Choisissez un collaborateur pour démarrer une conversation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1 py-2">
            {cabinetEmployees.map(emp => (
              <button
                key={emp.id}
                className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-muted transition-colors text-left"
                onClick={() => {
                  const exists = conversations.find(c => c.nom === emp.nom && !c.isGroup);
                  if (exists) { setSelectedConv(exists); setShowNewConvModal(false); return; }
                  const newConv: Conversation = {
                    id: `conv-${Date.now()}`, nom: emp.nom, avatar: emp.initiales,
                    presence: "online", lastMsg: "", time: "à l'instant",
                    unread: 0, dossier: null,
                  };
                  setConversations(prev => [newConv, ...prev]);
                  setMessages(prev => ({ ...prev, [newConv.id]: [] }));
                  setSelectedConv(newConv);
                  setShowNewConvModal(false);
                }}
              >
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {emp.initiales}
                </div>
                <span className="text-sm font-medium text-foreground">{emp.nom}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Modal création de groupe ─────────────────────────────── */}
      <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t("msg.groupModalTitle")}
            </DialogTitle>
            <DialogDescription>{t("msg.groupModalDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("msg.groupName")} *</Label>
              <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder={t("msg.groupNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("msg.membersLabel")} ({selectedMembers.length} {t("msg.selected")})</Label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {cabinetEmployees.map(emp => (
                  <label key={emp.id} className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors",
                    selectedMembers.includes(emp.nom) ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/30",
                  )}>
                    <input type="checkbox" checked={selectedMembers.includes(emp.nom)} onChange={() => toggleMember(emp.nom)} className="rounded border-border" />
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {emp.initiales}
                    </div>
                    <span className="text-sm font-medium text-foreground">{emp.nom}</span>
                  </label>
                ))}
              </div>
            </div>
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedMembers.map(name => (
                  <span key={name} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
                    {name}
                    <button onClick={() => toggleMember(name)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupModal(false)}>{t("msg.cancelGroup")}</Button>
            <Button className="gap-2" onClick={handleCreateGroup} disabled={!groupName.trim() || !selectedMembers.length}>
              <Users className="h-4 w-4" /> {t("msg.createGroupBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
