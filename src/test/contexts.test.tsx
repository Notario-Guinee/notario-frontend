// ═══════════════════════════════════════════════════════════════
// Tests des Context Providers : Theme, Language, Role
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { RoleProvider, useRole } from '@/context/RoleContext';

// ── ThemeContext ─────────────────────────────────────────────────

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('le thème par défaut est "light" quand localStorage est vide', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    expect(result.current.theme).toBe('light');
  });

  it('lit le thème depuis localStorage si déjà défini', () => {
    localStorage.setItem('notario-theme', 'dark');
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    expect(result.current.theme).toBe('dark');
  });

  it('toggleTheme bascule de light vers dark', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    expect(result.current.theme).toBe('light');
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');
  });

  it('toggleTheme bascule de dark vers light', () => {
    localStorage.setItem('notario-theme', 'dark');
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');
  });

  it('le thème est exposé correctement via useTheme()', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    expect(result.current).toHaveProperty('theme');
    expect(result.current).toHaveProperty('toggleTheme');
    expect(typeof result.current.toggleTheme).toBe('function');
  });

  it('applique la classe CSS sur document.documentElement', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    // Après mount le useEffect s'exécute et ajoute la classe
    expect(document.documentElement.classList.contains(result.current.theme)).toBe(true);
  });
});

// ── LanguageContext ──────────────────────────────────────────────

describe('LanguageContext', () => {
  it('la langue par défaut est "FR"', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });
    expect(result.current.lang).toBe('FR');
  });

  it('setLang("EN") change la langue en EN', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });
    act(() => {
      result.current.setLang('EN');
    });
    expect(result.current.lang).toBe('EN');
  });

  it('t("key_inexistante") retourne la clé elle-même (fallback)', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });
    expect(result.current.t('key_inexistante')).toBe('key_inexistante');
  });

  it('t("factures.title") retourne la valeur FR correspondante', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });
    expect(result.current.t('factures.title')).toBe('Factures');
  });

  it('t retourne la traduction EN après changement de langue', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });
    act(() => {
      result.current.setLang('EN');
    });
    expect(result.current.t('factures.title')).toBe('Invoices');
  });

  it('expose bien lang, setLang et t', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });
    expect(result.current).toHaveProperty('lang');
    expect(result.current).toHaveProperty('setLang');
    expect(result.current).toHaveProperty('t');
  });
});

// ── RoleContext ──────────────────────────────────────────────────

describe('RoleContext', () => {
  it('le rôle par défaut est "gerant"', () => {
    const { result } = renderHook(() => useRole(), {
      wrapper: RoleProvider,
    });
    expect(result.current.role).toBe('gerant');
  });

  it('isGerant est true par défaut', () => {
    const { result } = renderHook(() => useRole(), {
      wrapper: RoleProvider,
    });
    expect(result.current.isGerant).toBe(true);
    expect(result.current.isAdminGlobal).toBe(false);
  });

  it('setRole("admin_global") change le rôle', () => {
    const { result } = renderHook(() => useRole(), {
      wrapper: RoleProvider,
    });
    act(() => {
      result.current.setRole('admin_global');
    });
    expect(result.current.role).toBe('admin_global');
  });

  it('isAdminGlobal est true après setRole("admin_global")', () => {
    const { result } = renderHook(() => useRole(), {
      wrapper: RoleProvider,
    });
    act(() => {
      result.current.setRole('admin_global');
    });
    expect(result.current.isAdminGlobal).toBe(true);
    expect(result.current.isGerant).toBe(false);
  });

  it('useRole lance une erreur hors du Provider', () => {
    // Silence React's console.error output for expected error boundaries
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useRole())).toThrow(
      'useRole must be inside RoleProvider'
    );
    spy.mockRestore();
  });
});
