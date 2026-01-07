/**
 * Audit Logs Query Hooks
 * React Query hooks for audit log viewing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditLogsRepository } from '@/services/supabase/repositories';
import { queryKeys } from './keys';
import { AuditLog, CreateAuditLogInput } from '@/types/auditLog';
import { toast } from 'sonner';

/**
 * Fetch all audit logs
 */
export function useAuditLogs(limit?: number) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(),
    queryFn: () => auditLogsRepository.getAll({ limit }),
    staleTime: 1 * 60 * 1000, // 1 minute - logs are frequently updated
  });
}

/**
 * Fetch a single audit log by ID
 */
export function useAuditLog(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.auditLogs.detail(id || ''),
    queryFn: () => auditLogsRepository.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch audit logs by admin user
 */
export function useAuditLogsByUser(userId: string | undefined, limit?: number) {
  return useQuery({
    queryKey: queryKeys.auditLogs.byUser(userId || ''),
    queryFn: () => auditLogsRepository.getByUser(userId!, { limit }),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Fetch audit logs by entity
 */
export function useAuditLogsByEntity(
  entityType: AuditLog['entityType'] | undefined,
  entityId?: string,
  limit?: number
) {
  return useQuery({
    queryKey: queryKeys.auditLogs.byEntity(entityType || '', entityId),
    queryFn: () => auditLogsRepository.getByEntity(entityType!, entityId, { limit }),
    enabled: !!entityType,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Fetch audit logs by date range
 */
export function useAuditLogsByDateRange(
  startDate: Date | undefined,
  endDate: Date | undefined,
  limit?: number
) {
  return useQuery({
    queryKey: queryKeys.auditLogs.byDateRange(
      startDate?.toISOString() || '',
      endDate?.toISOString() || ''
    ),
    queryFn: () => auditLogsRepository.getByDateRange(startDate!, endDate!, { limit }),
    enabled: !!startDate && !!endDate,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Fetch recent activity
 */
export function useRecentActivity(hours: number = 24) {
  return useQuery({
    queryKey: queryKeys.auditLogs.recent(hours),
    queryFn: () => auditLogsRepository.getRecentActivity(hours),
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Search audit logs
 */
export function useSearchAuditLogs(searchTerm: string | undefined, limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.auditLogs.all, 'search', searchTerm],
    queryFn: () => auditLogsRepository.search(searchTerm!, { limit }),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Create an audit log entry
 */
export function useCreateAuditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAuditLogInput) => auditLogsRepository.createLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs.all });
    },
    onError: (error: Error) => {
      console.error('Failed to create audit log:', error.message);
    },
  });
}

/**
 * Get action count statistics
 */
export function useAuditLogActionStats() {
  return useQuery({
    queryKey: [...queryKeys.auditLogs.all, 'action-stats'],
    queryFn: () => auditLogsRepository.getCountByAction(),
    staleTime: 5 * 60 * 1000,
  });
}
