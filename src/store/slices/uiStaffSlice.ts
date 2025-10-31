import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { staffDB } from '../../db/database';
import type { RootState } from '../index';
import { mockStaff } from '../../data/mockData';

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
  specialty?: string;
  activeTickets?: Array<{
    id: string;
    clientName: string;
    serviceName: string;
    status: 'pending' | 'in-service' | 'completed';
  }>;
}

interface UIStaffState {
  staff: UIStaff[];
  loading: boolean;
  error: string | null;
}

const initialState: UIStaffState = {
  staff: mockStaff as UIStaff[], // Initialize with mock data for development
  loading: false,
  error: null,
};

// Async Thunks

// Load all staff from IndexedDB
export const loadStaff = createAsyncThunk(
  'uiStaff/loadAll',
  async (salonId: string) => {
    const allStaff = await staffDB.getAll(salonId);
    return allStaff.map(convertToUIStaff);
  }
);

// Update staff status
export const updateStaffStatus = createAsyncThunk(
  'uiStaff/updateStatus',
  async ({ staffId, status }: { staffId: string; status: 'ready' | 'busy' | 'off' }) => {
    await staffDB.update(staffId, { status: status as any });
    return { staffId, status };
  }
);

// Clock in staff
export const clockInStaff = createAsyncThunk(
  'uiStaff/clockIn',
  async (staffId: string) => {
    await staffDB.clockIn(staffId);
    return staffId;
  }
);

// Clock out staff
export const clockOutStaff = createAsyncThunk(
  'uiStaff/clockOut',
  async (staffId: string) => {
    await staffDB.clockOut(staffId);
    return staffId;
  }
);

// Helper function to convert DB staff to UI staff
function convertToUIStaff(dbStaff: any): UIStaff {
  // Map database status to UI status
  // Database: 'available' | 'busy' | 'on-break' | 'clocked-out' | 'off-today'
  // UI: 'ready' | 'busy' | 'off'
  let uiStatus: 'ready' | 'busy' | 'off' = 'off';
  if (dbStaff.status === 'available') {
    uiStatus = 'ready';
  } else if (dbStaff.status === 'busy' || dbStaff.status === 'on-break') {
    uiStatus = 'busy';
  } else {
    uiStatus = 'off';
  }
  
  // Get specialty - check both specialty field and specialties array
  const specialty = dbStaff.specialty || dbStaff.specialties?.[0] || 'neutral';
  
  return {
    id: dbStaff.id,
    name: dbStaff.name,
    shortName: dbStaff.name.split(' ')[0] + ' ' + (dbStaff.name.split(' ')[1]?.[0] || '') + '.',
    time: dbStaff.clockedInAt ? new Date(dbStaff.clockedInAt).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    }) : '',
    image: dbStaff.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbStaff.name)}`,
    status: uiStatus,
    color: getStaffColor(dbStaff.id),
    count: dbStaff.servicesCountToday || 0,
    revenue: dbStaff.revenueToday ? {
      transactions: dbStaff.servicesCountToday || 0,
      tickets: dbStaff.servicesCountToday || 0,
      amount: dbStaff.revenueToday
    } : null,
    turnCount: 0,
    ticketsServicedCount: dbStaff.servicesCountToday || 0,
    totalSalesAmount: dbStaff.revenueToday || 0,
    specialty: specialty as 'neutral' | 'nails' | 'hair' | 'massage' | 'skincare' | 'waxing' | 'combo' | 'support',
    activeTickets: [],
  };
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
      });
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
        // Only update if we got data from DB, otherwise keep mock data
        if (action.payload && action.payload.length > 0) {
          state.staff = action.payload;
        }
        // If DB is empty, keep the mock data that was initialized
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
      );
  },
});

export const { 
  clearError, 
  updateStaffRevenue, 
  updateStaffTicketCount,
  removePendingTicketFromStaff,
  resetAllStaffStatus,
} = uiStaffSlice.actions;

// Selectors
export const selectAllStaff = (state: RootState) => state.uiStaff.staff;
export const selectReadyStaff = (state: RootState) => 
  state.uiStaff.staff.filter(s => s.status === 'ready');
export const selectBusyStaff = (state: RootState) => 
  state.uiStaff.staff.filter(s => s.status === 'busy');
export const selectStaffLoading = (state: RootState) => state.uiStaff.loading;
export const selectStaffError = (state: RootState) => state.uiStaff.error;

export default uiStaffSlice.reducer;
