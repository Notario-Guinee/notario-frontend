// ═══════════════════════════════════════════════════════════════
// DocumentKPICard — Carte KPI pour le module documents
// ═══════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DocumentKPICardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color?: 'primary' | 'success' | 'warning' | 'secondary';
  subtitle?: string;
}

const colorClasses: Record<string, { icon: string; bg: string }> = {
  primary: {
    icon: 'text-primary',
    bg: 'bg-primary/10',
  },
  success: {
    icon: 'text-success',
    bg: 'bg-success/10',
  },
  warning: {
    icon: 'text-warning',
    bg: 'bg-warning/10',
  },
  secondary: {
    icon: 'text-secondary-foreground',
    bg: 'bg-secondary',
  },
};

export function DocumentKPICard({
  title,
  value,
  icon: Icon,
  color = 'primary',
  subtitle,
}: DocumentKPICardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-card border border-border rounded-xl p-4 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">
            {title}
          </p>
          <p className="mt-1.5 font-heading text-2xl font-bold text-foreground leading-none">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        <div className={cn('rounded-lg p-2 shrink-0', colors.bg)}>
          <Icon className={cn('h-5 w-5', colors.icon)} />
        </div>
      </div>
    </motion.div>
  );
}
