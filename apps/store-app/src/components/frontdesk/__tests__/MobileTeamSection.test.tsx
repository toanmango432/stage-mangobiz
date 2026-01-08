/**
 * MobileTeamSection Component Tests
 * Tests for mobile-optimized team view with filters and search
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileTeamSection } from '../MobileTeamSection';

// Mock dependencies
vi.mock('../../../hooks/useTicketsCompat', () => ({
  useTickets: vi.fn(() => ({ staff: [] })),
}));

vi.mock('../../../utils/haptics', () => ({
  haptics: {
    selection: vi.fn(),
  },
}));

vi.mock('../../StaffCard/index', () => ({
  StaffCardVertical: ({ staff, viewMode, onClick }: any) => (
    <div
      data-testid={`staff-card-${staff.id}`}
      data-view-mode={viewMode}
      onClick={onClick}
    >
      <span data-testid="staff-name">{staff.name}</span>
      <span data-testid="staff-status">{staff.status}</span>
    </div>
  ),
}));

// Import mock to manipulate
import { useTickets } from '../../../hooks/useTicketsCompat';
import { haptics } from '../../../utils/haptics';

const mockUseTickets = useTickets as ReturnType<typeof vi.fn>;

describe('MobileTeamSection', () => {
  const mockStaff = [
    { id: 'staff-1', name: 'Jane Stylist', status: 'ready', specialty: 'hair' },
    { id: 'staff-2', name: 'John Barber', status: 'busy', specialty: 'hair' },
    { id: 'staff-3', name: 'Alice Nail', status: 'off', specialty: 'nails' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseTickets.mockReturnValue({ staff: mockStaff });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('filter buttons', () => {
    it('renders All filter button', () => {
      render(<MobileTeamSection />);
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('renders Ready filter button', () => {
      render(<MobileTeamSection />);
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('renders Busy filter button', () => {
      render(<MobileTeamSection />);
      expect(screen.getByText('Busy')).toBeInTheDocument();
    });

    it('renders Off filter button', () => {
      render(<MobileTeamSection />);
      expect(screen.getByText('Off')).toBeInTheDocument();
    });

    it('shows correct count for All', () => {
      render(<MobileTeamSection />);
      // 3 staff total - appears in badge and metrics row
      const threeElements = screen.getAllByText('3');
      expect(threeElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows correct count for Ready', () => {
      render(<MobileTeamSection />);
      // Count appears as a badge inside Ready button
      const readyButton = screen.getByText('Ready').closest('button');
      expect(readyButton?.textContent).toContain('1');
    });

    it('shows correct count for Busy', () => {
      render(<MobileTeamSection />);
      const busyButton = screen.getByText('Busy').closest('button');
      expect(busyButton?.textContent).toContain('1');
    });

    it('shows correct count for Off', () => {
      render(<MobileTeamSection />);
      const offButton = screen.getByText('Off').closest('button');
      expect(offButton?.textContent).toContain('1');
    });

    it('All filter is active by default', () => {
      const { container } = render(<MobileTeamSection />);
      const allButton = screen.getByText('All').closest('button');
      expect(allButton).toHaveClass('bg-gray-800', 'text-white');
    });

    it('changes filter on click', () => {
      render(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Ready'));

      const readyButton = screen.getByText('Ready').closest('button');
      expect(readyButton).toHaveClass('bg-emerald-500', 'text-white');
    });

    it('calls haptics on filter change', () => {
      render(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Ready'));

      expect(haptics.selection).toHaveBeenCalled();
    });

    it('Busy filter has rose color when active', () => {
      render(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Busy'));

      const busyButton = screen.getByText('Busy').closest('button');
      expect(busyButton).toHaveClass('bg-rose-500');
    });

    it('Off filter has gray color when active', () => {
      render(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Off'));

      const offButton = screen.getByText('Off').closest('button');
      expect(offButton).toHaveClass('bg-gray-500');
    });
  });

  describe('metrics row', () => {
    it('shows member count', () => {
      render(<MobileTeamSection />);
      // 3 members shown - appears in multiple places
      const threeElements = screen.getAllByText('3');
      expect(threeElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows "members" text (plural)', () => {
      render(<MobileTeamSection />);
      expect(screen.getByText('members')).toBeInTheDocument();
    });

    it('shows "member" text (singular) for 1', () => {
      mockUseTickets.mockReturnValue({
        staff: [{ id: 'staff-1', name: 'Jane', status: 'ready' }],
      });

      render(<MobileTeamSection />);
      expect(screen.getByText('member')).toBeInTheDocument();
    });

    it('updates count when filter changes', () => {
      const { container } = render(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Ready'));

      // Count should update to 1 (only ready staff) - find in metrics row
      const metricsRow = container.querySelector('.bg-gray-50');
      const countEl = metricsRow?.querySelector('.text-lg.font-bold');
      expect(countEl?.textContent).toBe('1');
    });
  });

  describe('view mode toggle', () => {
    it('defaults to compact mode', () => {
      const { container } = render(<MobileTeamSection />);
      const toggleButton = container.querySelector('.bg-orange-100');
      expect(toggleButton).toBeInTheDocument();
    });

    it('loads view mode from localStorage', () => {
      localStorage.setItem('mobileTeamViewMode', 'normal');
      const { container } = render(<MobileTeamSection />);

      // Normal mode has gray background
      const toggleButton = container.querySelector('.bg-gray-200');
      expect(toggleButton).toBeInTheDocument();
    });

    it('toggles view mode on click', () => {
      const { container } = render(<MobileTeamSection />);

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
      const { container } = render(<MobileTeamSection />);

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
      const { container } = render(<MobileTeamSection />);

      const toggleButton = container.querySelector('button.p-2.rounded-lg');
      fireEvent.click(toggleButton!);

      expect(haptics.selection).toHaveBeenCalled();
    });

    it('shows ChevronDown icon in compact mode', () => {
      const { container } = render(<MobileTeamSection />);
      const chevronDown = container.querySelector('svg.lucide-chevron-down');
      expect(chevronDown).toBeInTheDocument();
    });

    it('shows ChevronUp icon in normal mode', () => {
      const { container } = render(<MobileTeamSection />);

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
      render(<MobileTeamSection />);
      expect(screen.getByPlaceholderText('Search team...')).toBeInTheDocument();
    });

    it('shows search icon', () => {
      const { container } = render(<MobileTeamSection />);
      const searchIcon = container.querySelector('svg.lucide-search');
      expect(searchIcon).toBeInTheDocument();
    });

    it('filters staff by search query', () => {
      render(<MobileTeamSection />);

      fireEvent.change(screen.getByPlaceholderText('Search team...'), {
        target: { value: 'Jane' },
      });

      // Should show Jane, not John or Alice
      expect(screen.getByText('Jane Stylist')).toBeInTheDocument();
      expect(screen.queryByText('John Barber')).not.toBeInTheDocument();
    });

    it('shows clear button when search has value', () => {
      const { container } = render(<MobileTeamSection />);

      fireEvent.change(screen.getByPlaceholderText('Search team...'), {
        target: { value: 'test' },
      });

      const clearButton = container.querySelector('svg.lucide-x');
      expect(clearButton).toBeInTheDocument();
    });

    it('clears search on clear button click', () => {
      const { container } = render(<MobileTeamSection />);

      fireEvent.change(screen.getByPlaceholderText('Search team...'), {
        target: { value: 'test' },
      });

      const clearButton = container.querySelector('svg.lucide-x')?.closest('button');
      fireEvent.click(clearButton!);

      expect(screen.getByPlaceholderText('Search team...')).toHaveValue('');
    });

    it('does not show clear button when search is empty', () => {
      const { container } = render(<MobileTeamSection />);
      const xIcon = container.querySelector('svg.lucide-x');
      expect(xIcon).not.toBeInTheDocument();
    });
  });

  describe('staff display', () => {
    it('shows all staff when All filter selected', () => {
      render(<MobileTeamSection />);

      expect(screen.getByText('Jane Stylist')).toBeInTheDocument();
      expect(screen.getByText('John Barber')).toBeInTheDocument();
      expect(screen.getByText('Alice Nail')).toBeInTheDocument();
    });

    it('shows only ready staff when Ready filter selected', () => {
      render(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Ready'));

      expect(screen.getByText('Jane Stylist')).toBeInTheDocument();
      expect(screen.queryByText('John Barber')).not.toBeInTheDocument();
      expect(screen.queryByText('Alice Nail')).not.toBeInTheDocument();
    });

    it('shows only busy staff when Busy filter selected', () => {
      render(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Busy'));

      expect(screen.queryByText('Jane Stylist')).not.toBeInTheDocument();
      expect(screen.getByText('John Barber')).toBeInTheDocument();
      expect(screen.queryByText('Alice Nail')).not.toBeInTheDocument();
    });

    it('shows only off staff when Off filter selected', () => {
      render(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Off'));

      expect(screen.queryByText('Jane Stylist')).not.toBeInTheDocument();
      expect(screen.queryByText('John Barber')).not.toBeInTheDocument();
      expect(screen.getByText('Alice Nail')).toBeInTheDocument();
    });

    it('passes viewMode to staff cards', () => {
      render(<MobileTeamSection />);

      const staffCard = screen.getByTestId('staff-card-1');
      expect(staffCard).toHaveAttribute('data-view-mode', 'compact');
    });

    it('updates card viewMode after toggle', () => {
      const { container } = render(<MobileTeamSection />);

      const toggleButton = container.querySelector('button.p-2.rounded-lg');
      fireEvent.click(toggleButton!);

      const staffCard = screen.getByTestId('staff-card-1');
      expect(staffCard).toHaveAttribute('data-view-mode', 'normal');
    });
  });

  describe('empty state', () => {
    it('shows empty state when no staff', () => {
      mockUseTickets.mockReturnValue({ staff: [] });
      render(<MobileTeamSection />);

      expect(screen.getByText('No team members found')).toBeInTheDocument();
    });

    it('shows Users icon in empty state', () => {
      mockUseTickets.mockReturnValue({ staff: [] });
      const { container } = render(<MobileTeamSection />);

      const usersIcon = container.querySelector('svg.lucide-users');
      // Multiple Users icons - one in All button and one in empty state
      expect(usersIcon).toBeInTheDocument();
    });

    it('shows empty state when filter has no results', () => {
      mockUseTickets.mockReturnValue({
        staff: [{ id: 'staff-1', name: 'Jane', status: 'ready' }],
      });
      render(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Busy'));

      expect(screen.getByText('No team members found')).toBeInTheDocument();
    });

    it('shows empty state when search has no results', () => {
      render(<MobileTeamSection />);

      fireEvent.change(screen.getByPlaceholderText('Search team...'), {
        target: { value: 'nonexistent' },
      });

      expect(screen.getByText('No team members found')).toBeInTheDocument();
    });
  });

  describe('grouped view', () => {
    it('shows Ready section header in All view', () => {
      render(<MobileTeamSection />);
      expect(screen.getByText('Ready (1)')).toBeInTheDocument();
    });

    it('shows Busy section header in All view', () => {
      render(<MobileTeamSection />);
      expect(screen.getByText('Busy (1)')).toBeInTheDocument();
    });

    it('shows Off section header in All view', () => {
      render(<MobileTeamSection />);
      expect(screen.getByText('Off (1)')).toBeInTheDocument();
    });

    it('shows status indicator dots', () => {
      const { container } = render(<MobileTeamSection />);

      const greenDot = container.querySelector('.bg-emerald-500.rounded-full');
      expect(greenDot).toBeInTheDocument();

      const roseDot = container.querySelector('.bg-rose-500.rounded-full');
      expect(roseDot).toBeInTheDocument();
    });

    it('does not show section headers when filter is not All', () => {
      render(<MobileTeamSection />);

      fireEvent.click(screen.getByText('Ready'));

      expect(screen.queryByText('Ready (1)')).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has white background', () => {
      const { container } = render(<MobileTeamSection />);
      expect(container.firstChild).toHaveClass('bg-white');
    });

    it('has flex column layout', () => {
      const { container } = render(<MobileTeamSection />);
      expect(container.firstChild).toHaveClass('flex', 'flex-col');
    });

    it('applies custom className', () => {
      const { container } = render(<MobileTeamSection className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('filter buttons have rounded corners', () => {
      const { container } = render(<MobileTeamSection />);
      const filterButton = container.querySelector('.rounded-xl');
      expect(filterButton).toBeInTheDocument();
    });

    it('filter grid has 4 columns', () => {
      const { container } = render(<MobileTeamSection />);
      const filterGrid = container.querySelector('.grid.grid-cols-4');
      expect(filterGrid).toBeInTheDocument();
    });

    it('staff grid has 2 columns', () => {
      const { container } = render(<MobileTeamSection />);
      const staffGrid = container.querySelector('.grid.grid-cols-2');
      expect(staffGrid).toBeInTheDocument();
    });

    it('search input has focus ring styling', () => {
      const { container } = render(<MobileTeamSection />);
      const input = container.querySelector('input.focus\\:ring-2');
      expect(input).toBeInTheDocument();
    });

    it('view toggle has minimum 40px touch target', () => {
      const { container } = render(<MobileTeamSection />);
      const toggleButton = container.querySelector('.min-w-\\[40px\\].min-h-\\[40px\\]');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('filter buttons are focusable', () => {
      render(<MobileTeamSection />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).not.toBeDisabled();
      });
    });

    it('search input is focusable', () => {
      render(<MobileTeamSection />);
      const input = screen.getByPlaceholderText('Search team...');
      input.focus();
      expect(document.activeElement).toBe(input);
    });
  });
});
