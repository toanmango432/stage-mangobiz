import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  BookingState,
  BookingService,
  Staff,
  TimeSlotGroup,
  BookingCustomer,
  BookingStep,
  ServiceCategory,
  DayOffDate,
  SelectedAddOn,
} from '../types/booking.types';

const initialState: BookingState = {
  currentBooking: {
    customer: null,
    services: [],
    selectedStaffId: null,
    selectedDate: null,
    selectedTime: null,
    notes: '',
  },
  
  services: [],
  categories: [],
  staff: [],
  availableTimeSlots: [],
  storeOffDays: [],
  staffOffDays: {},
  
  currentStep: 'services',
  cartOpen: false,
  
  loading: {
    services: false,
    staff: false,
    timeSlots: false,
    booking: false,
  },
  
  error: null,
  
  settings: {
    businessHours: {
      start: '9:00 AM',
      end: '7:00 PM',
    },
    slotInterval: 30,
    allowGuestBooking: true,
    requireDeposit: false,
    depositAmount: 0,
  },
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    // Step navigation
    setCurrentStep: (state, action: PayloadAction<BookingStep>) => {
      state.currentStep = action.payload;
    },
    
    nextStep: (state) => {
      const steps: BookingStep[] = ['services', 'staff', 'datetime', 'customer', 'review', 'confirmed'];
      const currentIndex = steps.indexOf(state.currentStep);
      if (currentIndex < steps.length - 1) {
        state.currentStep = steps[currentIndex + 1];
      }
    },
    
    previousStep: (state) => {
      const steps: BookingStep[] = ['services', 'staff', 'datetime', 'customer', 'review', 'confirmed'];
      const currentIndex = steps.indexOf(state.currentStep);
      if (currentIndex > 0) {
        state.currentStep = steps[currentIndex - 1];
      }
    },
    
    // Service management
    addService: (state, action: PayloadAction<BookingService>) => {
      state.currentBooking.services.push(action.payload);
    },
    
    removeService: (state, action: PayloadAction<string>) => {
      state.currentBooking.services = state.currentBooking.services.filter(
        s => s.id !== action.payload
      );
    },
    
    updateServiceAddOns: (state, action: PayloadAction<{
      serviceId: string;
      addOns: SelectedAddOn[];
    }>) => {
      const service = state.currentBooking.services.find(
        s => s.id === action.payload.serviceId
      );
      if (service) {
        service.selectedAddOns = action.payload.addOns;
      }
    },
    
    updateServiceAnswers: (state, action: PayloadAction<{
      serviceId: string;
      answers: Record<string, string>;
    }>) => {
      const service = state.currentBooking.services.find(
        s => s.id === action.payload.serviceId
      );
      if (service) {
        service.answers = action.payload.answers;
      }
    },
    
    clearServices: (state) => {
      state.currentBooking.services = [];
    },
    
    // Staff selection
    setSelectedStaff: (state, action: PayloadAction<string | null>) => {
      state.currentBooking.selectedStaffId = action.payload;
    },
    
    // Date/Time selection
    setSelectedDate: (state, action: PayloadAction<string | null>) => {
      state.currentBooking.selectedDate = action.payload;
      // Clear time when date changes
      state.currentBooking.selectedTime = null;
      state.availableTimeSlots = [];
    },
    
    setSelectedTime: (state, action: PayloadAction<string | null>) => {
      state.currentBooking.selectedTime = action.payload;
    },
    
    // Customer info
    setCustomer: (state, action: PayloadAction<BookingCustomer>) => {
      state.currentBooking.customer = action.payload;
    },
    
    // Notes
    setNotes: (state, action: PayloadAction<string>) => {
      state.currentBooking.notes = action.payload;
    },
    
    // Cart UI
    toggleCart: (state) => {
      state.cartOpen = !state.cartOpen;
    },
    
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.cartOpen = action.payload;
    },
    
    // Data loading
    setServices: (state, action: PayloadAction<BookingService[]>) => {
      state.services = action.payload;
      state.loading.services = false;
    },
    
    setCategories: (state, action: PayloadAction<ServiceCategory[]>) => {
      state.categories = action.payload;
    },
    
    setStaff: (state, action: PayloadAction<Staff[]>) => {
      state.staff = action.payload;
      state.loading.staff = false;
    },
    
    setAvailableTimeSlots: (state, action: PayloadAction<TimeSlotGroup[]>) => {
      state.availableTimeSlots = action.payload;
      state.loading.timeSlots = false;
    },
    
    setStoreOffDays: (state, action: PayloadAction<DayOffDate[]>) => {
      state.storeOffDays = action.payload;
    },
    
    setStaffOffDays: (state, action: PayloadAction<{
      staffId: string;
      offDays: DayOffDate[];
    }>) => {
      state.staffOffDays[action.payload.staffId] = action.payload.offDays;
    },
    
    // Loading states
    setLoading: (state, action: PayloadAction<{
      key: keyof BookingState['loading'];
      value: boolean;
    }>) => {
      state.loading[action.payload.key] = action.payload.value;
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset booking
    resetBooking: (state) => {
      state.currentBooking = initialState.currentBooking;
      state.currentStep = 'services';
      state.availableTimeSlots = [];
      state.error = null;
      state.cartOpen = false;
    },
    
    // Settings
    updateSettings: (state, action: PayloadAction<Partial<BookingState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
});

export const {
  setCurrentStep,
  nextStep,
  previousStep,
  addService,
  removeService,
  updateServiceAddOns,
  updateServiceAnswers,
  clearServices,
  setSelectedStaff,
  setSelectedDate,
  setSelectedTime,
  setCustomer,
  setNotes,
  toggleCart,
  setCartOpen,
  setServices,
  setCategories,
  setStaff,
  setAvailableTimeSlots,
  setStoreOffDays,
  setStaffOffDays,
  setLoading,
  setError,
  clearError,
  resetBooking,
  updateSettings,
} = bookingSlice.actions;

export default bookingSlice.reducer;
