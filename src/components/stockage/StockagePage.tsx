// ═══════════════════════════════════════════════════════════════
// StockagePage — Page principale de gestion du stockage
// Structure : jauge + alerte conditionnelle + 3 onglets
//   • Abonnement → GestionPlans
//   • Stockage supplémentaire → GestionPacks
//   • Facturation → EspaceFacturation
// Le bouton "Ajouter du stockage" bascule automatiquement
// vers l'onglet "Stockage supplémentaire"
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { HardDrive } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JaugeStockage } from './JaugeStockage';
import { AlerteStockage } from './AlerteStockage';
import { GestionPlans } from './GestionPlans';
import { GestionPacks } from './GestionPacks';
import { EspaceFacturation } from './EspaceFacturation';
import { useStockage } from '@/hooks/useStockage';
import { useLanguage } from '@/context/LanguageContext';
import { PageLoader } from '@/components/ui/loading-spinner';

/** Identifiants des onglets */
const ONGLETS = {
  ABONNEMENT:   'abonnement',
  PACKS:        'packs',
  FACTURATION:  'facturation',
} as const;

type OngletId = typeof ONGLETS[keyof typeof ONGLETS];

export default function StockagePage() {
  const { t } = useLanguage();
  const {
    quota,
    isLoading,
    niveauAlerte,
    recapFacturation,
    isActionEnCours,
    upgraderPlan,
    souscrirePack,
    resilierPack,
    annulerResiliationPack,
  } = useStockage();

  /** Onglet actuellement affiché */
  const [ongletActif, setOngletActif] = useState<OngletId>(ONGLETS.ABONNEMENT);

  /** Bascule vers l'onglet des packs depuis l'alerte de stockage */
  const allerVersStockageSupplementaire = () => {
    setOngletActif(ONGLETS.PACKS);
    // Scroll vers les onglets pour une meilleure UX
    setTimeout(() => {
      document.getElementById('stockage-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">

      {/* ── En-tête de la page ── */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <HardDrive className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            {t("subs.page.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("subs.page.subtitle")}
          </p>
        </div>
      </div>

      {/* ── Jauge de stockage ── */}
      <JaugeStockage
        quota={quota}
        niveauAlerte={niveauAlerte}
        isLoading={isLoading}
      />

      {/* ── Bandeau d'alerte (conditionnel) ── */}
      <AlerteStockage
        niveauAlerte={niveauAlerte}
        quota={quota}
        onAjouterStockage={allerVersStockageSupplementaire}
      />

      {/* ── Onglets principaux ── */}
      <div id="stockage-tabs">
        <Tabs
          value={ongletActif}
          onValueChange={v => setOngletActif(v as OngletId)}
        >
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value={ONGLETS.ABONNEMENT} className="flex-1 sm:flex-none">
              {t("subs.tab.subscription")}
            </TabsTrigger>
            <TabsTrigger value={ONGLETS.PACKS} className="flex-1 sm:flex-none">
              {t("subs.tab.packs")}
            </TabsTrigger>
            <TabsTrigger value={ONGLETS.FACTURATION} className="flex-1 sm:flex-none">
              {t("subs.tab.billing")}
            </TabsTrigger>
          </TabsList>

          {/* ── Onglet : Abonnement ── */}
          <TabsContent value={ONGLETS.ABONNEMENT} className="mt-6">
            <GestionPlans
              onUpgrade={upgraderPlan}
              isActionEnCours={isActionEnCours}
            />
          </TabsContent>

          {/* ── Onglet : Stockage supplémentaire ── */}
          <TabsContent value={ONGLETS.PACKS} className="mt-6">
            <GestionPacks
              onSouscrire={souscrirePack}
              onResilier={resilierPack}
              onAnnulerResiliation={annulerResiliationPack}
              isActionEnCours={isActionEnCours}
            />
          </TabsContent>

          {/* ── Onglet : Facturation ── */}
          <TabsContent value={ONGLETS.FACTURATION} className="mt-6">
            <EspaceFacturation
              recap={recapFacturation}
              isLoadingRecap={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
