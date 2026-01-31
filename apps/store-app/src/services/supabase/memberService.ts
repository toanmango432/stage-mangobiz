/**
 * @deprecated This service is deprecated. Use teamThunks from '@/store/slices/team/teamThunks' instead.
 *
 * Supabase Member Service (DEPRECATED)
 * Fetches members from Supabase and converts to TeamMemberSettings format
 *
 * Migration guide:
 * - fetchSupabaseMembers -> dispatch(fetchTeamMembers(storeId))
 * - fetchSupabaseMemberById -> selectTeamMemberById selector
 * - updateSupabaseMember -> dispatch(updateTeamMember(...))
 * - createSupabaseMember -> dispatch(createTeamMember(...))
 * - deleteSupabaseMember -> dispatch(deleteTeamMember(...))
 */

import { supabase } from './client';
import type { MemberRow } from './types';
import type { TeamMemberSettings, StaffRole } from '../../components/team-settings/types';

// Map Supabase member roles to TeamSettings roles
const mapRole = (supabaseRole: MemberRow['role']): StaffRole => {
  const roleMap: Record<string, StaffRole> = {
    'owner': 'owner',
    'admin': 'owner',
    'manager': 'manager',
    'staff': 'stylist',
    'receptionist': 'receptionist',
    'junior': 'junior_stylist',
  };
  return roleMap[supabaseRole] || 'stylist';
};

// Convert Supabase member to TeamMemberSettings
export function memberRowToTeamMemberSettings(member: MemberRow, storeId: string): TeamMemberSettings {
  // Parse name into first/last
  const nameParts = (member.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const now = new Date().toISOString();

  return {
    // BaseSyncableEntity fields
    id: member.id,
    tenantId: member.tenant_id || 'default-tenant',
    storeId: storeId,
    syncStatus: 'synced',
    version: 1,
    vectorClock: {},
    lastSyncedVersion: 1,
    createdAt: member.created_at,
    updatedAt: member.updated_at,
    createdBy: 'system',
    createdByDevice: 'system',
    lastModifiedBy: 'system',
    lastModifiedByDevice: 'system',
    isDeleted: false,

    // Profile
    profile: {
      id: member.id,
      firstName,
      lastName,
      displayName: member.name,
      email: member.email,
      phone: member.phone || '',
      avatar: member.avatar_url || undefined,
      bio: undefined,
      title: undefined,
      employeeId: undefined,
      dateOfBirth: undefined,
      hireDate: now.split('T')[0],
      emergencyContact: undefined,
      address: undefined,
    },

    // Services (empty - can be populated from services table)
    services: [],

    // Working hours (defaults)
    workingHours: {
      regularHours: [
        { dayOfWeek: 0, isWorking: false, shifts: [] },
        { dayOfWeek: 1, isWorking: true, shifts: [{ startTime: '09:00', endTime: '18:00' }] },
        { dayOfWeek: 2, isWorking: true, shifts: [{ startTime: '09:00', endTime: '18:00' }] },
        { dayOfWeek: 3, isWorking: true, shifts: [{ startTime: '09:00', endTime: '18:00' }] },
        { dayOfWeek: 4, isWorking: true, shifts: [{ startTime: '09:00', endTime: '18:00' }] },
        { dayOfWeek: 5, isWorking: true, shifts: [{ startTime: '09:00', endTime: '18:00' }] },
        { dayOfWeek: 6, isWorking: false, shifts: [] },
      ],
      timeOffRequests: [],
      scheduleOverrides: [],
      defaultBreakDuration: 30,
      autoScheduleBreaks: true,
    },

    // Permissions
    permissions: {
      role: mapRole(member.role),
      permissions: [],
      canAccessAdminPortal: member.role === 'owner' || member.role === 'admin' || member.role === 'manager',
      canAccessReports: member.role === 'owner' || member.role === 'admin' || member.role === 'manager',
      canModifyPrices: member.role === 'owner' || member.role === 'admin',
      canProcessRefunds: member.role === 'owner' || member.role === 'admin' || member.role === 'manager',
      canDeleteRecords: member.role === 'owner' || member.role === 'admin',
      canManageTeam: member.role === 'owner' || member.role === 'admin' || member.role === 'manager',
      canViewOthersCalendar: true,
      canBookForOthers: member.role !== 'junior',
      canEditOthersAppointments: member.role === 'owner' || member.role === 'admin' || member.role === 'manager',
      pinRequired: true,
      pin: member.pin || undefined,
    },

    // Commission (defaults)
    commission: {
      type: 'percentage',
      basePercentage: 50,
      productCommission: 10,
      tipHandling: 'keep_all',
    },

    // Payroll (defaults)
    payroll: {
      payPeriod: 'bi-weekly',
    },

    // Online booking (defaults)
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

    // Notifications (defaults)
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

    // Performance goals (empty)
    performanceGoals: {},

    // Active status
    isActive: member.status === 'active',
  };
}

/**
 * @deprecated Use dispatch(fetchTeamMembers(storeId)) from teamThunks instead
 */
// Fetch all members for a store from Supabase
export async function fetchSupabaseMembers(storeId: string): Promise<TeamMemberSettings[]> {
  console.warn('DEPRECATED: memberService.fetchSupabaseMembers is deprecated, use teamThunks.fetchTeamMembers instead');
  try {
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .contains('store_ids', [storeId]);

    if (error) {
      console.error('Error fetching members from Supabase:', error);
      return [];
    }

    return (members || []).map((m: MemberRow) => memberRowToTeamMemberSettings(m, storeId));
  } catch (err) {
    console.error('Failed to fetch Supabase members:', err);
    return [];
  }
}

/**
 * @deprecated Use selectTeamMemberById selector from teamSlice instead
 */
// Fetch single member by ID
export async function fetchSupabaseMemberById(memberId: string, storeId: string): Promise<TeamMemberSettings | null> {
  console.warn('DEPRECATED: memberService.fetchSupabaseMemberById is deprecated, use teamThunks instead');
  try {
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error || !member) {
      console.error('Error fetching member from Supabase:', error);
      return null;
    }

    return memberRowToTeamMemberSettings(member, storeId);
  } catch (err) {
    console.error('Failed to fetch Supabase member:', err);
    return null;
  }
}

/**
 * @deprecated Use dispatch(updateTeamMember(...)) from teamThunks instead
 */
// Update member in Supabase
export async function updateSupabaseMember(
  memberId: string,
  updates: {
    name?: string;
    email?: string;
    phone?: string;
    role?: MemberRow['role'];
    status?: MemberRow['status'];
    avatar_url?: string;
    pin?: string;
    password_hash?: string;
  }
): Promise<boolean> {
  console.warn('DEPRECATED: memberService.updateSupabaseMember is deprecated, use teamThunks instead');
  try {
    const { error } = await supabase
      .from('members')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId);

    if (error) {
      console.error('Error updating member in Supabase:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to update Supabase member:', err);
    return false;
  }
}

/**
 * @deprecated Use dispatch(createTeamMember(...)) from teamThunks instead
 */
// Create member in Supabase
export async function createSupabaseMember(
  member: {
    name: string;
    email: string;
    password_hash: string;
    pin?: string;
    phone?: string;
    role?: MemberRow['role'];
    store_ids: string[];
    tenant_id?: string;
  }
): Promise<MemberRow | null> {
  console.warn('DEPRECATED: memberService.createSupabaseMember is deprecated, use teamThunks instead');
  try {
    const { data, error } = await supabase
      .from('members')
      .insert({
        name: member.name,
        email: member.email,
        password_hash: member.password_hash,
        pin: member.pin || null,
        phone: member.phone || null,
        role: member.role || 'staff',
        store_ids: member.store_ids,
        tenant_id: member.tenant_id || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating member in Supabase:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Failed to create Supabase member:', err);
    return null;
  }
}

/**
 * @deprecated Use dispatch(deleteTeamMember(...)) from teamThunks instead
 */
// Delete member in Supabase (soft delete by setting status to inactive)
export async function deleteSupabaseMember(memberId: string): Promise<boolean> {
  console.warn('DEPRECATED: memberService.deleteSupabaseMember is deprecated, use teamThunks instead');
  try {
    const { error } = await supabase
      .from('members')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId);

    if (error) {
      console.error('Error deleting member in Supabase:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to delete Supabase member:', err);
    return false;
  }
}

export const memberService = {
  fetchMembers: fetchSupabaseMembers,
  fetchMemberById: fetchSupabaseMemberById,
  updateMember: updateSupabaseMember,
  createMember: createSupabaseMember,
  deleteMember: deleteSupabaseMember,
  memberRowToTeamMemberSettings,
};

export default memberService;
