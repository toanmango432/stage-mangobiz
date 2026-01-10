import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Client,
  Service,
  ServiceCategory,
  Technician,
  CheckInService,
  CheckInGuest,
  TechnicianPreference,
  PartyPreference,
  QueueStatus,
  CheckIn,
} from '../../types';
import { dataService } from '../../services/dataService';
import type { RootState } from '../index';

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export interface CreateCheckInParams {
  storeId: string;
  deviceId: string;
}

export const createCheckIn = createAsyncThunk<
  CheckIn,
  CreateCheckInParams,
  { state: RootState; rejectValue: string }
>('checkin/createCheckIn', async (params, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const { currentClient, selectedServices, technicianPreference, guests, partyPreference } = state.checkin;

    if (!currentClient) {
      return rejectWithValue('No client selected');
    }

    if (selectedServices.length === 0) {
      return rejectWithValue('No services selected');
    }

    const checkIn = await dataService.checkins.create({
      storeId: params.storeId,
      clientId: currentClient.id,
      clientName: `${currentClient.firstName} ${currentClient.lastName}`,
      clientPhone: currentClient.phone,
      services: selectedServices,
      technicianPreference,
      guests,
      partyPreference,
      deviceId: params.deviceId,
    });

    return checkIn;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to create check-in');
  }
});

export interface CalledInfo {
  technicianId: string | null;
  technicianName: string | null;
  station: string | null;
  calledAt: string;
}

interface CheckinState {
  // Client data
  currentClient: Client | null;
  isNewClient: boolean;

  // Services
  services: Service[];
  serviceCategories: ServiceCategory[];
  selectedServices: CheckInService[];

  // Technicians
  technicians: Technician[];
  technicianPreference: TechnicianPreference;

  // Guests
  guests: CheckInGuest[];
  partyPreference: PartyPreference;

  // Queue info
  queueStatus: QueueStatus | null;
  checkInNumber: string | null;
  queuePosition: number | null;
  estimatedWaitMinutes: number | null;

  // Phone lookup
  phoneNumber: string;
  lookupStatus: 'idle' | 'loading' | 'found' | 'not_found' | 'error';

  // Check-in ID after completion
  completedCheckInId: string | null;

  // Last completed check-in (for success screen)
  lastCheckIn: CheckIn | null;

  // Check-in submission status
  checkInStatus: 'idle' | 'submitting' | 'success' | 'error';
  checkInError: string | null;

  // Called status (when client is called from queue)
  isCalled: boolean;
  calledInfo: CalledInfo | null;
}

const initialState: CheckinState = {
  currentClient: null,
  isNewClient: false,
  services: [],
  serviceCategories: [],
  selectedServices: [],
  technicians: [],
  technicianPreference: 'anyone',
  guests: [],
  partyPreference: 'together',
  queueStatus: null,
  checkInNumber: null,
  queuePosition: null,
  estimatedWaitMinutes: null,
  phoneNumber: '',
  lookupStatus: 'idle',
  completedCheckInId: null,
  lastCheckIn: null,
  checkInStatus: 'idle',
  checkInError: null,
  isCalled: false,
  calledInfo: null,
};

const checkinSlice = createSlice({
  name: 'checkin',
  initialState,
  reducers: {
    // Phone lookup
    setPhoneNumber: (state, action: PayloadAction<string>) => {
      state.phoneNumber = action.payload;
    },
    setLookupStatus: (state, action: PayloadAction<CheckinState['lookupStatus']>) => {
      state.lookupStatus = action.payload;
    },

    // Client
    setCurrentClient: (state, action: PayloadAction<Client | null>) => {
      state.currentClient = action.payload;
      state.isNewClient = false;
    },
    setNewClient: (state, action: PayloadAction<Client>) => {
      state.currentClient = action.payload;
      state.isNewClient = true;
    },

    // Services catalog
    setServices: (state, action: PayloadAction<Service[]>) => {
      state.services = action.payload;
    },
    setServiceCategories: (state, action: PayloadAction<ServiceCategory[]>) => {
      state.serviceCategories = action.payload;
    },

    // Service selection
    addSelectedService: (state, action: PayloadAction<CheckInService>) => {
      const exists = state.selectedServices.find(s => s.serviceId === action.payload.serviceId);
      if (!exists) {
        state.selectedServices.push(action.payload);
      }
    },
    removeSelectedService: (state, action: PayloadAction<string>) => {
      state.selectedServices = state.selectedServices.filter(s => s.serviceId !== action.payload);
    },
    clearSelectedServices: (state) => {
      state.selectedServices = [];
    },

    // Technicians
    setTechnicians: (state, action: PayloadAction<Technician[]>) => {
      state.technicians = action.payload;
    },
    setTechnicianPreference: (state, action: PayloadAction<TechnicianPreference>) => {
      state.technicianPreference = action.payload;
    },

    // Guests
    addGuest: (state, action: PayloadAction<CheckInGuest>) => {
      state.guests.push(action.payload);
    },
    removeGuest: (state, action: PayloadAction<string>) => {
      state.guests = state.guests.filter(g => g.id !== action.payload);
    },
    updateGuest: (state, action: PayloadAction<CheckInGuest>) => {
      const index = state.guests.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.guests[index] = action.payload;
      }
    },
    setPartyPreference: (state, action: PayloadAction<PartyPreference>) => {
      state.partyPreference = action.payload;
    },

    // Queue
    setQueueStatus: (state, action: PayloadAction<QueueStatus>) => {
      state.queueStatus = action.payload;
    },
    setCheckInNumber: (state, action: PayloadAction<string>) => {
      state.checkInNumber = action.payload;
    },
    setQueuePosition: (state, action: PayloadAction<number>) => {
      state.queuePosition = action.payload;
    },
    setEstimatedWaitMinutes: (state, action: PayloadAction<number>) => {
      state.estimatedWaitMinutes = action.payload;
    },

    // Completion
    setCompletedCheckInId: (state, action: PayloadAction<string>) => {
      state.completedCheckInId = action.payload;
    },

    // Called from queue
    setClientCalled: (state, action: PayloadAction<CalledInfo>) => {
      state.isCalled = true;
      state.calledInfo = action.payload;
    },
    clearCalledStatus: (state) => {
      state.isCalled = false;
      state.calledInfo = null;
    },

    // Reset entire flow
    resetCheckin: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCheckIn.pending, (state) => {
        state.checkInStatus = 'submitting';
        state.checkInError = null;
      })
      .addCase(createCheckIn.fulfilled, (state, action) => {
        state.checkInStatus = 'success';
        state.lastCheckIn = action.payload;
        state.completedCheckInId = action.payload.id;
        state.checkInNumber = action.payload.checkInNumber;
        state.queuePosition = action.payload.queuePosition;
        state.estimatedWaitMinutes = action.payload.estimatedWaitMinutes;
      })
      .addCase(createCheckIn.rejected, (state, action) => {
        state.checkInStatus = 'error';
        state.checkInError = action.payload ?? 'Failed to create check-in';
      });
  },
});

export const {
  setPhoneNumber,
  setLookupStatus,
  setCurrentClient,
  setNewClient,
  setServices,
  setServiceCategories,
  addSelectedService,
  removeSelectedService,
  clearSelectedServices,
  setTechnicians,
  setTechnicianPreference,
  addGuest,
  removeGuest,
  updateGuest,
  setPartyPreference,
  setQueueStatus,
  setCheckInNumber,
  setQueuePosition,
  setEstimatedWaitMinutes,
  setCompletedCheckInId,
  setClientCalled,
  clearCalledStatus,
  resetCheckin,
} = checkinSlice.actions;

export default checkinSlice.reducer;
