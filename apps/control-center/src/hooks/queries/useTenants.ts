/**
 * Tenants Query Hooks
 * React Query hooks for tenant management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantsRepository } from '@/services/supabase/repositories';
import { queryKeys } from './keys';
import { Tenant } from '@/types/entities';
import { toast } from 'sonner';

/**
 * Fetch all tenants
 */
export function useTenants() {
  return useQuery({
    queryKey: queryKeys.tenants.list(),
    queryFn: () => tenantsRepository.getAll({ orderBy: 'created_at', orderDirection: 'desc' }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single tenant by ID
 */
export function useTenant(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tenants.detail(id || ''),
    queryFn: () => tenantsRepository.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch tenant stats
 */
export function useTenantStats() {
  return useQuery({
    queryKey: queryKeys.tenants.stats(),
    queryFn: () => tenantsRepository.getCountByStatus(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new tenant
 */
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) =>
      tenantsRepository.createTenant(data),
    onSuccess: (newTenant) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      toast.success('Tenant created', { description: `${newTenant.name} has been created.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to create tenant', { description: error.message });
    },
  });
}

/**
 * Update a tenant
 */
export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tenant> }) =>
      tenantsRepository.updateTenant(id, data),
    onSuccess: (updatedTenant) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.detail(updatedTenant.id) });
      toast.success('Tenant updated', { description: `${updatedTenant.name} has been updated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to update tenant', { description: error.message });
    },
  });
}

/**
 * Delete a tenant
 */
export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tenantsRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      toast.success('Tenant deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete tenant', { description: error.message });
    },
  });
}

/**
 * Suspend a tenant
 */
export function useSuspendTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tenantsRepository.suspend(id),
    onSuccess: (tenant) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      toast.success('Tenant suspended', { description: `${tenant.name} has been suspended.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to suspend tenant', { description: error.message });
    },
  });
}

/**
 * Activate a tenant
 */
export function useActivateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tenantsRepository.activate(id),
    onSuccess: (tenant) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      toast.success('Tenant activated', { description: `${tenant.name} has been activated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to activate tenant', { description: error.message });
    },
  });
}
