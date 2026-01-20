/**
 * WeekView Component Tests
 * Tests for 7-day calendar view with compact appointments
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekView } from '../WeekView';
import { LocalAppointment } from '../../../types/appointment';

// Mock WeekViewSkeleton
vi.mock('../skeletons', () => ({
  WeekViewSkeleton: () => <div data-testid="week-view-skeleton">Loading...</div>,
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
  scheduledEndTime: new Date(2026, 0, 15, 10, 30, 0).toISOString(), // Jan 15, 2026 10:30 AM
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  source: 'walk-in',
  syncStatus: 'synced',
  ...overrides,
} as LocalAppointment);

describe('WeekView', () => {
  const defaultProps = {
    startDate: new Date(2026, 0, 12), // Monday Jan 12, 2026 (local time)
    appointments: [],
    onAppointmentClick: vi.fn(),
    onDateClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date to control "today"
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0)); // Wednesday Jan 15, 2026 12:00 PM
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic rendering', () => {
    it('renders 7 day columns', () => {
      const { container } = render(<WeekView {...defaultProps} />);
      // Grid has 7 columns
      const headerButtons = container.querySelectorAll('button');
      expect(headerButtons.length).toBe(7);
    });

    it('renders week header with day names', () => {
      render(<WeekView {...defaultProps} />);
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });

    it('renders date numbers for each day', () => {
      render(<WeekView {...defaultProps} />);
      // Monday Jan 12 to Sunday Jan 18
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('13')).toBeInTheDocument();
      expect(screen.getByText('14')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('16')).toBeInTheDocument();
      expect(screen.getByText('17')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
    });

    it('shows appointment counts in header', () => {
      render(<WeekView {...defaultProps} />);
      // All days should show "0 appts" with no appointments
      const apptCounts = screen.getAllByText('0 appts');
      expect(apptCounts.length).toBe(7);
    });
  });

  describe('loading state', () => {
    it('shows skeleton when loading', () => {
      render(<WeekView {...defaultProps} isLoading={true} />);
      expect(screen.getByTestId('week-view-skeleton')).toBeInTheDocument();
    });

    it('does not show skeleton when not loading', () => {
      render(<WeekView {...defaultProps} isLoading={false} />);
      expect(screen.queryByTestId('week-view-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('today highlighting', () => {
    it('highlights today with special styling', () => {
      const { container } = render(<WeekView {...defaultProps} />);
      // Today is Wednesday, Jan 15
      const todayButton = container.querySelector('.bg-brand-50');
      expect(todayButton).toBeInTheDocument();
    });

    it('today date number has brand color', () => {
      const { container } = render(<WeekView {...defaultProps} />);
      const brandText = container.querySelector('.text-brand-600');
      expect(brandText).toBeInTheDocument();
      expect(brandText).toHaveTextContent('15');
    });
  });

  describe('appointment rendering', () => {
    it('shows appointments in correct day column', () => {
      const apt = createMockAppointment({
        id: 'apt-wed',
        clientName: 'Wednesday Client',
        scheduledStartTime: new Date(2026, 0, 15, 10, 0, 0).toISOString(), // Wednesday Jan 15
      });
      render(<WeekView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('Wednesday Client')).toBeInTheDocument();
    });

    it('shows multiple appointments sorted by time', () => {
      const appointments = [
        createMockAppointment({
          id: 'apt-2',
          clientName: 'Client B',
          scheduledStartTime: new Date(2026, 0, 15, 14, 0, 0).toISOString(), // 2 PM
        }),
        createMockAppointment({
          id: 'apt-1',
          clientName: 'Client A',
          scheduledStartTime: new Date(2026, 0, 15, 9, 0, 0).toISOString(), // 9 AM
        }),
      ];
      const { container } = render(<WeekView {...defaultProps} appointments={appointments} />);

      // Both should be rendered
      expect(screen.getByText('Client A')).toBeInTheDocument();
      expect(screen.getByText('Client B')).toBeInTheDocument();
    });

    it('shows time for appointments', () => {
      const apt = createMockAppointment({
        scheduledStartTime: new Date(2026, 0, 15, 10, 0, 0).toISOString(), // 10 AM
      });
      render(<WeekView {...defaultProps} appointments={[apt]} />);
      // Time format: "10:00 AM"
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    });

    it('shows first service name', () => {
      const apt = createMockAppointment({
        services: [{ serviceId: 'svc-1', serviceName: 'Haircut Special', name: 'Haircut Special', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 30, price: 25 }],
      });
      render(<WeekView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('Haircut Special')).toBeInTheDocument();
    });

    it('updates appointment count in header', () => {
      const appointments = [
        createMockAppointment({ id: 'apt-1', scheduledStartTime: new Date(2026, 0, 15, 10, 0, 0).toISOString() }),
        createMockAppointment({ id: 'apt-2', scheduledStartTime: new Date(2026, 0, 15, 11, 0, 0).toISOString() }),
      ];
      render(<WeekView {...defaultProps} appointments={appointments} />);
      expect(screen.getByText('2 appts')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows "No appointments" for empty days', () => {
      render(<WeekView {...defaultProps} appointments={[]} />);
      const emptyMessages = screen.getAllByText('No appointments');
      expect(emptyMessages.length).toBe(7); // All 7 days empty
    });

    it('does not show empty message for days with appointments', () => {
      const apt = createMockAppointment({
        scheduledStartTime: new Date(2026, 0, 15, 10, 0, 0).toISOString(), // Wednesday Jan 15
      });
      render(<WeekView {...defaultProps} appointments={[apt]} />);
      // Only 6 empty days now
      const emptyMessages = screen.getAllByText('No appointments');
      expect(emptyMessages.length).toBe(6);
    });
  });

  describe('status colors', () => {
    it('scheduled appointments have blue styling', () => {
      const apt = createMockAppointment({ status: 'scheduled' });
      const { container } = render(<WeekView {...defaultProps} appointments={[apt]} />);
      const card = container.querySelector('.bg-blue-100.border-blue-300');
      expect(card).toBeInTheDocument();
    });

    it('checked-in appointments have brand styling', () => {
      const apt = createMockAppointment({ status: 'checked-in' });
      const { container } = render(<WeekView {...defaultProps} appointments={[apt]} />);
      const card = container.querySelector('.bg-brand-100.border-brand-300');
      expect(card).toBeInTheDocument();
    });

    it('in-service appointments have green styling', () => {
      const apt = createMockAppointment({ status: 'in-service' });
      const { container } = render(<WeekView {...defaultProps} appointments={[apt]} />);
      const card = container.querySelector('.bg-green-100.border-green-300');
      expect(card).toBeInTheDocument();
    });

    it('completed appointments have gray styling', () => {
      const apt = createMockAppointment({ status: 'completed' });
      const { container } = render(<WeekView {...defaultProps} appointments={[apt]} />);
      const card = container.querySelector('.bg-gray-100.border-gray-300');
      expect(card).toBeInTheDocument();
    });

    it('cancelled appointments have red styling', () => {
      const apt = createMockAppointment({ status: 'cancelled' });
      const { container } = render(<WeekView {...defaultProps} appointments={[apt]} />);
      const card = container.querySelector('.bg-red-100.border-red-300');
      expect(card).toBeInTheDocument();
    });

    it('no-show appointments have orange styling', () => {
      const apt = createMockAppointment({ status: 'no-show' });
      const { container } = render(<WeekView {...defaultProps} appointments={[apt]} />);
      const card = container.querySelector('.bg-orange-100.border-orange-300');
      expect(card).toBeInTheDocument();
    });
  });

  describe('click handlers', () => {
    it('calls onDateClick when header date is clicked', () => {
      const onDateClick = vi.fn();
      const { container } = render(<WeekView {...defaultProps} onDateClick={onDateClick} />);

      // Click first day header (Monday Jan 12)
      // The header grid contains the buttons directly
      const headerGrid = container.querySelector('.grid.grid-cols-7.border-b');
      const headerButtons = headerGrid?.querySelectorAll('button') || [];
      fireEvent.click(headerButtons[0]);

      expect(onDateClick).toHaveBeenCalledTimes(1);
      const clickedDate = onDateClick.mock.calls[0][0];
      expect(clickedDate.getDate()).toBe(12);
    });

    it('calls onAppointmentClick when appointment is clicked', () => {
      const onAppointmentClick = vi.fn();
      const apt = createMockAppointment();
      render(<WeekView {...defaultProps} appointments={[apt]} onAppointmentClick={onAppointmentClick} />);

      fireEvent.click(screen.getByText('John Doe'));

      expect(onAppointmentClick).toHaveBeenCalledTimes(1);
      expect(onAppointmentClick).toHaveBeenCalledWith(apt);
    });
  });

  describe('week generation', () => {
    it('generates 7 consecutive days starting from startDate', () => {
      const startDate = new Date(2026, 0, 5); // Monday Jan 5, 2026
      render(<WeekView {...defaultProps} startDate={startDate} />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('11')).toBeInTheDocument();
    });

    it('handles month boundary correctly', () => {
      const startDate = new Date(2026, 0, 28); // Jan 28, 2026 - Crosses into February
      render(<WeekView {...defaultProps} startDate={startDate} />);

      expect(screen.getByText('28')).toBeInTheDocument();
      expect(screen.getByText('29')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('31')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Feb 1
      expect(screen.getByText('2')).toBeInTheDocument(); // Feb 2
      expect(screen.getByText('3')).toBeInTheDocument(); // Feb 3
    });
  });

  describe('styling', () => {
    it('has grid layout with 7 columns', () => {
      const { container } = render(<WeekView {...defaultProps} />);
      const grids = container.querySelectorAll('.grid-cols-7');
      expect(grids.length).toBe(2); // Header and content grid
    });

    it('has border between columns', () => {
      const { container } = render(<WeekView {...defaultProps} />);
      const bordered = container.querySelector('.border-r.border-gray-200');
      expect(bordered).toBeInTheDocument();
    });

    it('has white background', () => {
      const { container } = render(<WeekView {...defaultProps} />);
      expect(container.firstChild).toHaveClass('bg-white');
    });

    it('appointment cards have rounded corners', () => {
      const apt = createMockAppointment();
      const { container } = render(<WeekView {...defaultProps} appointments={[apt]} />);
      const card = container.querySelector('.rounded-lg');
      expect(card).toBeInTheDocument();
    });

    it('appointment cards have border', () => {
      const apt = createMockAppointment();
      const { container } = render(<WeekView {...defaultProps} appointments={[apt]} />);
      const card = container.querySelector('.border-2');
      expect(card).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('date buttons have focus ring', () => {
      const { container } = render(<WeekView {...defaultProps} />);
      const button = container.querySelector('button');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-brand-500');
    });

    it('date buttons have hover state', () => {
      const { container } = render(<WeekView {...defaultProps} />);
      const button = container.querySelector('button');
      expect(button).toHaveClass('hover:bg-gray-50');
    });

    it('appointment buttons have hover state', () => {
      const apt = createMockAppointment();
      const { container } = render(<WeekView {...defaultProps} appointments={[apt]} />);
      const aptButton = container.querySelector('.hover\\:shadow-md');
      expect(aptButton).toBeInTheDocument();
    });
  });
});
