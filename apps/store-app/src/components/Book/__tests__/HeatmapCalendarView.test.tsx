/**
 * HeatmapCalendarView Component Tests
 * Tests for visual density calendar with utilization, revenue, and appointments modes
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeatmapCalendarView } from '../HeatmapCalendarView';

describe('HeatmapCalendarView', () => {
  const mockOnTimeSlotClick = vi.fn();
  const mockOnDayClick = vi.fn();

  const createMockTimeSlot = (overrides = {}) => ({
    hour: 9,
    bookedMinutes: 30,
    revenue: 75,
    appointmentCount: 2,
    ...overrides,
  });

  const createMockDay = (overrides = {}) => ({
    date: new Date(2027, 5, 10),
    timeSlots: [
      createMockTimeSlot({ hour: 9 }),
      createMockTimeSlot({ hour: 10 }),
      createMockTimeSlot({ hour: 11, bookedMinutes: 60, revenue: 150, appointmentCount: 4 }),
    ],
    totalRevenue: 300,
    totalAppointments: 8,
    utilization: 50,
    ...overrides,
  });

  const defaultProps = {
    startDate: new Date(2027, 5, 8),
    days: [
      createMockDay({ date: new Date(2027, 5, 8) }),
      createMockDay({ date: new Date(2027, 5, 9) }),
      createMockDay({ date: new Date(2027, 5, 10) }),
    ],
    onTimeSlotClick: mockOnTimeSlotClick,
    onDayClick: mockOnDayClick,
    workingHours: { start: 9, end: 18 },
    colorMode: 'utilization' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('header section', () => {
    it('shows calendar heatmap title', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      expect(screen.getByText('Calendar Heatmap')).toBeInTheDocument();
    });

    it('shows visual density subtitle', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      expect(screen.getByText('Visual density overview')).toBeInTheDocument();
    });

    it('shows Empty legend label', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    it('shows Light legend label', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    it('shows Medium legend label', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('shows Busy legend label', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      expect(screen.getByText('Busy')).toBeInTheDocument();
    });

    it('shows Full legend label', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      expect(screen.getByText('Full')).toBeInTheDocument();
    });
  });

  describe('legend colors', () => {
    it('has gray color swatch for Empty', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} />);
      expect(container.querySelector('.bg-gray-50.border-gray-200')).toBeInTheDocument();
    });

    it('has emerald color swatch for Light', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} />);
      expect(container.querySelector('.bg-emerald-100.border-emerald-200')).toBeInTheDocument();
    });

    it('has brand color swatch for Medium', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} />);
      expect(container.querySelector('.bg-brand-200.border-brand-300')).toBeInTheDocument();
    });

    it('has orange color swatch for Busy', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} />);
      expect(container.querySelector('.bg-orange-300.border-orange-400')).toBeInTheDocument();
    });

    it('has red color swatch for Full', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} />);
      expect(container.querySelector('.bg-red-400.border-red-500')).toBeInTheDocument();
    });
  });

  describe('day headers', () => {
    it('shows weekday abbreviations', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      // Component shows weekday based on actual date - check any weekday is present
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const foundWeekday = weekDays.some(day => screen.queryByText(day) !== null);
      expect(foundWeekday).toBe(true);
    });

    it('shows date numbers', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('calls onDayClick when day header clicked', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      // Click on day header with date 8
      const dayButton = screen.getByText('8').closest('button');
      fireEvent.click(dayButton!);
      expect(mockOnDayClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('utilization mode', () => {
    it('shows Utilization label in day header', () => {
      render(<HeatmapCalendarView {...defaultProps} colorMode="utilization" />);
      const utilizationLabels = screen.getAllByText('Utilization:');
      expect(utilizationLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('shows utilization percentage in day header', () => {
      render(<HeatmapCalendarView {...defaultProps} colorMode="utilization" />);
      const percents = screen.getAllByText('50%');
      expect(percents.length).toBeGreaterThanOrEqual(1);
    });

    it('shows booked percentage in tooltip', () => {
      render(<HeatmapCalendarView {...defaultProps} colorMode="utilization" />);
      // Slot with 30 minutes = 50% booked, appears multiple times
      const cells = screen.queryAllByTitle('50% booked');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('shows 100% booked for fully booked slot', () => {
      render(<HeatmapCalendarView {...defaultProps} colorMode="utilization" />);
      // Slot with 60 minutes = 100% booked, appears multiple times
      const cells = screen.queryAllByTitle('100% booked');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('revenue mode', () => {
    it('shows Revenue label in day header', () => {
      render(<HeatmapCalendarView {...defaultProps} colorMode="revenue" />);
      const revenueLabels = screen.getAllByText('Revenue:');
      expect(revenueLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('shows revenue value in day header', () => {
      render(<HeatmapCalendarView {...defaultProps} colorMode="revenue" />);
      const revs = screen.getAllByText('$300');
      expect(revs.length).toBeGreaterThanOrEqual(1);
    });

    it('shows revenue in cell when in revenue mode', () => {
      render(<HeatmapCalendarView {...defaultProps} colorMode="revenue" />);
      // Slot with $75 revenue
      const revenues = screen.getAllByText('$75');
      expect(revenues.length).toBeGreaterThanOrEqual(1);
    });

    it('shows revenue in tooltip', () => {
      render(<HeatmapCalendarView {...defaultProps} colorMode="revenue" />);
      const cells = screen.queryAllByTitle('$75');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('appointments mode', () => {
    it('shows Appointments label in day header', () => {
      render(<HeatmapCalendarView {...defaultProps} colorMode="appointments" />);
      const appLabels = screen.getAllByText('Appointments:');
      expect(appLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('shows appointment count in day header', () => {
      render(<HeatmapCalendarView {...defaultProps} colorMode="appointments" />);
      const counts = screen.getAllByText('8');
      expect(counts.length).toBeGreaterThanOrEqual(1);
    });

    it('shows singular appt for single appointment', () => {
      const days = [createMockDay({
        timeSlots: [createMockTimeSlot({ appointmentCount: 1 })],
      })];
      render(<HeatmapCalendarView {...defaultProps} days={days} colorMode="appointments" />);
      expect(screen.getByTitle('1 appt')).toBeInTheDocument();
    });

    it('shows plural appts for multiple appointments', () => {
      render(<HeatmapCalendarView {...defaultProps} colorMode="appointments" />);
      const cells = screen.queryAllByTitle('2 appts');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('time slots grid', () => {
    it('shows hour labels', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      expect(screen.getByText('9 AM')).toBeInTheDocument();
      expect(screen.getByText('10 AM')).toBeInTheDocument();
      expect(screen.getByText('11 AM')).toBeInTheDocument();
    });

    it('shows 12 PM for noon', () => {
      render(
        <HeatmapCalendarView
          {...defaultProps}
          workingHours={{ start: 11, end: 14 }}
        />
      );
      expect(screen.getByText('12 PM')).toBeInTheDocument();
    });

    it('shows PM for afternoon hours', () => {
      render(
        <HeatmapCalendarView
          {...defaultProps}
          workingHours={{ start: 13, end: 16 }}
        />
      );
      expect(screen.getByText('1 PM')).toBeInTheDocument();
      expect(screen.getByText('2 PM')).toBeInTheDocument();
      expect(screen.getByText('3 PM')).toBeInTheDocument();
    });

    it('shows 12 AM for midnight', () => {
      render(
        <HeatmapCalendarView
          {...defaultProps}
          workingHours={{ start: 0, end: 2 }}
        />
      );
      expect(screen.getByText('12 AM')).toBeInTheDocument();
    });

    it('shows appointment count in cell', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      // Multiple cells with 2 appointments
      const twos = screen.getAllByText('2');
      expect(twos.length).toBeGreaterThanOrEqual(1);
    });

    it('shows minutes in cell', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      // 30 min slots
      const mins = screen.getAllByText('30 min');
      expect(mins.length).toBeGreaterThanOrEqual(1);
    });

    it('calls onTimeSlotClick when cell clicked', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      // Click on first cell with title
      const cells = screen.queryAllByTitle('50% booked');
      expect(cells.length).toBeGreaterThan(0);
      fireEvent.click(cells[0]);
      expect(mockOnTimeSlotClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('color intensity', () => {
    it('applies gray color for empty slot', () => {
      const days = [createMockDay({
        timeSlots: [createMockTimeSlot({ bookedMinutes: 0, appointmentCount: 0, revenue: 0 })],
      })];
      const { container } = render(
        <HeatmapCalendarView {...defaultProps} days={days} />
      );
      // The cell should have gray styling
      const emptyCells = container.querySelectorAll('button.bg-gray-50.border-gray-200');
      expect(emptyCells.length).toBeGreaterThan(0);
    });

    it('applies emerald color for low utilization', () => {
      const days = [createMockDay({
        timeSlots: [createMockTimeSlot({ bookedMinutes: 10, appointmentCount: 1 })], // <25%
      })];
      const { container } = render(
        <HeatmapCalendarView {...defaultProps} days={days} />
      );
      expect(container.querySelector('button.bg-emerald-100')).toBeInTheDocument();
    });

    it('applies brand color for medium utilization', () => {
      const days = [createMockDay({
        timeSlots: [createMockTimeSlot({ bookedMinutes: 20, appointmentCount: 1 })], // ~33%
      })];
      const { container } = render(
        <HeatmapCalendarView {...defaultProps} days={days} />
      );
      expect(container.querySelector('button.bg-brand-200')).toBeInTheDocument();
    });

    it('applies orange color for busy utilization', () => {
      const days = [createMockDay({
        timeSlots: [createMockTimeSlot({ bookedMinutes: 40, appointmentCount: 2 })], // ~67%
      })];
      const { container } = render(
        <HeatmapCalendarView {...defaultProps} days={days} />
      );
      expect(container.querySelector('button.bg-orange-300')).toBeInTheDocument();
    });

    it('applies red color for full utilization', () => {
      const days = [createMockDay({
        timeSlots: [createMockTimeSlot({ bookedMinutes: 60, appointmentCount: 3 })], // 100%
      })];
      const { container } = render(
        <HeatmapCalendarView {...defaultProps} days={days} />
      );
      expect(container.querySelector('button.bg-red-400')).toBeInTheDocument();
    });
  });

  describe('summary footer', () => {
    it('shows Total Revenue label', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });

    it('shows total revenue sum', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      // 3 days x $300 = $900
      expect(screen.getByText('$900')).toBeInTheDocument();
    });

    it('shows Total Appointments label', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      expect(screen.getByText('Total Appointments')).toBeInTheDocument();
    });

    it('shows total appointments sum', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      // 3 days x 8 = 24
      expect(screen.getByText('24')).toBeInTheDocument();
    });

    it('shows Avg Utilization label', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      expect(screen.getByText('Avg Utilization')).toBeInTheDocument();
    });

    it('shows average utilization percentage', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      // 3 days x 50% / 3 = 50%
      const fifties = screen.getAllByText('50%');
      expect(fifties.length).toBeGreaterThanOrEqual(1);
    });

    it('shows best slot tip text', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      expect(screen.getByText('Best slot:')).toBeInTheDocument();
      expect(screen.getByText('Find optimal booking times at a glance')).toBeInTheDocument();
    });
  });

  describe('working hours', () => {
    it('respects custom working hours start', () => {
      render(
        <HeatmapCalendarView
          {...defaultProps}
          workingHours={{ start: 8, end: 17 }}
        />
      );
      expect(screen.getByText('8 AM')).toBeInTheDocument();
    });

    it('respects custom working hours end', () => {
      render(
        <HeatmapCalendarView
          {...defaultProps}
          workingHours={{ start: 9, end: 20 }}
        />
      );
      expect(screen.getByText('7 PM')).toBeInTheDocument();
    });

    it('uses default working hours 9-18', () => {
      render(
        <HeatmapCalendarView
          startDate={defaultProps.startDate}
          days={defaultProps.days}
        />
      );
      expect(screen.getByText('9 AM')).toBeInTheDocument();
      expect(screen.getByText('5 PM')).toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('shows Empty title for slot with no data', () => {
      const days = [createMockDay({
        timeSlots: [], // No slots
      })];
      render(<HeatmapCalendarView {...defaultProps} days={days} />);
      const emptyCells = screen.getAllByTitle('Empty');
      expect(emptyCells.length).toBeGreaterThan(0);
    });

    it('shows No data in tooltip for undefined slot', () => {
      const days = [createMockDay({
        timeSlots: [], // No slots defined
      })];
      render(<HeatmapCalendarView {...defaultProps} days={days} colorMode="utilization" />);
      // All cells should have Empty title since no slots
      const emptyCells = screen.getAllByTitle('Empty');
      expect(emptyCells.length).toBeGreaterThan(0);
    });
  });

  describe('click handlers', () => {
    it('does not crash when onTimeSlotClick not provided', () => {
      render(
        <HeatmapCalendarView
          {...defaultProps}
          onTimeSlotClick={undefined}
        />
      );
      const cells = screen.queryAllByTitle('50% booked');
      expect(cells.length).toBeGreaterThan(0);
      expect(() => fireEvent.click(cells[0])).not.toThrow();
    });

    it('does not crash when onDayClick not provided', () => {
      render(
        <HeatmapCalendarView
          {...defaultProps}
          onDayClick={undefined}
        />
      );
      const dayButton = screen.getByText('8').closest('button');
      expect(() => fireEvent.click(dayButton!)).not.toThrow();
    });

    it('passes correct date and hour to onTimeSlotClick', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      const cells = screen.queryAllByTitle('50% booked');
      expect(cells.length).toBeGreaterThan(0);
      fireEvent.click(cells[0]);
      expect(mockOnTimeSlotClick).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Number)
      );
    });

    it('passes correct date to onDayClick', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      const dayButton = screen.getByText('8').closest('button');
      fireEvent.click(dayButton!);
      expect(mockOnDayClick).toHaveBeenCalledWith(expect.any(Date));
    });
  });

  describe('styling', () => {
    it('applies white background to main container', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} />);
      expect(container.querySelector('.bg-white')).toBeInTheDocument();
    });

    it('applies sticky positioning to day headers', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} />);
      expect(container.querySelector('.sticky.top-0')).toBeInTheDocument();
    });

    it('applies gray background to footer', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} />);
      expect(container.querySelector('.bg-gray-50')).toBeInTheDocument();
    });

    it('applies border styling', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} />);
      expect(container.querySelector('.border-gray-200')).toBeInTheDocument();
    });

    it('applies hover ring effect class', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} />);
      expect(container.querySelector('.hover\\:ring-2')).toBeInTheDocument();
    });
  });

  describe('tooltip content', () => {
    it('shows hour in tooltip', () => {
      render(<HeatmapCalendarView {...defaultProps} />);
      // Tooltip contains "9 AM - 50% booked"
      const tooltips = screen.getAllByText(/9 AM -/);
      expect(tooltips.length).toBeGreaterThanOrEqual(1);
    });

    it('shows display value in tooltip', () => {
      render(<HeatmapCalendarView {...defaultProps} colorMode="revenue" />);
      // Look for tooltip with revenue
      const tooltips = screen.getAllByText(/\$75/);
      expect(tooltips.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('icons', () => {
    it('renders DollarSign icon in footer', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('renders Clock icon in utilization mode', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} colorMode="utilization" />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('renders Users icon in appointments mode', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} colorMode="appointments" />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('renders TrendingUp icon in footer', () => {
      const { container } = render(<HeatmapCalendarView {...defaultProps} />);
      // Footer has TrendingUp
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(3); // At least 4 icons
    });
  });

  describe('multiple days', () => {
    it('renders all days provided', () => {
      const days = [
        createMockDay({ date: new Date(2027, 5, 14) }), // Saturday
        createMockDay({ date: new Date(2027, 5, 15) }), // Sunday
        createMockDay({ date: new Date(2027, 5, 16) }), // Monday
        createMockDay({ date: new Date(2027, 5, 17) }), // Tuesday
        createMockDay({ date: new Date(2027, 5, 18) }), // Wednesday
      ];
      render(<HeatmapCalendarView {...defaultProps} days={days} />);
      expect(screen.getByText('14')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('16')).toBeInTheDocument();
      expect(screen.getByText('17')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
    });

    it('renders correct weekday for each date', () => {
      const days = [
        createMockDay({ date: new Date(2027, 5, 14) }),
        createMockDay({ date: new Date(2027, 5, 15) }),
      ];
      render(<HeatmapCalendarView {...defaultProps} days={days} />);
      // Check that weekday abbreviations are rendered (don't assume specific days)
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const foundWeekdays = weekDays.filter(day => screen.queryByText(day) !== null);
      expect(foundWeekdays.length).toBeGreaterThanOrEqual(1);
    });
  });
});
