import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { appointmentService } from '../../services/appointmentService';
import {
  Appointment,
  LocalAppointment,
  AppointmentRequest,
  TicketDTO,
  EditAppt,
  AppointmentFilters,
  CalendarViewState,
  AppointmentsByDate,
  AppointmentsByStaff,
} from '../../types/appointment';
import { startOfDay, endOfDay } from '../../utils/timeUtils';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface AppointmentState {
  // Data
  appointments: LocalAppointment[];
  appointmentsByDate: AppointmentsByDate;
  appointmentsByStaff: AppointmentsByStaff;
  
  // Calendar View State
  calendarView: CalendarViewState;
  
  // UI State
  selectedAppointmentId: string | null;
  isCreatingAppointment: boolean;
  isEditingAppointment: boolean;
  
  // Loading States
  loading: {
    fetchAppointments: boolean;
    createAppointment: boolean;
    updateAppointment: boolean;
    deleteAppointment: boolean;
  };
  
  // Error States
  error: {
    fetchAppointments: string | null;
    createAppointment: string | null;
    updateAppointment: string | null;
    deleteAppointment: string | null;
  };
  
  // Sync State
  syncStatus: {
    lastSync: Date | null;
    pendingCount: number;
    isSyncing: boolean;
  };
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AppointmentState = {
  appointments: [],
  appointmentsByDate: {},
  appointmentsByStaff: {},
  
  calendarView: {
    selectedDate: new Date(),
    viewMode: 'day',
    timeWindowMode: 'fullday',
    filters: {},
    selectedStaffIds: [],
  },
  
  selectedAppointmentId: null,
  isCreatingAppointment: false,
  isEditingAppointment: false,
  
  loading: {
    fetchAppointments: false,
    createAppointment: false,
    updateAppointment: false,
    deleteAppointment: false,
  },
  
  error: {
    fetchAppointments: null,
    createAppointment: null,
    updateAppointment: null,
    deleteAppointment: null,
  },
  
  syncStatus: {
    lastSync: null,
    pendingCount: 0,
    isSyncing: false,
  },
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Fetch appointments for a date range
 */
export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (params: { customerId?: number; rvcNo: number; startDate: Date; endDate: Date }) => {
    const { customerId, rvcNo, startDate, endDate } = params;
    
    if (customerId) {
      // Fetch for specific customer
      const appointments = await appointmentService.getAppointmentList(customerId, rvcNo);
      return appointments;
    } else {
      // Fetch all appointments in date range
      // TODO: Implement date range API endpoint or fetch from IndexedDB
      return [];
    }
  }
);

/**
 * Create new appointment(s)
 */
export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (params: { appointments: AppointmentRequest[]; rvcNo: number }) => {
    const { appointments, rvcNo } = params;
    const result = await appointmentService.bookAppointment(appointments, rvcNo);
    return result;
  }
);

/**
 * Update existing appointment
 */
export const updateAppointment = createAsyncThunk(
  'appointments/updateAppointment',
  async (params: { rvcNo: number; appointmentData: any }) => {
    const { rvcNo, appointmentData } = params;
    const result = await appointmentService.editAppointment(rvcNo, appointmentData);
    return result;
  }
);

/**
 * Cancel appointment
 */
export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async (params: { id: number; reason: string; rvcNo: number }) => {
    const { id, reason, rvcNo } = params;
    const result = await appointmentService.cancelAppointment(id, reason, rvcNo);
    return { id, result };
  }
);

/**
 * Get appointment detail for editing
 */
export const fetchAppointmentDetail = createAsyncThunk(
  'appointments/fetchAppointmentDetail',
  async (params: { id: number; partyId: number; rvcNo: number }) => {
    const { id, partyId, rvcNo } = params;
    const detail = await appointmentService.getAppointmentDetail(id, partyId, rvcNo);
    return detail;
  }
);

// ============================================================================
// SLICE
// ============================================================================

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    // Calendar View Actions
    setSelectedDate: (state, action: PayloadAction<Date>) => {
      state.calendarView.selectedDate = action.payload;
    },
    
    setViewMode: (state, action: PayloadAction<'day' | 'week' | 'month'>) => {
      state.calendarView.viewMode = action.payload;
    },
    
    setTimeWindowMode: (state, action: PayloadAction<'2hour' | 'fullday'>) => {
      state.calendarView.timeWindowMode = action.payload;
    },
    
    setFilters: (state, action: PayloadAction<AppointmentFilters>) => {
      state.calendarView.filters = action.payload;
    },
    
    setSelectedStaffIds: (state, action: PayloadAction<string[]>) => {
      state.calendarView.selectedStaffIds = action.payload;
    },
    
    toggleStaffFilter: (state, action: PayloadAction<string>) => {
      const staffId = action.payload;
      const index = state.calendarView.selectedStaffIds.indexOf(staffId);
      
      if (index > -1) {
        state.calendarView.selectedStaffIds.splice(index, 1);
      } else {
        state.calendarView.selectedStaffIds.push(staffId);
      }
    },
    
    clearFilters: (state) => {
      state.calendarView.filters = {};
      state.calendarView.selectedStaffIds = [];
    },
    
    // Appointment Selection
    selectAppointment: (state, action: PayloadAction<string | null>) => {
      state.selectedAppointmentId = action.payload;
    },
    
    // Modal States
    openCreateModal: (state) => {
      state.isCreatingAppointment = true;
    },
    
    closeCreateModal: (state) => {
      state.isCreatingAppointment = false;
    },
    
    openEditModal: (state) => {
      state.isEditingAppointment = true;
    },
    
    closeEditModal: (state) => {
      state.isEditingAppointment = false;
      state.selectedAppointmentId = null;
    },
    
    // Local Appointment Management
    addLocalAppointment: (state, action: PayloadAction<LocalAppointment>) => {
      state.appointments.push(action.payload);
      indexAppointments(state);
    },
    
    updateLocalAppointment: (state, action: PayloadAction<{ id: string; updates: Partial<LocalAppointment> }>) => {
      const { id, updates } = action.payload;
      const index = state.appointments.findIndex(apt => apt.id === id);
      
      if (index !== -1) {
        state.appointments[index] = { ...state.appointments[index], ...updates };
        indexAppointments(state);
      }
    },
    
    removeLocalAppointment: (state, action: PayloadAction<string>) => {
      state.appointments = state.appointments.filter(apt => apt.id !== action.payload);
      indexAppointments(state);
    },
    
    // Sync Status
    updateSyncStatus: (state, action: PayloadAction<{ lastSync?: Date; pendingCount?: number; isSyncing?: boolean }>) => {
      state.syncStatus = { ...state.syncStatus, ...action.payload };
    },
    
    // Clear Errors
    clearError: (state, action: PayloadAction<keyof AppointmentState['error']>) => {
      state.error[action.payload] = null;
    },
    
    clearAllErrors: (state) => {
      state.error = {
        fetchAppointments: null,
        createAppointment: null,
        updateAppointment: null,
        deleteAppointment: null,
      };
    },
  },
  
  extraReducers: (builder) => {
    // Fetch Appointments
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading.fetchAppointments = true;
        state.error.fetchAppointments = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading.fetchAppointments = false;
        // Convert TicketDTO to LocalAppointment
        state.appointments = action.payload.map(ticketDTOToLocalAppointment);
        indexAppointments(state);
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading.fetchAppointments = false;
        state.error.fetchAppointments = action.error.message || 'Failed to fetch appointments';
      });
    
    // Create Appointment
    builder
      .addCase(createAppointment.pending, (state) => {
        state.loading.createAppointment = true;
        state.error.createAppointment = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.loading.createAppointment = false;
        state.isCreatingAppointment = false;
        
        // Update sync status
        if (action.payload.status === 200) {
          state.syncStatus.lastSync = new Date();
        }
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading.createAppointment = false;
        state.error.createAppointment = action.error.message || 'Failed to create appointment';
      });
    
    // Update Appointment
    builder
      .addCase(updateAppointment.pending, (state) => {
        state.loading.updateAppointment = true;
        state.error.updateAppointment = null;
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        state.loading.updateAppointment = false;
        state.isEditingAppointment = false;
        state.selectedAppointmentId = null;
        
        if (action.payload.status === 200) {
          state.syncStatus.lastSync = new Date();
        }
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.loading.updateAppointment = false;
        state.error.updateAppointment = action.error.message || 'Failed to update appointment';
      });
    
    // Cancel Appointment
    builder
      .addCase(cancelAppointment.pending, (state) => {
        state.loading.deleteAppointment = true;
        state.error.deleteAppointment = null;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.loading.deleteAppointment = false;
        
        // Update local appointment status
        const appointment = state.appointments.find(apt => apt.serverId === action.payload.id);
        if (appointment) {
          appointment.status = 'cancelled';
        }
        
        indexAppointments(state);
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.loading.deleteAppointment = false;
        state.error.deleteAppointment = action.error.message || 'Failed to cancel appointment';
      });
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Index appointments by date and staff for quick lookup
 */
function indexAppointments(state: AppointmentState) {
  state.appointmentsByDate = {};
  state.appointmentsByStaff = {};
  
  state.appointments.forEach(appointment => {
    // Index by date
    // Convert string to Date if needed
    const startTime = typeof appointment.scheduledStartTime === 'string' 
      ? new Date(appointment.scheduledStartTime)
      : appointment.scheduledStartTime;
    const dateKey = startOfDay(startTime).toISOString();
    
    if (!state.appointmentsByDate[dateKey]) {
      state.appointmentsByDate[dateKey] = [];
    }
    state.appointmentsByDate[dateKey].push(appointment);
    
    // Index by staff
    if (!state.appointmentsByStaff[appointment.staffId]) {
      state.appointmentsByStaff[appointment.staffId] = [];
    }
    state.appointmentsByStaff[appointment.staffId].push(appointment);
  });
}

/**
 * Convert TicketDTO to LocalAppointment
 */
function ticketDTOToLocalAppointment(ticket: TicketDTO): LocalAppointment {
  return {
    id: `apt_${ticket.appointmentID}`,
    serverId: ticket.appointmentID,
    salonId: '0', // Will be set from context
    clientId: ticket.customerID.toString(),
    clientName: ticket.customerName,
    clientPhone: ticket.customerPhone || '',
    staffId: ticket.staffID.toString(),
    staffName: ticket.staffName,
    services: [{
      serviceId: '0',
      serviceName: ticket.serviceName,
      staffId: ticket.staffID.toString(),
      staffName: ticket.staffName,
      duration: ticket.duration,
      price: ticket.totalAmount || 0,
    }],
    status: ticket.status as any,
    scheduledStartTime: new Date(ticket.startTime),
    scheduledEndTime: new Date(ticket.endTime),
    notes: ticket.note,
    source: ticket.isOnlineBooking ? 'online' : 'walk-in',
    createdAt: new Date(ticket.createdAt),
    updatedAt: new Date(ticket.createdAt),
    createdBy: 'system',
    lastModifiedBy: 'system',
    syncStatus: 'synced',
  };
}

// ============================================================================
// SELECTORS
// ============================================================================

export const selectAllAppointments = (state: { appointments: AppointmentState }) => 
  state.appointments.appointments;

export const selectAppointmentsByDate = (state: { appointments: AppointmentState }, date: Date) => {
  const dateKey = startOfDay(date).toISOString();
  return state.appointments.appointmentsByDate[dateKey] || [];
};

export const selectAppointmentsByStaff = (state: { appointments: AppointmentState }, staffId: string) => 
  state.appointments.appointmentsByStaff[staffId] || [];

export const selectFilteredAppointments = (state: { appointments: AppointmentState }) => {
  const { appointments, calendarView } = state.appointments;
  const { filters, selectedStaffIds } = calendarView;
  
  let filtered = [...appointments];
  
  // Filter by staff
  if (selectedStaffIds.length > 0) {
    filtered = filtered.filter(apt => selectedStaffIds.includes(apt.staffId));
  }
  
  // Filter by status
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(apt => filters.status!.includes(apt.status));
  }
  
  // Filter by date range
  if (filters.dateRange) {
    filtered = filtered.filter(apt => 
      apt.scheduledStartTime >= filters.dateRange!.start &&
      apt.scheduledStartTime <= filters.dateRange!.end
    );
  }
  
  // Filter by search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(apt => 
      apt.clientName.toLowerCase().includes(query) ||
      apt.clientPhone.includes(query) ||
      apt.services.some(s => s.serviceName.toLowerCase().includes(query))
    );
  }
  
  return filtered;
};

export const selectSelectedAppointment = (state: { appointments: AppointmentState }) => {
  const { appointments, selectedAppointmentId } = state.appointments;
  return appointments.find(apt => apt.id === selectedAppointmentId) || null;
};

export const selectCalendarView = (state: { appointments: AppointmentState }) => 
  state.appointments.calendarView;

export const selectIsLoading = (state: { appointments: AppointmentState }) => 
  Object.values(state.appointments.loading).some(loading => loading);

export const selectHasError = (state: { appointments: AppointmentState }) => 
  Object.values(state.appointments.error).some(error => error !== null);

export const selectSyncStatus = (state: { appointments: AppointmentState }) => 
  state.appointments.syncStatus;

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  setSelectedDate,
  setViewMode,
  setTimeWindowMode,
  setFilters,
  setSelectedStaffIds,
  toggleStaffFilter,
  clearFilters,
  selectAppointment,
  openCreateModal,
  closeCreateModal,
  openEditModal,
  closeEditModal,
  addLocalAppointment,
  updateLocalAppointment,
  removeLocalAppointment,
  updateSyncStatus,
  clearError,
  clearAllErrors,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;
