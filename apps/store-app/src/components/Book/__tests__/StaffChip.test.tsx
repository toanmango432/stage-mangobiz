/**
 * StaffChip and StaffList Component Tests
 * Tests for staff selection chips used in booking flow
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StaffChip, StaffList } from '../StaffChip';

describe('StaffChip', () => {
  const defaultStaff = {
    id: 'staff-1',
    name: 'Jane Smith',
    appointments: 3,
    isActive: true,
  };

  const defaultProps = {
    staff: defaultStaff,
    isSelected: false,
    onClick: vi.fn(),
    index: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders staff name', () => {
      render(<StaffChip {...defaultProps} />);
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('renders appointment count with plural form', () => {
      render(<StaffChip {...defaultProps} />);
      expect(screen.getByText('3 appts')).toBeInTheDocument();
    });

    it('renders appointment count with singular form for 1 appointment', () => {
      const staff = { ...defaultStaff, appointments: 1 };
      render(<StaffChip {...defaultProps} staff={staff} />);
      expect(screen.getByText('1 appt')).toBeInTheDocument();
    });

    it('renders 0 appointments when undefined', () => {
      const staff = { id: 'staff-1', name: 'Jane Smith' };
      render(<StaffChip {...defaultProps} staff={staff} />);
      expect(screen.getByText('0 appts')).toBeInTheDocument();
    });

    it('renders as a button element', () => {
      render(<StaffChip {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('selection state', () => {
    it('shows checkmark when selected', () => {
      const { container } = render(<StaffChip {...defaultProps} isSelected={true} />);
      const checkIcon = container.querySelector('.lucide-check');
      expect(checkIcon).toBeInTheDocument();
    });

    it('does not show checkmark when not selected', () => {
      const { container } = render(<StaffChip {...defaultProps} isSelected={false} />);
      const checkIcon = container.querySelector('.lucide-check');
      expect(checkIcon).not.toBeInTheDocument();
    });

    it('applies selected styling when selected', () => {
      render(<StaffChip {...defaultProps} isSelected={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-brand-50');
      expect(button).toHaveClass('border-brand-300');
    });

    it('applies unselected styling when not selected', () => {
      render(<StaffChip {...defaultProps} isSelected={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white');
      expect(button).toHaveClass('border-gray-200');
    });
  });

  describe('click handling', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<StaffChip {...defaultProps} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has focus ring styles for keyboard navigation', () => {
      render(<StaffChip {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-brand-500');
    });
  });
});

describe('StaffList', () => {
  const createStaff = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: `staff-${i + 1}`,
      name: `Staff Member ${i + 1}`,
      appointments: i,
      isActive: true,
    }));

  const defaultProps = {
    staff: createStaff(3),
    selectedIds: [] as string[],
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders all staff members when count <= initialVisible', () => {
      render(<StaffList {...defaultProps} />);
      expect(screen.getByText('Staff Member 1')).toBeInTheDocument();
      expect(screen.getByText('Staff Member 2')).toBeInTheDocument();
      expect(screen.getByText('Staff Member 3')).toBeInTheDocument();
    });

    it('does not show search when staff count <= 6', () => {
      render(<StaffList {...defaultProps} />);
      expect(screen.queryByPlaceholderText('Search staff...')).not.toBeInTheDocument();
    });

    it('shows search when staff count > 6', () => {
      const manyStaff = createStaff(8);
      render(<StaffList {...defaultProps} staff={manyStaff} />);
      expect(screen.getByPlaceholderText('Search staff...')).toBeInTheDocument();
    });
  });

  describe('initial visibility', () => {
    it('shows only initialVisible items by default (6)', () => {
      const manyStaff = createStaff(10);
      render(<StaffList {...defaultProps} staff={manyStaff} />);

      // Should show first 6
      expect(screen.getByText('Staff Member 1')).toBeInTheDocument();
      expect(screen.getByText('Staff Member 6')).toBeInTheDocument();
      // Should not show 7+
      expect(screen.queryByText('Staff Member 7')).not.toBeInTheDocument();
    });

    it('respects custom initialVisible prop', () => {
      const manyStaff = createStaff(10);
      render(<StaffList {...defaultProps} staff={manyStaff} initialVisible={3} />);

      expect(screen.getByText('Staff Member 1')).toBeInTheDocument();
      expect(screen.getByText('Staff Member 3')).toBeInTheDocument();
      expect(screen.queryByText('Staff Member 4')).not.toBeInTheDocument();
    });
  });

  describe('show more/less functionality', () => {
    it('shows "Show X more" button when there are more items', () => {
      const manyStaff = createStaff(10);
      render(<StaffList {...defaultProps} staff={manyStaff} />);
      expect(screen.getByText('Show 4 more')).toBeInTheDocument();
    });

    it('does not show "Show more" button when all items fit', () => {
      render(<StaffList {...defaultProps} />);
      expect(screen.queryByText(/Show.*more/)).not.toBeInTheDocument();
    });

    it('expands to show all items when clicking "Show more"', () => {
      const manyStaff = createStaff(10);
      render(<StaffList {...defaultProps} staff={manyStaff} />);

      fireEvent.click(screen.getByText('Show 4 more'));

      // All 10 should now be visible
      expect(screen.getByText('Staff Member 10')).toBeInTheDocument();
    });

    it('shows "Show less" button when expanded', () => {
      const manyStaff = createStaff(10);
      render(<StaffList {...defaultProps} staff={manyStaff} />);

      fireEvent.click(screen.getByText('Show 4 more'));
      expect(screen.getByText('Show less')).toBeInTheDocument();
    });

    it('collapses when clicking "Show less"', () => {
      const manyStaff = createStaff(10);
      render(<StaffList {...defaultProps} staff={manyStaff} />);

      // Expand
      fireEvent.click(screen.getByText('Show 4 more'));
      expect(screen.getByText('Staff Member 10')).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByText('Show less'));
      expect(screen.queryByText('Staff Member 10')).not.toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('filters staff by name', () => {
      const manyStaff = createStaff(8);
      render(<StaffList {...defaultProps} staff={manyStaff} />);

      const searchInput = screen.getByPlaceholderText('Search staff...');
      fireEvent.change(searchInput, { target: { value: 'Member 1' } });

      // Should show Member 1 and Member 10 if present (both contain "Member 1")
      expect(screen.getByText('Staff Member 1')).toBeInTheDocument();
    });

    it('is case insensitive', () => {
      // Search only shows when > 6 staff
      const manyStaff = [
        { id: '1', name: 'Alice Johnson', appointments: 2 },
        { id: '2', name: 'Bob Wilson', appointments: 1 },
        { id: '3', name: 'Carol Davis', appointments: 0 },
        { id: '4', name: 'David Brown', appointments: 0 },
        { id: '5', name: 'Eve Taylor', appointments: 0 },
        { id: '6', name: 'Frank Miller', appointments: 0 },
        { id: '7', name: 'Grace Lee', appointments: 0 },
      ];
      render(<StaffList {...defaultProps} staff={manyStaff} />);

      const searchInput = screen.getByPlaceholderText('Search staff...');
      fireEvent.change(searchInput, { target: { value: 'ALICE' } });

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('shows no results message when search has no matches', () => {
      const manyStaff = createStaff(8);
      render(<StaffList {...defaultProps} staff={manyStaff} />);

      const searchInput = screen.getByPlaceholderText('Search staff...');
      fireEvent.change(searchInput, { target: { value: 'ZZZZZ' } });

      expect(screen.getByText('No staff found')).toBeInTheDocument();
    });

    it('hides "Show more" button while searching', () => {
      const manyStaff = createStaff(10);
      render(<StaffList {...defaultProps} staff={manyStaff} />);

      expect(screen.getByText('Show 4 more')).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText('Search staff...');
      fireEvent.change(searchInput, { target: { value: 'Member 1' } });

      // Show more should be hidden during search
      expect(screen.queryByText(/Show.*more/)).not.toBeInTheDocument();
    });
  });

  describe('selection handling', () => {
    it('marks selected staff as selected', () => {
      const props = {
        ...defaultProps,
        selectedIds: ['staff-2'],
      };
      const { container } = render(<StaffList {...props} />);

      // The selected staff should have checkmark
      const checkIcons = container.querySelectorAll('.lucide-check');
      expect(checkIcons.length).toBe(1);
    });

    it('calls onToggle with staff id when clicked', () => {
      const handleToggle = vi.fn();
      render(<StaffList {...defaultProps} onToggle={handleToggle} />);

      fireEvent.click(screen.getByText('Staff Member 2'));
      expect(handleToggle).toHaveBeenCalledWith('staff-2');
    });

    it('supports multiple selections', () => {
      const props = {
        ...defaultProps,
        selectedIds: ['staff-1', 'staff-3'],
      };
      const { container } = render(<StaffList {...props} />);

      const checkIcons = container.querySelectorAll('.lucide-check');
      expect(checkIcons.length).toBe(2);
    });
  });
});
