import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceQuickPreview } from '@/components/booking/ServiceQuickPreview';

// Mock the bookingDataService
vi.mock('@/lib/services/bookingDataService', () => ({
  bookingDataService: {
    getServices: vi.fn(() => Promise.resolve({
      services: [
        {
          id: '1',
          name: 'Gel Manicure',
          category: 'Nail Services',
          description: 'Premium gel manicure service',
          duration: 60,
          basePrice: 45,
          image: '/images/gel-manicure.jpg',
          featured: true,
          popular: true,
        },
        {
          id: '2',
          name: 'Pedicure',
          category: 'Nail Services',
          description: 'Relaxing pedicure service',
          duration: 45,
          basePrice: 60,
          image: '/images/pedicure.jpg',
          featured: false,
          popular: true,
        },
        {
          id: '3',
          name: 'Facial',
          category: 'Skin Care',
          description: 'Deep cleansing facial treatment',
          duration: 90,
          basePrice: 80,
          image: '/images/facial.jpg',
          featured: false,
          popular: false,
        },
      ],
    })),
    getFeaturedServices: vi.fn(() => Promise.resolve({
      services: [
        {
          id: '1',
          name: 'Gel Manicure',
          category: 'Nail Services',
          description: 'Premium gel manicure service',
          duration: 60,
          basePrice: 45,
          image: '/images/gel-manicure.jpg',
          featured: true,
          popular: true,
        },
      ],
    })),
  },
}));

describe('ServiceQuickPreview', () => {
  const defaultProps = {
    onServiceSelect: vi.fn(),
    selectedServiceId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads services on mount', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
      expect(screen.getByText('Pedicure')).toBeInTheDocument();
      expect(screen.getByText('Facial')).toBeInTheDocument();
    });
  });

  it('filters services by search term', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

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

  it('filters services by category', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      const categoryButton = screen.getByText('Nail Services');
      fireEvent.click(categoryButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
      expect(screen.getByText('Pedicure')).toBeInTheDocument();
      expect(screen.queryByText('Facial')).not.toBeInTheDocument();
    });
  });

  it('calls onServiceSelect when service is selected', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      const serviceCard = screen.getByText('Gel Manicure');
      fireEvent.click(serviceCard);
    });

    expect(defaultProps.onServiceSelect).toHaveBeenCalledWith({
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
  });

  it('shows visual indicator for selected service', async () => {
    render(<ServiceQuickPreview {...defaultProps} selectedServiceId="1" />);

    await waitFor(() => {
      const selectedCard = screen.getByTestId('service-card-1');
      expect(selectedCard).toHaveClass('border-primary');
    });
  });

  it('shows loading shimmer during fetch', () => {
    // Mock a delayed response
    vi.mocked(require('@/lib/services/bookingDataService').bookingDataService.getServices)
      .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ServiceQuickPreview {...defaultProps} />);

    expect(screen.getByTestId('loading-shimmer')).toBeInTheDocument();
  });

  it('shows empty state when no services found', async () => {
    vi.mocked(require('@/lib/services/bookingDataService').bookingDataService.getServices)
      .mockResolvedValueOnce({ services: [] });

    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No services found')).toBeInTheDocument();
    });
  });

  it('displays service cards with all information', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      const serviceCard = screen.getByText('Gel Manicure');
      expect(serviceCard).toBeInTheDocument();
      
      // Check for service details
      expect(screen.getByText('Premium gel manicure service')).toBeInTheDocument();
      expect(screen.getByText('60 min')).toBeInTheDocument();
      expect(screen.getByText('$45')).toBeInTheDocument();
    });
  });

  it('shows popular badge for popular services', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Popular')).toBeInTheDocument();
    });
  });

  it('shows service image or fallback', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      const serviceImage = screen.getByAltText('Gel Manicure');
      expect(serviceImage).toBeInTheDocument();
      expect(serviceImage).toHaveAttribute('src', '/images/gel-manicure.jpg');
    });
  });

  it('formats duration and price correctly', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('60 min')).toBeInTheDocument();
      expect(screen.getByText('$45')).toBeInTheDocument();
    });
  });

  it('performs case-insensitive search', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search services...');
      fireEvent.change(searchInput, { target: { value: 'MANICURE' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
    });
  });

  it('works with multiple filters together', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      // Apply category filter
      const categoryButton = screen.getByText('Nail Services');
      fireEvent.click(categoryButton);

      // Apply search filter
      const searchInput = screen.getByPlaceholderText('Search services...');
      fireEvent.change(searchInput, { target: { value: 'gel' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
      expect(screen.queryByText('Pedicure')).not.toBeInTheDocument();
      expect(screen.queryByText('Facial')).not.toBeInTheDocument();
    });
  });

  it('clears filters when clear button is clicked', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      // Apply a filter
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

  it('sorts services by popularity', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      const sortButton = screen.getByText('Sort by Popularity');
      fireEvent.click(sortButton);
    });

    await waitFor(() => {
      const serviceCards = screen.getAllByTestId(/service-card-/);
      expect(serviceCards[0]).toHaveAttribute('data-testid', 'service-card-1'); // Popular service first
    });
  });

  it('sorts services by price', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      const sortButton = screen.getByText('Sort by Price');
      fireEvent.click(sortButton);
    });

    await waitFor(() => {
      const serviceCards = screen.getAllByTestId(/service-card-/);
      expect(serviceCards[0]).toHaveAttribute('data-testid', 'service-card-1'); // Cheapest first
    });
  });

  it('sorts services by duration', async () => {
    render(<ServiceQuickPreview {...defaultProps} />);

    await waitFor(() => {
      const sortButton = screen.getByText('Sort by Duration');
      fireEvent.click(sortButton);
    });

    await waitFor(() => {
      const serviceCards = screen.getAllByTestId(/service-card-/);
      expect(serviceCards[0]).toHaveAttribute('data-testid', 'service-card-2'); // Shortest first
    });
  });
});



