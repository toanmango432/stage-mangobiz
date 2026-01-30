import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { appointmentService } from '../../services/appointmentService';
import { dataService } from '../../services/dataService';
import { auditLogger } from '../../services/audit/auditLogger';
// toAppointment/toAppointments/etc not needed - dataService returns converted types
import {
  LocalAppointment,
  Appointment,
  AppointmentRequest,
  TicketDTO,
  AppointmentFilters,
  CalendarViewState,
  AppointmentService,
  PriceSource,
} from '../../types/appointment';
import { startOfDay } from '../../utils/timeUtils';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface AppointmentState {
  // Data - Single source of truth
  appointments: LocalAppointment[];
  // Removed appointmentsByDate and appointmentsByStaff to avoid duplication
  appointmentsByStaff?: Record<string, LocalAppointment[]>;  // Optional for backward compatibility

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
// DEPRECATED LEGACY THUNKS - DO NOT USE
// These use the old appointmentService API. Use Supabase-based thunks below instead.
// ============================================================================

/**
 * @deprecated Use fetchAppointmentsFromSupabase instead.
 * This thunk uses the legacy appointmentService API.
 */
export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (params: { customerId?: number; rvcNo: number; startDate: Date; endDate: Date }) => {
    console.warn('[DEPRECATED] fetchAppointments: Use fetchAppointmentsFromSupabase instead');
    const { customerId, rvcNo } = params;

    if (customerId) {
      // Fetch for specific customer
      const appointments = await appointmentService.getAppointmentList(customerId, rvcNo);
      return appointments;
    } else {
      // Fetch all appointments in date range
      return [];
    }
  }
);

/**
 * @deprecated Use addLocalAppointment instead for local-first architecture.
 * This thunk uses the legacy appointmentService API.
 */
export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (params: { appointments: AppointmentRequest[]; rvcNo: number }) => {
    console.warn('[DEPRECATED] createAppointment: Use addLocalAppointment instead');
    const { appointments, rvcNo } = params;
    const result = await appointmentService.bookAppointment(appointments, rvcNo);
    return result;
  }
);

/**
 * @deprecated Use updateLocalAppointment or updateAppointmentInSupabase instead.
 * This thunk uses the legacy appointmentService API.
 */
export const updateAppointment = createAsyncThunk(
  'appointments/updateAppointment',
  async (params: { rvcNo: number; appointmentData: any }) => {
    console.warn('[DEPRECATED] updateAppointment: Use updateLocalAppointment or updateAppointmentInSupabase');
    const { rvcNo, appointmentData } = params;
    const result = await appointmentService.editAppointment(rvcNo, appointmentData);
    return result;
  }
);

/**
 * @deprecated Use cancelAppointmentInSupabase instead.
 * This thunk uses the legacy appointmentService API.
 */
export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async (params: { id: number; reason: string; rvcNo: number }) => {
    console.warn('[DEPRECATED] cancelAppointment: Use cancelAppointmentInSupabase instead');
    const { id, reason, rvcNo } = params;
    const result = await appointmentService.cancelAppointment(id, reason, rvcNo);

    // Audit log appointment cancellation (high severity)
    auditLogger.log({
      action: 'update',
      entityType: 'appointment',
      entityId: String(id),
      description: `Appointment #${id} cancelled: ${reason}`,
      severity: 'high',
      success: true,
      metadata: { reason, rvcNo },
    }).catch(console.warn);

    return { id, result };
  }
);

/**
 * @deprecated No replacement needed - use selectAppointmentById selector instead.
 * This thunk uses the legacy appointmentService API.
 */
export const fetchAppointmentDetail = createAsyncThunk(
  'appointments/fetchAppointmentDetail',
  async (params: { id: number; partyId: number; rvcNo: number }) => {
    console.warn('[DEPRECATED] fetchAppointmentDetail: Use selectAppointmentById selector');
    const { id, partyId, rvcNo } = params;
    const detail = await appointmentService.getAppointmentDetail(id, partyId, rvcNo);
    return detail;
  }
);

// ============================================================================
// SUPABASE-BASED THUNKS (PREFERRED - for direct Supabase sync)
// ============================================================================

/**
 * Fetch appointments from Supabase for a specific date
 * Uses dataService which routes to Supabase based on device mode
 */
export const fetchAppointmentsFromSupabase = createAsyncThunk(
  'appointments/fetchFromSupabase',
  async (date: Date) => {
    // dataService already returns Appointment[] (converted from Supabase rows)
    return await dataService.appointments.getByDate(date);
  }
);

/**
 * Fetch upcoming appointments from Supabase
 */
export const fetchUpcomingAppointments = createAsyncThunk(
  'appointments/fetchUpcoming',
  async (limit = 50) => {
    // dataService already returns Appointment[] (converted from Supabase rows)
    return await dataService.appointments.getUpcoming(limit);
  }
);

/**
 * Create appointment in Supabase
 *
 * Captures price snapshot for each service at booking time:
 * - bookedPrice: Current catalog price (or provided price)
 * - bookedAt: ISO timestamp when price was locked
 * - priceSource: Origin of the price (catalog, staff_level, etc.)
 */
export const createAppointmentInSupabase = createAsyncThunk(
  'appointments/createInSupabase',
  async (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      // Validate foreign keys before creating
      const { validateAppointmentInput } = await import('../../utils/validation');
      const validation = await validateAppointmentInput({
        clientId: appointment.clientId,
        staffId: appointment.staffId,
        services: appointment.services,
      });

      if (!validation.valid) {
        return rejectWithValue(validation.error || 'Validation failed');
      }

      // Capture price snapshot for each service
      const servicesWithPriceSnapshot = await Promise.all(
        appointment.services.map(async (service): Promise<AppointmentService> => {
          // Look up current catalog price
          let catalogPrice: number | undefined;
          let priceSource: PriceSource = 'catalog';

          try {
            const catalogService = await dataService.services.getById(service.serviceId);
            if (catalogService) {
              catalogPrice = catalogService.price;
            }
          } catch (err) {
            // If service lookup fails, use provided price
            console.warn(`[createAppointmentInSupabase] Could not lookup service ${service.serviceId}:`, err);
          }

          // Determine booked price:
          // 1. If service.price provided (e.g., from staff-level pricing), use it
          // 2. Otherwise use catalog price
          // 3. Fallback to 0 if neither available
          const bookedPrice = service.price ?? catalogPrice ?? 0;

          // Determine price source based on available data
          if (service.staffLevelAtBooking) {
            priceSource = 'staff_level';
          } else if (service.priceSource) {
            priceSource = service.priceSource;
          }

          return {
            ...service,
            bookedPrice,
            bookedAt: new Date().toISOString(),
            priceSource,
            // Store catalog price if different from booked (useful for tiered pricing)
            catalogPriceAtBooking: catalogPrice,
          };
        })
      );

      // Create appointment with price snapshot data
      const appointmentWithPriceSnapshot = {
        ...appointment,
        services: servicesWithPriceSnapshot,
      };

      // dataService handles the conversion internally
      const created = await dataService.appointments.create(appointmentWithPriceSnapshot as any);

      // Audit log appointment creation
      auditLogger.log({
        action: 'create',
        entityType: 'appointment',
        entityId: created.id,
        description: `Appointment created for ${appointment.clientName || 'Walk-in'}`,
        severity: 'low',
        success: true,
        metadata: {
          clientId: appointment.clientId,
          staffId: appointment.staffId,
        },
      }).catch(console.warn);

      return created;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create appointment');
    }
  }
);

/**
 * Update appointment in Supabase
 */
export const updateAppointmentInSupabase = createAsyncThunk(
  'appointments/updateInSupabase',
  async ({ id, updates }: { id: string; updates: Partial<Appointment> }) => {
    // dataService handles the conversion internally
    const updated = await dataService.appointments.update(id, updates as any);
    return updated;
  }
);

/**
 * Delete appointment in Supabase via dataService
 */
export const deleteAppointmentInSupabase = createAsyncThunk(
  'appointments/deleteInSupabase',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      await dataService.appointments.delete(appointmentId);

      // Audit log appointment deletion (high severity)
      auditLogger.log({
        action: 'delete',
        entityType: 'appointment',
        entityId: appointmentId,
        description: `Appointment ${appointmentId} deleted`,
        severity: 'high',
        success: true,
      }).catch(console.warn);

      return appointmentId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete appointment');
    }
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
      // Check if appointment already exists to prevent duplicates
      const existingIndex = state.appointments.findIndex(apt => apt.id === action.payload.id);
      if (existingIndex === -1) {
        state.appointments.push(action.payload);
      } else {
        // Update existing appointment instead of adding duplicate
        state.appointments[existingIndex] = action.payload;
      }
      // Removed indexAppointments call - no longer duplicating data
    },

    updateLocalAppointment: (state, action: PayloadAction<{ id: string; updates: Partial<LocalAppointment> }>) => {
      const { id, updates } = action.payload;
      const index = state.appointments.findIndex(apt => apt.id === id);

      if (index !== -1) {
        state.appointments[index] = { ...state.appointments[index], ...updates };
        // Removed indexAppointments call - no longer duplicating data
      }
    },

    removeLocalAppointment: (state, action: PayloadAction<string>) => {
      state.appointments = state.appointments.filter(apt => apt.id !== action.payload);
      // Removed indexAppointments call - no longer duplicating data
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

    // Bulk load appointments (e.g., from hydration)
    setAppointments: (state, action: PayloadAction<LocalAppointment[]>) => {
      state.appointments = action.payload;
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
        // Removed indexAppointments call - no longer duplicating data
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
        const appointment = state.appointments.find(apt => apt.serverId === String(action.payload.id));
        if (appointment) {
          appointment.status = 'cancelled';
        }

        // Removed indexAppointments call - no longer duplicating data
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.loading.deleteAppointment = false;
        state.error.deleteAppointment = action.error.message || 'Failed to cancel appointment';
      });

    // ========== SUPABASE THUNKS ==========

    // Fetch from Supabase
    builder
      .addCase(fetchAppointmentsFromSupabase.pending, (state) => {
        state.loading.fetchAppointments = true;
        state.error.fetchAppointments = null;
      })
      .addCase(fetchAppointmentsFromSupabase.fulfilled, (state, action) => {
        state.loading.fetchAppointments = false;
        // Convert Appointment to LocalAppointment format
        state.appointments = action.payload.map(apt => appointmentToLocalAppointment(apt));
        state.syncStatus.lastSync = new Date();
      })
      .addCase(fetchAppointmentsFromSupabase.rejected, (state, action) => {
        state.loading.fetchAppointments = false;
        state.error.fetchAppointments = action.error.message || 'Failed to fetch from Supabase';
      });

    // Fetch upcoming from Supabase
    builder
      .addCase(fetchUpcomingAppointments.pending, (state) => {
        state.loading.fetchAppointments = true;
        state.error.fetchAppointments = null;
      })
      .addCase(fetchUpcomingAppointments.fulfilled, (state, action) => {
        state.loading.fetchAppointments = false;
        state.appointments = action.payload.map(apt => appointmentToLocalAppointment(apt));
        state.syncStatus.lastSync = new Date();
      })
      .addCase(fetchUpcomingAppointments.rejected, (state, action) => {
        state.loading.fetchAppointments = false;
        state.error.fetchAppointments = action.error.message || 'Failed to fetch upcoming';
      });

    // Create in Supabase
    builder
      .addCase(createAppointmentInSupabase.pending, (state) => {
        state.loading.createAppointment = true;
        state.error.createAppointment = null;
      })
      .addCase(createAppointmentInSupabase.fulfilled, (state, action) => {
        state.loading.createAppointment = false;
        state.isCreatingAppointment = false;
        // Add the new appointment to state
        state.appointments.push(appointmentToLocalAppointment(action.payload));
        state.syncStatus.lastSync = new Date();
      })
      .addCase(createAppointmentInSupabase.rejected, (state, action) => {
        state.loading.createAppointment = false;
        state.error.createAppointment = action.error.message || 'Failed to create in Supabase';
      });

    // Update in Supabase
    builder
      .addCase(updateAppointmentInSupabase.pending, (state) => {
        state.loading.updateAppointment = true;
        state.error.updateAppointment = null;
      })
      .addCase(updateAppointmentInSupabase.fulfilled, (state, action) => {
        state.loading.updateAppointment = false;
        state.isEditingAppointment = false;
        state.selectedAppointmentId = null;
        // Update the appointment in state
        if (!action.payload) return;
        const index = state.appointments.findIndex(apt => apt.id === action.payload!.id);
        if (index !== -1) {
          state.appointments[index] = appointmentToLocalAppointment(action.payload);
        }
        state.syncStatus.lastSync = new Date();
      })
      .addCase(updateAppointmentInSupabase.rejected, (state, action) => {
        state.loading.updateAppointment = false;
        state.error.updateAppointment = action.error.message || 'Failed to update in Supabase';
      });

    // Delete in Supabase
    builder
      .addCase(deleteAppointmentInSupabase.pending, (state) => {
        state.loading.deleteAppointment = true;
        state.error.deleteAppointment = null;
      })
      .addCase(deleteAppointmentInSupabase.fulfilled, (state, action) => {
        state.loading.deleteAppointment = false;
        state.appointments = state.appointments.filter(apt => apt.id !== action.payload && String(apt.serverId) !== action.payload);
        if (state.selectedAppointmentId === action.payload) {
          state.selectedAppointmentId = null;
        }
        state.syncStatus.lastSync = new Date();
      })
      .addCase(deleteAppointmentInSupabase.rejected, (state, action) => {
        state.loading.deleteAppointment = false;
        state.error.deleteAppointment = action.error.message || 'Failed to delete appointment in Supabase';
      });
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Removed indexAppointments function - no longer needed as we don't duplicate data

/**
 * Migrates an appointment's services to include price snapshot fields.
 *
 * This lazy migration handles existing appointments that were created before
 * price tracking was implemented. It ensures backwards compatibility by
 * populating bookedPrice, bookedAt, and priceSource for services that don't
 * have them.
 *
 * Migration is idempotent - services that already have bookedPrice are skipped.
 *
 * @param apt - The appointment to migrate
 * @returns The appointment with migrated services (or unchanged if already migrated)
 *
 * @example
 * ```typescript
 * // Appointment with unmigrated service
 * const apt = { services: [{ price: 50 }], createdAt: '2024-01-01T10:00:00Z' };
 * const migrated = migrateAppointmentPricing(apt);
 * // migrated.services[0].bookedPrice === 50
 * // migrated.services[0].bookedAt === '2024-01-01T10:00:00Z'
 * // migrated.services[0].priceSource === 'catalog'
 * ```
 */
function migrateAppointmentPricing(apt: Appointment | LocalAppointment): Appointment | LocalAppointment {
  // Check if any services need migration
  const needsMigration = apt.services.some(service => service.bookedPrice === undefined);

  if (!needsMigration) {
    // Already migrated - return unchanged
    return apt;
  }

  // Log migration for debugging
  console.log(`[migrateAppointmentPricing] Migrating appointment ${apt.id} (${apt.services.length} services)`);

  // Migrate services that don't have bookedPrice
  const migratedServices = apt.services.map(service => {
    // Skip if already has bookedPrice
    if (service.bookedPrice !== undefined) {
      return service;
    }

    // Determine bookedPrice from service.price (the most reliable source for existing data)
    // Fall back to 0 if no price available (shouldn't happen in practice)
    const bookedPrice = service.price ?? 0;

    return {
      ...service,
      bookedPrice,
      // Use appointment createdAt as the booking timestamp
      bookedAt: apt.createdAt,
      // Default to catalog source for historical data
      priceSource: 'catalog' as const,
    };
  });

  return {
    ...apt,
    services: migratedServices,
  };
}

/**
 * Convert Appointment (from Supabase) to LocalAppointment
 * Now simplified since both types use ISO strings for dates
 * Includes lazy migration for price tracking fields
 */
function appointmentToLocalAppointment(apt: Appointment): LocalAppointment {
  // Apply lazy migration for price tracking
  const migrated = migrateAppointmentPricing(apt) as Appointment;

  return {
    ...migrated,
    syncStatus: migrated.syncStatus || 'synced',
  };
}

/**
 * Convert TicketDTO to LocalAppointment
 * Includes price snapshot fields (bookedPrice, bookedAt, priceSource) for consistency
 */
function ticketDTOToLocalAppointment(ticket: TicketDTO): LocalAppointment {
  const createdAtIso = new Date(ticket.createdAt).toISOString();
  const price = ticket.totalAmount || 0;

  return {
    id: `apt_${ticket.appointmentID}`,
    serverId: String(ticket.appointmentID),
    storeId: '0', // Will be set from context
    clientId: ticket.customerID.toString(),
    clientName: ticket.customerName,
    clientPhone: ticket.customerPhone || '',
    staffId: ticket.staffID.toString(),
    staffName: ticket.staffName,
    services: [{
      serviceId: '0',
      serviceName: ticket.serviceName,
      name: ticket.serviceName,
      staffId: ticket.staffID.toString(),
      staffName: ticket.staffName,
      duration: ticket.duration,
      price,
      // Add price snapshot fields for consistency with new appointments
      bookedPrice: price,
      bookedAt: createdAtIso,
      priceSource: 'catalog' as const,
    }],
    status: ticket.status as any,
    scheduledStartTime: new Date(ticket.startTime).toISOString(),
    scheduledEndTime: new Date(ticket.endTime).toISOString(),
    notes: ticket.note,
    source: ticket.isOnlineBooking ? 'online' : 'walk-in',
    createdAt: createdAtIso,
    updatedAt: createdAtIso,
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
  return state.appointments.appointments.filter(apt => {
    const aptDate = typeof apt.scheduledStartTime === 'string'
      ? new Date(apt.scheduledStartTime)
      : apt.scheduledStartTime;
    return startOfDay(aptDate).toISOString() === dateKey;
  });
};

export const selectAppointmentsByStaff = (state: { appointments: AppointmentState }, staffId: string) =>
  state.appointments.appointmentsByStaff?.[staffId] || [];

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
    const startIso = filters.dateRange.start.toISOString();
    const endIso = filters.dateRange.end.toISOString();
    filtered = filtered.filter(apt =>
      apt.scheduledStartTime >= startIso &&
      apt.scheduledStartTime <= endIso
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

// New selectors to replace duplicated data - derive from single source
export const selectAppointmentsForDate = (state: { appointments: AppointmentState }, date: Date) => {
  const dateKey = startOfDay(date).toISOString();
  return state.appointments.appointments.filter(apt => {
    const aptDate = typeof apt.scheduledStartTime === 'string'
      ? new Date(apt.scheduledStartTime)
      : apt.scheduledStartTime;
    return startOfDay(aptDate).toISOString() === dateKey;
  });
};

export const selectAppointmentsForStaff = (state: { appointments: AppointmentState }, staffId: string) => {
  return state.appointments.appointments.filter(apt => apt.staffId === staffId);
};

export const selectAppointmentsForDateRange = (state: { appointments: AppointmentState }, startDate: Date, endDate: Date) => {
  return state.appointments.appointments.filter(apt => {
    const aptTime = typeof apt.scheduledStartTime === 'string'
      ? new Date(apt.scheduledStartTime)
      : apt.scheduledStartTime;
    return aptTime >= startDate && aptTime <= endDate;
  });
};

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
  setAppointments,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;
