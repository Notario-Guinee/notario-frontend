import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Client, TypeClient } from '@/types/client';

interface ClientCardProps {
  client: Client;
}

const typeConfig: Record<TypeClient, { label: string; className: string }> = {
  PARTICULIER: {
    label: 'Particulier',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  },
  ENTREPRISE: {
    label: 'Entreprise',
    className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
};

function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

export function ClientCard({ client }: ClientCardProps) {
  const type = typeConfig[client.typeClient];
  const initials = getInitials(client.nom, client.prenom);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {client.prenom} {client.nom}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {format(parseISO(client.createdAt), 'd MMM yyyy', { locale: fr })}
          </p>
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', type.className)}>
          {type.label}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{client.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span>{client.telephone}</span>
        </div>
      </div>
    </div>
  );
}
