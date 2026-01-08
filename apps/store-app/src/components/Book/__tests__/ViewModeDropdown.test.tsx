/**
 * ViewModeDropdown Component Tests
 * Tests for view mode dropdown selection and toggle behavior
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ViewModeDropdown } from '../ViewModeDropdown';
import type { CalendarView } from '../../../constants/appointment';

describe('ViewModeDropdown', () => {
  const defaultProps = {
    currentView: 'day' as CalendarView,
    onViewChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders trigger button', () => {
      render(<ViewModeDropdown {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('displays current view label', () => {
      render(<ViewModeDropdown {...defaultProps} currentView="day" />);
      expect(screen.getByText('Day')).toBeInTheDocument();
    });

    it('displays Week label for week view', () => {
      render(<ViewModeDropdown {...defaultProps} currentView="week" />);
      expect(screen.getByText('Week')).toBeInTheDocument();
    });

    it('displays Month label for month view', () => {
      render(<ViewModeDropdown {...defaultProps} currentView="month" />);
      expect(screen.getByText('Month')).toBeInTheDocument();
    });

    it('renders ChevronDown icon', () => {
      const { container } = render(<ViewModeDropdown {...defaultProps} />);
      const icon = container.querySelector('.lucide-chevron-down');
      expect(icon).toBeInTheDocument();
    });

    it('dropdown is closed by default', () => {
      render(<ViewModeDropdown {...defaultProps} />);
      // Options should not be visible when closed
      expect(screen.queryAllByRole('button').length).toBe(1); // Only trigger button
    });
  });

  describe('dropdown toggle', () => {
    it('opens dropdown on click', () => {
      render(<ViewModeDropdown {...defaultProps} />);

      fireEvent.click(screen.getByRole('button'));

      // Should now show all view options (Day appears twice: trigger and option)
      expect(screen.getAllByText('Day').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
    });

    it('closes dropdown on second click', () => {
      render(<ViewModeDropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');

      // Open
      fireEvent.click(trigger);
      expect(screen.getAllByRole('button').length).toBe(4); // Trigger + 3 options

      // Close
      fireEvent.click(trigger);
      expect(screen.getAllByRole('button').length).toBe(1); // Only trigger
    });

    it('rotates chevron icon when open', () => {
      const { container } = render(<ViewModeDropdown {...defaultProps} />);

      const icon = container.querySelector('.lucide-chevron-down');
      expect(icon).not.toHaveClass('rotate-180');

      fireEvent.click(screen.getByRole('button'));

      const rotatedIcon = container.querySelector('.lucide-chevron-down');
      expect(rotatedIcon).toHaveClass('rotate-180');
    });
  });

  describe('view selection', () => {
    it('calls onViewChange when selecting a view', () => {
      const handleViewChange = vi.fn();
      render(<ViewModeDropdown {...defaultProps} onViewChange={handleViewChange} />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button'));

      // Click Week option
      fireEvent.click(screen.getByText('Week'));

      expect(handleViewChange).toHaveBeenCalledTimes(1);
      expect(handleViewChange).toHaveBeenCalledWith('week');
    });

    it('closes dropdown after selection', () => {
      render(<ViewModeDropdown {...defaultProps} />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getAllByRole('button').length).toBe(4);

      // Select an option
      fireEvent.click(screen.getByText('Month'));

      // Dropdown should be closed
      expect(screen.getAllByRole('button').length).toBe(1);
    });

    it('shows checkmark for selected option', () => {
      render(<ViewModeDropdown {...defaultProps} currentView="day" />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button'));

      // Find the checkmark in the Day option
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('highlights selected option with different styling', () => {
      render(<ViewModeDropdown {...defaultProps} currentView="week" />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button'));

      // Week button should have selected styling
      const weekButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Week✓'));
      expect(weekButton).toHaveClass('bg-gray-50');
      expect(weekButton).toHaveClass('text-gray-900');
    });
  });

  describe('click outside to close', () => {
    it('closes dropdown when clicking outside', async () => {
      render(
        <div>
          <ViewModeDropdown {...defaultProps} />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      // Open dropdown
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getAllByRole('button').length).toBe(4);

      // Click outside
      fireEvent.mouseDown(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.getAllByRole('button').length).toBe(1);
      });
    });

    it('does not close when clicking inside dropdown', () => {
      const { container } = render(<ViewModeDropdown {...defaultProps} />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button'));

      // Click on dropdown container (not an option)
      const dropdown = container.querySelector('.absolute');
      if (dropdown) {
        fireEvent.mouseDown(dropdown);
      }

      // Should still be open
      expect(screen.getAllByRole('button').length).toBe(4);
    });
  });

  describe('keyboard navigation', () => {
    it('closes dropdown on Escape key', async () => {
      render(<ViewModeDropdown {...defaultProps} />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getAllByRole('button').length).toBe(4);

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.getAllByRole('button').length).toBe(1);
      });
    });

    it('does not close on other keys', () => {
      render(<ViewModeDropdown {...defaultProps} />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button'));

      // Press other key
      fireEvent.keyDown(window, { key: 'Enter' });

      // Should still be open
      expect(screen.getAllByRole('button').length).toBe(4);
    });
  });

  describe('view options', () => {
    it('renders all three view options', () => {
      render(<ViewModeDropdown {...defaultProps} />);

      fireEvent.click(screen.getByRole('button'));

      // Day appears in both trigger and dropdown, Week and Month in dropdown only
      expect(screen.getAllByText('Day').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
    });

    it('renders icons for each option', () => {
      const { container } = render(<ViewModeDropdown {...defaultProps} />);

      fireEvent.click(screen.getByRole('button'));

      // Should have Calendar and LayoutGrid icons
      const calendarIcons = container.querySelectorAll('.lucide-calendar');
      const gridIcons = container.querySelectorAll('.lucide-layout-grid');

      expect(calendarIcons.length).toBeGreaterThan(0);
      expect(gridIcons.length).toBeGreaterThan(0);
    });

    it('can select Day view', () => {
      const handleViewChange = vi.fn();
      render(<ViewModeDropdown {...defaultProps} currentView="week" onViewChange={handleViewChange} />);

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Day'));

      expect(handleViewChange).toHaveBeenCalledWith('day');
    });

    it('can select Week view', () => {
      const handleViewChange = vi.fn();
      render(<ViewModeDropdown {...defaultProps} currentView="day" onViewChange={handleViewChange} />);

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Week'));

      expect(handleViewChange).toHaveBeenCalledWith('week');
    });

    it('can select Month view', () => {
      const handleViewChange = vi.fn();
      render(<ViewModeDropdown {...defaultProps} currentView="day" onViewChange={handleViewChange} />);

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Month'));

      expect(handleViewChange).toHaveBeenCalledWith('month');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ViewModeDropdown {...defaultProps} className="custom-dropdown-class" />
      );
      expect(container.firstChild).toHaveClass('custom-dropdown-class');
    });

    it('trigger button has border styling', () => {
      render(<ViewModeDropdown {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });

    it('trigger button has rounded corners', () => {
      render(<ViewModeDropdown {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-lg');
    });

    it('trigger button has minimum width', () => {
      render(<ViewModeDropdown {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-w-[100px]');
    });

    it('trigger button has active styling when open', () => {
      render(<ViewModeDropdown {...defaultProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(button).toHaveClass('border-gray-300');
    });

    it('dropdown menu has shadow', () => {
      const { container } = render(<ViewModeDropdown {...defaultProps} />);

      fireEvent.click(screen.getByRole('button'));

      const dropdown = container.querySelector('.absolute');
      expect(dropdown).toHaveClass('shadow-sm');
    });

    it('dropdown menu has border', () => {
      const { container } = render(<ViewModeDropdown {...defaultProps} />);

      fireEvent.click(screen.getByRole('button'));

      const dropdown = container.querySelector('.absolute');
      expect(dropdown).toHaveClass('border');
    });

    it('dropdown menu has z-index for layering', () => {
      const { container } = render(<ViewModeDropdown {...defaultProps} />);

      fireEvent.click(screen.getByRole('button'));

      const dropdown = container.querySelector('.absolute');
      expect(dropdown).toHaveClass('z-50');
    });
  });

  describe('default view label', () => {
    it('defaults to Day label for unknown view', () => {
      render(<ViewModeDropdown {...defaultProps} currentView={'unknown' as CalendarView} />);
      expect(screen.getByText('Day')).toBeInTheDocument();
    });
  });

  describe('event cleanup', () => {
    afterEach(() => {
      // Ensure event listeners are cleaned up
      vi.restoreAllMocks();
    });

    it('removes mousedown listener when dropdown closes', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      render(<ViewModeDropdown {...defaultProps} />);

      // Open dropdown - use getAllByRole and get first (trigger)
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);

      // Close dropdown by clicking trigger again (it's still the first button)
      const updatedButtons = screen.getAllByRole('button');
      fireEvent.click(updatedButtons[0]);

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    });

    it('removes keydown listener when dropdown closes', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      render(<ViewModeDropdown {...defaultProps} />);

      // Open dropdown
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);

      // Close dropdown
      const updatedButtons = screen.getAllByRole('button');
      fireEvent.click(updatedButtons[0]);

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('option button behavior', () => {
    it('option buttons are full width', () => {
      render(<ViewModeDropdown {...defaultProps} />);

      fireEvent.click(screen.getByRole('button'));

      const optionButtons = screen.getAllByRole('button').slice(1); // Exclude trigger
      optionButtons.forEach(btn => {
        expect(btn).toHaveClass('w-full');
      });
    });

    it('option buttons have text alignment', () => {
      render(<ViewModeDropdown {...defaultProps} />);

      fireEvent.click(screen.getByRole('button'));

      const optionButtons = screen.getAllByRole('button').slice(1);
      optionButtons.forEach(btn => {
        expect(btn).toHaveClass('text-left');
      });
    });

    it('non-selected options have hover styling', () => {
      render(<ViewModeDropdown {...defaultProps} currentView="day" />);

      fireEvent.click(screen.getByRole('button'));

      // Week option should have hover styling class
      const weekButton = screen.getAllByRole('button').find(btn =>
        btn.textContent === 'Week' || btn.textContent?.includes('Week')
      );
      expect(weekButton).toHaveClass('hover:bg-gray-50');
    });
  });
});
