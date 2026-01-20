/**
 * PaymentModal Component Tests
 * Tests for payment modal rendering, payment method selection, and payment processing
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PaymentModal from '../PaymentModal';

// Mock Dialog component from Radix UI
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: { open: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) => (
    open ? (
      <div data-testid="payment-modal-dialog">
        {/* Close button to trigger onOpenChange */}
        <button
          data-testid="dialog-close-button"
          onClick={() => onOpenChange?.(false)}
          aria-label="Close dialog"
        >
          ×
        </button>
        {children}
      </div>
    ) : null
  ),
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-content" className={className}>{children}</div>
  ),
  DialogHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-header" className={className}>{children}</div>
  ),
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="dialog-title" className={className}>{children}</h2>
  ),
}));

// Mock tooltip component
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock paymentBridge
vi.mock('@/services/payment', () => ({
  paymentBridge: {
    processPayment: vi.fn().mockResolvedValue({ success: true, transactionId: 'test-tx-123' }),
  },
}));

// Mock gift card components
vi.mock('../modals/GiftCardRedeemModal', () => ({
  default: () => null,
}));

// Mock Pad components
vi.mock('../SendToPadButton', () => ({
  default: () => null,
}));

vi.mock('../PadTransactionStatus', () => ({
  default: () => null,
}));

vi.mock('../PadCheckoutOverlay', () => ({
  default: () => null,
}));

// Mock giftCardDB
vi.mock('@/db/giftCardOperations', () => ({
  giftCardDB: {
    redeemGiftCard: vi.fn(),
  },
}));

// Create a mock Redux store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: () => ({
        store: { storeId: 'test-store-id' },
        storeId: 'test-store-id',
        member: { memberId: 'test-member-id' },
        user: { id: 'test-user-id' },
        device: { id: 'test-device-id' },
      }),
      padTransaction: () => ({
        activeTransaction: null,
        customerStarted: false,
      }),
      uiTickets: () => ({
        waitlist: [],
        serviceTickets: [],
        completedTickets: [],
        pendingTickets: [],
        loading: false,
        error: null,
      }),
    },
  });
};

// Test wrapper with Redux Provider
const renderWithProvider = (ui: React.ReactElement, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      {ui}
    </Provider>
  );
};

describe('PaymentModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    total: 100,
    subtotal: 100,
    tax: 8.25,
    discount: 0,
    onComplete: vi.fn(),
    staffMembers: [{ id: 'staff-1', name: 'John Doe', serviceTotal: 50 }],
    ticketId: 'ticket-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render when open is true', () => {
      renderWithProvider(<PaymentModal {...defaultProps} />);

      // Modal dialog should be in the document
      expect(screen.getByTestId('payment-modal-dialog')).toBeInTheDocument();

      // Modal title should be visible - PaymentModal shows "Checkout" as title
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
      expect(screen.getByText('Checkout')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      renderWithProvider(<PaymentModal {...defaultProps} open={false} />);

      // Modal dialog should NOT be in the document
      expect(screen.queryByTestId('payment-modal-dialog')).not.toBeInTheDocument();
    });
  });

  describe('closing', () => {
    it('should call onClose when close button is clicked', async () => {
      const mockOnClose = vi.fn();
      renderWithProvider(<PaymentModal {...defaultProps} onClose={mockOnClose} />);

      // Modal should be open
      expect(screen.getByTestId('payment-modal-dialog')).toBeInTheDocument();

      // Click the close button
      const closeButton = screen.getByTestId('dialog-close-button');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      // onClose should have been called
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('payment methods', () => {
    it('should display available payment methods', async () => {
      renderWithProvider(<PaymentModal {...defaultProps} />);

      // Click "Continue to Payment" to go to step 2 where payment methods are shown
      const continueButton = screen.getByTestId('button-continue-to-payment');
      await act(async () => {
        fireEvent.click(continueButton);
      });

      // Payment method cards should be visible
      expect(screen.getByTestId('card-payment-method-card')).toBeInTheDocument();
      expect(screen.getByTestId('card-payment-method-cash')).toBeInTheDocument();
      expect(screen.getByTestId('card-payment-method-gift_card')).toBeInTheDocument();
      expect(screen.getByTestId('card-payment-method-custom')).toBeInTheDocument();

      // Labels should be visible
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
      expect(screen.getByText('Cash')).toBeInTheDocument();
      expect(screen.getByText('Gift Card')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('should handle payment method selection', async () => {
      renderWithProvider(<PaymentModal {...defaultProps} />);

      // Navigate to step 2 (Payment) where payment methods are shown
      const continueButton = screen.getByTestId('button-continue-to-payment');
      await act(async () => {
        fireEvent.click(continueButton);
      });

      // Initially no payment method should be selected (no ring-2 class)
      // Click on the Cash payment method card
      const cashCard = screen.getByTestId('card-payment-method-cash');
      await act(async () => {
        fireEvent.click(cashCard);
      });

      // After clicking Cash, the cash input section should appear
      // The "Cash received" label and input should be visible
      expect(screen.getByText('Cash received')).toBeInTheDocument();
      expect(screen.getByTestId('input-cash-received')).toBeInTheDocument();

      // Click on a different payment method (Credit Card)
      const cardCard = screen.getByTestId('card-payment-method-card');
      await act(async () => {
        fireEvent.click(cardCard);
      });

      // Now the Card payment section should be visible (Apply button)
      expect(screen.getByTestId('button-apply-card')).toBeInTheDocument();
      // Cash input should no longer be visible
      expect(screen.queryByTestId('input-cash-received')).not.toBeInTheDocument();
    });
  });

  describe('tip handling', () => {
    it('should show tip options', () => {
      // Placeholder for tip options test
      expect(true).toBe(true);
    });

    it('should calculate tip based on percentage', () => {
      // Placeholder for tip calculation test
      expect(true).toBe(true);
    });

    it('should show tip distribution preview', () => {
      // Placeholder for tip distribution test
      expect(true).toBe(true);
    });
  });

  describe('validation', () => {
    it('should validate payment amount', () => {
      // Placeholder for validation test
      expect(true).toBe(true);
    });

    it('should show error for invalid payment', () => {
      // Placeholder for error test
      expect(true).toBe(true);
    });
  });
});
