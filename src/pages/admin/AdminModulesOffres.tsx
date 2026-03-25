// ═══════════════════════════════════════════════════════════════
// Page Admin Modules & Offres — Configuration des modules SaaS
// Gestion des modules disponibles (activation, tarification) et
// des offres/plans associés aux tenants de la plateforme
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Package, Plus, Edit, Trash2, GripVertical, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

interface Module { id: string; nom: string; desc: string; icon: string; prix: number; actif: boolean; }
interface Offer { id: string; nom: string; color: string; modules: string[]; prix: string; }

const initialModules: Module[] = [
  { id: "1", nom: "Gestion Clients", desc: "Fiches clients complètes", icon: "👥", prix: 100000, actif: true },
  { id: "2", nom: "Dossiers & Actes", desc: "Suivi workflow notarial", icon: "📂", prix: 150000, actif: true },
  { id: "3", nom: "Facturation", desc: "Création et suivi factures", icon: "🧾", prix: 120000, actif: true },
  { id: "4", nom: "Paiements & Caisse", desc: "Encaissements et débours", icon: "💳", prix: 100000, actif: true },
  { id: "5", nom: "Agenda", desc: "Planification et rappels", icon: "📅", prix: 80000, actif: true },
  { id: "6", nom: "Archives OCR", desc: "Numérisation et recherche", icon: "📄", prix: 200000, actif: true },
  { id: "7", nom: "Messagerie Interne", desc: "Communication sécurisée", icon: "💬", prix: 80000, actif: true },
  { id: "8", nom: "Portail Client", desc: "Accès client sécurisé", icon: "🌐", prix: 150000, actif: true },
  { id: "9", nom: "Kanban", desc: "Gestion tâches visuelle", icon: "📋", prix: 50000, actif: true },
  { id: "10", nom: "Formation", desc: "Modules de formation", icon: "🎓", prix: 50000, actif: true },
];

const initialOffers: Offer[] = [
  { id: "1", nom: "Essentiel", color: "bg-blue-500", modules: ["1", "2", "3", "5"], prix: "500 000 GNF" },
  { id: "2", nom: "Professionnel", color: "bg-primary", modules: ["1", "2", "3", "4", "5", "7", "9"], prix: "1 200 000 GNF" },
  { id: "3", nom: "Premium", color: "bg-amber-500", modules: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], prix: "2 500 000 GNF" },
];

export default function AdminModulesOffres() {
  const { lang } = useLanguage();
  const fr = lang === "FR";
  const [modules, setModules] = useState(initialModules);
  const [offers, setOffers] = useState(initialOffers);
  const [showNewModule, setShowNewModule] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState({ nom: "", desc: "", icon: "📦", prix: "" });
  const [moveModule, setMoveModule] = useState<{ moduleId: string; fromOffer: string; toOffer: string } | null>(null);

  const handleCreateModule = () => {
    setModules(prev => [...prev, {
      id: String(Date.now()), nom: moduleForm.nom || "Nouveau module", desc: moduleForm.desc,
      icon: moduleForm.icon, prix: Number(moduleForm.prix) || 0, actif: true,
    }]);
    setShowNewModule(false);
    setModuleForm({ nom: "", desc: "", icon: "📦", prix: "" });
    toast.success(fr ? "Module créé" : "Module created");
  };

  const handleUpdateModule = () => {
    if (!editingModule) return;
    setModules(prev => prev.map(m => m.id === editingModule.id ? editingModule : m));
    setEditingModule(null);
    toast.success(fr ? "Module mis à jour" : "Module updated");
  };

  const handleDeleteModule = (id: string) => {
    setModules(prev => prev.filter(m => m.id !== id));
    setOffers(prev => prev.map(o => ({ ...o, modules: o.modules.filter(m => m !== id) })));
    toast.success(fr ? "Module supprimé" : "Module deleted");
  };

  const handleMoveModule = (moduleId: string, fromOfferId: string, toOfferId: string) => {
    setOffers(prev => prev.map(o => {
      if (o.id === toOfferId && !o.modules.includes(moduleId)) return { ...o, modules: [...o.modules, moduleId] };
      if (o.id === fromOfferId) return { ...o, modules: o.modules.filter(m => m !== moduleId) };
      return o;
    }));
    const mod = modules.find(m => m.id === moduleId);
    const toOffer = offers.find(o => o.id === toOfferId);
    toast.success(`${mod?.nom} → ${toOffer?.nom}`);
  };

  const toggleModuleInOffer = (offerId: string, moduleId: string) => {
    setOffers(prev => prev.map(o => {
      if (o.id !== offerId) return o;
      return { ...o, modules: o.modules.includes(moduleId) ? o.modules.filter(m => m !== moduleId) : [...o.modules, moduleId] };
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {fr ? "📦 Modules & Offres" : "📦 Modules & Plans"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {fr ? "Gérez les modules fonctionnels et leur attribution aux offres" : "Manage functional modules and their assignment to plans"}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNewModule(true)} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" /> {fr ? "Nouveau module" : "New module"}
        </Button>
      </div>

      {/* Offers Overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {offers.map(offer => (
          <div key={offer.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("h-3 w-3 rounded-full", offer.color)} />
              <h2 className="font-heading text-lg font-bold text-foreground">{offer.nom}</h2>
              <span className="ml-auto text-sm font-semibold text-primary">{offer.prix}</span>
            </div>
            <div className="space-y-2">
              {modules.map(mod => {
                const included = offer.modules.includes(mod.id);
                return (
                  <div key={mod.id} className={cn("flex items-center gap-2 rounded-lg p-2 transition-colors", included ? "bg-primary/5" : "bg-muted/30 opacity-50")}>
                    <span className="text-sm shrink-0">{mod.icon}</span>
                    <span className="text-xs text-foreground flex-1">{mod.nom}</span>
                    <Switch checked={included} onCheckedChange={() => toggleModuleInOffer(offer.id, mod.id)} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* All Modules Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-foreground">{fr ? "Tous les modules" : "All modules"}</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["", "Module", fr ? "Description" : "Description", fr ? "Prix mensuel" : "Monthly price", fr ? "Offres" : "Plans", fr ? "Statut" : "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod, i) => {
              const inOffers = offers.filter(o => o.modules.includes(mod.id));
              return (
                <motion.tr key={mod.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-lg">{mod.icon}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{mod.nom}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{mod.desc}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{new Intl.NumberFormat('fr-GN').format(mod.prix)} GNF</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {inOffers.map(o => <span key={o.id} className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold text-white", o.color)}>{o.nom}</span>)}
                      {inOffers.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3"><Switch checked={mod.actif} onCheckedChange={() => setModules(prev => prev.map(m => m.id === mod.id ? { ...m, actif: !m.actif } : m))} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingModule({ ...mod })}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteModule(mod.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Module Dialog */}
      <Dialog open={showNewModule} onOpenChange={setShowNewModule}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{fr ? "Nouveau module" : "New module"}</DialogTitle>
            <DialogDescription>{fr ? "Ajouter un module fonctionnel" : "Add a functional module"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-[60px,1fr] gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Icône" : "Icon"}</label><Input value={moduleForm.icon} onChange={e => setModuleForm(p => ({ ...p, icon: e.target.value }))} className="mt-1 text-center text-lg" maxLength={2} /></div>
              <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Nom" : "Name"}</label><Input value={moduleForm.nom} onChange={e => setModuleForm(p => ({ ...p, nom: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Description</label><Input value={moduleForm.desc} onChange={e => setModuleForm(p => ({ ...p, desc: e.target.value }))} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Prix mensuel (GNF)" : "Monthly price (GNF)"}</label><Input type="number" value={moduleForm.prix} onChange={e => setModuleForm(p => ({ ...p, prix: e.target.value }))} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModule(false)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleCreateModule}>{fr ? "Créer" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={!!editingModule} onOpenChange={o => !o && setEditingModule(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{fr ? "Modifier le module" : "Edit module"}</DialogTitle>
            <DialogDescription>{fr ? "Mettre à jour" : "Update"}</DialogDescription>
          </DialogHeader>
          {editingModule && (
            <div className="space-y-4">
              <div className="grid grid-cols-[60px,1fr] gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Icône" : "Icon"}</label><Input value={editingModule.icon} onChange={e => setEditingModule({ ...editingModule, icon: e.target.value })} className="mt-1 text-center text-lg" maxLength={2} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Nom" : "Name"}</label><Input value={editingModule.nom} onChange={e => setEditingModule({ ...editingModule, nom: e.target.value })} className="mt-1" /></div>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Description</label><Input value={editingModule.desc} onChange={e => setEditingModule({ ...editingModule, desc: e.target.value })} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">{fr ? "Prix (GNF)" : "Price (GNF)"}</label><Input type="number" value={editingModule.prix} onChange={e => setEditingModule({ ...editingModule, prix: Number(e.target.value) })} className="mt-1" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModule(null)}>{fr ? "Annuler" : "Cancel"}</Button>
            <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90" onClick={handleUpdateModule}>{fr ? "Enregistrer" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
