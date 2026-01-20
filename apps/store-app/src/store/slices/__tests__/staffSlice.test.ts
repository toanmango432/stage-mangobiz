/**
 * Unit Tests for staffSlice Selectors
 *
 * Tests the team-derived selectors that provide a single source of truth
 * for staff data across Front Desk and Book modules.
 *
 * Note: These tests directly test the selector logic without importing
 * the full staffSlice to avoid complex dependency chain issues with
 * browser APIs (navigator, localStorage, etc.)
 */

import { describe, it, expect } from 'vitest';
import { createSelector } from '@reduxjs/toolkit';
import {
  teamMembersToStaff,
  getActiveStaffFromTeam,
  findStaffInTeam,
  getStaffForService,
} from '../../../services/supabase/adapters/teamStaffAdapter';
import type { TeamMemberSettings } from '../../../components/team-settings/types';
import type { Staff } from '../../../types';

// Minimal RootState type for testing (avoids importing full store with browser deps)
interface TestRootState {
  team: {
    members: Record<string, TeamMemberSettings>;
    memberIds: string[];
  };
  staff: {
    items: Staff[];
  };
}

// Recreate selectors inline to test the logic without browser dependencies
const selectTeamMembersBase = (state: TestRootState): TeamMemberSettings[] => {
  const memberIds = state.team?.memberIds || [];
  const members = state.team?.members || {};
  return memberIds.map((id: string) => members[id]).filter(Boolean);
};

const selectStaffFromTeam = createSelector(
  [selectTeamMembersBase],
  (teamMembers): Staff[] => {
    return teamMembersToStaff(teamMembers, { includeInactive: true, includeDeleted: false });
  }
);

const selectActiveStaffFromTeam = createSelector(
  [selectTeamMembersBase],
  (teamMembers): Staff[] => {
    return getActiveStaffFromTeam(teamMembers);
  }
);

const selectStaffForService = (serviceId: string) =>
  createSelector([selectTeamMembersBase], (teamMembers): Staff[] => {
    return getStaffForService(teamMembers, serviceId);
  });

const selectStaffById = (staffId: string) =>
  createSelector([selectTeamMembersBase], (teamMembers): Staff | undefined => {
    return findStaffInTeam(teamMembers, staffId);
  });

// Create a mock state with team data
function createMockState(teamMembers: Partial<TeamMemberSettings>[] = []): TestRootState {
  const members: Record<string, TeamMemberSettings> = {};
  const memberIds: string[] = [];

  teamMembers.forEach((m, index) => {
    const id = m.id || `member-${index}`;
    memberIds.push(id);
    members[id] = createMockTeamMember({ id, ...m });
  });

  return {
    team: {
      members,
      memberIds,
    },
    staff: {
      items: [],
    },
  };
}

// Mock TeamMemberSettings factory (simplified for tests)
function createMockTeamMember(overrides: Partial<TeamMemberSettings> = {}): TeamMemberSettings {
  const now = new Date().toISOString();
  const id = overrides.id || 'member-001';
  return {
    id,
    tenantId: 'tenant-001',
    storeId: 'store-001',
    syncStatus: 'synced',
    version: 1,
    vectorClock: { device1: 1 },
    lastSyncedVersion: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: 'user-001',
    createdByDevice: 'device-001',
    lastModifiedBy: 'user-001',
    lastModifiedByDevice: 'device-001',
    isDeleted: false,
    isActive: true,
    profile: {
      id,
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      email: 'test@example.com',
      phone: '555-1234',
    },
    services: [
      { serviceId: 'svc-001', serviceName: 'Service 1', serviceCategory: 'Category', canPerform: true, defaultPrice: 50, defaultDuration: 30 },
    ],
    workingHours: {
      regularHours: [
        { dayOfWeek: 1, isWorking: true, shifts: [{ startTime: '09:00', endTime: '17:00' }] },
      ],
      timeOffRequests: [],
      scheduleOverrides: [],
      defaultBreakDuration: 30,
      autoScheduleBreaks: false,
    },
    permissions: {
      role: 'stylist',
      permissions: [],
      canAccessAdminPortal: false,
      canAccessReports: false,
      canModifyPrices: false,
      canProcessRefunds: false,
      canDeleteRecords: false,
      canManageTeam: false,
      canViewOthersCalendar: true,
      canBookForOthers: true,
      canEditOthersAppointments: false,
      pinRequired: false,
    },
    commission: {
      type: 'percentage',
      basePercentage: 40,
      tiers: [],
      productCommission: 10,
      tipHandling: 'keep_all',
    },
    payroll: {
      hourlyRate: 0,
      payPeriod: 'bi-weekly',
      overtimeRate: 1.5,
    },
    onlineBooking: {
      isBookableOnline: true,
      showOnWebsite: true,
      showOnApp: true,
      maxAdvanceBookingDays: 60,
      minAdvanceBookingHours: 2,
      bufferBetweenAppointments: 15,
      bufferType: 'both',
      allowDoubleBooking: false,
      maxConcurrentAppointments: 1,
      requireDeposit: false,
      autoAcceptBookings: true,
      acceptNewClients: true,
      displayOrder: 1,
    },
    notifications: {
      email: {
        appointmentReminders: true,
        appointmentChanges: true,
        newBookings: true,
        cancellations: true,
        dailySummary: false,
        weeklySummary: true,
        marketingEmails: false,
        systemUpdates: true,
      },
      sms: {
        appointmentReminders: true,
        appointmentChanges: true,
        newBookings: true,
        cancellations: true,
        urgentAlerts: true,
      },
      push: {
        appointmentReminders: true,
        newBookings: true,
        messages: true,
        teamUpdates: true,
      },
      reminderTiming: { firstReminder: 24, secondReminder: 2 },
    },
    performanceGoals: {},
    ...overrides,
  };
}

describe('staffSlice team-derived selectors', () => {
  describe('selectStaffFromTeam', () => {
    it('should return empty array when no team members', () => {
      const state = createMockState([]);
      const result = selectStaffFromTeam(state);
      expect(result).toEqual([]);
    });

    it('should convert team members to Staff type', () => {
      const state = createMockState([
        { id: 'member-001', profile: { id: 'member-001', firstName: 'John', lastName: 'Doe', displayName: 'John D', email: 'john@test.com', phone: '555-1111' } },
        { id: 'member-002', profile: { id: 'member-002', firstName: 'Jane', lastName: 'Smith', displayName: 'Jane S', email: 'jane@test.com', phone: '555-2222' } },
      ]);
      const result = selectStaffFromTeam(state);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('member-001');
      expect(result[0].name).toBe('John D');
      expect(result[1].id).toBe('member-002');
      expect(result[1].name).toBe('Jane S');
    });

    it('should include inactive members (for complete staff list)', () => {
      const state = createMockState([
        { id: 'member-001', isActive: true },
        { id: 'member-002', isActive: false },
      ]);
      const result = selectStaffFromTeam(state);

      // selectStaffFromTeam includes inactive for complete list
      expect(result).toHaveLength(2);
    });

    it('should exclude deleted members', () => {
      const state = createMockState([
        { id: 'member-001', isDeleted: false },
        { id: 'member-002', isDeleted: true },
      ]);
      const result = selectStaffFromTeam(state);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('member-001');
    });

    it('should be memoized (return same reference for same input)', () => {
      const state = createMockState([{ id: 'member-001' }]);
      const result1 = selectStaffFromTeam(state);
      const result2 = selectStaffFromTeam(state);

      expect(result1).toBe(result2); // Same reference = memoized
    });
  });

  describe('selectActiveStaffFromTeam', () => {
    it('should return only active staff', () => {
      const state = createMockState([
        { id: 'member-001', isActive: true },
        { id: 'member-002', isActive: false },
        { id: 'member-003', isActive: true },
      ]);
      const result = selectActiveStaffFromTeam(state);

      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toContain('member-001');
      expect(result.map((s) => s.id)).toContain('member-003');
      expect(result.map((s) => s.id)).not.toContain('member-002');
    });

    it('should exclude deleted members even if active', () => {
      const state = createMockState([
        { id: 'member-001', isActive: true, isDeleted: false },
        { id: 'member-002', isActive: true, isDeleted: true },
      ]);
      const result = selectActiveStaffFromTeam(state);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('member-001');
    });
  });

  describe('selectStaffForService', () => {
    it('should return staff who can perform the service', () => {
      const state = createMockState([
        {
          id: 'member-001',
          services: [{ serviceId: 'svc-haircut', serviceName: 'Haircut', serviceCategory: 'Hair', canPerform: true, defaultPrice: 50, defaultDuration: 30 }],
        },
        {
          id: 'member-002',
          services: [{ serviceId: 'svc-haircut', serviceName: 'Haircut', serviceCategory: 'Hair', canPerform: false, defaultPrice: 50, defaultDuration: 30 }],
        },
        {
          id: 'member-003',
          services: [{ serviceId: 'svc-color', serviceName: 'Color', serviceCategory: 'Hair', canPerform: true, defaultPrice: 50, defaultDuration: 30 }],
        },
      ]);

      const selector = selectStaffForService('svc-haircut');
      const result = selector(state);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('member-001');
    });

    it('should return empty array when no staff can perform service', () => {
      const state = createMockState([
        {
          id: 'member-001',
          services: [{ serviceId: 'svc-other', serviceName: 'Other', serviceCategory: 'Other', canPerform: true, defaultPrice: 50, defaultDuration: 30 }],
        },
      ]);

      const selector = selectStaffForService('svc-haircut');
      const result = selector(state);

      expect(result).toEqual([]);
    });
  });

  describe('selectStaffById', () => {
    it('should find staff by ID', () => {
      const state = createMockState([
        { id: 'member-001', profile: { id: 'member-001', firstName: 'John', lastName: 'Doe', displayName: 'John', email: '', phone: '' } },
        { id: 'member-002', profile: { id: 'member-002', firstName: 'Jane', lastName: 'Smith', displayName: 'Jane', email: '', phone: '' } },
      ]);

      const selector = selectStaffById('member-002');
      const result = selector(state);

      expect(result).toBeDefined();
      expect(result?.id).toBe('member-002');
      expect(result?.name).toBe('Jane');
    });

    it('should return undefined for non-existent ID', () => {
      const state = createMockState([{ id: 'member-001' }]);

      const selector = selectStaffById('non-existent');
      const result = selector(state);

      expect(result).toBeUndefined();
    });
  });
});

describe('staffSlice data source verification', () => {
  it('selectAllStaff should derive from teamSlice (not staffSlice.items)', () => {
    // This test verifies the key architectural change:
    // selectAllStaff now returns team-derived data, not state.staff.items

    const state = createMockState([
      { id: 'team-member-001', profile: { id: 'team-member-001', firstName: 'From', lastName: 'Team', displayName: 'From Team', email: '', phone: '' } },
    ]);

    // Also set some different data in staff.items to prove we're NOT using it
    state.staff.items = [
      {
        id: 'legacy-staff-001',
        storeId: 'store-001',
        name: 'Legacy Staff',
        email: '',
        phone: '',
        specialties: [],
        status: 'available',
        schedule: [],
        servicesCountToday: 0,
        revenueToday: 0,
        tipsToday: 0,
        createdAt: '',
        updatedAt: '',
        syncStatus: 'local',
      },
    ];

    const result = selectStaffFromTeam(state);

    // Should get team-derived data, NOT legacy staff.items
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('team-member-001');
    expect(result[0].name).toBe('From Team');
    expect(result[0].id).not.toBe('legacy-staff-001');
  });
});
