/**
 * DatePickerModal Component Tests
 * Tests for date picker calendar navigation and selection
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { DatePickerModal } from '../DatePickerModal';

describe('DatePickerModal', () => {
  const defaultProps = {
    isOpen: true,
    selectedDate: new Date(2026, 0, 15), // January 15, 2026
    onClose: vi.fn(),
    onDateSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date to have consistent "today"
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 8)); // January 8, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      const { container } = render(<DatePickerModal {...defaultProps} isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('basic structure', () => {
    it('has absolute positioning', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      expect(container.firstChild).toHaveClass('absolute');
    });

    it('has z-index for layering', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      expect(container.firstChild).toHaveClass('z-50');
    });

    it('has white background', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      expect(container.firstChild).toHaveClass('bg-white');
    });

    it('has rounded corners', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      expect(container.firstChild).toHaveClass('rounded-xl');
    });

    it('has border', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      expect(container.firstChild).toHaveClass('border');
    });

    it('has shadow', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      expect(container.firstChild).toHaveClass('shadow-sm');
    });
  });

  describe('month display', () => {
    it('displays current month name', () => {
      render(<DatePickerModal {...defaultProps} />);
      expect(screen.getByText('January 2026')).toBeInTheDocument();
    });

    it('displays next month name', () => {
      render(<DatePickerModal {...defaultProps} />);
      expect(screen.getByText('February 2026')).toBeInTheDocument();
    });

    it('shows December and January when viewing end of year', () => {
      const decDate = new Date(2025, 11, 15); // December 2025
      render(<DatePickerModal {...defaultProps} selectedDate={decDate} />);
      expect(screen.getByText('December 2025')).toBeInTheDocument();
      expect(screen.getByText('January 2026')).toBeInTheDocument();
    });
  });

  describe('day names', () => {
    it('displays all day names', () => {
      render(<DatePickerModal {...defaultProps} />);
      // Should appear twice (once for each month)
      expect(screen.getAllByText('Sun').length).toBe(2);
      expect(screen.getAllByText('Mon').length).toBe(2);
      expect(screen.getAllByText('Tue').length).toBe(2);
      expect(screen.getAllByText('Wed').length).toBe(2);
      expect(screen.getAllByText('Thu').length).toBe(2);
      expect(screen.getAllByText('Fri').length).toBe(2);
      expect(screen.getAllByText('Sat').length).toBe(2);
    });
  });

  describe('navigation', () => {
    it('renders previous month button', () => {
      render(<DatePickerModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
    });

    it('renders next month button', () => {
      render(<DatePickerModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument();
    });

    it('navigates to previous month on click', () => {
      render(<DatePickerModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));

      expect(screen.getByText('December 2025')).toBeInTheDocument();
      expect(screen.getByText('January 2026')).toBeInTheDocument();
    });

    it('navigates to next month on click', () => {
      render(<DatePickerModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));

      expect(screen.getByText('February 2026')).toBeInTheDocument();
      expect(screen.getByText('March 2026')).toBeInTheDocument();
    });

    it('wraps year backward correctly', () => {
      const janDate = new Date(2026, 0, 15);
      render(<DatePickerModal {...defaultProps} selectedDate={janDate} />);

      fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));

      expect(screen.getByText('December 2025')).toBeInTheDocument();
    });

    it('wraps year forward correctly', () => {
      const decDate = new Date(2025, 11, 15);
      render(<DatePickerModal {...defaultProps} selectedDate={decDate} />);

      // Navigate forward twice to get to January 2026
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));

      expect(screen.getByText('February 2026')).toBeInTheDocument();
      expect(screen.getByText('March 2026')).toBeInTheDocument();
    });

    it('renders ChevronLeft icon for prev button', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      const icon = container.querySelector('.lucide-chevron-left');
      expect(icon).toBeInTheDocument();
    });

    it('renders ChevronRight icon for next button', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      const icon = container.querySelector('.lucide-chevron-right');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('date selection', () => {
    it('calls onDateSelect when clicking a date', () => {
      const handleDateSelect = vi.fn();
      render(<DatePickerModal {...defaultProps} onDateSelect={handleDateSelect} />);

      // Find and click a date button (20th is a safe choice that exists in any month)
      const dateButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === '20' && !btn.getAttribute('aria-label')
      );
      fireEvent.click(dateButtons[0]);

      expect(handleDateSelect).toHaveBeenCalledTimes(1);
      expect(handleDateSelect).toHaveBeenCalledWith(expect.any(Date));
    });

    it('calls onClose after date selection', () => {
      const handleClose = vi.fn();
      render(<DatePickerModal {...defaultProps} onClose={handleClose} />);

      const dateButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === '20' && !btn.getAttribute('aria-label')
      );
      fireEvent.click(dateButtons[0]);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('highlights selected date with blue background', () => {
      render(<DatePickerModal {...defaultProps} />);

      // Selected date is 15
      const dateButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === '15' && !btn.getAttribute('aria-label')
      );

      // At least one should have the selected styling
      const selectedButton = dateButtons.find(btn =>
        btn.classList.contains('bg-blue-500')
      );
      expect(selectedButton).toBeTruthy();
    });

    it('selected date has white text', () => {
      render(<DatePickerModal {...defaultProps} />);

      const dateButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === '15' && btn.classList.contains('bg-blue-500')
      );

      expect(dateButtons[0]).toHaveClass('text-white');
    });
  });

  describe('today highlight', () => {
    it('highlights today with gray background', () => {
      render(<DatePickerModal {...defaultProps} />);

      // Today is January 8
      const todayButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === '8' && !btn.getAttribute('aria-label')
      );

      // Should have bg-gray-100 for today (if not selected)
      const todayButton = todayButtons.find(btn =>
        btn.classList.contains('bg-gray-100') || btn.classList.contains('bg-blue-500')
      );
      expect(todayButton).toBeTruthy();
    });
  });

  describe('quick jump buttons', () => {
    it('renders quick jump buttons', () => {
      render(<DatePickerModal {...defaultProps} />);
      expect(screen.getByText('In 1 week')).toBeInTheDocument();
      expect(screen.getByText('In 2 weeks')).toBeInTheDocument();
      expect(screen.getByText('In 3 weeks')).toBeInTheDocument();
      expect(screen.getByText('In 4 weeks')).toBeInTheDocument();
      expect(screen.getByText('In 5 weeks')).toBeInTheDocument();
    });

    it('jumps 1 week when clicking "In 1 week"', () => {
      const handleDateSelect = vi.fn();
      render(<DatePickerModal {...defaultProps} onDateSelect={handleDateSelect} />);

      fireEvent.click(screen.getByText('In 1 week'));

      expect(handleDateSelect).toHaveBeenCalledWith(expect.any(Date));
      const selectedDate = handleDateSelect.mock.calls[0][0];
      // January 8 + 7 days = January 15
      expect(selectedDate.getDate()).toBe(15);
      expect(selectedDate.getMonth()).toBe(0); // January
    });

    it('jumps 2 weeks when clicking "In 2 weeks"', () => {
      const handleDateSelect = vi.fn();
      render(<DatePickerModal {...defaultProps} onDateSelect={handleDateSelect} />);

      fireEvent.click(screen.getByText('In 2 weeks'));

      const selectedDate = handleDateSelect.mock.calls[0][0];
      expect(selectedDate.getDate()).toBe(22); // January 8 + 14 days
    });

    it('jumps 3 weeks when clicking "In 3 weeks"', () => {
      const handleDateSelect = vi.fn();
      render(<DatePickerModal {...defaultProps} onDateSelect={handleDateSelect} />);

      fireEvent.click(screen.getByText('In 3 weeks'));

      const selectedDate = handleDateSelect.mock.calls[0][0];
      expect(selectedDate.getDate()).toBe(29); // January 8 + 21 days
    });

    it('jumps 4 weeks when clicking "In 4 weeks"', () => {
      const handleDateSelect = vi.fn();
      render(<DatePickerModal {...defaultProps} onDateSelect={handleDateSelect} />);

      fireEvent.click(screen.getByText('In 4 weeks'));

      const selectedDate = handleDateSelect.mock.calls[0][0];
      // January 8 + 28 days = February 5
      expect(selectedDate.getMonth()).toBe(1); // February
      expect(selectedDate.getDate()).toBe(5);
    });

    it('closes modal after quick jump', () => {
      const handleClose = vi.fn();
      render(<DatePickerModal {...defaultProps} onClose={handleClose} />);

      fireEvent.click(screen.getByText('In 1 week'));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard navigation', () => {
    it('closes on Escape key', async () => {
      const handleClose = vi.fn();
      render(<DatePickerModal {...defaultProps} onClose={handleClose} />);

      act(() => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on other keys', () => {
      const handleClose = vi.fn();
      render(<DatePickerModal {...defaultProps} onClose={handleClose} />);

      fireEvent.keyDown(window, { key: 'Enter' });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('click outside', () => {
    it('closes when clicking outside modal', async () => {
      const handleClose = vi.fn();
      render(
        <div>
          <DatePickerModal {...defaultProps} onClose={handleClose} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      fireEvent.mouseDown(screen.getByTestId('outside'));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking inside modal', () => {
      const handleClose = vi.fn();
      const { container } = render(<DatePickerModal {...defaultProps} onClose={handleClose} />);

      // Click on the modal container
      fireEvent.mouseDown(container.firstChild!);

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('updates when selectedDate changes', () => {
    it('updates view when reopened with different date', () => {
      const { rerender } = render(
        <DatePickerModal {...defaultProps} isOpen={false} selectedDate={new Date(2026, 0, 15)} />
      );

      // Reopen with different date
      rerender(
        <DatePickerModal {...defaultProps} isOpen={true} selectedDate={new Date(2026, 5, 15)} />
      );

      expect(screen.getByText('June 2026')).toBeInTheDocument();
      expect(screen.getByText('July 2026')).toBeInTheDocument();
    });
  });

  describe('two-month grid layout', () => {
    it('has grid with 2 columns', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      const grid = container.querySelector('.grid.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('has gap between month columns', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      const grid = container.querySelector('.gap-12');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('calendar grid', () => {
    it('has 7-column grid for days', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      const grids = container.querySelectorAll('.grid.grid-cols-7');
      expect(grids.length).toBeGreaterThan(0);
    });

    it('date buttons have circular shape', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      const roundedButtons = container.querySelectorAll('button.rounded-full');
      expect(roundedButtons.length).toBeGreaterThan(0);
    });

    it('date buttons have aspect-square', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      const squareButtons = container.querySelectorAll('button.aspect-square');
      expect(squareButtons.length).toBeGreaterThan(0);
    });
  });

  describe('days from adjacent months', () => {
    it('displays trailing days from previous month in lighter color', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      // Days from adjacent months should have text-gray-300
      const lightButtons = container.querySelectorAll('button.text-gray-300');
      expect(lightButtons.length).toBeGreaterThan(0);
    });

    it('days from current month have darker text', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      const darkButtons = container.querySelectorAll('button.text-gray-700');
      expect(darkButtons.length).toBeGreaterThan(0);
    });
  });

  describe('quick jump section styling', () => {
    it('has border top for quick jump section', () => {
      const { container } = render(<DatePickerModal {...defaultProps} />);
      const section = container.querySelector('.border-t');
      expect(section).toBeInTheDocument();
    });

    it('quick jump buttons have border', () => {
      render(<DatePickerModal {...defaultProps} />);
      const button = screen.getByText('In 1 week');
      expect(button).toHaveClass('border');
    });

    it('quick jump buttons have rounded corners', () => {
      render(<DatePickerModal {...defaultProps} />);
      const button = screen.getByText('In 1 week');
      expect(button).toHaveClass('rounded-lg');
    });
  });

  describe('event listener cleanup', () => {
    it('removes keydown listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<DatePickerModal {...defaultProps} />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('removes mousedown listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(<DatePickerModal {...defaultProps} />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    });
  });
});
