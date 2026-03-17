// ═══════════════════════════════════════════════════════════════
// DossierTable — Vue liste et vue grille des dossiers
// Props : données + callbacks fournis par Dossiers.tsx
// ═══════════════════════════════════════════════════════════════

import { MoreHorizontal, Trash2, Edit, Eye, Archive, Receipt, UserPlus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { formatGNF, type Dossier } from "@/data/mockData";
import { motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 20;

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const color = value >= 75 ? "bg-emerald-500" : value >= 50 ? "bg-primary" : value >= 30 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  );
}

interface DossierTableProps {
  visibleDossiers: Dossier[];
  filtered: Dossier[];
  visibleCount: number;
  hasMore: boolean;
  viewMode: "list" | "grid";
  fr: boolean;
  search: string;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  onView: (d: Dossier) => void;
  onEdit: (d: Dossier) => void;
  onDelete: (d: Dossier) => void;
  onArchive: (d: Dossier) => void;
  onOpenParties: (d: Dossier) => void;
  onOpenFacture: (d: Dossier) => void;
}

export function DossierTable({
  visibleDossiers,
  filtered,
  visibleCount,
  hasMore,
  viewMode,
  fr,
  search,
  setVisibleCount,
  onView,
  onEdit,
  onDelete,
  onArchive,
  onOpenParties,
  onOpenFacture,
}: DossierTableProps) {
  if (viewMode === "list") {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Client" : "Client"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Objet" : "Subject"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{fr ? "Montant" : "Amount"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Statut" : "Status"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleDossiers.map((d) => (
                <tr key={d.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-sm font-mono font-medium text-primary cursor-pointer hover:underline" onClick={() => onView(d)}>
                      {d.code}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.clients.join(", ")}</p>
                      <p className="text-xs text-muted-foreground">{d.typeActe}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm text-foreground">{d.objet}</p>
                      <p className="text-xs text-muted-foreground">{d.nbActes} {fr ? "actes" : "deeds"}, {d.nbPieces} {fr ? "pièces" : "documents"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-foreground hidden md:table-cell font-mono">{formatGNF(d.montant)}</td>
                  <td className="px-4 py-4"><StatusBadge status={d.statut} /></td>
                  <td className="px-4 py-4 hidden lg:table-cell text-sm text-muted-foreground">{d.clientDate}</td>
                  <td className="px-4 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(d)}><Eye className="mr-2 h-4 w-4" /> {fr ? "Voir détails" : "View details"}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(d)}><Edit className="mr-2 h-4 w-4" /> {fr ? "Modifier" : "Edit"}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onOpenParties(d)}><UserPlus className="mr-2 h-4 w-4" /> {fr ? "Associer parties" : "Link stakeholders"}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onOpenFacture(d)}><Receipt className="mr-2 h-4 w-4" /> {fr ? "Générer facture" : "Generate invoice"}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onArchive(d)}><Archive className="mr-2 h-4 w-4" /> {fr ? "Archiver" : "Archive"}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(d)}><Trash2 className="mr-2 h-4 w-4" /> {fr ? "Supprimer" : "Delete"}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState
              icon={FolderOpen}
              title={fr ? "Aucun dossier trouvé" : "No cases found"}
              description={search ? (fr ? "Aucun dossier ne correspond à votre recherche." : "No case matches your search.") : (fr ? "Commencez par créer votre premier dossier." : "Start by creating your first case.")}
            />
          )}
        </div>
        {hasMore && (
          <div className="flex justify-center py-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
              {fr ? `Charger plus (${filtered.length - visibleCount} restants)` : `Load more (${filtered.length - visibleCount} remaining)`}
            </Button>
          </div>
        )}
        {!hasMore && filtered.length > 0 && (
          <div className="text-center py-3 text-xs text-muted-foreground border-t border-border">
            {filtered.length} {fr ? `dossier${filtered.length > 1 ? "s" : ""} affiché${filtered.length > 1 ? "s" : ""}` : `case${filtered.length > 1 ? "s" : ""} displayed`}
          </div>
        )}
      </div>
    );
  }

  // Grid View
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleDossiers.map((d, i) => (
        <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onView(d)}>
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-mono font-medium text-primary">{d.code}</span>
            <StatusBadge status={d.statut} />
          </div>
          <h3 className="font-heading font-semibold text-foreground mb-1">{d.objet}</h3>
          <p className="text-xs text-muted-foreground mb-1">{d.typeActe}</p>
          <p className="text-sm text-muted-foreground mb-3">{d.clients.join(", ")}</p>
          <ProgressBar value={d.avancement} className="mb-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{d.nbActes} {fr ? "actes" : "deeds"} · {d.nbPieces} {fr ? "pièces" : "docs"}</span>
            <span className="font-mono font-medium text-foreground">{formatGNF(d.montant)}</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <StatusBadge status={d.priorite} showIcon />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(d); }}>{fr ? "Modifier" : "Edit"}</DropdownMenuItem>
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onOpenParties(d); }}>{fr ? "Associer parties" : "Link stakeholders"}</DropdownMenuItem>
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onOpenFacture(d); }}>{fr ? "Générer facture" : "Generate invoice"}</DropdownMenuItem>
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onArchive(d); }}>{fr ? "Archiver" : "Archive"}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); onDelete(d); }}>{fr ? "Supprimer" : "Delete"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      ))}
      {hasMore && (
        <div className="col-span-full flex justify-center py-4">
          <Button variant="outline" size="sm" onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
            {fr ? `Charger plus (${filtered.length - visibleCount} restants)` : `Load more (${filtered.length - visibleCount} remaining)`}
          </Button>
        </div>
      )}
    </div>
  );
}
