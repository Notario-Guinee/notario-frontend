// ═══════════════════════════════════════════════════════════════
// ArchiveTable — Vue par dossier et vue globale (tableau) des archives
// Props : données + callbacks fournis par ArchivesNumeriques.tsx
// ═══════════════════════════════════════════════════════════════

import {
  FolderOpen, ChevronDown, ChevronRight, Plus, ZoomIn,
  Eye, Pencil, RefreshCw, MoveRight, Download, Trash2,
  FolderEdit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { mockDossiers } from "@/data/mockData";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type ArchiveDoc = {
  id: string;
  nom: string;
  type: string;
  dossier: string;
  client: string;
  taille: string;
  statut: string;
  date: string;
  miniature: string;
};

interface ArchiveTableProps {
  viewMode: "all" | "dossier";
  filtered: ArchiveDoc[];
  dossierGroups: Record<string, ArchiveDoc[]>;
  expandedDossiers: Set<string>;
  fr: boolean;
  toggleDossier: (code: string) => void;
  onPreview: (doc: ArchiveDoc) => void;
  onEdit: (doc: ArchiveDoc) => void;
  onReplace: (doc: ArchiveDoc) => void;
  onMove: (doc: ArchiveDoc) => void;
  onDelete: (doc: ArchiveDoc) => void;
  onImportInDossier: (code: string) => void;
  onEditDossier: (code: string, label: string) => void;
  onDeleteDossier: (code: string) => void;
}

function DocActions({
  doc,
  fr,
  onPreview,
  onEdit,
  onReplace,
  onMove,
  onDelete,
}: {
  doc: ArchiveDoc;
  fr: boolean;
  onPreview: (doc: ArchiveDoc) => void;
  onEdit: (doc: ArchiveDoc) => void;
  onReplace: (doc: ArchiveDoc) => void;
  onMove: (doc: ArchiveDoc) => void;
  onDelete: (doc: ArchiveDoc) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
          <span className="text-lg leading-none">⋮</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onPreview(doc)} className="gap-2">
          <Eye className="h-4 w-4" /> {fr ? "Aperçu" : "Preview"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(doc)} className="gap-2">
          <Pencil className="h-4 w-4" /> {fr ? "Modifier" : "Edit"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onReplace(doc)} className="gap-2">
          <RefreshCw className="h-4 w-4" /> {fr ? "Remplacer le fichier" : "Replace file"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove(doc)} className="gap-2">
          <MoveRight className="h-4 w-4" /> {fr ? "Déplacer" : "Move"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info(fr ? "Téléchargement en cours..." : "Downloading...")} className="gap-2">
          <Download className="h-4 w-4" /> {fr ? "Télécharger" : "Download"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(doc)} className="gap-2 text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4" /> {fr ? "Supprimer" : "Delete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ArchiveTable({
  viewMode,
  filtered,
  dossierGroups,
  expandedDossiers,
  fr,
  toggleDossier,
  onPreview,
  onEdit,
  onReplace,
  onMove,
  onDelete,
  onImportInDossier,
  onEditDossier,
  onDeleteDossier,
}: ArchiveTableProps) {
  if (viewMode === "dossier") {
    return (
      <div className="space-y-3">
        {Object.entries(dossierGroups).map(([dossierCode, docs]) => {
          const isExpanded = expandedDossiers.has(dossierCode);
          const dossierInfo = mockDossiers.find(d => d.code === dossierCode);
          return (
            <div key={dossierCode} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              {/* En-tête du dossier */}
              <div className="flex items-center">
                <button onClick={() => toggleDossier(dossierCode)}
                  className="flex-1 flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <FolderOpen className="h-5 w-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-mono font-medium text-primary">{dossierCode}</span>
                    {dossierInfo && <span className="text-sm text-muted-foreground ml-2">— {dossierInfo.objet}</span>}
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{docs.length} doc(s)</Badge>
                </button>
                {/* Actions sur le dossier */}
                <div className="flex items-center gap-1 mr-3">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-primary h-8"
                    onClick={e => { e.stopPropagation(); onImportInDossier(dossierCode); }}>
                    <Plus className="h-3.5 w-3.5" /> {fr ? "Importer" : "Import"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <span className="text-lg leading-none">⋮</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onEditDossier(dossierCode, dossierInfo?.objet || "")} className="gap-2">
                        <FolderEdit className="h-4 w-4" /> {fr ? "Éditer le dossier" : "Edit folder"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDeleteDossier(dossierCode)} className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4" /> {fr ? "Supprimer le dossier" : "Delete folder"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {/* Liste des documents du dossier */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="border-t border-border">
                      {docs.map(a => (
                        <div key={a.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                          {/* Miniature cliquable pour aperçu */}
                          <button onClick={() => onPreview(a)} className="text-lg shrink-0 hover:scale-125 transition-transform relative group/thumb" title={fr ? "Aperçu" : "Preview"}>
                            {a.miniature}
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                              <ZoomIn className="h-3.5 w-3.5 text-primary" />
                            </span>
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{a.nom}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{a.client}</span><span>·</span>
                              <span>{a.taille}</span><span>·</span>
                              <span>{new Date(a.date).toLocaleDateString("fr-FR")}</span>
                            </div>
                          </div>
                          <StatusBadge status={a.statut} />
                          <DocActions
                            doc={a}
                            fr={fr}
                            onPreview={onPreview}
                            onEdit={onEdit}
                            onReplace={onReplace}
                            onMove={onMove}
                            onDelete={onDelete}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        {Object.keys(dossierGroups).length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            {fr ? "Aucun document trouvé" : "No documents found"}
          </div>
        )}
      </div>
    );
  }

  // Vue globale (tableau)
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[fr ? "Document" : "Document", fr ? "Dossier" : "Case", fr ? "Client" : "Client", fr ? "Taille" : "Size", fr ? "Statut OCR" : "OCR Status", "Date", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => onPreview(a)} className="text-xl hover:scale-125 transition-transform" title={fr ? "Aperçu" : "Preview"}>
                      {a.miniature}
                    </button>
                    <div>
                      <p className="text-sm font-medium text-foreground max-w-[200px] truncate">{a.nom}</p>
                      <p className="text-xs text-muted-foreground">{a.type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{a.dossier}</td>
                <td className="px-4 py-3 text-sm text-foreground">{a.client}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{a.taille}</td>
                <td className="px-4 py-3"><StatusBadge status={a.statut} /></td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(a.date).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3">
                  <DocActions
                    doc={a}
                    fr={fr}
                    onPreview={onPreview}
                    onEdit={onEdit}
                    onReplace={onReplace}
                    onMove={onMove}
                    onDelete={onDelete}
                  />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
