import { useQuery } from '@tanstack/react-query';
import {
  getGlobalStats,
  getKPIs,
  getDashboardUser,
  getRecentNotifications,
  getActiveAlerts,
  type DashboardUser,
  type GlobalStats,
  type Notification,
} from '@/api/dashboard';

export function useGlobalStats() {
  return useQuery<GlobalStats>({
    queryKey: ['dashboard', 'global-stats'],
    queryFn: getGlobalStats,
    staleTime: 2 * 60 * 1000,
  });
}

export function useKPIs() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: getKPIs,
    staleTime: 2 * 60 * 1000,
  });
}

export function useDashboardUser(userId: number | undefined) {
  return useQuery<DashboardUser>({
    queryKey: ['dashboard', 'user', userId],
    queryFn: () => getDashboardUser(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRecentNotifications(userId: number | undefined) {
  return useQuery<Notification[]>({
    queryKey: ['dashboard', 'notifications', userId],
    queryFn: () => getRecentNotifications(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export function useActiveAlerts(userId: number | undefined) {
  return useQuery<Record<string, unknown>[]>({
    queryKey: ['dashboard', 'alerts', userId],
    queryFn: () => getActiveAlerts(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}
