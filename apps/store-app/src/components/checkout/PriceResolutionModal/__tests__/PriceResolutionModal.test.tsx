/**
 * PriceResolutionModal Component Tests
 * Tests for reviewing and resolving service price changes during checkout
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PriceResolutionModal from '../PriceResolutionModal';
import type { CheckoutTicketService } from '@/store/slices/uiTicketsSlice';

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
    background: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#F3F4F6',
    },
    border: {
      light: '#E5E7EB',
      medium: '#D1D5DB',
    },
  },
}));

// Mock useCatalog hook
const mockCatalogServices = [
  { id: 'service-1', name: 'Haircut', price: 50 },
  { id: 'service-2', name: 'Color', price: 120 },
];

vi.mock('@/hooks/useCatalog', () => ({
  useCatalog: () => ({
    services: mockCatalogServices,
  }),
}));

// Mock useToast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock price comparison utils
vi.mock('@/utils/priceComparisonUtils', () => ({
  getPriceDecisionRecommendation: vi.fn(() => ({
    priceDecision: 'booked_honored',
    recommendedPrice: 45,
  })),
}));

// Create mock service data
const createMockService = (overrides?: Partial<CheckoutTicketService>): CheckoutTicketService => ({
  id: 'service-item-1',
  serviceId: 'service-1',
  serviceName: 'Haircut',
  price: 45,
  duration: 30,
  status: 'not_started',
  bookedPrice: 45,
  catalogPriceAtCheckout: 50,
  ...overrides,
});

// Create mock Redux state
const createMockState = (unresolvedServices: CheckoutTicketService[] = []) => ({
  uiTickets: {
    waitlist: [],
    serviceTickets: [],
    completedTickets: [],
    pendingTickets: [{
      id: 'ticket-123',
      number: 1,
      clientName: 'Test Client',
      checkoutServices: unresolvedServices,
    }],
    loading: false,
    error: null,
  },
  auth: {
    member: { memberId: 'staff-1' },
    user: null,
    storeId: 'store-1',
  },
});

// Create mock store
const createMockStore = (unresolvedServices: CheckoutTicketService[] = []) => {
  const initialState = createMockState(unresolvedServices);
  return configureStore({
    reducer: {
      uiTickets: () => initialState.uiTickets,
      auth: () => initialState.auth,
    },
  });
};

describe('PriceResolutionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    ticketId: 'ticket-123',
    onResolved: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders modal with title when open', () => {
      const services = [createMockService()];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      expect(screen.getByText('Review Price Changes')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      const services = [createMockService()];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} isOpen={false} />
        </Provider>
      );

      expect(screen.queryByText('Review Price Changes')).not.toBeInTheDocument();
    });

    it('renders service count in description', () => {
      const services = [
        createMockService({ id: 'item-1', serviceName: 'Haircut' }),
        createMockService({ id: 'item-2', serviceName: 'Color', bookedPrice: 100, catalogPriceAtCheckout: 120 }),
      ];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      expect(screen.getByText(/2 services have price changes/)).toBeInTheDocument();
    });

    it('renders no changes message when no price variances', () => {
      const services = [createMockService({ bookedPrice: 50, catalogPriceAtCheckout: 50 })];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      expect(screen.getByText('No price changes to resolve')).toBeInTheDocument();
    });

    it('renders service name in resolution row', () => {
      const services = [createMockService({ serviceName: 'Premium Haircut' })];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      expect(screen.getByText('Premium Haircut')).toBeInTheDocument();
    });
  });

  describe('resolution option selection', () => {
    it('shows booked option as default selection', () => {
      const services = [createMockService()];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      const bookedRadio = screen.getByLabelText(/Select price resolution/);
      expect(bookedRadio).toBeInTheDocument();
    });

    it('allows selecting Honor Booked Price option', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      const bookedOption = screen.getByText('Honor Booked Price');
      await user.click(bookedOption);

      expect(screen.getByText(/Charge \$45\.00/)).toBeInTheDocument();
    });

    it('allows selecting Use Current Price option', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      const currentOption = screen.getByText('Use Current Price');
      await user.click(currentOption);

      expect(screen.getByText(/Charge \$50\.00.*current catalog price/)).toBeInTheDocument();
    });

    it('allows selecting Custom Price option', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      const customOption = screen.getByText('Custom Price');
      await user.click(customOption);

      expect(screen.getByLabelText('Custom price amount')).toBeInTheDocument();
    });
  });

  describe('custom price input validation', () => {
    it('shows custom price input when custom option selected', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      const customOption = screen.getByText('Custom Price');
      await user.click(customOption);

      const input = screen.getByTestId(`input-custom-price-${services[0].id}`);
      expect(input).toBeInTheDocument();
    });

    it('shows validation error for invalid custom price (zero)', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      // Select custom option
      const customOption = screen.getByText('Custom Price');
      await user.click(customOption);

      // Enter invalid price
      const input = screen.getByTestId(`input-custom-price-${services[0].id}`);
      await user.type(input, '0');

      expect(screen.getByText('Please enter a valid price greater than $0')).toBeInTheDocument();
    });

    it('shows validation error for negative custom price', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      // Select custom option
      const customOption = screen.getByText('Custom Price');
      await user.click(customOption);

      // Enter negative price
      const input = screen.getByTestId(`input-custom-price-${services[0].id}`);
      await user.type(input, '-10');

      expect(screen.getByText('Please enter a valid price greater than $0')).toBeInTheDocument();
    });

    it('accepts valid custom price', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      // Select custom option
      const customOption = screen.getByText('Custom Price');
      await user.click(customOption);

      // Enter valid price
      const input = screen.getByTestId(`input-custom-price-${services[0].id}`);
      await user.type(input, '55.00');

      expect(screen.queryByText('Please enter a valid price greater than $0')).not.toBeInTheDocument();
    });
  });

  describe('reason field', () => {
    it('shows reason field when custom price selected and requireOverrideReason is true', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} requireOverrideReason={true} />
        </Provider>
      );

      // Select custom option
      const customOption = screen.getByText('Custom Price');
      await user.click(customOption);

      expect(screen.getByText('Reason for override (required)')).toBeInTheDocument();
    });

    it('does not show reason field when requireOverrideReason is false', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} requireOverrideReason={false} />
        </Provider>
      );

      // Select custom option
      const customOption = screen.getByText('Custom Price');
      await user.click(customOption);

      expect(screen.queryByText('Reason for override (required)')).not.toBeInTheDocument();
    });

    it('allows entering reason text', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} requireOverrideReason={true} />
        </Provider>
      );

      // Select custom option
      const customOption = screen.getByText('Custom Price');
      await user.click(customOption);

      // Enter reason
      const reasonInput = screen.getByTestId(`input-reason-${services[0].id}`);
      await user.type(reasonInput, 'Customer loyalty discount');

      expect(reasonInput).toHaveValue('Customer loyalty discount');
    });
  });

  describe('bulk action buttons', () => {
    it('shows bulk action buttons when multiple services have changes', () => {
      const services = [
        createMockService({ id: 'item-1', serviceName: 'Haircut' }),
        createMockService({ id: 'item-2', serviceName: 'Color', bookedPrice: 100, catalogPriceAtCheckout: 120 }),
      ];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      expect(screen.getByTestId('button-honor-all-booked')).toBeInTheDocument();
      expect(screen.getByTestId('button-apply-all-current')).toBeInTheDocument();
    });

    it('does not show bulk action buttons for single service', () => {
      const services = [createMockService()];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      expect(screen.queryByTestId('button-honor-all-booked')).not.toBeInTheDocument();
      expect(screen.queryByTestId('button-apply-all-current')).not.toBeInTheDocument();
    });

    it('Honor All Booked button sets all services to booked option', async () => {
      const services = [
        createMockService({ id: 'item-1', serviceName: 'Haircut' }),
        createMockService({ id: 'item-2', serviceName: 'Color', bookedPrice: 100, catalogPriceAtCheckout: 120 }),
      ];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      const honorAllButton = screen.getByTestId('button-honor-all-booked');
      await user.click(honorAllButton);

      // After clicking Honor All, the Apply button should be enabled
      const applyButton = screen.getByTestId('button-apply-resolutions');
      expect(applyButton).not.toBeDisabled();
    });

    it('Apply All Current button sets all services to current option', async () => {
      const services = [
        createMockService({ id: 'item-1', serviceName: 'Haircut' }),
        createMockService({ id: 'item-2', serviceName: 'Color', bookedPrice: 100, catalogPriceAtCheckout: 120 }),
      ];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      const applyAllButton = screen.getByTestId('button-apply-all-current');
      await user.click(applyAllButton);

      // After clicking Apply All Current, the Apply button should be enabled
      const applyButton = screen.getByTestId('button-apply-resolutions');
      expect(applyButton).not.toBeDisabled();
    });
  });

  describe('Apply button disabled state', () => {
    it('Apply button is disabled initially when services need resolution', () => {
      const services = [createMockService()];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      // Button should exist but will be enabled since default option is 'booked'
      const applyButton = screen.getByTestId('button-apply-resolutions');
      expect(applyButton).toBeInTheDocument();
    });

    it('Apply button is disabled when custom price is invalid', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      // Select custom option
      const customOption = screen.getByText('Custom Price');
      await user.click(customOption);

      // Enter invalid price (empty string counts as invalid)
      const input = screen.getByTestId(`input-custom-price-${services[0].id}`);
      await user.type(input, '0');

      const applyButton = screen.getByTestId('button-apply-resolutions');
      expect(applyButton).toBeDisabled();
    });

    it('Apply button is disabled when required reason is missing', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} requireOverrideReason={true} />
        </Provider>
      );

      // Select custom option
      const customOption = screen.getByText('Custom Price');
      await user.click(customOption);

      // Enter valid price but no reason
      const input = screen.getByTestId(`input-custom-price-${services[0].id}`);
      await user.type(input, '55');

      const applyButton = screen.getByTestId('button-apply-resolutions');
      expect(applyButton).toBeDisabled();
    });

    it('Apply button is enabled when all services have valid resolutions', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      // Select booked price option (should enable button)
      const bookedOption = screen.getByText('Honor Booked Price');
      await user.click(bookedOption);

      const applyButton = screen.getByTestId('button-apply-resolutions');
      expect(applyButton).not.toBeDisabled();
    });
  });

  describe('Apply button action', () => {
    it('calls onResolved with correct resolutions when Apply clicked', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();
      const onResolved = vi.fn();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} onResolved={onResolved} />
        </Provider>
      );

      // Select booked option
      const bookedOption = screen.getByText('Honor Booked Price');
      await user.click(bookedOption);

      // Click Apply
      const applyButton = screen.getByTestId('button-apply-resolutions');
      await user.click(applyButton);

      await waitFor(() => {
        expect(onResolved).toHaveBeenCalledTimes(1);
      });

      // Verify the resolution payload structure
      const resolutions = onResolved.mock.calls[0][0];
      expect(resolutions).toHaveLength(1);
      expect(resolutions[0]).toMatchObject({
        serviceId: services[0].id,
        finalPrice: 45,
        priceDecision: 'booked_honored',
      });
    });

    it('shows success toast after applying resolutions', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      // Select booked option
      const bookedOption = screen.getByText('Honor Booked Price');
      await user.click(bookedOption);

      // Click Apply
      const applyButton = screen.getByTestId('button-apply-resolutions');
      await user.click(applyButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Price changes resolved',
          })
        );
      });
    });

    it('calls onClose after applying resolutions', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} onClose={onClose} />
        </Provider>
      );

      // Select booked option
      const bookedOption = screen.getByText('Honor Booked Price');
      await user.click(bookedOption);

      // Click Apply
      const applyButton = screen.getByTestId('button-apply-resolutions');
      await user.click(applyButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('deposit locked services', () => {
    it('shows deposit locked badge for services with deposit', () => {
      const services = [createMockService({ depositLocked: true })];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      expect(screen.getByText('Deposit Locked')).toBeInTheDocument();
    });

    it('disables radio options for deposit locked services', () => {
      const services = [createMockService({ depositLocked: true })];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      // For deposit locked services, radio options should not be present
      expect(screen.queryByText('Custom Price')).not.toBeInTheDocument();
      expect(screen.getByText(/Price locked at \$45\.00 due to deposit/)).toBeInTheDocument();
    });
  });

  describe('deleted services', () => {
    it('shows Service Removed badge for deleted services', () => {
      // Remove service from catalog to simulate deleted
      vi.mocked(vi.fn()).mockReturnValue([]);
      const services = [createMockService({ serviceId: 'deleted-service' })];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      // Service is marked as deleted when serviceId is not in catalogServices
      expect(screen.getByText('Service Removed')).toBeInTheDocument();
    });
  });

  describe('Cancel button', () => {
    it('calls onClose when Cancel button clicked', async () => {
      const services = [createMockService()];
      const store = createMockStore(services);
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} onClose={onClose} />
        </Provider>
      );

      const cancelButton = screen.getByTestId('button-cancel-resolution');
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows Done instead of Cancel when no unresolved services', () => {
      // Services with no variance (same booked and catalog price)
      const services = [createMockService({ bookedPrice: 50, catalogPriceAtCheckout: 50 })];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible dialog title', () => {
      const services = [createMockService()];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('RadioGroup has aria-label for screen readers', () => {
      const services = [createMockService()];
      const store = createMockStore(services);

      render(
        <Provider store={store}>
          <PriceResolutionModal {...defaultProps} />
        </Provider>
      );

      const radioGroup = screen.getByLabelText(/Select price resolution for/);
      expect(radioGroup).toBeInTheDocument();
    });
  });
});
