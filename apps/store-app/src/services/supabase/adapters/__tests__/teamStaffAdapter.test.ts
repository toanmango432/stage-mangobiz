/**
 * Unit Tests for Team-Staff Adapter
 *
 * Tests the conversion of TeamMemberSettings to Staff type.
 * This is critical for the staff data consolidation feature.
 */

import { describe, it, expect } from 'vitest';
import {
  teamMemberToStaff,
  teamMembersToStaff,
  getActiveStaffFromTeam,
  findStaffInTeam,
  getStaffForService,
} from '../teamStaffAdapter';
import type { TeamMemberSettings } from '@/components/team-settings/types';

// Mock TeamMemberSettings factory
function createMockTeamMember(overrides: Partial<TeamMemberSettings> = {}): TeamMemberSettings {
  const now = new Date().toISOString();
  return {
    id: 'member-001',
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
      id: 'member-001',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'Johnny D',
      email: 'john@example.com',
      phone: '555-1234',
      avatar: 'https://example.com/avatar.jpg',
      title: 'Senior Stylist',
      hireDate: '2023-01-15',
    },
    services: [
      { serviceId: 'svc-001', serviceName: 'Haircut', serviceCategory: 'Hair', canPerform: true, customPrice: null, customDuration: null },
      { serviceId: 'svc-002', serviceName: 'Color', serviceCategory: 'Hair', canPerform: true, customPrice: null, customDuration: null },
      { serviceId: 'svc-003', serviceName: 'Nails', serviceCategory: 'Nails', canPerform: false, customPrice: null, customDuration: null },
    ],
    workingHours: {
      regularHours: [
        { dayOfWeek: 1, isEnabled: true, shifts: [{ startTime: '09:00', endTime: '17:00' }] },
        { dayOfWeek: 2, isEnabled: true, shifts: [{ startTime: '09:00', endTime: '17:00' }] },
        { dayOfWeek: 3, isEnabled: false, shifts: [] },
      ],
      timeOffRequests: [],
      scheduleOverrides: [],
    },
    permissions: {
      role: 'stylist',
      canViewReports: false,
      canManageStaff: false,
      canManageSchedule: true,
      canManageClients: true,
      canManageServices: false,
      canProcessPayments: true,
      canApplyDiscounts: 'limited',
      maxDiscountPercent: 10,
      canVoidTransactions: false,
      canAccessSettings: false,
    },
    commission: {
      type: 'percentage',
      defaultRate: 0.40,
      tiers: [],
      productCommission: 0.10,
      tipShare: 1.0,
    },
    payroll: {
      payType: 'commission',
      hourlyRate: 0,
      salary: 0,
      payPeriod: 'bi-weekly',
      overtimeEligible: false,
      overtimeRate: 1.5,
      taxWithholding: { federal: true, state: true, local: false },
    },
    onlineBooking: {
      acceptsOnlineBookings: true,
      displayOnWebsite: true,
      bookingBuffer: { type: 'both', minutes: 15 },
      maxAdvanceBookingDays: 60,
      minAdvanceBookingHours: 2,
      allowDoubleBooking: false,
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
    performanceGoals: {
      dailyRevenueTarget: 500,
      weeklyRevenueTarget: 2500,
      monthlyRevenueTarget: 10000,
    },
    ...overrides,
  };
}

describe('teamStaffAdapter', () => {
  describe('teamMemberToStaff', () => {
    it('should convert basic team member to staff', () => {
      const member = createMockTeamMember();
      const staff = teamMemberToStaff(member);

      expect(staff.id).toBe('member-001');
      expect(staff.storeId).toBe('store-001');
      expect(staff.name).toBe('Johnny D'); // Uses displayName
      expect(staff.email).toBe('john@example.com');
      expect(staff.phone).toBe('555-1234');
      expect(staff.avatar).toBe('https://example.com/avatar.jpg');
      expect(staff.isActive).toBe(true);
      expect(staff.status).toBe('available');
    });

    it('should use firstName + lastName when displayName is empty', () => {
      const member = createMockTeamMember({
        profile: {
          id: 'member-001',
          firstName: 'Jane',
          lastName: 'Smith',
          displayName: '',
          email: 'jane@example.com',
          phone: '555-5678',
        },
      });
      const staff = teamMemberToStaff(member);

      expect(staff.name).toBe('Jane Smith');
    });

    it('should extract specialties from services where canPerform is true', () => {
      const member = createMockTeamMember();
      const staff = teamMemberToStaff(member);

      expect(staff.specialties).toHaveLength(2);
      expect(staff.specialties).toContain('svc-001');
      expect(staff.specialties).toContain('svc-002');
      expect(staff.specialties).not.toContain('svc-003'); // canPerform: false
    });

    it('should set status to unavailable when isActive is false', () => {
      const member = createMockTeamMember({ isActive: false });
      const staff = teamMemberToStaff(member);

      expect(staff.isActive).toBe(false);
      expect(staff.status).toBe('unavailable');
    });

    it('should convert working hours to schedule format', () => {
      const member = createMockTeamMember();
      const staff = teamMemberToStaff(member);

      expect(staff.schedule).toHaveLength(3);
      expect(staff.schedule[0]).toEqual({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      });
      expect(staff.schedule[2].isAvailable).toBe(false);
    });

    it('should extract commission rate from commission settings', () => {
      const member = createMockTeamMember();
      const staff = teamMemberToStaff(member);

      expect(staff.commissionRate).toBe(0.40);
    });

    it('should extract role from profile title', () => {
      const member = createMockTeamMember();
      const staff = teamMemberToStaff(member);

      expect(staff.role).toBe('Senior Stylist');
    });

    it('should preserve sync metadata', () => {
      const member = createMockTeamMember();
      const staff = teamMemberToStaff(member);

      expect(staff.syncStatus).toBe('synced');
      expect(staff.createdAt).toBe(member.createdAt);
      expect(staff.updatedAt).toBe(member.updatedAt);
    });

    it('should handle missing optional fields gracefully', () => {
      const member = createMockTeamMember({
        profile: {
          id: 'member-001',
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User',
          email: '',
          phone: '',
        },
        services: [],
        workingHours: {
          regularHours: [],
          timeOffRequests: [],
          scheduleOverrides: [],
        },
        commission: undefined as any,
      });
      const staff = teamMemberToStaff(member);

      expect(staff.email).toBe('');
      expect(staff.phone).toBe('');
      expect(staff.specialties).toEqual([]);
      expect(staff.schedule).toEqual([]);
      expect(staff.commissionRate).toBeUndefined();
    });
  });

  describe('teamMembersToStaff', () => {
    it('should convert array of team members', () => {
      const members = [
        createMockTeamMember({ id: 'member-001' }),
        createMockTeamMember({ id: 'member-002' }),
      ];
      const staffList = teamMembersToStaff(members);

      expect(staffList).toHaveLength(2);
      expect(staffList[0].id).toBe('member-001');
      expect(staffList[1].id).toBe('member-002');
    });

    it('should filter out deleted members by default', () => {
      const members = [
        createMockTeamMember({ id: 'member-001', isDeleted: false }),
        createMockTeamMember({ id: 'member-002', isDeleted: true }),
      ];
      const staffList = teamMembersToStaff(members);

      expect(staffList).toHaveLength(1);
      expect(staffList[0].id).toBe('member-001');
    });

    it('should filter out inactive members by default', () => {
      const members = [
        createMockTeamMember({ id: 'member-001', isActive: true }),
        createMockTeamMember({ id: 'member-002', isActive: false }),
      ];
      const staffList = teamMembersToStaff(members);

      expect(staffList).toHaveLength(1);
      expect(staffList[0].id).toBe('member-001');
    });

    it('should include inactive members when option is set', () => {
      const members = [
        createMockTeamMember({ id: 'member-001', isActive: true }),
        createMockTeamMember({ id: 'member-002', isActive: false }),
      ];
      const staffList = teamMembersToStaff(members, { includeInactive: true });

      expect(staffList).toHaveLength(2);
    });

    it('should include deleted members when option is set', () => {
      const members = [
        createMockTeamMember({ id: 'member-001', isDeleted: false }),
        createMockTeamMember({ id: 'member-002', isDeleted: true }),
      ];
      const staffList = teamMembersToStaff(members, { includeDeleted: true });

      expect(staffList).toHaveLength(2);
    });
  });

  describe('getActiveStaffFromTeam', () => {
    it('should return only active, non-deleted staff', () => {
      const members = [
        createMockTeamMember({ id: 'member-001', isActive: true, isDeleted: false }),
        createMockTeamMember({ id: 'member-002', isActive: false, isDeleted: false }),
        createMockTeamMember({ id: 'member-003', isActive: true, isDeleted: true }),
      ];
      const staffList = getActiveStaffFromTeam(members);

      expect(staffList).toHaveLength(1);
      expect(staffList[0].id).toBe('member-001');
    });
  });

  describe('findStaffInTeam', () => {
    it('should find staff by ID', () => {
      const members = [
        createMockTeamMember({ id: 'member-001' }),
        createMockTeamMember({ id: 'member-002' }),
      ];
      const staff = findStaffInTeam(members, 'member-002');

      expect(staff).toBeDefined();
      expect(staff?.id).toBe('member-002');
    });

    it('should return undefined for non-existent ID', () => {
      const members = [createMockTeamMember({ id: 'member-001' })];
      const staff = findStaffInTeam(members, 'non-existent');

      expect(staff).toBeUndefined();
    });
  });

  describe('getStaffForService', () => {
    it('should return staff who can perform a service', () => {
      const members = [
        createMockTeamMember({
          id: 'member-001',
          services: [
            { serviceId: 'svc-001', serviceName: 'Haircut', serviceCategory: 'Hair', canPerform: true, customPrice: null, customDuration: null },
          ],
        }),
        createMockTeamMember({
          id: 'member-002',
          services: [
            { serviceId: 'svc-001', serviceName: 'Haircut', serviceCategory: 'Hair', canPerform: false, customPrice: null, customDuration: null },
          ],
        }),
        createMockTeamMember({
          id: 'member-003',
          services: [
            { serviceId: 'svc-002', serviceName: 'Color', serviceCategory: 'Hair', canPerform: true, customPrice: null, customDuration: null },
          ],
        }),
      ];
      const staffList = getStaffForService(members, 'svc-001');

      expect(staffList).toHaveLength(1);
      expect(staffList[0].id).toBe('member-001');
    });

    it('should exclude inactive and deleted members', () => {
      const members = [
        createMockTeamMember({
          id: 'member-001',
          isActive: true,
          services: [{ serviceId: 'svc-001', serviceName: 'Haircut', serviceCategory: 'Hair', canPerform: true, customPrice: null, customDuration: null }],
        }),
        createMockTeamMember({
          id: 'member-002',
          isActive: false,
          services: [{ serviceId: 'svc-001', serviceName: 'Haircut', serviceCategory: 'Hair', canPerform: true, customPrice: null, customDuration: null }],
        }),
        createMockTeamMember({
          id: 'member-003',
          isDeleted: true,
          services: [{ serviceId: 'svc-001', serviceName: 'Haircut', serviceCategory: 'Hair', canPerform: true, customPrice: null, customDuration: null }],
        }),
      ];
      const staffList = getStaffForService(members, 'svc-001');

      expect(staffList).toHaveLength(1);
      expect(staffList[0].id).toBe('member-001');
    });
  });
});
