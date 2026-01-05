/**
 * Unit Tests for Conflict Resolution Utilities
 *
 * Tests vector clock comparison, field-level merge, and conflict detection.
 */

import { describe, it, expect } from 'vitest';
import {
  compareVectorClocks,
  mergeVectorClocks,
  mergeTeamMember,
  mergeBaseSyncableEntity,
  createConflictLog,
} from '../conflictResolution';
import type { TeamMemberSettings } from '../../components/team-settings/types';

// ============================================
// TEST DATA FACTORIES
// ============================================

function createMockTeamMember(overrides: Partial<TeamMemberSettings> = {}): TeamMemberSettings {
  const now = new Date().toISOString();
  return {
    id: 'test-member-1',
    tenantId: 'test-tenant',
    storeId: 'test-store',
    syncStatus: 'synced',
    version: 1,
    vectorClock: { 'device-1': 1 },
    lastSyncedVersion: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: 'user-1',
    createdByDevice: 'device-1',
    lastModifiedBy: 'user-1',
    lastModifiedByDevice: 'device-1',
    isDeleted: false,
    profile: {
      id: 'profile-1',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
    },
    services: [],
    workingHours: {
      regularHours: [],
      timeOffRequests: [],
      scheduleOverrides: [],
      defaultBreakDuration: 30,
      autoScheduleBreaks: true,
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
      canBookForOthers: false,
      canEditOthersAppointments: false,
      pinRequired: false,
    },
    commission: {
      type: 'percentage',
      basePercentage: 50,
      productCommission: 10,
      tipHandling: 'keep_all',
    },
    payroll: {
      payPeriod: 'bi-weekly',
    },
    onlineBooking: {
      isBookableOnline: true,
      showOnWebsite: true,
      showOnApp: true,
      maxAdvanceBookingDays: 30,
      minAdvanceBookingHours: 2,
      bufferBetweenAppointments: 0,
      bufferType: 'after',
      allowDoubleBooking: false,
      maxConcurrentAppointments: 1,
      requireDeposit: false,
      autoAcceptBookings: true,
      acceptNewClients: true,
      displayOrder: 0,
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
        appointmentReminders: false,
        appointmentChanges: false,
        newBookings: false,
        cancellations: false,
        urgentAlerts: true,
      },
      push: {
        appointmentReminders: true,
        newBookings: true,
        messages: true,
        teamUpdates: true,
      },
      reminderTiming: {
        firstReminder: 24,
      },
    },
    performanceGoals: {},
    isActive: true,
    ...overrides,
  };
}

// ============================================
// VECTOR CLOCK TESTS
// ============================================

describe('compareVectorClocks', () => {
  it('should detect equal clocks', () => {
    const a = { device1: 1, device2: 2 };
    const b = { device1: 1, device2: 2 };

    expect(compareVectorClocks(a, b)).toBe('equal');
  });

  it('should detect local ahead when local has higher version on one device', () => {
    const local = { device1: 2, device2: 2 };
    const remote = { device1: 1, device2: 2 };

    expect(compareVectorClocks(local, remote)).toBe('local_ahead');
  });

  it('should detect remote ahead when remote has higher version on one device', () => {
    const local = { device1: 1, device2: 2 };
    const remote = { device1: 2, device2: 2 };

    expect(compareVectorClocks(local, remote)).toBe('remote_ahead');
  });

  it('should detect concurrent (conflict) when both have changes the other does not', () => {
    const local = { device1: 2, device2: 1 };
    const remote = { device1: 1, device2: 2 };

    expect(compareVectorClocks(local, remote)).toBe('concurrent');
  });

  it('should handle missing device entries', () => {
    const local = { device1: 1 };
    const remote = { device1: 1, device2: 1 };

    // Remote has device2 that local doesn't know about
    expect(compareVectorClocks(local, remote)).toBe('remote_ahead');
  });

  it('should handle empty clocks', () => {
    expect(compareVectorClocks({}, {})).toBe('equal');
  });

  it('should handle one empty clock', () => {
    const local = { device1: 1 };
    const remote = {};

    expect(compareVectorClocks(local, remote)).toBe('local_ahead');
    expect(compareVectorClocks(remote, local)).toBe('remote_ahead');
  });
});

describe('mergeVectorClocks', () => {
  it('should take max of each component', () => {
    const a = { device1: 2, device2: 1 };
    const b = { device1: 1, device2: 3 };

    const merged = mergeVectorClocks(a, b);

    expect(merged).toEqual({
      device1: 2,
      device2: 3,
    });
  });

  it('should include devices from both clocks', () => {
    const a = { device1: 1 };
    const b = { device2: 2 };

    const merged = mergeVectorClocks(a, b);

    expect(merged).toEqual({
      device1: 1,
      device2: 2,
    });
  });

  it('should handle empty clocks', () => {
    expect(mergeVectorClocks({}, {})).toEqual({});
    expect(mergeVectorClocks({ d1: 1 }, {})).toEqual({ d1: 1 });
    expect(mergeVectorClocks({}, { d1: 1 })).toEqual({ d1: 1 });
  });
});

// ============================================
// TEAM MEMBER MERGE TESTS
// ============================================

describe('mergeTeamMember', () => {
  it('should return merged result when no conflicts', () => {
    const local = createMockTeamMember();
    const remote = createMockTeamMember();

    const result = mergeTeamMember(local, remote);

    expect(result.hadConflicts).toBe(false);
    expect(result.conflictedFields).toHaveLength(0);
  });

  it('should detect and merge profile changes', () => {
    const local = createMockTeamMember({
      profile: {
        id: 'profile-1',
        firstName: 'LocalFirst',
        lastName: 'Doe',
        displayName: 'LocalFirst Doe',
        email: 'john@example.com',
        phone: '555-1234',
      },
      updatedAt: '2024-01-01T00:00:00Z',
    });

    const remote = createMockTeamMember({
      profile: {
        id: 'profile-1',
        firstName: 'John',
        lastName: 'RemoteLast',
        displayName: 'John RemoteLast',
        email: 'john@example.com',
        phone: '555-1234',
      },
      updatedAt: '2024-01-02T00:00:00Z', // Remote is newer
    });

    const result = mergeTeamMember(local, remote);

    expect(result.hadConflicts).toBe(true);
    expect(result.conflictedFields).toContain('profile');
  });

  it('should use remote_wins for permissions (server authoritative)', () => {
    const local = createMockTeamMember({
      permissions: {
        role: 'stylist',
        permissions: [],
        canAccessAdminPortal: false,
        canAccessReports: true, // Local changed this
        canModifyPrices: false,
        canProcessRefunds: false,
        canDeleteRecords: false,
        canManageTeam: false,
        canViewOthersCalendar: true,
        canBookForOthers: false,
        canEditOthersAppointments: false,
        pinRequired: false,
      },
    });

    const remote = createMockTeamMember({
      permissions: {
        role: 'manager', // Server promoted to manager
        permissions: [],
        canAccessAdminPortal: true,
        canAccessReports: true,
        canModifyPrices: true,
        canProcessRefunds: false,
        canDeleteRecords: false,
        canManageTeam: true,
        canViewOthersCalendar: true,
        canBookForOthers: true,
        canEditOthersAppointments: true,
        pinRequired: false,
      },
    });

    const result = mergeTeamMember(local, remote);

    // Permissions should use remote (server authoritative)
    expect(result.merged.permissions.role).toBe('manager');
    expect(result.merged.permissions.canManageTeam).toBe(true);
  });

  it('should use local_wins for notifications (user preference)', () => {
    const local = createMockTeamMember({
      notifications: {
        email: {
          appointmentReminders: false, // User disabled this
          appointmentChanges: true,
          newBookings: true,
          cancellations: true,
          dailySummary: false,
          weeklySummary: true,
          marketingEmails: false,
          systemUpdates: true,
        },
        sms: {
          appointmentReminders: false,
          appointmentChanges: false,
          newBookings: false,
          cancellations: false,
          urgentAlerts: true,
        },
        push: {
          appointmentReminders: false, // User disabled this
          newBookings: true,
          messages: true,
          teamUpdates: true,
        },
        reminderTiming: {
          firstReminder: 24,
        },
      },
      updatedAt: '2024-01-01T00:00:00Z',
    });

    const remote = createMockTeamMember({
      notifications: {
        email: {
          appointmentReminders: true, // Server has different setting
          appointmentChanges: true,
          newBookings: true,
          cancellations: true,
          dailySummary: false,
          weeklySummary: true,
          marketingEmails: false,
          systemUpdates: true,
        },
        sms: {
          appointmentReminders: false,
          appointmentChanges: false,
          newBookings: false,
          cancellations: false,
          urgentAlerts: true,
        },
        push: {
          appointmentReminders: true, // Server has different setting
          newBookings: true,
          messages: true,
          teamUpdates: true,
        },
        reminderTiming: {
          firstReminder: 24,
        },
      },
      updatedAt: '2024-01-02T00:00:00Z',
    });

    const result = mergeTeamMember(local, remote);

    // Notifications should use local (user preference)
    expect(result.merged.notifications.email.appointmentReminders).toBe(false);
    expect(result.merged.notifications.push.appointmentReminders).toBe(false);
  });

  it('should update version and vector clock in merged result', () => {
    const local = createMockTeamMember({
      version: 5,
      vectorClock: { 'device-1': 5 },
    });

    const remote = createMockTeamMember({
      version: 7,
      vectorClock: { 'device-2': 7 },
    });

    const result = mergeTeamMember(local, remote);

    // Version should be max + 1
    expect(result.merged.version).toBe(8);

    // Vector clock should be merged
    expect(result.merged.vectorClock).toEqual({
      'device-1': 5,
      'device-2': 7,
    });
  });

  it('should set syncStatus to synced in merged result', () => {
    const local = createMockTeamMember({ syncStatus: 'pending' });
    const remote = createMockTeamMember({ syncStatus: 'synced' });

    const result = mergeTeamMember(local, remote);

    expect(result.merged.syncStatus).toBe('synced');
  });
});

// ============================================
// BASE ENTITY MERGE TESTS
// ============================================

describe('mergeBaseSyncableEntity', () => {
  it('should use last-write-wins based on updatedAt', () => {
    const local = createMockTeamMember({
      profile: {
        id: 'profile-1',
        firstName: 'LocalName',
        lastName: 'Doe',
        displayName: 'LocalName Doe',
        email: 'local@example.com',
        phone: '555-1234',
      },
      updatedAt: '2024-01-01T00:00:00Z',
    });

    const remote = createMockTeamMember({
      profile: {
        id: 'profile-1',
        firstName: 'RemoteName',
        lastName: 'Doe',
        displayName: 'RemoteName Doe',
        email: 'remote@example.com',
        phone: '555-5678',
      },
      updatedAt: '2024-01-02T00:00:00Z', // Remote is newer
    });

    const result = mergeBaseSyncableEntity(local, remote);

    // Remote should win (newer)
    expect(result.merged.profile.firstName).toBe('RemoteName');
  });

  it('should list all conflicted fields', () => {
    const local = createMockTeamMember({
      profile: {
        id: 'profile-1',
        firstName: 'Local',
        lastName: 'Doe',
        displayName: 'Local Doe',
        email: 'local@example.com',
        phone: '555-1234',
      },
    });

    const remote = createMockTeamMember({
      profile: {
        id: 'profile-1',
        firstName: 'Remote',
        lastName: 'Doe',
        displayName: 'Remote Doe',
        email: 'remote@example.com',
        phone: '555-1234',
      },
    });

    const result = mergeBaseSyncableEntity(local, remote);

    expect(result.conflictedFields).toContain('profile');
  });
});

// ============================================
// CONFLICT LOG TESTS
// ============================================

describe('createConflictLog', () => {
  it('should create a valid conflict log', () => {
    const local = createMockTeamMember({ version: 3 });
    const remote = createMockTeamMember({ version: 5 });
    const result = mergeTeamMember(local, remote);

    const log = createConflictLog('teamMember', local, remote, result);

    expect(log.entityType).toBe('teamMember');
    expect(log.entityId).toBe(local.id);
    expect(log.localVersion).toBe(3);
    expect(log.remoteVersion).toBe(5);
    expect(log.timestamp).toBeDefined();
    expect(['merged', 'local_wins', 'remote_wins']).toContain(log.resolution);
  });
});
