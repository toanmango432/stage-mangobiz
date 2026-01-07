import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedFloatingSummaryBar } from '@/components/booking/EnhancedFloatingSummaryBar';

// Mock the MobileBottomSheet component
vi.mock('@/components/booking/MobileBottomSheet', () => ({
  MobileBottomSheet: ({ children, isOpen }: any) => 
    isOpen ? <div data-testid="mobile-bottom-sheet">{children}</div> : null,
}));

describe('EnhancedFloatingSummaryBar', () => {
  const defaultProps = {
    formData: {
      service: null,
      staff: null,
      date: null,
      time: null,
      members: [],
    },
    onEdit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays empty state when no data', () => {
    render(<EnhancedFloatingSummaryBar {...defaultProps} />);

    expect(screen.getByText('Start your booking')).toBeInTheDocument();
    expect(screen.getByText('Select a service to begin')).toBeInTheDocument();
  });

  it('displays partial state when service selected', () => {
    const formDataWithService = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithService} />);

    expect(screen.getByText('Continue booking')).toBeInTheDocument();
    expect(screen.getByText('Select staff and time')).toBeInTheDocument();
  });

  it('displays ready state when service and staff selected', () => {
    const formDataReady = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
      staff: { id: '1', name: 'Sarah Chen' },
      date: '2024-01-15',
      time: '14:00',
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataReady} />);

    expect(screen.getByText('Ready to book')).toBeInTheDocument();
    expect(screen.getByText('Complete your details')).toBeInTheDocument();
  });

  it('displays complete state when all data provided', () => {
    const formDataComplete = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
      staff: { id: '1', name: 'Sarah Chen' },
      date: '2024-01-15',
      time: '14:00',
      clientInfo: { name: 'John Doe', email: 'john@example.com' },
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataComplete} />);

    expect(screen.getByText('Complete booking')).toBeInTheDocument();
    expect(screen.getByText('All details ready')).toBeInTheDocument();
  });

  it('displays conflict state when conflicts detected', () => {
    const formDataWithConflict = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
      staff: { id: '1', name: 'Sarah Chen' },
      date: '2024-01-15',
      time: '14:00',
      conflicts: ['Time slot no longer available'],
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithConflict} />);

    expect(screen.getByText('Resolve conflicts')).toBeInTheDocument();
    expect(screen.getByText('Time slot no longer available')).toBeInTheDocument();
  });

  it('changes state icon based on state', () => {
    const { rerender } = render(<EnhancedFloatingSummaryBar {...defaultProps} />);

    // Empty state
    expect(screen.getByTestId('state-icon-empty')).toBeInTheDocument();

    // Partial state
    const formDataPartial = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
    };
    rerender(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataPartial} />);

    expect(screen.getByTestId('state-icon-partial')).toBeInTheDocument();

    // Ready state
    const formDataReady = {
      ...formDataPartial,
      staff: { id: '1', name: 'Sarah Chen' },
      date: '2024-01-15',
      time: '14:00',
    };
    rerender(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataReady} />);

    expect(screen.getByTestId('state-icon-ready')).toBeInTheDocument();
  });

  it('changes state message based on state', () => {
    const { rerender } = render(<EnhancedFloatingSummaryBar {...defaultProps} />);

    expect(screen.getByText('Select a service to begin')).toBeInTheDocument();

    const formDataPartial = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
    };
    rerender(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataPartial} />);

    expect(screen.getByText('Select staff and time')).toBeInTheDocument();
  });

  it('changes button text based on state', () => {
    const { rerender } = render(<EnhancedFloatingSummaryBar {...defaultProps} />);

    expect(screen.getByText('Start your booking')).toBeInTheDocument();

    const formDataPartial = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
    };
    rerender(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataPartial} />);

    expect(screen.getByText('Continue booking')).toBeInTheDocument();
  });

  it('changes button variant based on state', () => {
    const { rerender } = render(<EnhancedFloatingSummaryBar {...defaultProps} />);

    // Empty state - secondary variant
    expect(screen.getByText('Start your booking')).toHaveClass('bg-secondary');

    const formDataReady = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
      staff: { id: '1', name: 'Sarah Chen' },
      date: '2024-01-15',
      time: '14:00',
    };
    rerender(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataReady} />);

    // Ready state - primary variant
    expect(screen.getByText('Ready to book')).toHaveClass('bg-primary');
  });

  it('displays group size correctly', () => {
    const formDataWithGroup = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
      members: [
        { id: 'member-1', name: 'Guest 1', service: { id: '1', price: 45 } },
        { id: 'member-2', name: 'Guest 2', service: { id: '1', price: 45 } },
      ],
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithGroup} />);

    expect(screen.getByText('2 people')).toBeInTheDocument();
  });

  it('calculates total price correctly', () => {
    const formDataWithGroup = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
      members: [
        { id: 'member-1', name: 'Guest 1', service: { id: '1', price: 45 } },
        { id: 'member-2', name: 'Guest 2', service: { id: '1', price: 45 } },
      ],
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithGroup} />);

    expect(screen.getByText('$90')).toBeInTheDocument();
  });

  it('calculates total duration correctly', () => {
    const formDataWithGroup = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', duration: 60 },
      members: [
        { id: 'member-1', name: 'Guest 1', service: { id: '1', duration: 60 } },
        { id: 'member-2', name: 'Guest 2', service: { id: '1', duration: 60 } },
      ],
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithGroup} />);

    expect(screen.getByText('120 min')).toBeInTheDocument();
  });

  it('opens details sheet on tap', async () => {
    const formDataWithService = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithService} />);

    const summaryBar = screen.getByTestId('floating-summary-bar');
    fireEvent.click(summaryBar);

    await waitFor(() => {
      expect(screen.getByTestId('mobile-bottom-sheet')).toBeInTheDocument();
    });
  });

  it('shows service details in sheet', async () => {
    const formDataWithService = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithService} />);

    const summaryBar = screen.getByTestId('floating-summary-bar');
    fireEvent.click(summaryBar);

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
      expect(screen.getByText('$45')).toBeInTheDocument();
    });
  });

  it('shows staff details in sheet', async () => {
    const formDataWithStaff = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
      staff: { id: '1', name: 'Sarah Chen' },
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithStaff} />);

    const summaryBar = screen.getByTestId('floating-summary-bar');
    fireEvent.click(summaryBar);

    await waitFor(() => {
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });
  });

  it('shows date/time details in sheet', async () => {
    const formDataWithDateTime = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
      staff: { id: '1', name: 'Sarah Chen' },
      date: '2024-01-15',
      time: '14:00',
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithDateTime} />);

    const summaryBar = screen.getByTestId('floating-summary-bar');
    fireEvent.click(summaryBar);

    await waitFor(() => {
      expect(screen.getByText('Mon, Jan 15')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
    });
  });

  it('shows group members in sheet', async () => {
    const formDataWithGroup = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
      members: [
        { id: 'member-1', name: 'Guest 1', service: { id: '1', price: 45 } },
        { id: 'member-2', name: 'Guest 2', service: { id: '1', price: 45 } },
      ],
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithGroup} />);

    const summaryBar = screen.getByTestId('floating-summary-bar');
    fireEvent.click(summaryBar);

    await waitFor(() => {
      expect(screen.getByText('Guest 1')).toBeInTheDocument();
      expect(screen.getByText('Guest 2')).toBeInTheDocument();
    });
  });

  it('calls onEdit when edit buttons are clicked', async () => {
    const formDataWithService = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithService} />);

    const summaryBar = screen.getByTestId('floating-summary-bar');
    fireEvent.click(summaryBar);

    await waitFor(() => {
      const editServiceButton = screen.getByText('Edit Service');
      fireEvent.click(editServiceButton);
    });

    expect(defaultProps.onEdit).toHaveBeenCalledWith('service');
  });

  it('has sticky positioning', () => {
    render(<EnhancedFloatingSummaryBar {...defaultProps} />);

    const summaryBar = screen.getByTestId('floating-summary-bar');
    expect(summaryBar).toHaveClass('fixed');
    expect(summaryBar).toHaveClass('bottom-0');
  });

  it('changes border color by state', () => {
    const { rerender } = render(<EnhancedFloatingSummaryBar {...defaultProps} />);

    // Empty state - default border
    expect(screen.getByTestId('floating-summary-bar')).toHaveClass('border-gray-200');

    const formDataReady = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
      staff: { id: '1', name: 'Sarah Chen' },
      date: '2024-01-15',
      time: '14:00',
    };
    rerender(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataReady} />);

    // Ready state - primary border
    expect(screen.getByTestId('floating-summary-bar')).toHaveClass('border-primary');
  });

  it('changes background color by state', () => {
    const { rerender } = render(<EnhancedFloatingSummaryBar {...defaultProps} />);

    // Empty state - default background
    expect(screen.getByTestId('floating-summary-bar')).toHaveClass('bg-white');

    const formDataWithConflict = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
      conflicts: ['Time slot no longer available'],
    };
    rerender(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithConflict} />);

    // Conflict state - warning background
    expect(screen.getByTestId('floating-summary-bar')).toHaveClass('bg-orange-50');
  });

  it('handles missing data gracefully', () => {
    const formDataWithMissingFields = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure' }, // Missing price
      staff: { id: '1', name: 'Sarah Chen' },
      // Missing date/time
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithMissingFields} />);

    expect(screen.getByText('Continue booking')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument(); // Should handle missing price
  });

  it('handles large group sizes', () => {
    const members = Array.from({ length: 10 }, (_, i) => ({
      id: `member-${i + 1}`,
      name: `Guest ${i + 1}`,
      service: { id: '1', price: 45 },
    }));

    const formDataWithLargeGroup = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', price: 45 },
      members,
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithLargeGroup} />);

    expect(screen.getByText('10 people')).toBeInTheDocument();
    expect(screen.getByText('$450')).toBeInTheDocument();
  });

  it('handles zero duration gracefully', () => {
    const formDataWithZeroDuration = {
      ...defaultProps.formData,
      service: { id: '1', name: 'Gel Manicure', duration: 0 },
    };

    render(<EnhancedFloatingSummaryBar {...defaultProps} formData={formDataWithZeroDuration} />);

    expect(screen.getByText('0 min')).toBeInTheDocument();
  });
});



