import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartTimeSuggestions } from '@/components/booking/SmartTimeSuggestions';

// Mock the bookingDataService
vi.mock('@/lib/services/bookingDataService', () => ({
  bookingDataService: {
    getTimeSuggestions: vi.fn(() => Promise.resolve({
      suggestions: [
        {
          date: '2024-01-15',
          time: '14:00',
          staff: { id: '1', name: 'Sarah Chen' },
          available: true,
          popular: true,
          label: 'Today',
        },
        {
          date: '2024-01-15',
          time: '15:30',
          staff: { id: '1', name: 'Sarah Chen' },
          available: true,
          popular: false,
          label: 'Today',
        },
        {
          date: '2024-01-16',
          time: '10:00',
          staff: { id: '1', name: 'Sarah Chen' },
          available: true,
          popular: false,
          label: 'Tomorrow',
        },
      ],
    })),
  },
}));

describe('SmartTimeSuggestions', () => {
  const defaultProps = {
    service: {
      id: '1',
      name: 'Gel Manicure',
      duration: 60,
    },
    staff: {
      id: '1',
      name: 'Sarah Chen',
    },
    onTimeSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays time suggestions', async () => {
    render(<SmartTimeSuggestions {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    });
  });

  it('sorts suggestions correctly (today first, then by time)', async () => {
    render(<SmartTimeSuggestions {...defaultProps} />);

    await waitFor(() => {
      const timeElements = screen.getAllByText(/2:00 PM|3:30 PM|10:00 AM/);
      expect(timeElements[0]).toHaveTextContent('2:00 PM'); // Today first
      expect(timeElements[1]).toHaveTextContent('3:30 PM'); // Today second
      expect(timeElements[2]).toHaveTextContent('10:00 AM'); // Tomorrow
    });
  });

  it('shows "Today" and "Tomorrow" labels correctly', async () => {
    render(<SmartTimeSuggestions {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    });
  });

  it('displays "Available now" badge', async () => {
    render(<SmartTimeSuggestions {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Available now')).toBeInTheDocument();
    });
  });

  it('displays "Almost full" warning', async () => {
    // Mock suggestions with almost full status
    vi.mocked(require('@/lib/services/bookingDataService').bookingDataService.getTimeSuggestions)
      .mockResolvedValueOnce({
        suggestions: [
          {
            date: '2024-01-15',
            time: '14:00',
            staff: { id: '1', name: 'Sarah Chen' },
            available: true,
            popular: false,
            label: 'Today',
            almostFull: true,
          },
        ],
      });

    render(<SmartTimeSuggestions {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Almost full')).toBeInTheDocument();
    });
  });

  it('shows "Popular" badge on popular times', async () => {
    render(<SmartTimeSuggestions {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Popular')).toBeInTheDocument();
    });
  });

  it('shows "Last available" badge when appropriate', async () => {
    // Mock suggestions with last available status
    vi.mocked(require('@/lib/services/bookingDataService').bookingDataService.getTimeSuggestions)
      .mockResolvedValueOnce({
        suggestions: [
          {
            date: '2024-01-15',
            time: '14:00',
            staff: { id: '1', name: 'Sarah Chen' },
            available: true,
            popular: false,
            label: 'Today',
            lastAvailable: true,
          },
        ],
      });

    render(<SmartTimeSuggestions {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Last available')).toBeInTheDocument();
    });
  });

  it('calls onTimeSelect when time is selected', async () => {
    const onTimeSelect = vi.fn();
    render(<SmartTimeSuggestions {...defaultProps} onTimeSelect={onTimeSelect} />);

    await waitFor(() => {
      const timeButton = screen.getByText('2:00 PM');
      fireEvent.click(timeButton);
    });

    expect(onTimeSelect).toHaveBeenCalledWith({
      date: '2024-01-15',
      time: '14:00',
      staff: { id: '1', name: 'Sarah Chen' },
      available: true,
      popular: true,
      label: 'Today',
    });
  });

  it('shows empty state when no suggestions', async () => {
    vi.mocked(require('@/lib/services/bookingDataService').bookingDataService.getTimeSuggestions)
      .mockResolvedValueOnce({ suggestions: [] });

    render(<SmartTimeSuggestions {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No available times found')).toBeInTheDocument();
    });
  });

  it('shows loading shimmer during fetch', () => {
    // Mock a delayed response
    vi.mocked(require('@/lib/services/bookingDataService').bookingDataService.getTimeSuggestions)
      .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<SmartTimeSuggestions {...defaultProps} />);

    expect(screen.getByTestId('loading-shimmer')).toBeInTheDocument();
  });

  it('filters suggestions by service duration', async () => {
    const serviceWithDuration = {
      ...defaultProps.service,
      duration: 90, // 90 minutes
    };

    render(<SmartTimeSuggestions {...defaultProps} service={serviceWithDuration} />);

    await waitFor(() => {
      // Should only show times that accommodate 90-minute service
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
    });
  });

  it('filters suggestions by staff availability', async () => {
    const staffMember = {
      id: '2',
      name: 'John Doe',
    };

    render(<SmartTimeSuggestions {...defaultProps} staff={staffMember} />);

    await waitFor(() => {
      // Should only show times available for this staff member
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
    });
  });

  it('shows "Browse more times" button', async () => {
    render(<SmartTimeSuggestions {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Browse more times')).toBeInTheDocument();
    });
  });

  it('respects maximum suggestions limit', async () => {
    // Mock many suggestions
    const manySuggestions = Array.from({ length: 20 }, (_, i) => ({
      date: '2024-01-15',
      time: `${10 + i}:00`,
      staff: { id: '1', name: 'Sarah Chen' },
      available: true,
      popular: false,
      label: 'Today',
    }));

    vi.mocked(require('@/lib/services/bookingDataService').bookingDataService.getTimeSuggestions)
      .mockResolvedValueOnce({ suggestions: manySuggestions });

    render(<SmartTimeSuggestions {...defaultProps} />);

    await waitFor(() => {
      // Should only show first 6 suggestions (default limit)
      const timeButtons = screen.getAllByText(/AM|PM/);
      expect(timeButtons.length).toBeLessThanOrEqual(6);
    });
  });
});



