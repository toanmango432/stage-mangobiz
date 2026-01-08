/**
 * @file SmartBookingPanel.test.tsx
 * @description Tests for SmartBookingPanel - AI-powered booking suggestions
 *
 * Test coverage:
 * - Header rendering (title, subtitle, Sparkles icon)
 * - Client info section (last visit, total visits, avg spend)
 * - Quick Booking option (one-click booking with confidence)
 * - Service suggestions (list, highlighting, confidence)
 * - Staff suggestions (list, availability, confidence)
 * - Time suggestions (grid, availability, highlighting)
 * - Click handlers for all interactive elements
 * - Conditional rendering based on suggestions data
 * - Styling and layout
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SmartBookingPanel } from '../SmartBookingPanel';
import type { SmartBookingSuggestion } from '../../../services/bookingIntelligence';

// Create mock suggestions factory
function createMockSuggestions(overrides: Partial<SmartBookingSuggestion> = {}): SmartBookingSuggestion {
  return {
    clientInfo: {
      lastVisit: '2 weeks ago',
      totalVisits: 15,
      averageSpend: 85.5,
    },
    quickBooking: undefined,
    suggestedServices: [],
    suggestedStaff: [],
    suggestedTimes: [],
    ...overrides,
  };
}

// Create quick booking option
function createMockQuickBooking() {
  return {
    services: [
      {
        serviceId: 'svc-1',
        serviceName: 'Haircut',
        staffId: 'staff-1',
        staffName: 'Jane Stylist',
      },
    ],
    suggestedTime: new Date('2026-01-15T14:00:00').toISOString(),
    estimatedDuration: 45,
    estimatedPrice: 65,
    confidence: 92.5,
    reason: 'Based on previous bookings',
  };
}

// Create mock service suggestion
function createMockServiceSuggestion(overrides: any = {}) {
  return {
    serviceId: 'svc-1',
    serviceName: 'Haircut',
    confidence: 85,
    reason: 'Most frequent service',
    ...overrides,
  };
}

// Create mock staff suggestion
function createMockStaffSuggestion(overrides: any = {}) {
  return {
    staffId: 'staff-1',
    staffName: 'Jane Stylist',
    confidence: 90,
    reason: 'Preferred stylist',
    isAvailable: true,
    ...overrides,
  };
}

// Create mock time suggestion
function createMockTimeSuggestion(overrides: any = {}) {
  return {
    time: new Date('2026-01-15T14:00:00'),
    displayTime: '2:00 PM',
    isAvailable: true,
    reason: 'Usual booking time',
    ...overrides,
  };
}

describe('SmartBookingPanel', () => {
  const mockOnUseQuickBooking = vi.fn();
  const mockOnSelectService = vi.fn();
  const mockOnSelectStaff = vi.fn();
  const mockOnSelectTime = vi.fn();

  const defaultProps = {
    suggestions: createMockSuggestions(),
    onUseQuickBooking: mockOnUseQuickBooking,
    onSelectService: mockOnSelectService,
    onSelectStaff: mockOnSelectStaff,
    onSelectTime: mockOnSelectTime,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Header', () => {
    it('renders title', () => {
      render(<SmartBookingPanel {...defaultProps} />);
      expect(screen.getByText('Smart Booking Suggestions')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
      render(<SmartBookingPanel {...defaultProps} />);
      expect(screen.getByText('Based on booking history')).toBeInTheDocument();
    });

    it('renders Sparkles icon container', () => {
      const { container } = render(<SmartBookingPanel {...defaultProps} />);
      const iconContainer = container.querySelector('.bg-gradient-to-br.from-purple-500.to-brand-500');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders Sparkles icon', () => {
      const { container } = render(<SmartBookingPanel {...defaultProps} />);
      const iconContainer = container.querySelector('.from-purple-500');
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Client Info Section', () => {
    it('renders Last Visit label', () => {
      render(<SmartBookingPanel {...defaultProps} />);
      expect(screen.getByText('Last Visit')).toBeInTheDocument();
    });

    it('renders Last Visit value', () => {
      render(<SmartBookingPanel {...defaultProps} />);
      expect(screen.getByText('2 weeks ago')).toBeInTheDocument();
    });

    it('renders Total Visits label', () => {
      render(<SmartBookingPanel {...defaultProps} />);
      expect(screen.getByText('Total Visits')).toBeInTheDocument();
    });

    it('renders Total Visits value', () => {
      render(<SmartBookingPanel {...defaultProps} />);
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('renders Avg. Spend label', () => {
      render(<SmartBookingPanel {...defaultProps} />);
      expect(screen.getByText('Avg. Spend')).toBeInTheDocument();
    });

    it('renders Avg. Spend value with $ and rounded', () => {
      render(<SmartBookingPanel {...defaultProps} />);
      expect(screen.getByText('$86')).toBeInTheDocument();
    });

    it('has 3-column grid layout', () => {
      const { container } = render(<SmartBookingPanel {...defaultProps} />);
      const grid = container.querySelector('.grid-cols-3');
      expect(grid).toBeInTheDocument();
    });

    it('handles different last visit values', () => {
      const suggestions = createMockSuggestions({
        clientInfo: { lastVisit: 'Yesterday', totalVisits: 5, averageSpend: 50 },
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
    });

    it('handles zero total visits', () => {
      const suggestions = createMockSuggestions({
        clientInfo: { lastVisit: 'Never', totalVisits: 0, averageSpend: 0 },
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('$0')).toBeInTheDocument();
    });
  });

  describe('Quick Booking Section', () => {
    it('does not render when quickBooking is undefined', () => {
      render(<SmartBookingPanel {...defaultProps} />);
      expect(screen.queryByText('One-Click Booking')).not.toBeInTheDocument();
    });

    it('renders when quickBooking is provided', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('One-Click Booking')).toBeInTheDocument();
    });

    it('shows confidence percentage', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('93% match')).toBeInTheDocument();
    });

    it('shows reason text', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Based on previous bookings')).toBeInTheDocument();
    });

    it('shows Service label and value', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Service:')).toBeInTheDocument();
      expect(screen.getByText('Haircut')).toBeInTheDocument();
    });

    it('shows Staff label and value', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Staff:')).toBeInTheDocument();
      expect(screen.getByText('Jane Stylist')).toBeInTheDocument();
    });

    it('shows Time label and formatted value', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Time:')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
    });

    it('shows Duration label and value', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Duration:')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();
    });

    it('shows Price label and value', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Price:')).toBeInTheDocument();
      expect(screen.getByText('$65')).toBeInTheDocument();
    });

    it('shows Book Now button when handler provided', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Book Now - One Click')).toBeInTheDocument();
    });

    it('does not show Book Now button when handler not provided', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      render(
        <SmartBookingPanel
          suggestions={suggestions}
          onSelectService={mockOnSelectService}
          onSelectStaff={mockOnSelectStaff}
          onSelectTime={mockOnSelectTime}
        />
      );
      expect(screen.queryByText('Book Now - One Click')).not.toBeInTheDocument();
    });

    it('calls onUseQuickBooking when button clicked', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      fireEvent.click(screen.getByText('Book Now - One Click'));

      expect(mockOnUseQuickBooking).toHaveBeenCalledTimes(1);
    });

    it('shows multiple services joined', () => {
      const quickBooking = createMockQuickBooking();
      quickBooking.services.push({
        serviceId: 'svc-2',
        serviceName: 'Beard Trim',
        staffId: 'staff-1',
        staffName: 'Jane Stylist',
      });
      const suggestions = createMockSuggestions({ quickBooking });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Haircut, Beard Trim')).toBeInTheDocument();
    });

    it('has purple border styling', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      const { container } = render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      const section = container.querySelector('.border-2.border-purple-300');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Service Suggestions Section', () => {
    it('does not render when suggestedServices is empty', () => {
      render(<SmartBookingPanel {...defaultProps} />);
      expect(screen.queryByText('Suggested Services')).not.toBeInTheDocument();
    });

    it('renders section title when services exist', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [createMockServiceSuggestion()],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Suggested Services')).toBeInTheDocument();
    });

    it('renders service name', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [createMockServiceSuggestion({ serviceName: 'Manicure' })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Manicure')).toBeInTheDocument();
    });

    it('renders service reason', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [createMockServiceSuggestion({ reason: 'Top pick for you' })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Top pick for you')).toBeInTheDocument();
    });

    it('renders service confidence percentage', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [createMockServiceSuggestion({ confidence: 78.6 })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('79%')).toBeInTheDocument();
    });

    it('calls onSelectService with serviceId when clicked', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [createMockServiceSuggestion({ serviceId: 'svc-123' })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      fireEvent.click(screen.getByText('Haircut'));

      expect(mockOnSelectService).toHaveBeenCalledWith('svc-123');
    });

    it('renders multiple services', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [
          createMockServiceSuggestion({ serviceId: 'svc-1', serviceName: 'Haircut' }),
          createMockServiceSuggestion({ serviceId: 'svc-2', serviceName: 'Color' }),
          createMockServiceSuggestion({ serviceId: 'svc-3', serviceName: 'Blowout' }),
        ],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('Color')).toBeInTheDocument();
      expect(screen.getByText('Blowout')).toBeInTheDocument();
    });

    it('highlights first service', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [
          createMockServiceSuggestion({ serviceId: 'svc-1', serviceName: 'First' }),
          createMockServiceSuggestion({ serviceId: 'svc-2', serviceName: 'Second' }),
        ],
      });
      const { container } = render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      const buttons = container.querySelectorAll('button');
      const serviceButtons = Array.from(buttons).filter(b => b.textContent?.includes('First') || b.textContent?.includes('Second'));

      // First service should have purple styling
      const firstButton = serviceButtons.find(b => b.textContent?.includes('First'));
      expect(firstButton).toHaveClass('border-purple-300', 'bg-purple-50');
    });

    it('has TrendingUp icon in header', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [createMockServiceSuggestion()],
      });
      const { container } = render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      // TrendingUp icon should be near the header
      const sectionTitle = screen.getByText('Suggested Services');
      const header = sectionTitle.closest('div');
      expect(header?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Staff Suggestions Section', () => {
    it('does not render when suggestedStaff is empty', () => {
      render(<SmartBookingPanel {...defaultProps} />);
      expect(screen.queryByText('Preferred Staff')).not.toBeInTheDocument();
    });

    it('renders section title when staff exist', () => {
      const suggestions = createMockSuggestions({
        suggestedStaff: [createMockStaffSuggestion()],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Preferred Staff')).toBeInTheDocument();
    });

    it('renders staff name', () => {
      const suggestions = createMockSuggestions({
        suggestedStaff: [createMockStaffSuggestion({ staffName: 'Mike Barber' })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Mike Barber')).toBeInTheDocument();
    });

    it('renders staff reason', () => {
      const suggestions = createMockSuggestions({
        suggestedStaff: [createMockStaffSuggestion({ reason: 'Your favorite' })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Your favorite')).toBeInTheDocument();
    });

    it('renders staff confidence percentage', () => {
      const suggestions = createMockSuggestions({
        suggestedStaff: [createMockStaffSuggestion({ confidence: 88.3 })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('calls onSelectStaff with staffId when clicked', () => {
      const suggestions = createMockSuggestions({
        suggestedStaff: [createMockStaffSuggestion({ staffId: 'staff-456' })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      fireEvent.click(screen.getByText('Jane Stylist'));

      expect(mockOnSelectStaff).toHaveBeenCalledWith('staff-456');
    });

    it('shows Busy for unavailable staff', () => {
      const suggestions = createMockSuggestions({
        suggestedStaff: [createMockStaffSuggestion({ isAvailable: false })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Busy')).toBeInTheDocument();
    });

    it('shows AlertCircle for unavailable staff', () => {
      const suggestions = createMockSuggestions({
        suggestedStaff: [createMockStaffSuggestion({ isAvailable: false })],
      });
      const { container } = render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      const staffButton = screen.getByText('Jane Stylist').closest('button');
      const alertIcon = staffButton?.querySelector('svg.text-orange-500, svg.w-3');
      expect(alertIcon).toBeInTheDocument();
    });

    it('applies opacity to unavailable staff', () => {
      const suggestions = createMockSuggestions({
        suggestedStaff: [createMockStaffSuggestion({ isAvailable: false })],
      });
      const { container } = render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      const staffButton = screen.getByText('Jane Stylist').closest('button');
      expect(staffButton).toHaveClass('opacity-60');
    });

    it('highlights first available staff', () => {
      const suggestions = createMockSuggestions({
        suggestedStaff: [
          createMockStaffSuggestion({ staffId: 'staff-1', staffName: 'First', isAvailable: true }),
          createMockStaffSuggestion({ staffId: 'staff-2', staffName: 'Second', isAvailable: true }),
        ],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      const firstButton = screen.getByText('First').closest('button');
      expect(firstButton).toHaveClass('border-purple-300', 'bg-purple-50');
    });

    it('does not highlight unavailable first staff', () => {
      const suggestions = createMockSuggestions({
        suggestedStaff: [
          createMockStaffSuggestion({ staffId: 'staff-1', staffName: 'First', isAvailable: false }),
          createMockStaffSuggestion({ staffId: 'staff-2', staffName: 'Second', isAvailable: true }),
        ],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      const firstButton = screen.getByText('First').closest('button');
      expect(firstButton).not.toHaveClass('bg-purple-50');
    });
  });

  describe('Time Suggestions Section', () => {
    it('does not render when suggestedTimes is empty', () => {
      render(<SmartBookingPanel {...defaultProps} />);
      expect(screen.queryByText('Best Times')).not.toBeInTheDocument();
    });

    it('renders section title when times exist', () => {
      const suggestions = createMockSuggestions({
        suggestedTimes: [createMockTimeSuggestion()],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Best Times')).toBeInTheDocument();
    });

    it('renders display time', () => {
      const suggestions = createMockSuggestions({
        suggestedTimes: [createMockTimeSuggestion({ displayTime: '3:30 PM' })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('3:30 PM')).toBeInTheDocument();
    });

    it('shows reason for first time slot', () => {
      const suggestions = createMockSuggestions({
        suggestedTimes: [createMockTimeSuggestion({ reason: 'Best availability' })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Best availability')).toBeInTheDocument();
    });

    it('does not show reason for subsequent time slots', () => {
      const suggestions = createMockSuggestions({
        suggestedTimes: [
          createMockTimeSuggestion({ displayTime: '2:00 PM', reason: 'First reason' }),
          createMockTimeSuggestion({
            time: new Date('2026-01-15T15:00:00'),
            displayTime: '3:00 PM',
            reason: 'Second reason',
          }),
        ],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      expect(screen.getByText('First reason')).toBeInTheDocument();
      expect(screen.queryByText('Second reason')).not.toBeInTheDocument();
    });

    it('calls onSelectTime with time when clicked', () => {
      const testTime = new Date('2026-01-15T14:00:00');
      const suggestions = createMockSuggestions({
        suggestedTimes: [createMockTimeSuggestion({ time: testTime })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      fireEvent.click(screen.getByText('2:00 PM'));

      expect(mockOnSelectTime).toHaveBeenCalledWith(testTime);
    });

    it('shows Full for unavailable times', () => {
      const suggestions = createMockSuggestions({
        suggestedTimes: [createMockTimeSuggestion({ isAvailable: false })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Full')).toBeInTheDocument();
    });

    it('renders multiple times in grid', () => {
      const suggestions = createMockSuggestions({
        suggestedTimes: [
          createMockTimeSuggestion({ time: new Date('2026-01-15T14:00:00'), displayTime: '2:00 PM' }),
          createMockTimeSuggestion({ time: new Date('2026-01-15T15:00:00'), displayTime: '3:00 PM' }),
          createMockTimeSuggestion({ time: new Date('2026-01-15T16:00:00'), displayTime: '4:00 PM' }),
        ],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
      expect(screen.getByText('3:00 PM')).toBeInTheDocument();
      expect(screen.getByText('4:00 PM')).toBeInTheDocument();
    });

    it('has 3-column grid layout', () => {
      const suggestions = createMockSuggestions({
        suggestedTimes: [createMockTimeSuggestion()],
      });
      const { container } = render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      const grids = container.querySelectorAll('.grid.grid-cols-3');
      expect(grids.length).toBeGreaterThan(0);
    });

    it('highlights first time slot', () => {
      const suggestions = createMockSuggestions({
        suggestedTimes: [
          createMockTimeSuggestion({ displayTime: '2:00 PM' }),
          createMockTimeSuggestion({
            time: new Date('2026-01-15T15:00:00'),
            displayTime: '3:00 PM',
          }),
        ],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      const firstButton = screen.getByText('2:00 PM').closest('button');
      expect(firstButton).toHaveClass('border-purple-300', 'bg-purple-50');
    });

    it('has Clock icon in header', () => {
      const suggestions = createMockSuggestions({
        suggestedTimes: [createMockTimeSuggestion()],
      });
      const { container } = render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      const sectionTitle = screen.getByText('Best Times');
      const header = sectionTitle.closest('div');
      expect(header?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Panel Styling', () => {
    it('has gradient background', () => {
      const { container } = render(<SmartBookingPanel {...defaultProps} />);
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('bg-gradient-to-br', 'from-purple-50', 'to-brand-50');
    });

    it('has purple border', () => {
      const { container } = render(<SmartBookingPanel {...defaultProps} />);
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('border', 'border-purple-200');
    });

    it('has rounded corners', () => {
      const { container } = render(<SmartBookingPanel {...defaultProps} />);
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('rounded-xl');
    });

    it('has padding', () => {
      const { container } = render(<SmartBookingPanel {...defaultProps} />);
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('p-6');
    });

    it('has vertical spacing between sections', () => {
      const { container } = render(<SmartBookingPanel {...defaultProps} />);
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('space-y-6');
    });
  });

  describe('Button Styling', () => {
    it('service buttons have full width', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [createMockServiceSuggestion()],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      const button = screen.getByText('Haircut').closest('button');
      expect(button).toHaveClass('w-full');
    });

    it('service buttons have hover styling', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [createMockServiceSuggestion()],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      const button = screen.getByText('Haircut').closest('button');
      expect(button).toHaveClass('hover:border-purple-300', 'hover:shadow-md');
    });

    it('service buttons have transition', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [createMockServiceSuggestion()],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      const button = screen.getByText('Haircut').closest('button');
      expect(button).toHaveClass('transition-all');
    });

    it('Book Now button has gradient', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      const button = screen.getByText('Book Now - One Click');
      expect(button).toHaveClass('bg-gradient-to-r', 'from-purple-500', 'to-brand-500');
    });

    it('Book Now button has shadow', () => {
      const suggestions = createMockSuggestions({ quickBooking: createMockQuickBooking() });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      const button = screen.getByText('Book Now - One Click');
      expect(button).toHaveClass('shadow-lg', 'hover:shadow-xl');
    });
  });

  describe('Optional Handlers', () => {
    it('does not crash when onSelectService is undefined', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [createMockServiceSuggestion()],
      });
      render(
        <SmartBookingPanel
          suggestions={suggestions}
          onUseQuickBooking={mockOnUseQuickBooking}
          onSelectStaff={mockOnSelectStaff}
          onSelectTime={mockOnSelectTime}
        />
      );

      fireEvent.click(screen.getByText('Haircut'));
      // Should not throw
    });

    it('does not crash when onSelectStaff is undefined', () => {
      const suggestions = createMockSuggestions({
        suggestedStaff: [createMockStaffSuggestion()],
      });
      render(
        <SmartBookingPanel
          suggestions={suggestions}
          onUseQuickBooking={mockOnUseQuickBooking}
          onSelectService={mockOnSelectService}
          onSelectTime={mockOnSelectTime}
        />
      );

      fireEvent.click(screen.getByText('Jane Stylist'));
      // Should not throw
    });

    it('does not crash when onSelectTime is undefined', () => {
      const suggestions = createMockSuggestions({
        suggestedTimes: [createMockTimeSuggestion()],
      });
      render(
        <SmartBookingPanel
          suggestions={suggestions}
          onUseQuickBooking={mockOnUseQuickBooking}
          onSelectService={mockOnSelectService}
          onSelectStaff={mockOnSelectStaff}
        />
      );

      fireEvent.click(screen.getByText('2:00 PM'));
      // Should not throw
    });
  });

  describe('Full Panel with All Sections', () => {
    it('renders all sections when all data provided', () => {
      const suggestions = createMockSuggestions({
        quickBooking: createMockQuickBooking(),
        suggestedServices: [createMockServiceSuggestion({ serviceName: 'Test Service' })],
        suggestedStaff: [createMockStaffSuggestion({ staffName: 'Test Staff' })],
        suggestedTimes: [createMockTimeSuggestion({ displayTime: '5:00 PM' })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);

      expect(screen.getByText('Smart Booking Suggestions')).toBeInTheDocument();
      expect(screen.getByText('One-Click Booking')).toBeInTheDocument();
      expect(screen.getByText('Suggested Services')).toBeInTheDocument();
      expect(screen.getByText('Preferred Staff')).toBeInTheDocument();
      expect(screen.getByText('Best Times')).toBeInTheDocument();
    });

    it('renders minimal panel with only client info', () => {
      render(<SmartBookingPanel {...defaultProps} />);

      expect(screen.getByText('Smart Booking Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Last Visit')).toBeInTheDocument();
      expect(screen.queryByText('One-Click Booking')).not.toBeInTheDocument();
      expect(screen.queryByText('Suggested Services')).not.toBeInTheDocument();
      expect(screen.queryByText('Preferred Staff')).not.toBeInTheDocument();
      expect(screen.queryByText('Best Times')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles high confidence values', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [createMockServiceSuggestion({ confidence: 100 })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles low confidence values', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [createMockServiceSuggestion({ confidence: 0.5 })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('1%')).toBeInTheDocument();
    });

    it('handles very long service names', () => {
      const suggestions = createMockSuggestions({
        suggestedServices: [createMockServiceSuggestion({ serviceName: 'Very Long Service Name That Might Overflow' })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText('Very Long Service Name That Might Overflow')).toBeInTheDocument();
    });

    it('handles special characters in names', () => {
      const suggestions = createMockSuggestions({
        suggestedStaff: [createMockStaffSuggestion({ staffName: "O'Brien & Co." })],
      });
      render(<SmartBookingPanel {...defaultProps} suggestions={suggestions} />);
      expect(screen.getByText("O'Brien & Co.")).toBeInTheDocument();
    });
  });
});
