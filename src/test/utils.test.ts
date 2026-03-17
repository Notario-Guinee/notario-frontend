// ═══════════════════════════════════════════════════════════════
// Tests unitaires pour les utilitaires de src/lib/utils.ts
// Couvre : cn (fusion de classes CSS Tailwind) et searchMatch
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { cn, searchMatch, norm } from "@/lib/utils";

// ─── cn ──────────────────────────────────────────────────────────

describe("cn", () => {
  it("fusionne des classes simples", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignore les valeurs falsy (undefined, null, false)", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar");
  });

  it("gère les classes conditionnelles via un objet", () => {
    expect(cn({ active: true, hidden: false })).toBe("active");
  });

  it("gère les classes conditionnelles mixées avec des chaînes", () => {
    expect(cn("base", { extra: true, skip: false })).toBe("base extra");
  });

  it("résout les conflits Tailwind — la dernière classe gagne", () => {
    // twMerge doit fusionner p-2 et p-4 en gardant p-4
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("résout les conflits Tailwind sur text-color", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("résout les conflits sur bg-color", () => {
    expect(cn("bg-white", "bg-black")).toBe("bg-black");
  });

  it("fusionne des variants conditionnels Tailwind", () => {
    const result = cn("px-2 py-1", { "px-4": true });
    // px-4 doit remplacer px-2 ; py-1 reste — twMerge peut réordonner
    expect(result).toContain("py-1");
    expect(result).toContain("px-4");
    expect(result).not.toContain("px-2");
  });

  it("retourne une chaîne vide si aucun argument", () => {
    expect(cn()).toBe("");
  });

  it("retourne une chaîne vide si tous les arguments sont falsy", () => {
    expect(cn(undefined, null, false)).toBe("");
  });

  it("préserve les classes non-conflictuelles", () => {
    const result = cn("flex", "items-center", "gap-2", "rounded");
    expect(result).toBe("flex items-center gap-2 rounded");
  });

  it("gère les tableaux de classes", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("fusionne des classes d'état hover/focus sans conflit", () => {
    expect(cn("hover:bg-gray-100", "focus:outline-none")).toBe(
      "hover:bg-gray-100 focus:outline-none"
    );
  });
});

// ─── norm ────────────────────────────────────────────────────────

describe("norm", () => {
  it("met en minuscules", () => {
    expect(norm("ABC")).toBe("abc");
  });

  it("supprime les espaces", () => {
    expect(norm("hello world")).toBe("helloworld");
  });

  it("combine les deux transformations", () => {
    expect(norm("Hello World")).toBe("helloworld");
  });

  it("laisse une chaîne vide inchangée", () => {
    expect(norm("")).toBe("");
  });
});

// ─── searchMatch ─────────────────────────────────────────────────

describe("searchMatch", () => {
  it("retourne true si needle est contenu dans haystack (même casse)", () => {
    expect(searchMatch("Dupont", "du")).toBe(true);
  });

  it("est insensible à la casse", () => {
    expect(searchMatch("Dupont", "DUP")).toBe(true);
    expect(searchMatch("MARTIN", "martin")).toBe(true);
  });

  it("ignore les espaces dans la correspondance", () => {
    expect(searchMatch("Jean Dupont", "jeandupont")).toBe(true);
    expect(searchMatch("JeanDupont", "jean dupont")).toBe(true);
  });

  it("retourne false si needle n'est pas dans haystack", () => {
    expect(searchMatch("Dupont", "Martin")).toBe(false);
  });

  it("retourne true si needle est une chaîne vide", () => {
    // "" est contenu dans toute chaîne
    expect(searchMatch("quelquechose", "")).toBe(true);
  });

  it("retourne true si haystack et needle sont identiques", () => {
    expect(searchMatch("notario", "notario")).toBe(true);
  });
});
