// ═══════════════════════════════════════════════════════════════
// GestionPacks — Onglet "Stockage supplémentaire"
// Affiche les packs actifs (avec résiliation/annulation) et la
// grille des 7 packs (100 GB → 10 To) avec souscription confirmée
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Package, RefreshCw, Clock, Star, Check, Loader2, PackageOpen, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { PackMensuel } from '@/types/stockage';
import * as svc from '@/services/stockageService';
import { useLanguage } from '@/context/LanguageContext';

interface GestionPacksProps {
  onSouscrire: (packId: string) => Promise<void>;
  onResilier: (packId: string) => Promise<void>;
  onAnnulerResiliation: (packId: string) => Promise<void>;
  isActionEnCours: boolean;
}

/** Formate un montant GNF */
function formatGnf(montant: number): string {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' GNF/mois';
}

/**
 * Affiche la capacité en GB ou en To selon la taille.
 * ≥ 1000 GB → affiché en To (ex: 1 000 GB = 1 To, 5 000 GB = 5 To)
 */
function afficherCapacite(gb: number): string {
  if (gb >= 1000) return `${gb / 1000} To`;
  return `${gb} GB`;
}

export function GestionPacks({
  onSouscrire,
  onResilier,
  onAnnulerResiliation,
  isActionEnCours,
}: GestionPacksProps) {
  const { t, lang } = useLanguage();

  /** Formate une date ISO en format lisible selon la langue */
  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(lang === 'EN' ? 'en-GB' : 'fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const [packs, setPacks] = useState<PackMensuel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  /** Pack en attente de confirmation de souscription */
  const [packASouscrire, setPackASouscrire] = useState<PackMensuel | null>(null);
  /** Case à cocher consentement dans le dialogue de souscription */
  const [consentementAccepte, setConsentementAccepte] = useState(false);
  /** Pack en attente de confirmation de résiliation */
  const [packAResilier, setPackAResilier] = useState<PackMensuel | null>(null);

  /** Charge les packs depuis le service et recharge après chaque action */
  const chargerPacks = async () => {
    const data = await svc.getPacksDisponibles();
    setPacks(data);
    setIsLoading(false);
  };

  useEffect(() => {
    chargerPacks();
  }, [isActionEnCours]);

  const packsActifs = packs.filter(p => p.est_actif);
  /** Stockage du pack actif courant (0 si aucun pack actif) */
  const stockagePackActif = packsActifs[0]?.stockage_gb ?? 0;
  /** Vrai si ce pack est une rétrogradation interdite */
  const estRetrogradation = (pack: PackMensuel) =>
    stockagePackActif > 0 && !pack.est_actif && pack.stockage_gb < stockagePackActif;

  /** Confirme la souscription après validation dans le dialog */
  async function confirmerSouscription() {
    if (!packASouscrire) return;
    const id = packASouscrire.id;
    setPackASouscrire(null);
    await onSouscrire(id);
    await chargerPacks();
  }

  /** Confirme la résiliation après validation dans le dialog */
  async function confirmerResiliation() {
    if (!packAResilier) return;
    const id = packAResilier.id;
    setPackAResilier(null);
    await onResilier(id);
    await chargerPacks();
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ══ SECTION 1 : Packs actifs ══ */}
      {packsActifs.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
            <Package className="h-4 w-4" /> {t("subs.packs.activeTitle")}
          </h3>
          {packsActifs.map(pack => (
            <div
              key={pack.id}
              className={cn(
                'rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3',
                pack.resiliation_programmee
                  ? 'border-warning/30 bg-warning/5'
                  : 'border-border bg-card'
              )}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {pack.nom} — +{pack.stockage_gb} GB — {formatGnf(pack.prix_mois_gnf)}
                </p>
                {pack.resiliation_programmee && pack.date_resiliation ? (
                  <>
                    <p className="text-xs text-warning flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t("subs.packs.cancelScheduled")} {formatDate(pack.date_resiliation)}
                    </p>
                  </>
                ) : pack.date_renouvellement ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    {t("subs.packs.renewal")} : {formatDate(pack.date_renouvellement)}
                  </p>
                ) : null}
              </div>

              {/* Bouton résiliation / annulation */}
              {pack.resiliation_programmee ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={async () => {
                    await onAnnulerResiliation(pack.id);
                    await chargerPacks();
                  }}
                  disabled={isActionEnCours}
                >
                  {isActionEnCours
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : t("subs.packs.cancelUndo")
                  }
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive border-destructive/30"
                  onClick={() => setPackAResilier(pack)}
                  disabled={isActionEnCours}
                >
                  {t("subs.packs.cancelAction")}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══ SECTION 2 : Packs disponibles ══ */}
      <div className="space-y-4">
        <div>
          <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
            <PackageOpen className="h-4 w-4" /> {t("subs.packs.sectionTitle")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t("subs.packs.sectionSubtitle")}
          </p>
        </div>

        {/* Grille responsive : 2 col mobile → 3 col tablette → 4 col desktop */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {packs.map(pack => (
            <div
              key={pack.id}
              className={cn(
                'relative flex flex-col rounded-xl border p-5 transition-all',
                pack.est_actif
                  ? 'border-primary/30 bg-primary/5'
                  : estRetrogradation(pack)
                    ? 'border-border bg-card opacity-40 cursor-not-allowed'
                    : 'border-border bg-card hover:border-primary/30'
              )}
            >
              {/* Badge "Populaire" sur Pack M */}
              {pack.est_populaire && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white whitespace-nowrap">
                  <Star className="h-3 w-3" /> {t("subs.packs.popular")}
                </span>
              )}

              {/* Nom et capacité (GB ou To selon la taille) */}
              <h4 className="font-heading text-sm font-bold text-foreground mb-1 mt-1">
                {pack.nom}
              </h4>
              <p className="text-2xl font-bold text-primary mb-3">
                +{afficherCapacite(pack.stockage_gb)}
              </p>
              <p className="text-sm font-semibold text-foreground mb-4">
                {formatGnf(pack.prix_mois_gnf)}
              </p>

              {/* Bouton souscrire / souscrit / rétrogradation interdite */}
              {pack.est_actif ? (
                <Button disabled variant="outline" className="w-full text-xs gap-1">
                  <Check className="h-3.5 w-3.5" /> {t("subs.packs.active")}
                </Button>
              ) : estRetrogradation(pack) ? (
                <Button disabled variant="outline" className="w-full text-xs">
                  {t("subs.packs.unavailable")}
                </Button>
              ) : (
                <Button
                  className="w-full text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => { setPackASouscrire(pack); setConsentementAccepte(false); }}
                  disabled={isActionEnCours}
                >
                  {t("subs.packs.subscribe")}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Dialog confirmation souscription ── */}
      <Dialog open={!!packASouscrire} onOpenChange={o => { if (!o) { setPackASouscrire(null); setConsentementAccepte(false); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {t("subs.packs.dialogTitle")} — {packASouscrire?.nom}
            </DialogTitle>
            <DialogDescription>
              {t("subs.packs.dialogRenewalLabel")} {t("subs.packs.dialogRenewalValue")}
            </DialogDescription>
          </DialogHeader>
          {packASouscrire && (
            <ul className="space-y-2 py-2 text-sm">
              <li className="flex items-center gap-2">✅ {t("subs.packs.dialogStorageLabel")} +{afficherCapacite(packASouscrire.stockage_gb)}</li>
              <li className="flex items-center gap-2">💳 {t("subs.packs.dialogPriceLabel")} {new Intl.NumberFormat('fr-FR').format(packASouscrire.prix_mois_gnf)} GNF</li>
              <li className="flex items-center gap-2">🔄 {t("subs.packs.dialogRenewalLabel")} {t("subs.packs.dialogRenewalValue")}</li>
              {packsActifs.length > 0 && packASouscrire.stockage_gb > stockagePackActif && (
                <li className="flex items-start gap-2 text-muted-foreground text-xs pt-1 border-t border-border">
                  ℹ️ {t("subs.packs.dialogReplaceNote")}
                </li>
              )}
            </ul>
          )}

          {/* Consentement */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              Vous acceptez que Notario débite votre carte du montant indiqué ci-dessus maintenant et de manière récurrente mensuelle jusqu'à ce que vous annuliez conformément à nos conditions, notamment en exerçant votre droit d'annulation de votre abonnement dans les 14 jours suivant la date d'abonnement. Vous pouvez annuler à tout moment dans les paramètres de votre compte.
            </p>
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={consentementAccepte}
                  onChange={e => setConsentementAccepte(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${consentementAccepte ? 'bg-primary border-primary' : 'border-muted-foreground/40 group-hover:border-primary/60'}`}>
                  {consentementAccepte && <ShieldCheck className="w-3 h-3 text-white" />}
                </div>
              </div>
              <span className="text-[11px] text-foreground leading-relaxed select-none">
                J'ai lu et j'accepte les conditions ci-dessus pour procéder à la souscription.
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setPackASouscrire(null); setConsentementAccepte(false); }}>
              {t("subs.packs.dialogCancel")}
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={confirmerSouscription}
              disabled={isActionEnCours || !consentementAccepte}
            >
              {isActionEnCours
                ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> {t("subs.packs.subscribing")}</>
                : t("subs.packs.dialogConfirm")
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog confirmation résiliation ── */}
      <Dialog open={!!packAResilier} onOpenChange={o => !o && setPackAResilier(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-destructive">
              {packAResilier?.nom} — {t("subs.packs.cancelAction")}
            </DialogTitle>
            <DialogDescription>
              {t("subs.packs.cancelScheduled")} {packAResilier?.date_renouvellement ? formatDate(packAResilier.date_renouvellement) : ''}
            </DialogDescription>
          </DialogHeader>
          {packAResilier && (
            <div className="py-2 space-y-1 text-sm text-foreground">
              <p>
                {afficherCapacite(packAResilier.stockage_gb)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPackAResilier(null)}>
              {t("subs.packs.dialogCancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmerResiliation}
              disabled={isActionEnCours}
            >
              {isActionEnCours
                ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> {t("subs.packs.subscribing")}</>
                : t("subs.packs.cancelAction")
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
