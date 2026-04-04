// ═══════════════════════════════════════════════════════════════
// Page Messagerie — Communication interne style WhatsApp
// Onglets : Toutes, Non lues, Favoris, Groupes
// Appel : vocal, vidéo, groupe, planifier
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from "react";
import { sanitizeInput } from "@/lib/sanitize";
import {
  Phone, Video, Paperclip, Send, Search, Plus, MessageCircle,
  MessageSquare, Smile, Users, X, Trash2, MoreVertical,
  Star, StarOff, ChevronDown, Calendar, UserPlus,
  CheckCheck, Check, Reply, Pin, Forward, Copy,
  CheckSquare, Flag, AlertTriangle, Eye, Download,
  ImageIcon, Film, Play, Mic, Square, FileText, Pencil,
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

type MessageType = "text" | "image" | "video" | "voice" | "file";

interface ChatMessage {
  id: string;
  from: string;
  text: string;
  time: string;
  mine: boolean;
  dossier?: string;
  priority?: MessagePriority;
  read?: boolean;
  type?: MessageType;
  replyTo?: { from: string; text: string; type?: MessageType };
  deleted?: boolean;
  edited?: boolean;
  audioUrl?: string;
  voiceDuration?: string;
  fileName?: string;
  fileSize?: string;
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
    { id: "5", from: "Aïssatou Conté", text: "Photo du document signé", time: "11:30", mine: false, type: "image", read: true },
    { id: "6", from: "Moi", text: "Note vocale", time: "11:38", mine: true, type: "voice", read: true },
    { id: "7", from: "Aïssatou Conté", text: "J'ai terminé la préparation de l'acte A-8842. Il est prêt pour signature.", time: "11:42", mine: false, dossier: "N-2025-101", read: false },
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

// presenceLabel is built inside the component using t() for i18n

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

// TABS is built inside the component using t() for i18n

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// ─── Données appels ──────────────────────────────────────────

type CallDirection = "incoming" | "outgoing" | "missed";
type CallKind = "voice" | "video";

interface AppelRecord {
  id: string;
  with: string;
  avatar: string;
  kind: CallKind;
  direction: CallDirection;
  duration?: string;
  time: string;
  date: string;
}

const mockAppels: AppelRecord[] = [
  { id: "a1", with: "Aïssatou Conté",   avatar: "AC", kind: "voice", direction: "missed",   time: "11:42", date: "Aujourd'hui" },
  { id: "a2", with: "Boubacar Diallo",  avatar: "BD", kind: "video", direction: "outgoing",  duration: "5:23", time: "10:15", date: "Aujourd'hui" },
  { id: "a3", with: "Fatoumata Bah",    avatar: "FB", kind: "voice", direction: "incoming",  duration: "2:47", time: "09:30", date: "Aujourd'hui" },
  { id: "a4", with: "Équipe Contentieux", avatar: "EC", kind: "video", direction: "missed",  time: "Hier 16:00", date: "Hier" },
  { id: "a5", with: "Boubacar Diallo",  avatar: "BD", kind: "voice", direction: "missed",    time: "Hier 14:20", date: "Hier" },
  { id: "a6", with: "Mariama Condé",    avatar: "MC", kind: "voice", direction: "outgoing",  duration: "1:05", time: "Hier 11:30", date: "Hier" },
  { id: "a7", with: "Sékou Camara",     avatar: "SC", kind: "voice", direction: "incoming",  duration: "0:32", time: "Lun. 09:15", date: "Lundi" },
];

// ═══════════════════════════════════════════════════════════════

export default function Messagerie() {
  const { t } = useLanguage();

  const presenceLabel: Record<Presence, string> = {
    online: t("msg.presenceOnline"),
    busy: t("msg.presenceBusy"),
    offline: t("msg.presenceOffline"),
  };

  const TABS: { id: ConvTab; label: string }[] = [
    { id: "all",     label: t("msg.tabAll")     },
    { id: "unread",  label: t("msg.tabUnread")  },
    { id: "starred", label: t("msg.tabStarred") },
    { id: "groups",  label: t("msg.tabGroups")  },
  ];

  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConv, setSelectedConv]   = useState(conversations[0]);
  const [message, setMessage]             = useState("");
  const [messages, setMessages]           = useState(messagesData);
  const [searchQuery, setSearchQuery]     = useState("");
  const [activeTab, setActiveTab]         = useState<ConvTab>("all");
  const [mainSection, setMainSection]     = useState<"messages" | "appels">("messages");

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles]     = useState<Array<{name: string; size: string; url: string; mime: string}>>([]);

  const [deleteConvId, setDeleteConvId]   = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [groupName, setGroupName]         = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [reactions, setReactions]         = useState<Record<string, string[]>>({});
  const [myReactions, setMyReactions]     = useState<Record<string, string[]>>({});
  const [reactionPickerId, setReactionPickerId] = useState<string | null>(null);

  // ─── Fonctionnalités messages ────────────────────────────────
  const [replyTo, setReplyTo]             = useState<ChatMessage | null>(null);
  const [pinnedIds, setPinnedIds]         = useState<Set<string>>(new Set());
  const [importantIds, setImportantIds]   = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
  const [forwardMsg, setForwardMsg]       = useState<ChatMessage | null>(null);
  const [deleteMsgId, setDeleteMsgId]     = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId]   = useState<string | null>(null);
  const [editText, setEditText]           = useState("");

  // ─── Enregistrement vocal ────────────────────────────────────
  const [isRecording, setIsRecording]     = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [playingId, setPlayingId]         = useState<string | null>(null);
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef         = useRef<BlobPart[]>([]);
  const durRef            = useRef(0);
  const streamRef         = useRef<MediaStream | null>(null);
  const audioRef          = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioRef.current?.pause();
    };
  }, []);

  const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      durRef.current = 0;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "";
      const convId = selectedConv.id;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        const dur = durRef.current;
        if (chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const audioUrl = URL.createObjectURL(blob);
        const voiceMsg: ChatMessage = {
          id: Date.now().toString(), from: currentUser.firstName,
          text: "", voiceDuration: fmtSecs(dur),
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          mine: true, read: false, type: "voice", audioUrl,
        };
        setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] || []), voiceMsg] }));
        setConversations(prev => prev.map(c =>
          c.id === convId ? { ...c, lastMsg: "🎙 Message vocal", time: "à l'instant" } : c
        ));
      };
      recorder.start(200);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSecs(0);
      recordingTimerRef.current = setInterval(() => {
        durRef.current += 1;
        setRecordingSecs(s => s + 1);
      }, 1000);
    } catch {
      toast.error(t("msg.toastMicUnavailable"));
    }
  };

  const stopAndSendVoice = () => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setRecordingSecs(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) { mediaRecorderRef.current.onstop = null; mediaRecorderRef.current.stop(); mediaRecorderRef.current = null; }
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsRecording(false);
    setRecordingSecs(0);
  };

  const playVoice = (msg: ChatMessage) => {
    if (!msg.audioUrl) { toast.info(t("msg.toastAudioUnavailable")); return; }
    if (playingId === msg.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const audio = new Audio(msg.audioUrl);
    audio.onended  = () => setPlayingId(null);
    audio.onerror  = () => { toast.error(t("msg.toastAudioError")); setPlayingId(null); };
    audio.play().catch(() => { toast.error(t("msg.toastAudioImpossible")); setPlayingId(null); });
    audioRef.current = audio;
    setPlayingId(msg.id);
  };

  const toggleReaction = (msgId: string, emoji: string) => {
    const mine = myReactions[msgId] ?? [];
    if (mine.includes(emoji)) {
      setReactions(prev => {
        const arr = [...(prev[msgId] ?? [])];
        const idx = arr.indexOf(emoji);
        if (idx !== -1) arr.splice(idx, 1);
        return { ...prev, [msgId]: arr };
      });
      setMyReactions(prev => ({
        ...prev,
        [msgId]: (prev[msgId] ?? []).filter(e => e !== emoji),
      }));
    } else {
      setReactions(prev => ({ ...prev, [msgId]: [...(prev[msgId] ?? []), emoji] }));
      setMyReactions(prev => ({ ...prev, [msgId]: [...(prev[msgId] ?? []), emoji] }));
    }
    setReactionPickerId(null);
  };

  const togglePin = (msgId: string) =>
    setPinnedIds(prev => { const s = new Set(prev); s.has(msgId) ? s.delete(msgId) : s.add(msgId); return s; });

  const toggleImportant = (msgId: string) =>
    setImportantIds(prev => { const s = new Set(prev); s.has(msgId) ? s.delete(msgId) : s.add(msgId); return s; });

  const toggleSelectMsg = (msgId: string) =>
    setSelectedMsgIds(prev => { const s = new Set(prev); s.has(msgId) ? s.delete(msgId) : s.add(msgId); return s; });

  const exitSelectionMode = () => { setSelectionMode(false); setSelectedMsgIds(new Set()); };

  const startEdit = (msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setEditText(msg.text);
  };

  const saveEdit = () => {
    if (!editingMsgId) return;
    const trimmed = sanitizeInput(editText.trim());
    if (!trimmed) return;
    setMessages(prev => ({
      ...prev,
      [selectedConv.id]: (prev[selectedConv.id] || []).map(m =>
        m.id === editingMsgId ? { ...m, text: trimmed, edited: true } : m
      ),
    }));
    setEditingMsgId(null);
    setEditText("");
    toast.success(t("msg.toastMsgEdited"));
  };

  const deleteSelected = () => {
    const ids = selectedMsgIds;
    setMessages(prev => ({
      ...prev,
      [selectedConv.id]: (prev[selectedConv.id] || []).map(m => ids.has(m.id) ? { ...m, deleted: true } : m),
    }));
    toast.success(`${ids.size} ${ids.size > 1 ? t("msg.toastMsgsDeletedPlural") : t("msg.toastMsgsDeletedSingular")}`);
    exitSelectionMode();
  };

  const forwardToConv = (convId: string) => {
    if (!forwardMsg) return;
    const target = conversations.find(c => c.id === convId);
    if (!target) return;
    const fwd: ChatMessage = {
      id: Date.now().toString(), from: "Moi",
      text: `↪ Transféré : ${forwardMsg.text}`,
      time: "à l'instant", mine: true, read: false,
    };
    setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] || []), fwd] }));
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, lastMsg: fwd.text.slice(0, 60), time: "à l'instant" } : c));
    toast.success(`${t("msg.toastTransferredTo")} « ${target.nom} »`);
    setForwardMsg(null);
  };

  // ─── Filtrage par onglet ────────────────────────────────────

  const filteredConversations = conversations.filter(c => {
    const matchSearch = !searchQuery || [c.nom, c.lastMsg, c.dossier].some(f => !!f && searchMatch(f, searchQuery));
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
    const newFiles = files.map(f => ({
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} Mo` : `${Math.ceil(f.size / 1024)} Ko`,
      url: URL.createObjectURL(f),
      mime: f.type,
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
    toast.success(files.length === 1 ? `${t("msg.toastFileJoined")} ${files[0].name}` : `${files.length} ${t("msg.toastFilesJoined")}`);
    e.target.value = "";
  };

  const handleDeleteConversation = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (selectedConv.id === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) setSelectedConv(remaining[0]);
    }
    toast.success(`${t("msg.deleteConversation")} « ${conv?.nom} »`);
  };

  const toggleStarred = (id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, starred: !c.starred } : c));
  };

  const envoyer = () => {
    if (!message.trim() && !attachedFiles.length) return;
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const msgs: ChatMessage[] = [];

    attachedFiles.forEach((f, i) => {
      const isImage = f.mime.startsWith("image/");
      const isVideo = f.mime.startsWith("video/");
      const msgType: MessageType = isImage ? "image" : isVideo ? "video" : "file";
      msgs.push({
        id: `${Date.now()}-${i}`, from: currentUser.firstName,
        text: "", time: now, mine: true, read: false,
        type: msgType, audioUrl: f.url,
        ...(msgType === "file" ? { fileName: f.name, fileSize: f.size } : {}),
      });
    });

    if (message.trim()) {
      const raw = sanitizeInput(message);
      msgs.push({
        id: `${Date.now()}-t`, from: currentUser.firstName,
        text: raw, time: now, mine: true, read: false,
        ...(replyTo ? { replyTo: { from: replyTo.from, text: replyTo.text, type: replyTo.type } } : {}),
      });
    }

    if (!msgs.length) return;
    setMessages(prev => ({ ...prev, [selectedConv.id]: [...(prev[selectedConv.id] || []), ...msgs] }));
    const last = msgs[msgs.length - 1];
    const lastMsgText = last.type === "image" ? "🖼 Photo"
      : last.type === "video" ? "🎬 Vidéo"
      : last.type === "file" ? `📎 ${last.fileName ?? t("msg.fileDefault")}`
      : last.text.slice(0, 60);
    setConversations(prev => prev.map(c =>
      c.id === selectedConv.id ? { ...c, lastMsg: lastMsgText, time: "à l'instant" } : c
    ));
    setMessage(""); setAttachedFiles([]); setShowEmojiPicker(false); setReplyTo(null);
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
    toast.success(`${t("msg.group")} « ${groupName} » ${t("msg.toastGroupCreated")}`);
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

      {/* Toggle Messages / Appels */}
      <div className="flex gap-1 mb-3 shrink-0 bg-muted rounded-xl p-1 self-start">
        {(["messages", "appels"] as const).map(s => (
          <button
            key={s}
            onClick={() => setMainSection(s)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
              mainSection === s
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s === "messages" ? t("msg.messages") : t("msg.calls")}
          </button>
        ))}
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

          {/* Onglets WhatsApp — uniquement en mode Messages */}
          {mainSection === "messages" && (
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
          )}
          {mainSection === "appels" && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 shrink-0">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">{t("msg.callHistory")}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{mockAppels.filter(a => a.direction === "missed").length} {t("msg.missed")}</span>
            </div>
          )}

          {/* Liste des conversations / appels */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {mainSection === "appels" ? (
              <div className="flex flex-col">
                {/* Légende */}
                <div className="flex items-center gap-3 px-3 py-2 border-b border-border/60">
                  <Phone className="h-3 w-3 text-red-500" /><span className="text-[10px] text-red-500 font-medium">{t("msg.missedLegend")}</span>
                  <Phone className="h-3 w-3 text-muted-foreground ml-2" /><span className="text-[10px] text-muted-foreground">{t("msg.receivedOrSent")}</span>
                </div>
                {mockAppels.map(appel => (
                  <div key={appel.id} className="flex items-center gap-3 px-3 py-3 border-b border-border/60 hover:bg-muted/40 transition-colors">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {appel.avatar}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={cn("text-sm font-medium truncate", appel.direction === "missed" ? "text-red-500" : "text-foreground")}>
                          {appel.with}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-1">{appel.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {appel.kind === "video"
                          ? <Video className={cn("h-3 w-3", appel.direction === "missed" ? "text-red-400" : "text-muted-foreground")} />
                          : <Phone className={cn("h-3 w-3", appel.direction === "missed" ? "text-red-400" : "text-muted-foreground")} />
                        }
                        <span className={cn("text-xs", appel.direction === "missed" ? "text-red-400" : "text-muted-foreground")}>
                          {appel.direction === "missed" ? t("msg.missedCall")
                           : appel.direction === "outgoing" ? `${t("msg.outgoing")}${appel.duration ? " · " + appel.duration : ""}`
                           : `${t("msg.incoming")}${appel.duration ? " · " + appel.duration : ""}`}
                        </span>
                      </div>
                    </div>
                    {/* Rappeler */}
                    <button
                      onClick={() => toast.info(`${t("msg.toastReminderOf")} ${appel.with}…`)}
                      className={cn(
                        "shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                        appel.kind === "video" ? "bg-primary/10 hover:bg-primary/20 text-primary" : "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400",
                      )}
                    >
                      {appel.kind === "video" ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">{t("msg.noConversation")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("msg.noResult")}</p>
              </div>
            ) : null}
            <AnimatePresence initial={false}>
              {mainSection === "messages" && filteredConversations.map(conv => (
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
                      <p className="text-[10px] text-muted-foreground mt-0.5">{conv.members.length} {t("msg.membersCount")}</p>
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
                          ? <><StarOff className="mr-2 h-4 w-4" /> {t("msg.removeFavorite")}</>
                          : <><Star className="mr-2 h-4 w-4" /> {t("msg.addFavorite")}</>
                        }
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={e => { e.stopPropagation(); setDeleteConvId(conv.id); }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> {t("msg.delete")}
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
                  ? `${selectedConv.members?.length ?? 0} ${t("msg.membersCount")}`
                  : presenceLabel[selectedConv.presence]
                }
              </p>
            </div>

            {/* Bouton Appeler avec dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Phone className="h-3.5 w-3.5" />
                  {t("msg.callBtn")}
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
                    onClick={() => toast.info(`${t("msg.toastVoiceCallWith")} ${selectedConv.nom}...`)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-2.5 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" /> {t("msg.voiceCall")}
                  </button>
                  <button
                    onClick={() => toast.info(`${t("msg.toastVideoCallWith")} ${selectedConv.nom}...`)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-2.5 transition-colors"
                  >
                    <Video className="h-3.5 w-3.5" /> {t("msg.videoCall")}
                  </button>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setGroupName(""); setSelectedMembers([]); setShowGroupModal(true); }}>
                  <UserPlus className="mr-2 h-4 w-4" /> {t("msg.newGroupCall")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info(t("msg.toastScheduleCall"))}>
                  <Calendar className="mr-2 h-4 w-4" /> {t("msg.scheduleCall")}
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
                  {selectedConv.starred ? <><StarOff className="mr-2 h-4 w-4" /> {t("msg.removeFavorite")}</> : <><Star className="mr-2 h-4 w-4" /> {t("msg.addFavorite")}</>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConvId(selectedConv.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> {t("msg.deleteConversation")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Overlay pour fermer le picker emoji au clic extérieur */}
          {reactionPickerId && (
            <div className="fixed inset-0 z-40" onClick={() => setReactionPickerId(null)} />
          )}

          {/* Bannière messages épinglés */}
          {(() => {
            const pinned = currentMsgs.filter(m => pinnedIds.has(m.id));
            if (!pinned.length) return null;
            return (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 shrink-0">
                <Pin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs text-amber-700 dark:text-amber-300 truncate flex-1">
                  {pinned.length === 1 ? `${t("msg.pinned")} : ${pinned[0].text.slice(0, 60)}` : `${pinned.length} ${t("msg.pinnedMessages")}`}
                </span>
              </div>
            );
          })()}

          {/* Barre de sélection */}
          {selectionMode && (
            <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 border-b border-primary/20 shrink-0">
              <span className="text-sm font-medium text-primary flex-1">
                {selectedMsgIds.size} {selectedMsgIds.size > 1 ? t("msg.selectedPlural") : t("msg.selectedSingular")}
              </span>
              <button onClick={deleteSelected} disabled={!selectedMsgIds.size}
                className="text-xs text-destructive font-medium hover:underline disabled:opacity-40">
                {t("msg.deleteSelected")}
              </button>
              <button onClick={() => { const m = currentMsgs.find(m => selectedMsgIds.has(m.id)); if (m) setForwardMsg(m); }}
                disabled={!selectedMsgIds.size}
                className="text-xs text-primary font-medium hover:underline disabled:opacity-40">
                {t("msg.transferSelected")}
              </button>
              <button onClick={exitSelectionMode}
                className="h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Fond de chat style WhatsApp (subtil) */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-muted/20">
            {currentMsgs.map((msg, idx) => {
              const isFirst = idx === 0 || currentMsgs[idx - 1].mine !== msg.mine;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => selectionMode && toggleSelectMsg(msg.id)}
                  className={cn(
                    "flex flex-col group/msg",
                    msg.mine ? "items-end" : "items-start",
                    selectionMode && "cursor-pointer",
                    selectionMode && selectedMsgIds.has(msg.id) && "opacity-80",
                  )}
                >
                  {isFirst && !msg.mine && (
                    <span className="text-[11px] text-muted-foreground mb-1 ml-1">{msg.from}</span>
                  )}
                  {/* Indicateurs épinglé / important */}
                  {(pinnedIds.has(msg.id) || importantIds.has(msg.id)) && (
                    <div className={cn("flex gap-1 mb-0.5", msg.mine ? "justify-end" : "justify-start")}>
                      {pinnedIds.has(msg.id) && <Pin className="h-3 w-3 text-amber-500" />}
                      {importantIds.has(msg.id) && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                    </div>
                  )}
                  {/* Ligne bulle + bouton réaction */}
                  <div className={cn(
                    "flex items-end gap-1.5",
                    msg.mine ? "flex-row-reverse" : "flex-row",
                  )}>
                    {/* Wrapper: contrainte max-w + positioning pour le chevron — EN PREMIER dans le DOM */}
                    <div className="relative max-w-[75%]">
                      {/* Bulle */}
                      <div className={cn(
                        "rounded-2xl px-3.5 py-2.5 shadow-sm",
                        msg.type === "voice" && "min-w-[200px]",
                        msg.mine
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-card border border-border text-foreground rounded-tl-sm",
                      )}>
                        {/* ─── Message supprimé (trace WhatsApp) ─── */}
                        {msg.deleted ? (
                          <p className={cn(
                            "text-xs italic flex items-center gap-1.5",
                            msg.mine ? "text-primary-foreground/60" : "text-muted-foreground",
                          )}>
                            <span>🚫</span> {t("msg.msgDeleted")}
                          </p>
                        ) : (
                        <>

                        {/* ─── Citation (réponse) style WhatsApp ─── */}
                        {msg.replyTo && (
                          <div className={cn(
                            "rounded-lg overflow-hidden mb-1.5 border-l-[3px]",
                            msg.mine ? "bg-white/15 border-white/70" : "bg-muted/60 border-primary",
                          )}>
                            <div className="px-2.5 py-1.5">
                              <p className={cn("text-[11px] font-semibold mb-0.5",
                                msg.mine ? "text-white/90" : "text-primary",
                              )}>
                                {msg.replyTo.from === "Moi" ? t("msg.you") : msg.replyTo.from}
                              </p>
                              <p className={cn("text-xs truncate",
                                msg.mine ? "text-white/70" : "text-muted-foreground",
                              )}>
                                {msg.replyTo.type === "voice" ? "🎙 Message vocal"
                                  : msg.replyTo.type === "image" ? "🖼 Photo"
                                  : msg.replyTo.type === "video" ? "🎬 Vidéo"
                                  : msg.replyTo.text.slice(0, 80)}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* ─── Contenu selon le type ─── */}
                        {msg.type === "image" ? (
                          <>
                            <div className="rounded-xl overflow-hidden bg-muted/30 w-48 h-32 flex items-center justify-center -mx-2">
                              <ImageIcon className={cn("h-10 w-10", msg.mine ? "text-primary-foreground/40" : "text-muted-foreground/40")} />
                            </div>
                            {msg.text && <p className="text-xs mt-1.5 leading-relaxed">{msg.text}</p>}
                            <div className="flex items-center justify-end gap-0.5 mt-1">
                              <span className={cn("text-[10px] whitespace-nowrap", msg.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{msg.time}</span>
                              {msg.mine && (msg.read ? <CheckCheck className="h-3 w-3 shrink-0 text-primary-foreground/70" /> : <Check className="h-3 w-3 shrink-0 text-primary-foreground/50" />)}
                            </div>
                          </>
                        ) : msg.type === "video" ? (
                          <>
                            <div className="rounded-xl overflow-hidden bg-muted/30 w-48 h-32 flex items-center justify-center -mx-2 relative">
                              <Film className={cn("h-10 w-10", msg.mine ? "text-primary-foreground/40" : "text-muted-foreground/40")} />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-10 w-10 rounded-full bg-black/40 flex items-center justify-center">
                                  <div className="w-0 h-0 border-t-[7px] border-t-transparent border-l-[13px] border-l-white border-b-[7px] border-b-transparent ml-1" />
                                </div>
                              </div>
                            </div>
                            {msg.text && <p className="text-xs mt-1.5 leading-relaxed">{msg.text}</p>}
                            <div className="flex items-center justify-end gap-0.5 mt-1">
                              <span className={cn("text-[10px] whitespace-nowrap", msg.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{msg.time}</span>
                              {msg.mine && (msg.read ? <CheckCheck className="h-3 w-3 shrink-0 text-primary-foreground/70" /> : <Check className="h-3 w-3 shrink-0 text-primary-foreground/50" />)}
                            </div>
                          </>
                        ) : msg.type === "voice" ? (
                          /* ── Layout WhatsApp ──
                             [avatar shrink-0] [colonne flex-1 min-w-0 :
                               ligne 1 → [play shrink-0] [waveform flex-1 overflow-hidden]
                               ligne 2 → justify-between : durée (gauche) | heure+coches shrink-0 (droite)
                             ]
                             min-w-[200px] sur la bulle garantit que la ligne 2 a toujours assez de place.
                          */
                          <div className="flex items-center gap-2.5 py-0.5">
                            {/* Avatar */}
                            <div className={cn(
                              "h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold",
                              msg.mine ? "bg-white/25 text-white" : "bg-primary/15 text-primary",
                            )}>
                              {msg.mine ? "M" : msg.from.slice(0, 1).toUpperCase()}
                            </div>
                            {/* Colonne principale — prend tout l'espace restant */}
                            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                              {/* Ligne 1 : play + forme d'onde */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => playVoice(msg)}
                                  className={cn(
                                    "h-7 w-7 rounded-full shrink-0 flex items-center justify-center",
                                    msg.mine ? "bg-white/25 hover:bg-white/35" : "bg-primary/15 hover:bg-primary/25",
                                  )}
                                >
                                  {playingId === msg.id
                                    ? <Square className={cn("h-3 w-3", msg.mine ? "text-white" : "text-primary")} fill="currentColor" />
                                    : <Play   className={cn("h-3 w-3 ml-0.5", msg.mine ? "text-white" : "text-primary")} fill="currentColor" />
                                  }
                                </button>
                                <div className="flex-1 flex items-center gap-px h-6 overflow-hidden">
                                  <div className={cn("h-2.5 w-2.5 rounded-full shrink-0 mr-0.5", msg.mine ? "bg-white/80" : "bg-primary/70")} />
                                  {Array.from({ length: 26 }).map((_, i) => (
                                    <div key={i}
                                      className={cn("w-[2px] rounded-full shrink-0", msg.mine ? "bg-white/65" : "bg-muted-foreground/55")}
                                      style={{ height: `${28 + Math.sin(i * 0.9) * 18 + Math.cos(i * 1.5) * 12}%` }}
                                    />
                                  ))}
                                </div>
                              </div>
                              {/* Ligne 2 : durée gauche / heure+coches droite */}
                              <div className="flex items-center justify-between gap-2">
                                <span className={cn("text-[10px]", msg.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                  {msg.voiceDuration || "0:00"}
                                </span>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <span className={cn("text-[10px] whitespace-nowrap", msg.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                    {msg.time}
                                  </span>
                                  {msg.mine && (msg.read
                                    ? <CheckCheck className="h-3 w-3 shrink-0 text-primary-foreground/70" />
                                    : <Check      className="h-3 w-3 shrink-0 text-primary-foreground/50" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : msg.type === "file" ? (
                          <>
                            <div className="flex items-center gap-3 min-w-[200px] max-w-[240px]">
                              <div className={cn(
                                "h-12 w-10 rounded-xl flex items-center justify-center shrink-0",
                                msg.mine ? "bg-white/20" : "bg-red-100 dark:bg-red-900/30",
                              )}>
                                <FileText className={cn("h-6 w-6", msg.mine ? "text-white/80" : "text-red-500")} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{msg.fileName || t("msg.fileDefault")}</p>
                                <p className={cn("text-xs", msg.mine ? "text-primary-foreground/60" : "text-muted-foreground")}>{msg.fileSize || ""}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-0.5 mt-1">
                              <span className={cn("text-[10px] whitespace-nowrap", msg.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{msg.time}</span>
                              {msg.mine && (msg.read ? <CheckCheck className="h-3 w-3 shrink-0 text-primary-foreground/70" /> : <Check className="h-3 w-3 shrink-0 text-primary-foreground/50" />)}
                            </div>
                          </>
                        ) : (
                          /* ── Texte : technique du spacer fantôme (style WhatsApp)
                             Le span invisible en fin de texte réserve la place pour l'heure.
                             Le div absolu overlay exactement cette zone. ── */
                          <>
                            {msg.priority && (
                              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium mr-1 inline-block mb-1", priorityStyles[msg.priority])}>
                                {msg.priority}
                              </span>
                            )}
                            <div className="relative">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {msg.text}
                                {/* Spacer fantôme — réserve la place pour "Modifié  heure  coches" */}
                                <span aria-hidden="true" className="invisible inline-flex items-center gap-1 ml-2 text-[10px] whitespace-nowrap align-bottom select-none pointer-events-none">
                                  {msg.edited ? `${t("msg.edited")}\u00a0` : ""}{msg.time}{msg.mine ? "\u00a0✓✓" : ""}
                                </span>
                              </p>
                              {/* Métadonnées réelles — superposées au spacer, style WhatsApp */}
                              <div className="absolute bottom-0 right-0 flex items-center gap-1 pointer-events-none select-none">
                                {msg.edited && (
                                  <span className={cn("text-[10px] italic", msg.mine ? "text-primary-foreground/60" : "text-muted-foreground/70")}>
                                    {t("msg.edited")}
                                  </span>
                                )}
                                <span className={cn("text-[10px] whitespace-nowrap", msg.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                  {msg.time}
                                </span>
                                {msg.mine && (msg.read
                                  ? <CheckCheck className="h-3 w-3 shrink-0 text-primary-foreground/70" />
                                  : <Check className="h-3 w-3 shrink-0 text-primary-foreground/50" />
                                )}
                              </div>
                            </div>
                          </>
                        )}

                        {msg.dossier && (
                          <Badge variant="outline" className={cn(
                            "mt-1.5 text-[10px] border",
                            msg.mine ? "border-primary-foreground/30 text-primary-foreground/80 bg-primary-foreground/10" : "text-primary border-primary/30 bg-primary/5",
                          )}>
                            {msg.dossier}
                          </Badge>
                        )}
                        </>)}
                      </div>

                      {/* ▾ Chevron + menu — HORS de la bulle, absolu sur le wrapper */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              "absolute top-1.5 right-1.5 opacity-0 group-hover/msg:opacity-100 focus:opacity-100 transition-opacity",
                              "h-5 w-5 rounded-full flex items-center justify-center z-10",
                              msg.mine ? "bg-white/20 hover:bg-white/35 text-white" : "bg-black/10 hover:bg-black/20 text-muted-foreground",
                            )}
                            onClick={e => e.stopPropagation()}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={msg.mine ? "end" : "start"} className="w-56 rounded-2xl p-1">
                          <DropdownMenuItem onClick={() => setReplyTo(msg)}>
                            <Reply className="mr-2.5 h-4 w-4" /> {t("msg.reply")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setReactionPickerId(msg.id)}>
                            <Smile className="mr-2.5 h-4 w-4" /> {t("msg.react")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { toggleImportant(msg.id); toast.success(importantIds.has(msg.id) ? t("msg.toastMsgUnimportant") : t("msg.toastMsgImportant")); }}>
                            <Flag className="mr-2.5 h-4 w-4" />
                            {importantIds.has(msg.id) ? t("msg.removeImportant") : t("msg.markImportant")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { togglePin(msg.id); toast.success(pinnedIds.has(msg.id) ? t("msg.toastMsgUnpinned") : t("msg.toastMsgPinned")); }}>
                            <Pin className="mr-2.5 h-4 w-4" />
                            {pinnedIds.has(msg.id) ? t("msg.unpin") : t("msg.pin")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setForwardMsg(msg)}>
                            <Forward className="mr-2.5 h-4 w-4" /> {t("msg.forward")}
                          </DropdownMenuItem>
                          {msg.mine && !msg.deleted && (!msg.type || msg.type === "text") && (
                            <DropdownMenuItem onClick={() => startEdit(msg)}>
                              <Pencil className="mr-2.5 h-4 w-4" /> {t("msg.edit")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => { navigator.clipboard?.writeText(msg.text).catch(() => null); toast.success(t("msg.toastMsgCopied")); }}>
                            <Copy className="mr-2.5 h-4 w-4" /> {t("msg.copy")}
                          </DropdownMenuItem>
                          {(msg.type === "image" || msg.type === "video" || msg.type === "voice" || msg.type === "file") && (
                            <>
                              <DropdownMenuSeparator />
                              {(msg.type === "image" || msg.type === "video") && (
                                <DropdownMenuItem onClick={() => toast.info(t("msg.toastMediaView"))}>
                                  <Eye className="mr-2.5 h-4 w-4" /> {t("msg.view")}
                                </DropdownMenuItem>
                              )}
                              {msg.type === "file" && msg.audioUrl && (
                                <DropdownMenuItem onClick={() => window.open(msg.audioUrl, "_blank")}>
                                  <Eye className="mr-2.5 h-4 w-4" /> {t("msg.open")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => {
                                if (msg.audioUrl) {
                                  const a = document.createElement("a");
                                  a.href = msg.audioUrl;
                                  a.download = msg.fileName || "fichier";
                                  a.click();
                                } else { toast.info(t("msg.toastSavingFile")); }
                              }}>
                                <Download className="mr-2.5 h-4 w-4" /> {t("msg.saveToDownloads")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(t("msg.toastChooseLocation"))}>
                                <Download className="mr-2.5 h-4 w-4" /> {t("msg.saveAs")}
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast.warning(t("msg.toastMsgReported"))}>
                            <AlertTriangle className="mr-2.5 h-4 w-4" /> {t("msg.report")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteMsgId(msg.id)}
                          >
                            <Trash2 className="mr-2.5 h-4 w-4" /> {t("msg.delete")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setSelectionMode(true); toggleSelectMsg(msg.id); }}>
                            <CheckSquare className="mr-2.5 h-4 w-4" /> {t("msg.selectMessages")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Bouton smiley réaction — EN SECOND dans le DOM
                        flex-row-reverse → affiché à GAUCHE de la bulle (messages envoyés)
                        flex-row         → affiché à DROITE de la bulle (messages reçus) */}
                    <div className="relative self-center shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setReactionPickerId(prev => prev === msg.id ? null : msg.id); }}
                        className={cn(
                          "transition-opacity h-7 w-7 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:bg-muted relative z-50",
                          reactionPickerId === msg.id ? "opacity-100" : "opacity-0 group-hover/msg:opacity-100",
                        )}
                      >
                        <Smile className="h-4 w-4" />
                      </button>
                      {/* Picker d'emojis flottant */}
                      {reactionPickerId === msg.id && (
                        <div
                          className={cn(
                            "absolute bottom-full mb-1.5 z-50",
                            "flex items-center gap-0.5 rounded-full bg-card border border-border shadow-lg px-2 py-1.5",
                            msg.mine ? "left-0" : "right-0",
                          )}
                          onClick={e => e.stopPropagation()}
                        >
                          {QUICK_REACTIONS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className="text-lg leading-none hover:scale-125 transition-transform w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Réactions affichées sous la bulle */}
                  {(reactions[msg.id] ?? []).length > 0 && (
                    <div className={cn(
                      "flex gap-1 mt-0.5 flex-wrap",
                      msg.mine ? "justify-end" : "justify-start",
                    )}>
                      {Array.from(
                        (reactions[msg.id] ?? []).reduce((acc, e) => {
                          acc.set(e, (acc.get(e) ?? 0) + 1);
                          return acc;
                        }, new Map<string, number>()),
                      ).map(([emoji, count]) => {
                        const isMine = (myReactions[msg.id] ?? []).includes(emoji);
                        return (
                          <div key={emoji} className="relative group/reaction">
                            <button
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className={cn(
                                "flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors shadow-sm",
                                isMine
                                  ? "border-primary/40 bg-primary/8 hover:bg-destructive/10 hover:border-destructive/40"
                                  : "border-border bg-card hover:bg-muted",
                              )}
                            >
                              <span>{emoji}</span>
                              <span className="text-muted-foreground text-[10px]">{count}</span>
                            </button>
                            {isMine && (
                              <div className="absolute bottom-full right-0 mb-1 z-[100] pointer-events-none hidden group-hover/reaction:block">
                                <div className="bg-foreground/90 text-background text-[10px] px-2 py-0.5 rounded whitespace-nowrap shadow-sm">
                                  {t("msg.clickToRemoveReaction")}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Zone de saisie */}
          <div className="border-t border-border bg-card px-4 py-3 shrink-0 space-y-2">
            {/* Bandeau édition */}
            {editingMsgId && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 px-3 py-2">
                <Pencil className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-600 mb-0.5">{t("msg.editMessage")}</p>
                  <input
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                      if (e.key === "Escape") { setEditingMsgId(null); setEditText(""); }
                    }}
                    autoFocus
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  onClick={saveEdit}
                  disabled={!editText.trim()}
                  className="h-7 w-7 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center text-white shrink-0 disabled:opacity-40 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { setEditingMsgId(null); setEditText(""); }} className="shrink-0 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {/* Bandeau réponse */}
            {replyTo && (
              <div className="flex items-start gap-2 rounded-xl bg-muted/60 border-l-4 border-primary px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary mb-0.5">{replyTo.mine ? t("msg.you") : replyTo.from}</p>
                  <p className="text-xs text-muted-foreground truncate">{replyTo.text.slice(0, 80)}{replyTo.text.length > 80 ? "…" : ""}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {/* Pièces jointes en attente */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attachedFiles.map((f, i) => (
                  <span key={i} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                    {f.mime.startsWith("image/") ? <ImageIcon className="h-3 w-3 text-muted-foreground" /> : f.mime.startsWith("video/") ? <Film className="h-3 w-3 text-muted-foreground" /> : <Paperclip className="h-3 w-3 text-muted-foreground" />}
                    {f.name}
                    <span className="text-muted-foreground">({f.size})</span>
                    <button onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 text-muted-foreground hover:text-destructive">
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

            {/* Barre d'enregistrement vocal */}
            {isRecording && (
              <div className="flex items-center gap-3 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400 flex-1 tabular-nums">
                  {fmtSecs(recordingSecs)}
                </span>
                <button onClick={cancelRecording} className="text-xs text-muted-foreground hover:text-foreground">
                  {t("msg.recordingCancel")}
                </button>
                <button
                  onClick={stopAndSendVoice}
                  className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shrink-0"
                >
                  <Square className="h-3.5 w-3.5" fill="currentColor" />
                </button>
              </div>
            )}

            <div className={cn("flex items-center gap-2", isRecording && "hidden")}>
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
              {message.trim() || attachedFiles.length ? (
                <button
                  onClick={envoyer}
                  className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Confirmation suppression message ────────────────────── */}
      <AlertDialog open={!!deleteMsgId} onOpenChange={open => !open && setDeleteMsgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("msg.deleteMsgTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("msg.deleteMsgDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("msg.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setMessages(prev => ({
                  ...prev,
                  [selectedConv.id]: (prev[selectedConv.id] || []).map(m =>
                    m.id === deleteMsgId ? { ...m, deleted: true } : m
                  ),
                }));
                toast.success(t("msg.toastMsgDeleted"));
                setDeleteMsgId(null);
              }}
            >
              {t("msg.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Confirmation suppression conversation ────────────────── */}
      <AlertDialog open={!!deleteConvId} onOpenChange={open => !open && setDeleteConvId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("msg.deleteConvTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("msg.deleteConvDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("msg.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { handleDeleteConversation(deleteConvId!); setDeleteConvId(null); }}
            >
              {t("msg.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Modal nouvelle conversation ──────────────────────────── */}
      <Dialog open={showNewConvModal} onOpenChange={setShowNewConvModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("msg.newConversation")}</DialogTitle>
            <DialogDescription>{t("msg.newConvDesc")}</DialogDescription>
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

      {/* ─── Modal transfert de message ──────────────────────────── */}
      <Dialog open={!!forwardMsg} onOpenChange={open => !open && setForwardMsg(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Forward className="h-4 w-4 text-primary" />
              {t("msg.forwardTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("msg.forwardDesc")}
            </DialogDescription>
          </DialogHeader>
          {forwardMsg && (
            <div className="rounded-xl bg-muted/60 border-l-4 border-primary px-3 py-2 mb-2">
              <p className="text-xs font-semibold text-primary mb-0.5">{forwardMsg.mine ? t("msg.you") : forwardMsg.from}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{forwardMsg.text}</p>
            </div>
          )}
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {conversations
              .filter(c => c.id !== selectedConv.id)
              .map(conv => (
                <button
                  key={conv.id}
                  className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-muted transition-colors text-left"
                  onClick={() => forwardToConv(conv.id)}
                >
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    conv.isGroup ? "bg-primary/20 text-primary" : "bg-primary/15 text-primary",
                  )}>
                    {conv.isGroup ? <Users className="h-4 w-4" /> : conv.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{conv.nom}</p>
                    {conv.lastMsg && <p className="text-xs text-muted-foreground truncate">{conv.lastMsg}</p>}
                  </div>
                </button>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForwardMsg(null)}>{t("msg.cancel")}</Button>
          </DialogFooter>
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
