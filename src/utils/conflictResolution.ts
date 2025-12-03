/**
 * Conflict Resolution Utilities for Offline-First Sync
 *
 * Implements field-level merge for team entities per DATA_STORAGE_STRATEGY.md Section 4.
 * Uses vector clocks to detect concurrent edits and applies merge strategies per field.
 *
 * See: tasks/phase-1.5-quality-improvements.md
 */

import type { BaseSyncableEntity, VectorClock } from '../types/common';
import type { TeamMemberSettings } from '../components/team-settings/types';

// ============================================
// VECTOR CLOCK COMPARISON
// ============================================

export type ClockComparison =
  | 'local_ahead'   // Local has changes server doesn't know about
  | 'remote_ahead'  // Server has changes local doesn't know about
  | 'concurrent'    // Both have changes - conflict!
  | 'equal';        // No differences

/**
 * Compare two vector clocks to determine their relationship.
 * This is the core of conflict detection.
 */
export function compareVectorClocks(
  local: VectorClock,
  remote: VectorClock
): ClockComparison {
  const allDevices = new Set([...Object.keys(local), ...Object.keys(remote)]);

  let localAhead = false;
  let remoteAhead = false;

  for (const device of allDevices) {
    const localVersion = local[device] || 0;
    const remoteVersion = remote[device] || 0;

    if (localVersion > remoteVersion) localAhead = true;
    if (remoteVersion > localVersion) remoteAhead = true;
  }

  if (localAhead && remoteAhead) return 'concurrent'; // Conflict!
  if (localAhead) return 'local_ahead';
  if (remoteAhead) return 'remote_ahead';
  return 'equal';
}

/**
 * Merge two vector clocks by taking the max of each component.
 * Used after resolving a conflict.
 */
export function mergeVectorClocks(a: VectorClock, b: VectorClock): VectorClock {
  const merged: VectorClock = {};
  const allDevices = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const device of allDevices) {
    merged[device] = Math.max(a[device] || 0, b[device] || 0);
  }

  return merged;
}

// ============================================
// MERGE STRATEGIES
// ============================================

export type MergeStrategy =
  | 'last_write'    // Use whichever was updated more recently
  | 'local_wins'    // Always use local value
  | 'remote_wins'   // Always use remote value (server authoritative)
  | 'max'           // Use the larger value (for counters)
  | 'union';        // Merge arrays/sets

/**
 * Field merge rule configuration for TeamMemberSettings.
 * Defines how each field should be resolved during a conflict.
 */
export interface FieldMergeRule {
  strategy: MergeStrategy;
  description: string;
}

/**
 * Merge rules for TeamMemberSettings profile fields.
 * These define how conflicts are resolved per field.
 */
export const TEAM_MEMBER_PROFILE_MERGE_RULES: Record<string, FieldMergeRule> = {
  // Identity fields - server authoritative
  firstName: { strategy: 'last_write', description: 'Use most recent first name' },
  lastName: { strategy: 'last_write', description: 'Use most recent last name' },
  displayName: { strategy: 'last_write', description: 'Use most recent display name' },
  email: { strategy: 'remote_wins', description: 'Server controls email (auth)' },

  // Contact info - last write wins
  phone: { strategy: 'last_write', description: 'Use most recent phone' },
  avatar: { strategy: 'last_write', description: 'Use most recent avatar' },
  bio: { strategy: 'last_write', description: 'Use most recent bio' },
  title: { strategy: 'last_write', description: 'Use most recent title' },

  // HR fields - server authoritative
  employeeId: { strategy: 'remote_wins', description: 'Server controls employee ID' },
  hireDate: { strategy: 'remote_wins', description: 'Server controls hire date' },
};

/**
 * Merge rules for top-level TeamMemberSettings sections.
 */
export const TEAM_MEMBER_SECTION_MERGE_RULES: Record<string, FieldMergeRule> = {
  // Active status - server authoritative (managers control this)
  isActive: { strategy: 'remote_wins', description: 'Server controls active status' },

  // Profile - field-level merge
  profile: { strategy: 'last_write', description: 'Merge profile fields individually' },

  // Services - last write wins (complex array)
  services: { strategy: 'last_write', description: 'Use most recent services list' },

  // Working hours - last write wins (complex nested)
  workingHours: { strategy: 'last_write', description: 'Use most recent schedule' },

  // Permissions - server authoritative (security)
  permissions: { strategy: 'remote_wins', description: 'Server controls permissions' },

  // Commission - remote wins (business rules)
  commission: { strategy: 'remote_wins', description: 'Server controls commission' },

  // Payroll - server authoritative (financials)
  payroll: { strategy: 'remote_wins', description: 'Server controls payroll' },

  // Online booking - last write wins
  onlineBooking: { strategy: 'last_write', description: 'Use most recent booking settings' },

  // Notifications - local wins (user preference)
  notifications: { strategy: 'local_wins', description: 'Keep local notification prefs' },

  // Performance goals - remote wins (management sets goals)
  performanceGoals: { strategy: 'remote_wins', description: 'Server controls goals' },
};

// ============================================
// CONFLICT RESULT
// ============================================

export interface ConflictResolutionResult<T> {
  /** The merged entity */
  merged: T;

  /** Fields that had different values (may or may not have caused data loss) */
  conflictedFields: string[];

  /** Fields where local value was overwritten by remote */
  localOverwritten: string[];

  /** Fields where remote value was overwritten by local */
  remoteOverwritten: string[];

  /** True if any conflicts required resolution */
  hadConflicts: boolean;
}

// ============================================
// MERGE FUNCTIONS
// ============================================

/**
 * Apply a merge strategy to resolve a field conflict.
 */
function applyMergeStrategy<T>(
  localValue: T,
  remoteValue: T,
  localUpdatedAt: string,
  remoteUpdatedAt: string,
  strategy: MergeStrategy
): { value: T; usedLocal: boolean } {
  switch (strategy) {
    case 'last_write': {
      const localTime = new Date(localUpdatedAt).getTime();
      const remoteTime = new Date(remoteUpdatedAt).getTime();
      const usedLocal = localTime >= remoteTime;
      return { value: usedLocal ? localValue : remoteValue, usedLocal };
    }

    case 'local_wins':
      return { value: localValue, usedLocal: true };

    case 'remote_wins':
      return { value: remoteValue, usedLocal: false };

    case 'max': {
      const localNum = typeof localValue === 'number' ? localValue : 0;
      const remoteNum = typeof remoteValue === 'number' ? remoteValue : 0;
      const usedLocal = localNum >= remoteNum;
      return { value: (usedLocal ? localValue : remoteValue), usedLocal };
    }

    case 'union': {
      // For arrays, merge unique values
      if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
        const merged = [...new Set([...localValue, ...remoteValue])];
        return { value: merged as T, usedLocal: true };
      }
      // Fallback to last_write for non-arrays
      const localTime = new Date(localUpdatedAt).getTime();
      const remoteTime = new Date(remoteUpdatedAt).getTime();
      const usedLocal = localTime >= remoteTime;
      return { value: usedLocal ? localValue : remoteValue, usedLocal };
    }

    default:
      return { value: remoteValue, usedLocal: false };
  }
}

/**
 * Deep equality check for objects.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return a === b;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }

  return true;
}

// ============================================
// TEAM MEMBER MERGE
// ============================================

/**
 * Merge a local TeamMemberSettings with a remote version using field-level resolution.
 *
 * This is the main conflict resolution function for team members.
 */
export function mergeTeamMember(
  local: TeamMemberSettings,
  remote: TeamMemberSettings
): ConflictResolutionResult<TeamMemberSettings> {
  const conflictedFields: string[] = [];
  const localOverwritten: string[] = [];
  const remoteOverwritten: string[] = [];

  // Start with local as base
  const merged = { ...local };

  // Process each section according to merge rules
  for (const [field, rule] of Object.entries(TEAM_MEMBER_SECTION_MERGE_RULES)) {
    const localValue = local[field as keyof TeamMemberSettings];
    const remoteValue = remote[field as keyof TeamMemberSettings];

    // Skip if values are equal
    if (deepEqual(localValue, remoteValue)) continue;

    // Track conflict
    conflictedFields.push(field);

    // Apply merge strategy
    const { value, usedLocal } = applyMergeStrategy(
      localValue,
      remoteValue,
      local.updatedAt,
      remote.updatedAt,
      rule.strategy
    );

    // Track which side was overwritten
    if (usedLocal) {
      remoteOverwritten.push(field);
    } else {
      localOverwritten.push(field);
    }

    // Update merged value
    (merged as Record<string, unknown>)[field] = value;
  }

  // Special handling for profile: merge at field level
  if (conflictedFields.includes('profile')) {
    const mergedProfile = mergeProfile(local.profile, remote.profile, local.updatedAt, remote.updatedAt);
    merged.profile = mergedProfile.merged;

    // Add profile sub-conflicts to tracking
    for (const subField of mergedProfile.conflictedFields) {
      if (!conflictedFields.includes(`profile.${subField}`)) {
        conflictedFields.push(`profile.${subField}`);
      }
    }
  }

  // Update sync metadata
  merged.vectorClock = mergeVectorClocks(local.vectorClock, remote.vectorClock);
  merged.version = Math.max(local.version, remote.version) + 1;
  merged.updatedAt = new Date().toISOString();
  merged.syncStatus = 'synced';
  merged.lastSyncedVersion = merged.version;

  return {
    merged,
    conflictedFields,
    localOverwritten,
    remoteOverwritten,
    hadConflicts: conflictedFields.length > 0,
  };
}

/**
 * Merge profile objects at field level.
 */
function mergeProfile(
  local: TeamMemberSettings['profile'],
  remote: TeamMemberSettings['profile'],
  localUpdatedAt: string,
  remoteUpdatedAt: string
): { merged: TeamMemberSettings['profile']; conflictedFields: string[] } {
  const conflictedFields: string[] = [];
  const merged = { ...local };

  for (const [field, rule] of Object.entries(TEAM_MEMBER_PROFILE_MERGE_RULES)) {
    const localValue = local[field as keyof typeof local];
    const remoteValue = remote[field as keyof typeof remote];

    if (deepEqual(localValue, remoteValue)) continue;

    conflictedFields.push(field);

    const { value } = applyMergeStrategy(
      localValue,
      remoteValue,
      localUpdatedAt,
      remoteUpdatedAt,
      rule.strategy
    );

    (merged as Record<string, unknown>)[field] = value;
  }

  return { merged, conflictedFields };
}

// ============================================
// BASE ENTITY MERGE (Generic)
// ============================================

/**
 * Generic merge for any BaseSyncableEntity using last-write-wins.
 * Use this as a fallback for entities without custom merge rules.
 */
export function mergeBaseSyncableEntity<T extends BaseSyncableEntity>(
  local: T,
  remote: T
): ConflictResolutionResult<T> {
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  // Last-write-wins
  const winner = remoteTime >= localTime ? remote : local;
  // const _loser = remoteTime >= localTime ? local : remote;

  // Find conflicted fields
  const conflictedFields: string[] = [];
  for (const key of Object.keys(local) as (keyof T)[]) {
    if (!deepEqual(local[key], remote[key])) {
      conflictedFields.push(key as string);
    }
  }

  const merged: T = {
    ...winner,
    vectorClock: mergeVectorClocks(local.vectorClock, remote.vectorClock),
    version: Math.max(local.version, remote.version) + 1,
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced',
    lastSyncedVersion: Math.max(local.version, remote.version) + 1,
  };

  return {
    merged,
    conflictedFields,
    localOverwritten: winner === remote ? conflictedFields : [],
    remoteOverwritten: winner === local ? conflictedFields : [],
    hadConflicts: conflictedFields.length > 0,
  };
}

// ============================================
// CONFLICT LOGGING
// ============================================

export interface ConflictLog {
  entityType: string;
  entityId: string;
  timestamp: string;
  conflictedFields: string[];
  localVersion: number;
  remoteVersion: number;
  resolution: 'merged' | 'local_wins' | 'remote_wins';
}

/**
 * Create a conflict log entry for debugging/auditing.
 */
export function createConflictLog<T extends BaseSyncableEntity>(
  entityType: string,
  local: T,
  remote: T,
  result: ConflictResolutionResult<T>
): ConflictLog {
  return {
    entityType,
    entityId: local.id,
    timestamp: new Date().toISOString(),
    conflictedFields: result.conflictedFields,
    localVersion: local.version,
    remoteVersion: remote.version,
    resolution: result.hadConflicts
      ? result.localOverwritten.length > result.remoteOverwritten.length
        ? 'remote_wins'
        : 'local_wins'
      : 'merged',
  };
}
