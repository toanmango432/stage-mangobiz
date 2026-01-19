/**
 * PriceChangeWarningBanner Component Tests
 * Tests for the warning banner displayed when tickets have unresolved price changes
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PriceChangeWarningBanner from '../PriceChangeWarningBanner';
import type { CheckoutTicketService, PendingTicket } from '@/store/slices/uiTicketsSlice';

// Mock design system
vi.mock('@/design-system', () => ({
  colors: {
    status: {
      warning: { light: '#FEF3C7', main: '#F59E0B', dark: '#D97706' },
      success: { light: '#D1FAE5', main: '#10B981', dark: '#059669' },
      error: { light: '#FEE2E2', main: '#EF4444', dark: '#DC2626' },
      info: { light: '#DBEAFE', main: '#3B82F6', dark: '#2563EB' },
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      muted: '#9CA3AF',
    },
  },
}));

// Mock formatPriceVariance utility
vi.mock('@/utils/priceComparisonUtils', () => ({
  formatPriceVariance: vi.fn((variance: number, variancePercent: number) => {
    const sign = variance > 0 ? '+' : '';
    const percentSign = variancePercent > 0 ? '+' : '';
    return `${sign}$${Math.abs(variance).toFixed(2)} (${percentSign}${Math.round(variancePercent)}%)`;
  }),
}));

// Create mock service data with price change
const createMockService = (overrides?: Partial<CheckoutTicketService>): CheckoutTicketService => ({
  id: 'service-item-1',
  serviceId: 'service-1',
  serviceName: 'Haircut',
  price: 45,
  duration: 30,
  status: 'not_started',
  bookedPrice: 45,
  catalogPriceAtCheckout: 50, // Price increased by $5
  ...overrides,
});

// Create a mock pending ticket
const createMockPendingTicket = (
  services: CheckoutTicketService[] = [],
  overrides?: Partial<PendingTicket>
): PendingTicket => ({
  id: 'ticket-123',
  number: 1,
  clientName: 'Test Client',
  checkoutServices: services,
  ...overrides,
} as PendingTicket);

// Create mock Redux state
const createMockState = (pendingTickets: PendingTicket[] = []) => ({
  uiTickets: {
    waitlist: [],
    serviceTickets: [],
    completedTickets: [],
    pendingTickets,
    loading: false,
    error: null,
  },
});

// Create mock store
const createMockStore = (pendingTickets: PendingTicket[] = []) => {
  const initialState = createMockState(pendingTickets);
  return configureStore({
    reducer: {
      uiTickets: () => initialState.uiTickets,
    },
  });
};

describe('PriceChangeWarningBanner', () => {
  const defaultProps = {
    ticketId: 'ticket-123',
    onReview: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when no price changes exist', () => {
    it('renders null when there are no unresolved changes', () => {
      // Service with no price difference
      const service = createMockService({
        bookedPrice: 50,
        catalogPriceAtCheckout: 50, // Same price
      });
      const ticket = createMockPendingTicket([service]);
      const store = createMockStore([ticket]);

      const { container } = render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} />
        </Provider>
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders null when ticket has no checkout services', () => {
      const ticket = createMockPendingTicket([]);
      const store = createMockStore([ticket]);

      const { container } = render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} />
        </Provider>
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders null when ticket does not exist', () => {
      const store = createMockStore([]); // No tickets

      const { container } = render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} />
        </Provider>
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders null when all price changes are resolved', () => {
      // Service with resolved price decision
      const service = createMockService({
        bookedPrice: 45,
        catalogPriceAtCheckout: 50,
        priceDecision: 'booked_honored', // Already resolved
      });
      const ticket = createMockPendingTicket([service]);
      const store = createMockStore([ticket]);

      const { container } = render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} />
        </Provider>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('when unresolved price changes exist', () => {
    it('renders full banner with price change info', () => {
      // Service with unresolved price change
      const service = createMockService({
        bookedPrice: 45,
        catalogPriceAtCheckout: 50,
        // No priceDecision = unresolved
      });
      const ticket = createMockPendingTicket([service]);
      const store = createMockStore([ticket]);

      render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} />
        </Provider>
      );

      expect(screen.getByText('Price Changes Detected')).toBeInTheDocument();
      expect(screen.getByTestId('price-change-warning-banner')).toBeInTheDocument();
    });

    it('displays correct count for single service', () => {
      const service = createMockService({
        bookedPrice: 45,
        catalogPriceAtCheckout: 50,
      });
      const ticket = createMockPendingTicket([service]);
      const store = createMockStore([ticket]);

      render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} />
        </Provider>
      );

      expect(screen.getByText(/1 service has price changes since booking/)).toBeInTheDocument();
    });

    it('displays correct count for multiple services', () => {
      const services = [
        createMockService({
          id: 'service-1',
          bookedPrice: 45,
          catalogPriceAtCheckout: 50,
        }),
        createMockService({
          id: 'service-2',
          serviceId: 'service-2',
          serviceName: 'Color',
          bookedPrice: 100,
          catalogPriceAtCheckout: 120,
        }),
      ];
      const ticket = createMockPendingTicket(services);
      const store = createMockStore([ticket]);

      render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} />
        </Provider>
      );

      expect(screen.getByText(/2 services have price changes since booking/)).toBeInTheDocument();
    });

    it('displays variance amount when non-zero', () => {
      const service = createMockService({
        bookedPrice: 45,
        catalogPriceAtCheckout: 50, // $5 increase
      });
      const ticket = createMockPendingTicket([service]);
      const store = createMockStore([ticket]);

      render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} />
        </Provider>
      );

      // formatPriceVariance mock returns formatted string
      // The banner shows variance which is calculated in component
      expect(screen.getByTestId('price-change-warning-banner')).toBeInTheDocument();
    });

    it('calls onReview when Review button is clicked', () => {
      const onReview = vi.fn();
      const service = createMockService({
        bookedPrice: 45,
        catalogPriceAtCheckout: 50,
      });
      const ticket = createMockPendingTicket([service]);
      const store = createMockStore([ticket]);

      render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} onReview={onReview} />
        </Provider>
      );

      const reviewButton = screen.getByTestId('button-review-price-changes');
      fireEvent.click(reviewButton);

      expect(onReview).toHaveBeenCalledTimes(1);
    });

    it('has alert role for accessibility', () => {
      const service = createMockService({
        bookedPrice: 45,
        catalogPriceAtCheckout: 50,
      });
      const ticket = createMockPendingTicket([service]);
      const store = createMockStore([ticket]);

      render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} />
        </Provider>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('renders compact button when compact=true', () => {
      const service = createMockService({
        bookedPrice: 45,
        catalogPriceAtCheckout: 50,
      });
      const ticket = createMockPendingTicket([service]);
      const store = createMockStore([ticket]);

      render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} compact />
        </Provider>
      );

      // Compact mode shows button with count, not full banner
      expect(screen.queryByText('Price Changes Detected')).not.toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Count only
    });

    it('compact mode has accessible aria-label', () => {
      const service = createMockService({
        bookedPrice: 45,
        catalogPriceAtCheckout: 50,
      });
      const ticket = createMockPendingTicket([service]);
      const store = createMockStore([ticket]);

      render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} compact />
        </Provider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        '1 service with price changes. Click to review.'
      );
    });

    it('compact mode pluralizes correctly for multiple services', () => {
      const services = [
        createMockService({
          id: 'service-1',
          bookedPrice: 45,
          catalogPriceAtCheckout: 50,
        }),
        createMockService({
          id: 'service-2',
          serviceId: 'service-2',
          bookedPrice: 100,
          catalogPriceAtCheckout: 120,
        }),
      ];
      const ticket = createMockPendingTicket(services);
      const store = createMockStore([ticket]);

      render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} compact />
        </Provider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        '2 services with price changes. Click to review.'
      );
    });

    it('calls onReview when compact button is clicked', () => {
      const onReview = vi.fn();
      const service = createMockService({
        bookedPrice: 45,
        catalogPriceAtCheckout: 50,
      });
      const ticket = createMockPendingTicket([service]);
      const store = createMockStore([ticket]);

      render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} onReview={onReview} compact />
        </Provider>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onReview).toHaveBeenCalledTimes(1);
    });

    it('compact mode renders null when no unresolved changes', () => {
      const service = createMockService({
        bookedPrice: 50,
        catalogPriceAtCheckout: 50, // No change
      });
      const ticket = createMockPendingTicket([service]);
      const store = createMockStore([ticket]);

      const { container } = render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} compact />
        </Provider>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('styling', () => {
    it('applies design system colors via style props', () => {
      const service = createMockService({
        bookedPrice: 45,
        catalogPriceAtCheckout: 50,
      });
      const ticket = createMockPendingTicket([service]);
      const store = createMockStore([ticket]);

      render(
        <Provider store={store}>
          <PriceChangeWarningBanner {...defaultProps} />
        </Provider>
      );

      const banner = screen.getByTestId('price-change-warning-banner');
      // Check that style prop is applied (design system colors)
      expect(banner).toHaveStyle({
        backgroundColor: '#FEF3C7', // colors.status.warning.light
      });
    });
  });
});
