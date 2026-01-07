/**
 * Feature Flags Repository
 * Handles CRUD operations for feature flag management
 */

import { BaseRepository, QueryOptions, APIError } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';
import { FeatureFlag, FeatureFlagCategory, CreateFeatureFlagInput, UpdateFeatureFlagInput } from '@/types/featureFlag';

// Database row type (snake_case)
interface FeatureFlagRow {
  id: string;
  name: string;
  key: string;
  description: string;
  category: string;
  enabled_for_free: boolean;
  enabled_for_basic: boolean;
  enabled_for_professional: boolean;
  enabled_for_enterprise: boolean;
  globally_enabled: boolean;
  rollout_percentage: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Convert DB row to app type
function toFeatureFlag(row: FeatureFlagRow): FeatureFlag {
  return {
    id: row.id,
    name: row.name,
    key: row.key,
    description: row.description,
    category: row.category as FeatureFlagCategory,
    enabledForFree: row.enabled_for_free,
    enabledForBasic: row.enabled_for_basic,
    enabledForProfessional: row.enabled_for_professional,
    enabledForEnterprise: row.enabled_for_enterprise,
    globallyEnabled: row.globally_enabled,
    rolloutPercentage: row.rollout_percentage,
    metadata: row.metadata,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Convert input to DB row
function toRow(input: CreateFeatureFlagInput | UpdateFeatureFlagInput): Partial<FeatureFlagRow> {
  const row: Partial<FeatureFlagRow> = {};
  if ('name' in input && input.name !== undefined) row.name = input.name;
  if ('key' in input && input.key !== undefined) row.key = input.key;
  if ('description' in input && input.description !== undefined) row.description = input.description;
  if ('category' in input && input.category !== undefined) row.category = input.category;
  if ('enabledForFree' in input && input.enabledForFree !== undefined) row.enabled_for_free = input.enabledForFree;
  if ('enabledForBasic' in input && input.enabledForBasic !== undefined) row.enabled_for_basic = input.enabledForBasic;
  if ('enabledForProfessional' in input && input.enabledForProfessional !== undefined) row.enabled_for_professional = input.enabledForProfessional;
  if ('enabledForEnterprise' in input && input.enabledForEnterprise !== undefined) row.enabled_for_enterprise = input.enabledForEnterprise;
  if ('globallyEnabled' in input && input.globallyEnabled !== undefined) row.globally_enabled = input.globallyEnabled;
  if ('rolloutPercentage' in input && input.rolloutPercentage !== undefined) row.rollout_percentage = input.rolloutPercentage;
  if ('metadata' in input && input.metadata !== undefined) row.metadata = input.metadata;
  return row;
}

class FeatureFlagsRepository extends BaseRepository<FeatureFlagRow> {
  constructor() {
    super('feature_flags');
  }

  /**
   * Get all feature flags
   */
  async getAll(options?: QueryOptions): Promise<FeatureFlag[]> {
    const result = await this.findAll({
      orderBy: 'category',
      orderDirection: 'asc',
      ...options,
    });
    return result.data.map(toFeatureFlag);
  }

  /**
   * Get feature flag by ID
   */
  async getById(id: string): Promise<FeatureFlag | null> {
    const result = await this.findById(id);
    return result.data ? toFeatureFlag(result.data) : null;
  }

  /**
   * Get feature flag by key
   */
  async getByKey(key: string): Promise<FeatureFlag | null> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('*').eq('key', key).single()
      );

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw APIError.fromSupabaseError(error);
      }

      return data ? toFeatureFlag(data as FeatureFlagRow) : null;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get feature flags by category
   */
  async getByCategory(category: FeatureFlagCategory, options?: QueryOptions): Promise<FeatureFlag[]> {
    const result = await this.findByField('category', category, options);
    return result.data.map(toFeatureFlag);
  }

  /**
   * Get enabled feature flags for a tier
   */
  async getEnabledForTier(tier: 'free' | 'basic' | 'professional' | 'enterprise'): Promise<FeatureFlag[]> {
    try {
      const tierColumn = `enabled_for_${tier}`;
      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from(this.tableName)
          .select('*')
          .eq('globally_enabled', true)
          .eq(tierColumn, true)
      );

      if (error) throw APIError.fromSupabaseError(error);
      return (data || []).map(toFeatureFlag);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Create a new feature flag
   */
  async createFlag(input: CreateFeatureFlagInput): Promise<FeatureFlag> {
    const result = await this.create(toRow(input) as any);
    return toFeatureFlag(result.data);
  }

  /**
   * Update a feature flag
   */
  async updateFlag(id: string, input: UpdateFeatureFlagInput): Promise<FeatureFlag> {
    const result = await this.update(id, toRow(input) as any);
    return toFeatureFlag(result.data);
  }

  /**
   * Toggle global enabled status
   */
  async toggle(id: string): Promise<FeatureFlag> {
    const flag = await this.getById(id);
    if (!flag) throw APIError.notFound('Feature flag', id);

    return this.updateFlag(id, { globallyEnabled: !flag.globallyEnabled });
  }

  /**
   * Enable feature for a tier
   */
  async enableForTier(id: string, tier: 'free' | 'basic' | 'professional' | 'enterprise'): Promise<FeatureFlag> {
    const updateData: UpdateFeatureFlagInput = {};
    switch (tier) {
      case 'free': updateData.enabledForFree = true; break;
      case 'basic': updateData.enabledForBasic = true; break;
      case 'professional': updateData.enabledForProfessional = true; break;
      case 'enterprise': updateData.enabledForEnterprise = true; break;
    }
    return this.updateFlag(id, updateData);
  }

  /**
   * Disable feature for a tier
   */
  async disableForTier(id: string, tier: 'free' | 'basic' | 'professional' | 'enterprise'): Promise<FeatureFlag> {
    const updateData: UpdateFeatureFlagInput = {};
    switch (tier) {
      case 'free': updateData.enabledForFree = false; break;
      case 'basic': updateData.enabledForBasic = false; break;
      case 'professional': updateData.enabledForProfessional = false; break;
      case 'enterprise': updateData.enabledForEnterprise = false; break;
    }
    return this.updateFlag(id, updateData);
  }

  /**
   * Update rollout percentage
   */
  async updateRollout(id: string, percentage: number): Promise<FeatureFlag> {
    if (percentage < 0 || percentage > 100) {
      throw APIError.badRequest('Rollout percentage must be between 0 and 100');
    }
    return this.updateFlag(id, { rolloutPercentage: percentage });
  }

  /**
   * Get count by category
   */
  async getCountByCategory(): Promise<Record<string, number>> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('category')
      );

      if (error) throw APIError.fromSupabaseError(error);

      const counts: Record<string, number> = {};
      data?.forEach((row: any) => {
        counts[row.category] = (counts[row.category] || 0) + 1;
      });

      return counts;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }
}

export const featureFlagsRepository = new FeatureFlagsRepository();
export { FeatureFlagsRepository };
