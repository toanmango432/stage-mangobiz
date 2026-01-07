/**
 * Licenses Query Hooks
 * React Query hooks for license management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { licensesRepository } from '@/services/supabase/repositories';
import { queryKeys } from './keys';
import { License } from '@/types/entities';
import { toast } from 'sonner';

/**
 * Fetch all licenses
 */
export function useLicenses() {
  return useQuery({
    queryKey: queryKeys.licenses.list(),
    queryFn: () => licensesRepository.getAll({ orderBy: 'created_at', orderDirection: 'desc' }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single license by ID
 */
export function useLicense(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.licenses.detail(id || ''),
    queryFn: () => licensesRepository.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch licenses by tenant
 */
export function useLicensesByTenant(tenantId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.licenses.byTenant(tenantId || ''),
    queryFn: () => licensesRepository.getByTenant(tenantId!),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch expiring licenses
 */
export function useExpiringLicenses(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.licenses.expiring(days),
    queryFn: () => licensesRepository.getExpiring(days),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch license stats
 */
export function useLicenseStats() {
  return useQuery({
    queryKey: queryKeys.licenses.stats(),
    queryFn: () => licensesRepository.getCountByStatus(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new license
 */
export function useCreateLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<License, 'id' | 'createdAt' | 'updatedAt'>) =>
      licensesRepository.createLicense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.all });
      toast.success('License created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create license', { description: error.message });
    },
  });
}

/**
 * Update a license
 */
export function useUpdateLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<License> }) =>
      licensesRepository.updateLicense(id, data),
    onSuccess: (updatedLicense) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.detail(updatedLicense.id) });
      toast.success('License updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update license', { description: error.message });
    },
  });
}

/**
 * Revoke a license
 */
export function useRevokeLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => licensesRepository.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.all });
      toast.success('License revoked');
    },
    onError: (error: Error) => {
      toast.error('Failed to revoke license', { description: error.message });
    },
  });
}

/**
 * Activate a license
 */
export function useActivateLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => licensesRepository.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.all });
      toast.success('License activated');
    },
    onError: (error: Error) => {
      toast.error('Failed to activate license', { description: error.message });
    },
  });
}
