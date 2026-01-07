/**
 * Members Query Hooks
 * React Query hooks for member management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersRepository } from '@/services/supabase/repositories';
import { queryKeys } from './keys';
import { Member } from '@/types/member';
import { toast } from 'sonner';

/**
 * Fetch all members
 */
export function useMembers() {
  return useQuery({
    queryKey: queryKeys.members.list(),
    queryFn: () => membersRepository.getAll({ orderBy: 'created_at', orderDirection: 'desc' }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single member by ID
 */
export function useMember(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.members.detail(id || ''),
    queryFn: () => membersRepository.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch members by tenant
 */
export function useMembersByTenant(tenantId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.members.byTenant(tenantId || ''),
    queryFn: () => membersRepository.getByTenant(tenantId!),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch members by store
 */
export function useMembersByStore(storeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.members.byStore(storeId || ''),
    queryFn: () => membersRepository.getByStore(storeId!),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch member stats
 */
export function useMemberStats() {
  return useQuery({
    queryKey: queryKeys.members.stats(),
    queryFn: () => membersRepository.getCountByRole(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new member
 */
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) =>
      membersRepository.createMember(data),
    onSuccess: (newMember) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      toast.success('Member created', { description: `${newMember.name} has been created.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to create member', { description: error.message });
    },
  });
}

/**
 * Update a member
 */
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Member> }) =>
      membersRepository.updateMember(id, data),
    onSuccess: (updatedMember) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.detail(updatedMember.id) });
      toast.success('Member updated', { description: `${updatedMember.name} has been updated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to update member', { description: error.message });
    },
  });
}

/**
 * Delete a member
 */
export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => membersRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      toast.success('Member deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete member', { description: error.message });
    },
  });
}

/**
 * Activate a member
 */
export function useActivateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => membersRepository.activate(id),
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      toast.success('Member activated', { description: `${member.name} has been activated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to activate member', { description: error.message });
    },
  });
}

/**
 * Deactivate a member
 */
export function useDeactivateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => membersRepository.deactivate(id),
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      toast.success('Member deactivated', { description: `${member.name} has been deactivated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to deactivate member', { description: error.message });
    },
  });
}

/**
 * Suspend a member
 */
export function useSuspendMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => membersRepository.suspend(id),
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      toast.success('Member suspended', { description: `${member.name} has been suspended.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to suspend member', { description: error.message });
    },
  });
}
