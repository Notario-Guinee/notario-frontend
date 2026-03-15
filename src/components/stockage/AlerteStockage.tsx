// ═══════════════════════════════════════════════════════════════
// AlerteStockage — Bandeau conditionnel d'alerte de capacité
// N'affiche rien si le niveau est "normal". Sinon, affiche un
// bandeau coloré avec un bouton vers l'onglet stockage supplémentaire
// ═══════════════════════════════════════════════════════════════

import { AlertTriangle, AlertCircle, XCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NiveauAlerte, QuotaStockage } from '@/types/stockage';

interface AlerteStockageProps {
  niveauAlerte: NiveauAlerte;
  quota: QuotaStockage | null;
  /** Callback pour basculer vers l'onglet "Stockage supplémentaire" */
  onAjouterStockage: () => void;
}

/** Configuration visuelle des bandeaux selon le niveau d'alerte */
const configAlertes = {
  attention: {
    classes: 'border-yellow-500/30 bg-yellow-500/10',
    iconeClasses: 'text-yellow-600',
    titreClasses: 'text-yellow-800 dark:text-yellow-300',
    texteClasses: 'text-yellow-700 dark:text-yellow-400',
    Icone: AlertTriangle,
  },
  urgent: {
    classes: 'border-orange-500/30 bg-orange-500/10',
    iconeClasses: 'text-orange-600',
    titreClasses: 'text-orange-800 dark:text-orange-300',
    texteClasses: 'text-orange-700 dark:text-orange-400',
    Icone: AlertCircle,
  },
  plein: {
    classes: 'border-destructive/30 bg-destructive/10',
    iconeClasses: 'text-destructive',
    titreClasses: 'text-destructive',
    texteClasses: 'text-destructive/80',
    Icone: XCircle,
  },
} as const;

export function AlerteStockage({ niveauAlerte, quota, onAjouterStockage }: AlerteStockageProps) {
  // Rien à afficher si tout va bien
  if (niveauAlerte === 'normal' || !quota) return null;

  const cfg = configAlertes[niveauAlerte];
  const { Icone } = cfg;
  const pct = quota.pourcentage_utilise;
  const restant = (quota.stockage_total_gb - quota.stockage_utilise_gb).toFixed(1);

  /** Texte principal selon le niveau */
  const titre = niveauAlerte === 'plein'
    ? 'Stockage plein. Les téléversements sont bloqués.'
    : niveauAlerte === 'urgent'
      ? `Seulement ${restant} GB restants !`
      : `Vous avez utilisé ${pct}% de votre espace de stockage.`;

  /** Sous-texte incitatif */
  const sousTitre = niveauAlerte === 'plein'
    ? 'Ajoutez un pack immédiatement pour débloquer les téléversements.'
    : niveauAlerte === 'urgent'
      ? 'Ajoutez un pack pour éviter tout blocage.'
      : 'Pensez à ajouter un pack mensuel.';

  return (
    <div className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${cfg.classes}`}>
      <div className="flex items-start gap-3">
        <Icone className={`h-5 w-5 shrink-0 mt-0.5 ${cfg.iconeClasses}`} />
        <div>
          <p className={`text-sm font-semibold ${cfg.titreClasses}`}>{titre}</p>
          <p className={`text-xs mt-0.5 ${cfg.texteClasses}`}>{sousTitre}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onAjouterStockage}
        className="shrink-0 text-xs gap-1"
      >
        Ajouter du stockage
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
