// Tests pour le composant EmptyState
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/ui/empty-state';
import type { LucideIcon } from 'lucide-react';

// Icône factice compatible LucideIcon pour les tests
const FakeIcon: LucideIcon = (props) => <svg data-testid="empty-state-icon" {...props} />;
// @ts-expect-error — les propriétés statiques de LucideIcon ne sont pas nécessaires dans les tests
FakeIcon.displayName = 'FakeIcon';

describe('EmptyState', () => {
  it('affiche le title, description et icône quand tous les props sont fournis', () => {
    render(
      <EmptyState
        icon={FakeIcon}
        title="Aucun dossier"
        description="Créez votre premier dossier pour commencer."
      />
    );

    expect(screen.getByText('Aucun dossier')).toBeInTheDocument();
    expect(screen.getByText('Créez votre premier dossier pour commencer.')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();
  });

  it('sans description → aucun élément de description dans le DOM', () => {
    render(<EmptyState title="Aucun résultat" />);

    expect(screen.getByText('Aucun résultat')).toBeInTheDocument();
    // Pas de paragraphe de description
    expect(screen.queryByRole('paragraph')).toBeNull();
    // Vérifie aussi par texte connu
    expect(screen.queryByText(/créez/i)).toBeNull();
  });

  it('sans icon → pas d\'icône dans le DOM', () => {
    render(<EmptyState title="Aucun élément" />);
    expect(screen.queryByTestId('empty-state-icon')).toBeNull();
  });

  it('avec action → le bouton s\'affiche avec le bon label', () => {
    render(
      <EmptyState
        title="Aucun client"
        action={<button>Ajouter un client</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Ajouter un client' })).toBeInTheDocument();
  });

  it('clic sur le bouton action → le callback est appelé', () => {
    const handleClick = vi.fn();

    render(
      <EmptyState
        title="Aucune facture"
        action={<button onClick={handleClick}>Créer une facture</button>}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Créer une facture' }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('sans action → aucun bouton dans le DOM', () => {
    render(<EmptyState title="Vide" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('le titre est rendu dans un h3', () => {
    render(<EmptyState title="Mon titre vide" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Mon titre vide' })).toBeInTheDocument();
  });
});
