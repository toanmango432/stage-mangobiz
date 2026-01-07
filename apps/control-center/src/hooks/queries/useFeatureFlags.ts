/**
 * Feature Flags Query Hooks
 * React Query hooks for feature flag management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featureFlagsRepository } from '@/services/supabase/repositories';
import { queryKeys } from './keys';
import { FeatureFlag, CreateFeatureFlagInput, UpdateFeatureFlagInput, FeatureFlagCategory } from '@/types/featureFlag';
import { toast } from 'sonner';

/**
 * Fetch all feature flags
 */
export function useFeatureFlags() {
  return useQuery({
    queryKey: queryKeys.featureFlags.list(),
    queryFn: () => featureFlagsRepository.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single feature flag by ID
 */
export function useFeatureFlag(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.featureFlags.detail(id || ''),
    queryFn: () => featureFlagsRepository.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a feature flag by key
 */
export function useFeatureFlagByKey(key: string | undefined) {
  return useQuery({
    queryKey: queryKeys.featureFlags.byKey(key || ''),
    queryFn: () => featureFlagsRepository.getByKey(key!),
    enabled: !!key,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch feature flags by category
 */
export function useFeatureFlagsByCategory(category: FeatureFlagCategory | undefined) {
  return useQuery({
    queryKey: queryKeys.featureFlags.byCategory(category || ''),
    queryFn: () => featureFlagsRepository.getByCategory(category!),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch feature flags enabled for a tier
 */
export function useFeatureFlagsForTier(tier: 'free' | 'basic' | 'professional' | 'enterprise' | undefined) {
  return useQuery({
    queryKey: queryKeys.featureFlags.forTier(tier || ''),
    queryFn: () => featureFlagsRepository.getEnabledForTier(tier!),
    enabled: !!tier,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch feature flag stats
 */
export function useFeatureFlagStats() {
  return useQuery({
    queryKey: queryKeys.featureFlags.stats(),
    queryFn: () => featureFlagsRepository.getCountByCategory(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new feature flag
 */
export function useCreateFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFeatureFlagInput) => featureFlagsRepository.createFlag(data),
    onSuccess: (newFlag) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags.all });
      toast.success('Feature flag created', { description: `${newFlag.name} has been created.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to create feature flag', { description: error.message });
    },
  });
}

/**
 * Update a feature flag
 */
export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeatureFlagInput }) =>
      featureFlagsRepository.updateFlag(id, data),
    onSuccess: (updatedFlag) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags.detail(updatedFlag.id) });
      toast.success('Feature flag updated', { description: `${updatedFlag.name} has been updated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to update feature flag', { description: error.message });
    },
  });
}

/**
 * Delete a feature flag
 */
export function useDeleteFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => featureFlagsRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags.all });
      toast.success('Feature flag deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete feature flag', { description: error.message });
    },
  });
}

/**
 * Toggle a feature flag globally
 */
export function useToggleFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => featureFlagsRepository.toggle(id),
    onSuccess: (flag) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags.all });
      toast.success(
        flag.globallyEnabled ? 'Feature enabled' : 'Feature disabled',
        { description: `${flag.name} is now ${flag.globallyEnabled ? 'enabled' : 'disabled'}.` }
      );
    },
    onError: (error: Error) => {
      toast.error('Failed to toggle feature flag', { description: error.message });
    },
  });
}

/**
 * Enable feature for a tier
 */
export function useEnableFeatureForTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: 'free' | 'basic' | 'professional' | 'enterprise' }) =>
      featureFlagsRepository.enableForTier(id, tier),
    onSuccess: (flag, { tier }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags.all });
      toast.success('Feature enabled for tier', { description: `${flag.name} is now enabled for ${tier}.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to enable feature for tier', { description: error.message });
    },
  });
}

/**
 * Disable feature for a tier
 */
export function useDisableFeatureForTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: 'free' | 'basic' | 'professional' | 'enterprise' }) =>
      featureFlagsRepository.disableForTier(id, tier),
    onSuccess: (flag, { tier }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags.all });
      toast.success('Feature disabled for tier', { description: `${flag.name} is now disabled for ${tier}.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to disable feature for tier', { description: error.message });
    },
  });
}

/**
 * Update rollout percentage
 */
export function useUpdateFeatureRollout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, percentage }: { id: string; percentage: number }) =>
      featureFlagsRepository.updateRollout(id, percentage),
    onSuccess: (flag) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags.all });
      toast.success('Rollout updated', { description: `${flag.name} rollout set to ${flag.rolloutPercentage}%.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to update rollout', { description: error.message });
    },
  });
}
