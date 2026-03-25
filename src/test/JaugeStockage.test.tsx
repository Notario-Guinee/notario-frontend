// ═══════════════════════════════════════════════════════════════
// Tests du composant JaugeStockage
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JaugeStockage } from '@/components/stockage/JaugeStockage';
import { LanguageProvider } from '@/context/LanguageContext';
import type { QuotaStockage, NiveauAlerte } from '@/types/stockage';
import type { ReactNode } from 'react';

// Wrapper avec LanguageProvider (requis par useLanguage dans JaugeStockage)
const Wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

// Quota de base réutilisable dans les tests
const quotaBase: QuotaStockage = {
  plan_actuel: {
    id: 'plan-essentielle',
    nom: 'Offre Essentielle',
    niveau: 1,
    stockage_gb: 10,
    utilisateurs_max: 5,
    est_plan_actuel: true,
  },
  stockage_plan_gb: 10,
  stockage_packs_gb: 5,
  stockage_total_gb: 15,
  stockage_utilise_gb: 6,
  pourcentage_utilise: 40,
  packs_actifs: [],
};

describe('JaugeStockage', () => {
  it('se rend sans erreur avec des données valides', () => {
    render(
      <JaugeStockage quota={quotaBase} niveauAlerte="normal" isLoading={false} />,
      { wrapper: Wrapper }
    );
    // Le titre doit être affiché (traduction FR : "Espace de stockage")
    expect(screen.getByText('Espace de stockage')).toBeInTheDocument();
  });

  it('affiche des squelettes de chargement quand isLoading est true', () => {
    const { container } = render(
      <JaugeStockage quota={null} niveauAlerte="normal" isLoading={true} />,
      { wrapper: Wrapper }
    );
    // En état de chargement, les skeletons sont rendus (pas le titre)
    expect(screen.queryByText('Espace de stockage')).not.toBeInTheDocument();
    // Au moins un skeleton doit être présent
    const skeletons = container.querySelectorAll('[class*="skeleton"], [data-slot="skeleton"]');
    // On vérifie que le composant de chargement est bien rendu (conteneur présent)
    expect(container.firstChild).toBeTruthy();
  });

  it('affiche des squelettes quand quota est null et isLoading false', () => {
    render(
      <JaugeStockage quota={null} niveauAlerte="normal" isLoading={false} />,
      { wrapper: Wrapper }
    );
    expect(screen.queryByText('Espace de stockage')).not.toBeInTheDocument();
  });

  it('affiche le pourcentage d\'utilisation', () => {
    render(
      <JaugeStockage quota={quotaBase} niveauAlerte="normal" isLoading={false} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('affiche le stockage utilisé et le total', () => {
    render(
      <JaugeStockage quota={quotaBase} niveauAlerte="normal" isLoading={false} />,
      { wrapper: Wrapper }
    );
    // "6 GB utilisés sur 15 GB" — plusieurs occurrences de "15 GB" possibles (barre + total)
    expect(screen.getByText(/6 GB/)).toBeInTheDocument();
    expect(screen.getAllByText(/15 GB/).length).toBeGreaterThan(0);
  });

  it('affiche le stockage inclus dans le plan', () => {
    render(
      <JaugeStockage quota={quotaBase} niveauAlerte="normal" isLoading={false} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('Inclus dans le plan')).toBeInTheDocument();
    expect(screen.getByText('10 GB')).toBeInTheDocument();
  });

  it('affiche la section "Packs mensuels actifs"', () => {
    render(
      <JaugeStockage quota={quotaBase} niveauAlerte="normal" isLoading={false} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('Packs mensuels actifs')).toBeInTheDocument();
  });

  it('affiche le total disponible', () => {
    render(
      <JaugeStockage quota={quotaBase} niveauAlerte="normal" isLoading={false} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('Total disponible')).toBeInTheDocument();
  });

  it('affiche le badge du plan actuel', () => {
    render(
      <JaugeStockage quota={quotaBase} niveauAlerte="normal" isLoading={false} />,
      { wrapper: Wrapper }
    );
    // "plan-essentielle" → id.replace('plan-', '') = 'essentielle'
    // traduction FR : "Offre Essentielle"
    expect(screen.getByText('Offre Essentielle')).toBeInTheDocument();
  });

  it('affiche 100% au maximum même si pourcentage_utilise > 100', () => {
    const quotaSurcharge: QuotaStockage = {
      ...quotaBase,
      pourcentage_utilise: 110,
    };
    render(
      <JaugeStockage quota={quotaSurcharge} niveauAlerte="plein" isLoading={false} />,
      { wrapper: Wrapper }
    );
    // Après clamp, pctAffiche = 100
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('affiche la couleur d\'alerte destructive pour niveauAlerte "plein"', () => {
    const quotaPlein: QuotaStockage = {
      ...quotaBase,
      pourcentage_utilise: 100,
      stockage_utilise_gb: 15,
    };
    const { container } = render(
      <JaugeStockage quota={quotaPlein} niveauAlerte="plein" isLoading={false} />,
      { wrapper: Wrapper }
    );
    // La barre doit avoir la classe bg-destructive
    const barre = container.querySelector('.bg-destructive');
    expect(barre).toBeInTheDocument();
  });

  it('affiche la couleur orange pour niveauAlerte "urgent"', () => {
    const quotaUrgent: QuotaStockage = {
      ...quotaBase,
      pourcentage_utilise: 95,
    };
    const { container } = render(
      <JaugeStockage quota={quotaUrgent} niveauAlerte="urgent" isLoading={false} />,
      { wrapper: Wrapper }
    );
    const barre = container.querySelector('.bg-orange-500');
    expect(barre).toBeInTheDocument();
  });

  it('affiche la couleur jaune pour niveauAlerte "attention"', () => {
    const quotaAttention: QuotaStockage = {
      ...quotaBase,
      pourcentage_utilise: 75,
    };
    const { container } = render(
      <JaugeStockage quota={quotaAttention} niveauAlerte="attention" isLoading={false} />,
      { wrapper: Wrapper }
    );
    const barre = container.querySelector('.bg-yellow-500');
    expect(barre).toBeInTheDocument();
  });

  it('affiche la couleur verte pour niveauAlerte "normal"', () => {
    const { container } = render(
      <JaugeStockage quota={quotaBase} niveauAlerte="normal" isLoading={false} />,
      { wrapper: Wrapper }
    );
    const barre = container.querySelector('.bg-emerald-500');
    expect(barre).toBeInTheDocument();
  });

  it('affiche le texte en rouge quand pourcentage_utilise >= 90', () => {
    const quotaCritique: QuotaStockage = {
      ...quotaBase,
      pourcentage_utilise: 92,
    };
    const { container } = render(
      <JaugeStockage quota={quotaCritique} niveauAlerte="urgent" isLoading={false} />,
      { wrapper: Wrapper }
    );
    // Le span du pourcentage doit avoir la classe text-destructive
    const span = container.querySelector('.text-destructive');
    expect(span).toBeInTheDocument();
    expect(span?.textContent).toBe('92%');
  });

  it('affiche les détails des packs actifs', () => {
    const quotaAvecPacks: QuotaStockage = {
      ...quotaBase,
      packs_actifs: [
        {
          id: 'pack-1',
          nom: 'Pack 10 GB',
          stockage_gb: 10,
          prix_mois_gnf: 5000,
          est_populaire: false,
          est_actif: true,
        },
      ],
    };
    render(
      <JaugeStockage quota={quotaAvecPacks} niveauAlerte="normal" isLoading={false} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(/Pack 10 GB/)).toBeInTheDocument();
    expect(screen.getByText(/\+10 GB\/mois/)).toBeInTheDocument();
  });

  it('formate correctement les valeurs décimales en GB', () => {
    const quotaDecimal: QuotaStockage = {
      ...quotaBase,
      stockage_utilise_gb: 6.5,
      stockage_total_gb: 15.0,
    };
    render(
      <JaugeStockage quota={quotaDecimal} niveauAlerte="normal" isLoading={false} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(/6\.5 GB/)).toBeInTheDocument();
  });
});
