/**
 * Stores Query Hooks
 * React Query hooks for store management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storesRepository } from '@/services/supabase/repositories';
import { queryKeys } from './keys';
import { Store } from '@/types/store';
import { toast } from 'sonner';

/**
 * Fetch all stores
 */
export function useStores() {
  return useQuery({
    queryKey: queryKeys.stores.list(),
    queryFn: () => storesRepository.getAll({ orderBy: 'created_at', orderDirection: 'desc' }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single store by ID
 */
export function useStore(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stores.detail(id || ''),
    queryFn: () => storesRepository.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch stores by tenant
 */
export function useStoresByTenant(tenantId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stores.byTenant(tenantId || ''),
    queryFn: () => storesRepository.getByTenant(tenantId!),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch stores by license
 */
export function useStoresByLicense(licenseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stores.byLicense(licenseId || ''),
    queryFn: () => storesRepository.getByLicense(licenseId!),
    enabled: !!licenseId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch store stats
 */
export function useStoreStats() {
  return useQuery({
    queryKey: queryKeys.stores.stats(),
    queryFn: () => storesRepository.getCountByStatus(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new store
 */
export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) =>
      storesRepository.createStore(data),
    onSuccess: (newStore) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.all });
      toast.success('Store created', { description: `${newStore.name} has been created.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to create store', { description: error.message });
    },
  });
}

/**
 * Update a store
 */
export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Store> }) =>
      storesRepository.updateStore(id, data),
    onSuccess: (updatedStore) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.detail(updatedStore.id) });
      toast.success('Store updated', { description: `${updatedStore.name} has been updated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to update store', { description: error.message });
    },
  });
}

/**
 * Delete a store
 */
export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storesRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.all });
      toast.success('Store deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete store', { description: error.message });
    },
  });
}

/**
 * Suspend a store
 */
export function useSuspendStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storesRepository.suspend(id),
    onSuccess: (store) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.all });
      toast.success('Store suspended', { description: `${store.name} has been suspended.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to suspend store', { description: error.message });
    },
  });
}

/**
 * Activate a store
 */
export function useActivateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storesRepository.activate(id),
    onSuccess: (store) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.all });
      toast.success('Store activated', { description: `${store.name} has been activated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to activate store', { description: error.message });
    },
  });
}
