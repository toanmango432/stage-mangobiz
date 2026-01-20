/**
 * MonthView Component Tests
 * Tests for monthly calendar grid with appointment dots/badges
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthView } from '../MonthView';
import { LocalAppointment } from '../../../types/appointment';

// Mock MonthViewSkeleton
vi.mock('../skeletons', () => ({
  MonthViewSkeleton: () => <div data-testid="month-view-skeleton">Loading...</div>,
}));

// Create mock appointment
const createMockAppointment = (overrides?: Partial<LocalAppointment>): LocalAppointment => ({
  id: 'apt-1',
  clientId: 'client-1',
  clientName: 'John Doe',
  staffId: 'staff-1',
  staffName: 'Jane Stylist',
  services: [{ serviceId: 'svc-1', serviceName: 'Haircut', name: 'Haircut', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 30, price: 25 }],
  status: 'scheduled',
  scheduledStartTime: new Date(2026, 0, 15, 10, 0, 0).toISOString(), // Jan 15, 2026 10:00 AM
  scheduledEndTime: new Date(2026, 0, 15, 10, 30, 0).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  source: 'walk-in',
  syncStatus: 'synced',
  ...overrides,
} as LocalAppointment);

describe('MonthView', () => {
  const defaultProps = {
    date: new Date(2026, 0, 15), // January 2026
    appointments: [],
    onAppointmentClick: vi.fn(),
    onDateClick: vi.fn(),
    onMonthChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0)); // Wed Jan 15, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic rendering', () => {
    it('renders month name', () => {
      render(<MonthView {...defaultProps} />);
      expect(screen.getByText('January 2026')).toBeInTheDocument();
    });

    it('renders previous month button', () => {
      render(<MonthView {...defaultProps} />);
      expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
    });

    it('renders next month button', () => {
      render(<MonthView {...defaultProps} />);
      expect(screen.getByLabelText('Next month')).toBeInTheDocument();
    });

    it('renders week day headers', () => {
      render(<MonthView {...defaultProps} />);
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('renders all days in month', () => {
      render(<MonthView {...defaultProps} />);
      // January 2026 has 31 days - multiple '31' may appear (Dec 31 + Jan 31)
      const ones = screen.getAllByText('1');
      expect(ones.length).toBeGreaterThan(0);
      const thirtyOnes = screen.getAllByText('31');
      expect(thirtyOnes.length).toBeGreaterThan(0);
    });
  });

  describe('loading state', () => {
    it('shows skeleton when loading', () => {
      render(<MonthView {...defaultProps} isLoading={true} />);
      expect(screen.getByTestId('month-view-skeleton')).toBeInTheDocument();
    });

    it('does not show skeleton when not loading', () => {
      render(<MonthView {...defaultProps} isLoading={false} />);
      expect(screen.queryByTestId('month-view-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('month navigation', () => {
    it('calls onMonthChange with previous month when prev clicked', () => {
      const onMonthChange = vi.fn();
      render(<MonthView {...defaultProps} onMonthChange={onMonthChange} />);

      fireEvent.click(screen.getByLabelText('Previous month'));

      expect(onMonthChange).toHaveBeenCalledTimes(1);
      const newDate = onMonthChange.mock.calls[0][0];
      expect(newDate.getMonth()).toBe(11); // December
      expect(newDate.getFullYear()).toBe(2025);
    });

    it('calls onMonthChange with next month when next clicked', () => {
      const onMonthChange = vi.fn();
      render(<MonthView {...defaultProps} onMonthChange={onMonthChange} />);

      fireEvent.click(screen.getByLabelText('Next month'));

      expect(onMonthChange).toHaveBeenCalledTimes(1);
      const newDate = onMonthChange.mock.calls[0][0];
      expect(newDate.getMonth()).toBe(1); // February
      expect(newDate.getFullYear()).toBe(2026);
    });

    it('does not crash when onMonthChange is not provided', () => {
      render(<MonthView {...defaultProps} onMonthChange={undefined} />);

      expect(() => {
        fireEvent.click(screen.getByLabelText('Previous month'));
        fireEvent.click(screen.getByLabelText('Next month'));
      }).not.toThrow();
    });
  });

  describe('today highlighting', () => {
    it('highlights today with brand background', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      const todayCell = container.querySelector('.bg-brand-50');
      expect(todayCell).toBeInTheDocument();
    });

    it('today date has brand color text', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      const todayNumber = container.querySelector('.text-brand-600.font-bold');
      expect(todayNumber).toBeInTheDocument();
      expect(todayNumber).toHaveTextContent('15');
    });
  });

  describe('current month vs other months', () => {
    it('shows days from adjacent months with lighter color', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      // December 28-31 would be shown at start of January 2026 grid
      // These should have text-gray-300 class
      const adjacentDays = container.querySelectorAll('.text-gray-300');
      expect(adjacentDays.length).toBeGreaterThan(0);
    });

    it('adjacent month days have gray background', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      const adjacentCells = container.querySelectorAll('button.bg-gray-50');
      expect(adjacentCells.length).toBeGreaterThan(0);
    });
  });

  describe('appointment rendering', () => {
    it('shows appointment client name', () => {
      const apt = createMockAppointment();
      render(<MonthView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('shows appointment time', () => {
      const apt = createMockAppointment({
        scheduledStartTime: new Date(2026, 0, 15, 10, 0, 0).toISOString(),
      });
      render(<MonthView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    });

    it('shows multiple appointments on same day', () => {
      const appointments = [
        createMockAppointment({ id: 'apt-1', clientName: 'Client A' }),
        createMockAppointment({ id: 'apt-2', clientName: 'Client B' }),
      ];
      render(<MonthView {...defaultProps} appointments={appointments} />);

      expect(screen.getByText('Client A')).toBeInTheDocument();
      expect(screen.getByText('Client B')).toBeInTheDocument();
    });

    it('shows only first 3 appointments then "+X more"', () => {
      const appointments = [
        createMockAppointment({ id: 'apt-1', clientName: 'Client A' }),
        createMockAppointment({ id: 'apt-2', clientName: 'Client B' }),
        createMockAppointment({ id: 'apt-3', clientName: 'Client C' }),
        createMockAppointment({ id: 'apt-4', clientName: 'Client D' }),
        createMockAppointment({ id: 'apt-5', clientName: 'Client E' }),
      ];
      render(<MonthView {...defaultProps} appointments={appointments} />);

      // First 3 visible
      expect(screen.getByText('Client A')).toBeInTheDocument();
      expect(screen.getByText('Client B')).toBeInTheDocument();
      expect(screen.getByText('Client C')).toBeInTheDocument();

      // 4th and 5th not visible as text, but "+2 more" shown
      expect(screen.queryByText('Client D')).not.toBeInTheDocument();
      expect(screen.queryByText('Client E')).not.toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('shows count badge on days with appointments', () => {
      const apt = createMockAppointment();
      const { container } = render(<MonthView {...defaultProps} appointments={[apt]} />);

      // Count badge is absolute positioned with bg-brand-500
      const badge = container.querySelector('.bg-brand-500.text-white');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('1');
    });

    it('shows correct count in badge for multiple appointments', () => {
      const appointments = [
        createMockAppointment({ id: 'apt-1' }),
        createMockAppointment({ id: 'apt-2' }),
        createMockAppointment({ id: 'apt-3' }),
      ];
      const { container } = render(<MonthView {...defaultProps} appointments={appointments} />);

      const badge = container.querySelector('.bg-brand-500.text-white');
      expect(badge).toHaveTextContent('3');
    });
  });

  describe('status colors', () => {
    it('scheduled appointments have blue background', () => {
      const apt = createMockAppointment({ status: 'scheduled' });
      const { container } = render(<MonthView {...defaultProps} appointments={[apt]} />);
      const aptButton = container.querySelector('.bg-blue-500');
      expect(aptButton).toBeInTheDocument();
    });

    it('checked-in appointments have brand background', () => {
      const apt = createMockAppointment({ status: 'checked-in' });
      const { container } = render(<MonthView {...defaultProps} appointments={[apt]} />);
      const aptButton = container.querySelector('button.bg-brand-500');
      expect(aptButton).toBeInTheDocument();
    });

    it('in-service appointments have green background', () => {
      const apt = createMockAppointment({ status: 'in-service' });
      const { container } = render(<MonthView {...defaultProps} appointments={[apt]} />);
      const aptButton = container.querySelector('.bg-green-500');
      expect(aptButton).toBeInTheDocument();
    });

    it('completed appointments have gray background', () => {
      const apt = createMockAppointment({ status: 'completed' });
      const { container } = render(<MonthView {...defaultProps} appointments={[apt]} />);
      const aptButton = container.querySelector('.bg-gray-400');
      expect(aptButton).toBeInTheDocument();
    });

    it('cancelled appointments have red background', () => {
      const apt = createMockAppointment({ status: 'cancelled' });
      const { container } = render(<MonthView {...defaultProps} appointments={[apt]} />);
      const aptButton = container.querySelector('.bg-red-500');
      expect(aptButton).toBeInTheDocument();
    });

    it('no-show appointments have orange background', () => {
      const apt = createMockAppointment({ status: 'no-show' });
      const { container } = render(<MonthView {...defaultProps} appointments={[apt]} />);
      const aptButton = container.querySelector('.bg-orange-500');
      expect(aptButton).toBeInTheDocument();
    });
  });

  describe('click handlers', () => {
    it('calls onDateClick when day cell is clicked', () => {
      const onDateClick = vi.fn();
      render(<MonthView {...defaultProps} onDateClick={onDateClick} />);

      // Click on day 15 (find button containing "15" text)
      const dayButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('15') && !btn.textContent?.includes('Previous') && !btn.textContent?.includes('Next')
      );
      // First matching button that's a day cell
      const dayCellButton = dayButtons.find(btn => btn.classList.contains('min-h-[80px]'));
      if (dayCellButton) {
        fireEvent.click(dayCellButton);
      }

      expect(onDateClick).toHaveBeenCalledTimes(1);
      const clickedDate = onDateClick.mock.calls[0][0];
      expect(clickedDate.getDate()).toBe(15);
    });

    it('calls onAppointmentClick when appointment is clicked', () => {
      const onAppointmentClick = vi.fn();
      const apt = createMockAppointment();
      render(<MonthView {...defaultProps} appointments={[apt]} onAppointmentClick={onAppointmentClick} />);

      fireEvent.click(screen.getByText('John Doe'));

      expect(onAppointmentClick).toHaveBeenCalledTimes(1);
      expect(onAppointmentClick).toHaveBeenCalledWith(apt);
    });

    it('appointment click does not trigger day click', () => {
      const onDateClick = vi.fn();
      const onAppointmentClick = vi.fn();
      const apt = createMockAppointment();
      render(
        <MonthView
          {...defaultProps}
          appointments={[apt]}
          onDateClick={onDateClick}
          onAppointmentClick={onAppointmentClick}
        />
      );

      fireEvent.click(screen.getByText('John Doe'));

      expect(onAppointmentClick).toHaveBeenCalledTimes(1);
      expect(onDateClick).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('has white background', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      expect(container.firstChild).toHaveClass('bg-white');
    });

    it('has flex column layout', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      expect(container.firstChild).toHaveClass('flex', 'flex-col');
    });

    it('day header grid has 7 columns', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      const headerGrid = container.querySelector('.grid.grid-cols-7.border-b');
      expect(headerGrid).toBeInTheDocument();
    });

    it('week rows have 7 columns', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      const weekRows = container.querySelectorAll('.grid.grid-cols-7');
      expect(weekRows.length).toBeGreaterThan(1);
    });

    it('day cells have minimum height', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      const dayCell = container.querySelector('.min-h-\\[80px\\]');
      expect(dayCell).toBeInTheDocument();
    });

    it('day cells have hover state', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      const dayCell = container.querySelector('.hover\\:bg-gray-50');
      expect(dayCell).toBeInTheDocument();
    });
  });

  describe('different months', () => {
    it('displays February correctly', () => {
      render(<MonthView {...defaultProps} date={new Date(2026, 1, 15)} />);
      expect(screen.getByText('February 2026')).toBeInTheDocument();
    });

    it('displays December correctly', () => {
      render(<MonthView {...defaultProps} date={new Date(2026, 11, 15)} />);
      expect(screen.getByText('December 2026')).toBeInTheDocument();
    });

    it('displays different year correctly', () => {
      render(<MonthView {...defaultProps} date={new Date(2027, 5, 15)} />);
      expect(screen.getByText('June 2027')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('nav buttons have aria-labels', () => {
      render(<MonthView {...defaultProps} />);
      expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
      expect(screen.getByLabelText('Next month')).toBeInTheDocument();
    });

    it('day cells have focus ring', () => {
      const { container } = render(<MonthView {...defaultProps} />);
      const dayCell = container.querySelector('.focus\\:ring-2.focus\\:ring-inset.focus\\:ring-brand-500');
      expect(dayCell).toBeInTheDocument();
    });

    it('appointment buttons have title with full info', () => {
      const apt = createMockAppointment({
        clientName: 'Test Client',
        scheduledStartTime: new Date(2026, 0, 15, 14, 30, 0).toISOString(),
      });
      render(<MonthView {...defaultProps} appointments={[apt]} />);

      const aptButton = screen.getByText('Test Client').closest('button');
      expect(aptButton).toHaveAttribute('title', expect.stringContaining('Test Client'));
      expect(aptButton).toHaveAttribute('title', expect.stringContaining('2:30 PM'));
    });

    it('appointment buttons have active state', () => {
      const apt = createMockAppointment();
      const { container } = render(<MonthView {...defaultProps} appointments={[apt]} />);
      const aptButton = container.querySelector('.active\\:scale-95');
      expect(aptButton).toBeInTheDocument();
    });
  });
});
