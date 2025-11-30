import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Camera, Check, AlertCircle } from 'lucide-react';
import { PaymentMethod } from '../../types/common';
import { PaymentDetails } from '../../types/transaction';
import { PendingTicket } from '../../types/Ticket';
import { MobileSheet, MobileSheetContent, MobileSheetFooter, MobileSheetButton } from '../layout/MobileSheet';
import { useBreakpoint } from '../../hooks/useMobileModal';
import { haptics } from '../../utils/haptics';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: PendingTicket;
  onConfirm: (paymentMethod: PaymentMethod, paymentDetails: PaymentDetails, tip: number) => Promise<void>;
}

export function PaymentModal({ isOpen, onClose, ticket, onConfirm }: PaymentModalProps) {
  const { isMobile } = useBreakpoint();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [tipAmount, setTipAmount] = useState(ticket.tip || 0);
  const [tipPercent, setTipPercent] = useState(0);

  // Card payment fields
  const [cardLast4, setCardLast4] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [authCode, setAuthCode] = useState('');

  // Cash payment fields
  const [amountTendered, setAmountTendered] = useState(0);

  // Venmo payment fields
  const [venmoHandle, setVenmoHandle] = useState('');
  const [venmoTransactionId, setVenmoTransactionId] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = ticket.subtotal || 0;
  const tax = ticket.tax || 0;
  const tipValue = tipAmount || (subtotal * tipPercent / 100);
  const total = subtotal + tax + tipValue;
  const changeDue = paymentMethod === 'cash' ? Math.max(0, amountTendered - total) : 0;

  // Reset amount tendered when payment method or total changes
  useEffect(() => {
    if (paymentMethod === 'cash') {
      setAmountTendered(Math.ceil(total));
    }
  }, [paymentMethod, total]);

  // Reset error when user changes inputs
  useEffect(() => {
    setError(null);
  }, [paymentMethod, cardLast4, amountTendered, venmoHandle]);

  const handleTipPercentClick = (percent: number) => {
    haptics.selection();
    setTipPercent(percent);
    setTipAmount(0);
  };

  const handleTipAmountChange = (amount: number) => {
    setTipAmount(amount);
    setTipPercent(0);
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    haptics.light();
    setPaymentMethod(method);
  };

  const validatePayment = (): string | null => {
    if (paymentMethod === 'card') {
      if (!cardLast4 || cardLast4.length !== 4 || !/^\d{4}$/.test(cardLast4)) {
        return 'Please enter the last 4 digits of the card';
      }
    } else if (paymentMethod === 'cash') {
      if (amountTendered < total) {
        return `Amount tendered must be at least $${total.toFixed(2)}`;
      }
    } else if (paymentMethod === 'venmo') {
      if (!venmoHandle || !venmoTransactionId) {
        return 'Please enter Venmo handle and transaction ID';
      }
    }
    return null;
  };

  const handleConfirm = async () => {
    const validationError = validatePayment();
    if (validationError) {
      haptics.error();
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const paymentDetails: PaymentDetails = {};

      if (paymentMethod === 'card') {
        paymentDetails.cardLast4 = cardLast4;
        paymentDetails.cardBrand = cardBrand || 'Unknown';
        paymentDetails.authCode = authCode || `AUTH-${Date.now()}`;
        paymentDetails.processor = 'Square';
      } else if (paymentMethod === 'cash') {
        paymentDetails.amountTendered = amountTendered;
        paymentDetails.changeDue = changeDue;
      } else if (paymentMethod === 'venmo') {
        paymentDetails.accountHandle = venmoHandle;
        paymentDetails.transactionId = venmoTransactionId;
      }

      paymentDetails.receiptNumber = `R-${Date.now()}`;

      await onConfirm(paymentMethod, paymentDetails, tipValue);
      haptics.success();
      onClose();
    } catch (err) {
      haptics.error();
      setError(err instanceof Error ? err.message : 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Payment method button component with better touch targets
  const PaymentMethodButton = ({
    method,
    icon: Icon,
    label,
    activeColor,
  }: {
    method: PaymentMethod;
    icon: typeof CreditCard;
    label: string;
    activeColor: string;
  }) => {
    const isActive = paymentMethod === method;
    const colorClasses: Record<string, { border: string; bg: string; text: string }> = {
      blue: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
      green: { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-600' },
      sky: { border: 'border-sky-500', bg: 'bg-sky-50', text: 'text-sky-600' },
    };
    const colors = colorClasses[activeColor];

    return (
      <button
        onClick={() => handlePaymentMethodChange(method)}
        className={`
          flex-1 p-4 rounded-xl border-2 transition-all
          min-h-[80px] flex flex-col items-center justify-center gap-2
          active:scale-95
          ${isActive ? `${colors.border} ${colors.bg}` : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'}
        `}
      >
        <Icon size={28} className={isActive ? colors.text : 'text-gray-400'} />
        <div className={`text-sm font-semibold ${isActive ? colors.text : 'text-gray-600'}`}>
          {label}
        </div>
      </button>
    );
  };

  // Tip percentage button with better touch targets
  const TipButton = ({ percent }: { percent: number }) => {
    const isActive = tipPercent === percent;
    return (
      <button
        onClick={() => handleTipPercentClick(percent)}
        className={`
          flex-1 py-3 rounded-xl border-2 transition-all font-semibold
          min-h-[48px] active:scale-95
          ${isActive
            ? 'border-amber-500 bg-amber-50 text-amber-700'
            : 'border-gray-200 hover:border-gray-300 text-gray-700 active:bg-gray-50'
          }
        `}
      >
        {percent}%
      </button>
    );
  };

  const footer = (
    <MobileSheetFooter stacked={isMobile}>
      <MobileSheetButton
        variant="secondary"
        onClick={onClose}
        disabled={isProcessing}
        fullWidth={isMobile}
      >
        Cancel
      </MobileSheetButton>
      <MobileSheetButton
        variant="primary"
        onClick={handleConfirm}
        disabled={isProcessing}
        loading={isProcessing}
        fullWidth
        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
      >
        {isProcessing ? 'Processing...' : (
          <>
            <Check size={20} />
            Confirm Payment
          </>
        )}
      </MobileSheetButton>
    </MobileSheetFooter>
  );

  return (
    <MobileSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Process Payment"
      subtitle={`Ticket #${ticket.number} • ${ticket.clientName}`}
      footer={footer}
      fullScreenOnMobile={true}
    >
      <MobileSheetContent className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Service Info */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-sm text-gray-600 mb-1">Service</div>
          <div className="font-semibold text-gray-900">
            {ticket.service}
            {ticket.additionalServices > 0 && (
              <span className="text-sm text-gray-500 ml-2">
                +{ticket.additionalServices} more
              </span>
            )}
          </div>
          {ticket.technician && (
            <div className="text-sm text-gray-600 mt-1">with {ticket.technician}</div>
          )}
        </div>

        {/* Payment Method Selection - Touch-optimized */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="flex gap-3">
            <PaymentMethodButton method="card" icon={CreditCard} label="Card" activeColor="blue" />
            <PaymentMethodButton method="cash" icon={DollarSign} label="Cash" activeColor="green" />
            <PaymentMethodButton method="venmo" icon={Camera} label="Venmo" activeColor="sky" />
          </div>
        </div>

        {/* Payment Method Specific Fields */}
        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Last 4 Digits *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                value={cardLast4}
                onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Brand
                </label>
                <select
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ fontSize: '16px' }}
                >
                  <option value="">Select...</option>
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="Amex">American Express</option>
                  <option value="Discover">Discover</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auth Code
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'cash' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Tendered
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={total}
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
            {changeDue > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="text-sm text-green-700">Change Due</div>
                <div className="text-3xl font-bold text-green-900">${changeDue.toFixed(2)}</div>
              </div>
            )}
          </div>
        )}

        {paymentMethod === 'venmo' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venmo Handle *
              </label>
              <input
                type="text"
                placeholder="@username"
                value={venmoHandle}
                onChange={(e) => setVenmoHandle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction ID *
              </label>
              <input
                type="text"
                placeholder="Venmo transaction ID"
                value={venmoTransactionId}
                onChange={(e) => setVenmoTransactionId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        )}

        {/* Tip Adjustment - Touch-optimized */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Adjust Tip
          </label>
          {/* Mobile: 3 buttons per row, Desktop: all in one row */}
          <div className={`grid gap-2 mb-3 ${isMobile ? 'grid-cols-3' : 'grid-cols-5'}`}>
            {[0, 15, 18, 20, 25].map((percent) => (
              <TipButton key={percent} percent={percent} />
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="Custom amount"
              value={tipAmount || ''}
              onChange={(e) => handleTipAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* Amount Breakdown */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-mono">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tip</span>
            <span className="font-mono">${tipValue.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-300 pt-3 mt-3">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-2xl font-mono">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </MobileSheetContent>
    </MobileSheet>
  );
}
