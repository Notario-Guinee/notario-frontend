import { describe, it, expect } from "vitest";
import { translations } from "@/i18n/translations";

const FR = translations.FR;
const EN = translations.EN;

const frKeys = Object.keys(FR);
const enKeys = Object.keys(EN);

describe("translations — parité FR / EN", () => {
  it("FR et EN ont exactement le même nombre de clés", () => {
    expect(frKeys.length).toBe(enKeys.length);
  });

  it("toutes les clés de FR existent dans EN", () => {
    const missingInEN = frKeys.filter((key) => !(key in EN));
    expect(missingInEN).toEqual([]);
  });

  it("toutes les clés de EN existent dans FR", () => {
    const missingInFR = enKeys.filter((key) => !(key in FR));
    expect(missingInFR).toEqual([]);
  });

  it("aucune valeur n'est une chaîne vide dans FR", () => {
    const emptyKeys = frKeys.filter((key) => FR[key].trim() === "");
    expect(emptyKeys).toEqual([]);
  });

  it("aucune valeur n'est une chaîne vide dans EN", () => {
    const emptyKeys = enKeys.filter((key) => EN[key].trim() === "");
    expect(emptyKeys).toEqual([]);
  });
});
