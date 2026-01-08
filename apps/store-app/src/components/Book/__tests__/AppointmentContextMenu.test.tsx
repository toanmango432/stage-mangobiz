/**
 * @file AppointmentContextMenu.test.tsx
 * @description Tests for AppointmentContextMenu - Right-click context menu for appointments
 *
 * Test coverage:
 * - Visibility toggle (appointment/position required)
 * - Client info header display
 * - Menu items based on appointment status (scheduled/checked-in/in-service/completed/cancelled)
 * - Click handlers for all actions
 * - Close behavior (click outside, Escape key)
 * - Optional handlers (copy, duplicate, rebook)
 * - Dividers and visual styling
 * - Keyboard shortcut hints
 * - Icons for each action
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AppointmentContextMenu } from '../AppointmentContextMenu';
import type { LocalAppointment } from '../../../types/appointment';

// Mock appointment factory
function createMockAppointment(overrides: Partial<LocalAppointment> = {}): LocalAppointment {
  return {
    id: 'appt-1',
    clientId: 'client-1',
    clientName: 'John Doe',
    clientPhone: '555-1234',
    staffId: 'staff-1',
    staffName: 'Jane Stylist',
    services: [{ serviceId: 'svc-1', serviceName: 'Haircut', duration: 30, price: 25 }],
    scheduledStartTime: new Date('2026-01-15T10:00:00').toISOString(),
    scheduledEndTime: new Date('2026-01-15T10:30:00').toISOString(),
    status: 'scheduled',
    source: 'walk-in',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced',
    ...overrides,
  } as LocalAppointment;
}

describe('AppointmentContextMenu', () => {
  const mockOnClose = vi.fn();
  const mockOnCheckIn = vi.fn();
  const mockOnStartService = vi.fn();
  const mockOnComplete = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnReschedule = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnNoShow = vi.fn();
  const mockOnCopy = vi.fn();
  const mockOnDuplicate = vi.fn();
  const mockOnRebook = vi.fn();

  const defaultProps = {
    appointment: createMockAppointment(),
    position: { x: 100, y: 200 },
    onClose: mockOnClose,
    onCheckIn: mockOnCheckIn,
    onStartService: mockOnStartService,
    onComplete: mockOnComplete,
    onEdit: mockOnEdit,
    onReschedule: mockOnReschedule,
    onCancel: mockOnCancel,
    onNoShow: mockOnNoShow,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Visibility', () => {
    it('renders when appointment and position are provided', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('does not render when appointment is null', () => {
      const { container } = render(
        <AppointmentContextMenu {...defaultProps} appointment={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('does not render when position is null', () => {
      const { container } = render(
        <AppointmentContextMenu {...defaultProps} position={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('does not render when both appointment and position are null', () => {
      const { container } = render(
        <AppointmentContextMenu {...defaultProps} appointment={null} position={null} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Positioning', () => {
    it('positions menu at specified coordinates', () => {
      const { container } = render(<AppointmentContextMenu {...defaultProps} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu.style.left).toBe('100px');
      expect(menu.style.top).toBe('200px');
    });

    it('updates position when props change', () => {
      const { rerender, container } = render(<AppointmentContextMenu {...defaultProps} />);

      rerender(<AppointmentContextMenu {...defaultProps} position={{ x: 300, y: 400 }} />);

      const menu = container.firstChild as HTMLElement;
      expect(menu.style.left).toBe('300px');
      expect(menu.style.top).toBe('400px');
    });
  });

  describe('Header Display', () => {
    it('shows client name', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('shows appointment time', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    });

    it('handles different client names', () => {
      const appointment = createMockAppointment({ clientName: 'Alice Smith' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    it('shows PM times correctly', () => {
      const appointment = createMockAppointment({
        scheduledStartTime: new Date('2026-01-15T14:30:00').toISOString(),
      });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    });
  });

  describe('Status: Scheduled', () => {
    it('shows Check In for scheduled appointments', () => {
      const appointment = createMockAppointment({ status: 'scheduled' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('Check In')).toBeInTheDocument();
    });

    it('shows Edit for scheduled appointments', () => {
      const appointment = createMockAppointment({ status: 'scheduled' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('shows Reschedule for scheduled appointments', () => {
      const appointment = createMockAppointment({ status: 'scheduled' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('Reschedule')).toBeInTheDocument();
    });

    it('shows No Show for scheduled appointments', () => {
      const appointment = createMockAppointment({ status: 'scheduled' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('No Show')).toBeInTheDocument();
    });

    it('shows Cancel for scheduled appointments', () => {
      const appointment = createMockAppointment({ status: 'scheduled' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('does not show Start Service for scheduled appointments', () => {
      const appointment = createMockAppointment({ status: 'scheduled' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.queryByText('Start Service')).not.toBeInTheDocument();
    });

    it('does not show Complete for scheduled appointments', () => {
      const appointment = createMockAppointment({ status: 'scheduled' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.queryByText('Complete')).not.toBeInTheDocument();
    });
  });

  describe('Status: Checked-In', () => {
    it('shows Start Service for checked-in appointments', () => {
      const appointment = createMockAppointment({ status: 'checked-in' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('Start Service')).toBeInTheDocument();
    });

    it('does not show Check In for checked-in appointments', () => {
      const appointment = createMockAppointment({ status: 'checked-in' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.queryByText('Check In')).not.toBeInTheDocument();
    });

    it('shows No Show for checked-in appointments', () => {
      const appointment = createMockAppointment({ status: 'checked-in' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('No Show')).toBeInTheDocument();
    });

    it('shows Edit for checked-in appointments', () => {
      const appointment = createMockAppointment({ status: 'checked-in' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  describe('Status: In-Service', () => {
    it('shows Complete for in-service appointments', () => {
      const appointment = createMockAppointment({ status: 'in-service' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('does not show Start Service for in-service appointments', () => {
      const appointment = createMockAppointment({ status: 'in-service' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.queryByText('Start Service')).not.toBeInTheDocument();
    });

    it('does not show Check In for in-service appointments', () => {
      const appointment = createMockAppointment({ status: 'in-service' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.queryByText('Check In')).not.toBeInTheDocument();
    });

    it('does not show No Show for in-service appointments', () => {
      const appointment = createMockAppointment({ status: 'in-service' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.queryByText('No Show')).not.toBeInTheDocument();
    });
  });

  describe('Status: Completed', () => {
    it('shows Edit for completed appointments', () => {
      const appointment = createMockAppointment({ status: 'completed' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('does not show Reschedule for completed appointments', () => {
      const appointment = createMockAppointment({ status: 'completed' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.queryByText('Reschedule')).not.toBeInTheDocument();
    });

    it('does not show Cancel for completed appointments', () => {
      const appointment = createMockAppointment({ status: 'completed' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('does not show No Show for completed appointments', () => {
      const appointment = createMockAppointment({ status: 'completed' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.queryByText('No Show')).not.toBeInTheDocument();
    });

    it('shows Rebook for completed appointments when handler provided', () => {
      const appointment = createMockAppointment({ status: 'completed' });
      render(
        <AppointmentContextMenu {...defaultProps} appointment={appointment} onRebook={mockOnRebook} />
      );
      expect(screen.getByText('Rebook')).toBeInTheDocument();
    });
  });

  describe('Status: Cancelled', () => {
    it('shows Edit for cancelled appointments', () => {
      const appointment = createMockAppointment({ status: 'cancelled' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('does not show Reschedule for cancelled appointments', () => {
      const appointment = createMockAppointment({ status: 'cancelled' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.queryByText('Reschedule')).not.toBeInTheDocument();
    });

    it('does not show Cancel for cancelled appointments', () => {
      const appointment = createMockAppointment({ status: 'cancelled' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('does not show Check In for cancelled appointments', () => {
      const appointment = createMockAppointment({ status: 'cancelled' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.queryByText('Check In')).not.toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    it('calls onCheckIn and closes menu when Check In clicked', () => {
      const appointment = createMockAppointment({ status: 'scheduled' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);

      fireEvent.click(screen.getByText('Check In'));

      expect(mockOnCheckIn).toHaveBeenCalledWith(appointment);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onStartService and closes menu when Start Service clicked', () => {
      const appointment = createMockAppointment({ status: 'checked-in' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);

      fireEvent.click(screen.getByText('Start Service'));

      expect(mockOnStartService).toHaveBeenCalledWith(appointment);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onComplete and closes menu when Complete clicked', () => {
      const appointment = createMockAppointment({ status: 'in-service' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);

      fireEvent.click(screen.getByText('Complete'));

      expect(mockOnComplete).toHaveBeenCalledWith(appointment);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onEdit and closes menu when Edit clicked', () => {
      render(<AppointmentContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByText('Edit'));

      expect(mockOnEdit).toHaveBeenCalledWith(defaultProps.appointment);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onReschedule and closes menu when Reschedule clicked', () => {
      render(<AppointmentContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByText('Reschedule'));

      expect(mockOnReschedule).toHaveBeenCalledWith(defaultProps.appointment);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onCancel and closes menu when Cancel clicked', () => {
      render(<AppointmentContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnCancel).toHaveBeenCalledWith(defaultProps.appointment);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onNoShow and closes menu when No Show clicked', () => {
      render(<AppointmentContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByText('No Show'));

      expect(mockOnNoShow).toHaveBeenCalledWith(defaultProps.appointment);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Optional Handlers', () => {
    it('shows Copy when onCopy provided', () => {
      render(<AppointmentContextMenu {...defaultProps} onCopy={mockOnCopy} />);
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('does not show Copy when onCopy not provided', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      expect(screen.queryByText('Copy')).not.toBeInTheDocument();
    });

    it('calls onCopy and closes menu when Copy clicked', () => {
      render(<AppointmentContextMenu {...defaultProps} onCopy={mockOnCopy} />);

      fireEvent.click(screen.getByText('Copy'));

      expect(mockOnCopy).toHaveBeenCalledWith(defaultProps.appointment);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows Duplicate when onDuplicate provided', () => {
      render(<AppointmentContextMenu {...defaultProps} onDuplicate={mockOnDuplicate} />);
      expect(screen.getByText('Duplicate')).toBeInTheDocument();
    });

    it('does not show Duplicate when onDuplicate not provided', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      expect(screen.queryByText('Duplicate')).not.toBeInTheDocument();
    });

    it('calls onDuplicate and closes menu when Duplicate clicked', () => {
      render(<AppointmentContextMenu {...defaultProps} onDuplicate={mockOnDuplicate} />);

      fireEvent.click(screen.getByText('Duplicate'));

      expect(mockOnDuplicate).toHaveBeenCalledWith(defaultProps.appointment);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows Rebook only for completed status with handler', () => {
      const completedAppt = createMockAppointment({ status: 'completed' });
      render(
        <AppointmentContextMenu {...defaultProps} appointment={completedAppt} onRebook={mockOnRebook} />
      );
      expect(screen.getByText('Rebook')).toBeInTheDocument();
    });

    it('does not show Rebook for non-completed status', () => {
      const scheduledAppt = createMockAppointment({ status: 'scheduled' });
      render(
        <AppointmentContextMenu {...defaultProps} appointment={scheduledAppt} onRebook={mockOnRebook} />
      );
      expect(screen.queryByText('Rebook')).not.toBeInTheDocument();
    });

    it('does not show Rebook when handler not provided', () => {
      const completedAppt = createMockAppointment({ status: 'completed' });
      render(<AppointmentContextMenu {...defaultProps} appointment={completedAppt} />);
      expect(screen.queryByText('Rebook')).not.toBeInTheDocument();
    });

    it('calls onRebook and closes menu when Rebook clicked', () => {
      const completedAppt = createMockAppointment({ status: 'completed' });
      render(
        <AppointmentContextMenu {...defaultProps} appointment={completedAppt} onRebook={mockOnRebook} />
      );

      fireEvent.click(screen.getByText('Rebook'));

      expect(mockOnRebook).toHaveBeenCalledWith(completedAppt);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Close Behavior', () => {
    it('closes menu on Escape key', () => {
      render(<AppointmentContextMenu {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes menu on click outside', () => {
      render(<AppointmentContextMenu {...defaultProps} />);

      fireEvent.mouseDown(document.body);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close on click inside menu', () => {
      render(<AppointmentContextMenu {...defaultProps} />);

      const clientName = screen.getByText('John Doe');
      fireEvent.mouseDown(clientName);

      // onClose should not be called for inside clicks
      // (but action buttons do call onClose after their action)
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(<AppointmentContextMenu {...defaultProps} />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('shows ⌘C shortcut for Copy', () => {
      render(<AppointmentContextMenu {...defaultProps} onCopy={mockOnCopy} />);
      expect(screen.getByText('⌘C')).toBeInTheDocument();
    });
  });

  describe('Dividers', () => {
    it('renders dividers between menu sections', () => {
      render(<AppointmentContextMenu {...defaultProps} onCopy={mockOnCopy} />);

      const dividers = document.querySelectorAll('.border-t.border-gray-200');
      // Header border + section dividers
      expect(dividers.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('has fixed positioning', () => {
      const { container } = render(<AppointmentContextMenu {...defaultProps} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu).toHaveClass('fixed');
    });

    it('has white background', () => {
      const { container } = render(<AppointmentContextMenu {...defaultProps} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu).toHaveClass('bg-white');
    });

    it('has shadow', () => {
      const { container } = render(<AppointmentContextMenu {...defaultProps} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu).toHaveClass('shadow-2xl');
    });

    it('has rounded corners', () => {
      const { container } = render(<AppointmentContextMenu {...defaultProps} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu).toHaveClass('rounded-lg');
    });

    it('has border', () => {
      const { container } = render(<AppointmentContextMenu {...defaultProps} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu).toHaveClass('border');
    });

    it('has high z-index', () => {
      const { container } = render(<AppointmentContextMenu {...defaultProps} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu).toHaveClass('z-[100]');
    });

    it('has minimum width', () => {
      const { container } = render(<AppointmentContextMenu {...defaultProps} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu).toHaveClass('min-w-[200px]');
    });

    it('has animation class', () => {
      const { container } = render(<AppointmentContextMenu {...defaultProps} />);
      const menu = container.firstChild as HTMLElement;
      expect(menu).toHaveClass('animate-scale-in');
    });
  });

  describe('Icons', () => {
    it('renders icons for menu items', () => {
      render(<AppointmentContextMenu {...defaultProps} />);

      // Check In has CheckCircle icon
      const checkInButton = screen.getByText('Check In').closest('button');
      expect(checkInButton?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders Edit icon', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      const editButton = screen.getByText('Edit').closest('button');
      expect(editButton?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders Calendar icon for Reschedule', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      const rescheduleButton = screen.getByText('Reschedule').closest('button');
      expect(rescheduleButton?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Action Colors', () => {
    it('Check In has brand color', () => {
      const appointment = createMockAppointment({ status: 'scheduled' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      const button = screen.getByText('Check In').closest('button');
      expect(button).toHaveClass('text-brand-600');
    });

    it('Start Service has green color', () => {
      const appointment = createMockAppointment({ status: 'checked-in' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      const button = screen.getByText('Start Service').closest('button');
      expect(button).toHaveClass('text-green-600');
    });

    it('Complete has blue color', () => {
      const appointment = createMockAppointment({ status: 'in-service' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      const button = screen.getByText('Complete').closest('button');
      expect(button).toHaveClass('text-blue-600');
    });

    it('Edit has gray color', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      const button = screen.getByText('Edit').closest('button');
      expect(button).toHaveClass('text-gray-700');
    });

    it('Reschedule has purple color', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      const button = screen.getByText('Reschedule').closest('button');
      expect(button).toHaveClass('text-purple-600');
    });

    it('No Show has orange color', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      const button = screen.getByText('No Show').closest('button');
      expect(button).toHaveClass('text-orange-600');
    });

    it('Cancel has red color', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      const button = screen.getByText('Cancel').closest('button');
      expect(button).toHaveClass('text-red-600');
    });
  });

  describe('Button Styling', () => {
    it('buttons have full width', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      const button = screen.getByText('Edit').closest('button');
      expect(button).toHaveClass('w-full');
    });

    it('buttons have left-aligned text', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      const button = screen.getByText('Edit').closest('button');
      expect(button).toHaveClass('text-left');
    });

    it('buttons have hover state', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      const button = screen.getByText('Edit').closest('button');
      expect(button).toHaveClass('hover:bg-gray-100');
    });

    it('buttons have transition', () => {
      render(<AppointmentContextMenu {...defaultProps} />);
      const button = screen.getByText('Edit').closest('button');
      expect(button).toHaveClass('transition-colors');
    });
  });

  describe('Edge Cases', () => {
    it('handles long client names (truncates)', () => {
      const appointment = createMockAppointment({
        clientName: 'Very Long Client Name That Should Be Truncated',
      });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      const nameElement = screen.getByText('Very Long Client Name That Should Be Truncated');
      expect(nameElement).toHaveClass('truncate');
    });

    it('handles midnight time', () => {
      const appointment = createMockAppointment({
        scheduledStartTime: new Date('2026-01-15T00:00:00').toISOString(),
      });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('12:00 AM')).toBeInTheDocument();
    });

    it('handles noon time', () => {
      const appointment = createMockAppointment({
        scheduledStartTime: new Date('2026-01-15T12:00:00').toISOString(),
      });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      expect(screen.getByText('12:00 PM')).toBeInTheDocument();
    });

    it('handles no-show status', () => {
      const appointment = createMockAppointment({ status: 'no-show' });
      render(<AppointmentContextMenu {...defaultProps} appointment={appointment} />);
      // Should show Edit but not Cancel/Reschedule
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  describe('All Optional Handlers', () => {
    it('renders all optional items when all handlers provided', () => {
      const completedAppt = createMockAppointment({ status: 'completed' });
      render(
        <AppointmentContextMenu
          {...defaultProps}
          appointment={completedAppt}
          onCopy={mockOnCopy}
          onDuplicate={mockOnDuplicate}
          onRebook={mockOnRebook}
        />
      );

      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByText('Duplicate')).toBeInTheDocument();
      expect(screen.getByText('Rebook')).toBeInTheDocument();
    });

    it('renders no optional items when handlers not provided', () => {
      render(<AppointmentContextMenu {...defaultProps} />);

      expect(screen.queryByText('Copy')).not.toBeInTheDocument();
      expect(screen.queryByText('Duplicate')).not.toBeInTheDocument();
      expect(screen.queryByText('Rebook')).not.toBeInTheDocument();
    });
  });
});
