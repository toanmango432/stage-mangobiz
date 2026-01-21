/**
 * Team Slice Async Thunks
 *
 * Extracted from teamSlice.ts to reduce file size.
 * All team-related async operations (fetch, save, archive, delete).
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../index';
import type {
  TeamMemberSettings,
  TimeOffRequest,
  ScheduleOverride,
} from '../../../components/team-settings/types';
import { SyncContext, getDefaultSyncContext } from '../../utils/syncContext';

// ============================================
// OPTIMISTIC UPDATE ACTION CREATORS
// Used for immediate UI updates before async completion
// ============================================

export const optimisticActions = {
  updateMemberOptimistic: (member: TeamMemberSettings) => ({
    type: 'team/updateMemberOptimistic' as const,
    payload: member,
  }),
  setPendingOperation: (data: {
    entityId: string;
    operation: {
      type: 'create' | 'update' | 'delete';
      entityId: string;
      previousState?: TeamMemberSettings;
      timestamp: number;
    };
  }) => ({
    type: 'team/setPendingOperation' as const,
    payload: data,
  }),
  clearPendingOperation: (entityId: string) => ({
    type: 'team/clearPendingOperation' as const,
    payload: entityId,
  }),
  removeMemberOptimistic: (id: string) => ({
    type: 'team/removeMember' as const,
    payload: id,
  }),
};

// ============================================
// FETCH THUNKS
// ============================================

/**
 * Fetch all team members
 * Priority: Supabase (source of truth) -> IndexedDB (offline fallback)
 */
export const fetchTeamMembers = createAsyncThunk(
  'team/fetchAll',
  async (storeId: string | undefined, { rejectWithValue }) => {
    const effectiveStoreId = storeId || 'default-store';

    try {
      // Try Supabase first (source of truth for online operations)
      const { fetchSupabaseMembers } = await import('../../../services/supabase/memberService');
      const supabaseMembers = await fetchSupabaseMembers(effectiveStoreId);

      if (supabaseMembers && supabaseMembers.length > 0) {
        console.log('[teamSlice] Fetched', supabaseMembers.length, 'members from Supabase');

        // Sync to IndexedDB for offline access
        try {
          const { teamDB } = await import('../../../db/teamOperations');
          for (const member of supabaseMembers) {
            await teamDB.upsertMember(member, 'system', 'system');
          }
          console.log('[teamSlice] Synced members to IndexedDB');
        } catch (syncError) {
          console.warn('[teamSlice] Failed to sync to IndexedDB:', syncError);
          // Continue - Supabase data is still valid
        }

        return supabaseMembers;
      }

      // Fallback to IndexedDB if Supabase returns empty (might be offline)
      console.log('[teamSlice] No Supabase data, falling back to IndexedDB');
      const { teamDB } = await import('../../../db/teamOperations');
      const members = await teamDB.getAllMembers(effectiveStoreId);
      return members;
    } catch (error) {
      // If Supabase fails, try IndexedDB as offline fallback
      console.warn('[teamSlice] Supabase failed, trying IndexedDB:', error);
      try {
        const { teamDB } = await import('../../../db/teamOperations');
        const members = await teamDB.getAllMembers(effectiveStoreId);
        if (members && members.length > 0) {
          console.log('[teamSlice] Using IndexedDB fallback:', members.length, 'members');
          return members;
        }
      } catch (indexedDBError) {
        console.error('[teamSlice] IndexedDB also failed:', indexedDBError);
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch team members');
    }
  }
);

/**
 * Fetch single team member with all related data
 */
export const fetchTeamMember = createAsyncThunk(
  'team/fetchOne',
  async (memberId: string, { rejectWithValue }) => {
    try {
      const { teamDB } = await import('../../../db/teamOperations');
      const member = await teamDB.getActiveMemberById(memberId);
      if (!member) {
        return rejectWithValue('Team member not found');
      }
      return member;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch team member');
    }
  }
);

// ============================================
// MUTATION THUNKS
// All require SyncContext for audit trail
// ============================================

/**
 * Save team member (create or update) with optimistic updates
 */
export const saveTeamMember = createAsyncThunk(
  'team/save',
  async (
    { member, context }: { member: TeamMemberSettings; context?: SyncContext },
    { dispatch, getState, rejectWithValue }
  ) => {
    const state = getState() as RootState;
    const existingMember = state.team.members[member.id];
    const isUpdate = !!existingMember;

    // 1. Store previous state for potential rollback
    if (isUpdate) {
      dispatch(
        optimisticActions.setPendingOperation({
          entityId: member.id,
          operation: {
            type: 'update',
            entityId: member.id,
            previousState: existingMember,
            timestamp: Date.now(),
          },
        })
      );
    } else {
      dispatch(
        optimisticActions.setPendingOperation({
          entityId: member.id,
          operation: {
            type: 'create',
            entityId: member.id,
            timestamp: Date.now(),
          },
        })
      );
    }

    // 2. Optimistically update the UI immediately
    dispatch(optimisticActions.updateMemberOptimistic(member));

    try {
      const { teamDB } = await import('../../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      const existing = await teamDB.getMemberById(member.id);

      let savedMember: TeamMemberSettings;

      if (existing) {
        savedMember = await teamDB.updateMember(member.id, member, ctx.userId, ctx.deviceId);
      } else {
        // Ensure required sync fields are set for new members
        const newMember: TeamMemberSettings = {
          ...member,
          tenantId: member.tenantId || ctx.tenantId || 'default-tenant',
          storeId: member.storeId || ctx.storeId || 'default-store',
        };
        await teamDB.createMember(newMember, ctx.userId, ctx.deviceId);
        savedMember = (await teamDB.getMemberById(member.id))!;
      }

      // 3. Clear pending operation on success
      dispatch(optimisticActions.clearPendingOperation(member.id));

      return savedMember;
    } catch (error) {
      // 4. Rollback on failure
      if (existingMember) {
        dispatch(optimisticActions.updateMemberOptimistic(existingMember));
      } else {
        dispatch(optimisticActions.removeMemberOptimistic(member.id));
      }
      dispatch(optimisticActions.clearPendingOperation(member.id));

      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save team member');
    }
  }
);

/**
 * Archive team member (sets isActive = false)
 */
export const archiveTeamMember = createAsyncThunk(
  'team/archive',
  async (
    { memberId, context }: { memberId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      const updated = await teamDB.archiveMember(memberId, ctx.userId, ctx.deviceId);
      return updated;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to archive team member');
    }
  }
);

/**
 * Restore archived team member
 */
export const restoreTeamMember = createAsyncThunk(
  'team/restore',
  async (
    { memberId, context }: { memberId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      const updated = await teamDB.restoreMember(memberId, ctx.userId, ctx.deviceId);
      return updated;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to restore team member');
    }
  }
);

/**
 * Soft delete team member (tombstone pattern)
 */
export const deleteTeamMember = createAsyncThunk(
  'team/delete',
  async (
    { memberId, context }: { memberId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      await teamDB.softDeleteMember(memberId, ctx.userId, ctx.deviceId);
      return memberId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete team member');
    }
  }
);

// ============================================
// TIME OFF REQUEST THUNKS
// ============================================

/**
 * Save time off request
 */
export const saveTimeOffRequest = createAsyncThunk(
  'team/saveTimeOff',
  async (
    {
      memberId,
      request,
      context,
    }: { memberId: string; request: TimeOffRequest; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      await teamDB.saveTimeOffRequest(memberId, request, ctx.userId, ctx.deviceId);
      return { memberId, request };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to save time off request'
      );
    }
  }
);

/**
 * Delete time off request
 */
export const deleteTimeOffRequest = createAsyncThunk(
  'team/deleteTimeOff',
  async (
    {
      memberId,
      requestId,
      context,
    }: { memberId: string; requestId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      await teamDB.deleteTimeOffRequest(memberId, requestId, ctx.userId, ctx.deviceId);
      return { memberId, requestId };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete time off request'
      );
    }
  }
);

// ============================================
// SCHEDULE OVERRIDE THUNKS
// ============================================

/**
 * Save schedule override
 */
export const saveScheduleOverride = createAsyncThunk(
  'team/saveOverride',
  async (
    {
      memberId,
      override,
      context,
    }: { memberId: string; override: ScheduleOverride; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      await teamDB.saveScheduleOverride(memberId, override, ctx.userId, ctx.deviceId);
      return { memberId, override };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to save schedule override'
      );
    }
  }
);

/**
 * Delete schedule override
 */
export const deleteScheduleOverride = createAsyncThunk(
  'team/deleteOverride',
  async (
    {
      memberId,
      overrideId,
      context,
    }: { memberId: string; overrideId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      await teamDB.deleteScheduleOverride(memberId, overrideId, ctx.userId, ctx.deviceId);
      return { memberId, overrideId };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete schedule override'
      );
    }
  }
);
