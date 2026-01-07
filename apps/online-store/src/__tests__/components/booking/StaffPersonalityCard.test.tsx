import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaffPersonalityCard } from '@/components/booking/StaffPersonalityCard';

describe('StaffPersonalityCard', () => {
  const defaultProps = {
    staff: {
      id: '1',
      name: 'Sarah Chen',
      role: 'Senior Stylist',
      specialties: ['Hair Color', 'Balayage', 'Haircuts'],
      rating: 4.9,
      reviewCount: 127,
      experience: 8,
      totalBookings: 1250,
      avatar: '/images/sarah-chen.jpg',
      portfolio: [
        '/images/portfolio/sarah-1.jpg',
        '/images/portfolio/sarah-2.jpg',
        '/images/portfolio/sarah-3.jpg',
        '/images/portfolio/sarah-4.jpg',
      ],
      bio: 'Expert colorist with 8 years of experience',
      workingHours: {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '18:00' },
        saturday: { start: '10:00', end: '16:00' },
        sunday: { start: '10:00', end: '16:00' },
      },
      daysOff: [],
    },
    onSelect: vi.fn(),
    onViewProfile: vi.fn(),
    isSelected: false,
    compact: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders staff information correctly', () => {
    render(<StaffPersonalityCard {...defaultProps} />);

    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Senior Stylist')).toBeInTheDocument();
    expect(screen.getByText('Hair Color')).toBeInTheDocument();
    expect(screen.getByText('Balayage')).toBeInTheDocument();
    expect(screen.getByText('Haircuts')).toBeInTheDocument();
  });

  it('displays avatar or shows fallback', () => {
    render(<StaffPersonalityCard {...defaultProps} />);

    const avatar = screen.getByAltText('Sarah Chen');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', '/images/sarah-chen.jpg');
  });

  it('displays specialties as badges', () => {
    render(<StaffPersonalityCard {...defaultProps} />);

    expect(screen.getByText('Hair Color')).toBeInTheDocument();
    expect(screen.getByText('Balayage')).toBeInTheDocument();
    expect(screen.getByText('Haircuts')).toBeInTheDocument();
  });

  it('displays rating correctly', () => {
    render(<StaffPersonalityCard {...defaultProps} />);

    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('127 reviews')).toBeInTheDocument();
  });

  it('shows review count', () => {
    render(<StaffPersonalityCard {...defaultProps} />);

    expect(screen.getByText('127 reviews')).toBeInTheDocument();
  });

  it('shows availability badge with correct status', () => {
    render(<StaffPersonalityCard {...defaultProps} />);

    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('displays portfolio preview (3 images)', () => {
    render(<StaffPersonalityCard {...defaultProps} />);

    const portfolioImages = screen.getAllByAltText(/Portfolio/);
    expect(portfolioImages).toHaveLength(3);
  });

  it('shows "+ more" indicator when >3 portfolio items', () => {
    render(<StaffPersonalityCard {...defaultProps} />);

    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('displays experience years', () => {
    render(<StaffPersonalityCard {...defaultProps} />);

    expect(screen.getByText('8 years')).toBeInTheDocument();
  });

  it('displays total bookings', () => {
    render(<StaffPersonalityCard {...defaultProps} />);

    expect(screen.getByText('1,250 bookings')).toBeInTheDocument();
  });

  it('calls onSelect when Select button is clicked', () => {
    render(<StaffPersonalityCard {...defaultProps} />);

    const selectButton = screen.getByText('Select');
    fireEvent.click(selectButton);

    expect(defaultProps.onSelect).toHaveBeenCalledWith(defaultProps.staff);
  });

  it('calls onViewProfile when View button is clicked', () => {
    render(<StaffPersonalityCard {...defaultProps} />);

    const viewButton = screen.getByText('View');
    fireEvent.click(viewButton);

    expect(defaultProps.onViewProfile).toHaveBeenCalledWith(defaultProps.staff);
  });

  it('shows visual indicator when selected', () => {
    render(<StaffPersonalityCard {...defaultProps} isSelected={true} />);

    const card = screen.getByTestId('staff-personality-card');
    expect(card).toHaveClass('border-primary');
  });

  it('renders in compact mode', () => {
    render(<StaffPersonalityCard {...defaultProps} compact={true} />);

    const card = screen.getByTestId('staff-personality-card');
    expect(card).toHaveClass('compact');
  });

  it('opens profile when card is clicked', () => {
    render(<StaffPersonalityCard {...defaultProps} />);

    const card = screen.getByTestId('staff-personality-card');
    fireEvent.click(card);

    expect(defaultProps.onViewProfile).toHaveBeenCalledWith(defaultProps.staff);
  });

  it('handles missing avatar gracefully', () => {
    const staffWithoutAvatar = {
      ...defaultProps.staff,
      avatar: null,
    };

    render(<StaffPersonalityCard {...defaultProps} staff={staffWithoutAvatar} />);

    expect(screen.getByText('SC')).toBeInTheDocument(); // Initials fallback
  });

  it('handles missing portfolio gracefully', () => {
    const staffWithoutPortfolio = {
      ...defaultProps.staff,
      portfolio: [],
    };

    render(<StaffPersonalityCard {...defaultProps} staff={staffWithoutPortfolio} />);

    expect(screen.queryByText('+1 more')).not.toBeInTheDocument();
  });

  it('handles missing specialties gracefully', () => {
    const staffWithoutSpecialties = {
      ...defaultProps.staff,
      specialties: [],
    };

    render(<StaffPersonalityCard {...defaultProps} staff={staffWithoutSpecialties} />);

    expect(screen.queryByText('Hair Color')).not.toBeInTheDocument();
  });

  it('shows offline status when staff is unavailable', () => {
    const offlineStaff = {
      ...defaultProps.staff,
      workingHours: {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '18:00' },
        saturday: { start: '10:00', end: '16:00' },
        sunday: { start: '10:00', end: '16:00' },
      },
      daysOff: ['2024-01-15'], // Today is off
    };

    render(<StaffPersonalityCard {...defaultProps} staff={offlineStaff} />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('shows busy status when staff is busy', () => {
    const busyStaff = {
      ...defaultProps.staff,
      availability: 'busy',
    };

    render(<StaffPersonalityCard {...defaultProps} staff={busyStaff} />);

    expect(screen.getByText('Busy')).toBeInTheDocument();
  });

  it('formats large numbers correctly', () => {
    const staffWithLargeNumbers = {
      ...defaultProps.staff,
      reviewCount: 1234,
      totalBookings: 12345,
    };

    render(<StaffPersonalityCard {...defaultProps} staff={staffWithLargeNumbers} />);

    expect(screen.getByText('1,234 reviews')).toBeInTheDocument();
    expect(screen.getByText('12,345 bookings')).toBeInTheDocument();
  });

  it('handles zero ratings gracefully', () => {
    const newStaff = {
      ...defaultProps.staff,
      rating: 0,
      reviewCount: 0,
    };

    render(<StaffPersonalityCard {...defaultProps} staff={newStaff} />);

    expect(screen.getByText('New')).toBeInTheDocument();
  });
});



