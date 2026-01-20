/**
 * AppointmentCard Component Tests
 * Tests for calendar appointment card rendering and interactions
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppointmentCard } from '../AppointmentCard';
import type { LocalAppointment } from '../../../types/appointment';

// Helper to create a mock appointment
// Note: Uses 'confirmed' as any cast since AppointmentCard supports 'confirmed' via StatusBadge
// but it's not in the official AppointmentStatus type
function createMockAppointment(overrides: Partial<LocalAppointment> = {}): LocalAppointment {
  const baseTime = new Date('2026-01-08T10:00:00');
  const endTime = new Date('2026-01-08T11:00:00');

  return {
    id: 'appt-1',
    clientId: 'client-1',
    clientName: 'John Doe',
    clientPhone: '555-1234',
    clientEmail: 'john@example.com',
    scheduledStartTime: baseTime.toISOString(),
    scheduledEndTime: endTime.toISOString(),
    status: 'confirmed' as any, // Cast needed as 'confirmed' is not in AppointmentStatus but used by StatusBadge
    source: 'online',
    services: [
      { serviceId: 's1', serviceName: 'Haircut', name: 'Haircut', staffId: 'staff-1', staffName: 'Jane Stylist', price: 30, duration: 30 },
    ],
    staffId: 'staff-1',
    storeId: 'store-1',
    notes: '',
    syncStatus: 'synced',
    createdAt: baseTime.toISOString(),
    updatedAt: baseTime.toISOString(),
    ...overrides,
  } as LocalAppointment;
}

describe('AppointmentCard', () => {
  const defaultProps = {
    appointment: createMockAppointment(),
    top: 100,
    height: 88,
  };

  describe('basic rendering', () => {
    it('renders client name', () => {
      render(<AppointmentCard {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders client initials in avatar', () => {
      render(<AppointmentCard {...defaultProps} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders single name initials correctly', () => {
      const appointment = createMockAppointment({ clientName: 'Madonna' });
      render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('MA')).toBeInTheDocument();
    });

    it('renders bullet for missing client name', () => {
      const appointment = createMockAppointment({ clientName: '' });
      const { container } = render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      // Avatar should contain bullet
      const avatar = container.querySelector('.w-8.h-8.rounded-full');
      expect(avatar).toHaveTextContent('•');
    });

    it('renders status badge', () => {
      render(<AppointmentCard {...defaultProps} />);
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
    });

    it('renders time display', () => {
      const { container } = render(<AppointmentCard {...defaultProps} />);
      // Check that time display exists with AM/PM format
      const timeDisplay = container.querySelector('.text-\\[11px\\]');
      expect(timeDisplay?.textContent).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
    });

    it('renders duration display', () => {
      render(<AppointmentCard {...defaultProps} />);
      // 1 hour duration
      expect(screen.getByText('1h')).toBeInTheDocument();
    });

    it('renders client phone when provided', () => {
      render(<AppointmentCard {...defaultProps} />);
      expect(screen.getByText('555-1234')).toBeInTheDocument();
    });

    it('does not render phone separator when phone is missing', () => {
      const appointment = createMockAppointment({ clientPhone: undefined });
      const { container } = render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      // Should only have one separator (between time and duration)
      const separators = container.querySelectorAll('.text-gray-300');
      expect(separators.length).toBe(1);
    });
  });

  describe('positioning and sizing', () => {
    it('applies top position style', () => {
      const { container } = render(<AppointmentCard {...defaultProps} top={150} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.top).toBe('150px');
    });

    it('applies height style', () => {
      const { container } = render(<AppointmentCard {...defaultProps} height={120} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.height).toBe('120px');
    });
  });

  describe('source colors', () => {
    it('applies online source color', () => {
      const appointment = createMockAppointment({ source: 'online' });
      const { container } = render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.borderLeftColor).toBe('rgb(38, 198, 218)'); // #26C6DA
    });

    it('applies walk-in source color', () => {
      const appointment = createMockAppointment({ source: 'walk-in' });
      const { container } = render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.borderLeftColor).toBe('rgb(102, 187, 106)'); // #66BB6A
    });

    it('applies phone source color', () => {
      const appointment = createMockAppointment({ source: 'phone' });
      const { container } = render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.borderLeftColor).toBe('rgb(126, 87, 194)'); // #7E57C2
    });

    it('applies app source color', () => {
      const appointment = createMockAppointment({ source: 'client-app' });
      const { container } = render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.borderLeftColor).toBe('rgb(236, 72, 153)'); // #EC4899
    });

    it('applies default color for unknown source', () => {
      const appointment = createMockAppointment({ source: 'unknown' as any });
      const { container } = render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      const card = container.firstChild as HTMLElement;
      expect(card.style.borderLeftColor).toBe('rgb(20, 184, 166)'); // #14B8A6
    });
  });

  describe('services display', () => {
    it('renders single service', () => {
      render(<AppointmentCard {...defaultProps} />);
      expect(screen.getByText('Haircut')).toBeInTheDocument();
    });

    it('renders up to 3 services', () => {
      const appointment = createMockAppointment({
        services: [
          { serviceId: 's1', serviceName: 'Haircut', name: 'Haircut', staffId: 'staff-1', staffName: 'Jane Stylist', price: 30, duration: 30 },
          { serviceId: 's2', serviceName: 'Coloring', name: 'Coloring', staffId: 'staff-1', staffName: 'Jane Stylist', price: 80, duration: 60 },
          { serviceId: 's3', serviceName: 'Styling', name: 'Styling', staffId: 'staff-1', staffName: 'Jane Stylist', price: 40, duration: 30 },
        ],
      });
      render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('Coloring')).toBeInTheDocument();
      expect(screen.getByText('Styling')).toBeInTheDocument();
    });

    it('shows overflow indicator for more than 3 services', () => {
      const appointment = createMockAppointment({
        services: [
          { serviceId: 's1', serviceName: 'Haircut', name: 'Haircut', staffId: 'staff-1', staffName: 'Jane Stylist', price: 30, duration: 30 },
          { serviceId: 's2', serviceName: 'Coloring', name: 'Coloring', staffId: 'staff-1', staffName: 'Jane Stylist', price: 80, duration: 60 },
          { serviceId: 's3', serviceName: 'Styling', name: 'Styling', staffId: 'staff-1', staffName: 'Jane Stylist', price: 40, duration: 30 },
          { serviceId: 's4', serviceName: 'Treatment', name: 'Treatment', staffId: 'staff-1', staffName: 'Jane Stylist', price: 50, duration: 45 },
          { serviceId: 's5', serviceName: 'Wash', name: 'Wash', staffId: 'staff-1', staffName: 'Jane Stylist', price: 15, duration: 15 },
        ],
      });
      render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });
  });

  describe('status indicators', () => {
    it('shows confirmed badge check for confirmed status', () => {
      const { container } = render(<AppointmentCard {...defaultProps} />);
      // BadgeCheck icon should be present
      const icon = container.querySelector('.text-emerald-500');
      expect(icon).toBeInTheDocument();
    });

    it('does not show confirmed icon for pending status', () => {
      const appointment = createMockAppointment({ status: 'scheduled' as any }); // Using 'scheduled' since 'pending' is not a valid AppointmentStatus
      const { container } = render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      const icon = container.querySelector('.text-emerald-500');
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe('staff requested indicator', () => {
    it('shows REQ badge when staff is requested', () => {
      const appointment = createMockAppointment({
        services: [
          { serviceId: 's1', serviceName: 'Haircut', name: 'Haircut', staffId: 'staff-1', staffName: 'Jane Stylist', price: 30, duration: 30, staffRequested: true } as any,
        ],
      });
      render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('REQ')).toBeInTheDocument();
      expect(screen.getByTitle('Staff Requested')).toBeInTheDocument();
    });

    it('does not show REQ badge when staff is not requested', () => {
      render(<AppointmentCard {...defaultProps} />);
      expect(screen.queryByText('REQ')).not.toBeInTheDocument();
    });
  });

  describe('sync status indicators', () => {
    it('shows syncing indicator for pending sync', () => {
      const appointment = createMockAppointment({ syncStatus: 'pending' });
      render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('Syncing')).toBeInTheDocument();
    });

    it('shows sync error indicator', () => {
      const appointment = createMockAppointment({ syncStatus: 'error' });
      render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('Sync error')).toBeInTheDocument();
    });

    it('does not show sync indicator when synced', () => {
      render(<AppointmentCard {...defaultProps} />);
      expect(screen.queryByText('Syncing')).not.toBeInTheDocument();
      expect(screen.queryByText('Sync error')).not.toBeInTheDocument();
    });
  });

  describe('click handling', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      const { container } = render(
        <AppointmentCard {...defaultProps} onClick={handleClick} />
      );
      fireEvent.click(container.firstChild as HTMLElement);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not throw when onClick is not provided', () => {
      const { container } = render(<AppointmentCard {...defaultProps} />);
      expect(() => fireEvent.click(container.firstChild as HTMLElement)).not.toThrow();
    });
  });

  describe('drag and drop', () => {
    it('is draggable for confirmed appointments', () => {
      const { container } = render(<AppointmentCard {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('draggable', 'true');
    });

    it('is draggable for scheduled appointments', () => {
      const appointment = createMockAppointment({ status: 'scheduled' });
      const { container } = render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('draggable', 'true');
    });

    it('is not draggable for completed appointments', () => {
      const appointment = createMockAppointment({ status: 'completed' });
      const { container } = render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('draggable', 'false');
    });

    it('is not draggable for cancelled appointments', () => {
      const appointment = createMockAppointment({ status: 'cancelled' });
      const { container } = render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('draggable', 'false');
    });

    it('handles drag start event', () => {
      const { container } = render(<AppointmentCard {...defaultProps} />);
      const card = container.firstChild as HTMLElement;

      const dataTransfer = {
        effectAllowed: '',
        setData: vi.fn(),
        setDragImage: vi.fn(),
      };

      fireEvent.dragStart(card, { dataTransfer });

      expect(dataTransfer.effectAllowed).toBe('move');
      expect(dataTransfer.setData).toHaveBeenCalledWith('appointment-id', 'appt-1');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <AppointmentCard {...defaultProps} className="custom-card-class" />
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-card-class');
    });
  });

  describe('different statuses', () => {
    it.each([
      ['pending', 'Pending'],
      ['cancelled', 'Cancelled'],
      ['completed', 'Completed'],
      ['checked-in', 'Checked In'],
      ['no-show', 'No Show'],
    ])('renders %s status correctly', (status, expectedLabel) => {
      const appointment = createMockAppointment({ status: status as any });
      render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });

    it('renders confirmed status correctly', () => {
      // Confirmed already tested in basic rendering, but verify status badge class
      const appointment = createMockAppointment({ status: 'confirmed' as any });
      const { container } = render(<AppointmentCard {...defaultProps} appointment={appointment} />);
      const badge = container.querySelector('.status-confirmed');
      expect(badge).toBeInTheDocument();
    });
  });
});
