import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

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
}

const initialState: UIState = {
  activeModule: 'frontdesk',
  sidebarOpen: true,
  modalOpen: null,
  notifications: [],
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
  },
});

export const { setActiveModule, toggleSidebar, openModal, closeModal, addNotification, removeNotification } = uiSlice.actions;
export const selectActiveModule = (state: RootState) => state.ui.activeModule;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectModalOpen = (state: RootState) => state.ui.modalOpen;
export const selectNotifications = (state: RootState) => state.ui.notifications;

export default uiSlice.reducer;
