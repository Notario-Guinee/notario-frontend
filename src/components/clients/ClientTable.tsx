// ═══════════════════════════════════════════════════════════════
// ClientTable — Tableau de la liste des clients
// Props : données + callbacks fournis par Clients.tsx
// ═══════════════════════════════════════════════════════════════

import { Building2, Phone, Edit, Trash2, MoreHorizontal, Eye, FileText, Archive, FolderPlus, Receipt, Link, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { mockClients } from "@/data/mockData";

export type ClientType = (typeof mockClients)[0] & { adresse?: string; description?: string };

const PAGE_SIZE = 20;

interface ClientTableProps {
  visibleClients: ClientType[];
  filtered: ClientType[];
  visibleCount: number;
  hasMore: boolean;
  fr: boolean;
  search: string;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  onView: (client: ClientType) => void;
  onEdit: (client: ClientType) => void;
  onDelete: (client: ClientType) => void;
  onOpenCreateDossier: (client: ClientType) => void;
  onOpenCreateFacture: (client: ClientType) => void;
  onOpenInvite: (client: ClientType) => void;
}

export function ClientTable({
  visibleClients,
  filtered,
  visibleCount,
  hasMore,
  fr,
  search,
  setVisibleCount,
  onView,
  onEdit,
  onDelete,
  onOpenCreateDossier,
  onOpenCreateFacture,
  onOpenInvite,
}: ClientTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Photo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Nom & Prénom" : "Name"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Profession</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">{fr ? "Téléphone" : "Phone"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fr ? "Statut" : "Status"}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleClients.map((client, i) => (
              <motion.tr key={client.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-4">
                  <span className="text-sm font-mono font-medium text-primary">{client.code}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    {client.type === "Morale" ? (
                      <Building2 className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="font-heading text-xs font-bold text-primary">
                        {client.nom.charAt(0)}{client.prenom.charAt(0)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{client.nom} {client.prenom}</p>
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                  </div>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="text-sm text-foreground">{client.profession}</span>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {client.telephone}
                  </div>
                </td>
                <td className="px-4 py-4"><StatusBadge status={client.statut} /></td>
                <td className="px-4 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(client)}>
                        <Eye className="mr-2 h-4 w-4" /> {fr ? "Voir détails" : "View details"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(client)}>
                        <Edit className="mr-2 h-4 w-4" /> {fr ? "Modifier" : "Edit"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onOpenCreateDossier(client)}>
                        <FolderPlus className="mr-2 h-4 w-4" /> {fr ? "Créer un dossier" : "Create case"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOpenCreateFacture(client)}>
                        <Receipt className="mr-2 h-4 w-4" /> {fr ? "Générer facture" : "Generate invoice"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info(fr ? "Client archivé" : "Client archived")}>
                        <Archive className="mr-2 h-4 w-4" /> {fr ? "Archiver" : "Archive"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOpenInvite(client)}>
                        <Link className="mr-2 h-4 w-4" /> {fr ? "Inviter (espace client)" : "Invite (client portal)"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(client)}>
                        <Trash2 className="mr-2 h-4 w-4" /> {fr ? "Supprimer" : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <EmptyState
            icon={Users}
            title={fr ? "Aucun client trouvé" : "No client found"}
            description={search ? (fr ? "Aucun client ne correspond à votre recherche." : "No client matches your search.") : (fr ? "Ajoutez votre premier client." : "Add your first client.")}
          />
        )}
      </div>
      {/* Chargement progressif */}
      {hasMore && (
        <div className="flex justify-center py-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
            {fr ? `Charger plus (${filtered.length - visibleCount} restants)` : `Load more (${filtered.length - visibleCount} remaining)`}
          </Button>
        </div>
      )}
      {!hasMore && filtered.length > 0 && (
        <div aria-live="polite" className="text-center py-3 text-xs text-muted-foreground border-t border-border">
          {filtered.length} client{filtered.length > 1 ? "s" : ""} {fr ? "affiché" : "displayed"}{filtered.length > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
