import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AdminState {
  isAdminModeActive: boolean;
  isHelpRequested: boolean;
  helpRequestId: string | null;
  helpRequestedAt: string | null;
  showPinModal: boolean;
  pinError: string | null;
}

const initialState: AdminState = {
  isAdminModeActive: false,
  isHelpRequested: false,
  helpRequestId: null,
  helpRequestedAt: null,
  showPinModal: false,
  pinError: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    requestHelp: (state, action: PayloadAction<string>) => {
      state.isHelpRequested = true;
      state.helpRequestId = action.payload;
      state.helpRequestedAt = new Date().toISOString();
    },
    cancelHelpRequest: (state) => {
      state.isHelpRequested = false;
      state.helpRequestId = null;
      state.helpRequestedAt = null;
    },
    showPinModal: (state) => {
      state.showPinModal = true;
      state.pinError = null;
    },
    hidePinModal: (state) => {
      state.showPinModal = false;
      state.pinError = null;
    },
    setPinError: (state, action: PayloadAction<string>) => {
      state.pinError = action.payload;
    },
    activateAdminMode: (state) => {
      state.isAdminModeActive = true;
      state.showPinModal = false;
      state.pinError = null;
    },
    deactivateAdminMode: (state) => {
      state.isAdminModeActive = false;
    },
    resetAdmin: () => initialState,
  },
});

export const {
  requestHelp,
  cancelHelpRequest,
  showPinModal,
  hidePinModal,
  setPinError,
  activateAdminMode,
  deactivateAdminMode,
  resetAdmin,
} = adminSlice.actions;

export default adminSlice.reducer;
