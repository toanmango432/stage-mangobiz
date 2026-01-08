/**
 * StaffFilterDropdown Component Tests
 * Tests for staff filtering dropdown with selection states
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StaffFilterDropdown } from '../StaffFilterDropdown';

describe('StaffFilterDropdown', () => {
  const mockStaff = [
    { id: 'staff-1', name: 'Jane Stylist' },
    { id: 'staff-2', name: 'John Barber' },
    { id: 'staff-3', name: 'Alice Nail Tech' },
  ];

  const defaultProps = {
    staff: mockStaff,
    selectedStaffIds: [],
    onStaffFilterChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic rendering', () => {
    it('renders trigger button', () => {
      render(<StaffFilterDropdown {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows "All team" when no staff selected', () => {
      render(<StaffFilterDropdown {...defaultProps} selectedStaffIds={[]} />);
      expect(screen.getByText('All team')).toBeInTheDocument();
    });

    it('shows "All team" when all staff selected', () => {
      render(
        <StaffFilterDropdown
          {...defaultProps}
          selectedStaffIds={['staff-1', 'staff-2', 'staff-3']}
        />
      );
      expect(screen.getByText('All team')).toBeInTheDocument();
    });

    it('shows staff name when single staff selected', () => {
      render(
        <StaffFilterDropdown {...defaultProps} selectedStaffIds={['staff-1']} />
      );
      expect(screen.getByText('Jane Stylist')).toBeInTheDocument();
    });

    it('shows count when multiple staff selected (but not all)', () => {
      render(
        <StaffFilterDropdown
          {...defaultProps}
          selectedStaffIds={['staff-1', 'staff-2']}
        />
      );
      expect(screen.getByText('2 staff')).toBeInTheDocument();
    });

    it('has chevron icon', () => {
      const { container } = render(<StaffFilterDropdown {...defaultProps} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <StaffFilterDropdown {...defaultProps} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('dropdown toggle', () => {
    it('dropdown is closed by default', () => {
      render(<StaffFilterDropdown {...defaultProps} />);
      // Dropdown menu should not be visible
      expect(screen.queryByText('All team', { selector: 'button.w-full' })).not.toBeInTheDocument();
    });

    it('opens dropdown on button click', () => {
      render(<StaffFilterDropdown {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      // Now should see "All team" option in dropdown
      const allTeamOptions = screen.getAllByText('All team');
      expect(allTeamOptions.length).toBeGreaterThan(1); // Trigger + dropdown option
    });

    it('closes dropdown on second button click', () => {
      render(<StaffFilterDropdown {...defaultProps} />);
      const trigger = screen.getByRole('button');

      // Open
      fireEvent.click(trigger);
      expect(screen.getAllByText('All team').length).toBeGreaterThan(1);

      // Close
      fireEvent.click(trigger);
      expect(screen.getAllByText('All team').length).toBe(1);
    });

    it('chevron rotates when open', () => {
      const { container } = render(<StaffFilterDropdown {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      const svg = container.querySelector('svg.rotate-180');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('dropdown menu', () => {
    it('shows all staff options when open', () => {
      render(<StaffFilterDropdown {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Jane Stylist')).toBeInTheDocument();
      expect(screen.getByText('John Barber')).toBeInTheDocument();
      expect(screen.getByText('Alice Nail Tech')).toBeInTheDocument();
    });

    it('has divider between All team and staff list', () => {
      const { container } = render(<StaffFilterDropdown {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      const divider = container.querySelector('.border-t.border-gray-100');
      expect(divider).toBeInTheDocument();
    });

    it('no divider when staff list is empty', () => {
      const { container } = render(
        <StaffFilterDropdown {...defaultProps} staff={[]} />
      );
      fireEvent.click(screen.getByRole('button'));

      const divider = container.querySelector('.border-t.border-gray-100');
      expect(divider).not.toBeInTheDocument();
    });
  });

  describe('selection behavior', () => {
    it('calls onStaffFilterChange with empty array when All team clicked', () => {
      const onStaffFilterChange = vi.fn();
      const { container } = render(
        <StaffFilterDropdown
          {...defaultProps}
          selectedStaffIds={['staff-1']}
          onStaffFilterChange={onStaffFilterChange}
        />
      );

      // Click trigger to open dropdown
      const trigger = container.querySelector('button');
      fireEvent.click(trigger!);

      // Click All team option in dropdown menu (has w-full class)
      const dropdownButtons = container.querySelectorAll('button.w-full');
      fireEvent.click(dropdownButtons[0]); // First full-width button is All team

      expect(onStaffFilterChange).toHaveBeenCalledWith([]);
    });

    it('calls onStaffFilterChange with staff id when staff clicked', () => {
      const onStaffFilterChange = vi.fn();
      render(
        <StaffFilterDropdown
          {...defaultProps}
          onStaffFilterChange={onStaffFilterChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('John Barber'));

      expect(onStaffFilterChange).toHaveBeenCalledWith(['staff-2']);
    });

    it('closes dropdown after selection', () => {
      render(<StaffFilterDropdown {...defaultProps} />);

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Jane Stylist'));

      // Dropdown should be closed, only trigger shows
      expect(screen.getAllByText('All team').length).toBe(1);
    });
  });

  describe('checkmarks', () => {
    it('shows checkmark on All team when nothing selected', () => {
      render(<StaffFilterDropdown {...defaultProps} selectedStaffIds={[]} />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('shows checkmark on All team when all staff selected', () => {
      const { container } = render(
        <StaffFilterDropdown
          {...defaultProps}
          selectedStaffIds={['staff-1', 'staff-2', 'staff-3']}
        />
      );
      const trigger = container.querySelector('button');
      fireEvent.click(trigger!);

      // When all staff are selected, checkmarks appear on All team AND each staff member
      // 4 checkmarks total: 1 for All team + 3 for individual staff
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBe(4);
    });

    it('shows checkmark on selected staff member', () => {
      render(
        <StaffFilterDropdown {...defaultProps} selectedStaffIds={['staff-2']} />
      );
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('checkmark has blue color', () => {
      render(
        <StaffFilterDropdown {...defaultProps} selectedStaffIds={['staff-1']} />
      );
      fireEvent.click(screen.getByRole('button'));

      const checkmark = screen.getByText('✓');
      expect(checkmark).toHaveClass('text-blue-500');
    });
  });

  describe('icons', () => {
    it('shows Users icon for All team option', () => {
      const { container } = render(<StaffFilterDropdown {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      // Users icon has specific path for two users
      const usersIcons = container.querySelectorAll('svg.w-4.h-4');
      expect(usersIcons.length).toBeGreaterThan(0);
    });

    it('shows User icon for each staff option', () => {
      const { container } = render(<StaffFilterDropdown {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      // Should have User icons for each staff member
      const userIcons = container.querySelectorAll('svg.w-4.h-4.text-gray-400');
      // At least 4: Users icon + 3 User icons
      expect(userIcons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('close behaviors', () => {
    it('closes on Escape key', async () => {
      render(<StaffFilterDropdown {...defaultProps} />);

      fireEvent.click(screen.getByRole('button'));
      expect(screen.getAllByText('All team').length).toBeGreaterThan(1);

      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });

      expect(screen.getAllByText('All team').length).toBe(1);
    });

    it('closes on click outside', async () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <StaffFilterDropdown {...defaultProps} />
        </div>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(screen.getAllByText('All team').length).toBeGreaterThan(1);

      await act(async () => {
        fireEvent.mouseDown(screen.getByTestId('outside'));
      });

      expect(screen.getAllByText('All team').length).toBe(1);
    });

    it('does not close when clicking inside dropdown', async () => {
      const { container } = render(<StaffFilterDropdown {...defaultProps} />);

      fireEvent.click(screen.getByRole('button'));

      // Click on divider (inside dropdown but not a button)
      const divider = container.querySelector('.border-t.border-gray-100');
      if (divider) {
        await act(async () => {
          fireEvent.mouseDown(divider);
        });
      }

      // Should still be open
      expect(screen.getAllByText('All team').length).toBeGreaterThan(1);
    });
  });

  describe('styling', () => {
    it('trigger button has rounded corners', () => {
      const { container } = render(<StaffFilterDropdown {...defaultProps} />);
      const button = container.querySelector('button.rounded-lg');
      expect(button).toBeInTheDocument();
    });

    it('trigger button has border', () => {
      const { container } = render(<StaffFilterDropdown {...defaultProps} />);
      const button = container.querySelector('button.border');
      expect(button).toBeInTheDocument();
    });

    it('trigger button has white background', () => {
      const { container } = render(<StaffFilterDropdown {...defaultProps} />);
      const button = container.querySelector('button.bg-white');
      expect(button).toBeInTheDocument();
    });

    it('trigger button has minimum width', () => {
      const { container } = render(<StaffFilterDropdown {...defaultProps} />);
      const button = container.querySelector('button.min-w-\\[120px\\]');
      expect(button).toBeInTheDocument();
    });

    it('dropdown menu has shadow', () => {
      const { container } = render(<StaffFilterDropdown {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      const menu = container.querySelector('.shadow-sm');
      expect(menu).toBeInTheDocument();
    });

    it('dropdown menu has high z-index', () => {
      const { container } = render(<StaffFilterDropdown {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      const menu = container.querySelector('.z-50');
      expect(menu).toBeInTheDocument();
    });

    it('selected option has gray background', () => {
      const { container } = render(
        <StaffFilterDropdown {...defaultProps} selectedStaffIds={['staff-1']} />
      );
      fireEvent.click(screen.getByRole('button'));

      const selected = container.querySelector('button.bg-gray-50');
      expect(selected).toBeInTheDocument();
    });

    it('trigger button has active state when open', () => {
      const { container } = render(<StaffFilterDropdown {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      // First button (trigger) should have active styles
      const trigger = container.querySelector('button.border-gray-300.bg-gray-50\\/50');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty staff list', () => {
      render(<StaffFilterDropdown {...defaultProps} staff={[]} />);
      fireEvent.click(screen.getByRole('button'));

      // Should still show All team option
      const allTeamOptions = screen.getAllByText('All team');
      expect(allTeamOptions.length).toBeGreaterThan(1);
    });

    it('handles unknown staff id gracefully', () => {
      render(
        <StaffFilterDropdown
          {...defaultProps}
          selectedStaffIds={['unknown-staff']}
        />
      );
      // Should fall back to "All team"
      expect(screen.getByText('All team')).toBeInTheDocument();
    });

    it('handles single staff list', () => {
      render(
        <StaffFilterDropdown
          {...defaultProps}
          staff={[{ id: 'staff-1', name: 'Solo Stylist' }]}
        />
      );
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Solo Stylist')).toBeInTheDocument();
    });
  });

  describe('event listener cleanup', () => {
    it('removes click outside listener when closed', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const { container, unmount } = render(<StaffFilterDropdown {...defaultProps} />);

      // Get trigger button (first button, without w-full class)
      const trigger = container.querySelector('button:not(.w-full)');
      fireEvent.click(trigger!); // Open
      fireEvent.click(trigger!); // Close

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function)
      );

      unmount();
      removeEventListenerSpy.mockRestore();
    });

    it('removes escape listener when closed', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { container, unmount } = render(<StaffFilterDropdown {...defaultProps} />);

      // Get trigger button (first button, without w-full class)
      const trigger = container.querySelector('button:not(.w-full)');
      fireEvent.click(trigger!); // Open
      fireEvent.click(trigger!); // Close

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );

      unmount();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('trigger button is focusable', () => {
      render(<StaffFilterDropdown {...defaultProps} />);
      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('dropdown options are buttons', () => {
      render(<StaffFilterDropdown {...defaultProps} />);
      fireEvent.click(screen.getByRole('button'));

      // All options should be buttons (trigger + All team + 3 staff)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(5);
    });
  });
});
