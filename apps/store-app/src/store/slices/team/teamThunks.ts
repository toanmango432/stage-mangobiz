/**
 * Team Slice Async Thunks
 *
 * Extracted from teamSlice.ts to reduce file size.
 * All team-related async operations (fetch, save, archive, delete).
 *
 * Uses dataService for unified data access - handles routing to
 * Supabase/IndexedDB based on device mode internally.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { dataService } from '@/services/dataService';
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
 * Uses dataService which handles Supabase/IndexedDB routing internally
 */
export const fetchTeamMembers = createAsyncThunk(
  'team/fetchAll',
  async (_storeId: string | undefined, { rejectWithValue }) => {
    // Note: storeId parameter is ignored - dataService.team.getAll() uses
    // the current store from Redux auth state internally
    try {
      const members = await dataService.team.getAll();
      console.log('[teamThunks] Fetched', members.length, 'members via dataService');
      return members;
    } catch (error) {
      console.error('[teamThunks] Failed to fetch team members:', error);
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
      const member = await dataService.team.getById(memberId);
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
    { member, context: _context }: { member: TeamMemberSettings; context?: SyncContext },
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
      // Check if member exists via dataService
      const existing = await dataService.team.getById(member.id);

      let savedMember: TeamMemberSettings;

      if (existing) {
        // Update existing member
        const updated = await dataService.team.update(member.id, member);
        if (!updated) {
          throw new Error('Failed to update team member');
        }
        savedMember = updated;
      } else {
        // Create new member
        savedMember = await dataService.team.create(member);
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
    { memberId, context: _context }: { memberId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const archived = await dataService.team.archive(memberId);
      if (!archived) {
        throw new Error('Failed to archive team member');
      }
      return archived;
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
    { memberId, context: _context }: { memberId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const restored = await dataService.team.restore(memberId);
      if (!restored) {
        throw new Error('Failed to restore team member');
      }
      return restored;
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
    { memberId, context: _context }: { memberId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      await dataService.team.delete(memberId);
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
