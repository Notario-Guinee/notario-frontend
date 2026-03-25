import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { FocusTrap } from "@/components/ui/focus-trap";

describe("FocusTrap", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("rend les enfants normalement quand active={false}", () => {
    render(
      <FocusTrap active={false}>
        <button>Premier bouton</button>
        <button>Second bouton</button>
      </FocusTrap>
    );
    expect(screen.getByText("Premier bouton")).toBeInTheDocument();
    expect(screen.getByText("Second bouton")).toBeInTheDocument();
  });

  it("rend les enfants normalement avec la valeur par défaut (active=true)", () => {
    render(
      <FocusTrap>
        <button>Bouton défaut</button>
      </FocusTrap>
    );
    expect(screen.getByText("Bouton défaut")).toBeInTheDocument();
  });

  it("donne le focus au premier élément focusable quand active={true}", () => {
    render(
      <FocusTrap active={true}>
        <button>Bouton A</button>
        <button>Bouton B</button>
      </FocusTrap>
    );
    const btnA = screen.getByText("Bouton A");
    expect(document.activeElement).toBe(btnA);
  });

  it("ne donne pas le focus automatiquement quand active={false}", () => {
    render(
      <FocusTrap active={false}>
        <button>Bouton inactif</button>
      </FocusTrap>
    );
    const btn = screen.getByText("Bouton inactif");
    // Le focus ne doit pas avoir été donné automatiquement au bouton
    expect(document.activeElement).not.toBe(btn);
  });

  it("rend le conteneur div wrappant les enfants", () => {
    const { container } = render(
      <FocusTrap active={false}>
        <span data-testid="enfant">Contenu</span>
      </FocusTrap>
    );
    // Le FocusTrap rend toujours un div conteneur
    expect(container.firstChild?.nodeName).toBe("DIV");
    expect(screen.getByTestId("enfant")).toBeInTheDocument();
  });
});
