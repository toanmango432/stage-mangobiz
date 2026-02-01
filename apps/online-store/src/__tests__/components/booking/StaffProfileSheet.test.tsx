import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaffProfileSheet } from '@/components/booking/StaffProfileSheet';
import { createMockStaffPersonality } from '@/__tests__/factories';

// Mock the MobileBottomSheet component
vi.mock('@/components/booking/MobileBottomSheet', () => ({
  MobileBottomSheet: ({ children, isOpen }: any) =>
    isOpen ? <div data-testid="mobile-bottom-sheet">{children}</div> : null,
}));

describe('StaffProfileSheet', () => {
  // Create base mock staff using factory with extended properties
  const mockStaff = {
    ...createMockStaffPersonality({
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
        '/images/portfolio/sarah-5.jpg',
      ],
      bio: 'Expert colorist with 8 years of experience specializing in balayage and color correction.',
      daysOff: [],
    }),
    reviews: [
      {
        id: '1',
        clientName: 'Jane Doe',
        rating: 5,
        comment: 'Amazing work! Sarah is so talented.',
        date: '2024-01-10',
      },
      {
        id: '2',
        clientName: 'John Smith',
        rating: 4,
        comment: 'Great service, very professional.',
        date: '2024-01-08',
      },
    ],
  };

  const defaultProps = {
    staff: mockStaff,
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders staff profile correctly', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Senior Stylist')).toBeInTheDocument();
    expect(screen.getByText('Expert colorist with 8 years of experience')).toBeInTheDocument();
  });

  it('displays portfolio gallery', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    const portfolioImages = screen.getAllByAltText(/Portfolio/);
    expect(portfolioImages).toHaveLength(5);
  });

  it('navigates portfolio images with prev/next buttons', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Should show second image
    expect(screen.getByText('2 / 5')).toBeInTheDocument();

    const prevButton = screen.getByText('Previous');
    fireEvent.click(prevButton);

    // Should show first image
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('shows image indicators for current image', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('switches tabs correctly (About, Reviews, Schedule)', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    // Default to About tab
    expect(screen.getByText('Expert colorist with 8 years of experience')).toBeInTheDocument();

    // Switch to Reviews tab
    const reviewsTab = screen.getByText('Reviews');
    fireEvent.click(reviewsTab);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Amazing work! Sarah is so talented.')).toBeInTheDocument();

    // Switch to Schedule tab
    const scheduleTab = screen.getByText('Schedule');
    fireEvent.click(scheduleTab);

    expect(screen.getByText('Availability Calendar')).toBeInTheDocument();
  });

  it('displays specialties correctly', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    expect(screen.getByText('Hair Color')).toBeInTheDocument();
    expect(screen.getByText('Balayage')).toBeInTheDocument();
    expect(screen.getByText('Haircuts')).toBeInTheDocument();
  });

  it('displays bio or shows default', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    expect(screen.getByText('Expert colorist with 8 years of experience specializing in balayage and color correction.')).toBeInTheDocument();
  });

  it('shows default bio when bio is missing', () => {
    const staffWithoutBio = {
      ...createMockStaffPersonality({ ...mockStaff, bio: '' }),
      bio: null,
      reviews: mockStaff.reviews,
    };

    render(<StaffProfileSheet {...defaultProps} staff={staffWithoutBio} />);

    expect(screen.getByText('Experienced professional ready to provide excellent service.')).toBeInTheDocument();
  });

  it('displays stats correctly', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('127 reviews')).toBeInTheDocument();
    expect(screen.getByText('8 years')).toBeInTheDocument();
    expect(screen.getByText('1,250 bookings')).toBeInTheDocument();
  });

  it('displays reviews correctly', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    const reviewsTab = screen.getByText('Reviews');
    fireEvent.click(reviewsTab);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Amazing work! Sarah is so talented.')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Great service, very professional.')).toBeInTheDocument();
  });

  it('displays review ratings as stars', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    const reviewsTab = screen.getByText('Reviews');
    fireEvent.click(reviewsTab);

    // Check for star ratings
    const stars = screen.getAllByText('★');
    expect(stars.length).toBeGreaterThan(0);
  });

  it('calls onSelect when "Book with [Name]" button is clicked', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    const bookButton = screen.getByText('Book with Sarah Chen');
    fireEvent.click(bookButton);

    expect(defaultProps.onSelect).toHaveBeenCalledWith(defaultProps.staff);
  });

  it('shows message button (future feature)', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('shows favorite button (future feature)', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    expect(screen.getByText('Favorite')).toBeInTheDocument();
  });

  it('shows availability calendar placeholder', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    const scheduleTab = screen.getByText('Schedule');
    fireEvent.click(scheduleTab);

    expect(screen.getByText('Availability Calendar')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('handles empty portfolio gracefully', () => {
    const staffWithoutPortfolio = {
      ...createMockStaffPersonality({ ...mockStaff, portfolio: [] }),
      reviews: mockStaff.reviews,
    };

    render(<StaffProfileSheet {...defaultProps} staff={staffWithoutPortfolio} />);

    expect(screen.getByText('No portfolio images available')).toBeInTheDocument();
  });

  it('handles empty reviews gracefully', () => {
    const staffWithoutReviews = {
      ...createMockStaffPersonality(mockStaff),
      reviews: [],
    };

    render(<StaffProfileSheet {...defaultProps} staff={staffWithoutReviews} />);

    const reviewsTab = screen.getByText('Reviews');
    fireEvent.click(reviewsTab);

    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
  });

  it('handles missing avatar gracefully', () => {
    const staffWithoutAvatar = {
      ...createMockStaffPersonality({ ...mockStaff, avatar: null }),
      reviews: mockStaff.reviews,
    };

    render(<StaffProfileSheet {...defaultProps} staff={staffWithoutAvatar} />);

    expect(screen.getByText('SC')).toBeInTheDocument(); // Initials fallback
  });

  it('formats dates correctly in reviews', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    const reviewsTab = screen.getByText('Reviews');
    fireEvent.click(reviewsTab);

    expect(screen.getByText('Jan 10, 2024')).toBeInTheDocument();
    expect(screen.getByText('Jan 8, 2024')).toBeInTheDocument();
  });

  it('shows working hours in schedule tab', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    const scheduleTab = screen.getByText('Schedule');
    fireEvent.click(scheduleTab);

    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM - 6:00 PM')).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    const nextButton = screen.getByText('Next');
    fireEvent.keyDown(nextButton, { key: 'Enter' });

    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('closes when close button is clicked', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('handles swipe gestures for portfolio navigation', () => {
    render(<StaffProfileSheet {...defaultProps} />);

    const portfolioContainer = screen.getByTestId('portfolio-container');
    
    // Simulate swipe left
    fireEvent.touchStart(portfolioContainer, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(portfolioContainer, { changedTouches: [{ clientX: 50 }] });

    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });
});



