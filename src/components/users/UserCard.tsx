import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { User, UserRole } from '@/types/user';

interface UserCardProps {
  user: User;
}

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  NOTAIRE: {
    label: 'Notaire',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  CLERC: {
    label: 'Clerc',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  STAGIAIRE: {
    label: 'Stagiaire',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  ADMIN: {
    label: 'Admin',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

export function UserCard({ user }: UserCardProps) {
  const role = roleConfig[user.role];
  const initials = getInitials(user.nom, user.prenom);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {user.prenom} {user.nom}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', role.className)}>
          {role.label}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', user.actif ? 'bg-emerald-500' : 'bg-gray-400')} />
          {user.actif ? 'Actif' : 'Inactif'}
        </span>
        <span>{format(parseISO(user.createdAt), 'd MMM yyyy', { locale: fr })}</span>
      </div>
    </div>
  );
}
