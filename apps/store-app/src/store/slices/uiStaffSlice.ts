import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { TeamMemberSettings } from '../../components/team-settings/types';

// Turn entry for tracking service history
export interface TurnEntry {
  id: string;
  timestamp: string; // ISO 8601 string
  turnNumber: number;
  amount: number;
  serviceCount: number;
  bonusAmount: number;
  clientName: string;
  services: string[];
  type: 'service' | 'checkout' | 'void';
  ticketId: string;
}

// Valid specialty types that match StaffCardVertical's SPECIALTY_COLORS
export type Specialty = 'neutral' | 'nails' | 'hair' | 'massage' | 'skincare' | 'waxing' | 'combo' | 'support';

// UI-specific staff interface (matching existing TicketContext)
export interface UIStaff {
  id: string;
  name: string;
  shortName?: string;
  time: string;
  image: string;
  status: 'ready' | 'busy' | 'off';
  color: string;
  count: number;
  revenue?: {
    transactions: number;
    tickets: number;
    amount: number;
  } | null;
  nextAppointmentTime?: string;
  nextAppointmentEta?: string;
  lastServiceTime?: string;
  lastServiceAgo?: string;
  turnCount?: number;
  ticketsServicedCount?: number;
  totalSalesAmount?: number;
  specialty?: Specialty;
  activeTickets?: Array<{
    id: string;
    clientName: string;
    serviceName: string;
    status: 'pending' | 'in-service' | 'completed';
  }>;
  currentTicketInfo?: {
    ticketId: string;
    clientName: string;
    serviceName: string;
    startTime: string;
    progress?: number;  // Percentage 0-100
  };
  // Turn tracking fields
  clockInTime?: string; // ISO 8601 string - stored as string for Redux serialization
  serviceTurn?: number;
  bonusTurn?: number;
  adjustTurn?: number;
  tardyTurn?: number;
  appointmentTurn?: number;
  partialTurn?: number;
  queuePosition?: number;
  turnLogs?: TurnEntry[];
}

interface UIStaffState {
  staff: UIStaff[];
  loading: boolean;
  error: string | null;
}

// Initialize with empty array - will load from teamDB
const initialState: UIStaffState = {
  staff: [],
  loading: false,
  error: null,
};

// Async Thunks

// Load all staff from Redux teamSlice (Team Settings is now the source of truth)
// Also checks timesheet to determine who is clocked in
export const loadStaff = createAsyncThunk(
  'uiStaff/loadAll',
  async (storeId: string, { getState }) => {
    const { timesheetDB } = await import('../../db/timesheetOperations');

    console.log('[uiStaffSlice] Loading staff for storeId:', storeId);

    // Get team members from Redux state (same source as Team Settings)
    const state = getState() as RootState;
    // members is Record<string, TeamMemberSettings>, convert to array and filter
    const membersRecord = state.team.members;
    const teamMembers = Object.values(membersRecord).filter((m: { isActive?: boolean; isDeleted?: boolean }) => m.isActive && !m.isDeleted);
    console.log('[uiStaffSlice] Found team members from Redux:', teamMembers.length);

    // If no members in Redux, try IndexedDB as fallback
    let membersToUse = teamMembers;
    if (teamMembers.length === 0) {
      console.log('[uiStaffSlice] No members in Redux, trying IndexedDB...');
      const { teamDB } = await import('../../db/teamOperations');
      membersToUse = await teamDB.getActiveMembers(storeId);
      console.log('[uiStaffSlice] Found team members from IndexedDB:', membersToUse.length);
    }

    const uiStaff = membersToUse.map((m: any) => convertTeamMemberToUIStaff(m));

    // PERFORMANCE FIX: Fetch all shift statuses in parallel instead of sequential N+1 queries
    // This reduces 10 staff members from ~500ms (50ms x 10) to ~50ms (parallel)
    const shiftStatusPromises = uiStaff.map((staff) => {
      const member = membersToUse.find((m: any) => m.id === staff.id);
      const memberStoreId = member?.storeId || storeId;
      return timesheetDB.getStaffShiftStatus(memberStoreId, staff.id)
        .catch((error) => {
          console.log(`[uiStaffSlice] Error checking shift status for ${staff.name}:`, error);
          return null; // Return null on error, staff keeps default 'off' status
        });
    });

    const shiftStatusResults = await Promise.all(shiftStatusPromises);

    // Apply shift status results to each staff member
    uiStaff.forEach((staff, index) => {
      const shiftStatus = shiftStatusResults[index];
      if (shiftStatus && shiftStatus.isClockedIn) {
        staff.status = 'ready';
        if (shiftStatus.clockInTime) {
          staff.clockInTime = new Date(shiftStatus.clockInTime).toISOString();
          staff.time = new Date(shiftStatus.clockInTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          });
        }
        console.log(`[uiStaffSlice] Staff ${staff.name} is CLOCKED IN, status set to 'ready'`);
      }
    });

    console.log('[uiStaffSlice] Final staff statuses:', uiStaff.map((s: UIStaff) => ({ name: s.name, status: s.status })));
    return uiStaff;
  }
);

// Update staff status (now updates in-memory only, team member status managed separately)
export const updateStaffStatus = createAsyncThunk(
  'uiStaff/updateStatus',
  async ({ staffId, status }: { staffId: string; status: 'ready' | 'busy' | 'off' }) => {
    // Status is managed in Redux state for real-time UI updates
    // Actual staff data is persisted in teamDB
    return { staffId, status };
  }
);

// Clock in staff
export const clockInStaff = createAsyncThunk(
  'uiStaff/clockIn',
  async (staffId: string) => {
    // Clock in is handled by timesheet system
    // This just updates the UI status
    return staffId;
  }
);

// Clock out staff
export const clockOutStaff = createAsyncThunk(
  'uiStaff/clockOut',
  async (staffId: string) => {
    // Clock out is handled by timesheet system
    // This just updates the UI status
    return staffId;
  }
);

// Helper function to convert TeamMemberSettings to UIStaff
function convertTeamMemberToUIStaff(member: TeamMemberSettings): UIStaff {
  const fullName = `${member.profile.firstName} ${member.profile.lastName}`;
  const shortName = member.profile.displayName ||
    `${member.profile.firstName} ${member.profile.lastName.charAt(0)}.`;

  // Get specialty from services or online booking specialties
  const specialty = getSpecialtyFromMember(member);

  return {
    id: member.id,
    name: fullName,
    shortName: shortName,
    time: '', // Will be set when clocked in via timesheet
    image: member.profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
    status: 'off', // Default to off until clocked in via timesheet
    color: getStaffColor(member.id),
    count: 0,
    revenue: null,
    turnCount: 0,
    ticketsServicedCount: 0,
    totalSalesAmount: 0,
    specialty: specialty,
    activeTickets: [],
  };
}

// Helper to determine specialty from team member data
function getSpecialtyFromMember(member: TeamMemberSettings): Specialty {
  // Check online booking specialties first
  if (member.onlineBooking.specialties && member.onlineBooking.specialties.length > 0) {
    const specialty = member.onlineBooking.specialties[0].toLowerCase();
    // Map common specialty names to valid specialty types
    if (specialty.includes('nail')) return 'nails';
    if (specialty.includes('hair') || specialty.includes('color') || specialty.includes('cut') || specialty.includes('styl')) return 'hair';
    if (specialty.includes('massage')) return 'massage';
    if (specialty.includes('skin') || specialty.includes('facial') || specialty.includes('esth')) return 'skincare';
    if (specialty.includes('wax')) return 'waxing';
    if (specialty.includes('combo') || specialty.includes('multi')) return 'combo';
    if (specialty.includes('support') || specialty.includes('recept') || specialty.includes('assist')) return 'support';
    // Don't return raw specialty - fall through to other checks
  }

  // Check role for specialty hints
  const role = member.permissions.role;
  if (role === 'nail_technician') return 'nails';
  if (role === 'barber' || role === 'colorist' || role === 'stylist' || role === 'senior_stylist' || role === 'junior_stylist') return 'hair';
  if (role === 'massage_therapist') return 'massage';
  if (role === 'esthetician') return 'skincare';
  if (role === 'makeup_artist') return 'combo';
  if (role === 'receptionist' || role === 'assistant') return 'support';

  // Check services for specialty
  const enabledServices = member.services.filter(s => s.canPerform);
  if (enabledServices.length > 0) {
    const categories = enabledServices.map(s => s.serviceCategory.toLowerCase());
    if (categories.some(c => c.includes('nail'))) return 'nails';
    if (categories.some(c => c.includes('hair'))) return 'hair';
    if (categories.some(c => c.includes('massage'))) return 'massage';
    if (categories.some(c => c.includes('skin') || c.includes('facial'))) return 'skincare';
    if (categories.some(c => c.includes('wax'))) return 'waxing';
  }

  return 'neutral';
}

// Helper to get consistent color for staff
function getStaffColor(staffId: string): string {
  const colors = [
    'bg-[#9B5DE5]', 'bg-[#3F83F8]', 'bg-[#4CC2A9]', 'bg-[#F59E0B]',
    'bg-[#EF4444]', 'bg-[#8B5CF6]', 'bg-[#10B981]', 'bg-[#F97316]',
    'bg-[#06B6D4]', 'bg-[#EC4899]', 'bg-[#6366F1]', 'bg-[#14B8A6]',
    'bg-[#F43F5E]', 'bg-[#A855F7]', 'bg-[#22C55E]', 'bg-[#FB923C]',
    'bg-[#0EA5E9]', 'bg-[#D946EF]', 'bg-[#84CC16]', 'bg-[#FBBF24]',
  ];

  // Use staff ID to consistently assign color
  const hash = staffId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// Slice
const uiStaffSlice = createSlice({
  name: 'uiStaff',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Update staff revenue (from ticket completion)
    updateStaffRevenue: (state, action: PayloadAction<{
      staffId: string;
      amount: number;
    }>) => {
      const staff = state.staff.find(s => s.id === action.payload.staffId);
      if (staff) {
        if (!staff.revenue) {
          staff.revenue = { transactions: 0, tickets: 0, amount: 0 };
        }
        staff.revenue.transactions += 1;
        staff.revenue.tickets += 1;
        staff.revenue.amount += action.payload.amount;
        staff.totalSalesAmount = (staff.totalSalesAmount || 0) + action.payload.amount;
      }
    },
    // Update staff ticket count
    updateStaffTicketCount: (state, action: PayloadAction<{
      staffId: string;
      increment: number;
    }>) => {
      const staff = state.staff.find(s => s.id === action.payload.staffId);
      if (staff) {
        staff.count += action.payload.increment;
        staff.ticketsServicedCount = (staff.ticketsServicedCount || 0) + action.payload.increment;
      }
    },
    // Remove pending ticket from staff (after checkout)
    removePendingTicketFromStaff: (state, action: PayloadAction<{
      staffId: string;
      ticketId: string;
    }>) => {
      const staff = state.staff.find(s => s.id === action.payload.staffId);
      if (staff && staff.activeTickets) {
        staff.activeTickets = staff.activeTickets.filter(t => t.id !== action.payload.ticketId);
      }
    },
    // Reset all staff status
    resetAllStaffStatus: (state) => {
      state.staff.forEach(staff => {
        staff.status = 'ready';
        staff.count = 0;
        staff.revenue = null;
        staff.turnCount = 0;
        staff.ticketsServicedCount = 0;
        staff.totalSalesAmount = 0;
        staff.activeTickets = [];
        staff.turnLogs = [];
        staff.serviceTurn = 0;
        staff.bonusTurn = 0;
        staff.adjustTurn = 0;
      });
    },
    // Adjust staff turn (manual adjustment)
    adjustStaffTurn: (state, action: PayloadAction<{
      staffId: string;
      amount: number;
      reason: string;
    }>) => {
      const staff = state.staff.find(s => s.id === action.payload.staffId);
      if (staff) {
        staff.adjustTurn = (staff.adjustTurn ?? 0) + action.payload.amount;
        staff.turnCount = (staff.turnCount ?? 0) + action.payload.amount;

        // Add to turn logs
        if (!staff.turnLogs) staff.turnLogs = [];
        staff.turnLogs.push({
          id: `adj-${Date.now()}`,
          timestamp: new Date().toISOString(),
          turnNumber: staff.turnLogs.length + 1,
          amount: action.payload.amount,
          serviceCount: 0,
          bonusAmount: 0,
          clientName: 'Manual Adjustment',
          services: [action.payload.reason],
          type: 'service',
          ticketId: '',
        });
      }
    },
    // Add turn log entry (from ticket completion)
    addTurnLog: (state, action: PayloadAction<{
      staffId: string;
      turnLog: TurnEntry;
    }>) => {
      const staff = state.staff.find(s => s.id === action.payload.staffId);
      if (staff) {
        if (!staff.turnLogs) staff.turnLogs = [];
        staff.turnLogs.push(action.payload.turnLog);
        staff.serviceTurn = (staff.serviceTurn ?? 0) + 1;
        staff.turnCount = (staff.turnCount ?? 0) + 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Load staff
      .addCase(loadStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadStaff.fulfilled, (state, action) => {
        state.loading = false;
        // Always use data from teamDB (source of truth)
        state.staff = action.payload;
      })
      .addCase(loadStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load staff';
      })
      // Update status
      .addCase(updateStaffStatus.fulfilled, (state, action) => {
        const { staffId, status } = action.payload;
        const staff = state.staff.find(s => s.id === staffId);
        if (staff) {
          staff.status = status;
        }
      })
      // Clock in
      .addCase(clockInStaff.fulfilled, (state, action) => {
        const staff = state.staff.find(s => s.id === action.payload);
        if (staff) {
          staff.status = 'ready';
        }
      })
      // Clock out
      .addCase(clockOutStaff.fulfilled, (state, action) => {
        const staff = state.staff.find(s => s.id === action.payload);
        if (staff) {
          staff.status = 'off';
        }
      })
      // Listen to ticket assignment - update staff status and active tickets
      .addMatcher(
        (action) => action.type === 'uiTickets/assign/fulfilled',
        (state, action: any) => {
          const { staffId, ticketId, ticketInfo } = action.payload;
          const staff = state.staff.find(s => s.id === staffId);

          if (staff && ticketInfo) {
            // Change status to busy
            staff.status = 'busy';

            // Add to active tickets
            if (!staff.activeTickets) {
              staff.activeTickets = [];
            }

            staff.activeTickets.push({
              id: ticketId,
              clientName: ticketInfo.clientName,
              serviceName: ticketInfo.serviceName,
              status: 'in-service',
            });

            // Increment ticket count
            staff.count = (staff.count || 0) + 1;
          }
        }
      )
      // Listen to ticket completion - update staff status and move ticket to pending
      .addMatcher(
        (action) => action.type === 'uiTickets/complete/fulfilled',
        (state, action: any) => {
          const { ticketId, staffId } = action.payload;

          // Find staff with this ticket
          const staff = state.staff.find(s => s.id === staffId);

          if (staff && staff.activeTickets) {
            // Find the ticket in active tickets
            const ticketIndex = staff.activeTickets.findIndex(t => t.id === ticketId);

            if (ticketIndex !== -1) {
              // Change ticket status to pending (keep it in activeTickets but mark as pending)
              staff.activeTickets[ticketIndex].status = 'pending';

              // Check if staff has any in-service tickets left
              const hasInServiceTickets = staff.activeTickets.some(t => t.status === 'in-service');

              // If no more in-service tickets, change status back to ready
              if (!hasInServiceTickets) {
                staff.status = 'ready';
              }

              // Update last service time
              const now = new Date();
              staff.lastServiceTime = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              });
              staff.lastServiceAgo = 'just now';

              // Increment serviced count
              staff.ticketsServicedCount = (staff.ticketsServicedCount || 0) + 1;
            }
          }
        }
      )
      // Listen to timesheet clock in - update staff status to 'ready'
      .addMatcher(
        (action) => action.type === 'timesheet/clockIn/fulfilled',
        (state, action: any) => {
          const timesheet = action.payload;
          const staff = state.staff.find(s => s.id === timesheet.staffId);
          if (staff) {
            staff.status = 'ready';
            staff.clockInTime = new Date(timesheet.actualClockIn).toISOString();
            staff.time = new Date(timesheet.actualClockIn).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            });
          }
        }
      )
      // Listen to timesheet clock out - update staff status to 'off'
      .addMatcher(
        (action) => action.type === 'timesheet/clockOut/fulfilled',
        (state, action: any) => {
          const timesheet = action.payload;
          const staff = state.staff.find(s => s.id === timesheet.staffId);
          if (staff) {
            staff.status = 'off';
            staff.clockInTime = undefined;
            staff.time = '';
          }
        }
      );
  },
});

export const {
  clearError,
  updateStaffRevenue,
  updateStaffTicketCount,
  removePendingTicketFromStaff,
  resetAllStaffStatus,
  adjustStaffTurn,
  addTurnLog,
} = uiStaffSlice.actions;

// Selectors
export const selectAllStaff = (state: RootState) => state.uiStaff.staff;
export const selectReadyStaff = (state: RootState) =>
  state.uiStaff.staff.filter(s => s.status === 'ready');
export const selectBusyStaff = (state: RootState) =>
  state.uiStaff.staff.filter(s => s.status === 'busy');
export const selectStaffLoading = (state: RootState) => state.uiStaff.loading;
export const selectStaffError = (state: RootState) => state.uiStaff.error;

// Selector for TurnTracker - returns staff with turn data in the expected format
export const selectStaffForTurnTracker = (state: RootState) => {
  return state.uiStaff.staff
    .filter(s => s.status !== 'off') // Only show clocked-in staff
    .map((staff, index) => ({
      id: staff.id,
      name: staff.name.toUpperCase(),
      photo: staff.image,
      clockInTime: staff.clockInTime || new Date().toISOString(),
      serviceTurn: staff.serviceTurn ?? staff.count ?? 0,
      bonusTurn: staff.bonusTurn ?? 0,
      adjustTurn: staff.adjustTurn ?? 0,
      tardyTurn: staff.tardyTurn ?? 0,
      appointmentTurn: staff.appointmentTurn ?? 0,
      partialTurn: staff.partialTurn ?? 0,
      totalTurn: staff.turnCount ?? staff.count ?? 0,
      queuePosition: staff.queuePosition ?? (index + 1),
      serviceTotal: staff.totalSalesAmount ?? staff.revenue?.amount ?? 0,
      turnLogs: staff.turnLogs ?? [],
    }));
};

// Selector for total turn statistics
export const selectTurnStats = (state: RootState) => {
  const staff = state.uiStaff.staff.filter(s => s.status !== 'off');
  return {
    totalStaff: staff.length,
    totalTurns: staff.reduce((sum, s) => sum + (s.serviceTurn ?? s.count ?? 0), 0),
    totalRevenue: staff.reduce((sum, s) => sum + (s.totalSalesAmount ?? s.revenue?.amount ?? 0), 0),
  };
};

export default uiStaffSlice.reducer;
