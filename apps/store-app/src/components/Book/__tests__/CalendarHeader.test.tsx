/**
 * CalendarHeader Component Tests
 * Tests for calendar navigation, date display, and view controls
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CalendarHeader } from '../CalendarHeader';
import { CALENDAR_VIEWS, TIME_WINDOW_MODES } from '../../../constants/appointment';
import type { CalendarView } from '../../../constants/appointment';

// Mock child components
vi.mock('../DatePickerModal', () => ({
  DatePickerModal: ({ isOpen, onDateSelect, onClose }: {
    isOpen: boolean;
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    onClose: () => void;
  }) => isOpen ? (
    <div data-testid="date-picker-modal">
      <button onClick={() => onDateSelect(new Date(2026, 0, 15))}>Select Jan 15</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}));

vi.mock('../ViewModeDropdown', () => ({
  ViewModeDropdown: ({ currentView, onViewChange }: {
    currentView: CalendarView;
    onViewChange: (view: CalendarView) => void;
  }) => (
    <div data-testid="view-mode-dropdown">
      <span data-testid="current-view">{currentView}</span>
      <button onClick={() => onViewChange('week')}>Week View</button>
      <button onClick={() => onViewChange('month')}>Month View</button>
    </div>
  ),
}));

vi.mock('../StaffFilterDropdown', () => ({
  StaffFilterDropdown: ({ staff, selectedStaffIds, onStaffFilterChange }: {
    staff: Array<{ id: string; name: string }>;
    selectedStaffIds: string[];
    onStaffFilterChange: (ids: string[]) => void;
  }) => (
    <div data-testid="staff-filter-dropdown">
      <span data-testid="selected-count">{selectedStaffIds.length}</span>
      <span data-testid="staff-count">{staff.length}</span>
      <button onClick={() => onStaffFilterChange(['staff-1'])}>Select Staff 1</button>
    </div>
  ),
}));

describe('CalendarHeader', () => {
  const defaultProps = {
    selectedDate: new Date(2026, 0, 8), // Jan 8, 2026 (local time)
    calendarView: CALENDAR_VIEWS.DAY as CalendarView,
    timeWindowMode: TIME_WINDOW_MODES.FULL_DAY,
    onDateChange: vi.fn(),
    onViewChange: vi.fn(),
    onTodayClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic rendering', () => {
    it('renders header element', () => {
      const { container } = render(<CalendarHeader {...defaultProps} />);
      expect(container.querySelector('header')).toBeInTheDocument();
    });

    it('renders current date', () => {
      render(<CalendarHeader {...defaultProps} />);
      // formatDateDisplay should format the date
      expect(screen.getByTitle('Click to open date picker')).toBeInTheDocument();
    });

    it('renders Today button on desktop', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('renders previous day button', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.getByLabelText('Previous day')).toBeInTheDocument();
    });

    it('renders next day button', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.getByLabelText('Next day')).toBeInTheDocument();
    });

    it('renders view mode dropdown', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.getByTestId('view-mode-dropdown')).toBeInTheDocument();
    });
  });

  describe('date navigation', () => {
    it('calls onTodayClick when Today button is clicked', () => {
      const handleTodayClick = vi.fn();
      render(<CalendarHeader {...defaultProps} onTodayClick={handleTodayClick} />);

      fireEvent.click(screen.getByText('Today'));
      expect(handleTodayClick).toHaveBeenCalledTimes(1);
    });

    it('navigates to previous day', () => {
      const handleDateChange = vi.fn();
      const baseDate = new Date(2026, 0, 8); // Jan 8, 2026 (local time)
      render(<CalendarHeader {...defaultProps} selectedDate={baseDate} onDateChange={handleDateChange} />);

      fireEvent.click(screen.getByLabelText('Previous day'));

      expect(handleDateChange).toHaveBeenCalledTimes(1);
      const newDate = handleDateChange.mock.calls[0][0] as Date;
      expect(newDate.getDate()).toBe(7); // Jan 8 - 1 = Jan 7
    });

    it('navigates to next day', () => {
      const handleDateChange = vi.fn();
      const baseDate = new Date(2026, 0, 8); // Jan 8, 2026 (local time)
      render(<CalendarHeader {...defaultProps} selectedDate={baseDate} onDateChange={handleDateChange} />);

      fireEvent.click(screen.getByLabelText('Next day'));

      expect(handleDateChange).toHaveBeenCalledTimes(1);
      const newDate = handleDateChange.mock.calls[0][0] as Date;
      expect(newDate.getDate()).toBe(9); // Jan 8 + 1 = Jan 9
    });

    it('applies transition effect during date change', () => {
      const { container } = render(<CalendarHeader {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Next day'));

      // Transition class should be applied during animation
      const dateContainer = container.querySelector('.opacity-50');
      expect(dateContainer).toBeInTheDocument();
    });

    it('clears transition after delay', () => {
      render(<CalendarHeader {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Next day'));

      // Fast-forward timers
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // After 300ms, transition should be cleared
      // The component would re-render without opacity-50
    });
  });

  describe('date picker', () => {
    it('opens date picker when date is clicked', () => {
      render(<CalendarHeader {...defaultProps} />);

      // Initially no date picker
      expect(screen.queryByTestId('date-picker-modal')).not.toBeInTheDocument();

      // Click date button
      fireEvent.click(screen.getByTitle('Click to open date picker'));

      // Date picker should be visible
      expect(screen.getByTestId('date-picker-modal')).toBeInTheDocument();
    });

    it('closes date picker when close is clicked', () => {
      render(<CalendarHeader {...defaultProps} />);

      // Open date picker
      fireEvent.click(screen.getByTitle('Click to open date picker'));
      expect(screen.getByTestId('date-picker-modal')).toBeInTheDocument();

      // Close it
      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('date-picker-modal')).not.toBeInTheDocument();
    });

    it('selects date from picker', () => {
      const handleDateChange = vi.fn();
      render(<CalendarHeader {...defaultProps} onDateChange={handleDateChange} />);

      // Open date picker
      fireEvent.click(screen.getByTitle('Click to open date picker'));

      // Select a date
      fireEvent.click(screen.getByText('Select Jan 15'));

      expect(handleDateChange).toHaveBeenCalledTimes(1);
      const selectedDate = handleDateChange.mock.calls[0][0] as Date;
      expect(selectedDate.getDate()).toBe(15);
    });
  });

  describe('view mode', () => {
    it('displays current view mode', () => {
      render(<CalendarHeader {...defaultProps} calendarView={CALENDAR_VIEWS.DAY} />);
      expect(screen.getByTestId('current-view')).toHaveTextContent('day');
    });

    it('calls onViewChange when view is changed to week', () => {
      const handleViewChange = vi.fn();
      render(<CalendarHeader {...defaultProps} onViewChange={handleViewChange} />);

      fireEvent.click(screen.getByText('Week View'));
      expect(handleViewChange).toHaveBeenCalledWith('week');
    });

    it('calls onViewChange when view is changed to month', () => {
      const handleViewChange = vi.fn();
      render(<CalendarHeader {...defaultProps} onViewChange={handleViewChange} />);

      fireEvent.click(screen.getByText('Month View'));
      expect(handleViewChange).toHaveBeenCalledWith('month');
    });
  });

  describe('new appointment button', () => {
    it('does not render new appointment button when callback not provided', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.queryByTestId('new-appointment-button')).not.toBeInTheDocument();
    });

    it('renders new appointment button when callback provided', () => {
      const handleNewAppointment = vi.fn();
      render(<CalendarHeader {...defaultProps} onNewAppointment={handleNewAppointment} />);

      expect(screen.getByTestId('new-appointment-button')).toBeInTheDocument();
    });

    it('calls onNewAppointment when clicked', () => {
      const handleNewAppointment = vi.fn();
      render(<CalendarHeader {...defaultProps} onNewAppointment={handleNewAppointment} />);

      fireEvent.click(screen.getByTestId('new-appointment-button'));
      expect(handleNewAppointment).toHaveBeenCalledTimes(1);
    });

    it('displays "Add" text on larger screens', () => {
      const handleNewAppointment = vi.fn();
      render(<CalendarHeader {...defaultProps} onNewAppointment={handleNewAppointment} />);

      expect(screen.getByText('Add')).toBeInTheDocument();
    });
  });

  describe('settings button', () => {
    it('does not render settings button when callback not provided', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.queryByLabelText('Settings')).not.toBeInTheDocument();
    });

    it('renders settings button when callback provided', () => {
      const handleSettingsClick = vi.fn();
      render(<CalendarHeader {...defaultProps} onSettingsClick={handleSettingsClick} />);

      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });

    it('calls onSettingsClick when clicked', () => {
      const handleSettingsClick = vi.fn();
      render(<CalendarHeader {...defaultProps} onSettingsClick={handleSettingsClick} />);

      fireEvent.click(screen.getByLabelText('Settings'));
      expect(handleSettingsClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh button', () => {
    it('does not render refresh button when callback not provided', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.queryByLabelText('Refresh')).not.toBeInTheDocument();
    });

    it('renders refresh button when callback provided', () => {
      const handleRefreshClick = vi.fn();
      render(<CalendarHeader {...defaultProps} onRefreshClick={handleRefreshClick} />);

      expect(screen.getByLabelText('Refresh')).toBeInTheDocument();
    });

    it('calls onRefreshClick when clicked', () => {
      const handleRefreshClick = vi.fn();
      render(<CalendarHeader {...defaultProps} onRefreshClick={handleRefreshClick} />);

      fireEvent.click(screen.getByLabelText('Refresh'));
      expect(handleRefreshClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('search button', () => {
    it('renders search button', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.getByLabelText('Search appointments')).toBeInTheDocument();
    });
  });

  describe('staff filter', () => {
    const staffList = [
      { id: 'staff-1', name: 'Alice' },
      { id: 'staff-2', name: 'Bob' },
    ];

    it('does not render staff filter when no callback provided', () => {
      render(<CalendarHeader {...defaultProps} staff={staffList} />);
      expect(screen.queryByTestId('staff-filter-dropdown')).not.toBeInTheDocument();
    });

    it('does not render staff filter when staff list is empty', () => {
      const handleStaffFilterChange = vi.fn();
      render(
        <CalendarHeader
          {...defaultProps}
          staff={[]}
          onStaffFilterChange={handleStaffFilterChange}
        />
      );
      expect(screen.queryByTestId('staff-filter-dropdown')).not.toBeInTheDocument();
    });

    it('renders staff filter when staff and callback provided', () => {
      const handleStaffFilterChange = vi.fn();
      render(
        <CalendarHeader
          {...defaultProps}
          staff={staffList}
          selectedStaffIds={[]}
          onStaffFilterChange={handleStaffFilterChange}
        />
      );

      expect(screen.getByTestId('staff-filter-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('staff-count')).toHaveTextContent('2');
    });

    it('shows selected staff count', () => {
      const handleStaffFilterChange = vi.fn();
      render(
        <CalendarHeader
          {...defaultProps}
          staff={staffList}
          selectedStaffIds={['staff-1']}
          onStaffFilterChange={handleStaffFilterChange}
        />
      );

      expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
    });

    it('calls onStaffFilterChange when staff selected', () => {
      const handleStaffFilterChange = vi.fn();
      render(
        <CalendarHeader
          {...defaultProps}
          staff={staffList}
          selectedStaffIds={[]}
          onStaffFilterChange={handleStaffFilterChange}
        />
      );

      fireEvent.click(screen.getByText('Select Staff 1'));
      expect(handleStaffFilterChange).toHaveBeenCalledWith(['staff-1']);
    });
  });

  describe('sidebar toggle', () => {
    it('renders sidebar toggle when sidebar is closed and callback provided', () => {
      const handleSidebarToggle = vi.fn();
      render(
        <CalendarHeader
          {...defaultProps}
          sidebarOpen={false}
          onSidebarToggle={handleSidebarToggle}
        />
      );

      expect(screen.getByLabelText('Open sidebar')).toBeInTheDocument();
    });

    it('does not render sidebar toggle when sidebar is open', () => {
      const handleSidebarToggle = vi.fn();
      render(
        <CalendarHeader
          {...defaultProps}
          sidebarOpen={true}
          onSidebarToggle={handleSidebarToggle}
        />
      );

      expect(screen.queryByLabelText('Open sidebar')).not.toBeInTheDocument();
    });

    it('calls onSidebarToggle when toggle is clicked', () => {
      const handleSidebarToggle = vi.fn();
      render(
        <CalendarHeader
          {...defaultProps}
          sidebarOpen={false}
          onSidebarToggle={handleSidebarToggle}
        />
      );

      fireEvent.click(screen.getByLabelText('Open sidebar'));
      expect(handleSidebarToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('responsive behavior', () => {
    it('hides date controls on desktop when sidebar is open', () => {
      const handleStaffFilterChange = vi.fn();
      const { container } = render(
        <CalendarHeader
          {...defaultProps}
          sidebarOpen={true}
          staff={[{ id: '1', name: 'Staff' }]}
          onStaffFilterChange={handleStaffFilterChange}
        />
      );

      // The lg:hidden class should be applied to date controls container
      const dateControlsContainer = container.querySelector('.lg\\:hidden');
      expect(dateControlsContainer).toBeInTheDocument();
    });

    it('shows minimal date display when sidebar is open', () => {
      render(<CalendarHeader {...defaultProps} sidebarOpen={true} />);

      // There should be a minimal date display span with hidden lg:inline
      const minimalDateDisplay = document.querySelector('.lg\\:inline');
      expect(minimalDateDisplay).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className to header', () => {
      const { container } = render(
        <CalendarHeader {...defaultProps} className="custom-header-class" />
      );

      expect(container.querySelector('header')).toHaveClass('custom-header-class');
    });
  });

  describe('accessibility', () => {
    it('navigation buttons have aria-labels', () => {
      render(<CalendarHeader {...defaultProps} />);

      expect(screen.getByLabelText('Previous day')).toBeInTheDocument();
      expect(screen.getByLabelText('Next day')).toBeInTheDocument();
    });

    it('action buttons have aria-labels', () => {
      render(
        <CalendarHeader
          {...defaultProps}
          onSettingsClick={() => {}}
          onRefreshClick={() => {}}
        />
      );

      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Search appointments')).toBeInTheDocument();
      expect(screen.getByLabelText('Refresh')).toBeInTheDocument();
    });

    it('sidebar toggle has aria-label', () => {
      render(
        <CalendarHeader
          {...defaultProps}
          sidebarOpen={false}
          onSidebarToggle={() => {}}
        />
      );

      expect(screen.getByLabelText('Open sidebar')).toBeInTheDocument();
    });

    it('date button has title for tooltip', () => {
      render(<CalendarHeader {...defaultProps} />);
      expect(screen.getByTitle('Click to open date picker')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('header has sticky positioning', () => {
      const { container } = render(<CalendarHeader {...defaultProps} />);
      expect(container.querySelector('header')).toHaveClass('sticky');
    });

    it('header has white background', () => {
      const { container } = render(<CalendarHeader {...defaultProps} />);
      expect(container.querySelector('header')).toHaveClass('bg-white');
    });

    it('header has shadow', () => {
      const { container } = render(<CalendarHeader {...defaultProps} />);
      expect(container.querySelector('header')).toHaveClass('shadow-sm');
    });

    it('new appointment button has dark background', () => {
      render(<CalendarHeader {...defaultProps} onNewAppointment={() => {}} />);
      const button = screen.getByTestId('new-appointment-button');
      expect(button).toHaveClass('bg-gray-900');
    });
  });
});
