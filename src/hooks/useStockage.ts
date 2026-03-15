// ═══════════════════════════════════════════════════════════════
// Hook useStockage — Gestion de l'état du stockage cabinet
// Centralise les données de quota, les actions sur les plans et
// packs, et calcule le niveau d'alerte en temps réel
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import type { QuotaStockage, RecapFacturation, NiveauAlerte } from '@/types/stockage';
import * as svc from '@/services/stockageService';
import { toast } from 'sonner';

interface UseStockageReturn {
  /** Quota complet du cabinet (null pendant le chargement initial) */
  quota: QuotaStockage | null;
  /** Vrai pendant le chargement initial des données */
  isLoading: boolean;
  /** Niveau d'alerte calculé depuis le pourcentage d'utilisation */
  niveauAlerte: NiveauAlerte;
  /** Récapitulatif de facturation mensuelle */
  recapFacturation: RecapFacturation | null;
  /** Vrai pendant une action (upgrade, souscription, résiliation) */
  isActionEnCours: boolean;
  /** Passe au plan supérieur et recharge les données */
  upgraderPlan: (planId: string) => Promise<void>;
  /** Souscrit à un pack mensuel et recharge les données */
  souscrirePack: (packId: string) => Promise<void>;
  /** Programme la résiliation d'un pack et recharge les données */
  resilierPack: (packId: string) => Promise<void>;
  /** Annule une résiliation programmée et recharge les données */
  annulerResiliationPack: (packId: string) => Promise<void>;
  /** Force le rechargement des données depuis le service */
  recharger: () => Promise<void>;
}

/**
 * Calcule le niveau d'alerte à partir du pourcentage d'utilisation.
 * - normal    → < 70%
 * - attention → 70–89%
 * - urgent    → 90–99%
 * - plein     → 100%
 */
function calculerNiveauAlerte(pct: number): NiveauAlerte {
  if (pct >= 100) return 'plein';
  if (pct >= 90) return 'urgent';
  if (pct >= 70) return 'attention';
  return 'normal';
}

export function useStockage(): UseStockageReturn {
  const [quota, setQuota] = useState<QuotaStockage | null>(null);
  const [recapFacturation, setRecapFacturation] = useState<RecapFacturation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionEnCours, setIsActionEnCours] = useState(false);

  /** Charge (ou recharge) le quota et le récapitulatif en parallèle */
  const recharger = useCallback(async () => {
    setIsLoading(true);
    try {
      const [q, recap] = await Promise.all([
        svc.getQuotaCabinet(),
        svc.getRecapFacturation(),
      ]);
      setQuota(q);
      setRecapFacturation(recap);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Chargement initial au montage du composant
  useEffect(() => {
    recharger();
  }, [recharger]);

  /** Niveau d'alerte dérivé du quota courant */
  const niveauAlerte: NiveauAlerte = quota
    ? calculerNiveauAlerte(quota.pourcentage_utilise)
    : 'normal';

  /**
   * Upgrade vers un plan supérieur.
   * Affiche un toast de succès ou d'erreur selon le résultat.
   */
  const upgraderPlan = useCallback(async (planId: string) => {
    setIsActionEnCours(true);
    try {
      const resultat = await svc.upgraderPlan(planId);
      if (resultat.succes) {
        toast.success(resultat.message);
        await recharger();
      } else {
        toast.error(resultat.message);
      }
    } catch {
      toast.error('Une erreur est survenue lors du changement de plan.');
    } finally {
      setIsActionEnCours(false);
    }
  }, [recharger]);

  /**
   * Souscrit à un pack mensuel.
   * Affiche un toast de succès après activation.
   */
  const souscrirePack = useCallback(async (packId: string) => {
    setIsActionEnCours(true);
    try {
      const pack = await svc.souscrirePack(packId);
      toast.success(`${pack.nom} souscrit ! +${pack.stockage_gb} GB ajoutés à votre espace.`);
      await recharger();
    } catch (err) {
      // Affiche le message métier du service si disponible (ex: pack déjà actif)
      const message = err instanceof Error ? err.message : 'Une erreur est survenue lors de la souscription.';
      toast.error(message);
    } finally {
      setIsActionEnCours(false);
    }
  }, [recharger]);

  /**
   * Programme la résiliation d'un pack en fin de mois.
   * Affiche un toast informatif avec la date d'effet.
   */
  const resilierPack = useCallback(async (packId: string) => {
    setIsActionEnCours(true);
    try {
      const resultat = await svc.resilierPack(packId);
      if (resultat.succes) {
        toast.info(resultat.message);
        await recharger();
      } else {
        toast.error(resultat.message);
      }
    } catch {
      toast.error('Une erreur est survenue lors de la résiliation.');
    } finally {
      setIsActionEnCours(false);
    }
  }, [recharger]);

  /**
   * Annule une résiliation programmée sur un pack.
   * Affiche un toast de confirmation.
   */
  const annulerResiliationPack = useCallback(async (packId: string) => {
    setIsActionEnCours(true);
    try {
      const resultat = await svc.annulerResiliationPack(packId);
      if (resultat.succes) {
        toast.success(resultat.message);
        await recharger();
      } else {
        toast.error(resultat.message);
      }
    } catch {
      toast.error("Une erreur est survenue lors de l'annulation.");
    } finally {
      setIsActionEnCours(false);
    }
  }, [recharger]);

  return {
    quota,
    isLoading,
    niveauAlerte,
    recapFacturation,
    isActionEnCours,
    upgraderPlan,
    souscrirePack,
    resilierPack,
    annulerResiliationPack,
    recharger,
  };
}
