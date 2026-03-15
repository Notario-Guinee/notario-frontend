// ═══════════════════════════════════════════════════════════════
// GestionPlans — Onglet "Abonnement" : sélection et upgrade de plan
// Règle métier : le downgrade est TOTALEMENT INTERDIT.
// Seuls les plans supérieurs au plan actuel ont un bouton actif.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Users, HardDrive, CheckCircle2, Loader2 } from 'lucide-react';
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
import type { PlanNotario } from '@/types/stockage';
import * as svc from '@/services/stockageService';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GestionPlansProps {
  /** Callback déclenché après un upgrade réussi */
  onUpgrade: (planId: string) => Promise<void>;
  isActionEnCours: boolean;
}

/** Formate un montant GNF en chaîne lisible */
function formatGnf(montant: number): string {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' GNF/mois';
}

/** Prix simulés des plans (alignés avec le service) */
const PRIX_PLANS: Record<string, number> = {
  'plan-essentielle':      150_000,
  'plan-professionnelle':  300_000,
  'plan-premium':          500_000,
};

export function GestionPlans({ onUpgrade, isActionEnCours }: GestionPlansProps) {
  const [plans, setPlans] = useState<PlanNotario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  /** Plan sélectionné en attente de confirmation dans le dialog */
  const [planAConfirmer, setPlanAConfirmer] = useState<PlanNotario | null>(null);

  /** Charge les plans disponibles depuis le service mock */
  useEffect(() => {
    svc.getPlansDisponibles().then(data => {
      setPlans(data);
      setIsLoading(false);
    });
  }, [isActionEnCours]); // Recharge après chaque action pour refléter l'état mis à jour

  const planActuel = plans.find(p => p.est_plan_actuel);

  /** Détermine le statut du bouton pour chaque carte de plan */
  function statutBouton(plan: PlanNotario): 'inferieur' | 'actuel' | 'superieur' {
    if (plan.est_plan_actuel) return 'actuel';
    if (planActuel && plan.niveau < planActuel.niveau) return 'inferieur';
    return 'superieur';
  }

  /** Confirme et déclenche l'upgrade après validation dans le dialog */
  async function confirmerUpgrade() {
    if (!planAConfirmer) return;
    setPlanAConfirmer(null);
    await onUpgrade(planAConfirmer.id);
    // Recharge les plans pour refléter le nouveau plan actuel
    const data = await svc.getPlansDisponibles();
    setPlans(data);
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Titre de section ── */}
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground">
          Votre abonnement
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Vous pouvez uniquement évoluer vers un plan supérieur.
        </p>
      </div>

      {/* ── Grille des 3 plans ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map(plan => {
          const statut = statutBouton(plan);
          const estInferieur = statut === 'inferieur';
          const estActuel    = statut === 'actuel';

          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-xl border p-5 transition-all',
                estActuel    && 'border-primary shadow-md ring-1 ring-primary/30',
                estInferieur && 'opacity-50 border-border bg-muted/20',
                !estActuel && !estInferieur && 'border-border bg-card hover:border-primary/40'
              )}
            >
              {/* Badge "Plan actuel" */}
              {estActuel && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground whitespace-nowrap">
                  <CheckCircle2 className="h-3 w-3" /> Plan actuel
                </span>
              )}

              {/* Nom du plan */}
              <h4 className="font-heading text-sm font-bold text-foreground mb-3 mt-1">
                {plan.nom}
              </h4>

              {/* Caractéristiques */}
              <ul className="space-y-2 flex-1 mb-4">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0" />
                  {plan.utilisateurs_max} utilisateurs maximum
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HardDrive className="h-4 w-4 shrink-0" />
                  {plan.stockage_gb} GB de stockage inclus
                </li>
              </ul>

              {/* Prix */}
              <p className="text-base font-bold text-foreground mb-4">
                {formatGnf(PRIX_PLANS[plan.id] ?? 0)}
              </p>

              {/* Bouton selon le statut */}
              {estInferieur ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block">
                      <Button disabled className="w-full text-xs" variant="outline">
                        Rétrogradation non disponible
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    La rétrogradation n'est pas autorisée
                  </TooltipContent>
                </Tooltip>
              ) : estActuel ? (
                <Button disabled className="w-full text-xs" variant="outline">
                  Plan actuel
                </Button>
              ) : (
                <Button
                  className="w-full text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                  onClick={() => setPlanAConfirmer(plan)}
                  disabled={isActionEnCours}
                >
                  {isActionEnCours
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> En cours…</>
                    : 'Passer à ce plan →'
                  }
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Dialog de confirmation d'upgrade ── */}
      <Dialog open={!!planAConfirmer} onOpenChange={o => !o && setPlanAConfirmer(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Passer à {planAConfirmer?.nom}
            </DialogTitle>
            <DialogDescription>
              Ce changement sera effectif immédiatement.
            </DialogDescription>
          </DialogHeader>
          {planAConfirmer && (
            <ul className="space-y-2 py-2">
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Users className="h-4 w-4 text-muted-foreground" />
                {planAConfirmer.utilisateurs_max} utilisateurs maximum
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                {planAConfirmer.stockage_gb} GB de stockage inclus
              </li>
            </ul>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanAConfirmer(null)}>
              Annuler
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
              onClick={confirmerUpgrade}
              disabled={isActionEnCours}
            >
              {isActionEnCours
                ? <><Loader2 className="h-4 w-4 animate-spin" /> En cours…</>
                : 'Confirmer l\'upgrade →'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
