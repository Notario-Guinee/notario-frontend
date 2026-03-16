// Tests pour stockageService
// L'état du service est mutable (module-level). Pour obtenir un état frais
// à chaque test, on réinitialise le registre de modules avec vi.resetModules()
// et on re-importe le service dynamiquement dans chaque beforeEach.

import { describe, it, expect, beforeEach, vi } from 'vitest';

// On déclare le type pour typer le module réimporté dynamiquement
type StockageService = typeof import('@/services/stockageService');

// Accélère les appels : on remplace attendre() en mockant setTimeout globalement
// via vi.useFakeTimers pour ne pas attendre 800 ms réels.

describe('stockageService', () => {
  let service: StockageService;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    // Import dynamique après resetModules → état reparti à zéro
    const mod = await import('@/services/stockageService');
    service = mod;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Utilitaire : résout toutes les Promises + avance les timers jusqu'à la résolution
  async function flush() {
    await vi.runAllTimersAsync();
  }

  // ─── getQuotaCabinet ───────────────────────────────────────────

  describe('getQuotaCabinet()', () => {
    it('retourne un objet avec plan_actuel, stockage_utilise_gb et stockage_total_gb', async () => {
      const promise = service.getQuotaCabinet();
      await flush();
      const quota = await promise;

      expect(quota).toHaveProperty('plan_actuel');
      expect(quota.plan_actuel).toBeDefined();
      expect(quota).toHaveProperty('stockage_utilise_gb');
      expect(quota).toHaveProperty('stockage_total_gb');
      expect(typeof quota.stockage_utilise_gb).toBe('number');
      expect(typeof quota.stockage_total_gb).toBe('number');
    });

    it('le plan_actuel est le plan Professionnelle par défaut', async () => {
      const promise = service.getQuotaCabinet();
      await flush();
      const quota = await promise;

      expect(quota.plan_actuel.est_plan_actuel).toBe(true);
      expect(quota.plan_actuel.id).toBe('plan-professionnelle');
    });

    it('aucun pack actif par défaut → stockage_packs_gb = 0', async () => {
      const promise = service.getQuotaCabinet();
      await flush();
      const quota = await promise;

      expect(quota.stockage_packs_gb).toBe(0);
      expect(quota.packs_actifs).toHaveLength(0);
    });
  });

  // ─── getPacksDisponibles ───────────────────────────────────────

  describe('getPacksDisponibles()', () => {
    it('retourne un tableau de packs', async () => {
      const promise = service.getPacksDisponibles();
      await flush();
      const packs = await promise;

      expect(Array.isArray(packs)).toBe(true);
      expect(packs.length).toBeGreaterThan(0);
    });

    it('les packs attendus (50/100/200/300/500 GB) sont présents', async () => {
      const promise = service.getPacksDisponibles();
      await flush();
      const packs = await promise;

      const ids = packs.map(p => p.id);
      expect(ids).toContain('pack-50');
      expect(ids).toContain('pack-100');
      expect(ids).toContain('pack-200');
      expect(ids).toContain('pack-300');
      expect(ids).toContain('pack-500');
    });

    it('aucun pack n\'est actif dans l\'état initial', async () => {
      const promise = service.getPacksDisponibles();
      await flush();
      const packs = await promise;

      expect(packs.every(p => !p.est_actif)).toBe(true);
    });
  });

  // ─── souscrirePack ─────────────────────────────────────────────

  describe('souscrirePack(id) — souscription réussie', () => {
    it('souscription à pack-100 → le pack devient actif', async () => {
      const promise = service.souscrirePack('pack-100');
      await flush();
      const pack = await promise;

      expect(pack.id).toBe('pack-100');
      expect(pack.est_actif).toBe(true);
    });

    it('après souscription, getPacksDisponibles() reflète l\'état actif', async () => {
      const p1 = service.souscrirePack('pack-200');
      await flush();
      await p1;

      const p2 = service.getPacksDisponibles();
      await flush();
      const packs = await p2;

      const pack200 = packs.find(p => p.id === 'pack-200');
      expect(pack200?.est_actif).toBe(true);
    });
  });

  describe('souscrirePack(id) — rétrogradation interdite', () => {
    it('tenter pack-50 après avoir souscrit pack-100 → lève une erreur', async () => {
      // Souscrire pack-100 d'abord
      const p1 = service.souscrirePack('pack-100');
      await flush();
      await p1;

      // Tenter de rétrograder vers pack-50
      let errorThrown: Error | null = null;
      try {
        const p2 = service.souscrirePack('pack-50');
        await flush();
        await p2;
      } catch (err) {
        errorThrown = err as Error;
      }

      expect(errorThrown).not.toBeNull();
      expect(errorThrown!.message).toMatch(/rétrogradation/i);
    });
  });

  describe('souscrirePack(id) — switching automatique', () => {
    it('souscription à un pack plus grand → l\'ancien pack est désactivé', async () => {
      // Activer pack-100
      const p1 = service.souscrirePack('pack-100');
      await flush();
      await p1;

      // Passer à pack-300 (plus grand)
      const p2 = service.souscrirePack('pack-300');
      await flush();
      await p2;

      // Vérifier l'état final
      const p3 = service.getPacksDisponibles();
      await flush();
      const packs = await p3;

      const pack100 = packs.find(p => p.id === 'pack-100');
      const pack300 = packs.find(p => p.id === 'pack-300');

      expect(pack100?.est_actif).toBe(false);
      expect(pack300?.est_actif).toBe(true);
    });
  });

  // ─── resilierPack ──────────────────────────────────────────────

  describe('resilierPack(id)', () => {
    it('après souscription, la résiliation programme resiliation_programmee = true', async () => {
      // Souscrire
      const p1 = service.souscrirePack('pack-200');
      await flush();
      await p1;

      // Résilier
      const p2 = service.resilierPack('pack-200');
      await flush();
      const resultat = await p2;

      expect(resultat.succes).toBe(true);

      // Vérifier que le flag est bien positionné dans la liste
      const p3 = service.getPacksDisponibles();
      await flush();
      const packs = await p3;

      const pack200 = packs.find(p => p.id === 'pack-200');
      expect(pack200?.resiliation_programmee).toBe(true);
    });

    it('résilier un pack inactif retourne succes = false', async () => {
      const p1 = service.resilierPack('pack-50');
      await flush();
      const resultat = await p1;

      expect(resultat.succes).toBe(false);
    });
  });
});
