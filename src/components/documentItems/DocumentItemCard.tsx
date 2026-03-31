import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, FileSpreadsheet, Image, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentItem, FormatDocument, TypeDocument } from '@/types/documentItem';

interface DocumentItemCardProps {
  document: DocumentItem;
}

const formatConfig: Record<FormatDocument, { label: string; iconClass: string }> = {
  PDF: { label: 'PDF', iconClass: 'text-red-500' },
  DOCX: { label: 'DOCX', iconClass: 'text-blue-500' },
  XLSX: { label: 'XLSX', iconClass: 'text-green-500' },
  IMG: { label: 'IMG', iconClass: 'text-orange-500' },
};

const typeDocumentLabels: Record<TypeDocument, string> = {
  ACTE: 'Acte',
  ANNEXE: 'Annexe',
  COURRIER: 'Courrier',
  MODELE: 'Modèle',
  AUTRE: 'Autre',
};

function FormatIcon({ format: fmt, className }: { format: FormatDocument; className?: string }) {
  const cls = cn(formatConfig[fmt].iconClass, 'h-6 w-6', className);
  if (fmt === 'XLSX') return <FileSpreadsheet className={cls} />;
  if (fmt === 'IMG') return <Image className={cls} />;
  return <FileText className={cls} />;
}

export function DocumentItemCard({ document }: DocumentItemCardProps) {
  const fmtConfig = formatConfig[document.format];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <FormatIcon format={document.format} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{document.nom}</p>
          <p className="text-xs text-muted-foreground">{typeDocumentLabels[document.typeDocument]}</p>
        </div>
        <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground shrink-0">
          {fmtConfig.label}
        </span>
      </div>
      <div className="space-y-1">
        {document.dossierReference && (
          <p className="text-xs text-muted-foreground">
            Dossier : <span className="font-mono">{document.dossierReference}</span>
          </p>
        )}
        <p className="text-xs text-muted-foreground truncate">{document.auteurNomComplet}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{document.tailleMo.toFixed(1)} Mo</p>
          <p className="text-xs text-muted-foreground">
            {format(parseISO(document.createdAt), 'd MMM yyyy', { locale: fr })}
          </p>
        </div>
        <a
          href={document.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Télécharger
        </a>
      </div>
    </div>
  );
}
