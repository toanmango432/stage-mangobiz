/**
 * useTicketModals Hook Tests
 * Tests for ticket modal state management hook
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTicketModals } from '../useTicketModals';

describe('useTicketModals', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('initializes with all modals closed', () => {
      const { result } = renderHook(() => useTicketModals());

      expect(result.current.showAssignModal).toBe(false);
      expect(result.current.showEditModal).toBe(false);
      expect(result.current.showDetailsModal).toBe(false);
    });

    it('initializes with no selected tickets', () => {
      const { result } = renderHook(() => useTicketModals());

      expect(result.current.selectedTicketId).toBeNull();
      expect(result.current.ticketToEdit).toBeNull();
      expect(result.current.ticketToView).toBeNull();
    });
  });

  describe('assign modal', () => {
    it('opens assign modal with ticket id', () => {
      const { result } = renderHook(() => useTicketModals());

      act(() => {
        result.current.openAssignModal('ticket-123');
      });

      expect(result.current.showAssignModal).toBe(true);
      expect(result.current.selectedTicketId).toBe('ticket-123');
    });

    it('closes assign modal', () => {
      const { result } = renderHook(() => useTicketModals());

      act(() => {
        result.current.openAssignModal('ticket-123');
      });

      act(() => {
        result.current.closeAssignModal();
      });

      expect(result.current.showAssignModal).toBe(false);
      // selectedTicketId is preserved for the assign operation
      expect(result.current.selectedTicketId).toBe('ticket-123');
    });

    it('can open with different ticket ids', () => {
      const { result } = renderHook(() => useTicketModals());

      act(() => {
        result.current.openAssignModal('ticket-1');
      });
      expect(result.current.selectedTicketId).toBe('ticket-1');

      act(() => {
        result.current.openAssignModal('ticket-2');
      });
      expect(result.current.selectedTicketId).toBe('ticket-2');
    });
  });

  describe('edit modal', () => {
    it('opens edit modal with ticket id', () => {
      const { result } = renderHook(() => useTicketModals());

      act(() => {
        result.current.openEditModal(456);
      });

      expect(result.current.showEditModal).toBe(true);
      expect(result.current.ticketToEdit).toBe(456);
    });

    it('closes edit modal and clears ticket id', () => {
      const { result } = renderHook(() => useTicketModals());

      act(() => {
        result.current.openEditModal(456);
      });

      act(() => {
        result.current.closeEditModal();
      });

      expect(result.current.showEditModal).toBe(false);
      expect(result.current.ticketToEdit).toBeNull();
    });
  });

  describe('details modal', () => {
    it('opens details modal with ticket id', () => {
      const { result } = renderHook(() => useTicketModals());

      act(() => {
        result.current.openDetailsModal(789);
      });

      expect(result.current.showDetailsModal).toBe(true);
      expect(result.current.ticketToView).toBe(789);
    });

    it('closes details modal and clears ticket id', () => {
      const { result } = renderHook(() => useTicketModals());

      act(() => {
        result.current.openDetailsModal(789);
      });

      act(() => {
        result.current.closeDetailsModal();
      });

      expect(result.current.showDetailsModal).toBe(false);
      expect(result.current.ticketToView).toBeNull();
    });
  });

  describe('handleEditFromDetails', () => {
    it('closes details modal immediately', () => {
      const { result } = renderHook(() => useTicketModals());

      act(() => {
        result.current.openDetailsModal(123);
      });
      expect(result.current.showDetailsModal).toBe(true);

      act(() => {
        result.current.handleEditFromDetails(123);
      });

      expect(result.current.showDetailsModal).toBe(false);
      expect(result.current.ticketToView).toBeNull();
    });

    it('opens edit modal after 150ms delay', () => {
      const { result } = renderHook(() => useTicketModals());

      act(() => {
        result.current.openDetailsModal(123);
      });

      act(() => {
        result.current.handleEditFromDetails(123);
      });

      // Edit modal should not be open yet
      expect(result.current.showEditModal).toBe(false);

      // Advance timers by 150ms
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Now edit modal should be open
      expect(result.current.showEditModal).toBe(true);
      expect(result.current.ticketToEdit).toBe(123);
    });

    it('passes correct ticket id to edit modal', () => {
      const { result } = renderHook(() => useTicketModals());

      act(() => {
        result.current.openDetailsModal(999);
      });

      act(() => {
        result.current.handleEditFromDetails(456); // Different id
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.ticketToEdit).toBe(456);
    });
  });

  describe('resetModals', () => {
    it('resets all modal states', () => {
      const { result } = renderHook(() => useTicketModals());

      // Open all modals
      act(() => {
        result.current.openAssignModal('ticket-1');
        result.current.openEditModal(2);
        result.current.openDetailsModal(3);
      });

      // Verify all are open
      expect(result.current.showAssignModal).toBe(true);
      expect(result.current.showEditModal).toBe(true);
      expect(result.current.showDetailsModal).toBe(true);

      // Reset
      act(() => {
        result.current.resetModals();
      });

      // Verify all are closed
      expect(result.current.showAssignModal).toBe(false);
      expect(result.current.selectedTicketId).toBeNull();
      expect(result.current.showEditModal).toBe(false);
      expect(result.current.ticketToEdit).toBeNull();
      expect(result.current.showDetailsModal).toBe(false);
      expect(result.current.ticketToView).toBeNull();
    });
  });

  describe('handler stability', () => {
    it('handlers are memoized (stable references)', () => {
      const { result, rerender } = renderHook(() => useTicketModals());

      const firstOpenAssign = result.current.openAssignModal;
      const firstCloseAssign = result.current.closeAssignModal;
      const firstOpenEdit = result.current.openEditModal;
      const firstCloseEdit = result.current.closeEditModal;
      const firstOpenDetails = result.current.openDetailsModal;
      const firstCloseDetails = result.current.closeDetailsModal;
      const firstHandleEditFromDetails = result.current.handleEditFromDetails;
      const firstResetModals = result.current.resetModals;

      rerender();

      expect(result.current.openAssignModal).toBe(firstOpenAssign);
      expect(result.current.closeAssignModal).toBe(firstCloseAssign);
      expect(result.current.openEditModal).toBe(firstOpenEdit);
      expect(result.current.closeEditModal).toBe(firstCloseEdit);
      expect(result.current.openDetailsModal).toBe(firstOpenDetails);
      expect(result.current.closeDetailsModal).toBe(firstCloseDetails);
      expect(result.current.handleEditFromDetails).toBe(firstHandleEditFromDetails);
      expect(result.current.resetModals).toBe(firstResetModals);
    });
  });

  describe('independent modal operation', () => {
    it('opening one modal does not affect others', () => {
      const { result } = renderHook(() => useTicketModals());

      act(() => {
        result.current.openAssignModal('ticket-1');
      });

      expect(result.current.showAssignModal).toBe(true);
      expect(result.current.showEditModal).toBe(false);
      expect(result.current.showDetailsModal).toBe(false);
    });

    it('closing one modal does not affect others', () => {
      const { result } = renderHook(() => useTicketModals());

      // Open all
      act(() => {
        result.current.openAssignModal('ticket-1');
        result.current.openEditModal(2);
        result.current.openDetailsModal(3);
      });

      // Close only edit
      act(() => {
        result.current.closeEditModal();
      });

      expect(result.current.showAssignModal).toBe(true);
      expect(result.current.showEditModal).toBe(false);
      expect(result.current.showDetailsModal).toBe(true);
    });
  });
});
