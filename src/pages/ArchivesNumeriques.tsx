// src/pages/ArchivesNumeriques.tsx
// ═══════════════════════════════════════════════════════════════
// Page Archives Numériques — Gestion complète des documents numérisés
// Fonctionnalités :
//   - Vue par dossier / vue globale (tableau)
//   - Import de documents (glisser-déposer, sélection fichier)
//   - Import direct dans un dossier existant
//   - Édition de dossier (renommer l'objet)
//   - Suppression de dossier avec traçabilité (journal d'audit)
//   - Édition de document (renommer, changer type)
//   - Remplacement d'un fichier par un autre
//   - Aperçu de chaque fichier (prévisualisation modale)
//   - Déplacement de document entre dossiers
//   - Recherche plein-texte, statistiques en temps réel
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  Upload, Search, FileText, Image, File, FolderOpen,
  Plus, Loader2, History, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, searchMatch } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";

// Services API
import { archiveNumeriqueService } from "@/services/archiveNumeriqueService";
import { dossierService, type DossierDto } from "@/services/dossierService";

// Composants
import { ArchiveTable, type ArchiveDoc } from "@/components/archives/ArchiveTable";
import { ArchiveModals, type AuditEntry } from "@/components/archives/ArchiveModals";

// ── Type pour les options de dossiers ──
interface DossierOption {
  id: string;
  code: string;
  objet: string;
  clients: string[];
}

// ── Type pour les fichiers de l'API ──
interface FichierAPI {
  id: number | string;
  nomFichier: string;
  typeFichier: string;
  numeroDossier?: string;
  uploadedBy?: string;
  tailleHumaine?: string;
  tailleOctets?: number;
  dateUpload?: string;
  indexeRecherche?: boolean;
  scoreConfianceOcr?: number;
  qualiteNumerisation?: string;
}

// ── Conversion des types API vers le type ArchiveDoc ──
function mapFichierToArchiveDoc(fichier: FichierAPI): ArchiveDoc {
  // Déterminer le statut OCR
  let statut = "En traitement";
  if (fichier.indexeRecherche) statut = "Indexé";
  else if (fichier.scoreConfianceOcr === 0) statut = "Erreur";
  else if (fichier.qualiteNumerisation === "NON_EVALUEE") statut = "En attente";
  
  // Déterminer la miniature
  let miniature = "📄";
  const type = fichier.typeFichier || "";
  if (type.includes("JPEG") || type.includes("PNG") || type.includes("TIFF") || type.includes("BMP")) {
    miniature = "🖼️";
  } else if (type.includes("WORD")) {
    miniature = "📝";
  } else if (type.includes("EXCEL")) {
    miniature = "📊";
  } else if (type.includes("EMAIL")) {
    miniature = "✉️";
  }
  
  return {
    id: String(fichier.id),
    nom: fichier.nomFichier,
    type: fichier.typeFichier?.replace(/_/g, " ") || "Document",
    dossier: fichier.numeroDossier || "Non classé",
    client: fichier.uploadedBy || "—",
    taille: fichier.tailleHumaine || `${((fichier.tailleOctets || 0) / 1024 / 1024).toFixed(1)} Mo`,
    statut,
    date: fichier.dateUpload?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    miniature,
  };
}

export default function ArchivesNumeriques() {
  const { lang } = useLanguage();
  const fr = lang === "FR";

  // ── États principaux ──
  const [archives, setArchives] = useState<ArchiveDoc[]>([]);
  const [dossiers, setDossiers] = useState<DossierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "dossier">("dossier");
  const [expandedDossiers, setExpandedDossiers] = useState<Set<string>>(new Set());
  
  // ── Statistiques ──
  const [stats, setStats] = useState({
    indexedCount: 0,
    processingCount: 0,
    errorCount: 0,
    totalSize: "0",
    espaceUtilise: 0,
    espaceLimite: 0,
    nombreFichiers: 0,
  });

  // ── Journal d'audit ──
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);

  // ── États pour les modales ──
  const [previewDoc, setPreviewDoc] = useState<ArchiveDoc | null>(null);
  const [editDoc, setEditDoc] = useState<ArchiveDoc | null>(null);
  const [editDocName, setEditDocName] = useState("");
  const [editDocType, setEditDocType] = useState("");
  const [replaceDoc, setReplaceDoc] = useState<ArchiveDoc | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceFileName, setReplaceFileName] = useState("");
  const [replacing, setReplacing] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<ArchiveDoc | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [editDossierCode, setEditDossierCode] = useState<string | null>(null);
  const [editDossierLabel, setEditDossierLabel] = useState("");
  const [deleteDossierCode, setDeleteDossierCode] = useState<string | null>(null);
  const [deleteDossierReason, setDeleteDossierReason] = useState("");
  const [moveDoc, setMoveDoc] = useState<ArchiveDoc | null>(null);
  const [targetDossier, setTargetDossier] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importDossier, setImportDossier] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Références ──
  const globalFileInputRef = useRef<HTMLInputElement>(null);

  // ── Utilitaire : ajouter une entrée d'audit locale ──
  const addAudit = useCallback((action: string, detail: string) => {
    setAuditLog(prev => [{
      id: String(Date.now()),
      action,
      detail,
      user: "Utilisateur", // À remplacer par l'utilisateur connecté
      date: new Date().toISOString(),
    }, ...prev]);
  }, []);

  // ── Chargement initial ──
  useEffect(() => {
    loadArchives();
    loadDossiers();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadArchives = useCallback(async () => {
    try {
      setLoading(true);
      const response = await archiveNumeriqueService.getAllFichiers({ page: 0, size: 100 });
      const fichiers = response.data?.content || [];
      const archiveDocs = fichiers.map(mapFichierToArchiveDoc);
      setArchives(archiveDocs);
    } catch (error) {
      console.error("Erreur chargement archives:", error);
      toast.error(fr ? "Erreur lors du chargement des archives" : "Error loading archives");
    } finally {
      setLoading(false);
    }
  }, [fr]);

  const loadDossiers = useCallback(async () => {
    try {
      const response = await dossierService.getAll({ page: 0, size: 100 });
      const dossiersData = response.data?.content || [];
      setDossiers(dossiersData.map((d: DossierDto) => ({
        id: String(d.id),
        code: d.numeroDossier,
        objet: d.objet,
        clients: d.parties?.map(p => p.nomComplet).filter(Boolean) as string[] || [],
      })));
    } catch (error) {
      console.error("Erreur chargement dossiers:", error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [statsResponse, espaceResponse] = await Promise.all([
        archiveNumeriqueService.getStatistiquesSimplifiees(),
        archiveNumeriqueService.getEspaceStockage(),
      ]);
      
      const statsData = statsResponse.data;
      setStats({
        indexedCount: statsData?.nombreIndexes || 0,
        processingCount: statsData?.nombreEnTraitement || 0,
        errorCount: statsData?.nombreErreurs || 0,
        totalSize: `${((espaceResponse.data?.espaceUtiliseOctets || 0) / 1024 / 1024).toFixed(1)} Mo`,
        espaceUtilise: espaceResponse.data?.espaceUtiliseOctets || 0,
        espaceLimite: espaceResponse.data?.espaceLimiteOctets || 0,
        nombreFichiers: espaceResponse.data?.nombreFichiers || 0,
      });
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    }
  }, []);

  // ── Filtrer les documents par recherche ──
  const filtered = useMemo(() => {
    if (!search) return archives;
    return archives.filter(a => 
      searchMatch(a.nom, search) || 
      searchMatch(a.client, search) || 
      searchMatch(a.dossier, search) ||
      searchMatch(a.type, search)
    );
  }, [archives, search]);

  // ── Grouper les documents par dossier ──
  const dossierGroups = useMemo(() => {
    return filtered.reduce<Record<string, ArchiveDoc[]>>((acc, a) => {
      if (!acc[a.dossier]) acc[a.dossier] = [];
      acc[a.dossier].push(a);
      return acc;
    }, {});
  }, [filtered]);

  // ── Basculer l'expansion d'un dossier ──
  const toggleDossier = (code: string) => {
    setExpandedDossiers(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  // ── Upload global (glisser-déposer) ──
  const handleGlobalUpload = useCallback(async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    try {
      const metadata = {
        typeFichier: getTypeFichierFromFile(file),
        titreDocument: file.name.replace(/\.[^/.]+$/, ""),
        lancerOcrAutomatiquement: true,
        lancerIndexationAutomatiquement: true,
        langueOcr: "fra",
        prioriteTraitement: 5,
      };
      
      const response = await archiveNumeriqueService.uploadFichier(file, metadata);
      const newDoc = mapFichierToArchiveDoc(response.data);
      setArchives(prev => [newDoc, ...prev]);
      
      addAudit(fr ? "Import" : "Import", fr
        ? `« ${file.name} » importé via glisser-déposer`
        : `"${file.name}" imported via drag-and-drop`
      );
      
      toast.success(fr ? `Document importé avec succès` : `Document imported successfully`);
    } catch (error) {
      console.error("Erreur upload:", error);
      toast.error(fr ? "Erreur lors de l'import du document" : "Error importing document");
    } finally {
      setUploading(false);
    }
  }, [fr, addAudit]);

  // ── Déplacer un document ──
  const handleMoveDoc = useCallback(async () => {
    if (!moveDoc || !targetDossier) return;
    
    const dossierTarget = dossiers.find(d => d.code === targetDossier);
    if (!dossierTarget) return;
    
    try {
      await archiveNumeriqueService.associerADossier(
        parseInt(moveDoc.id),
        parseInt(dossierTarget.id),
        targetDossier
      );
      
      const oldDossier = moveDoc.dossier;
      setArchives(prev => prev.map(a => 
        a.id === moveDoc.id ? { ...a, dossier: targetDossier } : a
      ));
      
      addAudit(fr ? "Déplacement" : "Move", fr
        ? `« ${moveDoc.nom} » de ${oldDossier} vers ${targetDossier}`
        : `"${moveDoc.nom}" from ${oldDossier} to ${targetDossier}`
      );
      
      toast.success(fr ? `Document déplacé vers ${targetDossier}` : `Document moved to ${targetDossier}`);
      setMoveDoc(null);
      setTargetDossier("");
    } catch (error) {
      console.error("Erreur déplacement:", error);
      toast.error(fr ? "Erreur lors du déplacement" : "Error moving document");
    }
  }, [moveDoc, targetDossier, dossiers, fr, addAudit]);

  // ── Importer un document dans un dossier (via modal) ──
  const handleImportInDossier = useCallback(async () => {
    if (!importDossier || !importFile) return;
    
    const dossierTarget = dossiers.find(d => d.code === importDossier);
    if (!dossierTarget) return;
    
    setImporting(true);
    try {
      const metadata = {
        typeFichier: getTypeFichierFromFile(importFile),
        titreDocument: importFile.name.replace(/\.[^/.]+$/, ""),
        dossierId: parseInt(dossierTarget.id),
        numeroDossier: importDossier,
        lancerOcrAutomatiquement: true,
        lancerIndexationAutomatiquement: true,
        langueOcr: "fra",
        prioriteTraitement: 5,
      };
      
      const response = await archiveNumeriqueService.uploadFichier(importFile, metadata);
      const newDoc = mapFichierToArchiveDoc(response.data);
      setArchives(prev => [newDoc, ...prev]);
      
      addAudit(fr ? "Import" : "Import", fr
        ? `« ${importFile.name} » importé dans ${importDossier}`
        : `"${importFile.name}" imported into ${importDossier}`
      );
      
      setExpandedDossiers(prev => new Set(prev).add(importDossier));
      toast.success(fr
        ? `Document importé dans ${importDossier}`
        : `Document imported into ${importDossier}`
      );
    } catch (error) {
      console.error("Erreur import:", error);
      toast.error(fr ? "Erreur lors de l'import" : "Error importing document");
    } finally {
      setImporting(false);
      setShowImportModal(false);
      setImportDossier("");
      setImportFile(null);
      setImportFileName("");
    }
  }, [importDossier, importFile, dossiers, fr, addAudit]);

  // ── Éditer un document (renommer, changer type) ──
  const handleEditDoc = useCallback(async () => {
    if (!editDoc || !editDocName.trim()) return;
    
    try {
      await archiveNumeriqueService.updateMetadonnees(parseInt(editDoc.id), {
        titreDocument: editDocName.trim(),
      });
      
      const oldName = editDoc.nom;
      setArchives(prev => prev.map(a => a.id === editDoc.id ? {
        ...a,
        nom: editDocName.trim(),
        type: editDocType,
        miniature: editDocType === "PDF" ? "📄" : "🖼️",
      } : a));
      
      addAudit(fr ? "Modification" : "Edit", fr
        ? `« ${oldName} » renommé en « ${editDocName.trim()} »`
        : `"${oldName}" renamed to "${editDocName.trim()}"`
      );
      
      toast.success(fr ? "Document modifié avec succès" : "Document updated successfully");
      setEditDoc(null);
    } catch (error) {
      console.error("Erreur modification:", error);
      toast.error(fr ? "Erreur lors de la modification" : "Error updating document");
    }
  }, [editDoc, editDocName, editDocType, fr, addAudit]);

  // ── Remplacer un fichier ──
  const handleReplaceDoc = useCallback(async () => {
    if (!replaceDoc || !replaceFile) return;
    
    setReplacing(true);
    try {
      const metadata = {
        typeFichier: getTypeFichierFromFile(replaceFile),
        titreDocument: replaceFile.name.replace(/\.[^/.]+$/, ""),
        commentaireVersion: "Remplacement de fichier",
        versionMajeure: false,
        lancerOcrAutomatiquement: true,
        lancerIndexationAutomatiquement: true,
      };
      
      const response = await archiveNumeriqueService.creerNouvelleVersion(
        parseInt(replaceDoc.id),
        replaceFile,
        metadata
      );
      
      const updatedDoc = mapFichierToArchiveDoc(response.data);
      setArchives(prev => prev.map(a => a.id === replaceDoc.id ? updatedDoc : a));
      
      addAudit(fr ? "Remplacement" : "Replace", fr
        ? `« ${replaceDoc.nom} » remplacé par « ${replaceFile.name} »`
        : `"${replaceDoc.nom}" replaced by "${replaceFile.name}"`
      );
      
      toast.success(fr ? "Fichier remplacé avec succès" : "File replaced successfully");
      setReplaceDoc(null);
      setReplaceFile(null);
      setReplaceFileName("");
    } catch (error) {
      console.error("Erreur remplacement:", error);
      toast.error(fr ? "Erreur lors du remplacement" : "Error replacing file");
    } finally {
      setReplacing(false);
    }
  }, [replaceDoc, replaceFile, fr, addAudit]);

  // ── Supprimer un document (soft delete) ──
  const handleDeleteDoc = useCallback(async () => {
    if (!deleteDoc) return;
    
    try {
      await archiveNumeriqueService.deleteFichier(parseInt(deleteDoc.id));
      
      const docName = deleteDoc.nom;
      const docDossier = deleteDoc.dossier;
      setArchives(prev => prev.filter(a => a.id !== deleteDoc.id));
      
      addAudit(fr ? "Suppression document" : "Delete document", fr
        ? `« ${docName} » supprimé du dossier ${docDossier}. Motif : ${deleteReason || "Non précisé"}`
        : `"${docName}" deleted from ${docDossier}. Reason: ${deleteReason || "Not specified"}`
      );
      
      toast.success(fr ? `Document supprimé` : `Document deleted`);
      setDeleteDoc(null);
      setDeleteReason("");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error(fr ? "Erreur lors de la suppression" : "Error deleting document");
    }
  }, [deleteDoc, deleteReason, fr, addAudit]);

  // ── Supprimer un dossier (tous ses documents) ──
  const handleDeleteDossier = useCallback(async () => {
    if (!deleteDossierCode) return;
    
    const docsToDelete = archives.filter(a => a.dossier === deleteDossierCode);
    if (docsToDelete.length === 0) return;
    
    try {
      // Supprimer tous les documents du dossier
      await Promise.all(
        docsToDelete.map(doc => archiveNumeriqueService.deleteFichier(parseInt(doc.id)))
      );
      
      setArchives(prev => prev.filter(a => a.dossier !== deleteDossierCode));
      
      addAudit(fr ? "Suppression dossier" : "Delete folder", fr
        ? `Dossier ${deleteDossierCode} supprimé avec ${docsToDelete.length} document(s). Motif : ${deleteDossierReason || "Non précisé"}`
        : `Folder ${deleteDossierCode} deleted with ${docsToDelete.length} document(s). Reason: ${deleteDossierReason || "Not specified"}`
      );
      
      toast.success(fr
        ? `Dossier et ses ${docsToDelete.length} documents supprimés`
        : `Folder and its ${docsToDelete.length} documents deleted`
      );
      setDeleteDossierCode(null);
      setDeleteDossierReason("");
    } catch (error) {
      console.error("Erreur suppression dossier:", error);
      toast.error(fr ? "Erreur lors de la suppression du dossier" : "Error deleting folder");
    }
  }, [deleteDossierCode, archives, deleteDossierReason, fr, addAudit]);

  // ── Fonction utilitaire pour déterminer le type de fichier ──
  const getTypeFichierFromFile = (file: File): string => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const mime = file.type;
    
    if (ext === 'pdf' || mime === 'application/pdf') return 'PDF_NATIF';
    if (ext === 'doc' || ext === 'docx' || mime.includes('word')) return 'WORD';
    if (ext === 'xls' || ext === 'xlsx' || mime.includes('excel')) return 'EXCEL';
    if (ext === 'jpg' || ext === 'jpeg' || mime === 'image/jpeg') return 'JPEG';
    if (ext === 'png' || mime === 'image/png') return 'PNG';
    if (ext === 'tiff' || ext === 'tif') return 'TIFF';
    if (ext === 'txt' || mime === 'text/plain') return 'TXT';
    if (ext === 'xml') return 'XML';
    if (ext === 'json') return 'JSON';
    if (ext === 'zip' || ext === 'rar') return 'ZIP';
    
    return 'PDF_NATIF'; // Default
  };

  // ── Gestion des fichiers sélectionnés ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportFileName(file.name);
    }
  };

  const handleGlobalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleGlobalUpload(file);
  };

  // ── Drop handler ──
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleGlobalUpload(file);
  };

  const pourcentageUtilise = stats.espaceLimite > 0 
    ? (stats.espaceUtilise / stats.espaceLimite) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* ═══ En-tête ═══ */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-xl font-bold text-foreground">
          {fr ? "Archives Numériques (OCR)" : "Digital Archives (OCR)"}
        </h1>
        <div className="ml-auto flex gap-2 flex-wrap">
          {/* Bouton journal d'audit */}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowAuditLog(true)}>
            <History className="h-4 w-4" />
            {fr ? "Journal" : "Audit log"}
            {auditLog.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-[10px]">
                {auditLog.length}
              </Badge>
            )}
          </Button>
          
          {/* Vue globale / par dossier */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("all")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "all" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              {fr ? "Tous" : "All"}
            </button>
            <button onClick={() => setViewMode("dossier")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === "dossier" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              <FolderOpen className="h-3 w-3" /> {fr ? "Par dossier" : "By case"}
            </button>
          </div>
          
          <Button variant="outline" size="sm" className="gap-1.5" 
            onClick={() => { setImportDossier(""); setImportFile(null); setImportFileName(""); setShowImportModal(true); }}>
            <Plus className="h-4 w-4" /> {fr ? "Importer dans un dossier" : "Import into case"}
          </Button>
          
          <input ref={globalFileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx,.xls,.xlsx" 
            onChange={handleGlobalFileSelect} className="hidden" />
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            onClick={() => globalFileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> {fr ? "Importer document" : "Import document"}
          </Button>
        </div>
      </div>

      {/* ═══ Zone de dépôt ═══ */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">{fr ? "Import en cours..." : "Importing..."}</p>
            <p className="text-xs text-muted-foreground">{fr ? "OCR et indexation en cours" : "OCR and indexing in progress"}</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">{fr ? "Glissez-déposez vos fichiers ici" : "Drag and drop files here"}</p>
            <p className="text-xs text-muted-foreground mt-1">{fr ? "PDF, JPEG, PNG, Word, Excel jusqu'à 50 Mo — Indexation OCR automatique" : "PDF, JPEG, PNG, Word, Excel up to 50 MB — Automatic OCR indexing"}</p>
          </>
        )}
      </div>

      {/* ═══ Barre de recherche ═══ */}
      <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder={fr ? "Recherche plein-texte dans les documents..." : "Full-text search in documents..."}
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        {search && (
          <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ═══ Statistiques ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[
          { label: fr ? "Documents indexés" : "Indexed documents", value: String(stats.indexedCount), icon: FileText, bg: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-500" },
          { label: fr ? "En traitement OCR" : "OCR processing", value: String(stats.processingCount), icon: File, bg: "bg-amber-50 dark:bg-amber-900/20", iconBg: "bg-amber-500" },
          { label: fr ? "Erreurs OCR" : "OCR errors", value: String(stats.errorCount), icon: File, bg: "bg-red-50 dark:bg-red-900/20", iconBg: "bg-red-500" },
          { label: fr ? "Stockage utilisé" : "Storage used", value: `${stats.totalSize} / ${(stats.espaceLimite / 1024 / 1024).toFixed(0)} Mo`, icon: Image, bg: "bg-purple-50 dark:bg-purple-900/20", iconBg: "bg-purple-500" },
        ].map(({ label, value, icon: Icon, bg, iconBg }) => (
          <div key={label} className={cn("rounded-xl border border-border p-4 flex items-center gap-4", bg)}>
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white shrink-0", iconBg)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Tableau des archives ═══ */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ArchiveTable
          viewMode={viewMode}
          filtered={filtered}
          dossierGroups={dossierGroups}
          expandedDossiers={expandedDossiers}
          fr={fr}
          toggleDossier={toggleDossier}
          onPreview={setPreviewDoc}
          onEdit={(doc) => { setEditDoc(doc); setEditDocName(doc.nom); setEditDocType(doc.type); }}
          onReplace={(doc) => { setReplaceDoc(doc); setReplaceFile(null); setReplaceFileName(""); }}
          onMove={(doc) => { setMoveDoc(doc); setTargetDossier(""); }}
          onDelete={setDeleteDoc}
          onImportInDossier={(code) => { setImportDossier(code); setImportFile(null); setImportFileName(""); setShowImportModal(true); }}
          onEditDossier={(code, label) => { setEditDossierCode(code); setEditDossierLabel(label); }}
          onDeleteDossier={setDeleteDossierCode}
        />
      )}

      {/* ═══ Modales ═══ */}
      <ArchiveModals
        fr={fr}
        archives={archives}
        previewDoc={previewDoc}
        setPreviewDoc={setPreviewDoc}
        editDoc={editDoc}
        setEditDoc={setEditDoc}
        editDocName={editDocName}
        setEditDocName={setEditDocName}
        editDocType={editDocType}
        setEditDocType={setEditDocType}
        handleEditDoc={handleEditDoc}
        replaceDoc={replaceDoc}
        setReplaceDoc={setReplaceDoc}
        replaceFileName={replaceFileName}
        setReplaceFileName={setReplaceFileName}
        replacing={replacing}
        handleReplaceDoc={handleReplaceDoc}
        deleteDoc={deleteDoc}
        setDeleteDoc={setDeleteDoc}
        deleteReason={deleteReason}
        setDeleteReason={setDeleteReason}
        handleDeleteDoc={handleDeleteDoc}
        editDossierCode={editDossierCode}
        setEditDossierCode={setEditDossierCode}
        editDossierLabel={editDossierLabel}
        setEditDossierLabel={setEditDossierLabel}
        handleEditDossier={() => {
          if (editDossierCode && editDossierLabel.trim()) {
            addAudit(fr ? "Modification dossier" : "Edit folder", fr
              ? `Dossier ${editDossierCode} : objet modifié en « ${editDossierLabel.trim()} »`
              : `Folder ${editDossierCode}: label changed to "${editDossierLabel.trim()}"`
            );
            toast.success(fr ? `Dossier ${editDossierCode} modifié` : `Folder ${editDossierCode} updated`);
            setEditDossierCode(null);
            setEditDossierLabel("");
          }
        }}
        deleteDossierCode={deleteDossierCode}
        setDeleteDossierCode={setDeleteDossierCode}
        deleteDossierReason={deleteDossierReason}
        setDeleteDossierReason={setDeleteDossierReason}
        handleDeleteDossier={handleDeleteDossier}
        moveDoc={moveDoc}
        setMoveDoc={setMoveDoc}
        targetDossier={targetDossier}
        setTargetDossier={setTargetDossier}
        handleMoveDoc={handleMoveDoc}
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        importDossier={importDossier}
        setImportDossier={setImportDossier}
        importFileName={importFileName}
        setImportFileName={setImportFileName}
        importing={importing}
        handleImportInDossier={handleImportInDossier}
        handleFileSelect={handleFileSelect}
        showAuditLog={showAuditLog}
        setShowAuditLog={setShowAuditLog}
        auditLog={auditLog}
      />
    </div>
  );
}