/**
 * MobileTeamSection Component Tests
 * Tests for mobile-optimized team view with filters and search
 * US-013: Updated to support Redux integration from US-007
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MobileTeamSection } from '../MobileTeamSection';

// Mock dependencies
vi.mock('../../../hooks/useTicketsCompat', () => ({
  useTickets: vi.fn(() => ({ staff: [], serviceTickets: [] })),
}));

vi.mock('../../../utils/haptics', () => ({
  haptics: {
    selection: vi.fn(),
  },
}));

vi.mock('@/contexts/TicketPanelContext', () => ({
  useTicketPanel: () => ({
    openTicketWithData: vi.fn(),
  }),
}));

vi.mock('../../StaffCard/index', () => ({
  StaffCardVertical: ({ staff, viewMode, onClick, displayConfig }: any) => (
    <div
      data-testid={`staff-card-${staff.id}`}
      data-view-mode={viewMode}
      data-show-turn-count={displayConfig?.showTurnCount}
      onClick={onClick}
    >
      <span data-testid="staff-name">{staff.name}</span>
      <span data-testid="staff-status">{staff.status}</span>
    </div>
  ),
}));

vi.mock('../MobileStaffActionSheet', () => ({
  MobileStaffActionSheet: ({ isOpen, onClose, staffName }: any) => (
    isOpen ? (
      <div data-testid="mobile-action-sheet">
        <span>{staffName}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('../AddStaffNoteModal', () => ({
  AddStaffNoteModal: ({ isOpen, onClose, staffName }: any) => (
    isOpen ? (
      <div data-testid="add-note-modal">
        <span>{staffName}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

// Import mock to manipulate
import { useTickets } from '../../../hooks/useTicketsCompat';
import { haptics } from '../../../utils/haptics';

const mockUseTickets = useTickets as ReturnType<typeof vi.fn>;

// ============================================================================
// TEST HELPERS
// ============================================================================

// Create a mock Redux store with frontDeskSettings
const createTestStore = (overrides: any = {}) => {
  return configureStore({
    reducer: {
      frontDeskSettings: () => ({
        settings: {
          organizeBy: 'busyStatus',
          showTurnCount: true,
          showNextAppointment: true,
          showServicedAmount: true,
          showTicketCount: true,
          showLastDone: true,
          showMoreOptionsButton: true,
          showAddTicketAction: true,
          showAddNoteAction: true,
          showEditTeamAction: true,
          showQuickCheckoutAction: true,
          showClockInOutAction: true,
          ...overrides,
        },
        isLoading: false,
        error: null,
      }),
      team: () => ({
        selectedMember: null,
        members: [],
      }),
      timesheets: () => ({
        entries: [],
      }),
    },
  });
};

// Wrapper component that provides Redux store
const renderWithRedux = (ui: React.ReactElement, storeOverrides: any = {}) => {
  const store = createTestStore(storeOverrides);
  return {
    ...render(
      <Provider store={store}>
        {ui}
      </Provider>
    ),
    store,
  };
};

describe('MobileTeamSection', () => {
  // Note: convertToStaffMember parses IDs like 'staff-1' to get the numeric part (1)
  // So test IDs become: staff-1 -> 1, staff-2 -> 2, staff-3 -> 3
  const mockStaff = [
    { id: 'staff-1', name: 'Jane Stylist', status: 'ready', specialty: 'hair' },
    { id: 'staff-2', name: 'John Barber', status: 'busy', specialty: 'hair' },
    { id: 'staff-3', name: 'Alice Nail', status: 'off', specialty: 'nails' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseTickets.mockReturnValue({ staff: mockStaff, serviceTickets: [] });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('filter buttons', () => {
    it('renders All filter button', () => {
      renderWithRedux(<MobileTeamSection />);
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('renders Ready filter button in busyStatus mode', () => {
      renderWithRedux(<MobileTeamSection />);
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('renders Busy filter button in busyStatus mode', () => {
      renderWithRedux(<MobileTeamSection />);
      expect(screen.getByText('Busy')).toBeInTheDocument();
    });

    it('renders In/Out filter buttons in clockedStatus mode', () => {
      renderWithRedux(<MobileTeamSection />, { organizeBy: 'clockedStatus' });
      expect(screen.getByText('In')).toBeInTheDocument();
      expect(screen.getByText('Out')).toBeInTheDocument();
    });

    it('shows correct count for All', () => {
      renderWithRedux(<MobileTeamSection />);
      // 3 staff total - appears in badge and metrics row
      const threeElements = screen.getAllByText('3');
      expect(threeElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows correct count for Ready', () => {
      renderWithRedux(<MobileTeamSection />);
      // Count appears as a badge inside Ready button
      const readyButton = screen.getByText('Ready').closest('button');
      expect(readyButton?.textContent).toContain('1');
    });

    it('shows correct count for Busy', () => {
      renderWithRedux(<MobileTeamSection />);
      const busyButton = screen.getByText('Busy').closest('button');
      expect(busyButton?.textContent).toContain('1');
    });

    it('All filter is active by default', () => {
      renderWithRedux(<MobileTeamSection />);
      const allButton = screen.getByText('All').closest('button');
      expect(allButton).toHaveClass('bg-gray-800', 'text-white');
    });

    it('changes filter on click', () => {
      renderWithRedux(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Ready'));

      const readyButton = screen.getByText('Ready').closest('button');
      expect(readyButton).toHaveClass('bg-emerald-500', 'text-white');
    });

    it('calls haptics on filter change', () => {
      renderWithRedux(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Ready'));

      expect(haptics.selection).toHaveBeenCalled();
    });

    it('Busy filter has rose color when active', () => {
      renderWithRedux(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Busy'));

      const busyButton = screen.getByText('Busy').closest('button');
      expect(busyButton).toHaveClass('bg-rose-500');
    });
  });

  describe('metrics row', () => {
    it('shows member count', () => {
      renderWithRedux(<MobileTeamSection />);
      // 3 members shown - appears in multiple places
      const threeElements = screen.getAllByText('3');
      expect(threeElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows "members" text (plural)', () => {
      renderWithRedux(<MobileTeamSection />);
      expect(screen.getByText('members')).toBeInTheDocument();
    });

    it('shows "member" text (singular) for 1', () => {
      mockUseTickets.mockReturnValue({
        staff: [{ id: 'staff-1', name: 'Jane', status: 'ready' }],
        serviceTickets: [],
      });

      renderWithRedux(<MobileTeamSection />);
      expect(screen.getByText('member')).toBeInTheDocument();
    });

    it('updates count when filter changes', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Ready'));

      // Count should update to 1 (only ready staff) - find in metrics row
      const metricsRow = container.querySelector('.bg-gray-50');
      const countEl = metricsRow?.querySelector('.text-lg.font-bold');
      expect(countEl?.textContent).toBe('1');
    });
  });

  describe('view mode toggle', () => {
    it('defaults to compact mode', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);
      const toggleButton = container.querySelector('.bg-orange-100');
      expect(toggleButton).toBeInTheDocument();
    });

    it('loads view mode from localStorage', () => {
      localStorage.setItem('mobileTeamViewMode', 'normal');
      const { container } = renderWithRedux(<MobileTeamSection />);

      // Normal mode has gray background
      const toggleButton = container.querySelector('.bg-gray-200');
      expect(toggleButton).toBeInTheDocument();
    });

    it('toggles view mode on click', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);

      // Find button containing ChevronDown icon (in compact mode)
      const chevronDown = container.querySelector('svg.lucide-chevron-down');
      const toggleButton = chevronDown?.closest('button');

      // Initial state should be compact (orange background)
      expect(toggleButton).toHaveClass('bg-orange-100');

      fireEvent.click(toggleButton!);

      // After click, should be normal mode (gray background)
      expect(toggleButton).toHaveClass('bg-gray-200');
    });

    it('toggles back to compact mode on second click', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);

      // Find toggle button
      const chevronDown = container.querySelector('svg.lucide-chevron-down');
      const toggleButton = chevronDown?.closest('button');

      // Click once to switch to normal
      fireEvent.click(toggleButton!);
      expect(toggleButton).toHaveClass('bg-gray-200');

      // Click again to switch back to compact
      fireEvent.click(toggleButton!);
      expect(toggleButton).toHaveClass('bg-orange-100');
    });

    it('calls haptics on toggle', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);

      const toggleButton = container.querySelector('button.p-2.rounded-lg');
      fireEvent.click(toggleButton!);

      expect(haptics.selection).toHaveBeenCalled();
    });

    it('shows ChevronDown icon in compact mode', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);
      const chevronDown = container.querySelector('svg.lucide-chevron-down');
      expect(chevronDown).toBeInTheDocument();
    });

    it('shows ChevronUp icon in normal mode', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);

      // Toggle to normal mode first
      const chevronDown = container.querySelector('svg.lucide-chevron-down');
      const toggleButton = chevronDown?.closest('button');
      fireEvent.click(toggleButton!);

      // In normal mode, should show ChevronUp icon
      const chevronUp = container.querySelector('svg.lucide-chevron-up');
      expect(chevronUp).toBeInTheDocument();
    });

  });

  describe('search', () => {
    it('renders search input', () => {
      renderWithRedux(<MobileTeamSection />);
      expect(screen.getByPlaceholderText('Search team...')).toBeInTheDocument();
    });

    it('shows search icon', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);
      const searchIcon = container.querySelector('svg.lucide-search');
      expect(searchIcon).toBeInTheDocument();
    });

    it('filters staff by search query', () => {
      renderWithRedux(<MobileTeamSection />);

      fireEvent.change(screen.getByPlaceholderText('Search team...'), {
        target: { value: 'Jane' },
      });

      // Should show Jane, not John or Alice
      expect(screen.getByText('Jane Stylist')).toBeInTheDocument();
      expect(screen.queryByText('John Barber')).not.toBeInTheDocument();
    });

    it('shows clear button when search has value', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);

      fireEvent.change(screen.getByPlaceholderText('Search team...'), {
        target: { value: 'test' },
      });

      const clearButton = container.querySelector('svg.lucide-x');
      expect(clearButton).toBeInTheDocument();
    });

    it('clears search on clear button click', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);

      fireEvent.change(screen.getByPlaceholderText('Search team...'), {
        target: { value: 'test' },
      });

      const clearButton = container.querySelector('svg.lucide-x')?.closest('button');
      fireEvent.click(clearButton!);

      expect(screen.getByPlaceholderText('Search team...')).toHaveValue('');
    });

    it('does not show clear button when search is empty', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);
      const xIcon = container.querySelector('svg.lucide-x');
      expect(xIcon).not.toBeInTheDocument();
    });
  });

  describe('staff display', () => {
    it('shows all staff when All filter selected', () => {
      renderWithRedux(<MobileTeamSection />);

      // In busyStatus mode (default), Ready and Busy staff are shown
      expect(screen.getByText('Jane Stylist')).toBeInTheDocument();
      expect(screen.getByText('John Barber')).toBeInTheDocument();
      // Note: In busyStatus mode, only Ready and Busy groups are rendered (no Off group)
      // Alice Nail has status 'off' so won't be shown in busyStatus mode's All view
    });

    it('shows only ready staff when Ready filter selected', () => {
      renderWithRedux(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Ready'));

      expect(screen.getByText('Jane Stylist')).toBeInTheDocument();
      expect(screen.queryByText('John Barber')).not.toBeInTheDocument();
      expect(screen.queryByText('Alice Nail')).not.toBeInTheDocument();
    });

    it('shows only busy staff when Busy filter selected', () => {
      renderWithRedux(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Busy'));

      expect(screen.queryByText('Jane Stylist')).not.toBeInTheDocument();
      expect(screen.getByText('John Barber')).toBeInTheDocument();
      expect(screen.queryByText('Alice Nail')).not.toBeInTheDocument();
    });

    it('passes viewMode to staff cards', () => {
      renderWithRedux(<MobileTeamSection />);

      // Note: staff-1 becomes numeric ID 1 after convertToStaffMember
      const staffCard = screen.getByTestId('staff-card-1');
      expect(staffCard).toHaveAttribute('data-view-mode', 'compact');
    });

    it('updates card viewMode after toggle', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);

      const toggleButton = container.querySelector('button.p-2.rounded-lg');
      fireEvent.click(toggleButton!);

      // Note: staff-1 becomes numeric ID 1 after convertToStaffMember
      const staffCard = screen.getByTestId('staff-card-1');
      expect(staffCard).toHaveAttribute('data-view-mode', 'normal');
    });
  });

  describe('empty state', () => {
    it('shows empty state when no staff', () => {
      mockUseTickets.mockReturnValue({ staff: [], serviceTickets: [] });
      renderWithRedux(<MobileTeamSection />);

      expect(screen.getByText('No team members found')).toBeInTheDocument();
    });

    it('shows Users icon in empty state', () => {
      mockUseTickets.mockReturnValue({ staff: [], serviceTickets: [] });
      const { container } = renderWithRedux(<MobileTeamSection />);

      const usersIcon = container.querySelector('svg.lucide-users');
      // Multiple Users icons - one in All button and one in empty state
      expect(usersIcon).toBeInTheDocument();
    });

    it('shows empty state when filter has no results', () => {
      mockUseTickets.mockReturnValue({
        staff: [{ id: 'staff-1', name: 'Jane', status: 'ready' }],
        serviceTickets: [],
      });
      renderWithRedux(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Busy'));

      expect(screen.getByText('No team members found')).toBeInTheDocument();
    });

    it('shows empty state when search has no results', () => {
      renderWithRedux(<MobileTeamSection />);

      fireEvent.change(screen.getByPlaceholderText('Search team...'), {
        target: { value: 'nonexistent' },
      });

      expect(screen.getByText('No team members found')).toBeInTheDocument();
    });
  });

  describe('grouped view', () => {
    it('shows Ready section header in All view', () => {
      renderWithRedux(<MobileTeamSection />);
      expect(screen.getByText('Ready (1)')).toBeInTheDocument();
    });

    it('shows Busy section header in All view', () => {
      renderWithRedux(<MobileTeamSection />);
      expect(screen.getByText('Busy (1)')).toBeInTheDocument();
    });

    it('shows status indicator dots', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);

      const greenDot = container.querySelector('.bg-emerald-500.rounded-full');
      expect(greenDot).toBeInTheDocument();

      const roseDot = container.querySelector('.bg-rose-500.rounded-full');
      expect(roseDot).toBeInTheDocument();
    });

    it('does not show section headers when filter is not All', () => {
      renderWithRedux(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Ready'));

      expect(screen.queryByText('Ready (1)')).not.toBeInTheDocument();
    });
  });

  describe('FrontDeskSettings integration', () => {
    it('passes displayConfig with showTurnCount from settings', () => {
      renderWithRedux(<MobileTeamSection />, { showTurnCount: true });

      // Note: staff-1 becomes numeric ID 1 after convertToStaffMember
      const staffCard = screen.getByTestId('staff-card-1');
      expect(staffCard).toHaveAttribute('data-show-turn-count', 'true');
    });

    it('passes displayConfig with showTurnCount=false when disabled', () => {
      renderWithRedux(<MobileTeamSection />, { showTurnCount: false });

      // Note: staff-1 becomes numeric ID 1 after convertToStaffMember
      const staffCard = screen.getByTestId('staff-card-1');
      expect(staffCard).toHaveAttribute('data-show-turn-count', 'false');
    });

    it('shows clockedStatus groups when organizeBy is clockedStatus', () => {
      renderWithRedux(<MobileTeamSection />, { organizeBy: 'clockedStatus' });

      // Should show Clocked In section (ready + busy staff = 2)
      expect(screen.getByText('Clocked In (2)')).toBeInTheDocument();
      // Should show Clocked Out section (off staff = 1)
      expect(screen.getByText('Clocked Out (1)')).toBeInTheDocument();
    });

    it('shows busyStatus groups when organizeBy is busyStatus', () => {
      renderWithRedux(<MobileTeamSection />, { organizeBy: 'busyStatus' });

      // Should show Ready section (ready staff = 1)
      expect(screen.getByText('Ready (1)')).toBeInTheDocument();
      // Should show Busy section (busy staff = 1)
      expect(screen.getByText('Busy (1)')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has white background', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);
      expect(container.firstChild).toHaveClass('bg-white');
    });

    it('has flex column layout', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);
      expect(container.firstChild).toHaveClass('flex', 'flex-col');
    });

    it('applies custom className', () => {
      const { container } = renderWithRedux(<MobileTeamSection className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('filter buttons have rounded corners', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);
      const filterButton = container.querySelector('.rounded-xl');
      expect(filterButton).toBeInTheDocument();
    });

    it('filter grid has 3 columns', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);
      // US-007: Changed from 4 columns to 3 columns
      const filterGrid = container.querySelector('.grid.grid-cols-3');
      expect(filterGrid).toBeInTheDocument();
    });

    it('staff grid has 2 columns', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);
      const staffGrid = container.querySelector('.grid.grid-cols-2');
      expect(staffGrid).toBeInTheDocument();
    });

    it('search input has focus ring styling', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);
      const input = container.querySelector('input.focus\\:ring-2');
      expect(input).toBeInTheDocument();
    });

    it('view toggle has minimum 40px touch target', () => {
      const { container } = renderWithRedux(<MobileTeamSection />);
      const toggleButton = container.querySelector('.min-w-\\[40px\\].min-h-\\[40px\\]');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('filter buttons are focusable', () => {
      renderWithRedux(<MobileTeamSection />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).not.toBeDisabled();
      });
    });

    it('search input is focusable', () => {
      renderWithRedux(<MobileTeamSection />);
      const input = screen.getByPlaceholderText('Search team...');
      input.focus();
      expect(document.activeElement).toBe(input);
    });
  });

  describe('action callbacks', () => {
    it('opens action sheet when staff card is clicked', () => {
      renderWithRedux(<MobileTeamSection />);

      // Note: staff-1 becomes numeric ID 1 after convertToStaffMember
      // Click on a staff card (Jane Stylist is 'ready' status, shown first in Ready group)
      const staffCard = screen.getByTestId('staff-card-1');
      fireEvent.click(staffCard);

      // Action sheet should open - look for Jane's name in the action sheet
      expect(screen.getByTestId('mobile-action-sheet')).toBeInTheDocument();
      // Jane Stylist should appear in the action sheet title
      const actionSheet = screen.getByTestId('mobile-action-sheet');
      expect(actionSheet).toHaveTextContent('Jane Stylist');
    });

    it('closes action sheet when close button is clicked', () => {
      renderWithRedux(<MobileTeamSection />);

      // Open action sheet
      const staffCard = screen.getByTestId('staff-card-1');
      fireEvent.click(staffCard);
      expect(screen.getByTestId('mobile-action-sheet')).toBeInTheDocument();

      // Close action sheet
      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('mobile-action-sheet')).not.toBeInTheDocument();
    });
  });
});
