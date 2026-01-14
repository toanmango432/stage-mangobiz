import { useState, useCallback } from 'react';
import type { UIStaff } from '@/store/slices/uiStaffSlice';

/**
 * Modal types for StaffSidebar
 */
export type ModalType =
  | 'teamSettings'
  | 'turnTracker'
  | 'staffNote'
  | 'staffDetails'
  | 'resetConfirmation';

/**
 * State for each modal type
 */
export interface ModalState {
  teamSettings: {
    isOpen: boolean;
  };
  turnTracker: {
    isOpen: boolean;
  };
  staffNote: {
    isOpen: boolean;
    selectedStaff: { id: number; name: string } | null;
  };
  staffDetails: {
    isOpen: boolean;
    selectedStaff: UIStaff | null;
  };
  resetConfirmation: {
    isOpen: boolean;
  };
}

const initialState: ModalState = {
  teamSettings: { isOpen: false },
  turnTracker: { isOpen: false },
  staffNote: { isOpen: false, selectedStaff: null },
  staffDetails: { isOpen: false, selectedStaff: null },
  resetConfirmation: { isOpen: false },
};

/**
 * US-019: Hook for managing multiple modal states in StaffSidebar
 * Consolidates 5 separate state pairs into a single hook with a cleaner API
 *
 * @returns Modal state and action functions
 */
export function useModalStack() {
  const [state, setState] = useState<ModalState>(initialState);

  // Generic open/close functions
  const openModal = useCallback(<T extends ModalType>(
    modalType: T,
    payload?: T extends 'staffNote' ? { id: number; name: string } : T extends 'staffDetails' ? UIStaff : never
  ) => {
    setState(prev => {
      const newState = { ...prev };

      // Set the modal as open with payload if applicable
      if (modalType === 'staffNote' && payload) {
        newState.staffNote = { isOpen: true, selectedStaff: payload as { id: number; name: string } };
      } else if (modalType === 'staffDetails' && payload) {
        newState.staffDetails = { isOpen: true, selectedStaff: payload as UIStaff };
      } else {
        (newState[modalType] as { isOpen: boolean }).isOpen = true;
      }

      return newState;
    });
  }, []);

  const closeModal = useCallback((modalType: ModalType) => {
    setState(prev => {
      const newState = { ...prev };

      if (modalType === 'staffNote') {
        newState.staffNote = { isOpen: false, selectedStaff: null };
      } else if (modalType === 'staffDetails') {
        newState.staffDetails = { isOpen: false, selectedStaff: null };
      } else {
        (newState[modalType] as { isOpen: boolean }).isOpen = false;
      }

      return newState;
    });
  }, []);

  // Convenience functions for specific modals
  const openTeamSettings = useCallback(() => openModal('teamSettings'), [openModal]);
  const closeTeamSettings = useCallback(() => closeModal('teamSettings'), [closeModal]);

  const openTurnTracker = useCallback(() => openModal('turnTracker'), [openModal]);
  const closeTurnTracker = useCallback(() => closeModal('turnTracker'), [closeModal]);

  const openStaffNote = useCallback((staff: { id: number; name: string }) => {
    setState(prev => ({
      ...prev,
      staffNote: { isOpen: true, selectedStaff: staff },
    }));
  }, []);
  const closeStaffNote = useCallback(() => closeModal('staffNote'), [closeModal]);

  const openStaffDetails = useCallback((staff: UIStaff) => {
    setState(prev => ({
      ...prev,
      staffDetails: { isOpen: true, selectedStaff: staff },
    }));
  }, []);
  const closeStaffDetails = useCallback(() => closeModal('staffDetails'), [closeModal]);

  const openResetConfirmation = useCallback(() => openModal('resetConfirmation'), [openModal]);
  const closeResetConfirmation = useCallback(() => closeModal('resetConfirmation'), [closeModal]);

  return {
    // State accessors
    showTeamSettings: state.teamSettings.isOpen,
    showTurnTracker: state.turnTracker.isOpen,
    showStaffNoteModal: state.staffNote.isOpen,
    selectedStaffForNote: state.staffNote.selectedStaff,
    showStaffDetails: state.staffDetails.isOpen,
    selectedStaffForDetails: state.staffDetails.selectedStaff,
    showResetConfirmation: state.resetConfirmation.isOpen,

    // Actions - named to match existing API for minimal refactoring
    setShowTeamSettings: (show: boolean) => show ? openTeamSettings() : closeTeamSettings(),
    setShowTurnTracker: (show: boolean) => show ? openTurnTracker() : closeTurnTracker(),
    setShowStaffNoteModal: (show: boolean) => show ? undefined : closeStaffNote(), // Opening requires staff data
    setSelectedStaffForNote: (staff: { id: number; name: string } | null) => {
      if (staff) openStaffNote(staff);
    },
    setShowStaffDetails: (show: boolean) => show ? undefined : closeStaffDetails(), // Opening requires staff data
    setSelectedStaffForDetails: (staff: UIStaff | null) => {
      if (staff) openStaffDetails(staff);
    },
    setShowResetConfirmation: (show: boolean) => show ? openResetConfirmation() : closeResetConfirmation(),

    // Typed convenience methods
    openTeamSettings,
    closeTeamSettings,
    openTurnTracker,
    closeTurnTracker,
    openStaffNote,
    closeStaffNote,
    openStaffDetails,
    closeStaffDetails,
    openResetConfirmation,
    closeResetConfirmation,
  };
}
