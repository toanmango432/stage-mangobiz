import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingCard } from '@/components/booking/BookingCard';

// Mock the MobileBottomSheet component
vi.mock('@/components/booking/MobileBottomSheet', () => ({
  MobileBottomSheet: ({ children, isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="mobile-bottom-sheet" onClick={onClose}>
        {children}
      </div>
    ) : null,
}));

// Mock the ServiceQuickPreview component
vi.mock('@/components/booking/ServiceQuickPreview', () => ({
  ServiceQuickPreview: ({ onServiceSelect }: any) => (
    <div data-testid="service-quick-preview">
      <button onClick={() => onServiceSelect({ id: '2', name: 'New Service' })}>
        Select New Service
      </button>
    </div>
  ),
}));

describe('BookingCard', () => {
  const defaultProps = {
    service: {
      id: '1',
      name: 'Gel Manicure',
      description: 'Premium gel manicure service',
      duration: 60,
      price: 45,
      image: '/images/gel-manicure.jpg',
    },
    staff: {
      id: '1',
      name: 'Sarah Chen',
      avatar: '/images/sarah-chen.jpg',
    },
    date: '2024-01-15',
    time: '14:00',
    duration: 60,
    price: 45,
    onServiceChange: vi.fn(),
    onStaffChange: vi.fn(),
    onDateTimeChange: vi.fn(),
    onRemove: vi.fn(),
    onAddPerson: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders service information correctly', () => {
    render(<BookingCard {...defaultProps} />);

    expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
    expect(screen.getByText('Premium gel manicure service')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('$45')).toBeInTheDocument();
  });

  it('shows staff information when provided', () => {
    render(<BookingCard {...defaultProps} />);

    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByAltText('Sarah Chen')).toBeInTheDocument();
  });

  it('displays date/time when available', () => {
    render(<BookingCard {...defaultProps} />);

    expect(screen.getByText('Mon, Jan 15')).toBeInTheDocument();
    expect(screen.getByText('2:00 PM')).toBeInTheDocument();
  });

  it('opens service change bottom sheet when edit service is clicked', async () => {
    render(<BookingCard {...defaultProps} />);

    const editServiceButton = screen.getByText('Edit');
    fireEvent.click(editServiceButton);

    await waitFor(() => {
      expect(screen.getByTestId('mobile-bottom-sheet')).toBeInTheDocument();
      expect(screen.getByTestId('service-quick-preview')).toBeInTheDocument();
    });
  });

  it('calls onRemove when remove button is clicked', () => {
    render(<BookingCard {...defaultProps} />);

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(defaultProps.onRemove).toHaveBeenCalledTimes(1);
  });

  it('shows "+ Add another person" button when showAddPerson is true', () => {
    render(<BookingCard {...defaultProps} showAddPerson={true} />);

    expect(screen.getByText('+ Add another person')).toBeInTheDocument();
  });

  it('calls onAddPerson when "+ Add another person" button is clicked', () => {
    render(<BookingCard {...defaultProps} showAddPerson={true} />);

    const addPersonButton = screen.getByText('+ Add another person');
    fireEvent.click(addPersonButton);

    expect(defaultProps.onAddPerson).toHaveBeenCalledTimes(1);
  });

  it('displays group member index correctly', () => {
    render(<BookingCard {...defaultProps} isGroup={true} memberIndex={2} />);

    expect(screen.getByText('Person 2')).toBeInTheDocument();
  });

  it('displays member name correctly', () => {
    render(<BookingCard {...defaultProps} memberName="John Doe" />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows service image or fallback', () => {
    render(<BookingCard {...defaultProps} />);

    const serviceImage = screen.getByAltText('Gel Manicure');
    expect(serviceImage).toBeInTheDocument();
    expect(serviceImage).toHaveAttribute('src', '/images/gel-manicure.jpg');
  });

  it('formats duration and price correctly', () => {
    render(<BookingCard {...defaultProps} />);

    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('$45')).toBeInTheDocument();
  });

  it('shows border highlight for group bookings', () => {
    render(<BookingCard {...defaultProps} isGroup={true} />);

    const card = screen.getByTestId('booking-card');
    expect(card).toHaveClass('border-primary');
  });

  it('opens staff change bottom sheet when edit staff is clicked', async () => {
    render(<BookingCard {...defaultProps} />);

    const editStaffButton = screen.getByText('Edit Staff');
    fireEvent.click(editStaffButton);

    await waitFor(() => {
      expect(screen.getByTestId('mobile-bottom-sheet')).toBeInTheDocument();
    });
  });

  it('opens date/time change bottom sheet when edit date/time is clicked', async () => {
    render(<BookingCard {...defaultProps} />);

    const editDateTimeButton = screen.getByText('Edit Time');
    fireEvent.click(editDateTimeButton);

    await waitFor(() => {
      expect(screen.getByTestId('mobile-bottom-sheet')).toBeInTheDocument();
    });
  });

  it('disables actions when not editable', () => {
    render(<BookingCard {...defaultProps} isEditable={false} />);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });

  it('calls onServiceChange when new service is selected', async () => {
    render(<BookingCard {...defaultProps} />);

    const editServiceButton = screen.getByText('Edit');
    fireEvent.click(editServiceButton);

    await waitFor(() => {
      const selectButton = screen.getByText('Select New Service');
      fireEvent.click(selectButton);
    });

    expect(defaultProps.onServiceChange).toHaveBeenCalledWith({
      id: '2',
      name: 'New Service',
    });
  });

  it('handles missing service gracefully', () => {
    render(<BookingCard {...defaultProps} service={null} />);

    expect(screen.getByText('Select Service')).toBeInTheDocument();
  });

  it('handles missing staff gracefully', () => {
    render(<BookingCard {...defaultProps} staff={null} />);

    expect(screen.getByText('Any Available')).toBeInTheDocument();
  });

  it('handles missing date/time gracefully', () => {
    render(<BookingCard {...defaultProps} date={null} time={null} />);

    expect(screen.getByText('Select Time')).toBeInTheDocument();
  });
});



