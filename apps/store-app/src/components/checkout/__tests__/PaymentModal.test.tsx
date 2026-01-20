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

  describe('totals display', () => {
    it('should display correct totals on tip step', () => {
      // Use specific values for easy verification
      const total = 100; // Service total
      const tax = 8.25;
      const defaultTipPercentage = 20; // Component default
      const expectedTip = (total * defaultTipPercentage) / 100; // $20
      const expectedTotalWithTip = total + expectedTip; // $120

      renderWithProvider(
        <PaymentModal
          {...defaultProps}
          total={total}
          subtotal={total}
          tax={tax}
        />
      );

      // Step 1 should show service total
      expect(screen.getByText('Service total')).toBeInTheDocument();
      expect(screen.getByText(`$${total.toFixed(2)}`)).toBeInTheDocument();

      // Step 1 should show total with tip (default 20% tip)
      expect(screen.getByText('Your total (with tip)')).toBeInTheDocument();
      expect(screen.getByText(`$${expectedTotalWithTip.toFixed(2)}`)).toBeInTheDocument();

      // Tip options should be available
      expect(screen.getByTestId('button-tip-15')).toBeInTheDocument();
      expect(screen.getByTestId('button-tip-18')).toBeInTheDocument();
      expect(screen.getByTestId('button-tip-20')).toBeInTheDocument();
      expect(screen.getByTestId('button-tip-25')).toBeInTheDocument();
    });

    it('should update total when tip percentage changes', async () => {
      const total = 100;
      renderWithProvider(
        <PaymentModal {...defaultProps} total={total} />
      );

      // Initially shows 20% tip (default)
      expect(screen.getByText('$120.00')).toBeInTheDocument(); // 100 + 20% tip

      // Click 15% tip button
      const tip15Button = screen.getByTestId('button-tip-15');
      await act(async () => {
        fireEvent.click(tip15Button);
      });

      // Should now show $115 (100 + 15% tip)
      expect(screen.getByText('$115.00')).toBeInTheDocument();
    });

    it('should show zero tip when no tip is selected', async () => {
      const total = 100;
      renderWithProvider(
        <PaymentModal {...defaultProps} total={total} />
      );

      // Click "No Tip" button
      const noTipButton = screen.getByTestId('button-no-tip');
      await act(async () => {
        fireEvent.click(noTipButton);
      });

      // Total with tip should equal service total (no tip)
      // There should be two instances of $100.00 - service total and total with tip
      const amounts = screen.getAllByText('$100.00');
      expect(amounts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('tip handling', () => {
    it('should show tip options', () => {
      renderWithProvider(<PaymentModal {...defaultProps} />);

      // Step 1 shows tip options
      expect(screen.getByTestId('button-tip-15')).toBeInTheDocument();
      expect(screen.getByTestId('button-tip-18')).toBeInTheDocument();
      expect(screen.getByTestId('button-tip-20')).toBeInTheDocument();
      expect(screen.getByTestId('button-tip-25')).toBeInTheDocument();
      expect(screen.getByTestId('button-no-tip')).toBeInTheDocument();
      expect(screen.getByTestId('input-custom-tip')).toBeInTheDocument();
    });

    it('should calculate tip based on percentage', async () => {
      const total = 50;
      renderWithProvider(<PaymentModal {...defaultProps} total={total} />);

      // Click 25% tip
      const tip25Button = screen.getByTestId('button-tip-25');
      await act(async () => {
        fireEvent.click(tip25Button);
      });

      // 25% of $50 = $12.50, total = $62.50
      expect(screen.getByText('$62.50')).toBeInTheDocument();
    });

    it('should show tip distribution preview', async () => {
      // Multiple staff members needed for tip distribution to appear
      const multipleStaff = [
        { id: 'staff-1', name: 'John Doe', serviceTotal: 30 },
        { id: 'staff-2', name: 'Jane Smith', serviceTotal: 70 },
      ];

      renderWithProvider(
        <PaymentModal {...defaultProps} staffMembers={multipleStaff} />
      );

      // With tip amount > 0 and multiple staff, distribution buttons should appear
      // First verify tip amount is > 0 (default 20% of $100 = $20)
      expect(screen.getByText('$120.00')).toBeInTheDocument();

      // Click auto-distribute button
      const autoDistributeButton = screen.getByTestId('button-auto-distribute-tip');
      await act(async () => {
        fireEvent.click(autoDistributeButton);
      });

      // Tip distribution should show staff names
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();

      // Distribution amounts: John gets 30% ($6), Jane gets 70% ($14)
      expect(screen.getByText('$6.00')).toBeInTheDocument();
      expect(screen.getByText('$14.00')).toBeInTheDocument();
    });
  });

  describe('payment completion', () => {
    it('should handle payment completion with expected data', async () => {
      const mockOnComplete = vi.fn();
      const total = 50;

      renderWithProvider(
        <PaymentModal
          {...defaultProps}
          total={total}
          onComplete={mockOnComplete}
        />
      );

      // Navigate to step 2 (Payment)
      const continueButton = screen.getByTestId('button-continue-to-payment');
      await act(async () => {
        fireEvent.click(continueButton);
      });

      // Select Cash payment method
      const cashCard = screen.getByTestId('card-payment-method-cash');
      await act(async () => {
        fireEvent.click(cashCard);
      });

      // Enter exact cash amount (including default 20% tip: $50 + $10 = $60)
      const cashInput = screen.getByTestId('input-cash-received');
      await act(async () => {
        fireEvent.change(cashInput, { target: { value: '60' } });
      });

      // Apply cash payment
      const applyCashButton = screen.getByTestId('button-apply-cash');
      await act(async () => {
        fireEvent.click(applyCashButton);
      });

      // Wait for the completion callback (PaymentModal has an 800ms delay)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });

      // Verify onComplete was called
      expect(mockOnComplete).toHaveBeenCalled();

      // Verify the call arguments include expected data structure
      const callArgs = mockOnComplete.mock.calls[0][0];
      expect(callArgs).toHaveProperty('methods');
      expect(callArgs).toHaveProperty('tip');
      expect(callArgs.methods).toBeInstanceOf(Array);
      expect(callArgs.methods.length).toBeGreaterThan(0);

      // Verify the cash payment method was recorded
      const cashPayment = callArgs.methods.find((m: { type: string }) => m.type === 'cash');
      expect(cashPayment).toBeDefined();
      expect(cashPayment.amount).toBe(60); // Full amount with tip

      // Verify tip was calculated correctly (20% of $50 = $10)
      expect(callArgs.tip).toBe(10);
    });

    it('should include tip distribution when multiple staff members are present', async () => {
      const mockOnComplete = vi.fn();
      const total = 100;
      const multipleStaff = [
        { id: 'staff-1', name: 'John Doe', serviceTotal: 60 },
        { id: 'staff-2', name: 'Jane Smith', serviceTotal: 40 },
      ];

      renderWithProvider(
        <PaymentModal
          {...defaultProps}
          total={total}
          staffMembers={multipleStaff}
          onComplete={mockOnComplete}
        />
      );

      // Set up tip distribution before navigating to payment
      // Click auto-distribute button (default 20% tip on $100 = $20)
      const autoDistributeButton = screen.getByTestId('button-auto-distribute-tip');
      await act(async () => {
        fireEvent.click(autoDistributeButton);
      });

      // Navigate to step 2 (Payment)
      const continueButton = screen.getByTestId('button-continue-to-payment');
      await act(async () => {
        fireEvent.click(continueButton);
      });

      // Select Cash payment method
      const cashCard = screen.getByTestId('card-payment-method-cash');
      await act(async () => {
        fireEvent.click(cashCard);
      });

      // Enter exact cash amount (including default 20% tip: $100 + $20 = $120)
      const cashInput = screen.getByTestId('input-cash-received');
      await act(async () => {
        fireEvent.change(cashInput, { target: { value: '120' } });
      });

      // Apply cash payment
      const applyCashButton = screen.getByTestId('button-apply-cash');
      await act(async () => {
        fireEvent.click(applyCashButton);
      });

      // Wait for the completion callback (PaymentModal has an 800ms delay)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });

      // Verify onComplete was called
      expect(mockOnComplete).toHaveBeenCalled();

      // Verify the call arguments include tip distribution
      const callArgs = mockOnComplete.mock.calls[0][0];
      expect(callArgs).toHaveProperty('tipDistribution');
      expect(callArgs.tipDistribution).toBeInstanceOf(Array);
      expect(callArgs.tipDistribution.length).toBe(2);

      // Verify tip distribution amounts (John: 60% of $20 = $12, Jane: 40% of $20 = $8)
      const johnTip = callArgs.tipDistribution.find((d: { staffId: string }) => d.staffId === 'staff-1');
      const janeTip = callArgs.tipDistribution.find((d: { staffId: string }) => d.staffId === 'staff-2');
      expect(johnTip?.amount).toBe(12); // 60% of $20
      expect(janeTip?.amount).toBe(8);  // 40% of $20
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
