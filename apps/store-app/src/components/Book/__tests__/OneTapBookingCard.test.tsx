/**
 * OneTapBookingCard Component Tests
 * Tests for AI-powered instant booking card with one-tap confirmation
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OneTapBookingCard } from '../OneTapBookingCard';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import toast from 'react-hot-toast';

describe('OneTapBookingCard', () => {
  const mockOnBookNow = vi.fn();
  const mockOnCustomize = vi.fn();

  const createMockSuggestion = (overrides = {}) => ({
    confidence: 85,
    suggestedDate: new Date(2027, 5, 15, 14, 0), // June 15, 2027
    suggestedTime: '14:00',
    services: [
      { id: 'service-1', name: 'Haircut', duration: 30, price: 35 },
      { id: 'service-2', name: 'Styling', duration: 15, price: 20 },
    ],
    staff: {
      id: 'staff-1',
      name: 'Jane Stylist',
      avatar: '/avatars/jane.jpg',
    },
    totalDuration: 45,
    totalPrice: 55,
    reasoning: {
      dateReason: 'This is your preferred day of the week',
      timeReason: 'You usually book in the afternoon',
      serviceReason: 'Based on your last 5 visits',
      staffReason: 'Your regular stylist',
    },
    clientHistory: {
      lastVisit: new Date(2027, 4, 1), // May 1, 2027
      averageCycle: 21,
      totalVisits: 12,
      preferredDayOfWeek: 'Tuesday',
      preferredTimeOfDay: 'afternoon' as const,
    },
    ...overrides,
  });

  const defaultProps = {
    clientName: 'John Doe',
    suggestion: createMockSuggestion(),
    onBookNow: mockOnBookNow,
    onCustomize: mockOnCustomize,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to setup fake timers for date-dependent tests
  const withFakeTimers = (fn: () => void) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 5, 10, 10, 0, 0));
    try {
      fn();
    } finally {
      vi.useRealTimers();
    }
  };

  describe('basic rendering', () => {
    it('renders the component', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('One-Tap Booking')).toBeInTheDocument();
    });

    it('shows client name', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('for John Doe')).toBeInTheDocument();
    });

    it('shows Sparkles icon in header', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      const sparklesIcons = container.querySelectorAll('svg.lucide-sparkles');
      expect(sparklesIcons.length).toBeGreaterThanOrEqual(1);
    });

    it('applies custom className', () => {
      const { container } = render(
        <OneTapBookingCard {...defaultProps} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has gradient background', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      expect(container.firstChild).toHaveClass('bg-gradient-to-br');
    });

    it('has rounded corners', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      expect(container.firstChild).toHaveClass('rounded-2xl');
    });

    it('has shadow', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      expect(container.firstChild).toHaveClass('shadow-lg');
    });

    it('has border', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      expect(container.firstChild).toHaveClass('border-2', 'border-purple-200');
    });
  });

  describe('confidence badge', () => {
    it('shows confidence percentage', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('(85%)')).toBeInTheDocument();
    });

    it('shows "Excellent Match" for 90%+ confidence', () => {
      const suggestion = createMockSuggestion({ confidence: 95 });
      render(<OneTapBookingCard {...defaultProps} suggestion={suggestion} />);
      expect(screen.getByText('Excellent Match')).toBeInTheDocument();
    });

    it('shows "Great Match" for 75-89% confidence', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('Great Match')).toBeInTheDocument();
    });

    it('shows "Good Match" for 60-74% confidence', () => {
      const suggestion = createMockSuggestion({ confidence: 65 });
      render(<OneTapBookingCard {...defaultProps} suggestion={suggestion} />);
      expect(screen.getByText('Good Match')).toBeInTheDocument();
    });

    it('shows "Suggested" for below 60% confidence', () => {
      const suggestion = createMockSuggestion({ confidence: 50 });
      render(<OneTapBookingCard {...defaultProps} suggestion={suggestion} />);
      expect(screen.getByText('Suggested')).toBeInTheDocument();
    });

    it('has green gradient for 90%+ confidence', () => {
      const suggestion = createMockSuggestion({ confidence: 95 });
      const { container } = render(
        <OneTapBookingCard {...defaultProps} suggestion={suggestion} />
      );
      const badge = container.querySelector('.from-green-500.to-emerald-500');
      expect(badge).toBeInTheDocument();
    });

    it('has brand gradient for 75-89% confidence', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      const badge = container.querySelector('.from-brand-500.to-cyan-500');
      expect(badge).toBeInTheDocument();
    });

    it('has blue gradient for 60-74% confidence', () => {
      const suggestion = createMockSuggestion({ confidence: 65 });
      const { container } = render(
        <OneTapBookingCard {...defaultProps} suggestion={suggestion} />
      );
      const badge = container.querySelector('.from-blue-500.to-indigo-500');
      expect(badge).toBeInTheDocument();
    });

    it('has purple gradient for below 60% confidence', () => {
      const suggestion = createMockSuggestion({ confidence: 50 });
      const { container } = render(
        <OneTapBookingCard {...defaultProps} suggestion={suggestion} />
      );
      const badge = container.querySelector('.from-purple-500.to-pink-500');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('date formatting', () => {
    it('shows "Today" for current date', () => {
      withFakeTimers(() => {
        const suggestion = createMockSuggestion({
          suggestedDate: new Date(2027, 5, 10, 14, 0), // Same as system time
        });
        render(<OneTapBookingCard {...defaultProps} suggestion={suggestion} />);
        expect(screen.getByText(/Today/)).toBeInTheDocument();
      });
    });

    it('shows "Tomorrow" for next day', () => {
      withFakeTimers(() => {
        const suggestion = createMockSuggestion({
          suggestedDate: new Date(2027, 5, 11, 14, 0), // June 11, 2027
        });
        render(<OneTapBookingCard {...defaultProps} suggestion={suggestion} />);
        expect(screen.getByText(/Tomorrow/)).toBeInTheDocument();
      });
    });

    it('shows weekday and date for other days', () => {
      withFakeTimers(() => {
        render(<OneTapBookingCard {...defaultProps} />);
        // June 15, 2027 is a Tuesday
        expect(screen.getByText(/Tuesday, Jun 15/)).toBeInTheDocument();
      });
    });
  });

  describe('time formatting', () => {
    it('formats time in 12-hour format with PM', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText(/2:00 PM/)).toBeInTheDocument();
    });

    it('formats morning time with AM', () => {
      const suggestion = createMockSuggestion({ suggestedTime: '09:30' });
      render(<OneTapBookingCard {...defaultProps} suggestion={suggestion} />);
      expect(screen.getByText(/9:30 AM/)).toBeInTheDocument();
    });

    it('formats noon correctly', () => {
      const suggestion = createMockSuggestion({ suggestedTime: '12:00' });
      render(<OneTapBookingCard {...defaultProps} suggestion={suggestion} />);
      expect(screen.getByText(/12:00 PM/)).toBeInTheDocument();
    });

    it('formats midnight correctly', () => {
      const suggestion = createMockSuggestion({ suggestedTime: '00:00' });
      render(<OneTapBookingCard {...defaultProps} suggestion={suggestion} />);
      expect(screen.getByText(/12:00 AM/)).toBeInTheDocument();
    });
  });

  describe('services display', () => {
    it('shows combined service names', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('Haircut + Styling')).toBeInTheDocument();
    });

    it('shows single service name when only one', () => {
      const suggestion = createMockSuggestion({
        services: [{ id: 'service-1', name: 'Massage', duration: 60, price: 80 }],
      });
      render(<OneTapBookingCard {...defaultProps} suggestion={suggestion} />);
      expect(screen.getByText('Massage')).toBeInTheDocument();
    });

    it('shows total duration', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('45 min')).toBeInTheDocument();
    });

    it('shows total price', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('$55')).toBeInTheDocument();
    });

    it('shows service reasoning', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('Based on your last 5 visits')).toBeInTheDocument();
    });

    it('shows Clock icon', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      expect(container.querySelector('svg.lucide-clock')).toBeInTheDocument();
    });

    it('shows DollarSign icon', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      expect(container.querySelector('svg.lucide-dollar-sign')).toBeInTheDocument();
    });
  });

  describe('staff display', () => {
    it('shows staff name', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('Jane Stylist')).toBeInTheDocument();
    });

    it('shows staff reasoning', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('Your regular stylist')).toBeInTheDocument();
    });

    it('shows User icon', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      expect(container.querySelector('svg.lucide-user')).toBeInTheDocument();
    });
  });

  describe('date/time section', () => {
    it('shows Calendar icon', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      expect(container.querySelector('svg.lucide-calendar')).toBeInTheDocument();
    });

    it('shows time reasoning', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('You usually book in the afternoon')).toBeInTheDocument();
    });
  });

  describe('client insights (AI Analysis)', () => {
    it('hides details by default', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.queryByText('Based on Client History')).not.toBeInTheDocument();
    });

    it('shows toggle button', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('Show AI Analysis Details')).toBeInTheDocument();
    });

    it('shows details when toggle clicked', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Show AI Analysis Details'));
      expect(screen.getByText('Based on Client History')).toBeInTheDocument();
    });

    it('changes toggle text when details shown', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Show AI Analysis Details'));
      expect(screen.getByText('Hide AI Analysis Details')).toBeInTheDocument();
    });

    it('hides details when toggle clicked again', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Show AI Analysis Details'));
      fireEvent.click(screen.getByText('Hide AI Analysis Details'));
      expect(screen.queryByText('Based on Client History')).not.toBeInTheDocument();
    });

    it('shows days since last visit', () => {
      withFakeTimers(() => {
        render(<OneTapBookingCard {...defaultProps} />);
        fireEvent.click(screen.getByText('Show AI Analysis Details'));
        // May 1 to June 10 = 40 days
        expect(screen.getByText('40 days ago')).toBeInTheDocument();
      });
    });

    it('shows total visits', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Show AI Analysis Details'));
      expect(screen.getByText('12 times')).toBeInTheDocument();
    });

    it('shows average cycle', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Show AI Analysis Details'));
      expect(screen.getByText('Every 21 days')).toBeInTheDocument();
    });

    it('shows preferred time of day', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Show AI Analysis Details'));
      expect(screen.getByText('afternoon')).toBeInTheDocument();
    });

    it('does not show preferred time if not available', () => {
      const suggestion = createMockSuggestion({
        clientHistory: {
          lastVisit: new Date(2027, 4, 1),
          averageCycle: 21,
          totalVisits: 12,
          preferredTimeOfDay: undefined,
        },
      });
      render(<OneTapBookingCard {...defaultProps} suggestion={suggestion} />);
      fireEvent.click(screen.getByText('Show AI Analysis Details'));
      expect(screen.queryByText('Prefers')).not.toBeInTheDocument();
    });

    it('shows TrendingUp icon', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Show AI Analysis Details'));
      expect(container.querySelector('svg.lucide-trending-up')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('renders Book Now button', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('Book Now - One Tap')).toBeInTheDocument();
    });

    it('renders Customize button', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(screen.getByText('Customize')).toBeInTheDocument();
    });

    it('shows icon on Book Now button', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      const bookButton = screen.getByText('Book Now - One Tap').closest('button');
      const icon = bookButton?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('shows icon on Customize button', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      const customizeButton = screen.getByText('Customize').closest('button');
      const icon = customizeButton?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('calls onCustomize when Customize clicked', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Customize'));
      expect(mockOnCustomize).toHaveBeenCalledTimes(1);
    });

    it('calls onBookNow when Book Now clicked', async () => {
      mockOnBookNow.mockResolvedValue(undefined);
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Book Now - One Tap'));
      await waitFor(() => {
        expect(mockOnBookNow).toHaveBeenCalledTimes(1);
      });
    });

    it('passes suggestion to onBookNow', async () => {
      mockOnBookNow.mockResolvedValue(undefined);
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Book Now - One Tap'));
      await waitFor(() => {
        expect(mockOnBookNow).toHaveBeenCalledTimes(1);
        // Verify the suggestion has the expected properties
        const calledWith = mockOnBookNow.mock.calls[0][0];
        expect(calledWith.confidence).toBe(85);
        expect(calledWith.totalPrice).toBe(55);
        expect(calledWith.staff.name).toBe('Jane Stylist');
      });
    });
  });

  describe('loading state', () => {
    it('shows loading text while booking', async () => {
      let resolveBooking: () => void;
      mockOnBookNow.mockImplementation(
        () => new Promise<void>((resolve) => {
          resolveBooking = resolve;
        })
      );
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Book Now - One Tap'));

      // Check loading state appears
      expect(await screen.findByText('Booking...')).toBeInTheDocument();

      // Clean up by resolving
      resolveBooking!();
    });

    it('shows spinner while booking', async () => {
      let resolveBooking: () => void;
      mockOnBookNow.mockImplementation(
        () => new Promise<void>((resolve) => {
          resolveBooking = resolve;
        })
      );
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Book Now - One Tap'));

      await screen.findByText('Booking...');
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();

      resolveBooking!();
    });

    it('disables Book Now button while booking', async () => {
      let resolveBooking: () => void;
      mockOnBookNow.mockImplementation(
        () => new Promise<void>((resolve) => {
          resolveBooking = resolve;
        })
      );
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Book Now - One Tap'));

      const bookButton = await screen.findByText('Booking...');
      expect(bookButton.closest('button')).toBeDisabled();

      resolveBooking!();
    });

    it('disables Customize button while booking', async () => {
      let resolveBooking: () => void;
      mockOnBookNow.mockImplementation(
        () => new Promise<void>((resolve) => {
          resolveBooking = resolve;
        })
      );
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Book Now - One Tap'));

      await screen.findByText('Booking...');
      const customizeButton = screen.getByText('Customize').closest('button');
      expect(customizeButton).toBeDisabled();

      resolveBooking!();
    });
  });

  describe('toast notifications', () => {
    it('shows success toast on successful booking', async () => {
      mockOnBookNow.mockResolvedValue(undefined);
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Book Now - One Tap'));

      // Wait for the booking to complete
      await waitFor(() => {
        expect(mockOnBookNow).toHaveBeenCalled();
      });

      // Wait a tick for the toast to be called
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('shows error toast on booking failure', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnBookNow.mockRejectedValue(new Error('Booking failed'));
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Book Now - One Tap'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to book appointment. Please try again.'
        );
      });

      consoleError.mockRestore();
    });

    it('re-enables buttons after successful booking', async () => {
      mockOnBookNow.mockResolvedValue(undefined);
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Book Now - One Tap'));

      // Wait for booking to complete and button to re-appear
      await waitFor(() => {
        expect(screen.getByText('Book Now - One Tap')).toBeInTheDocument();
      });

      const bookButton = screen.getByText('Book Now - One Tap').closest('button');
      expect(bookButton).not.toBeDisabled();
    });

    it('re-enables buttons after booking failure', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnBookNow.mockRejectedValue(new Error('Booking failed'));
      render(<OneTapBookingCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Book Now - One Tap'));

      // Wait for booking to fail and button to re-appear
      await waitFor(() => {
        expect(screen.getByText('Book Now - One Tap')).toBeInTheDocument();
      });

      const bookButton = screen.getByText('Book Now - One Tap').closest('button');
      expect(bookButton).not.toBeDisabled();

      consoleError.mockRestore();
    });
  });

  describe('footer', () => {
    it('shows analysis footer', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      expect(
        screen.getByText('AI analyzed 12 past visits to make this suggestion')
      ).toBeInTheDocument();
    });

    it('shows correct visit count in footer', () => {
      const suggestion = createMockSuggestion({
        clientHistory: {
          lastVisit: new Date(2027, 4, 1),
          averageCycle: 21,
          totalVisits: 25,
        },
      });
      render(<OneTapBookingCard {...defaultProps} suggestion={suggestion} />);
      expect(
        screen.getByText('AI analyzed 25 past visits to make this suggestion')
      ).toBeInTheDocument();
    });
  });

  describe('styling sections', () => {
    it('has white background cards for details', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      const whiteCards = container.querySelectorAll('.bg-white.rounded-lg.border');
      expect(whiteCards.length).toBeGreaterThanOrEqual(3);
    });

    it('Book Now button has gradient background', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      const bookButton = screen.getByText('Book Now - One Tap').closest('button');
      expect(bookButton).toHaveClass('bg-gradient-to-r');
    });

    it('Customize button has white background', () => {
      const { container } = render(<OneTapBookingCard {...defaultProps} />);
      const customizeButton = screen.getByText('Customize').closest('button');
      expect(customizeButton).toHaveClass('bg-white');
    });

    it('toggle button has purple text', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      const toggleButton = screen.getByText('Show AI Analysis Details');
      expect(toggleButton).toHaveClass('text-purple-600');
    });
  });

  describe('accessibility', () => {
    it('Book Now button is accessible', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      const button = screen.getByText('Book Now - One Tap').closest('button');
      expect(button).not.toBeDisabled();
    });

    it('Customize button is accessible', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      const button = screen.getByText('Customize').closest('button');
      expect(button).not.toBeDisabled();
    });

    it('all buttons are focusable', () => {
      render(<OneTapBookingCard {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).not.toBeDisabled();
      });
    });
  });
});
