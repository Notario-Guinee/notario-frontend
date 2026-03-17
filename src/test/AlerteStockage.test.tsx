// ═══════════════════════════════════════════════════════════════
// Tests du composant AlerteStockage
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlerteStockage } from '@/components/stockage/AlerteStockage';
import { LanguageProvider } from '@/context/LanguageContext';
import type { QuotaStockage } from '@/types/stockage';
import type { ReactNode } from 'react';

// Wrapper avec LanguageProvider (requis par useLanguage dans AlerteStockage)
const Wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

// Quota de base réutilisable
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

describe('AlerteStockage', () => {
  it('n\'affiche rien si niveauAlerte est "normal"', () => {
    const { container } = render(
      <AlerteStockage
        niveauAlerte="normal"
        quota={quotaBase}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    expect(container.firstChild).toBeNull();
  });

  it('n\'affiche rien si quota est null', () => {
    const { container } = render(
      <AlerteStockage
        niveauAlerte="attention"
        quota={null}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    expect(container.firstChild).toBeNull();
  });

  it('affiche un bandeau pour niveauAlerte "attention"', () => {
    const quotaAttention: QuotaStockage = {
      ...quotaBase,
      pourcentage_utilise: 75,
    };
    render(
      <AlerteStockage
        niveauAlerte="attention"
        quota={quotaAttention}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    // Titre : "75% — Stockage faible"
    expect(screen.getByText(/Stockage faible/)).toBeInTheDocument();
  });

  it('affiche le sous-titre pour niveauAlerte "attention"', () => {
    const quotaAttention: QuotaStockage = {
      ...quotaBase,
      pourcentage_utilise: 75,
    };
    render(
      <AlerteStockage
        niveauAlerte="attention"
        quota={quotaAttention}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    expect(
      screen.getByText("Il vous reste moins de 20% de votre espace disponible.")
    ).toBeInTheDocument();
  });

  it('affiche un bandeau pour niveauAlerte "urgent"', () => {
    const quotaUrgent: QuotaStockage = {
      ...quotaBase,
      stockage_total_gb: 15,
      stockage_utilise_gb: 13.5,
      pourcentage_utilise: 90,
    };
    render(
      <AlerteStockage
        niveauAlerte="urgent"
        quota={quotaUrgent}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    // Titre : "1.5 GB — Stockage faible"
    expect(screen.getByText(/Stockage faible/)).toBeInTheDocument();
    expect(screen.getByText(/1\.5 GB/)).toBeInTheDocument();
  });

  it('affiche le sous-titre critique pour niveauAlerte "urgent"', () => {
    const quotaUrgent: QuotaStockage = {
      ...quotaBase,
      stockage_total_gb: 15,
      stockage_utilise_gb: 13.5,
      pourcentage_utilise: 90,
    };
    render(
      <AlerteStockage
        niveauAlerte="urgent"
        quota={quotaUrgent}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    expect(
      screen.getByText("Votre espace est saturé. Ajoutez un pack immédiatement.")
    ).toBeInTheDocument();
  });

  it('affiche un bandeau pour niveauAlerte "plein"', () => {
    const quotaPlein: QuotaStockage = {
      ...quotaBase,
      pourcentage_utilise: 100,
      stockage_utilise_gb: 15,
    };
    render(
      <AlerteStockage
        niveauAlerte="plein"
        quota={quotaPlein}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('Stockage critique')).toBeInTheDocument();
  });

  it('affiche le sous-titre critique pour niveauAlerte "plein"', () => {
    const quotaPlein: QuotaStockage = {
      ...quotaBase,
      pourcentage_utilise: 100,
      stockage_utilise_gb: 15,
    };
    render(
      <AlerteStockage
        niveauAlerte="plein"
        quota={quotaPlein}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    expect(
      screen.getByText("Votre espace est saturé. Ajoutez un pack immédiatement.")
    ).toBeInTheDocument();
  });

  it('affiche le bouton "Ajouter du stockage" quand une alerte est active', () => {
    render(
      <AlerteStockage
        niveauAlerte="attention"
        quota={quotaBase}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    expect(
      screen.getByRole('button', { name: /Ajouter du stockage/i })
    ).toBeInTheDocument();
  });

  it('appelle onAjouterStockage au clic sur le bouton', () => {
    const onAjouter = vi.fn();
    render(
      <AlerteStockage
        niveauAlerte="attention"
        quota={quotaBase}
        onAjouterStockage={onAjouter}
      />,
      { wrapper: Wrapper }
    );
    screen.getByRole('button', { name: /Ajouter du stockage/i }).click();
    expect(onAjouter).toHaveBeenCalledOnce();
  });

  it('le bouton "Ajouter du stockage" est absent en mode "normal"', () => {
    const { container } = render(
      <AlerteStockage
        niveauAlerte="normal"
        quota={quotaBase}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('affiche le bouton pour niveauAlerte "urgent"', () => {
    const quotaUrgent: QuotaStockage = {
      ...quotaBase,
      stockage_utilise_gb: 13.5,
      pourcentage_utilise: 90,
    };
    render(
      <AlerteStockage
        niveauAlerte="urgent"
        quota={quotaUrgent}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    expect(
      screen.getByRole('button', { name: /Ajouter du stockage/i })
    ).toBeInTheDocument();
  });

  it('affiche le bouton pour niveauAlerte "plein"', () => {
    const quotaPlein: QuotaStockage = {
      ...quotaBase,
      pourcentage_utilise: 100,
      stockage_utilise_gb: 15,
    };
    render(
      <AlerteStockage
        niveauAlerte="plein"
        quota={quotaPlein}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    expect(
      screen.getByRole('button', { name: /Ajouter du stockage/i })
    ).toBeInTheDocument();
  });

  it('applique les classes visuelles jaunes pour niveauAlerte "attention"', () => {
    const { container } = render(
      <AlerteStockage
        niveauAlerte="attention"
        quota={quotaBase}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    const bandeau = container.firstChild as HTMLElement;
    expect(bandeau.className).toMatch(/yellow/);
  });

  it('applique les classes visuelles orange pour niveauAlerte "urgent"', () => {
    const quotaUrgent: QuotaStockage = {
      ...quotaBase,
      stockage_utilise_gb: 13.5,
      pourcentage_utilise: 90,
    };
    const { container } = render(
      <AlerteStockage
        niveauAlerte="urgent"
        quota={quotaUrgent}
        onAjouterStockage={vi.fn()}
      />,
      { wrapper: Wrapper }
    );
    const bandeau = container.firstChild as HTMLElement;
    expect(bandeau.className).toMatch(/orange/);
  });
});
