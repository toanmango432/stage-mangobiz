/**
 * AgendaView Component Tests
 * Tests for list-format appointment view with date grouping
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgendaView } from '../AgendaView';
import { LocalAppointment } from '../../../types/appointment';

// Create mock appointment
const createMockAppointment = (overrides?: Partial<LocalAppointment>): LocalAppointment => ({
  id: 'apt-1',
  clientId: 'client-1',
  clientName: 'John Doe',
  clientPhone: '555-123-4567',
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

describe('AgendaView', () => {
  const defaultProps = {
    appointments: [],
    onAppointmentClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0)); // Wed Jan 15, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('empty state', () => {
    it('shows empty state when no appointments', () => {
      render(<AgendaView {...defaultProps} appointments={[]} />);
      expect(screen.getByText('No appointments')).toBeInTheDocument();
    });

    it('shows empty state description', () => {
      render(<AgendaView {...defaultProps} appointments={[]} />);
      expect(screen.getByText('Create your first appointment to get started')).toBeInTheDocument();
    });

    it('shows clock icon in empty state', () => {
      const { container } = render(<AgendaView {...defaultProps} appointments={[]} />);
      const clockIcon = container.querySelector('svg.lucide-clock');
      expect(clockIcon).toBeInTheDocument();
    });

    it('centers empty state', () => {
      const { container } = render(<AgendaView {...defaultProps} appointments={[]} />);
      const emptyContainer = container.querySelector('.flex.items-center.justify-center.h-full');
      expect(emptyContainer).toBeInTheDocument();
    });
  });

  describe('appointment rendering', () => {
    it('renders appointment client name', () => {
      const apt = createMockAppointment();
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders appointment start time', () => {
      const apt = createMockAppointment({
        scheduledStartTime: new Date(2026, 0, 15, 10, 0, 0).toISOString(),
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    });

    it('renders appointment end time', () => {
      const apt = createMockAppointment({
        scheduledEndTime: new Date(2026, 0, 15, 10, 30, 0).toISOString(),
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('10:30 AM')).toBeInTheDocument();
    });

    it('renders PM times correctly', () => {
      const apt = createMockAppointment({
        scheduledStartTime: new Date(2026, 0, 15, 14, 30, 0).toISOString(),
        scheduledEndTime: new Date(2026, 0, 15, 15, 0, 0).toISOString(),
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    });

    it('renders client phone', () => {
      const apt = createMockAppointment({ clientPhone: '555-987-6543' });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('555-987-6543')).toBeInTheDocument();
    });

    it('renders phone icon', () => {
      const apt = createMockAppointment({ clientPhone: '555-123-4567' });
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const phoneIcon = container.querySelector('svg.lucide-phone');
      expect(phoneIcon).toBeInTheDocument();
    });

    it('does not render phone icon when no phone', () => {
      const apt = createMockAppointment({ clientPhone: undefined });
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const phoneIcon = container.querySelector('svg.lucide-phone');
      expect(phoneIcon).not.toBeInTheDocument();
    });

    it('renders staff name', () => {
      const apt = createMockAppointment({ staffName: 'Sarah Barber' });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('Sarah Barber')).toBeInTheDocument();
    });

    it('renders user icon for staff', () => {
      const apt = createMockAppointment({ staffName: 'Jane Stylist' });
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const userIcon = container.querySelector('svg.lucide-user');
      expect(userIcon).toBeInTheDocument();
    });

    it('does not render staff section when no staff', () => {
      const apt = createMockAppointment({ staffName: undefined });
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const userIcon = container.querySelector('svg.lucide-user');
      expect(userIcon).not.toBeInTheDocument();
    });
  });

  describe('service rendering', () => {
    it('renders service name', () => {
      const apt = createMockAppointment({
        services: [{ serviceId: 'svc-1', serviceName: 'Color Treatment', name: 'Color Treatment', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 60, price: 80 }],
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('Color Treatment')).toBeInTheDocument();
    });

    it('renders service duration', () => {
      const apt = createMockAppointment({
        services: [{ serviceId: 'svc-1', serviceName: 'Haircut', name: 'Haircut', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 45, price: 30 }],
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('(45 min)')).toBeInTheDocument();
    });

    it('renders multiple services', () => {
      const apt = createMockAppointment({
        services: [
          { serviceId: 'svc-1', serviceName: 'Haircut', name: 'Haircut', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 30, price: 25 },
          { serviceId: 'svc-2', serviceName: 'Color', name: 'Color', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 60, price: 80 },
        ],
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('Color')).toBeInTheDocument();
    });

    it('shows only first 3 services', () => {
      const apt = createMockAppointment({
        services: [
          { serviceId: 'svc-1', serviceName: 'Service A', name: 'Service A', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 30, price: 25 },
          { serviceId: 'svc-2', serviceName: 'Service B', name: 'Service B', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 30, price: 25 },
          { serviceId: 'svc-3', serviceName: 'Service C', name: 'Service C', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 30, price: 25 },
          { serviceId: 'svc-4', serviceName: 'Service D', name: 'Service D', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 30, price: 25 },
        ],
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);

      expect(screen.getByText('Service A')).toBeInTheDocument();
      expect(screen.getByText('Service B')).toBeInTheDocument();
      expect(screen.getByText('Service C')).toBeInTheDocument();
      expect(screen.queryByText('Service D')).not.toBeInTheDocument();
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('shows correct "+X more" count', () => {
      const apt = createMockAppointment({
        services: [
          { serviceId: 'svc-1', serviceName: 'Service A', name: 'Service A', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 30, price: 25 },
          { serviceId: 'svc-2', serviceName: 'Service B', name: 'Service B', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 30, price: 25 },
          { serviceId: 'svc-3', serviceName: 'Service C', name: 'Service C', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 30, price: 25 },
          { serviceId: 'svc-4', serviceName: 'Service D', name: 'Service D', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 30, price: 25 },
          { serviceId: 'svc-5', serviceName: 'Service E', name: 'Service E', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 30, price: 25 },
        ],
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('does not render service section when no services', () => {
      const apt = createMockAppointment({ services: [] });
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const serviceBadges = container.querySelectorAll('.bg-gray-100.rounded');
      expect(serviceBadges.length).toBe(0);
    });
  });

  describe('status badges', () => {
    it('shows scheduled status', () => {
      const apt = createMockAppointment({ status: 'scheduled' });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
    });

    it('shows checked-in status', () => {
      const apt = createMockAppointment({ status: 'checked-in' });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('Checked In')).toBeInTheDocument();
    });

    it('shows in-service status', () => {
      const apt = createMockAppointment({ status: 'in-service' });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('In Service')).toBeInTheDocument();
    });

    it('shows completed status', () => {
      const apt = createMockAppointment({ status: 'completed' });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('shows cancelled status', () => {
      const apt = createMockAppointment({ status: 'cancelled' });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('shows no-show status', () => {
      const apt = createMockAppointment({ status: 'no-show' });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('No Show')).toBeInTheDocument();
    });
  });

  describe('status colors', () => {
    it('scheduled has blue styling', () => {
      const apt = createMockAppointment({ status: 'scheduled' });
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const badge = container.querySelector('.bg-blue-100.text-blue-900');
      expect(badge).toBeInTheDocument();
    });

    it('checked-in has brand styling', () => {
      const apt = createMockAppointment({ status: 'checked-in' });
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const badge = container.querySelector('.bg-brand-100.text-brand-900');
      expect(badge).toBeInTheDocument();
    });

    it('in-service has green styling', () => {
      const apt = createMockAppointment({ status: 'in-service' });
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const badge = container.querySelector('.bg-green-100.text-green-900');
      expect(badge).toBeInTheDocument();
    });

    it('completed has gray styling', () => {
      const apt = createMockAppointment({ status: 'completed' });
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const badge = container.querySelector('.bg-gray-100.text-gray-600');
      expect(badge).toBeInTheDocument();
    });

    it('cancelled has red styling', () => {
      const apt = createMockAppointment({ status: 'cancelled' });
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const badge = container.querySelector('.bg-red-100.text-red-600');
      expect(badge).toBeInTheDocument();
    });

    it('no-show has orange styling', () => {
      const apt = createMockAppointment({ status: 'no-show' });
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const badge = container.querySelector('.bg-orange-100.text-orange-600');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('date grouping', () => {
    it('shows "Today" for today\'s appointments', () => {
      const apt = createMockAppointment({
        scheduledStartTime: new Date(2026, 0, 15, 10, 0, 0).toISOString(), // Today
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('shows "Tomorrow" for tomorrow\'s appointments', () => {
      const apt = createMockAppointment({
        scheduledStartTime: new Date(2026, 0, 16, 10, 0, 0).toISOString(), // Tomorrow
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    });

    it('shows full date for other dates', () => {
      const apt = createMockAppointment({
        scheduledStartTime: new Date(2026, 0, 20, 10, 0, 0).toISOString(), // Tuesday Jan 20
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('Tuesday, January 20')).toBeInTheDocument();
    });

    it('shows year for dates in different year', () => {
      const apt = createMockAppointment({
        scheduledStartTime: new Date(2027, 5, 15, 10, 0, 0).toISOString(), // June 15, 2027 (Tuesday)
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('Tuesday, June 15, 2027')).toBeInTheDocument();
    });

    it('shows appointment count for each date', () => {
      const apt = createMockAppointment();
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('1 appointment')).toBeInTheDocument();
    });

    it('shows plural "appointments" for multiple', () => {
      const appointments = [
        createMockAppointment({ id: 'apt-1' }),
        createMockAppointment({ id: 'apt-2' }),
      ];
      render(<AgendaView {...defaultProps} appointments={appointments} />);
      expect(screen.getByText('2 appointments')).toBeInTheDocument();
    });

    it('groups multiple dates correctly', () => {
      const appointments = [
        createMockAppointment({ id: 'apt-1', scheduledStartTime: new Date(2026, 0, 15, 10, 0, 0).toISOString() }),
        createMockAppointment({ id: 'apt-2', scheduledStartTime: new Date(2026, 0, 16, 10, 0, 0).toISOString() }),
      ];
      render(<AgendaView {...defaultProps} appointments={appointments} />);

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    });
  });

  describe('click handlers', () => {
    it('calls onAppointmentClick when appointment clicked', () => {
      const onAppointmentClick = vi.fn();
      const apt = createMockAppointment();
      render(<AgendaView {...defaultProps} appointments={[apt]} onAppointmentClick={onAppointmentClick} />);

      fireEvent.click(screen.getByText('John Doe'));

      expect(onAppointmentClick).toHaveBeenCalledTimes(1);
      expect(onAppointmentClick).toHaveBeenCalledWith(apt);
    });

    it('each appointment row is clickable', () => {
      const onAppointmentClick = vi.fn();
      const appointments = [
        createMockAppointment({ id: 'apt-1', clientName: 'Client A' }),
        createMockAppointment({ id: 'apt-2', clientName: 'Client B' }),
      ];
      render(<AgendaView {...defaultProps} appointments={appointments} onAppointmentClick={onAppointmentClick} />);

      fireEvent.click(screen.getByText('Client A'));
      fireEvent.click(screen.getByText('Client B'));

      expect(onAppointmentClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('sorting', () => {
    it('sorts appointments by time within same day', () => {
      const appointments = [
        createMockAppointment({ id: 'apt-2', clientName: 'Later', scheduledStartTime: new Date(2026, 0, 15, 14, 0, 0).toISOString() }),
        createMockAppointment({ id: 'apt-1', clientName: 'Earlier', scheduledStartTime: new Date(2026, 0, 15, 10, 0, 0).toISOString() }),
      ];
      const { container } = render(<AgendaView {...defaultProps} appointments={appointments} />);

      const buttons = container.querySelectorAll('button.w-full');
      const names = Array.from(buttons).map(btn => btn.textContent);

      // Earlier should appear before Later
      const earlierIndex = names.findIndex(t => t?.includes('Earlier'));
      const laterIndex = names.findIndex(t => t?.includes('Later'));
      expect(earlierIndex).toBeLessThan(laterIndex);
    });

    it('sorts appointments by date', () => {
      const appointments = [
        createMockAppointment({ id: 'apt-2', clientName: 'Day 2', scheduledStartTime: new Date(2026, 0, 16, 10, 0, 0).toISOString() }),
        createMockAppointment({ id: 'apt-1', clientName: 'Day 1', scheduledStartTime: new Date(2026, 0, 15, 10, 0, 0).toISOString() }),
      ];
      const { container } = render(<AgendaView {...defaultProps} appointments={appointments} />);

      // Check Today appears before Tomorrow
      const text = container.textContent || '';
      const todayIndex = text.indexOf('Today');
      const tomorrowIndex = text.indexOf('Tomorrow');
      expect(todayIndex).toBeLessThan(tomorrowIndex);
    });
  });

  describe('styling', () => {
    it('has scrollable container', () => {
      const apt = createMockAppointment();
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(container.querySelector('.overflow-y-auto')).toBeInTheDocument();
    });

    it('has white background', () => {
      const apt = createMockAppointment();
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(container.querySelector('.bg-white')).toBeInTheDocument();
    });

    it('date header is sticky', () => {
      const apt = createMockAppointment();
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(container.querySelector('.sticky.top-0')).toBeInTheDocument();
    });

    it('appointment row has hover state', () => {
      const apt = createMockAppointment();
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(container.querySelector('.hover\\:bg-gray-50')).toBeInTheDocument();
    });

    it('appointment row has focus state', () => {
      const apt = createMockAppointment();
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(container.querySelector('.focus\\:bg-brand-50')).toBeInTheDocument();
    });

    it('appointment row has bottom border', () => {
      const apt = createMockAppointment();
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(container.querySelector('.border-b.border-gray-100')).toBeInTheDocument();
    });

    it('status badge is rounded-full', () => {
      const apt = createMockAppointment();
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('formats midnight correctly', () => {
      const apt = createMockAppointment({
        scheduledStartTime: new Date(2026, 0, 15, 0, 0, 0).toISOString(),
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('12:00 AM')).toBeInTheDocument();
    });

    it('formats noon correctly', () => {
      const apt = createMockAppointment({
        scheduledStartTime: new Date(2026, 0, 15, 12, 0, 0).toISOString(),
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('12:00 PM')).toBeInTheDocument();
    });

    it('formats minutes with leading zero', () => {
      const apt = createMockAppointment({
        scheduledStartTime: new Date(2026, 0, 15, 9, 5, 0).toISOString(),
      });
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      expect(screen.getByText('9:05 AM')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('appointment rows are buttons', () => {
      const apt = createMockAppointment();
      render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('client name is a heading', () => {
      const apt = createMockAppointment();
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const clientHeading = container.querySelector('h4');
      expect(clientHeading).toHaveTextContent('John Doe');
    });

    it('date header is a heading', () => {
      const apt = createMockAppointment();
      const { container } = render(<AgendaView {...defaultProps} appointments={[apt]} />);
      const dateHeading = container.querySelector('h3');
      expect(dateHeading).toHaveTextContent('Today');
    });
  });
});
