import { useState, useCallback } from 'react';

interface TicketModalsState {
  // Assign modal state (used by WaitListSection)
  showAssignModal: boolean;
  selectedTicketId: string | null;

  // Edit modal state
  showEditModal: boolean;
  ticketToEdit: number | null;

  // Details modal state
  showDetailsModal: boolean;
  ticketToView: number | null;
}

interface UseTicketModalsReturn extends TicketModalsState {
  // Assign modal handlers
  openAssignModal: (ticketId: string) => void;
  closeAssignModal: () => void;

  // Edit modal handlers
  openEditModal: (ticketId: number) => void;
  closeEditModal: () => void;

  // Details modal handlers
  openDetailsModal: (ticketId: number) => void;
  closeDetailsModal: () => void;

  // Utility handlers
  handleEditFromDetails: (ticketId: number) => void;
  resetModals: () => void;
}

/**
 * Shared hook for managing ticket modal states across FrontDesk sections.
 * Used by WaitListSection and ServiceSection to consolidate modal logic.
 */
export function useTicketModals(): UseTicketModalsReturn {
  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<number | null>(null);

  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [ticketToView, setTicketToView] = useState<number | null>(null);

  // Assign modal handlers
  const openAssignModal = useCallback((ticketId: string) => {
    setSelectedTicketId(ticketId);
    setShowAssignModal(true);
  }, []);

  const closeAssignModal = useCallback(() => {
    setShowAssignModal(false);
    // Keep selectedTicketId for the assign operation
  }, []);

  // Edit modal handlers
  const openEditModal = useCallback((ticketId: number) => {
    setTicketToEdit(ticketId);
    setShowEditModal(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setTicketToEdit(null);
  }, []);

  // Details modal handlers
  const openDetailsModal = useCallback((ticketId: number) => {
    setTicketToView(ticketId);
    setShowDetailsModal(true);
  }, []);

  const closeDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setTicketToView(null);
  }, []);

  // Open edit from details modal (common pattern)
  const handleEditFromDetails = useCallback((ticketId: number) => {
    setShowDetailsModal(false);
    setTicketToView(null);
    // Small delay to avoid animation conflicts
    setTimeout(() => {
      setTicketToEdit(ticketId);
      setShowEditModal(true);
    }, 150);
  }, []);

  // Reset all modals
  const resetModals = useCallback(() => {
    setShowAssignModal(false);
    setSelectedTicketId(null);
    setShowEditModal(false);
    setTicketToEdit(null);
    setShowDetailsModal(false);
    setTicketToView(null);
  }, []);

  return {
    // State
    showAssignModal,
    selectedTicketId,
    showEditModal,
    ticketToEdit,
    showDetailsModal,
    ticketToView,

    // Handlers
    openAssignModal,
    closeAssignModal,
    openEditModal,
    closeEditModal,
    openDetailsModal,
    closeDetailsModal,
    handleEditFromDetails,
    resetModals,
  };
}
