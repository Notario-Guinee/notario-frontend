import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Composant enfant normal
const NormalChild = () => <div>Contenu normal</div>;

// Composant enfant qui lève une erreur
const ThrowingChild = () => {
  throw new Error("test error");
  return null;
};

describe("ErrorBoundary", () => {
  // Supprimer le bruit console.error durant les tests d'erreur
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("rend les enfants normaux sans erreur", () => {
    render(
      <ErrorBoundary>
        <NormalChild />
      </ErrorBoundary>
    );
    expect(screen.getByText("Contenu normal")).toBeInTheDocument();
  });

  it("affiche le fallback UI quand un enfant lève une erreur", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    // L'enfant ne doit pas s'afficher
    expect(screen.queryByText("Contenu normal")).not.toBeInTheDocument();
    // Le fallback doit s'afficher
    expect(
      screen.getByText("Une erreur inattendue s'est produite")
    ).toBeInTheDocument();
  });

  it("le fallback affiche le message d'erreur", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText("test error")).toBeInTheDocument();
  });

  it("le fallback contient un bouton Rafraîchir", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    const btn = screen.getByRole("button", { name: /rafraîchir/i });
    expect(btn).toBeInTheDocument();
  });
});
