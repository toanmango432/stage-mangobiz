import { useCallback, useMemo } from 'react';
import type { DialogKey, DialogState } from '../types';

interface UseTicketDialogsOptions {
  dialogs: DialogState;
  dispatch: (action: any) => void;
  ticketActions: {
    toggleDialog: (dialog: DialogKey, value: boolean) => {
      type: 'TOGGLE_DIALOG';
      payload: { dialog: DialogKey; value: boolean };
    };
    setPreventStaffRemovalMessage: (message: string) => {
      type: 'SET_PREVENT_STAFF_REMOVAL_MESSAGE';
      payload: string;
    };
    resetTicket: () => { type: 'RESET_TICKET' };
  };
  onClose?: () => void;
}

/**
 * Hook to manage dialog state for the checkout panel.
 * Provides setter functions and handlers for all dialogs.
 */
export function useTicketDialogs({
  dialogs,
  dispatch,
  ticketActions,
  onClose,
}: UseTicketDialogsOptions) {
  // Create a generic toggle function
  const toggleDialog = useCallback((dialog: DialogKey, value: boolean) => {
    dispatch(ticketActions.toggleDialog(dialog, value));
  }, [dispatch, ticketActions]);

  // Payment modal
  const setShowPaymentModal = useCallback((value: boolean) => {
    toggleDialog('showPaymentModal', value);
  }, [toggleDialog]);

  // Mobile service selector
  const setShowServicesOnMobile = useCallback((value: boolean) => {
    toggleDialog('showServicesOnMobile', value);
  }, [toggleDialog]);

  // Mobile staff selector
  const setShowStaffOnMobile = useCallback((value: boolean) => {
    toggleDialog('showStaffOnMobile', value);
  }, [toggleDialog]);

  // Service packages modal
  const setShowServicePackages = useCallback((value: boolean) => {
    toggleDialog('showServicePackages', value);
  }, [toggleDialog]);

  // Product sales modal
  const setShowProductSales = useCallback((value: boolean) => {
    toggleDialog('showProductSales', value);
  }, [toggleDialog]);

  // Purchase history modal
  const setShowPurchaseHistory = useCallback((value: boolean) => {
    toggleDialog('showPurchaseHistory', value);
  }, [toggleDialog]);

  // Receipt preview modal
  const setShowReceiptPreview = useCallback((value: boolean) => {
    toggleDialog('showReceiptPreview', value);
  }, [toggleDialog]);

  // Refund/void dialog
  const setShowRefundVoid = useCallback((value: boolean) => {
    toggleDialog('showRefundVoid', value);
  }, [toggleDialog]);

  // Remove client confirmation
  const setShowRemoveClientConfirm = useCallback((value: boolean) => {
    toggleDialog('showRemoveClientConfirm', value);
  }, [toggleDialog]);

  // Discard ticket confirmation
  const setShowDiscardTicketConfirm = useCallback((value: boolean) => {
    toggleDialog('showDiscardTicketConfirm', value);
  }, [toggleDialog]);

  // Prevent staff removal dialog
  const setShowPreventStaffRemoval = useCallback((value: boolean) => {
    toggleDialog('showPreventStaffRemoval', value);
  }, [toggleDialog]);

  // Keyboard shortcuts dialog
  const setShowKeyboardShortcuts = useCallback((value: boolean) => {
    toggleDialog('showKeyboardShortcuts', value);
  }, [toggleDialog]);

  // Split ticket dialog
  const setShowSplitTicketDialog = useCallback((value: boolean) => {
    toggleDialog('showSplitTicketDialog', value);
  }, [toggleDialog]);

  // Merge tickets dialog
  const setShowMergeTicketsDialog = useCallback((value: boolean) => {
    toggleDialog('showMergeTicketsDialog', value);
  }, [toggleDialog]);

  // Client selector dialog
  const setShowClientSelector = useCallback((value: boolean) => {
    toggleDialog('showClientSelector', value);
  }, [toggleDialog]);

  // Client profile dialog
  const setShowClientProfile = useCallback((value: boolean) => {
    toggleDialog('showClientProfile', value);
  }, [toggleDialog]);

  // Prevent staff removal message setter
  const setPreventStaffRemovalMessage = useCallback((message: string) => {
    dispatch(ticketActions.setPreventStaffRemovalMessage(message));
  }, [dispatch, ticketActions]);

  // Discard ticket handlers
  const handleDiscardTicketConfirm = useCallback(() => {
    setShowDiscardTicketConfirm(false);
    dispatch(ticketActions.resetTicket());
    localStorage.removeItem('checkout-pending-ticket');
    onClose?.();
  }, [dispatch, ticketActions, setShowDiscardTicketConfirm, onClose]);

  const handleDiscardTicketCancel = useCallback(() => {
    setShowDiscardTicketConfirm(false);
  }, [setShowDiscardTicketConfirm]);

  const handleDiscardTicketSaveAndClose = useCallback(() => {
    // This would trigger save logic before closing
    // Keeping ticket data in localStorage for later
    setShowDiscardTicketConfirm(false);
    onClose?.();
  }, [setShowDiscardTicketConfirm, onClose]);

  // Switch from staff modal to services modal
  const handleSwitchToServices = useCallback(() => {
    setShowStaffOnMobile(false);
    setTimeout(() => setShowServicesOnMobile(true), 150);
  }, [setShowStaffOnMobile, setShowServicesOnMobile]);

  // Memoize all setters for stable reference
  const dialogSetters = useMemo(() => ({
    setShowPaymentModal,
    setShowServicesOnMobile,
    setShowStaffOnMobile,
    setShowServicePackages,
    setShowProductSales,
    setShowPurchaseHistory,
    setShowReceiptPreview,
    setShowRefundVoid,
    setShowRemoveClientConfirm,
    setShowDiscardTicketConfirm,
    setShowPreventStaffRemoval,
    setShowKeyboardShortcuts,
    setShowSplitTicketDialog,
    setShowMergeTicketsDialog,
    setShowClientSelector,
    setShowClientProfile,
    setPreventStaffRemovalMessage,
  }), [
    setShowPaymentModal,
    setShowServicesOnMobile,
    setShowStaffOnMobile,
    setShowServicePackages,
    setShowProductSales,
    setShowPurchaseHistory,
    setShowReceiptPreview,
    setShowRefundVoid,
    setShowRemoveClientConfirm,
    setShowDiscardTicketConfirm,
    setShowPreventStaffRemoval,
    setShowKeyboardShortcuts,
    setShowSplitTicketDialog,
    setShowMergeTicketsDialog,
    setShowClientSelector,
    setShowClientProfile,
    setPreventStaffRemovalMessage,
  ]);

  return {
    // Current dialog state (for convenience)
    dialogs,

    // Individual setters (spread for direct access)
    ...dialogSetters,

    // Dialog-related handlers
    handleDiscardTicketConfirm,
    handleDiscardTicketCancel,
    handleDiscardTicketSaveAndClose,
    handleSwitchToServices,

    // Generic toggle function
    toggleDialog,
  };
}
