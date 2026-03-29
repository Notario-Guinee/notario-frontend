// ═══════════════════════════════════════════════════════════════
// Page Éditeur de Document — Interface plein écran collaborative
// Éditeur contentEditable natif avec toolbar complète Google Docs,
// panel droit (collaborateurs, commentaires, activité, versions)
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Share2,
  PanelRight,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link2,
  ImageIcon,
  MessageSquare,
  UserPlus,
  CheckCheck,
  ChevronDown,
  LoaderCircle,
  CircleCheck,
  CircleAlert,
  Highlighter,
  IndentIncrease,
  IndentDecrease,
  FileText,
  FileDown,
  Code,
  ExternalLink,
  Eraser,
  Minus,
  Table,
  Search,
  Printer,
  Superscript,
  Subscript,
  Type,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { mockDocuments } from "@/data/documentsData";
import VersionPanel from "@/components/documents/VersionPanel";
import type {
  NotarioDocument,
  DocumentStatus,
  DocumentComment,
  DocumentCollaborator,
  DocumentVersion,
} from "@/types/documents";

// ─── Utilitaires ──────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffH / 24);
  if (diffH < 1) return "il y a moins d'1h";
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD === 1) return "hier";
  return `il y a ${diffD}j`;
}

function statusLabel(status: DocumentStatus): string {
  const map: Record<DocumentStatus, string> = {
    brouillon: "Brouillon",
    en_revision: "En révision",
    valide: "Validé",
    archive: "Archivé",
  };
  return map[status];
}

function statusClasses(status: DocumentStatus): string {
  const map: Record<DocumentStatus, string> = {
    brouillon:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    en_revision:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    valide:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    archive:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return map[status];
}

// ─── Palette de couleurs ──────────────────────────────────────

const PRESET_COLORS = [
  // Ligne 1 : nuances de noir/gris/blanc
  '#000000','#434343','#666666','#999999','#b7b7b7','#cccccc','#d9d9d9','#efefef','#f3f3f3','#ffffff',
  // Ligne 2 : rouges
  '#ff0000','#ff4444','#ff6d00','#ffab00','#ffd600','#76ff03','#00e676','#00b0ff','#3d5afe','#aa00ff',
  // Ligne 3 : roses/magentas
  '#f06292','#e57373','#ffb74d','#ffd54f','#fff176','#aed581','#4db6ac','#4fc3f7','#9575cd','#ce93d8',
  // Ligne 4
  '#c62828','#ad1457','#6a1b9a','#4527a0','#283593','#1565c0','#00695c','#2e7d32','#f57f17','#e65100',
  // Ligne 5
  '#b71c1c','#880e4f','#4a148c','#311b92','#1a237e','#0d47a1','#004d40','#1b5e20','#f57f17','#bf360c',
];

function ColorPalette({ currentColor, onSelect, onCustom }: { currentColor: string; onSelect: (c: string) => void; onCustom: (c: string) => void }) {
  const [customColor, setCustomColor] = useState(currentColor);
  const customInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-3 space-y-3 w-[220px]">
      {/* Grille de couleurs */}
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {PRESET_COLORS.map(color => (
          <button
            key={color}
            title={color}
            onMouseDown={(e) => { e.preventDefault(); onSelect(color); }}
            className={cn(
              "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
              color === '#ffffff' ? 'border-gray-300' : 'border-transparent',
              currentColor === color && 'ring-2 ring-offset-1 ring-primary'
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      {/* Divider */}
      <div className="border-t border-border pt-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personnalisé</p>
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-full border-2 border-border shrink-0"
            style={{ backgroundColor: customColor }}
          />
          <button
            onMouseDown={(e) => { e.preventDefault(); customInputRef.current?.click(); }}
            className="flex items-center justify-center h-7 w-7 border-2 border-dashed border-border rounded-full text-muted-foreground hover:text-foreground hover:border-primary transition-colors text-lg leading-none"
            title="Choisir une couleur personnalisée"
          >+</button>
          <input
            ref={customInputRef}
            type="color"
            value={customColor}
            onChange={e => { setCustomColor(e.target.value); onCustom(e.target.value); }}
            className="w-0 h-0 opacity-0 absolute"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Bouton toolbar ───────────────────────────────────────────

function ToolbarBtn({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void;
  title?: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={cn(
        "h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
        active && "bg-muted text-foreground ring-1 ring-border"
      )}
    >
      {children}
    </button>
  );
}

// ─── Séparateur toolbar ───────────────────────────────────────

function ToolbarDivider() {
  return <div className="w-px h-5 bg-border mx-1 shrink-0" />;
}

// ─── TablePicker composant inline (grille 6×6 hover) ─────────

function TablePicker({ onSelect }: { onSelect: (rows: number, cols: number) => void }) {
  const [hovered, setHovered] = useState<{ r: number; c: number } | null>(null);
  const MAX = 6;
  return (
    <div className="p-2 space-y-1">
      <p className="text-xs text-muted-foreground mb-2">
        {hovered ? `${hovered.r} × ${hovered.c}` : "Choisir la taille du tableau"}
      </p>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${MAX}, 1fr)` }}>
        {Array.from({ length: MAX }, (_, r) =>
          Array.from({ length: MAX }, (_, c) => {
            const isActive = hovered && r < hovered.r && c < hovered.c;
            return (
              <div
                key={`${r}-${c}`}
                className={cn(
                  "h-6 w-6 border rounded-sm cursor-pointer transition-colors",
                  isActive
                    ? "bg-primary/30 border-primary"
                    : "bg-muted/50 border-border hover:bg-primary/10 hover:border-primary/50"
                )}
                onMouseEnter={() => setHovered({ r: r + 1, c: c + 1 })}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(r + 1, c + 1)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Page Éditeur ─────────────────────────────────────────────

export default function DocumentEditorPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();

  // Trouver le document
  const docData: NotarioDocument | undefined = mockDocuments.find(
    (d) => d.id === documentId
  );

  useEffect(() => {
    if (!docData) {
      navigate("/documents");
    }
  }, [docData, navigate]);

  const [doc, setDoc] = useState<NotarioDocument | null>(docData ?? null);

  // État éditeur
  const editorRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(docData?.metadata.wordCount ?? 0);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // ─── Auto-save states ──────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );
  const [lastSaveTime, setLastSaveTime] = useState<Date>(new Date());
  const [isDirty, setIsDirty] = useState(false);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [panelTab, setPanelTab] = useState<
    "collaborateurs" | "commentaires" | "activite" | "versions"
  >("collaborateurs");
  const [commentFilter, setCommentFilter] = useState<
    "tous" | "ouverts" | "resolus"
  >("tous");

  // Titre inline
  const [title, setTitle] = useState(docData?.title ?? "");

  // Statut
  const [status, setStatus] = useState<DocumentStatus>(
    docData?.status ?? "brouillon"
  );

  // Modal inviter collaborateur
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editeur");

  // Collaborateurs avec état local
  const [collaborators, setCollaborators] = useState<DocumentCollaborator[]>(
    docData?.collaborators ?? []
  );

  // Commentaires avec état local
  const [comments, setComments] = useState<DocumentComment[]>(
    docData?.comments ?? []
  );

  // ─── États toolbar avancée ──────────────────────────────────
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState("14");
  const [textColor, setTextColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#FFFF00");
  const [showShareModal, setShowShareModal] = useState(false);
  const shareUrl = window.location.href;

  // ─── États formats actifs ───────────────────────────────────
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>(
    {}
  );

  // ─── Nouveaux états ─────────────────────────────────────────
  const [newCommentText, setNewCommentText] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [showReplyFor, setShowReplyFor] = useState<string | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  // ─── Versions états ─────────────────────────────────────────
  const [panelVersions, setPanelVersions] = useState<DocumentVersion[]>(
    docData?.versions ?? []
  );
  const [currentVersionId, setCurrentVersionId] = useState(
    docData?.currentVersion.id ?? ""
  );

  // ─── Aperçu impression ───────────────────────────────────
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // ─── Règle — marges et retraits ──────────────────────────
  const [leftIndent, setLeftIndent] = useState(0);
  const [leftMargin, setLeftMargin] = useState(96);
  const [rightMargin, setRightMargin] = useState(96);
  const [isDraggingRuler, setIsDraggingRuler] = useState<'leftIndent' | 'leftMargin' | 'rightMargin' | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  // ─── Règle verticale — marges sup/inf ────────────────────
  const [topMargin, setTopMargin] = useState(96);
  const [bottomMargin, setBottomMargin] = useState(96);
  const [isDraggingVerticalRuler, setIsDraggingVerticalRuler] = useState<'topMargin' | 'bottomMargin' | null>(null);
  const [editScrollTop, setEditScrollTop] = useState(0);
  const verticalRulerRef = useRef<HTMLDivElement>(null);
  const editScrollRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // ─── Marges initiales de la règle ───────────────────────────
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.paddingLeft = leftMargin + 'px';
      editorRef.current.style.paddingRight = rightMargin + 'px';
    }
  }, []); // eslint-disable-line

  // ─── Auto-save interval ─────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        setSaveStatus("saving");
        setTimeout(() => {
          setSaveStatus("saved");
          setLastSaveTime(new Date());
          setLastSaved(new Date());
          setIsDirty(false);
          toast.info("Document sauvegardé automatiquement", { duration: 2000 });
        }, 800);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isDirty]);

  if (!doc) return null;

  const isReadOnly =
    doc.isLocked &&
    !doc.collaborators.some(
      (c) => c.role === "proprietaire" && c.isOnline
    );

  // ─── Sauvegarder / restaurer la sélection ───────────────────

  const saveEditorSelection = useCallback(() => {
    const sel = window.getSelection();
    if (
      sel &&
      sel.rangeCount > 0 &&
      editorRef.current?.contains(sel.anchorNode)
    ) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreEditorSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
    editorRef.current?.focus();
  }, []);

  // ─── Mise à jour formats actifs ─────────────────────────────

  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      subscript: document.queryCommandState("subscript"),
      superscript: document.queryCommandState("superscript"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
      justifyFull: document.queryCommandState("justifyFull"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  }, []);

  // ─── Commandes de formatage ─────────────────────────────────

  const execCmd = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      updateActiveFormats();
    },
    [updateActiveFormats]
  );

  const insertBlock = useCallback((tag: string) => {
    document.execCommand("formatBlock", false, tag);
    editorRef.current?.focus();
  }, []);

  const handleInput = useCallback(() => {
    const text = editorRef.current?.innerText ?? "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setSaveStatus("unsaved");
    setIsDirty(true);
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      setSaveStatus("saving");
      setTimeout(() => {
        setSaveStatus("saved");
        setLastSaveTime(new Date());
        setLastSaved(new Date());
        setIsDirty(false);
      }, 600);
    }, 2000);
  }, []);

  // ─── Formatage avancé ───────────────────────────────────────

  const applyFontFamily = useCallback(
    (font: string) => {
      setFontFamily(font);
      restoreEditorSelection();
      document.execCommand("fontName", false, font);
      editorRef.current?.focus();
      saveEditorSelection();
    },
    [restoreEditorSelection, saveEditorSelection]
  );

  const applyFontSize = useCallback(
    (size: string) => {
      const numSize = parseInt(size, 10);
      if (isNaN(numSize) || numSize < 6 || numSize > 200) return;
      setFontSize(size);
      restoreEditorSelection();

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);

      if (!range.collapsed) {
        // Texte sélectionné — appliquer la taille
        document.execCommand("fontSize", false, "7");
        const editor = editorRef.current;
        if (editor) {
          editor.querySelectorAll('font[size="7"]').forEach((el) => {
            const span = document.createElement("span");
            span.style.fontSize = numSize + "px";
            while (el.firstChild) span.appendChild(el.firstChild);
            el.replaceWith(span);
          });
        }
      } else {
        // Pas de sélection — insérer un span pour les prochains caractères
        const span = document.createElement("span");
        span.style.fontSize = numSize + "px";
        span.appendChild(document.createTextNode("\u200B")); // zero-width space
        range.insertNode(span);
        const newRange = document.createRange();
        newRange.setStart(span.firstChild!, 1);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      saveEditorSelection();
    },
    [restoreEditorSelection, saveEditorSelection]
  );

  const applyLineHeight = useCallback((lh: string) => {
    restoreEditorSelection();
    document.execCommand("styleWithCSS", false, "true");
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      // Trouver le block parent et appliquer le line-height
      let node: Node | null = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      let block = node as HTMLElement | null;
      while (
        block &&
        block !== editorRef.current &&
        !["P", "H1", "H2", "H3", "DIV", "LI", "BLOCKQUOTE"].includes(
          block.tagName
        )
      ) {
        block = block.parentElement;
      }
      if (block && block !== editorRef.current) {
        block.style.lineHeight = lh;
      } else if (editorRef.current) {
        editorRef.current.style.lineHeight = lh;
      }
    }
    editorRef.current?.focus();
    saveEditorSelection();
  }, [restoreEditorSelection, saveEditorSelection]);

  // ─── Insérer tableau ────────────────────────────────────────

  const insertTable = useCallback(
    (rows: number, cols: number) => {
      restoreEditorSelection();
      const colStyle =
        "border:1px solid #d1d5db;padding:6px 8px;min-width:80px;";
      let tableHtml =
        '<table style="border-collapse:collapse;width:100%;margin:8px 0;">';
      for (let r = 0; r < rows; r++) {
        tableHtml += "<tr>";
        for (let c = 0; c < cols; c++) {
          tableHtml += `<td style="${colStyle}"><br></td>`;
        }
        tableHtml += "</tr>";
      }
      tableHtml += "</table><p><br></p>";
      document.execCommand("insertHTML", false, tableHtml);
      setShowTableModal(false);
    },
    [restoreEditorSelection]
  );

  // ─── Trouver & Remplacer ────────────────────────────────────

  const handleReplaceAll = useCallback(() => {
    if (!editorRef.current || !findText) return;
    const html = editorRef.current.innerHTML;
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const newHtml = html.replace(new RegExp(escaped, "gi"), replaceText);
    editorRef.current.innerHTML = newHtml;
    toast.success("Remplacement effectué");
  }, [findText, replaceText]);

  // ─── Sauvegarde ─────────────────────────────────────────────

  const handleSave = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      setLastSaveTime(new Date());
      setLastSaved(new Date());
      setIsDirty(false);
      toast.success("Document sauvegardé");
    }, 600);
  };

  // ─── Fonctions export ───────────────────────────────────────

  const handleExportPDF = () => {
    const content = editorRef.current?.innerHTML ?? "";
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression");
      return;
    }
    printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: white; color: #111; }
    .page { width: 794px; min-height: 1122px; padding: 96px; margin: 0 auto; }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    h2 { font-size: 1.5em; margin-bottom: 0.4em; }
    h3 { font-size: 1.2em; margin-bottom: 0.3em; }
    p { margin-bottom: 0.8em; line-height: 1.6; }
    blockquote { border-left: 3px solid #ccc; padding-left: 1em; color: #555; margin: 1em 0; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #d1d5db; padding: 6px 8px; }
    @page { size: A4; margin: 0; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body><div class="page">${content}</div></body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleExportHTML = () => {
    const content = editorRef.current?.innerHTML ?? "";
    const blob = new Blob(
      [
        `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title></head><body style="font-family:Arial;max-width:794px;margin:0 auto;padding:2rem;">${content}</body></html>`,
      ],
      { type: "text/html" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    const text = editorRef.current?.innerText ?? "";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDOCX = () => {
    const content = editorRef.current?.innerHTML ?? "";
    const blob = new Blob(
      [
        `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body>${content}</body></html>`,
      ],
      { type: "application/msword" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Commentaires ────────────────────────────────────────────

  const handleResolveComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              isResolved: true,
              resolvedAt: new Date(),
              resolvedBy: doc.createdBy,
            }
          : c
      )
    );
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newComment: DocumentComment = {
      id: `cm-new-${Date.now()}`,
      documentId: doc.id,
      content: newCommentText.trim(),
      author: doc.createdBy,
      createdAt: new Date(),
      replies: [],
      isResolved: false,
    };
    setComments((prev) => [newComment, ...prev]);
    setNewCommentText("");
    toast.success("Commentaire ajouté");
  };

  const handleReplyToComment = (commentId: string) => {
    const replyContent = replyTexts[commentId]?.trim();
    if (!replyContent) return;
    const reply: DocumentComment = {
      id: `reply-${Date.now()}`,
      documentId: doc.id,
      content: replyContent,
      author: doc.createdBy,
      createdAt: new Date(),
      replies: [],
      isResolved: false,
    };
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      )
    );
    setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
    setShowReplyFor(null);
    toast.success("Réponse ajoutée");
  };

  // ─── Collaborateurs ──────────────────────────────────────────

  const handleRevokeCollaborator = (collaboratorId: string) => {
    setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
  };

  // ─── Minuterie dernière sauvegarde ─────────────────────────

  const minutesSaved = Math.floor(
    (new Date().getTime() - lastSaved.getTime()) / 60000
  );

  // ─── Rendu ─────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* ═══ Bannière verrouillage ════════════════════════════ */}
      {isReadOnly && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 shrink-0">
          <span className="font-semibold">Document verrouillé</span>
          <span>—</span>
          <span>
            Ce document est en lecture seule. Il a été verrouillé par{" "}
            {doc.lockedBy
              ? `${doc.lockedBy.prenom} ${doc.lockedBy.nom}`
              : "le propriétaire"}
            .
          </span>
        </div>
      )}

      {/* ═══ Toolbar Row 1 ════════════════════════════════════ */}
      <div className="h-12 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
        {/* Retour */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => navigate("/documents")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-border" />

        {/* Logo */}
        <div className="h-7 w-7 rounded bg-primary flex items-center justify-center text-primary-foreground font-heading font-bold text-sm shrink-0">
          N
        </div>

        {/* Titre inline */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 min-w-0 bg-transparent border-none outline-none font-heading text-base text-foreground placeholder:text-muted-foreground"
          placeholder="Titre du document"
        />

        {/* Badge statut cliquable */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "text-xs rounded px-2 py-0.5 font-medium flex items-center gap-1 cursor-pointer",
                statusClasses(status)
              )}
            >
              {statusLabel(status)}
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatus("brouillon")}>
              Brouillon
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus("en_revision")}>
              En révision
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus("valide")}>
              Validé
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatus("archive")}>
              Archivé
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        {/* Indicateur de sauvegarde */}
        {saveStatus === "saving" && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <LoaderCircle className="h-3 w-3 animate-spin" />
            Sauvegarde...
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <CircleCheck className="h-3 w-3 text-emerald-500" />
            Sauvegardé à{" "}
            {lastSaveTime.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        {saveStatus === "unsaved" && (
          <span className="text-xs text-amber-500 flex items-center gap-1">
            <CircleAlert className="h-3 w-3" />
            Modifications non sauvegardées
          </span>
        )}

        {/* Sauvegarder */}
        <Button
          size="sm"
          className="gap-2 h-8 bg-primary"
          onClick={handleSave}
        >
          <Save className="h-3.5 w-3.5" />
          Sauvegarder
        </Button>

        {/* Exporter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 h-8">
              Exporter
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" /> PDF
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleExportDOCX}>
              <FileDown className="mr-2 h-4 w-4" /> DOCX (.doc)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleExportHTML}>
              <Code className="mr-2 h-4 w-4" /> HTML
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleExportText}>
              <AlignLeft className="mr-2 h-4 w-4" /> Texte brut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Partager */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setShowShareModal(true)}
        >
          <Share2 className="h-4 w-4" />
        </Button>

        {/* Toggle panel */}
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0", isPanelOpen && "bg-muted")}
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>

      {/* ═══ Toolbar Row 2 ════════════════════════════════════ */}
      <div className="h-10 border-b border-border bg-background flex items-center px-4 gap-0.5 overflow-x-auto shrink-0">
        {/* Undo / Redo */}
        <ToolbarBtn onClick={() => execCmd("undo")} title="Annuler">
          <Undo className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => execCmd("redo")} title="Rétablir">
          <Redo className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Styles */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-7 px-2 rounded flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
              onMouseDown={(e) => e.preventDefault()}
            >
              Styles <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => insertBlock("h1")}>
              Titre 1
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => insertBlock("h2")}>
              Titre 2
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => insertBlock("h3")}>
              Titre 3
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => insertBlock("p")}>
              Corps
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => insertBlock("blockquote")}>
              Citation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarDivider />

        {/* Sélecteur de police */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onMouseDown={(e) => e.preventDefault()}
              className="h-7 px-2 rounded flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
              style={{ fontFamily }}
            >
              {fontFamily} <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-60 overflow-y-auto">
            {[
              "Arial",
              "Times New Roman",
              "Courier New",
              "Georgia",
              "Verdana",
              "Trebuchet MS",
              "Palatino",
              "Garamond",
              "Comic Sans MS",
              "Impact",
            ].map((font) => (
              <DropdownMenuItem
                key={font}
                onSelect={() => applyFontFamily(font)}
                style={{ fontFamily: font }}
              >
                {font}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sélecteur taille de police (Input +/-) */}
        <div className="flex items-center border border-border rounded h-7 mx-0.5">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              applyFontSize(String(Math.max(8, Number(fontSize) - 1)));
            }}
            className="h-7 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted text-xs rounded-l"
          >
            −
          </button>
          <input
            type="text"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            onBlur={(e) => applyFontSize(e.target.value)}
            onFocus={() => saveEditorSelection()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyFontSize(fontSize);
              }
            }}
            className="w-8 text-center text-xs bg-transparent outline-none border-0"
          />
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              applyFontSize(String(Math.min(200, Number(fontSize) + 1)));
            }}
            className="h-7 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted text-xs rounded-r"
          >
            +
          </button>
        </div>

        <ToolbarDivider />

        {/* Formatage texte */}
        <ToolbarBtn
          onClick={() => execCmd("bold")}
          title="Gras"
          active={!!activeFormats.bold}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => execCmd("italic")}
          title="Italique"
          active={!!activeFormats.italic}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => execCmd("underline")}
          title="Souligné"
          active={!!activeFormats.underline}
        >
          <Underline className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => execCmd("strikeThrough")}
          title="Barré"
          active={!!activeFormats.strikeThrough}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => execCmd("superscript")}
          title="Exposant"
          active={!!activeFormats.superscript}
        >
          <Superscript className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => execCmd("subscript")}
          title="Indice"
          active={!!activeFormats.subscript}
        >
          <Subscript className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => execCmd("removeFormat")}
          title="Effacer le formatage"
        >
          <Eraser className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Couleur de texte */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onMouseDown={e => e.preventDefault()}
              title="Couleur du texte"
              className="h-7 w-7 rounded flex flex-col items-center justify-center hover:bg-muted transition-colors"
            >
              <span className="text-[11px] font-bold text-foreground leading-none">A</span>
              <div className="h-1 w-5 rounded-sm mt-0.5" style={{ backgroundColor: textColor }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-0">
            <ColorPalette
              currentColor={textColor}
              onSelect={(c) => { setTextColor(c); restoreEditorSelection(); document.execCommand('foreColor', false, c); saveEditorSelection(); }}
              onCustom={(c) => { setTextColor(c); restoreEditorSelection(); document.execCommand('foreColor', false, c); saveEditorSelection(); }}
            />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Couleur de surlignage */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onMouseDown={e => e.preventDefault()}
              title="Couleur de surlignage"
              className="h-7 w-7 rounded flex flex-col items-center justify-center hover:bg-muted transition-colors"
            >
              <Highlighter className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="h-1 w-5 rounded-sm mt-0.5" style={{ backgroundColor: highlightColor }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-0">
            <ColorPalette
              currentColor={highlightColor}
              onSelect={(c) => { setHighlightColor(c); restoreEditorSelection(); document.execCommand('hiliteColor', false, c); saveEditorSelection(); }}
              onCustom={(c) => { setHighlightColor(c); restoreEditorSelection(); document.execCommand('hiliteColor', false, c); saveEditorSelection(); }}
            />
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarDivider />

        {/* Alignements */}
        <ToolbarBtn
          onClick={() => execCmd("justifyLeft")}
          title="Aligner à gauche"
          active={!!activeFormats.justifyLeft}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => execCmd("justifyCenter")}
          title="Centrer"
          active={!!activeFormats.justifyCenter}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => execCmd("justifyRight")}
          title="Aligner à droite"
          active={!!activeFormats.justifyRight}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => execCmd("justifyFull")}
          title="Justifier"
          active={!!activeFormats.justifyFull}
        >
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Listes */}
        <ToolbarBtn
          onClick={() => execCmd("insertUnorderedList")}
          title="Liste à puces"
          active={!!activeFormats.insertUnorderedList}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => execCmd("insertOrderedList")}
          title="Liste numérotée"
          active={!!activeFormats.insertOrderedList}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Indentation */}
        <ToolbarBtn
          onClick={() => execCmd("indent")}
          title="Augmenter le retrait"
        >
          <IndentIncrease className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => execCmd("outdent")}
          title="Diminuer le retrait"
        >
          <IndentDecrease className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Espacement lignes */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onMouseDown={(e) => e.preventDefault()}
              className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Espacement des lignes"
            >
              <Type className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["1", "1.15", "1.5", "2"].map((lh) => (
              <DropdownMenuItem key={lh} onSelect={() => applyLineHeight(lh)}>
                {lh}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Règle horizontale */}
        <ToolbarBtn
          onClick={() => execCmd("insertHorizontalRule")}
          title="Insérer une règle horizontale"
        >
          <Minus className="h-3.5 w-3.5" />
        </ToolbarBtn>

        {/* Insérer tableau */}
        <DropdownMenu open={showTableModal} onOpenChange={setShowTableModal}>
          <DropdownMenuTrigger asChild>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                saveEditorSelection();
              }}
              className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Insérer un tableau"
            >
              <Table className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-0">
            <TablePicker onSelect={insertTable} />
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarDivider />

        {/* Lien */}
        <ToolbarBtn
          onClick={() => {
            saveEditorSelection();
            const url = window.prompt("URL du lien :");
            if (url) {
              restoreEditorSelection();
              execCmd("createLink", url);
            }
          }}
          title="Insérer un lien"
        >
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarBtn>

        {/* Image */}
        <>
          <ToolbarBtn
            onClick={() => imageInputRef.current?.click()}
            title="Insérer une image"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result as string;
                restoreEditorSelection();
                editorRef.current?.focus();
                document.execCommand("insertImage", false, dataUrl);
              };
              reader.readAsDataURL(file);
              e.target.value = "";
            }}
          />
        </>

        {/* Commentaire */}
        <ToolbarBtn
          onClick={() => {
            setIsPanelOpen(true);
            setPanelTab("commentaires");
          }}
          title="Commentaires"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </ToolbarBtn>

        {/* Trouver & Remplacer */}
        <ToolbarBtn
          onClick={() => setShowFindReplace(true)}
          title="Trouver et remplacer"
        >
          <Search className="h-3.5 w-3.5" />
        </ToolbarBtn>

        {/* Imprimer */}
        <ToolbarBtn onClick={() => setShowPrintPreview(true)} title="Imprimer / Aperçu avant impression">
          <Printer className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <ToolbarDivider />
        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onMouseDown={e => e.preventDefault()}
              className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Plus d'options"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => { restoreEditorSelection(); execCmd('removeFormat'); }}>
              <Eraser className="mr-2 h-4 w-4" /> Effacer le formatage
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { restoreEditorSelection(); execCmd('insertHorizontalRule'); }}>
              <Minus className="mr-2 h-4 w-4" /> Règle horizontale
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => { restoreEditorSelection(); execCmd('subscript'); }}>
              <Subscript className="mr-2 h-4 w-4" /> Indice (X₂)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { restoreEditorSelection(); execCmd('superscript'); }}>
              <Superscript className="mr-2 h-4 w-4" /> Exposant (X²)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setShowTableModal(true)}>
              <Table className="mr-2 h-4 w-4" /> Insérer un tableau
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShowFindReplace(true)}>
              <Search className="mr-2 h-4 w-4" /> Trouver & Remplacer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setShowPrintPreview(true)}>
              <Printer className="mr-2 h-4 w-4" /> Aperçu avant impression
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ═══ Règle horizontale fonctionnelle ═══════════════════════ */}
      <div
        ref={rulerRef}
        className="h-7 bg-[#f1f3f4] border-b border-border shrink-0 overflow-hidden relative select-none cursor-default"
        onMouseMove={(e) => {
          if (!isDraggingRuler || !rulerRef.current) return;
          const rect = rulerRef.current.getBoundingClientRect();
          const rulerWidth = rect.width;
          const pageStart = (rulerWidth - 794) / 2;
          const x = e.clientX - rect.left - pageStart;
          const clampedX = Math.max(0, Math.min(794, x));
          if (isDraggingRuler === 'leftMargin') {
            const newMargin = Math.max(20, Math.min(200, clampedX));
            setLeftMargin(newMargin);
            if (editorRef.current) {
              editorRef.current.style.paddingLeft = newMargin + 'px';
            }
          } else if (isDraggingRuler === 'rightMargin') {
            const fromRight = 794 - clampedX;
            const newMargin = Math.max(20, Math.min(200, fromRight));
            setRightMargin(newMargin);
            if (editorRef.current) {
              editorRef.current.style.paddingRight = newMargin + 'px';
            }
          } else if (isDraggingRuler === 'leftIndent') {
            const newIndent = Math.max(0, clampedX - leftMargin);
            setLeftIndent(newIndent);
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
              if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
              let block = node as HTMLElement | null;
              while (block && block !== editorRef.current && !['P','H1','H2','H3','DIV','LI','BLOCKQUOTE'].includes(block.tagName)) {
                block = block.parentElement;
              }
              if (block && block !== editorRef.current) {
                block.style.paddingLeft = newIndent + 'px';
              }
            }
          }
        }}
        onMouseUp={() => setIsDraggingRuler(null)}
        onMouseLeave={() => setIsDraggingRuler(null)}
      >
        {/* Zones de fond : gris pour marges, blanc pour contenu */}
        <div className="absolute inset-0 flex items-stretch">
          <div className="flex items-stretch w-full relative">
            <div className="flex-1 bg-[#e8eaed]" style={{ maxWidth: `calc((100% - 794px)/2 + ${leftMargin}px)` }} />
            <div className="flex-1 bg-[#f8f9fa]" />
            <div className="bg-[#e8eaed]" style={{ width: `calc((100% - 794px)/2 + ${rightMargin}px)` }} />
          </div>
        </div>

        {/* Graduations */}
        <div className="absolute inset-0 flex items-end pointer-events-none"
          style={{ paddingLeft: `calc(50% - 397px + ${leftMargin}px)` }}>
          {Array.from({ length: Math.floor((794 - leftMargin - rightMargin) / 10) + 1 }, (_, i) => {
            const mm = i;
            const isCm = mm % 10 === 0;
            const isHalf = mm % 5 === 0 && !isCm;
            return (
              <div key={i} className="flex flex-col items-center shrink-0" style={{ width: '10px', minWidth: '10px' }}>
                {isCm && <span className="text-[8px] text-gray-500 leading-none mb-0.5">{mm / 10}</span>}
                <div className={cn("bg-gray-400", isCm ? "h-2.5 w-px" : isHalf ? "h-2 w-px" : "h-1.5 w-px")} />
              </div>
            );
          })}
        </div>

        {/* Marqueur retrait gauche (triangle haut ▲) */}
        <div
          className="absolute top-0 cursor-col-resize z-10"
          style={{ left: `calc(50% - 397px + ${leftMargin + leftIndent}px)` }}
          onMouseDown={(e) => { e.preventDefault(); setIsDraggingRuler('leftIndent'); }}
          title="Retrait gauche"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <polygon points="5,2 9,8 1,8" fill="#1a73e8" />
          </svg>
        </div>

        {/* Marqueur marge gauche (triangle bas ▼) */}
        <div
          className="absolute bottom-0 cursor-col-resize z-10"
          style={{ left: `calc(50% - 397px + ${leftMargin}px - 5px)` }}
          onMouseDown={(e) => { e.preventDefault(); setIsDraggingRuler('leftMargin'); }}
          title="Marge gauche"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <polygon points="5,8 9,2 1,2" fill="#1a73e8" />
          </svg>
        </div>

        {/* Marqueur marge droite (triangle bas ▼) */}
        <div
          className="absolute bottom-0 cursor-col-resize z-10"
          style={{ right: `calc(50% - 397px + ${rightMargin}px - 5px)` }}
          onMouseDown={(e) => { e.preventDefault(); setIsDraggingRuler('rightMargin'); }}
          title="Marge droite"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <polygon points="5,8 9,2 1,2" fill="#1a73e8" />
          </svg>
        </div>
      </div>

      {/* ═══ Zone centrale ════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ═══ Règle verticale fonctionnelle ═══════════════════ */}
        <div
          ref={verticalRulerRef}
          className="w-7 bg-[#f1f3f4] border-r border-border shrink-0 overflow-hidden relative select-none cursor-default"
          onMouseMove={(e) => {
            if (!isDraggingVerticalRuler || !verticalRulerRef.current) return;
            const rect = verticalRulerRef.current.getBoundingClientRect();
            const y = e.clientY - rect.top;
            // La page A4 commence à 32px (p-8) par rapport au scroll
            const pageStartInRuler = 32 - editScrollTop;
            const posInPage = y - pageStartInRuler;
            const clampedPos = Math.max(0, Math.min(1122, posInPage));
            if (isDraggingVerticalRuler === 'topMargin') {
              const newMargin = Math.max(20, Math.min(250, clampedPos));
              setTopMargin(newMargin);
              if (pageRef.current) pageRef.current.style.paddingTop = newMargin + 'px';
            } else if (isDraggingVerticalRuler === 'bottomMargin') {
              const fromBottom = 1122 - clampedPos;
              const newMargin = Math.max(20, Math.min(250, fromBottom));
              setBottomMargin(newMargin);
              if (pageRef.current) pageRef.current.style.paddingBottom = newMargin + 'px';
            }
          }}
          onMouseUp={() => setIsDraggingVerticalRuler(null)}
          onMouseLeave={() => setIsDraggingVerticalRuler(null)}
        >
          {/* Conteneur interne aligné sur la page A4 */}
          <div
            className="absolute w-full"
            style={{ top: `${32 - editScrollTop}px`, height: '1122px' }}
          >
            {/* Zone marge supérieure (gris) */}
            <div className="absolute inset-x-0 top-0 bg-[#e8eaed]" style={{ height: topMargin }} />
            {/* Zone contenu (blanc) */}
            <div className="absolute inset-x-0 bg-[#f8f9fa]" style={{ top: topMargin, bottom: bottomMargin }} />
            {/* Zone marge inférieure (gris) */}
            <div className="absolute inset-x-0 bottom-0 bg-[#e8eaed]" style={{ height: bottomMargin }} />

            {/* Graduations verticales */}
            {Array.from({ length: Math.floor(1122 / 10) + 1 }, (_, i) => {
              const isCm = i % 10 === 0;
              const isHalf = i % 5 === 0 && !isCm;
              return (
                <div
                  key={i}
                  className="absolute flex items-center pointer-events-none"
                  style={{ top: i * 10, left: 0, right: 0, height: 1 }}
                >
                  {isCm && (
                    <span className="text-[7px] text-gray-500 leading-none absolute"
                      style={{ left: 2, top: -4 }}>
                      {i / 10}
                    </span>
                  )}
                  <div
                    className="absolute right-0 bg-gray-400"
                    style={{
                      width: isCm ? 10 : isHalf ? 8 : 5,
                      height: 1
                    }}
                  />
                </div>
              );
            })}

            {/* Marqueur marge supérieure (triangle ▶) */}
            <div
              className="absolute right-0 cursor-row-resize z-10"
              style={{ top: topMargin - 5 }}
              onMouseDown={(e) => { e.preventDefault(); setIsDraggingVerticalRuler('topMargin'); }}
              title="Marge supérieure"
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <polygon points="2,5 8,1 8,9" fill="#1a73e8" />
              </svg>
            </div>

            {/* Marqueur marge inférieure (triangle ▶) */}
            <div
              className="absolute right-0 cursor-row-resize z-10"
              style={{ bottom: bottomMargin - 5 }}
              onMouseDown={(e) => { e.preventDefault(); setIsDraggingVerticalRuler('bottomMargin'); }}
              title="Marge inférieure"
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <polygon points="2,5 8,1 8,9" fill="#1a73e8" />
              </svg>
            </div>
          </div>
        </div>

        {/* Zone d'édition */}
        <div
          ref={editScrollRef}
          className="flex-1 overflow-y-auto bg-muted/30 p-8"
          onScroll={(e) => setEditScrollTop((e.target as HTMLDivElement).scrollTop)}
        >
          {/* Page A4 simulée */}
          <div className="max-w-[794px] mx-auto">
            <div
              ref={pageRef}
              className="bg-white dark:bg-gray-900 shadow-lg min-h-[1122px] px-[96px] rounded-sm relative"
              style={{ paddingTop: topMargin, paddingBottom: bottomMargin }}
            >
              {/* Curseurs collaborateurs simulés */}
              {collaborators
                .filter((c) => c.isOnline && c.role !== "proprietaire")
                .map((c, i) => (
                  <div
                    key={c.id}
                    className="absolute pointer-events-none z-10"
                    style={{
                      top: `${120 + i * 60}px`,
                      left: `${96 + i * 20}px`,
                    }}
                  >
                    <div
                      className="text-xs px-1.5 py-0.5 rounded text-white font-medium whitespace-nowrap"
                      style={{ backgroundColor: c.cursorColor }}
                    >
                      {c.user.prenom} {c.user.nom}
                    </div>
                    <div
                      className="w-0.5 h-5"
                      style={{ backgroundColor: c.cursorColor }}
                    />
                  </div>
                ))}

              {/* Éditeur contentEditable */}
              <div
                ref={editorRef}
                contentEditable={!isReadOnly}
                suppressContentEditableWarning
                onInput={handleInput}
                onMouseUp={() => {
                  saveEditorSelection();
                  updateActiveFormats();
                }}
                onKeyUp={() => {
                  saveEditorSelection();
                  updateActiveFormats();
                }}
                onSelect={() => {
                  saveEditorSelection();
                  updateActiveFormats();
                }}
                className={cn(
                  "outline-none text-sm leading-7 min-h-full text-gray-900 dark:text-gray-100",
                  isReadOnly && "cursor-not-allowed select-none"
                )}
                dangerouslySetInnerHTML={{
                  __html: doc.currentVersion.content,
                }}
              />
            </div>

            {/* Footer */}
            <div className="mt-3 text-center text-xs text-muted-foreground">
              {wordCount} mots · Dernière sauvegarde{" "}
              {minutesSaved === 0
                ? "à l'instant"
                : `il y a ${minutesSaved} min`}
            </div>
          </div>
        </div>

        {/* ═══ Panel droit ══════════════════════════════════════ */}
        {isPanelOpen && (
          <div className="w-80 border-l border-border bg-card flex flex-col shrink-0 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border shrink-0">
              {(
                [
                  "collaborateurs",
                  "commentaires",
                  "activite",
                  "versions",
                ] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPanelTab(tab)}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium capitalize transition-colors",
                    panelTab === tab
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === "activite"
                    ? "Activité"
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Contenu du panel */}
            <div className="flex-1 overflow-y-auto">
              {/* ── Tab Collaborateurs ── */}
              {panelTab === "collaborateurs" && (
                <div className="p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {collaborators.length} collaborateur
                    {collaborators.length > 1 ? "s" : ""}
                  </p>

                  {collaborators.map((collab) => (
                    <div key={collab.id} className="flex items-start gap-2.5">
                      {/* Avatar */}
                      <div
                        className="relative h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: collab.cursorColor }}
                      >
                        {collab.user.initiales}
                        {collab.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            {collab.user.prenom} {collab.user.nom}
                          </span>
                          <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 capitalize">
                            {collab.role}
                          </span>
                        </div>
                        {collab.isOnline ? (
                          <p className="text-xs text-muted-foreground italic">
                            En train de modifier...
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Vu{" "}
                            {collab.lastViewedAt
                              ? formatRelativeTime(collab.lastViewedAt)
                              : "—"}
                          </p>
                        )}
                      </div>

                      {/* Menu par collaborateur */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => {
                              setCollaborators((prev) =>
                                prev.map((c) =>
                                  c.id === collab.id
                                    ? { ...c, role: "lecteur" }
                                    : c
                                )
                              );
                            }}
                          >
                            Lecteur
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setCollaborators((prev) =>
                                prev.map((c) =>
                                  c.id === collab.id
                                    ? { ...c, role: "commentateur" }
                                    : c
                                )
                              );
                            }}
                          >
                            Commentateur
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setCollaborators((prev) =>
                                prev.map((c) =>
                                  c.id === collab.id
                                    ? { ...c, role: "editeur" }
                                    : c
                                )
                              );
                            }}
                          >
                            Éditeur
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() =>
                              handleRevokeCollaborator(collab.id)
                            }
                          >
                            Révoquer l'accès
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}

                  {/* Bouton inviter */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 mt-2"
                    onClick={() => setShowInviteModal(true)}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Inviter un collaborateur
                  </Button>
                </div>
              )}

              {/* ── Tab Commentaires ── */}
              {panelTab === "commentaires" && (
                <div className="p-4 space-y-3">
                  {/* Filtres */}
                  <div className="flex items-center gap-1">
                    {(["tous", "ouverts", "resolus"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setCommentFilter(f)}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full transition-colors capitalize",
                          commentFilter === f
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {f === "resolus"
                          ? "Résolus"
                          : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Zone de nouveau commentaire */}
                  <div className="border border-border rounded-lg p-2 space-y-2">
                    <Textarea
                      placeholder="Ajouter un commentaire..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="resize-none text-xs min-h-[60px]"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2"
                        onClick={() => setNewCommentText("")}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={handleAddComment}
                        disabled={!newCommentText.trim()}
                      >
                        Publier
                      </Button>
                    </div>
                  </div>

                  {/* Liste des commentaires */}
                  {comments
                    .filter((c) => {
                      if (commentFilter === "ouverts") return !c.isResolved;
                      if (commentFilter === "resolus") return c.isResolved;
                      return true;
                    })
                    .map((comment) => (
                      <div
                        key={comment.id}
                        className={cn(
                          "rounded-lg border p-3 space-y-2",
                          comment.isResolved
                            ? "border-border bg-muted/30 opacity-60"
                            : "border-border bg-card"
                        )}
                      >
                        {/* Auteur + date */}
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                            style={{ backgroundColor: "#3b82f6" }}
                          >
                            {comment.author.initiales}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-foreground">
                              {comment.author.prenom} {comment.author.nom}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-1">
                              · {formatRelativeTime(comment.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Texte surligné */}
                        {comment.highlightedText && (
                          <p className="bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300 text-xs rounded px-1.5 py-0.5 italic line-clamp-1">
                            "{comment.highlightedText}"
                          </p>
                        )}

                        {/* Contenu */}
                        <p className="text-xs text-foreground">
                          {comment.content}
                        </p>

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="pl-3 border-l-2 border-border space-y-1.5">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="text-xs">
                                <span className="font-medium text-foreground">
                                  {reply.author.prenom}:
                                </span>{" "}
                                <span className="text-muted-foreground">
                                  {reply.content}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Zone de réponse inline */}
                        {showReplyFor === comment.id && (
                          <div className="space-y-1.5 pl-3 border-l-2 border-primary/30">
                            <Textarea
                              placeholder="Votre réponse..."
                              value={replyTexts[comment.id] ?? ""}
                              onChange={(e) =>
                                setReplyTexts((prev) => ({
                                  ...prev,
                                  [comment.id]: e.target.value,
                                }))
                              }
                              className="resize-none text-xs min-h-[48px]"
                              rows={2}
                            />
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs px-2"
                                onClick={() => setShowReplyFor(null)}
                              >
                                Annuler
                              </Button>
                              <Button
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() =>
                                  handleReplyToComment(comment.id)
                                }
                                disabled={
                                  !(replyTexts[comment.id] ?? "").trim()
                                }
                              >
                                Répondre
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        {!comment.isResolved && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() =>
                                setShowReplyFor(
                                  showReplyFor === comment.id
                                    ? null
                                    : comment.id
                                )
                              }
                            >
                              Répondre
                            </button>
                            <span className="text-muted-foreground">·</span>
                            <button
                              className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                              onClick={() =>
                                handleResolveComment(comment.id)
                              }
                            >
                              <CheckCheck className="h-3 w-3" />
                              Résoudre
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* ── Tab Activité ── */}
              {panelTab === "activite" && (
                <div className="p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Historique des modifications
                  </p>

                  <div className="space-y-2">
                    {doc.changes.map((change) => {
                      const colorMap: Record<string, string> = {
                        insertion: "text-emerald-600 dark:text-emerald-400",
                        suppression: "text-red-600 dark:text-red-400",
                        modification: "text-primary",
                        formatage: "text-blue-600 dark:text-blue-400",
                        commentaire:
                          "text-purple-600 dark:text-purple-400",
                      };
                      const dotColorMap: Record<string, string> = {
                        insertion: "bg-emerald-500",
                        suppression: "bg-red-500",
                        modification: "bg-primary",
                        formatage: "bg-blue-500",
                        commentaire: "bg-purple-500",
                      };

                      return (
                        <div
                          key={change.id}
                          className="flex items-start gap-2.5"
                        >
                          {/* Avatar */}
                          <div
                            className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5"
                            style={{ backgroundColor: "#6b7280" }}
                          >
                            {change.user.initiales}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground leading-snug">
                              <span className="font-medium">
                                {change.user.prenom} {change.user.nom}
                              </span>{" "}
                              <span
                                className={
                                  colorMap[change.changeType] ??
                                  "text-muted-foreground"
                                }
                              >
                                {change.changeType === "insertion" &&
                                  "a inséré"}
                                {change.changeType === "suppression" &&
                                  "a supprimé"}
                                {change.changeType === "modification" &&
                                  "a modifié"}
                                {change.changeType === "formatage" &&
                                  "a formaté"}
                                {change.changeType === "commentaire" &&
                                  "a commenté"}
                              </span>{" "}
                              — {change.description}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full shrink-0",
                                  dotColorMap[change.changeType] ??
                                    "bg-gray-400"
                                )}
                              />
                              <span className="text-[10px] text-muted-foreground">
                                {formatRelativeTime(change.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Exporter CSV */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 mt-2"
                  >
                    Exporter CSV
                  </Button>
                </div>
              )}

              {/* ── Tab Versions ── */}
              {panelTab === "versions" && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {panelVersions.length} version
                      {panelVersions.length > 1 ? "s" : ""}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        navigate(`/documents/${documentId}/versions`);
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Voir tout
                    </Button>
                  </div>
                  <VersionPanel
                    versions={panelVersions}
                    currentVersionId={currentVersionId}
                    onRestore={(v) => {
                      setCurrentVersionId(v.id);
                      setDoc((prev) =>
                        prev ? { ...prev, currentVersion: v } : prev
                      );
                      toast.success(`Version ${v.versionLabel} restaurée`);
                    }}
                    onCompare={() => {}}
                    onDownload={(v) => {
                      const blob = new Blob([v.content], {
                        type: "text/html",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `v${v.versionLabel}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    showCreateButton
                    onVersionsChange={(updated) => setPanelVersions(updated)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Modal inviter collaborateur ══════════════════════ */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Inviter un collaborateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Adresse e-mail</Label>
              <Input
                type="email"
                placeholder="prenom.nom@cabinet.gn"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecteur">Lecteur</SelectItem>
                  <SelectItem value="commentateur">Commentateur</SelectItem>
                  <SelectItem value="editeur">Éditeur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteModal(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                toast.success(`Invitation envoyée à ${inviteEmail}`);
                setShowInviteModal(false);
                setInviteEmail("");
              }}
              disabled={!inviteEmail.trim()}
            >
              Envoyer l'invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Modal Partager ════════════════════════════════════ */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Partager le document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Lien du document
              </Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="text-xs font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Lien copié !");
                  }}
                >
                  Copier
                </Button>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground mb-2">
                Ouvrir dans un nouvel onglet
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => window.open(window.location.href, "_blank")}
              >
                <ExternalLink className="h-4 w-4" /> Ouvrir dans un nouvel
                onglet
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowShareModal(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Aperçu avant impression ════════════════════════════ */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-[100] bg-gray-700/90 flex flex-col">
          {/* Barre d'actions */}
          <div className="h-14 bg-gray-800 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowPrintPreview(false)} className="text-white/80 hover:text-white flex items-center gap-2 text-sm">
                <ArrowLeft className="h-4 w-4" /> Fermer l'aperçu
              </button>
            </div>
            <span className="text-white font-medium text-sm">{title} — Aperçu avant impression</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const content = editorRef.current?.innerHTML ?? '';
                  const pw = window.open('', '_blank');
                  if (!pw) return;
                  pw.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${title}</title><style>* { margin:0;padding:0;box-sizing:border-box; } body { font-family:Arial,sans-serif;background:white;color:#111; } .page { width:794px;min-height:1122px;padding:96px;margin:0 auto; } h1{font-size:2em;margin-bottom:.5em;} h2{font-size:1.5em;margin-bottom:.4em;} h3{font-size:1.2em;margin-bottom:.3em;} p{margin-bottom:.8em;line-height:1.6;} blockquote{border-left:3px solid #ccc;padding-left:1em;color:#555;margin:1em 0;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #d1d5db;padding:6px 8px;} @page{size:A4;margin:0;} @media print{body{-webkit-print-color-adjust:exact;}}</style></head><body><div class="page">${content}</div></body></html>`);
                  pw.document.close();
                  pw.focus();
                  setTimeout(() => pw.print(), 250);
                }}
                className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:bg-primary/90"
              >
                <Printer className="h-4 w-4" /> Imprimer
              </button>
            </div>
          </div>
          {/* Zone de prévisualisation */}
          <div className="flex-1 overflow-y-auto py-8 flex justify-center">
            <div className="bg-white shadow-2xl" style={{ width: '794px', minHeight: '1122px', padding: '96px', fontFamily: 'Arial, sans-serif', color: '#111', lineHeight: 1.6, fontSize: '14px' }}
              dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML ?? '' }}
            />
          </div>
        </div>
      )}

      {/* ═══ Modal Trouver & Remplacer ═════════════════════════ */}
      <Dialog open={showFindReplace} onOpenChange={setShowFindReplace}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Trouver et remplacer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Chercher</Label>
              <Input
                placeholder="Texte à rechercher..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Remplacer par</Label>
              <Input
                placeholder="Texte de remplacement..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFindReplace(false)}
            >
              Fermer
            </Button>
            <Button
              onClick={handleReplaceAll}
              disabled={!findText.trim()}
            >
              Remplacer tout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
