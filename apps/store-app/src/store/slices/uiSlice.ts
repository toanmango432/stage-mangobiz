import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

/** Minimal client info needed for booking flow */
interface PendingBookingClientInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface UIState {
  activeModule: 'book' | 'frontdesk' | 'checkout' | 'transactions' | 'more';
  sidebarOpen: boolean;
  modalOpen: string | null;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>;
  /** Client pre-selected for booking from search */
  pendingBookingClient: PendingBookingClientInfo | null;
}

const initialState: UIState = {
  activeModule: 'frontdesk',
  sidebarOpen: true,
  modalOpen: null,
  notifications: [],
  pendingBookingClient: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveModule: (state, action: PayloadAction<UIState['activeModule']>) => {
      state.activeModule = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.modalOpen = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = null;
    },
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'timestamp'>>) => {
      state.notifications.push({
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    setPendingBookingClient: (state, action: PayloadAction<PendingBookingClientInfo | null>) => {
      state.pendingBookingClient = action.payload;
    },
    clearPendingBookingClient: (state) => {
      state.pendingBookingClient = null;
    },
  },
});

export const {
  setActiveModule,
  toggleSidebar,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  setPendingBookingClient,
  clearPendingBookingClient,
} = uiSlice.actions;

export const selectActiveModule = (state: RootState) => state.ui.activeModule;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectModalOpen = (state: RootState) => state.ui.modalOpen;
export const selectNotifications = (state: RootState) => state.ui.notifications;
export const selectPendingBookingClient = (state: RootState) => state.ui.pendingBookingClient;

export default uiSlice.reducer;
