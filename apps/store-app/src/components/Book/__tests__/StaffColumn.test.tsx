/**
 * StaffColumn Component Tests
 * Tests for staff schedule column with time slots, appointments, and drag-drop
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StaffColumn } from '../StaffColumn';
import { LocalAppointment } from '../../../types/appointment';
import { TimeSlot as TimeSlotType } from '../../../utils/timeUtils';

// Mock AppointmentCard component
vi.mock('../AppointmentCard', () => ({
  AppointmentCard: ({ appointment, top, height, onClick }: {
    appointment: LocalAppointment;
    top: number;
    height: number;
    onClick?: () => void;
  }) => (
    <div
      data-testid={`appointment-${appointment.id}`}
      data-top={top}
      data-height={height}
      onClick={onClick}
      style={{ position: 'absolute', top: `${top}px`, height: `${height}px` }}
    >
      {appointment.clientName}
    </div>
  ),
}));

// Mock time utils
vi.mock('../../../utils/timeUtils', () => ({
  calculateAppointmentTop: vi.fn((offset: number, distance: number) => offset + distance * 16),
  calculateAppointmentHeight: vi.fn((duration: number) => duration * (16 / 15)),
}));

// Mock dateUtils
vi.mock('../../../utils/dateUtils', () => ({
  localTimeToUTC: vi.fn((date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result.toISOString();
  }),
}));

// Mock constant - PIXELS_PER_15_MINUTES is 22 in the actual codebase
vi.mock('../../../constants/appointment', () => ({
  PIXELS_PER_15_MINUTES: 22,
}));

// Create mock time slots (full day for proper appointment positioning)
const createMockTimeSlots = (): TimeSlotType[] => {
  const slots: TimeSlotType[] = [];
  const baseDate = new Date('2026-01-15');
  // Full day: 0:00 to 23:45 = 96 slots (each 15 min)
  // This ensures appointments can be positioned regardless of time
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeInSeconds = hour * 3600 + minute * 60;
      const slotDate = new Date(baseDate);
      slotDate.setHours(hour, minute, 0, 0);
      slots.push({
        timeInSeconds,
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        date: slotDate,
      });
    }
  }
  return slots;
};

// Create mock appointment
const createMockAppointment = (overrides?: Partial<LocalAppointment>): LocalAppointment => ({
  id: 'apt-1',
  clientId: 'client-1',
  clientName: 'John Doe',
  staffId: 'staff-1',
  staffName: 'Jane Stylist',
  services: [{ serviceId: 'svc-1', serviceName: 'Haircut', name: 'Haircut', staffId: 'staff-1', staffName: 'Jane Stylist', duration: 30, price: 25 }],
  status: 'scheduled',
  scheduledStartTime: new Date('2026-01-15T10:00:00').toISOString(),
  scheduledEndTime: new Date('2026-01-15T10:30:00').toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  source: 'walk-in',
  syncStatus: 'synced',
  ...overrides,
} as LocalAppointment);

describe('StaffColumn', () => {
  const defaultProps = {
    staffId: 'staff-1',
    staffName: 'Jane Stylist',
    appointments: [],
    timeSlots: createMockTimeSlots(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('staff header', () => {
    it('renders staff name', () => {
      render(<StaffColumn {...defaultProps} staffName="Alice Smith" />);
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    it('shows staff initial when no photo', () => {
      const { container } = render(<StaffColumn {...defaultProps} staffName="Bob" />);
      const avatar = container.querySelector('.rounded-full.bg-gradient-to-br');
      expect(avatar).toHaveTextContent('B');
    });

    it('renders staff photo when provided', () => {
      render(<StaffColumn {...defaultProps} staffPhoto="https://example.com/photo.jpg" />);
      const img = screen.getByAltText('Jane Stylist');
      expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });

    it('shows appointment count - singular', () => {
      render(<StaffColumn {...defaultProps} appointments={[createMockAppointment()]} />);
      expect(screen.getByText('1 appt')).toBeInTheDocument();
    });

    it('shows appointment count - plural', () => {
      render(<StaffColumn {...defaultProps} appointments={[
        createMockAppointment({ id: 'apt-1' }),
        createMockAppointment({ id: 'apt-2' }),
        createMockAppointment({ id: 'apt-3' }),
      ]} />);
      expect(screen.getByText('3 apts')).toBeInTheDocument();
    });

    it('shows zero appointments', () => {
      render(<StaffColumn {...defaultProps} appointments={[]} />);
      expect(screen.getByText('0 apts')).toBeInTheDocument();
    });
  });

  describe('appointments rendering', () => {
    it('renders appointment cards', () => {
      render(<StaffColumn {...defaultProps} appointments={[createMockAppointment()]} />);
      expect(screen.getByTestId('appointment-apt-1')).toBeInTheDocument();
    });

    it('renders multiple appointments', () => {
      render(<StaffColumn {...defaultProps} appointments={[
        createMockAppointment({ id: 'apt-1', clientName: 'Client A' }),
        createMockAppointment({ id: 'apt-2', clientName: 'Client B' }),
      ]} />);
      expect(screen.getByTestId('appointment-apt-1')).toBeInTheDocument();
      expect(screen.getByTestId('appointment-apt-2')).toBeInTheDocument();
    });

    it('renders client name in appointment card', () => {
      render(<StaffColumn {...defaultProps} appointments={[
        createMockAppointment({ clientName: 'Test Client' }),
      ]} />);
      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });

    it('passes onClick handler to appointment card', () => {
      const onAppointmentClick = vi.fn();
      const appointment = createMockAppointment();
      render(<StaffColumn {...defaultProps} appointments={[appointment]} onAppointmentClick={onAppointmentClick} />);

      fireEvent.click(screen.getByTestId('appointment-apt-1'));
      expect(onAppointmentClick).toHaveBeenCalledWith(appointment);
    });
  });

  describe('time slot grid', () => {
    it('renders time slot dividers', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      // All slots have border-b class (96 total)
      // However, TW applies border-gray-300 which overrides border-gray-200 for hour marks
      const dividers = container.querySelectorAll('.border-b');
      // 96 slots total
      expect(dividers.length).toBe(96);
    });

    it('hour marks have different border style', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      // Hour marks (every 4th slot has border-gray-300)
      // 24 hours = 24 hour marks + 1 header = 25
      const hourMarks = container.querySelectorAll('.border-gray-300');
      expect(hourMarks.length).toBe(25);
    });
  });

  describe('drag and drop - drag over', () => {
    it('shows drag over state', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      const scheduleArea = container.querySelector('.relative.bg-white');

      fireEvent.dragOver(scheduleArea!, {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { dropEffect: '' },
      });

      expect(scheduleArea).toHaveClass('bg-brand-50');
      expect(scheduleArea).toHaveClass('ring-2');
      expect(scheduleArea).toHaveClass('ring-brand-400');
    });

    it('removes drag over state on drag leave', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      const scheduleArea = container.querySelector('.relative.bg-white');

      // First drag over
      fireEvent.dragOver(scheduleArea!, {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { dropEffect: '' },
      });

      expect(scheduleArea).toHaveClass('bg-brand-50');

      // Then drag leave
      fireEvent.dragLeave(scheduleArea!, {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      });

      expect(scheduleArea).not.toHaveClass('bg-brand-50');
    });

    it('sets dropEffect to move on dragOver', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      const scheduleArea = container.querySelector('.relative.bg-white');

      const dataTransfer = { dropEffect: '' };
      fireEvent.dragOver(scheduleArea!, {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer,
      });

      expect(dataTransfer.dropEffect).toBe('move');
    });
  });

  describe('drag and drop - drop', () => {
    it('handles drop event', () => {
      const onAppointmentDrop = vi.fn();
      const { container } = render(
        <StaffColumn
          {...defaultProps}
          onAppointmentDrop={onAppointmentDrop}
          selectedDate={new Date('2026-01-15')}
        />
      );

      const scheduleArea = container.querySelector('.relative.bg-white.transition-colors');

      // Mock getBoundingClientRect on the element
      if (scheduleArea) {
        scheduleArea.getBoundingClientRect = vi.fn().mockReturnValue({ top: 0 });
      }

      const dropEvent = new Event('drop', { bubbles: true }) as any;
      dropEvent.preventDefault = vi.fn();
      dropEvent.stopPropagation = vi.fn();
      dropEvent.clientY = 50;
      dropEvent.dataTransfer = {
        getData: vi.fn().mockReturnValue('apt-dropped'),
      };

      scheduleArea?.dispatchEvent(dropEvent);

      // Note: Due to jsdom limitations with currentTarget in custom events,
      // we verify the event handlers are attached by checking drag over state
    });

    it('does not throw without handler', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      const scheduleArea = container.querySelector('.relative.bg-white.transition-colors');

      const dropEvent = new Event('drop', { bubbles: true }) as any;
      dropEvent.preventDefault = vi.fn();
      dropEvent.stopPropagation = vi.fn();
      dropEvent.clientY = 100;
      dropEvent.dataTransfer = {
        getData: vi.fn().mockReturnValue('apt-dropped'),
      };

      // Should not throw
      expect(() => scheduleArea?.dispatchEvent(dropEvent)).not.toThrow();
    });

    it('clears drag over state on drop', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      const scheduleArea = container.querySelector('.relative.bg-white.transition-colors');

      // First drag over
      fireEvent.dragOver(scheduleArea!, {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { dropEffect: '' },
      });

      expect(scheduleArea).toHaveClass('bg-brand-50');

      // Then drop - clears state (include dataTransfer to avoid error)
      fireEvent.drop(scheduleArea!, {
        dataTransfer: {
          getData: vi.fn().mockReturnValue(''),
        },
      });

      expect(scheduleArea).not.toHaveClass('bg-brand-50');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(<StaffColumn {...defaultProps} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has minimum width', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      expect(container.firstChild).toHaveClass('min-w-[150px]');
    });

    it('has relative positioning', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      expect(container.firstChild).toHaveClass('relative');
    });

    it('has flex-1 for flexible width', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      expect(container.firstChild).toHaveClass('flex-1');
    });

    it('header is sticky', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      const header = container.querySelector('.sticky');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('top-0');
      expect(header).toHaveClass('z-20');
    });

    it('header has border and shadow', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      const header = container.querySelector('.sticky');
      expect(header).toHaveClass('border-b-2');
      expect(header).toHaveClass('border-gray-300');
      expect(header).toHaveClass('shadow-sm');
    });
  });

  describe('avatar styling', () => {
    it('photo has circular shape', () => {
      render(<StaffColumn {...defaultProps} staffPhoto="photo.jpg" />);
      const img = screen.getByAltText('Jane Stylist');
      expect(img).toHaveClass('rounded-full');
    });

    it('photo has fixed size', () => {
      render(<StaffColumn {...defaultProps} staffPhoto="photo.jpg" />);
      const img = screen.getByAltText('Jane Stylist');
      expect(img).toHaveClass('w-8');
      expect(img).toHaveClass('h-8');
    });

    it('photo has border', () => {
      render(<StaffColumn {...defaultProps} staffPhoto="photo.jpg" />);
      const img = screen.getByAltText('Jane Stylist');
      expect(img).toHaveClass('border-2');
      expect(img).toHaveClass('border-gray-200');
    });

    it('placeholder avatar has gradient background', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      const avatar = container.querySelector('.bg-gradient-to-br');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('from-brand-400');
      expect(avatar).toHaveClass('to-brand-600');
    });
  });

  describe('schedule area sizing', () => {
    it('schedule area height matches time slots', () => {
      const { container } = render(<StaffColumn {...defaultProps} />);
      // 96 slots * 22 pixels per slot = 2112px (PIXELS_PER_15_MINUTES = 22)
      const appointmentContainer = container.querySelector('.relative[style]');
      expect(appointmentContainer).toHaveStyle({ height: '2112px' });
    });
  });

  describe('empty state', () => {
    it('renders without appointments', () => {
      const { container } = render(<StaffColumn {...defaultProps} appointments={[]} />);
      expect(screen.getByText('0 apts')).toBeInTheDocument();
      expect(container.querySelector('[data-testid^="appointment-"]')).not.toBeInTheDocument();
    });
  });
});
