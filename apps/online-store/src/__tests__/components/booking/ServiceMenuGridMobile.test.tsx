import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceMenuGridMobile } from '@/components/booking/ServiceMenuGridMobile';
import { createMockBookingServiceData } from '@/__tests__/factories';

// Create mock service data using factories
const mockGelManicure = createMockBookingServiceData({
  id: '1',
  name: 'Gel Manicure',
  category: 'Nail Services',
  description: 'Premium gel manicure service',
  duration: 60,
  basePrice: 45,
  image: '/images/gel-manicure.jpg',
  featured: true,
  popular: true,
});

const mockPedicure = createMockBookingServiceData({
  id: '2',
  name: 'Pedicure',
  category: 'Nail Services',
  description: 'Relaxing pedicure service',
  duration: 45,
  basePrice: 60,
  image: '/images/pedicure.jpg',
  featured: false,
  popular: true,
});

const mockFacial = createMockBookingServiceData({
  id: '3',
  name: 'Facial',
  category: 'Skin Care',
  description: 'Deep cleansing facial treatment',
  duration: 90,
  basePrice: 80,
  image: '/images/facial.jpg',
  featured: false,
  popular: false,
});

// Mock the bookingDataService
vi.mock('@/lib/services/bookingDataService', () => ({
  bookingDataService: {
    getServices: vi.fn(() => Promise.resolve({
      services: [mockGelManicure, mockPedicure, mockFacial],
    })),
    getFeaturedServices: vi.fn(() => Promise.resolve({
      services: [mockGelManicure],
    })),
  },
}));

// Mock child components
vi.mock('@/components/booking/MobileBottomSheet', () => ({
  MobileBottomSheet: ({ children, isOpen }: any) => 
    isOpen ? <div data-testid="mobile-bottom-sheet">{children}</div> : null,
}));

vi.mock('@/components/booking/ServiceQuickPreview', () => ({
  ServiceQuickPreview: ({ onServiceSelect }: any) => (
    <div data-testid="service-quick-preview">
      <button onClick={() => onServiceSelect({ id: '1', name: 'Gel Manicure' })}>
        Select Service
      </button>
    </div>
  ),
}));

describe('ServiceMenuGridMobile', () => {
  const defaultProps = {
    onServiceSelect: vi.fn(),
    selectedServiceId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads services and featured services', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
      expect(screen.getByText('Pedicure')).toBeInTheDocument();
      expect(screen.getByText('Facial')).toBeInTheDocument();
    });
  });

  it('displays featured services first', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const serviceCards = screen.getAllByTestId(/service-card-/);
      expect(serviceCards[0]).toHaveAttribute('data-testid', 'service-card-1'); // Featured service first
    });
  });

  it('filters services by search', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search services...');
      fireEvent.change(searchInput, { target: { value: 'manicure' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
      expect(screen.queryByText('Pedicure')).not.toBeInTheDocument();
      expect(screen.queryByText('Facial')).not.toBeInTheDocument();
    });
  });

  it('filters services by category pills', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const categoryPill = screen.getByText('Nail Services');
      fireEvent.click(categoryPill);
    });

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
      expect(screen.getByText('Pedicure')).toBeInTheDocument();
      expect(screen.queryByText('Facial')).not.toBeInTheDocument();
    });
  });

  it('changes sort order with dropdown', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const sortDropdown = screen.getByText('Sort by Popularity');
      fireEvent.click(sortDropdown);
    });

    await waitFor(() => {
      const sortByPrice = screen.getByText('Sort by Price');
      fireEvent.click(sortByPrice);
    });

    await waitFor(() => {
      const serviceCards = screen.getAllByTestId(/service-card-/);
      expect(serviceCards[0]).toHaveAttribute('data-testid', 'service-card-1'); // Cheapest first
    });
  });

  it('displays service card with all info', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
      expect(screen.getByText('Premium gel manicure service')).toBeInTheDocument();
      expect(screen.getByText('60 min')).toBeInTheDocument();
      expect(screen.getByText('$45')).toBeInTheDocument();
    });
  });

  it('opens preview sheet when service card is tapped', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const serviceCard = screen.getByText('Gel Manicure');
      fireEvent.click(serviceCard);
    });

    await waitFor(() => {
      expect(screen.getByTestId('mobile-bottom-sheet')).toBeInTheDocument();
      expect(screen.getByTestId('service-quick-preview')).toBeInTheDocument();
    });
  });

  it('shows service details in preview sheet', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const serviceCard = screen.getByText('Gel Manicure');
      fireEvent.click(serviceCard);
    });

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
      expect(screen.getByText('Premium gel manicure service')).toBeInTheDocument();
    });
  });

  it('calls onServiceSelect when service is selected in preview', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const serviceCard = screen.getByText('Gel Manicure');
      fireEvent.click(serviceCard);
    });

    await waitFor(() => {
      const selectButton = screen.getByText('Select Service');
      fireEvent.click(selectButton);
    });

    expect(defaultProps.onServiceSelect).toHaveBeenCalledWith({
      id: '1',
      name: 'Gel Manicure',
    });
  });

  it('shows loading shimmers during fetch', () => {
    // Mock a delayed response
    vi.mocked(require('@/lib/services/bookingDataService').bookingDataService.getServices)
      .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ServiceMenuGridMobile {...defaultProps} />);

    expect(screen.getByTestId('loading-shimmer')).toBeInTheDocument();
  });

  it('shows empty state when no results found', async () => {
    vi.mocked(require('@/lib/services/bookingDataService').bookingDataService.getServices)
      .mockResolvedValueOnce({ services: [] });

    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No services found')).toBeInTheDocument();
    });
  });

  it('shows featured badge on featured services', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });
  });

  it('shows popular badge on popular services', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Popular')).toBeInTheDocument();
    });
  });

  it('shows selected badge on selected service', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} selectedServiceId="1" />);

    await waitFor(() => {
      const selectedCard = screen.getByTestId('service-card-1');
      expect(selectedCard).toHaveClass('border-primary');
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });
  });

  it('renders mobile-first card layout correctly', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const serviceCard = screen.getByTestId('service-card-1');
      expect(serviceCard).toHaveClass('mobile-first');
      expect(serviceCard).toHaveClass('touch-friendly');
    });
  });

  it('handles search with special characters', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search services...');
      fireEvent.change(searchInput, { target: { value: 'gel & manicure' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
    });
  });

  it('clears search when clear button is clicked', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search services...');
      fireEvent.change(searchInput, { target: { value: 'manicure' } });
    });

    await waitFor(() => {
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
      expect(screen.getByText('Pedicure')).toBeInTheDocument();
      expect(screen.getByText('Facial')).toBeInTheDocument();
    });
  });

  it('handles multiple category filters', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const nailServicesPill = screen.getByText('Nail Services');
      fireEvent.click(nailServicesPill);

      const skinCarePill = screen.getByText('Skin Care');
      fireEvent.click(skinCarePill);
    });

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
      expect(screen.getByText('Pedicure')).toBeInTheDocument();
      expect(screen.getByText('Facial')).toBeInTheDocument();
    });
  });

  it('handles sort by duration', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const sortDropdown = screen.getByText('Sort by Popularity');
      fireEvent.click(sortDropdown);
    });

    await waitFor(() => {
      const sortByDuration = screen.getByText('Sort by Duration');
      fireEvent.click(sortByDuration);
    });

    await waitFor(() => {
      const serviceCards = screen.getAllByTestId(/service-card-/);
      expect(serviceCards[0]).toHaveAttribute('data-testid', 'service-card-2'); // Shortest first
    });
  });

  it('handles touch interactions', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const serviceCard = screen.getByTestId('service-card-1');
      
      // Simulate touch events
      fireEvent.touchStart(serviceCard);
      fireEvent.touchEnd(serviceCard);
    });

    await waitFor(() => {
      expect(screen.getByTestId('mobile-bottom-sheet')).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      const serviceCard = screen.getByTestId('service-card-1');
      fireEvent.keyDown(serviceCard, { key: 'Enter' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('mobile-bottom-sheet')).toBeInTheDocument();
    });
  });

  it('handles missing service images gracefully', async () => {
    const serviceWithoutImage = createMockBookingServiceData({
      id: '1',
      name: 'Gel Manicure',
      category: 'Nail Services',
      description: 'Premium gel manicure service',
      duration: 60,
      basePrice: 45,
      image: null, // Missing image
      featured: true,
      popular: true,
    });

    vi.mocked(require('@/lib/services/bookingDataService').bookingDataService.getServices)
      .mockResolvedValueOnce({
        services: [serviceWithoutImage],
      });

    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
      expect(screen.getByTestId('service-image-placeholder')).toBeInTheDocument();
    });
  });

  it('handles service with zero price', async () => {
    const freeService = createMockBookingServiceData({
      id: '1',
      name: 'Free Consultation',
      category: 'Consultation',
      description: 'Free consultation service',
      duration: 30,
      basePrice: 0,
      image: '/images/consultation.jpg',
      featured: false,
      popular: false,
    });

    vi.mocked(require('@/lib/services/bookingDataService').bookingDataService.getServices)
      .mockResolvedValueOnce({
        services: [freeService],
      });

    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });

  it('handles service with zero duration', async () => {
    const instantService = createMockBookingServiceData({
      id: '1',
      name: 'Instant Service',
      category: 'Quick Services',
      description: 'Instant service',
      duration: 0,
      basePrice: 25,
      image: '/images/instant.jpg',
      featured: false,
      popular: false,
    });

    vi.mocked(require('@/lib/services/bookingDataService').bookingDataService.getServices)
      .mockResolvedValueOnce({
        services: [instantService],
      });

    render(<ServiceMenuGridMobile {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Instant')).toBeInTheDocument();
    });
  });
});



