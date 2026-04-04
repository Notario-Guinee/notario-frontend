// ═══════════════════════════════════════════════════════════════
// InfiniteListLayout — Mise en page générique pour les listes infinies
// En-tête : titre, icône, compteur total, actions
// Barre : recherche + filtres personnalisables
// Grille : squelettes, état vide, données, pagination infinie
// ═══════════════════════════════════════════════════════════════

import { type RefObject } from 'react';
import { Search, SearchX, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface InfiniteListLayoutProps {
  title: string;
  icon: React.ReactNode;
  totalElements?: number;
  searchPlaceholder: string;
  search: string;
  onSearchChange: (v: string) => void;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isEmpty: boolean;
  emptyMessage: string;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  skeletonCount?: number;
  skeletonNextCount?: number;
  renderSkeleton: () => React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
}

export function InfiniteListLayout({
  title,
  icon,
  totalElements,
  searchPlaceholder,
  search,
  onSearchChange,
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  emptyMessage,
  isFetchingNextPage,
  hasNextPage,
  sentinelRef,
  skeletonCount = 6,
  skeletonNextCount = 3,
  renderSkeleton,
  children,
  actions,
  filters,
}: InfiniteListLayoutProps) {
  const { t, lang } = useLanguage();
  const locale = lang === 'EN' ? 'en-GB' : 'fr-FR';
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">{title}</h1>
            {totalElements !== undefined && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalElements.toLocaleString(locale)} {totalElements > 1 ? t('list.items') : t('list.item')}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {filters}
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage ?? t('list.loadError')}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className={cn('grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i}>{renderSkeleton()}</div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground rounded-xl border border-border bg-card">
          {search ? (
            <>
              <SearchX className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">{t('list.noResultsFor')} « {search} »</p>
              <p className="text-xs mt-1 opacity-70">{t('list.noResultsHint')}</p>
            </>
          ) : (
            <>
              <Search className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">{emptyMessage}</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {children}
          </div>
          {isFetchingNextPage && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: skeletonNextCount }).map((_, i) => (
                <div key={i}>{renderSkeleton()}</div>
              ))}
            </div>
          )}
          <div ref={sentinelRef} aria-hidden="true" className="h-4" />
          {!hasNextPage && totalElements !== undefined && (
            <p className="text-center text-xs text-muted-foreground py-4">
              {totalElements.toLocaleString(locale)} {totalElements > 1 ? t('list.items') : t('list.item')}
            </p>
          )}
        </>
      )}
    </div>
  );
}
