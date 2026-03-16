// Tests pour le hook useAnnouncer
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnnouncer } from '@/hooks/useAnnouncer';

describe('useAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('le hook retourne une fonction announce', () => {
    const { result } = renderHook(() => useAnnouncer());
    expect(typeof result.current.announce).toBe('function');
  });

  it('après announce(), un élément aria-live="polite" existe dans le DOM', () => {
    renderHook(() => useAnnouncer());
    const el = document.querySelector('[aria-live="polite"]');
    expect(el).not.toBeNull();
  });

  it('après announce() et avancement des timers, le live region contient le message', () => {
    const { result } = renderHook(() => useAnnouncer());

    act(() => {
      result.current.announce('message test');
    });

    // Le hook utilise un setTimeout de 50 ms
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const el = document.querySelector('[aria-live="polite"]');
    expect(el?.textContent).toBe('message test');
  });

  it('avant l\'expiration du délai, le contenu est vide', () => {
    const { result } = renderHook(() => useAnnouncer());

    act(() => {
      result.current.announce('message en attente');
    });

    // Pas encore avancé les timers → textContent doit être vide
    const el = document.querySelector('[aria-live="polite"]');
    expect(el?.textContent).toBe('');
  });

  it('l\'élément aria-live est supprimé du DOM au démontage du composant', () => {
    const { unmount } = renderHook(() => useAnnouncer());
    expect(document.querySelector('[aria-live="polite"]')).not.toBeNull();

    unmount();

    expect(document.querySelector('[aria-live="polite"]')).toBeNull();
  });

  it('l\'élément possède role="status" et aria-atomic="true"', () => {
    renderHook(() => useAnnouncer());
    const el = document.querySelector('[aria-live="polite"]');
    expect(el?.getAttribute('role')).toBe('status');
    expect(el?.getAttribute('aria-atomic')).toBe('true');
  });
});
