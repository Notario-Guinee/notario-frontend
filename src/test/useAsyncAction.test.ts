// ═══════════════════════════════════════════════════════════════
// Tests du hook useAsyncAction
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsyncAction } from '@/hooks/useAsyncAction';

// Mock de sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Import après mock pour avoir les références mockées
import { toast } from 'sonner';

describe('useAsyncAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loading est false initialement', () => {
    const { result } = renderHook(() => useAsyncAction());
    expect(result.current.loading).toBe(false);
  });

  it('error est null initialement', () => {
    const { result } = renderHook(() => useAsyncAction());
    expect(result.current.error).toBeNull();
  });

  it('loading passe à true pendant l\'exécution de run()', async () => {
    let resolveAction!: () => void;
    const slowAction = () =>
      new Promise<void>((resolve) => {
        resolveAction = resolve;
      });

    const { result } = renderHook(() => useAsyncAction());

    let runPromise: Promise<void | undefined>;
    act(() => {
      runPromise = result.current.run(slowAction) as Promise<void | undefined>;
    });

    // loading doit être true pendant que l'action est en cours
    expect(result.current.loading).toBe(true);

    // Résoudre l'action
    await act(async () => {
      resolveAction();
      await runPromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('loading revient à false après succès', async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await result.current.run(async () => 'ok');
    });

    expect(result.current.loading).toBe(false);
  });

  it('loading revient à false après échec', async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await result.current.run(async () => {
        throw new Error('échec');
      });
    });

    expect(result.current.loading).toBe(false);
  });

  it('toast.error est appelé en cas d\'erreur', async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await result.current.run(async () => {
        throw new Error('Erreur réseau');
      });
    });

    expect(toast.error).toHaveBeenCalledWith('Erreur réseau');
  });

  it('error contient le message d\'erreur après échec', async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await result.current.run(async () => {
        throw new Error('Erreur inattendue');
      });
    });

    expect(result.current.error).toBe('Erreur inattendue');
  });

  it('error contient le message personnalisé si errorMessage est fourni', async () => {
    const { result } = renderHook(() =>
      useAsyncAction({ errorMessage: 'Message personnalisé' })
    );

    await act(async () => {
      await result.current.run(async () => {
        throw new Error('Erreur originale');
      });
    });

    expect(result.current.error).toBe('Message personnalisé');
    expect(toast.error).toHaveBeenCalledWith('Message personnalisé');
  });

  it('reset() remet error à null', async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await result.current.run(async () => {
        throw new Error('Erreur');
      });
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
  });

  it('toast.success est appelé avec successMessage en cas de succès', async () => {
    const { result } = renderHook(() =>
      useAsyncAction({ successMessage: 'Opération réussie' })
    );

    await act(async () => {
      await result.current.run(async () => 'résultat');
    });

    expect(toast.success).toHaveBeenCalledWith('Opération réussie');
  });

  it('toast.success n\'est pas appelé sans successMessage', async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await result.current.run(async () => 'résultat');
    });

    expect(toast.success).not.toHaveBeenCalled();
  });

  it('run() retourne la valeur de l\'action en cas de succès', async () => {
    const { result } = renderHook(() => useAsyncAction());

    let valeur: string | undefined;
    await act(async () => {
      valeur = await result.current.run(async () => 'ma-valeur');
    });

    expect(valeur).toBe('ma-valeur');
  });

  it('run() retourne undefined en cas d\'erreur', async () => {
    const { result } = renderHook(() => useAsyncAction());

    let valeur: unknown;
    await act(async () => {
      valeur = await result.current.run(async () => {
        throw new Error('boom');
      });
    });

    expect(valeur).toBeUndefined();
  });

  it('gère les erreurs non-Error (string throw)', async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await result.current.run(async () => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw 'Erreur string';
      });
    });

    expect(result.current.error).toBe('Erreur string');
    expect(toast.error).toHaveBeenCalledWith('Erreur string');
  });
});
