// ═══════════════════════════════════════════════════════════════
// CollaboratorAvatar — Avatar collaborateur avec indicateur en ligne
// ═══════════════════════════════════════════════════════════════

import { cn } from '@/lib/utils';
import type { UserRef } from '@/types/documents';

interface CollaboratorAvatarProps {
  user: UserRef;
  color?: string;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<string, string> = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export function CollaboratorAvatar({
  user,
  color = '#6366f1',
  isOnline = false,
  size = 'md',
}: CollaboratorAvatarProps) {
  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={cn(
          'rounded-full flex items-center justify-center text-white font-bold',
          sizeClasses[size]
        )}
        style={{ backgroundColor: color }}
        title={`${user.prenom} ${user.nom}`}
      >
        {user.initiales}
      </div>
      {isOnline && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full bg-emerald-500 border border-background animate-pulse',
            size === 'sm' ? 'h-1.5 w-1.5' : size === 'md' ? 'h-2 w-2' : 'h-2.5 w-2.5'
          )}
        />
      )}
    </div>
  );
}
