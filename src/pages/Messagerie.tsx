// ═══════════════════════════════════════════════════════════════
// Page Messagerie — Communication interne du cabinet
// Inclut : conversations individuelles, création de groupes,
// ajout d'employés, messages avec priorités et dossiers liés
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { Phone, Video, Paperclip, Send, Search, Plus, MessageCircle, Smile, Users, UserPlus, X } from "lucide-react";
import { currentUser } from "@/data/mockData";
import { motion } from "framer-motion";
import { searchMatch, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

// Type représentant une conversation (individuelle ou groupe)
type Conversation = {
  id: string;
  nom: string;
  avatar: string;
  presence: "online" | "busy" | "offline";
  lastMsg: string;
  time: string;
  unread: number;
  dossier: string | null;
  isGroup?: boolean;
  members?: string[];
};

// Conversations initiales
const initialConversations: Conversation[] = [
  {
    id: "1", nom: "Maître Notario, Aïssatou Conté", avatar: "👨‍💼", presence: "online",
    lastMsg: "J'ai terminé la préparation de l'acte A-8842. Il est prêt pour signature.",
    time: "11/08/2025", unread: 1, dossier: "N-2025-101",
  },
  {
    id: "2", nom: "Système", avatar: "🤖", presence: "online",
    lastMsg: "Nouveau client enregistré : Fam. Diallo - Dossier N-2025-105",
    time: "12/08/2025", unread: 1, dossier: null,
  },
  {
    id: "3", nom: "Boubacar Diallo", avatar: "👨‍💼", presence: "busy",
    lastMsg: "Facture FAC-2026-003 relancée par email.",
    time: "Hier", unread: 0, dossier: "N-2025-042",
  },
];

// Couleurs des indicateurs de présence
const presenceColor: Record<string, string> = {
  online: "bg-green-500",
  busy: "bg-amber-500",
  offline: "bg-muted-foreground",
};

// Types pour les messages et la priorité
type MessagePriority = "urgente" | "importante" | null;

interface ChatMessage {
  id: string;
  from: string;
  text: string;
  time: string;
  mine: boolean;
  dossier?: string;
  priority?: MessagePriority;
}

// Messages initiaux par conversation
const messagesData: Record<string, ChatMessage[]> = {
  "1": [
    { id: "1", from: "Maître Notario", text: "Bonjour Aïssatou, pouvez-vous vérifier le dossier N-2025-101 ? Il y a une urgence pour la signature.", time: "12/08/2025", mine: false, dossier: "N-2025-101", priority: "urgente" },
    { id: "2", from: "Aïssatou Conté", text: "Oui Maître, je vais vérifier immédiatement. Je vous tiens au courant.", time: "12/08/2025", mine: true, dossier: "N-2025-101" },
    { id: "3", from: "Maître Notario", text: "N'oubliez pas la réunion de 14h sur les nouveaux modèles de documents.", time: "12/08/2025", mine: false, priority: "importante" },
  ],
  "2": [
    { id: "1", from: "Système", text: "Nouveau client enregistré : Fam. Diallo - Dossier N-2025-105", time: "12/08/2025", mine: false, dossier: "N-2025-105" },
  ],
  "3": [
    { id: "1", from: "Boubacar", text: "Bonjour, j'ai relancé la facture FAC-2026-003 par email.", time: "Hier 14:20", mine: false },
  ],
};

// Styles pour les priorités des messages
const priorityStyles: Record<string, string> = {
  urgente: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  importante: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

// Liste des employés du cabinet pour les groupes
const cabinetEmployees = [
  { id: "e1", nom: "Maître Notario", avatar: "👨‍💼" },
  { id: "e2", nom: "Aïssatou Conté", avatar: "👩‍💼" },
  { id: "e3", nom: "Boubacar Diallo", avatar: "👨‍💼" },
  { id: "e4", nom: "Fatoumata Bah", avatar: "👩‍💼" },
  { id: "e5", nom: "Sékou Camara", avatar: "👨‍💼" },
  { id: "e6", nom: "Mariama Condé", avatar: "👩‍💼" },
];

export default function Messagerie() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConv, setSelectedConv] = useState(conversations[0]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(messagesData);
  const [searchQuery, setSearchQuery] = useState("");
  const [newConvOpen, setNewConvOpen] = useState(false);

  // ═══ Création de groupe ═══
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Envoyer un message dans la conversation sélectionnée
  const envoyer = () => {
    if (!message.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      from: currentUser.firstName,
      text: message,
      time: "À l'instant",
      mine: true,
    };
    setMessages((prev) => ({
      ...prev,
      [selectedConv.id]: [...(prev[selectedConv.id] || []), newMsg],
    }));
    setMessage("");
  };

  // Créer un nouveau groupe
  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    const newGroup: Conversation = {
      id: `group-${Date.now()}`,
      nom: groupName,
      avatar: "👥",
      presence: "online",
      lastMsg: fr ? `Groupe créé avec ${selectedMembers.length} membres` : `Group created with ${selectedMembers.length} members`,
      time: "À l'instant",
      unread: 0,
      dossier: null,
      isGroup: true,
      members: selectedMembers,
    };
    setConversations(prev => [newGroup, ...prev]);
    setMessages(prev => ({
      ...prev,
      [newGroup.id]: [{
        id: "1",
        from: "Système",
        text: fr
          ? `Groupe « ${groupName} » créé par ${currentUser.name}. Membres : ${selectedMembers.join(", ")}`
          : `Group "${groupName}" created by ${currentUser.name}. Members: ${selectedMembers.join(", ")}`,
        time: "À l'instant",
        mine: false,
      }],
    }));
    setSelectedConv(newGroup);
    setShowGroupModal(false);
    setGroupName("");
    setSelectedMembers([]);
    toast.success(fr ? `Groupe « ${groupName} » créé avec succès` : `Group "${groupName}" created successfully`);
  };

  // Basculer la sélection d'un membre
  const toggleMember = (name: string) => {
    setSelectedMembers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  // Filtrer les conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    return [c.nom, c.lastMsg, c.dossier].some(f => searchMatch(f, searchQuery));
  });

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-heading font-bold text-foreground">{fr ? "Messagerie" : "Messaging"}</h1>
            <p className="text-sm text-muted-foreground">{fr ? "Communication interne du cabinet" : "Internal office communication"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Bouton de création de groupe */}
          <Button variant="outline" className="gap-2" onClick={() => { setGroupName(""); setSelectedMembers([]); setShowGroupModal(true); }}>
            <Users className="h-4 w-4" />
            {fr ? "Créer un groupe" : "Create group"}
          </Button>
          {/* Bouton de nouvelle conversation */}
          <Dialog open={newConvOpen} onOpenChange={setNewConvOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {fr ? "Nouvelle conversation" : "New conversation"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{fr ? "Nouvelle conversation" : "New conversation"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input placeholder={fr ? "Rechercher un collaborateur..." : "Search a colleague..."} />
                <div className="space-y-2">
                  {cabinetEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      className="w-full flex items-center gap-3 rounded-lg p-3 hover:bg-muted transition-colors text-left"
                      onClick={() => {
                        // Créer une nouvelle conversation individuelle
                        const newConv: Conversation = {
                          id: `conv-${Date.now()}`,
                          nom: emp.nom,
                          avatar: emp.avatar,
                          presence: "online",
                          lastMsg: "",
                          time: "À l'instant",
                          unread: 0,
                          dossier: null,
                        };
                        setConversations(prev => [newConv, ...prev]);
                        setSelectedConv(newConv);
                        setNewConvOpen(false);
                      }}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 font-heading text-xs font-bold text-primary">
                        {emp.nom.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-foreground">{emp.nom}</span>
                    </button>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Interface de chat */}
      <div className="h-[calc(100vh-200px)] flex rounded-xl border border-border overflow-hidden shadow-card">
        {/* Panneau gauche — Liste des conversations */}
        <div className="w-80 border-r border-border bg-card flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3">{fr ? "Conversations" : "Conversations"}</h3>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={fr ? "Rechercher dans les conversations..." : "Search conversations..."}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`w-full flex items-start gap-3 p-4 border-b border-border text-left transition-colors ${
                  selectedConv.id === conv.id
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : "hover:bg-muted/30"
                }`}
              >
                <div className="relative shrink-0 mt-0.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg">
                    {conv.isGroup ? "👥" : conv.avatar}
                  </div>
                  {!conv.isGroup && (
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${presenceColor[conv.presence]}`} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{conv.nom}</p>
                      {conv.isGroup && <Users className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    {conv.unread > 0 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ml-2">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-1">{conv.time}</p>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMsg}</p>
                  {conv.dossier && (
                    <Badge variant="outline" className="mt-1.5 text-[10px] text-primary border-primary/30 bg-primary/5">
                      {conv.dossier}
                    </Badge>
                  )}
                  {conv.isGroup && conv.members && (
                    <p className="text-[10px] text-muted-foreground mt-1">{conv.members.length} {fr ? "membres" : "members"}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Panneau droit — Zone de chat */}
        <div className="flex flex-1 flex-col bg-background">
          {/* En-tête du chat */}
          <div className="flex items-center gap-3 border-b border-border bg-card p-4">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg">
                {selectedConv.isGroup ? "👥" : selectedConv.avatar}
              </div>
              {!selectedConv.isGroup && (
                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${presenceColor[selectedConv.presence]}`} />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{selectedConv.nom}</p>
                {selectedConv.isGroup && <Badge variant="outline" className="text-[10px]">{selectedConv.members?.length} {fr ? "membres" : "members"}</Badge>}
              </div>
              {selectedConv.dossier && (
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/5">
                  {selectedConv.dossier}
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Phone className="h-3.5 w-3.5" /> {fr ? "Appel" : "Call"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Video className="h-3.5 w-3.5" /> {fr ? "Visio" : "Video"}
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
            {(messages[selectedConv.id] || []).map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={cn("flex flex-col", msg.mine ? "items-end" : "items-start")}>
                <div className={cn("rounded-xl border p-4 max-w-[80%]", msg.mine ? "bg-primary/10 border-primary/20" : "border-border bg-card")}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">{msg.from}</span>
                    {msg.priority && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityStyles[msg.priority]}`}>
                        {msg.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{msg.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-muted-foreground">{msg.time}</span>
                    {msg.mine && <span className="text-[11px] text-muted-foreground">●</span>}
                  </div>
                  {msg.dossier && (
                    <Badge variant="outline" className="mt-2 text-[10px] text-primary border-primary/30 bg-primary/5">
                      {msg.dossier}
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Zone de saisie de message */}
          <div className="border-t border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <button className="rounded-lg p-2 hover:bg-muted transition-colors">
                <Smile className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="rounded-lg p-2 hover:bg-muted transition-colors">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </button>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && envoyer()}
                placeholder={fr ? "Écrire un message..." : "Type a message..."}
                className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <Button onClick={envoyer} size="icon" className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Modal de création de groupe ═══ */}
      <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {fr ? "Créer un groupe" : "Create a group"}
            </DialogTitle>
            <DialogDescription>{fr ? "Créez un groupe de discussion et ajoutez des employés du cabinet" : "Create a chat group and add office employees"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Nom du groupe */}
            <div className="space-y-2">
              <Label>{fr ? "Nom du groupe" : "Group name"} *</Label>
              <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder={fr ? "Ex: Équipe Dossiers Urgents" : "e.g. Urgent Cases Team"} />
            </div>

            {/* Sélection des membres */}
            <div className="space-y-2">
              <Label>{fr ? "Membres" : "Members"} ({selectedMembers.length} {fr ? "sélectionnés" : "selected"})</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {cabinetEmployees.map(emp => (
                  <label key={emp.id} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedMembers.includes(emp.nom)
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:bg-muted/30"
                  }`}>
                    <input type="checkbox" checked={selectedMembers.includes(emp.nom)} onChange={() => toggleMember(emp.nom)} className="rounded border-border" />
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm">
                      {emp.avatar}
                    </div>
                    <span className="text-sm font-medium text-foreground">{emp.nom}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Membres sélectionnés */}
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
            <Button variant="outline" onClick={() => setShowGroupModal(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground gap-2" onClick={handleCreateGroup} disabled={!groupName.trim() || selectedMembers.length === 0}>
              <Users className="h-4 w-4" /> {fr ? "Créer le groupe" : "Create group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
