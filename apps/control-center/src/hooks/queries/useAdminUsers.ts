/**
 * Admin Users Query Hooks
 * React Query hooks for admin user management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersRepository } from '@/services/supabase/repositories';
import { queryKeys } from './keys';
import { AdminUser } from '@/types/adminUser';
import { toast } from 'sonner';

/**
 * Fetch all admin users
 */
export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers.list(),
    queryFn: () => adminUsersRepository.getAll({ orderBy: 'created_at', orderDirection: 'desc' }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single admin user by ID
 */
export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.adminUsers.detail(id || ''),
    queryFn: () => adminUsersRepository.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new admin user
 */
export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>) =>
      adminUsersRepository.createAdmin(data),
    onSuccess: (newAdmin) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
      toast.success('Admin created', { description: `${newAdmin.name} has been created.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to create admin', { description: error.message });
    },
  });
}

/**
 * Update an admin user
 */
export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminUser> }) =>
      adminUsersRepository.updateAdmin(id, data),
    onSuccess: (updatedAdmin) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.detail(updatedAdmin.id) });
      toast.success('Admin updated', { description: `${updatedAdmin.name} has been updated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to update admin', { description: error.message });
    },
  });
}

/**
 * Delete an admin user
 */
export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminUsersRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
      toast.success('Admin deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete admin', { description: error.message });
    },
  });
}

/**
 * Activate an admin user
 */
export function useActivateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminUsersRepository.activate(id),
    onSuccess: (admin) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
      toast.success('Admin activated', { description: `${admin.name} has been activated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to activate admin', { description: error.message });
    },
  });
}

/**
 * Deactivate an admin user
 */
export function useDeactivateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminUsersRepository.deactivate(id),
    onSuccess: (admin) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
      toast.success('Admin deactivated', { description: `${admin.name} has been deactivated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to deactivate admin', { description: error.message });
    },
  });
}
